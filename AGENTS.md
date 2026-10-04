# Phaser Sidescroller Template

A Phaser 4 + TypeScript + Vite sidescroller platformer for PixelLab `/chat`. Build features as new modules under `website/src/`; extend the scaffolding, don't rewrite it.

## Where the detail lives
Each `website/src/` subfolder has its own `AGENTS.md` — read it before working in that area (they're all in the project file tree):
- `pixellab/` — the read-only runtime layer that turns PixelLab's exported maps/assets into the running game: map loading, terrain rendering, collision, spawns, warps, coordinates. Treat it as a library; the full map contract is in `pixellab/AGENTS.md`, don't parse export JSON in a scene.
- `player/` — the platformer controller. Movement/jump FEEL (gravity, speed, coyote time, double jump) is tuned by constants in `physicsConfig.ts`; never reimplement the controller or add Arcade Physics.
- `npc/` — enemy/NPC behavior (`CharacterAgent`, `ForestEnemy`).
- `hud/` — DOM HUD and UI.

Everything under `assets/` (map.json, terrain-map.json, annotations.json, backgrounds, manifests) is READ-ONLY runtime data — consume it, never rewrite or hand-fake it.

## What makes this a platformer
- **Collision semantics live in `pixellab/platformer.ts`:** painted terrain = solid ground; annotation rects tagged `one-way`/`platform` = jump-through (solid only when landing from above); `hazard`/`spikes`/`lava` = respawn; `goal`/`exit`/`finish` = level complete. Keep these checks centralized there, not in scenes.
- **The player faces east/west only.** A new character must be side-view, animated east+west (`walk`/`run`/`jump` clips).
- **Movement feel is one constant.** "Higher/floatier jump", "faster", "triple jump" are edits to `physicsConfig.ts`, not controller rewrites — the controller already has gravity, coyote time, jump buffering, variable height, double jump, one-way drop-through, and hazard/goal callbacks.
- **Background** (`pixellab/backgroundRenderer.ts`) is a height-fitted, horizontally-repeating parallax layer at the SAME camera zoom as terrain/characters — never scale it independently. Camera Y is fixed during jumps; only horizontal travel scrolls.
- Gravity is +y (x right, y down); coordinates are exported world pixels with dual-grid terrain (see `pixellab/AGENTS.md`) — don't half-shift them.

## Bundled forest starter
Ships `forest-warrior` (13 clips, two stances), `forest-wolf`, `forest-guardian`, and the `verdant-crossing` map, registered as project assets at bootstrap. `ForestEnemy.ts` drives terrain-aware patrols, timed attacks, and deaths; enemy annotation points carry `characterId`/`patrolMin`/`patrolMax` (read via `findEnemySpawns`). Combat keys J/K/L select attacks, Shift runs, Space double-jumps; tuning in `gameplay/combatConfig.ts`, camera in `config.ts`.

## The handful of things that bite
- **A map swap is one line:** `MAP_FOLDER` in `pixellab/templateAssetPaths.ts`; a character swap is the relevant ID in that file. (Warps → `pixellab/AGENTS.md`.)
- **Runtime code needs `import Phaser from "phaser";`** — type-only code compiles but crashes in Vite (no global Phaser).
- **`update(_time: number, deltaMs: number)`** — Scene.update's first arg is TIME, not delta (TS2554).
- Put HUD text in `HudOverlay` and clickable UI as DOM in `#hud-root` (playtest clicks DOM, not Phaser canvas). Build features in `website/src/gameplay/`; **never rewrite** `GameScene.ts`, `BootScene.ts`, `PlayerController.ts`, or anything in `pixellab/`.

Deploy with `wrangler deploy` (it builds, smoke-tests, and ships the `worker/` multiplayer bundle when present). Nothing auto-saves — `git add -A && git commit && git push origin main`.
