import Phaser from "phaser";
import { assetUrl } from "./templateAssetPaths";
import type { LoadedMap, MapJson, TerrainMapJson, TerrainPattern } from "./types";

const WANG_TO_ATLAS = [6, 7, 10, 9, 2, 11, 4, 15, 5, 14, 1, 8, 3, 0, 13, 12] as const;
export const TERRAIN_DEPTH = -100000;
const WILDCARD = 255;

export interface TerrainRenderStats {
  rendered: number;
  gameObjects: Phaser.GameObjects.GameObject[];
}

interface TransitionPattern {
  atlasIndex: number;
  pattern: TerrainPattern;
}

interface TransitionSpec {
  lowerTerrainId: number;
  upperTerrainId: number;
  transitionTerrainId: number;
  key: string;
  patterns: TransitionPattern[];
}

interface TilesetLookups {
  standard: Map<string, string>;
  transition: Map<number, TransitionSpec>;
}

export function preloadTerrainTilesets(scene: Phaser.Scene, mapData: LoadedMap): void {
  const map = mapData.map;
  for (const tileset of map.tilesets ?? []) {
    const tileSize = tileset.tileSize ?? map.mapConfig.tileSize;
    const key = tilesetKey(mapData.folder, tileset.filename);
    if (scene.textures.exists(key)) {
      continue;
    }
    scene.load.spritesheet(
      key,
      assetUrl("maps", mapData.folder, "tilesets", tileset.filename),
      { frameWidth: tileSize, frameHeight: tileSize },
    );
  }
}

export function renderTerrainTiles(scene: Phaser.Scene, mapData: LoadedMap): TerrainRenderStats {
  const stats: TerrainRenderStats = {
    rendered: 0,
    gameObjects: [],
  };
  const map = mapData.map;
  const tileSize = map.mapConfig.tileSize;
  const bounds = map.mapConfig.boundingBox;
  const maxTileX = bounds.minX + map.mapConfig.dimensions.width - 1;
  const maxTileY = bounds.minY + map.mapConfig.dimensions.height - 1;
  const terrain = buildTerrainGrid(map, mapData.terrainMap);
  const lookups = buildTilesetLookups(mapData);

  for (let tileY = bounds.minY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = bounds.minX; tileX <= maxTileX; tileX += 1) {
      const corners = tileCorners(terrain, tileX, tileY);
      const uniqueTerrains = uniqueSorted(corners);
      if (corners.some((terrainId) => terrainId === 0)) {
        // Empty (air) corners. Sidescroller tilesets pair their solid terrain
        // with "upper" id 0 (transparent air side), so terrain↔air boundary
        // tiles — the platform edges and grass lips — render through the
        // normal Wang pair below. Without such a pair (top-down maps at the
        // bounding-box edge), skip the tile like before.
        const solidTerrains = uniqueTerrains.filter((terrainId) => terrainId !== 0);
        const rendersAgainstAir =
          solidTerrains.length === 1
          && tilesetForPair(lookups.standard, 0, solidTerrains[0]) !== null;
        if (!rendersAgainstAir) {
          continue;
        }
      }
      const renderedBeforeTile = stats.rendered;
      // Match Map Editor dual-grid rendering. A rendered tile at (x, y)
      // samples terrain cells around that point and is centered on x/y.
      const x = tileX * tileSize;
      const y = tileY * tileSize;

      const transitionSpec = findTransitionTilesetForTile(uniqueTerrains, lookups);
      if (transitionSpec) {
        const atlasIndex = findTransitionAtlasIndex(terrain, tileX, tileY, transitionSpec);
        if (atlasIndex !== null) {
          addTile(scene, transitionSpec.key, atlasIndex, x, y, TERRAIN_DEPTH, stats);
          continue;
        }
      }

      let depth = TERRAIN_DEPTH;
      for (let index = 0; index < uniqueTerrains.length - 1; index += 1) {
        const first = uniqueTerrains[index];
        const second = uniqueTerrains[index + 1];
        const pair = tilesetForPair(lookups.standard, first, second);
        if (!pair) {
          continue;
        }
        const wangIndex = wangIndexForPair(corners, pair.lowerTerrainId, pair.upperTerrainId);
        addTile(scene, pair.key, WANG_TO_ATLAS[wangIndex], x, y, depth, stats);
        depth += 0.01;
      }

      if (uniqueTerrains.length === 1) {
        renderSingleTerrain(scene, lookups, map, uniqueTerrains[0], x, y, depth, tileSize, stats);
      }

      if (stats.rendered === renderedBeforeTile) {
        throw new Error(`No tileset can render terrains ${uniqueTerrains.join(",")} at tile ${tileX},${tileY}`);
      }
    }
  }
  return stats;
}

