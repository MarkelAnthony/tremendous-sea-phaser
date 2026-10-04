import type { LoadedMap, Rectangle, TerrainMapJson } from "../pixellab/types";
import { terrainCellForPhaserWorld } from "../pixellab/coordinates";
import { rectsNear } from "../pixellab/spatialIndex";

const MAX_MOVEMENT_STEP_PX = 1;

export interface Collider {
  width: number;
  height: number;
  footOffsetY: number;
}

export function bodyRect(centerX: number, centerY: number, collider: Collider): Rectangle {
  return {
    x: centerX - collider.width / 2,
    y: centerY + collider.footOffsetY - collider.height / 2,
    width: collider.width,
    height: collider.height,
  };
}

export function intersectsRect(a: Rectangle, b: Rectangle): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function isPositionClear(mapData: LoadedMap, centerX: number, centerY: number, collider: Collider): boolean {
  const footX = centerX;
  const footY = centerY + collider.footOffsetY;
  const rect = bodyRect(centerX, centerY, collider);
  if (rectsNear(mapData.objectBlockerIndex, rect).some((blocker) => intersectsRect(rect, blocker))) {
    return false;
  }
  const terrainWalkable = isTerrainWalkable(mapData, footX, footY);
  return isAuthoredCollisionWalkable(mapData, footX, footY, terrainWalkable);
}

export function moveWithCollision(
  mapData: LoadedMap,
  currentX: number,
  currentY: number,
  deltaX: number,
  deltaY: number,
  collider: Collider,
): { x: number; y: number } {
  const stepCount = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY)) / MAX_MOVEMENT_STEP_PX),
  );
  const stepX = deltaX / stepCount;
  const stepY = deltaY / stepCount;
  let x = currentX;
  let y = currentY;

  for (let step = 0; step < stepCount; step += 1) {
    const moved = moveSingleStepWithCollision(mapData, x, y, stepX, stepY, collider);
    if (moved.x === x && moved.y === y) {
      break;
    }
    x = moved.x;
    y = moved.y;
  }

  return { x, y };
}

function moveSingleStepWithCollision(
  mapData: LoadedMap,
  currentX: number,
  currentY: number,
  deltaX: number,
  deltaY: number,
  collider: Collider,
): { x: number; y: number } {
  const nextX = currentX + deltaX;
  const nextY = currentY + deltaY;
  if (isPositionClear(mapData, nextX, nextY, collider)) {
    return { x: nextX, y: nextY };
  }

  if (deltaX !== 0 && isPositionClear(mapData, nextX, currentY, collider)) {
    return { x: nextX, y: currentY };
  }

  if (deltaY !== 0 && isPositionClear(mapData, currentX, nextY, collider)) {
    return { x: currentX, y: nextY };
  }

  return { x: currentX, y: currentY };
}

function isTerrainWalkable(mapData: LoadedMap, worldX: number, worldY: number): boolean {
  const terrainMap = mapData.terrainMap;
  const walkableTerrainIds = mapData.walkableTerrainIds;

  const tileSize = mapData.map.mapConfig.tileSize;
  const tileX = terrainCellForPhaserWorld(worldX, tileSize);
  const tileY = terrainCellForPhaserWorld(worldY, tileSize);
  const corners = [
    terrainIdAt(terrainMap, tileX - 1, tileY - 1),
    terrainIdAt(terrainMap, tileX, tileY - 1),
    terrainIdAt(terrainMap, tileX - 1, tileY),
    terrainIdAt(terrainMap, tileX, tileY),
  ];
  return corners.every((terrainId) => walkableTerrainIds.has(terrainId));
}

function terrainIdAt(terrainMap: TerrainMapJson, x: number, y: number): number {
  const key = `${x},${y}`;
  return terrainMap.cellIndex.get(key) ?? terrainMap.defaultTerrain;
}

function isAuthoredCollisionWalkable(
  mapData: LoadedMap,
  x: number,
  y: number,
  terrainWalkable: boolean,
): boolean {
  const pointRect = { x, y, width: 1, height: 1 };
  let walkable = mapData.hasAllowCollisionRects && !mapData.hasTerrainCollisionSources ? false : terrainWalkable;
  for (const rect of rectsNear(mapData.collisionRectIndex, pointRect)) {
    if (pointInsideRect(x, y, rect)) {
      walkable = rect.mode === "allow";
    }
  }
  return walkable;
}

function pointInsideRect(x: number, y: number, rect: Rectangle): boolean {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}
