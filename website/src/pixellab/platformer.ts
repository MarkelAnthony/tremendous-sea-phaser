/**
 * Platformer collision built from the PixelLab map export.
 *
 * Solidity comes from painted terrain: every painted terrain cell is a solid
 * tile (world rect [(tx-0.5)*ts, (ty-0.5)*ts, ts, ts] in the dual-grid system).
 * Annotation layers refine behavior by name/tags:
 *   - "one-way" / "platform": solid only when landing from above
 *   - "hazard" / "spikes" / "lava": kills the player on overlap
 *   - "goal" / "exit" / "finish": level-complete trigger on overlap
 *
 * Keep collision semantics centralized here — do not duplicate tile checks in
 * scenes or the player controller.
 */
import type { AnnotationLayer, LoadedMap, Rectangle } from "./types";
import { rectsNear } from "./spatialIndex";

const ONE_WAY_LABELS = /\b(one[- ]?way|platform)\b/;
const HAZARD_LABELS = /\b(hazard|spike|spikes|lava|damage|kill)\b/;
const GOAL_LABELS = /\b(goal|exit|finish|flag|win)\b/;

export interface PlatformerBody {
  /** Feet-center world position. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
}

export interface PlatformerWorld {
  mapData: LoadedMap;
  oneWayRects: Rectangle[];
  hazardRects: Rectangle[];
  goalRects: Rectangle[];
  /** Painted cells that sit inside a one-way rect are not fully solid. */
  oneWayCellKeys: Set<string>;
}

function layerMatches(layer: AnnotationLayer, pattern: RegExp): boolean {
  const haystack = [layer.name ?? "", ...(layer.tags ?? [])].join(" ").toLowerCase();
  return pattern.test(haystack);
}

function layerRects(layers: AnnotationLayer[], pattern: RegExp): Rectangle[] {
  return layers
    .filter((layer) => layerMatches(layer, pattern))
    .flatMap((layer) => layer.rects ?? []);
}

export function createPlatformerWorld(mapData: LoadedMap): PlatformerWorld {
  const layers = mapData.annotations.layers ?? [];
  const oneWayRects = layerRects(layers, ONE_WAY_LABELS);
  const hazardRects = layerRects(layers, HAZARD_LABELS);
  const goalRects = layerRects(layers, GOAL_LABELS);

  const tileSize = mapData.map.mapConfig.tileSize;
  const oneWayCellKeys = new Set<string>();
  let minTx = Infinity, maxTx = -Infinity, maxTy = -Infinity;
  for (const key of mapData.terrainMap.cellIndex.keys()) {
    const [txRaw, tyRaw] = key.split(",");
    const tx = Number(txRaw);
    const ty = Number(tyRaw);
    if (tx < minTx) minTx = tx;
    if (tx > maxTx) maxTx = tx;
    if (ty > maxTy) maxTy = ty;
    const cx = tx * tileSize;
    const cy = ty * tileSize;
    if (oneWayRects.some((rect) => pointInRect(cx, cy, rect))) {
      oneWayCellKeys.add(key);
    }
  }

  // Bottom-of-world kill zone: a wide hazard rect 3 tiles below the lowest
  // terrain cell. Prevents infinite falling when the map has no explicit
  // hazard annotation at the bottom.
  if (maxTy > -Infinity) {
    const killY = (maxTy + 3) * tileSize;
    const killX = (minTx - 10) * tileSize;
    const killW = (maxTx - minTx + 20) * tileSize;
    hazardRects.push({ x: killX, y: killY, width: killW, height: tileSize * 5 });
  }

  return { mapData, oneWayRects, hazardRects, goalRects, oneWayCellKeys };
}

function pointInRect(x: number, y: number, rect: Rectangle): boolean {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

function isSolidCell(world: PlatformerWorld, tx: number, ty: number): boolean {
  const key = `${tx},${ty}`;
  return world.mapData.terrainMap.cellIndex.has(key) && !world.oneWayCellKeys.has(key);
}

/** World-pixel rect covered by the painted terrain dot (tx, ty). */
function cellRect(world: PlatformerWorld, tx: number, ty: number): Rectangle {
  const ts = world.mapData.map.mapConfig.tileSize;
  return { x: (tx - 0.5) * ts, y: (ty - 0.5) * ts, width: ts, height: ts };
}

function solidRectsOverlapping(world: PlatformerWorld, rect: Rectangle): Rectangle[] {
  const ts = world.mapData.map.mapConfig.tileSize;
  const minTx = Math.floor(rect.x / ts + 0.5);
  const maxTx = Math.floor((rect.x + rect.width) / ts + 0.5);
  const minTy = Math.floor(rect.y / ts + 0.5);
  const maxTy = Math.floor((rect.y + rect.height) / ts + 0.5);
  const rects: Rectangle[] = [];
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (isSolidCell(world, tx, ty)) {
        rects.push(cellRect(world, tx, ty));
      }
    }
  }
  for (const blocker of rectsNear(world.mapData.objectBlockerIndex, rect)) {
    if (rectsOverlap(rect, blocker)) {
      rects.push(blocker);
    }
  }
  return rects;
}