function buildTerrainGrid(map: MapJson, terrainMap: TerrainMapJson): Map<string, number> {
  const terrain = new Map<string, number>();
  const maxVertexX = map.mapConfig.boundingBox.minX + map.mapConfig.dimensions.width;
  const maxVertexY = map.mapConfig.boundingBox.minY + map.mapConfig.dimensions.height;
  for (let y = map.mapConfig.boundingBox.minY; y <= maxVertexY; y += 1) {
    for (let x = map.mapConfig.boundingBox.minX; x <= maxVertexX; x += 1) {
      terrain.set(terrainKey(x, y), terrainMap.defaultTerrain);
    }
  }

  for (const cell of terrainMap.cells) {
    terrain.set(terrainKey(cell.x, cell.y), cell.terrainId);
  }
  applyTransitionTerrains(terrain, map);
  return terrain;
}

function buildTilesetLookups(mapData: LoadedMap): TilesetLookups {
  const map = mapData.map;
  const transitionTerrainIds = resolveTransitionTerrainIds(map);
  const standard = new Map<string, string>();
  const transition = new Map<number, TransitionSpec>();

  for (const tileset of map.tilesets ?? []) {
    if ((tileset.transitionSize ?? 0) >= 1) {
      const transitionTerrainId = transitionTerrainIds.get(tileset.id);
      if (transitionTerrainId === undefined) {
        continue;
      }
      transition.set(transitionTerrainId, {
        lowerTerrainId: tileset.lowerTerrainId,
        upperTerrainId: tileset.upperTerrainId,
        transitionTerrainId,
        key: tilesetKey(mapData.folder, tileset.filename),
        patterns: (tileset.transitionMatcherTiles ?? defaultTransitionPatterns()).map((pattern) => ({
          atlasIndex: pattern.atlasIndex,
          pattern: pattern.pattern,
        })).sort((a, b) => countWildcards(a.pattern) - countWildcards(b.pattern)),
      });
      continue;
    }

    standard.set(pairKey(tileset.lowerTerrainId, tileset.upperTerrainId), tilesetKey(mapData.folder, tileset.filename));
  }

  return { standard, transition };
}

function resolveTransitionTerrainIds(map: MapJson): Map<string, number> {
  const transitionTerrainIds = new Map<string, number>();
  for (const terrain of map.terrains ?? []) {
    const tilesetId = terrain.baseTileId?.startsWith("transition-")
      ? terrain.baseTileId.slice("transition-".length)
      : null;
    if (tilesetId) {
      transitionTerrainIds.set(tilesetId, terrain.id);
    }
  }
  return transitionTerrainIds;
}

function applyTransitionTerrains(terrain: Map<string, number>, map: MapJson): void {
  const transitionTerrainIds = resolveTransitionTerrainIds(map);
  const transitionIds = new Set(transitionTerrainIds.values());
  if ([...terrain.values()].some((terrainId) => transitionIds.has(terrainId))) {
    return;
  }

  const specs = (map.tilesets ?? [])
    .filter((tileset) => (tileset.transitionSize ?? 0) >= 1)
    .flatMap((tileset) => {
      const transitionTerrainId = transitionTerrainIds.get(tileset.id);
      if (transitionTerrainId === undefined) {
        return [];
      }
      return [{
        lowerTerrainId: tileset.lowerTerrainId,
        upperTerrainId: tileset.upperTerrainId,
        transitionTerrainId,
      }];
    });

  const insertions: Array<{ x: number; y: number; terrainId: number }> = [];
  const bounds = map.mapConfig.boundingBox;
  const maxVertexX = bounds.minX + map.mapConfig.dimensions.width;
  const maxVertexY = bounds.minY + map.mapConfig.dimensions.height;

  for (let y = bounds.minY; y <= maxVertexY; y += 1) {
    for (let x = bounds.minX; x <= maxVertexX; x += 1) {
      const currentTerrain = terrain.get(terrainKey(x, y)) ?? 0;
      if (currentTerrain === 0) {
        continue;
      }

      const belowY = y + 1;
      const belowTerrain = terrain.get(terrainKey(x, belowY)) ?? 0;
      if (belowTerrain === 0 || belowTerrain === currentTerrain) {
        continue;
      }

      for (const spec of specs) {
        if (currentTerrain !== spec.upperTerrainId || belowTerrain !== spec.lowerTerrainId) {
          continue;
        }

        const aboveTerrain = terrain.get(terrainKey(x, y - 1)) ?? 0;
        if (aboveTerrain === spec.upperTerrainId) {
          insertions.push({ x, y, terrainId: spec.transitionTerrainId });
          break;
        }

        const belowBelowTerrain = terrain.get(terrainKey(x, belowY + 1)) ?? 0;
        if (belowBelowTerrain === spec.lowerTerrainId) {
          insertions.push({ x, y: belowY, terrainId: spec.transitionTerrainId });
          break;
        }
      }
    }
  }

  for (const insertion of insertions) {
    terrain.set(terrainKey(insertion.x, insertion.y), insertion.terrainId);
  }
}

