# Tremendous Sea — Complete Game Handoff

This document describes the whole game: what it is, how it plays, how the code is organized, and exactly where art plugs in. It is written for an AI coding assistant (for example Claude Code with PixelLab's MCP tools) or a human collaborator picking up the project.

Companion file: `PixelLab_Art_Brief.md` (art direction, captain looks, enemy visual descriptions, sprite specs).

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

Appearance is the creator's own description. Mechanics are from the game data.

### Branch — Fireball Candy (fire) — 75 HP
- **Look:** tall, athletic; caramel-colored skin; low-cut fade; shirtless with a tree tattoo across his torso from the chest down; white-and-purple camouflage shorts; combat boots with fire coming off the soles; hands constantly on fire.
- **Trait — Flame Body:** the first enemy to attack him each combat is Enflamed; he heals 1 HP whenever an Enflamed enemy dies.
- **Playstyle:** stack Enflame, then detonate it. A Magical sub-theme ("Phoenix" cards, and a Power that converts his Fire cards to Magical).
- **Crew (plant names):** Pine, Christmas, Sage, Thistle, Willow.

### Riley — No Candy (swords and Clarity) — 70 HP
- **Look:** short, gymnast's build; Black woman with a dark chocolate complexion; spiky, almost punk-rock white hair; a regal-but-humble robe in yellow, blue and purple. Weapon not yet specified.
- **Trait — Honed Clarity:** gains 1 Block whenever she switches stance.
- **Playstyle:** switches between three stances (**Four Sword**, **Fist Blade**, **Entropy**) and builds **Clarity**; reaching the threshold forces Entropy, a stance with powerful HP-costing cards.
- **Crew (pop-musician names):** Belt, Riff, Encore, Harmony, Amp.

### Broderick — Wolf Candy (werewolf rifleman) — 80 HP
- **Look:** a werewolf with a grey wolf head; musket-era French soldier's uniform, no hat; abnormally short; golden rifle. Uniform colors not yet specified.
- **Traits — Lunar Longevity:** heals 3 HP on his 2nd Claw attack each turn. **Always Armed:** loads a Plain bullet when his clip is empty at turn start.
- **Playstyle:** loads bullets into a clip (max 4) — **Fire** (5 dmg + Enflame), **Plain** (3 dmg + Block), **Magic** (2 dmg + draw) — then fires them; also has Claw attacks. **Full Moon** temporarily turns every bullet card into a Claw attack for the rest of the combat.
- **Crew (famous-dog names):** Pluto, Yeller, Lassie, Cerberus, Scrappy.

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

### Screen layout (1000 × 700 canvas)
- Top strip: captain-specific info, Enchant, log, Gear row.
- Combat row at y = 280: player at x = 150; up to 3 enemies spread between x = 470 and x = 830, facing the player.
- Hand of cards along the bottom (y ≈ 600); the area right of x = 800 is reserved for the End Turn button.

---

## 6. Where sprites plug in

Characters are currently placeholder rectangles, about 110 × 150 px:

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
5. Captains face right and enemies face left; use `setFlipX(true)` instead of generating two directions.

Sprite specs (from the art brief): one PNG sheet per character, uniform grid, transparent background, 96×128 or 128×128 frames, feet anchored at the same point in every frame.

**Art priority:** 3 captains → 11 bosses → 21 elites → 23 commons. Start with one captain's idle animation and get it working in-game before generating more.

---

## 7. Creator's standing rules

- Discuss changes before implementing them.
- No "barnacle" anywhere in the game.
- Use a candy motif when naming new things.
- Captain appearance comes from the creator; don't invent new looks.

## 8. Open items

- Art style line in the art brief (pixel resolution, outline, palette) is not yet decided.
- Riley's weapon and Broderick's uniform colors are not yet specified.
- Enemy visual descriptions are proposals, not reviewed designs.
- Six act-specific events from the original plan were never built.

## 9. Running it

Open `index.html` through a web server (it is hosted on GitHub Pages). It needs an internet connection to load Phaser from the CDN. Save/resume uses the browser's localStorage.
