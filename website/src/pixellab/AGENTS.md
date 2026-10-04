# PixelLab Runtime Helpers

Turns exported maps into the running game (load, render, spawn, warp). The contract boundary — call these helpers, don't parse export JSON in scenes. Rendering is `renderMap.ts` + `terrainRenderer.ts` (there is no `MapRenderer.ts`). `assets/maps/{id}/` is read-only; a map task is wiring, not regenerating terrain.

Platformer collision (solid terrain, one-way/platform, hazard, goal) lives in `pixellab/platformer.ts` — see the root and `player/AGENTS.md`. This folder is the map-export plumbing around it.

- **Map swap:** one line — `MAP_FOLDER` in `templateAssetPaths.ts`. The runtime already handles bounds, tilesets, overlays, objects, and spawns. Explicit `@map [id:...]` → read `assets/maps/{id}/map.json` (+ `annotations.json` when `map.json.gameplayAnnotations.file` is set; `objects/manifest.json` before moving objects). `assets/manifest.json` = name→path.
- **Multi-map:** go through `mapHelpers.ts` so preload/render/spawn/camera share one `LoadedMap` — mixing new-map JSON with old texture keys is the usual broken-warp cause. `renderMap(...)` tears down the previous map itself.
- **Warps:** `switchPlayerToMap(scene, targetMapId, player, currentRenderedMap)`; `{ spawnName }` for an entry point; `this.agents = replaceNpcs(this.agents, [])` after. Map-editor areas → `switchPlayerByWarpArea(...)` (`mapWarps.ts`) with `player.worldPosition`, following rect `targetMapFolder`/`targetMapId`/`targetSpawnName`; keep those areas non-blocking. The target `LoadedMap` drives everything after, so patching via `TEMPLATE_SPAWNS` or tile offsets just relocates the bug. For custom flows compose `loadAndPreloadMap`, `replaceRenderedMap`, `resolveMapEntryPoint`.
- **Spawns:** `spawns.ts` only (keeps collider + fallbacks consistent). Roles from point/layer names+tags (`player spawn`, …), then `TEMPLATE_SPAWNS` (default map only). `resolvePlayerSpawnPoint(mapData)` for the player, `resolveMapEntryPoint(mapData, {spawnName})` for warps.
- **Coordinates:** Y-down world pixels, same as the editor (no center-origin/Y-up). Terrain dual-grid: tile `(x,y)` samples cells `(x-1,y-1),(x,y-1),(x-1,y),(x,y)`, centered on `x*tileSize`. Objects/overlays/spawns/rects are already in exported pixels, so an offset is a sampling or texture-key/preload issue — half-shifting them breaks every aligned map.

**Export files:** `map.json` (config/tiles/bounds/terrains/tilesets/overlays/walkable-fallback/annotation-pointer) · `terrain-map.json` (layout) · `tilesets/*.png` · `objects/manifest.json` (filenames+boxes) · `annotations.json` (spawn/collision/trigger/hazard/custom) · `transition-map.json`/`transition-rules.json` (renderer debug; `transitionSize=1` → synthetic terrain where `baseTileId == "transition-{tilesetId}"`).

Green/black tiles = missing texture: check `loadPixelLabMap`/`preloadMapAssets`/`renderMap` share one `LoadedMap.folder`. `map-composite.png` is reference art only (nothing renders it; missing textures throw).
