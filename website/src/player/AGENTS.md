# Player Module (platformer)

Player movement, animation, input.

- **Feel = constants.** Speed, gravity, jump height, floatiness, coyote time live in `physicsConfig.ts` — never reimplement the controller for these. Collision stepping is `pixellab/platformer.ts` (`stepPlatformerBody`); the controller only sets velocities and reads `grounded`. Facing is east/west only; vertical motion comes from physics, so jump/fall frames are grounded-in-canvas poses — no manual y-offsets.
- **Relocate:** `resolvePlayerSpawnPoint(mapData)` (`pixellab/spawns.ts`) — don't parse `annotations.json` here. `TEMPLATE_SPAWNS.player` = default map only. Check trigger areas with `player.worldPosition` (feet position). `player.teleportTo(x, y)` resets velocity — use it for respawns/warps.
- **Character swap:** update `PLAYER_CHARACTER_ID` in `pixellab/templateAssetPaths.ts`, reuse `PlayerController.ts`. Read `assets/characters/{id}/manifest.json` first; still poses at `{stateFolder}/rotations/{direction}.png`, clips at `{stateFolder}/animations/{clip}/{direction}/frame_NNN.png` (east/west used). Prefer manifest aliases (`walk`/`run`/`jump`).
