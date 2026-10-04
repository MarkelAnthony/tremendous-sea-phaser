/**
 * Validates PixelLab asset folders before the Phaser build deploys them.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DEFAULT_ASSETS_DIR = join(import.meta.dirname, "..", "..", "assets");
const SRC_DIR = join(import.meta.dirname, "..", "src");
const TEMPLATE_ASSET_PATHS = join(
  import.meta.dirname,
  "..",
  "src",
  "pixellab",
  "templateAssetPaths.ts",
);
const assetsDir = process.argv[2] ?? DEFAULT_ASSETS_DIR;
const mapsDir = join(assetsDir, "maps");
const charactersDir = join(assetsDir, "characters");
const characterExportNames = [
  "PLAYER_CHARACTER_ID",
];
const VALID_DIRECTIONS = new Set([
  "south", "south-west", "west", "north-west",
  "north", "north-east", "east", "south-east",
]);
const MAX_TERRAIN_RENDER_ERRORS = 20;
const PHASER_RUNTIME_PATTERNS = [
  /\bnew\s+Phaser\./,
  /\bextends\s+Phaser\./,
  /\bPhaser\.AUTO\b/,
  /\bPhaser\.Input\.Keyboard\.(JustDown|KeyCodes)\b/,
  /\bPhaser\.Loader\.Events\b/,
  /\bPhaser\.Math\.(Vector2|Distance|Clamp|Between|Angle)\b/,
  /\bPhaser\.Scale\./,
];
const PHASER_IMPORT_PATTERN = /\bimport\s+Phaser\s+from\s+["']phaser["'];?/;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function collectTypeScriptFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...collectTypeScriptFiles(path));
    } else if (entry.endsWith(".ts")) {
      files.push(path);
    }
  }

  return files;
}

function validatePhaserRuntimeImports(errors) {
  for (const path of collectTypeScriptFiles(SRC_DIR)) {
    const source = readFileSync(path, "utf8");
    const usesPhaserRuntime = PHASER_RUNTIME_PATTERNS.some((pattern) =>
      pattern.test(source),
    );
    if (!usesPhaserRuntime || PHASER_IMPORT_PATTERN.test(source)) {
      continue;
    }

    errors.push(
      `${relative(join(import.meta.dirname, ".."), path)} uses Phaser runtime APIs without import Phaser from "phaser"`,
    );
  }
}

function requireFile(missing, mapId, mapDir, filename) {
  const path = join(mapDir, filename);
  if (!existsSync(path)) {
    missing.push(`assets/maps/${mapId}/${filename}`);
  }
}


function readTemplateCharacterIds() {
  const source = readFileSync(TEMPLATE_ASSET_PATHS, "utf8");
  const ids = [];

  for (const exportName of characterExportNames) {
    const pattern = new RegExp(`export const ${exportName} = "([^"]+)";`);
    const match = source.match(pattern);
    if (!match) {
      throw new Error(`Missing ${exportName} in website/src/pixellab/templateAssetPaths.ts`);
    }
    ids.push(match[1]);
  }

  return ids;
}

function readReachabilityText() {
  // Everything that can NAME a map folder, because any of them makes it loadable at
  // runtime. TypeScript alone is NOT enough: mapWarps.ts reads targetMapFolder /
  // targetMapId out of annotations.json rect + layer properties, so a door can lead
  // to a map whose id appears in no .ts file anywhere. Scanning source only, a
  // broken warp target was reported as "unreferenced", the build went green, and the
  // game crashed when the player walked through the door.
  const sources = [readFileSync(TEMPLATE_ASSET_PATHS, "utf8")];
  for (const path of collectTypeScriptFiles(SRC_DIR)) {
    sources.push(readFileSync(path, "utf8"));
  }

  const manifestPath = join(assetsDir, "manifest.json");
  if (existsSync(manifestPath)) {
    sources.push(readFileSync(manifestPath, "utf8"));
  }

  for (const entry of readdirSync(mapsDir)) {
    const annotationsPath = join(mapsDir, entry, "annotations.json");
    if (statSync(join(mapsDir, entry)).isDirectory() && existsSync(annotationsPath)) {
      sources.push(readFileSync(annotationsPath, "utf8"));
    }
  }

  return sources.join("\n");
}

function filenamesForMap(mapJson) {
  const filenames = [
    "map.json",
    "terrain-map.json",
    "objects/manifest.json",
  ];

  if (!mapJson.gameplayAnnotations?.file) {
    filenames.push("map.json#gameplayAnnotations.file");
  } else {
    filenames.push(mapJson.gameplayAnnotations.file);
  }

  for (const overlay of mapJson.overlays ?? []) {
    filenames.push(`overlays/${overlay.filename}`);
  }

  for (const tileset of mapJson.tilesets ?? []) {
    filenames.push(`tilesets/${tileset.filename}`);
  }

  return filenames;
}

function terrainName(mapJson, terrainId) {
  const terrain = (mapJson.terrains ?? []).find((candidate) => Number(candidate.id) === terrainId);
  return terrain ? `${terrain.name} (${terrainId})` : `unknown (${terrainId})`;
}

function terrainKey(x, y) {
  return `${x},${y}`;
}

function pairKey(first, second) {
  return `${first}:${second}`;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function tileCorners(terrain, tileX, tileY) {
  return [
    terrain.get(terrainKey(tileX - 1, tileY - 1)) ?? 0,
    terrain.get(terrainKey(tileX, tileY - 1)) ?? 0,
    terrain.get(terrainKey(tileX - 1, tileY)) ?? 0,
    terrain.get(terrainKey(tileX, tileY)) ?? 0,
  ];
}

function transitionTerrainIdsByTileset(mapJson) {
  const transitionTerrainIds = new Map();
  for (const terrain of mapJson.terrains ?? []) {
    const baseTileId = terrain.baseTileId;
    if (typeof baseTileId === "string" && baseTileId.startsWith("transition-")) {
      transitionTerrainIds.set(baseTileId.slice("transition-".length), Number(terrain.id));
    }
  }
  return transitionTerrainIds;
}

function buildTerrainGrid(mapJson, terrainMap) {
  const terrain = new Map();
  const bounds = mapJson.mapConfig.boundingBox;
  const maxVertexX = bounds.minX + mapJson.mapConfig.dimensions.width;
  const maxVertexY = bounds.minY + mapJson.mapConfig.dimensions.height;

  for (let y = bounds.minY; y <= maxVertexY; y += 1) {
    for (let x = bounds.minX; x <= maxVertexX; x += 1) {
      terrain.set(terrainKey(x, y), Number(terrainMap.defaultTerrain));
    }
  }

  for (const cell of terrainMap.cells ?? []) {
    terrain.set(terrainKey(Number(cell.x), Number(cell.y)), Number(cell.terrainId));
  }

  applyTransitionTerrains(terrain, mapJson);
  return terrain;
}

function applyTransitionTerrains(terrain, mapJson) {
  const transitionIds = new Set(transitionTerrainIdsByTileset(mapJson).values());
  if ([...terrain.values()].some((terrainId) => transitionIds.has(terrainId))) {
    return;
  }

  const transitionTerrainIds = transitionTerrainIdsByTileset(mapJson);
  const specs = (mapJson.tilesets ?? [])
    .filter((tileset) => Number(tileset.transitionSize ?? 0) >= 1)
    .flatMap((tileset) => {
      const transitionTerrainId = transitionTerrainIds.get(tileset.id);
      if (transitionTerrainId === undefined) {
        return [];
      }
      return [{
        lowerTerrainId: Number(tileset.lowerTerrainId),
        upperTerrainId: Number(tileset.upperTerrainId),
        transitionTerrainId,
      }];
    });

  const insertions = [];
  const bounds = mapJson.mapConfig.boundingBox;
  const maxVertexX = bounds.minX + mapJson.mapConfig.dimensions.width;
  const maxVertexY = bounds.minY + mapJson.mapConfig.dimensions.height;

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

function buildRenderLookups(mapJson) {
  const standardPairs = new Set();
  const standardTerrains = new Set();
  const transitionTerrainIds = transitionTerrainIdsByTileset(mapJson);
  const transitionSpecs = [];

  for (const tileset of mapJson.tilesets ?? []) {
    const lowerTerrainId = Number(tileset.lowerTerrainId);
    const upperTerrainId = Number(tileset.upperTerrainId);
    if (Number(tileset.transitionSize ?? 0) >= 1) {
      const transitionTerrainId = transitionTerrainIds.get(tileset.id);
      if (transitionTerrainId !== undefined) {
        transitionSpecs.push({ lowerTerrainId, upperTerrainId, transitionTerrainId });
      }
      continue;
    }

    standardPairs.add(pairKey(lowerTerrainId, upperTerrainId));
    standardPairs.add(pairKey(upperTerrainId, lowerTerrainId));
    standardTerrains.add(lowerTerrainId);
    standardTerrains.add(upperTerrainId);
  }

  return { standardPairs, standardTerrains, transitionSpecs };
}

function transitionSpecCanRender(terrainIds, spec) {
  return terrainIds.every((terrainId) => (
    terrainId === spec.lowerTerrainId
    || terrainId === spec.upperTerrainId
    || terrainId === spec.transitionTerrainId
  ));
}

function canRenderTerrainCombination(terrainIds, lookups) {
  if (terrainIds.length === 1) {
    const terrainId = terrainIds[0];
    if (lookups.standardTerrains.has(terrainId)) {
      return true;
    }
    return lookups.transitionSpecs.some((spec) => (
      terrainId === spec.lowerTerrainId || terrainId === spec.upperTerrainId
    ));
  }

  if (lookups.transitionSpecs.some((spec) => transitionSpecCanRender(terrainIds, spec))) {
    return true;
  }

  for (let index = 0; index < terrainIds.length - 1; index += 1) {
    if (lookups.standardPairs.has(pairKey(terrainIds[index], terrainIds[index + 1]))) {
      return true;
    }
  }

  return false;
}

function validateMapTerrain(errors, mapId, mapJson, terrainMap) {
  const definedTerrainIds = new Set();
  const duplicateTerrainIds = new Set();

  for (const terrain of mapJson.terrains ?? []) {
    const terrainId = Number(terrain.id);
    if (definedTerrainIds.has(terrainId)) {
      duplicateTerrainIds.add(terrainId);
    }
    definedTerrainIds.add(terrainId);
  }

  for (const terrainId of duplicateTerrainIds) {
    errors.push(`assets/maps/${mapId}/map.json has duplicate terrain id ${terrainId}`);
  }

  const usedTerrainIds = new Set([Number(terrainMap.defaultTerrain)]);
  for (const cell of terrainMap.cells ?? []) {
    usedTerrainIds.add(Number(cell.terrainId));
  }

  for (const terrainId of usedTerrainIds) {
    if (terrainId !== 0 && !definedTerrainIds.has(terrainId)) {
      errors.push(`assets/maps/${mapId}/terrain-map.json uses missing terrain id ${terrainId}`);
    }
  }

  const terrain = buildTerrainGrid(mapJson, terrainMap);
  const lookups = buildRenderLookups(mapJson);
  const bounds = mapJson.mapConfig.boundingBox;
  const maxTileX = bounds.minX + mapJson.mapConfig.dimensions.width - 1;
  const maxTileY = bounds.minY + mapJson.mapConfig.dimensions.height - 1;
  const seenFailures = new Set();

  for (let tileY = bounds.minY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = bounds.minX; tileX <= maxTileX; tileX += 1) {
      const corners = tileCorners(terrain, tileX, tileY);
      if (corners.some((terrainId) => terrainId === 0)) {
        continue;
      }

      const terrainIds = uniqueSorted(corners);
      if (canRenderTerrainCombination(terrainIds, lookups)) {
        continue;
      }

      const failureKey = terrainIds.join(",");
      if (seenFailures.has(failureKey)) {
        continue;
      }
      seenFailures.add(failureKey);
      const names = terrainIds.map((terrainId) => terrainName(mapJson, terrainId)).join(", ");
      errors.push(`assets/maps/${mapId} cannot render terrains ${names} at tile ${tileX},${tileY}`);
      if (seenFailures.size >= MAX_TERRAIN_RENDER_ERRORS) {
        return;
      }
    }
  }
}

function main() {
  if (!existsSync(mapsDir)) {
    throw new Error(`Missing PixelLab maps directory: ${mapsDir}`);
  }
  if (!existsSync(charactersDir)) {
    throw new Error(`Missing PixelLab characters directory: ${charactersDir}`);
  }

  const missing = [];
  const unreachable = [];
  let mapCount = 0;

  validatePhaserRuntimeImports(missing);

  // A map folder that NOTHING names — not the sources, not another map's warp
  // annotations — cannot be loaded at runtime. Its problems are reported but must
  // NOT fail the build: the exporter leaves old maps in assets/maps/, so one stale
  // map used to block EVERY build in the project, including brand-new maps that
  // were themselves fine (reported by a user 2026-09-02, whose Island Map blocked
  // the map they were actually building). Deliberately conservative — a mention
  // anywhere counts as reachable, so an uncertain map fails the build as before.
  const reachabilityText = readReachabilityText();

  for (const mapId of readdirSync(mapsDir)) {
    const mapDir = join(mapsDir, mapId);
    if (!statSync(mapDir).isDirectory()) {
      continue;
    }

    mapCount += 1;
    const sink = reachabilityText.includes(mapId) ? missing : unreachable;
    const mapJsonPath = join(mapDir, "map.json");
    requireFile(sink, mapId, mapDir, "map.json");
    if (!existsSync(mapJsonPath)) {
      continue;
    }

    const mapJson = readJson(mapJsonPath);
    for (const filename of filenamesForMap(mapJson)) {
      // The ONLY "#" names this loop invents are the `map.json#<field>` pseudo
      // entries above — they describe a missing FIELD, not a file, so they are
      // reported without a disk check. Matching any "#" caught real tilesets too:
      // a filename derived from a terrain description carries its hex colours
      // (e.g. "... #a5754a ...png"), so an asset that exists on disk was reported
      // missing and the build refused to run. Reported via agent_feedback
      // 2026-09-15.
      if (filename.startsWith("map.json#")) {
        sink.push(`assets/maps/${mapId}/${filename}`);
        continue;
      }
      requireFile(sink, mapId, mapDir, filename);
    }

    const terrainMapPath = join(mapDir, "terrain-map.json");
    if (existsSync(terrainMapPath)) {
      validateMapTerrain(sink, mapId, mapJson, readJson(terrainMapPath));
    }
  }

  if (mapCount === 0) {
    throw new Error(`No PixelLab map folders found in ${mapsDir}`);
  }

  const characterIds = readTemplateCharacterIds();
  for (const characterId of characterIds) {
    const manifestPath = join(charactersDir, characterId, "manifest.json");
    if (!existsSync(manifestPath)) {
      missing.push(`assets/characters/${characterId}/manifest.json`);
      continue;
    }

    const manifest = readJson(manifestPath);
    if (!Array.isArray(manifest.states) || manifest.states.length === 0) {
      missing.push(`assets/characters/${characterId}/manifest.json: states must be a non-empty array`);
      continue;
    }
    for (const state of manifest.states) {
      if (!state.folder || typeof state.folder !== "string") {
        missing.push(`assets/characters/${characterId}/manifest.json: state missing folder`);
        continue;
      }
      if (!Array.isArray(state.directions) || state.directions.length === 0) {
        missing.push(`assets/characters/${characterId}/manifest.json: state "${state.folder}" has no directions`);
        continue;
      }

      // Validate state directions are valid
      for (const direction of state.directions) {
        if (!VALID_DIRECTIONS.has(direction)) {
          missing.push(`assets/characters/${characterId}/manifest.json: state "${state.folder}" has invalid direction "${direction}"`);
        }
      }

      // Validate rotations exist for each direction
      for (const direction of state.directions) {
        const rotPath = join(charactersDir, characterId, state.folder, "rotations", `${direction}.png`);
        if (!existsSync(rotPath)) {
          missing.push(`assets/characters/${characterId}/${state.folder}/rotations/${direction}.png`);
        }
      }

      if (state.portrait) {
        if (typeof state.portrait.path !== "string") {
          missing.push(`assets/characters/${characterId}/manifest.json: state "${state.folder}" portrait missing path`);
        } else if (!existsSync(join(charactersDir, characterId, state.portrait.path))) {
          missing.push(`assets/characters/${characterId}/${state.portrait.path}`);
        }
      }

      if (state.vocal_animation) {
        if (typeof state.vocal_animation.path !== "string") {
          missing.push(`assets/characters/${characterId}/manifest.json: state "${state.folder}" vocal_animation missing path`);
        } else if (!existsSync(join(charactersDir, characterId, state.vocal_animation.path))) {
          missing.push(`assets/characters/${characterId}/${state.vocal_animation.path}`);
        }
      }

      // Validate every animation frame exists
      for (const anim of state.animations ?? []) {
        if (!anim.name || typeof anim.frame_count !== "number" || anim.frame_count < 1) {
          missing.push(`assets/characters/${characterId}/manifest.json: invalid animation in state "${state.folder}"`);
          continue;
        }
        if (!Array.isArray(anim.directions) || anim.directions.length === 0) {
          missing.push(`assets/characters/${characterId}/manifest.json: animation "${anim.name}" has no directions`);
          continue;
        }
        if (typeof anim.loop !== "boolean") {
          missing.push(`assets/characters/${characterId}/manifest.json: animation "${anim.name}" missing boolean loop field`);
        }
        for (const direction of anim.directions) {
          if (!VALID_DIRECTIONS.has(direction)) {
            missing.push(`assets/characters/${characterId}/manifest.json: animation "${anim.name}" has invalid direction "${direction}"`);
            continue;
          }
          for (let frame = 0; frame < anim.frame_count; frame++) {
            const frameName = `frame_${String(frame).padStart(3, "0")}.png`;
            const framePath = join(
              charactersDir, characterId, state.folder,
              "animations", anim.name, direction, frameName,
            );
            if (!existsSync(framePath)) {
              missing.push(
                `assets/characters/${characterId}/${state.folder}/animations/${anim.name}/${direction}/${frameName}`,
              );
            }
          }
        }
      }
    }
  }

  if (unreachable.length > 0) {
    console.warn(
      "PixelLab asset warnings in map folder(s) nothing references — not blocking the build:",
    );
    for (const filename of unreachable) {
      console.warn(`  - ${filename}`);
    }
    console.warn("These are stale exports: delete the folder, or point MAP_FOLDER / a warp at it and it becomes an error.");
  }

  if (missing.length > 0) {
    console.error("PixelLab asset validation failed. Runtime asset problems:");
    for (const filename of missing) {
      console.error(`  - ${filename}`);
    }
    console.error("Re-sync PixelLab assets before building; do not work around this in gameplay code.");
    process.exit(1);
  }

  console.log(`Validated ${mapCount} PixelLab map asset folder(s) and ${characterIds.length} character asset folder(s)`);
}

try {
  main();
} catch (error) {
  console.error("PixelLab asset validation failed:", error);
  process.exit(1);
}
