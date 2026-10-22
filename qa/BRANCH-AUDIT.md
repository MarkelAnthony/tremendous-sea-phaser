# Branch readiness audit

## Verdict
Not ready to lock as a finished first version. Core combat is playable, but confirmed rules/description mismatches remain. This audit changes no shipped gameplay or art.

## Method
Tested deployed https://tremendous-sea.pixellab.run/ with real DOM card clicks, visual browser review, and controlled runtime scenarios. Scripts in this folder are browser-console QA only and are not imported into the game. Controlled scenarios do not represent a naturally completed three-act voyage. Starting voyages may replace the browser's local test save; use a disposable browser profile.

## Results
- 60 unique starter/pool cards exercised in a seeded two-target scenario: zero thrown exceptions. This is smoke coverage, not proof of every description or interaction.
- 28 targeted regression assertions: 24 pass, 4 failures.
- 19 additional combo/flow assertions: 17 pass, 2 failures.
- No captured game errors in normal tested combat, animation, defeat and victory rendering.

### Confirmed passes
- Flame Jab damage and Enflame; Cinder Fist doubles against burning targets.
- Multi-enemy target selection damages the chosen enemy; unaffordable card not consumed.
- Charred Cross, Scorch Kick and Haymaker combo discounts.
- Wraithfire Bolt energy refund on kill.
- Banked Coals burn consumption/block/draw; Fuel the Fire burn consumption/energy.
- Block, healing cap, penetrating-versus-blocked Solar Flare stun, Stoneskin attack negation.
- Jab, heavy, fire, kick, block, heal animation routes finish and release input. Phoenix Ward sequences block then heal and returns idle. Allow lunge/shuffle settling time before asserting idle.
- Real end turn refreshes energy to 3 and draws five cards.
- Direct kill on already-burning enemy heals 1 via Flame Body.
- Normal combat victory, bounty, three-card reward, chosen card added to deck, route-choice transition.
- Controlled lethal damage shows Defeat and Return to Menu works.
- Controlled final-act boss completion shows Victory and Return to Menu, visually checked; not a full-run balance test.
- Save/resume restores Branch in the test scenario.
- Measured card widths at 780x437 viewport: 5 cards = 91px each, 3 cards = 91px each, 1 card = 91px. A visual subagent's claim of growth contradicted these actual dimensions. Card layout source reserves at least five slots.
- Ship art visibly has hanging light strands, fairy-style lanterns and red-orange deck cracks; Branch feet align with deck.

## Confirmed blockers
1. Flame Body heal missing on burn-tick kill: HP stays 60, expected 61. Source resolves enemy ticks outside direct-card kill reward logic.
2. Flame Body heal missing on detonation kill: burning 1HP target killed by Mystic Detonation leaves HP60, expected61. Burn removed before kill healing check.
3. Flame Body can be consumed by a non-attack: zero-attack action sets first-hit flag and gives enemy 3 Enflame. Real browser review also showed Mermaid status action consuming passive. Guard uses wasFirst without requiring wasAttacked.
4. Fireball Candy - Wildfire says no decay for two turns but burn falls 5 to4 on first enemy tick with passive isolated. No implementation of no-decay duration found.
5. Sage's Remedy says remove all debuffs but leaves Bleed3 (and source only clears tire/rattled/daze/enflame). HP heals correctly.
6. Phoenix Straight killing a previously unburned enemy heals5, then applies Enflame to dead target; passive +1 not awarded. Timing/description needs explicit resolution: either count this kill as burning or clarify the rule.

## Presentation and testing gaps
- Enemy bodies are plain red rectangles (seen for Mermaid Enchantress), not finished enemy art. Shared opponent presentation, not Branch-specific logic.
- Animation routing is coarse: multiple fire/detonation/persistent-buff cards fall back to jab; Draft Up can retain prior clip in synthetic same-sprite test. Core routes exist, but not every card has semantically specific motion.
- Some status/intent text is small. Do not claim phone readability validated from desktop testing alone.
- window.playtest() throws when G exists and G.combat is null: hp/energy/enemy queries use G?.combat?. in some places but energy accesses G?.combat.energy. Found on reward/end screens; diagnostic hook needs null guards. Not a natural gameplay crash by itself.
- No exhaustive relic combinations, all encounters/boss mechanics, long-run balance, touch-device or resize matrix tested. Final victory used controlled completion, not natural full voyage.

## Recommended next pass
Fix confirmed rules mismatches first; re-run these regressions and check burn kill double-heal prevention, multi-target deaths, block-only attackers, delayed detonations, and passive relic multipliers. Then improve card-to-animation mapping and opponent presentation. Do not declare Branch finished based solely on smoke coverage.