function renderSingleTerrain(
  scene: Phaser.Scene,
  lookups: TilesetLookups,
  map: MapJson,
  terrainId: number,
  x: number,
  y: number,
  depth: number,
  tileSize: number,
  stats: TerrainRenderStats,
): void {
  const standard = tilesetForTerrain(lookups.standard, terrainId);
  if (standard) {
    addTile(scene, standard.key, WANG_TO_ATLAS[standard.isUpper ? 15 : 0], x, y, depth, stats);
    return;
  }

  const transitionFill = transitionFillTileset(lookups.transition, terrainId);
  if (transitionFill) {
    addTile(scene, transitionFill.key, transitionFill.atlasIndex, x, y, depth, stats);
    return;
  }

  throw new Error(`No tileset can render terrain ${terrainId} on map ${map.name} at ${x},${y} with tileSize ${tileSize}`);
}

function findTransitionTilesetForTile(terrainIds: number[], lookups: TilesetLookups): TransitionSpec | null {
  const transitionIds = terrainIds.filter((terrainId) => lookups.transition.has(terrainId));
  if (transitionIds.length === 1) {
    const spec = lookups.transition.get(transitionIds[0])!;
    return terrainIds.every((terrainId) => isInTransitionSpec(terrainId, spec)) ? spec : null;
  }

  const hasStandardMatch = terrainIds.length === 1
    ? tilesetForTerrain(lookups.standard, terrainIds[0]) !== null
    : terrainIds.length === 2 && tilesetForPair(lookups.standard, terrainIds[0], terrainIds[1]) !== null;
  if (hasStandardMatch) {
    return null;
  }

  const matches = [...lookups.transition.values()].filter((spec) => terrainIds.every((terrainId) => isInTransitionSpec(terrainId, spec)));
  return matches.length === 1 ? matches[0] : null;
}

function findTransitionAtlasIndex(
  terrain: Map<string, number>,
  tileX: number,
  tileY: number,
  spec: TransitionSpec,
): number | null {
  const requestPattern = sampleTransitionRequestPattern(terrain, tileX, tileY, spec);
  const centerKey = transitionCenterKey(requestPattern).join(",");
  const candidates = spec.patterns.filter((pattern) => transitionCenterKey(pattern.pattern).join(",") === centerKey);
  const exact = candidates.find((candidate) => transitionPatternsMatch(candidate.pattern, requestPattern));
  return exact?.atlasIndex ?? null;
}

function sampleTransitionRequestPattern(
  terrain: Map<string, number>,
  tileX: number,
  tileY: number,
  spec: TransitionSpec,
): TerrainPattern {
  return [
    [WILDCARD, encodeTransitionOuter(terrain, tileX - 1, tileY - 2, spec), encodeTransitionOuter(terrain, tileX, tileY - 2, spec), WILDCARD],
    [WILDCARD, encodeTransitionCenter(terrain, tileX - 1, tileY - 1, spec), encodeTransitionCenter(terrain, tileX, tileY - 1, spec), WILDCARD],
    [WILDCARD, encodeTransitionCenter(terrain, tileX - 1, tileY, spec), encodeTransitionCenter(terrain, tileX, tileY, spec), WILDCARD],
    [WILDCARD, encodeTransitionOuter(terrain, tileX - 1, tileY + 1, spec), encodeTransitionOuter(terrain, tileX, tileY + 1, spec), WILDCARD],
  ];
}

