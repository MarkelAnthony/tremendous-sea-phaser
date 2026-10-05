# The Verdant Crossing

This sidescroller bundles the supplied warrior, wolf, hooded guardian, forest
background and 16px tileset. New projects register project-owned character groups/states/animations, a tileset,
a map, and a Creator image with persistent IDs. Bootstrap patches source and asset
folders together; regular asset sync preserves the imported clip roles/timing.

- `maps/284a60d0-b94a-50b2-ac1d-2f869e93608a`: new 160 × 40 terrain grid, spawn, ravines and exit.
- `characters/476945d1-f351-5034-b0af-5a3e362e53ee`: both stances, all 13 clips.
- `characters/36e5db22-bb07-5f4f-9eb6-75b915d82f4c`: all five clips; west mirrors the supplied east frames.
- `characters/113f91a5-29f0-5c08-9981-5c5b3b5a8718`: all eight clips, including three attacks and dodge.

Manifest aliases describe gameplay roles. Original frame pixels and dimensions
are preserved; atlas trimming only removes transparent padding and Phaser
restores the source canvas at render time. Wolf frame filenames are renumbered
from zero without dropping any frames. Its gallery rotation slots reuse the supplied
east pose; runtime west-facing movement mirrors that pose. The warrior's `idle` animation is named
`breathing` to distinguish it from the animator's static rotation pose.

Controls: A/D or arrows move, Shift sprints, Space/W jumps (double jump),
J strikes, K uses the fire axe, L performs the axe flourish. The warrior starts
unarmed, draws the axe when fighting, and sheathes it after 2.2 quiet seconds.
Damage plays the current stance's hurt clip, then engages combat. Death plays the unarmed death clip
before respawning. R returns to the start. Defeat all six enemies and reach the
banner to finish. Hooded enemies patrol, chase, cycle all three attacks, and
backflip when struck; wolves idle, walk, attack, recoil and die.

Change `MAP_FOLDER` / `PLAYER_CHARACTER_ID` in
`website/src/pixellab/templateAssetPaths.ts` to use newly synced project assets.
Update the gameplay animation roles when replacing characters. The background
uses the same pixel scale as characters and tiles, fits the full image height, repeats horizontally at 20% camera speed, and remains vertically fixed during jumps. Ground occupies the bottom 10%.

Validate with `./build.sh` and `cd website && npm test`. Publish source, preview
and worker together through `tools/publish_template.py` when deployment is
requested. Template publication requires the matching API registry revision.

Combat values and enemy profiles live in `website/src/gameplay/combatConfig.ts`;
movement stays in `player/physicsConfig.ts`, framing in `config.ts`. The scene
coordinates these modules and only refreshes HUD content when game state changes.
