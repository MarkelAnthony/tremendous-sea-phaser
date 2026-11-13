# Riley Entropy — review only

Not integrated into gameplay or added to the approved keep-list.

Sources: RILEY_CANON.md; canonical east still; approved smoothed Four Sword idle frame 0. Key pose was edited directly from that approved idle, preserving a 128×128 canvas, body scale and feet baseline. White hair, mustard robe/navy trim, magenta sash, dark skin and bare feet remain; all four blades become gold, two ahead and two behind.

Generated assets (exact completion receipts):
- Key pose: assets/images/5f952b16-bc84-51f7-b96a-3fa2bd1ffb39/image.png — 10 generations.
- Activation: assets/images/1aac7240-670d-5525-b4f0-c3fbf69ac61b/frames/ — 33 frames, 5 generations.
- Idle: assets/images/31ed9ac0-dce1-5d80-bebd-68aec8d58ddb/frames/ — 17 source frames, 2 generations.

Total artwork: 17 generations, below previous 26–31 estimate; excludes chat/model usage.

Preview: website/public/riley-entropy-preview.html and riley-entropy-preview.js. Activation plays once then idle loops. Both render at native 128×128 alongside approved idle at identical scale. No generated source pixels are edited. Idle playback omits source frames 2 and 3 because contact-sheet inspection found a small dark hem-edge sliver there. All original source frames remain intact. Minor activation particle cutoff and flat flame tail are draft quality notes, not approval.

Controls: replay activation, idle only, pause, next frame, slow playback and frame scrub. window.playtest() and window.entropyFrame('activation'|'idle', index) expose exact playback state.
