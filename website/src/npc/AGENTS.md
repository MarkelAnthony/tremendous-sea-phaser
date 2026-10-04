# NPC Module (platformer)

Forest starter: `ForestEnemy.ts` drives wolves and guardians; `findEnemySpawns` reads their character IDs and patrol bounds from annotations. `spawnNpcs.ts` holds generic NPC lifecycle helpers.

- **New enemy:** create the character (Characters tool, side view, animate east+west), then build a `CharacterAgent` from its atlas/manifest (see `CharacterAgent.ts`).
- **Spawns:** annotation points via `pixellab/spawns.ts` `findSpawnPoint`, or explicit coords — no walkable-snapping in a platformer (gravity settles it).
- **Gravity-bound enemies** step through `pixellab/platformer.ts` (`stepPlatformerBody`) like the player, not Arcade Physics.
