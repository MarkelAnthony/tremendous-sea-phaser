# Tremendous Sea — Game Overview

This document describes the whole game: what it is, how it plays, how the code is organized, and exactly where art plugs in. It is written for an AI coding assistant (Claude Code with PixelLab's MCP tools) or a human collaborator.

Companion files: `ART_DIRECTION.md` (approved visual style and every design) and `ASSET_LIST.md` (every asset, in build order).

---

## 1. What the game is

A roguelite deckbuilder in the style of Slay the Spire, set on a pirate-fantasy ocean where candy has been weaponized and something genuinely wrong hides beneath the sweetness.

- Pick one of **3 captains**, each with a **60-card pool**.
- Sail a **branching map** through **3 acts**, choosing fights, events, shops, and rest stops.
- Win turn-based card battles; earn cards, **Gear** (relics), and **Rubees** (currency).
- Beat the Act 3 final boss to win the run.

| Act | Name | Floors (incl. boss) | Lanes | Elite floors |
|---|---|---|---|---|
| 1 | Ocean of Tears | 15 | 3 | 2 (1 mandatory) |
| 2 | Candied Ocean | 21 | 4 | 4 (2 mandatory) |
| 3 | The Eternal Dark | 20 | 5 | 5 (3 mandatory) |

The first floor of each act is always a single common fight; the first path choice comes right after it. The player is fully healed when entering a new act.

---

## 2. Core combat rules

- 3 energy per turn, draw 5 cards, max hand size 8.
- Block resets at the start of the player's turn.
- Damage types: **Slashing, Blunt, Fire, Magical**. Enemies can resist or be weak to types.
- Card rarity: **Common, Uncommon, Rare, Djinn** (Djinn is the top tier).
- Enemies show their next action (intent) above them.

### Statuses
| Status | Effect |
|---|---|
| Enflame | Burn: deals floor(stacks/2) damage per tick; some cards "detonate" all stacks at once |
| Bleed | Damage over time tied to being hit |
| Tire | Target deals half damage |
| Daze | Next hit on the target deals double |
| Stun | Target skips its action |
| Rattled | Player's cards cost +1 |
| Harden | Enemy's attacks deal extra damage equal to its stacks |
| Corrosion | Target takes extra damage per hit equal to its stacks; decays by 1 each time |
| Undertow | Target takes +1 damage from each hit |
| Muted | Player can only play Common cards |
| No Attack / No Heal / No Block | Act 3 denial effects for one turn |
| Energy Drain | Less energy next turn |

---

## 3. Captains

Mechanics are from the game data. All appearances are in `ART_DIRECTION.md`.

### Branch — Fireball Candy (fire) — 75 HP
- **Look:** see `ART_DIRECTION.md`.
- **Trait — Flame Body:** the first enemy to attack him each combat is Enflamed; he heals 1 HP whenever an Enflamed enemy dies.
- **Playstyle:** stack Enflame, then detonate it. A Magical sub-theme ("Phoenix" cards, and a Power that converts his Fire cards to Magical).
- **Crew:** the Evergreen Pirates (Pine, Christmas, Sage, Thistle, Willow), aboard the Kindleroot.

### Riley — No Candy (swords and Clarity) — 70 HP
- **Look:** see `ART_DIRECTION.md`.
- **Trait — Honed Clarity:** gains 1 Block whenever she switches stance.
- **Playstyle:** switches between three stances (**Four Sword**, **Fist Blade**, **Entropy**) and builds **Clarity**; reaching the threshold forces Entropy, a stance with powerful HP-costing cards.
- **Crew:** the Pop Rock Pirates (Belt, Riff, Encore, Harmony, Amp), aboard the Stage.

### Broderick — Wolf Candy (werewolf rifleman) — 80 HP
- **Look:** see `ART_DIRECTION.md`.
- **Traits — Lunar Longevity:** heals 3 HP on his 2nd Claw attack each turn. **Always Armed:** loads a Plain bullet when his clip is empty at turn start.
- **Playstyle:** loads bullets into a clip (max 4) — **Fire** (5 dmg + Enflame), **Plain** (3 dmg + Block), **Magic** (2 dmg + draw) — then fires them; also has Claw attacks. **Full Moon** temporarily turns every bullet card into a Claw attack for the rest of the combat.
- **Crew:** the Moonshot Pirates (Pluto, Yeller, Lassie, Cerberus, Scrappy), aboard the Howling Shell.

Each crew member has a story event and a signature card the player can earn.

---

## 4. Content totals

- **Cards:** 60 unique per captain (180 total).
- **Gear:** 61 pieces (51 regular + 10 boss-tier). One, Broken Sea Witch's Bead, only appears when Sea Witch's Bead breaks.
- **Enemies:** 55 total.

| Act | Commons | Elites | Bosses |
|---|---|---|---|
| 1 | 7 | 6 | 3 |
| 2 | 8 | 7 | 3 |
| 3 | 8 | 8 | 4 |
| Optional | — | — | King in Green (guards the shop when a specific Gear piece is owned) |

Act 3 elites and bosses each have a unique mechanic (fake HP display, damage-type immunity cycles, card-devouring, phase changes). The final boss is **True Yonk's Shadow** (4 phases).

- **Map nodes:** common fight, elite fight, boss, event, shop (F&J Emporium), oasis (rest).
- **Events:** 10 shared events plus 15 crew events (filtered by captain). Some crew events are two-part chains.
- **Economy:** Rubees from fights; shop sells cards, Gear, card removal, and healing; removal and healing prices double each use.

---

## 5. Code architecture

```
index.html        Loads Phaser (CDN) and the four scripts below, in order.
data.js           All content: cards, captains, Gear, enemies, card constructor C(), enemy constructor E().
engine.js         Combat primitives and enemy AI: damage, statuses, enemyTurn().
ui.js             Game orchestration: global state G, startGame, map generation, playCard, endTurn,
                  rewards, shop, events, save/resume (localStorage). Originally rendered HTML.
phaser-scene.js   The ONLY Phaser-aware file. Redefines the global render() so every state
                  change redraws a Phaser scene instead of HTML.
```

**Key rule:** `data.js`, `engine.js`, and `ui.js` are shared with a separate single-file HTML build and must stay renderer-agnostic. Visual work belongs in `phaser-scene.js`.

### How rendering works
- `ui.js` calls `render()` after every state change. `phaser-scene.js` replaces `render()` with `scene.syncFromState()`.
- `syncFromState()` checks `G` in a fixed order and draws one screen: captain select → end screen → restart confirm → crew moment → event → shop → Gear choice → card removal → card reward → combat → combat result → map.
- Combat diffs a snapshot of HP before and after each action to decide which animations to play.
- Errors during render are caught and shown on screen.

### Current screen layout (1000 × 700 canvas, being replaced)
- Top strip: captain-specific info, Enchant, log, Gear row.
- Combat row at y = 280: player at x = 150; up to 3 enemies spread between x = 470 and x = 830, facing the player.
- Hand of cards along the bottom (y ≈ 600); the area right of x = 800 is reserved for the End Turn button.
- Every coordinate in `phaser-scene.js` currently assumes this canvas.

### Resolution (Phase 0 task)
- Switch to a **640×360 base resolution** with pixel-perfect integer scaling: Phaser `pixelArt: true`, `roundPixels: true`, and a scaler that only scales by whole numbers (2× = 1280×720, 3× = 1920×1080), letterboxing any leftover space.
- Re-lay out every screen for 640×360. Keep the same structure: player on the left, enemies in a row on the right on a shared ground line, the hand along the bottom, End Turn bottom-right with its own reserved space, and Gear and info along the top.
- Text: Pixelify Sans for headers, Nunito for card and body text, at sizes that stay legible at 640×360.
- The in-game title strings still say "The Tremendous Sea"; change them to "Tremendous Sea".

---

## 6. Where sprites plug in

Characters are currently placeholder rectangles:

| Placeholder | Location in `phaser-scene.js` |
|---|---|
| Player body | `this.playerBody = this.add.rectangle(...)` in `buildCombatSkeleton()` |
| Each enemy body | `const body = this.add.rectangle(...)` in `updateCombatDisplay()` |

Existing animation hooks map directly onto sprite animations:

| Current effect | Function | Sprite animation to play |
|---|---|---|
| Idle (nothing happening) | — | `idle` (loop) |
| Attacker lunges toward target | `lungeAttack()` | `attack` |
| Hit: white flash + shake | `flashAndShake()` | `hurt` |
| Enemy fades and shrinks on death | death tween in `updateCombatDisplay()` | `death` |

Suggested integration:
1. Add a `preload()` method to `MainScene` that loads one sprite sheet per character with `this.load.spritesheet(key, path, { frameWidth, frameHeight })`. Key captains by `G.captainKey` and enemies by name.
2. In `create()`, define `idle`, `attack`, `hurt`, and `death` animations from frame ranges.
3. Replace the rectangles with `this.add.sprite(...)`. Fall back to the rectangle if no sheet exists for a character, so art can be added gradually.
4. Call `.play(...)` at the hook points above.
5. Captains face right. Enemies are **generated facing left; do not use `setFlipX`**, because flipping would move the top-right light source.
6. Riley swaps idle and attack sets when her stance changes; Broderick swaps to his Full Moon set while Full Moon is active; bosses and elites with extra forms swap sprites at their phase changes (see `ART_DIRECTION.md`).
7. Group enemies (×2, ×3) share one sprite with a slight per-member tint.

Sprite specs: see `ART_DIRECTION.md` section 4 and `ASSET_LIST.md`.

**Build order:** follow the phases in `CLAUDE.md`. Phase 1 is a full Act 1 vertical slice with Branch.

### New screens to build
Title screen (before captain select), captain select with portraits and a stats panel, the F&J Emporium shop with its shopkeepers, the oasis campfire, event backdrops, crew moments with portraits, victory and defeat banners, a pause menu, per-act map styles, and themed displays for Riley's Clarity and stances and Broderick's bullet clip. Details are in `ART_DIRECTION.md` section 11.

---

## 7. Creator's standing rules

- Discuss changes before implementing them.
- No "barnacle" anywhere in the game.
- Use a candy motif when naming new things.
- Character appearances come from the creator; don't invent new looks.
- Pirate-crew casting: human crew members are all Black; other crew members are bipedal animals. Enemies aren't bound by this.

## 8. Open items

- Six act-specific events (three for Act 1, three for Act 2) are designed but not approved or built. Act 3 has no act-specific events yet. Don't build these without the creator's approval.
- Music and sound effects are out of scope for now.
- Balance still needs playtesting by people.

## 9. Running it

Open `index.html` through a web server (for example `npx serve .`); it's also hosted on GitHub Pages. It needs an internet connection to load Phaser from the CDN. Save/resume uses the browser's localStorage.