function encodeTransitionOuter(terrain: Map<string, number>, x: number, y: number, spec: TransitionSpec): number {
  const terrainId = terrain.get(terrainKey(x, y));
  if (terrainId === undefined || terrainId === 0) {
    return WILDCARD;
  }
  return encodeTransitionTerrain(terrainId, spec) ?? WILDCARD;
}

function encodeTransitionCenter(terrain: Map<string, number>, x: number, y: number, spec: TransitionSpec): number {
  const terrainId = terrain.get(terrainKey(x, y));
  if (terrainId === undefined) {
    return WILDCARD;
  }
  return encodeTransitionTerrain(terrainId, spec) ?? WILDCARD;
}

function encodeTransitionTerrain(terrainId: number, spec: TransitionSpec): number | null {
  if (terrainId === spec.lowerTerrainId) return 0;
  if (terrainId === spec.upperTerrainId) return 1;
  if (terrainId === spec.transitionTerrainId) return 2;
  return null;
}

function transitionPatternsMatch(candidate: TerrainPattern, request: TerrainPattern): boolean {
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      if (candidate[row][col] === WILDCARD || request[row][col] === WILDCARD) {
        continue;
      }
      if (candidate[row][col] !== request[row][col]) {
        return false;
      }
    }
  }
  return true;
}

function transitionCenterKey(pattern: TerrainPattern): number[] {
  return [pattern[1][1], pattern[1][2], pattern[2][1], pattern[2][2]];
}

function countWildcards(pattern: TerrainPattern): number {
  return pattern.flat().filter((value) => value === WILDCARD).length;
}

function transitionFillTileset(transition: Map<number, TransitionSpec>, terrainId: number): { key: string; atlasIndex: number } | null {
  for (const spec of transition.values()) {
    const terrainEncoding = terrainId === spec.lowerTerrainId ? 0 : terrainId === spec.upperTerrainId ? 1 : null;
    if (terrainEncoding === null) {
      continue;
    }
    const pattern = spec.patterns.find((candidate) => transitionCenterKey(candidate.pattern).every((value) => value === terrainEncoding));
    if (pattern) {
      return { key: spec.key, atlasIndex: pattern.atlasIndex };
    }
  }
  return null;
}

function tilesetForPair(standard: Map<string, string>, first: number, second: number): { lowerTerrainId: number; upperTerrainId: number; key: string } | null {
  const direct = standard.get(pairKey(first, second));
  if (direct) {
    return { lowerTerrainId: first, upperTerrainId: second, key: direct };
  }

  const reverse = standard.get(pairKey(second, first));
  if (reverse) {
    return { lowerTerrainId: second, upperTerrainId: first, key: reverse };
  }

  return null;
}

function tilesetForTerrain(standard: Map<string, string>, terrainId: number): { key: string; isUpper: boolean } | null {
  for (const [key, tilesetKeyValue] of standard.entries()) {
    const [lower, upper] = key.split(":").map(Number);
    if (upper === terrainId) {
      return { key: tilesetKeyValue, isUpper: true };
    }
    if (lower === terrainId) {
      return { key: tilesetKeyValue, isUpper: false };
    }
  }
  return null;
}

function wangIndexForPair(corners: number[], _lower: number, upper: number): number {
  const nw = corners[0] === upper ? 1 : 0;
  const ne = corners[1] === upper ? 1 : 0;
  const sw = corners[2] === upper ? 1 : 0;
  const se = corners[3] === upper ? 1 : 0;
  return nw * 8 + ne * 4 + sw * 2 + se;
}

function tileCorners(terrain: Map<string, number>, tileX: number, tileY: number): number[] {
  return [
    terrain.get(terrainKey(tileX - 1, tileY - 1)) ?? 0,
    terrain.get(terrainKey(tileX, tileY - 1)) ?? 0,
    terrain.get(terrainKey(tileX - 1, tileY)) ?? 0,
    terrain.get(terrainKey(tileX, tileY)) ?? 0,
  ];
}

function addTile(
  scene: Phaser.Scene,
  key: string,
  frame: number,
  x: number,
  y: number,
  depth: number,
  stats: TerrainRenderStats,
): void {
  if (!scene.textures.exists(key)) {
    throw new Error(`Missing preloaded terrain texture ${key}`);
  }
  const tile = scene.add.image(x, y, key, frame);
  tile.setDepth(depth);
  stats.gameObjects.push(tile);
  stats.rendered += 1;
}