function bodyRect(body: PlatformerBody, width: number, height: number): Rectangle {
  return { x: body.x - width / 2, y: body.y - height, width, height };
}

function rectsOverlap(a: Rectangle, b: Rectangle): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function overlapsAny(body: PlatformerBody, width: number, height: number, rects: Rectangle[]): boolean {
  const rect = bodyRect(body, width, height);
  return rects.some((candidate) => rectsOverlap(rect, candidate));
}

/**
 * Integrate platformer movement with axis-separated collision. Mutates and
 * returns `body`. `width`/`height` describe the feet-anchored collision box
 * (x is its horizontal center, y its bottom edge).
 *
 * Large frames (tab throttling, load hitches) are split into <=16ms substeps
 * so a fast fall can never tunnel through a tile row.
 */
export function stepPlatformerBody(
  world: PlatformerWorld,
  body: PlatformerBody,
  width: number,
  height: number,
  dtSeconds: number,
  gravityY: number,
  maxFallSpeed: number,
  surfaceInsetPx = 0,
): PlatformerBody {
  const MAX_SUBSTEP = 1 / 60;
  let remaining = dtSeconds;
  while (remaining > 1e-9) {
    const step = Math.min(remaining, MAX_SUBSTEP);
    stepOnce(world, body, width, height, step, gravityY, maxFallSpeed, surfaceInsetPx);
    remaining -= step;
  }
  return body;
}

function stepOnce(
  world: PlatformerWorld,
  body: PlatformerBody,
  width: number,
  height: number,
  dtSeconds: number,
  gravityY: number,
  maxFallSpeed: number,
  surfaceInsetPx: number,
): PlatformerBody {
  // Horizontal sweep. The bottom surfaceInsetPx of the body is excluded: feet
  // stand that deep inside the floor's top tile (grass-lip inset), which must
  // not read as a wall. Real walls extend above the foot line and still block.
  const dx = body.vx * dtSeconds;
  if (dx !== 0) {
    body.x += dx;
    const wallHeight = height - surfaceInsetPx - 1;
    const rect = { x: body.x - width / 2, y: body.y - height, width, height: wallHeight };
    for (const solid of solidRectsOverlapping(world, rect)) {
      if (!rectsOverlap(rect, solid)) continue;
      if (dx > 0) {
        body.x = solid.x - width / 2;
      } else {
        body.x = solid.x + solid.width + width / 2;
      }
      body.vx = 0;
      rect.x = body.x - width / 2;
    }
  }

  // Vertical sweep
  body.vy = Math.min(body.vy + gravityY * dtSeconds, maxFallSpeed);
  const prevFeetY = body.y;
  const dy = body.vy * dtSeconds;
  body.y += dy;
  body.grounded = false;

  const rect = bodyRect(body, width, height);
  if (dy > 0) {
    // Falling: land on solid tiles and on one-way surfaces crossed this step.
    // Feet settle surfaceInsetPx into the tile (its top edge is grass-lip art).
    for (const solid of solidRectsOverlapping(world, rect)) {
      const surfaceY = solid.y + surfaceInsetPx;
      if (rectsOverlap(rect, solid) && prevFeetY <= surfaceY + 0.01 && body.y >= surfaceY) {
        body.y = surfaceY;
        body.vy = 0;
        body.grounded = true;
        rect.y = body.y - height;
      }
    }
    for (const oneWay of world.oneWayRects) {
      const top = oneWay.y;
      const horizontallyOver = body.x + width / 2 > oneWay.x && body.x - width / 2 < oneWay.x + oneWay.width;
      if (horizontallyOver && prevFeetY <= top + 0.01 && body.y >= top) {
        body.y = top;
        body.vy = 0;
        body.grounded = true;
      }
    }
  } else if (dy < 0) {
    // Rising: bump head on solid tiles only (one-way never blocks from below).
    for (const solid of solidRectsOverlapping(world, rect)) {
      if (rectsOverlap(rect, solid) && prevFeetY - height >= solid.y + solid.height - 0.01) {
        body.y = solid.y + solid.height + height;
        body.vy = 0;
      }
    }
  } else {
    // Standing check so walking off a ledge starts falling next frame.
    const probe = { ...rect, y: rect.y + 1 };
    body.grounded =
      solidRectsOverlapping(world, probe).some((solid) => rectsOverlap(probe, solid) && prevFeetY <= solid.y + surfaceInsetPx + 0.01)
      || world.oneWayRects.some((oneWay) => {
        const horizontallyOver = body.x + width / 2 > oneWay.x && body.x - width / 2 < oneWay.x + oneWay.width;
        return horizontallyOver && Math.abs(body.y - oneWay.y) < 1;
      });
  }

  return body;
}
