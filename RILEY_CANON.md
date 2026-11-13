# Riley — locked canon (the ONLY Riley)

Locked at the user's request. Every new Riley image, state or animation MUST start from these files.
Never use any other Riley art (pink-haired / magenta-bodysuit drafts, old `uploads/` Riley images,
the Fran outfit, legacy stance stills, or anything in `website/public/legacy/`).

Design: spiky white hair, gold hoop earring, dark skin, long mustard-yellow robe with dark-blue trim
and zigzag hem, pink/magenta sash, barefoot. Holds a GREEN sword and a PINK/RED sword; a GOLD sword
and a BLUE sword float behind her (Four Sword Stance).

## Source art
- Master design (candidate 3): `website/public/art/riley-approved-master.png`
  (identical to `assets/images/6513f8cc-b6e5-40e3-9292-b9e2549c0f72/image.png`)
- Character (Pro, 128x128, side view): `4315e222-eddb-4624-ae3b-b9b23d256f24`
  - east rotation `assets/characters/4315e222-eddb-4624-ae3b-b9b23d256f24/idle/rotations/east.png`
    = the ONLY starting image for new east-facing Four Sword animations.
- Fistblade stance still: `assets/images/5bd13a55-12ae-5ef4-9233-e9ac6e5de18b/image.png`

## Approved keep-list — the ONLY four Riley essentials
User-approved standard: retain exactly these four items for all future Riley work.
1. Master design (candidate 3), at the source path above.
2. Standing side view (east), at the character rotation path above. This is a still, NOT another animation.
3. Four Sword bent-knee fighting idle — approved smoothed 33-frame version in
   `website/public/art/riley-smooth-idle/`. Its original source is
   `assets/images/e1e8728a-681e-5d0b-8111-311e022fd795` (9 frames); use the smoothed version for review/playback.
4. Fistblade stance idle — approved 17-frame version in
   `assets/images/9084b021-f2cd-5215-a73f-8e4c66f2e445`.

Only TWO animations are approved: the bent-knee fighting idle and Fistblade idle.
Breathing idle (east/west), attack attempts, old designs, and all other Riley drafts are RETIRED.
Do not display, reuse, or treat retired material as a generation reference. Historical files in
asset sync or git history are not approval. Do not delete shared/live-game assets merely to tidy previews.
The Fistblade still above is supporting source material, not a fifth approved item.

## Future-work standard
For Four Sword motion, use the approved bent-knee idle as the stance/motion reference and
approved standing side view as the identity reference. For Fistblade motion, use the approved
Fistblade idle. Always preserve the master identity, stance-specific weapons, outfit and colours.
Do not default back to the retired breathing idle or any attack draft.
The sole public approval gallery is `website/public/riley-current-animations.html`.

## Rule before any generation
Compare the start image with the master side by side (read_image) and confirm hair, robe, sash,
bare feet and all four sword colours match BEFORE spending generations.

## Four Sword attack motion approved
The user approved the motion of `53f1ea14-fa34-55d7-b659-bd66b069eb28` and requested ONLY local cleanup on displayed frames 9, 11, 12, 14, 17, 18, 26, 28. This attack is an explicit exception to retired attack drafts above: preserve its choreography and 33-frame/10 fps timing. Original review manifest remains intact; cleanup preview uses `website/public/art/riley-four-sword-attack-cleaned.json`. Cleanup pixels await user review. Do not regenerate the motion.

## Live attack integration approved
The user approved both attacks and the advance/contact/return demonstration, including equal stance sizing.
Use `website/public/art/riley-four-sword-attack-cleaned.json` (33 frames at 15 fps) and
`website/public/art/riley-fistblade-attack.json` (17 frames at 65 ms each).
Both are now approved exceptions to retired attacks. Default stance attacks use these exact frames,
advance to the selected enemy, and return to the original spot. Approved idle loops resume afterward.