function isInTransitionSpec(terrainId: number, spec: TransitionSpec): boolean {
  return terrainId === spec.lowerTerrainId || terrainId === spec.upperTerrainId || terrainId === spec.transitionTerrainId;
}

function pairKey(lowerTerrainId: number, upperTerrainId: number): string {
  return `${lowerTerrainId}:${upperTerrainId}`;
}

function terrainKey(x: number, y: number): string {
  return `${x},${y}`;
}

function tilesetKey(mapFolder: string, filename: string): string {
  return `tileset-${mapFolder}-${filename}`;
}

function uniqueSorted(corners: number[]): number[] {
  const a = corners[0];
  const b = corners[1];
  const c = corners[2];
  const d = corners[3];
  const result: number[] = [a];
  if (b !== a) result.push(b);
  if (c !== a && c !== b) result.push(c);
  if (d !== a && d !== b && d !== c) result.push(d);
  result.sort((x, y) => x - y);
  return result;
}

function defaultTransitionPatterns(): TransitionPattern[] {
  const patterns: TerrainPattern[] = [
    [[255,255,255,255],[255,1,1,255],[255,2,1,255],[255,0,255,255]],
    [[255,1,1,255],[255,1,0,255],[255,1,0,255],[255,255,255,255]],
    [[255,255,255,255],[255,0,1,255],[255,0,2,255],[255,0,0,255]],
    [[255,255,255,255],[255,1,1,255],[255,2,2,255],[255,0,0,255]],
    [[255,255,1,255],[255,2,1,255],[255,0,1,255],[255,255,255,255]],
    [[255,1,1,255],[255,1,0,255],[255,1,0,255],[255,255,255,255]],
    [[255,255,255,255],[255,0,2,255],[255,0,0,255],[255,255,255,255]],
    [[255,1,1,255],[255,2,2,255],[255,0,0,255],[255,255,255,255]],
    [[255,255,255,255],[255,0,1,255],[255,1,2,255],[255,1,0,255]],
    [[255,255,255,255],[255,1,0,255],[255,2,0,255],[255,0,0,255]],
    [[255,255,255,255],[255,0,0,255],[255,0,0,255],[255,255,255,255]],
    [[255,255,255,255],[255,0,0,255],[255,0,1,255],[255,255,255,255]],
    [[255,1,255,255],[255,1,2,255],[255,1,0,255],[255,255,255,255]],
    [[255,255,255,255],[255,2,0,255],[255,0,0,255],[255,255,255,255]],
    [[255,255,255,255],[255,0,0,255],[255,0,0,255],[255,255,255,255]],
    [[255,0,0,255],[255,0,1,255],[255,0,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,1,0,255],[255,1,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,0,0,255],[255,1,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,0,0,255],[255,1,0,255],[255,255,255,255]],
    [[255,0,0,255],[255,0,1,255],[255,0,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,1,1,255],[255,1,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,1,1,255],[255,1,1,255],[255,255,255,255]],
    [[255,1,1,255],[255,1,0,255],[255,1,0,255],[255,255,255,255]],
    [[255,0,0,255],[255,0,1,255],[255,0,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,1,1,255],[255,1,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,1,1,255],[255,1,2,255],[255,255,0,255]],
    [[255,255,255,255],[255,1,0,255],[255,2,1,255],[255,0,1,255]],
    [[255,255,255,255],[255,0,1,255],[255,1,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,1,1,255],[255,1,1,255],[255,255,255,255]],
    [[255,1,255,255],[255,1,2,255],[255,1,0,255],[255,255,255,255]],
    [[255,255,1,255],[255,2,1,255],[255,0,1,255],[255,255,255,255]],
    [[255,255,255,255],[255,1,1,255],[255,1,1,255],[255,255,255,255]],
  ];
  const aliases: TransitionPattern[] = [
    { atlasIndex: 15, pattern: [[255,255,255,255],[255,0,1,255],[255,0,1,255],[255,255,255,255]] },
    { atlasIndex: 1, pattern: [[255,255,255,255],[255,1,0,255],[255,1,0,255],[255,255,255,255]] },
    { atlasIndex: 4, pattern: [[255,1,0,255],[255,2,1,255],[255,0,1,255],[255,255,255,255]] },
    { atlasIndex: 12, pattern: [[255,0,1,255],[255,1,2,255],[255,1,0,255],[255,255,255,255]] },
  ];
  return [
    ...patterns.map((pattern, atlasIndex) => ({ atlasIndex, pattern })),
    ...aliases,
  ];
}
