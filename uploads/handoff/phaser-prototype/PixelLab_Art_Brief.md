# The Tremendous Sea — Art Brief for PixelLab

This brief explains the game and what art it needs, so sprites can be generated consistently. It is an art brief, not a design document: PixelLab's AI makes images and animations, so the game's card and combat mechanics are summarized only where they affect visuals.

## How to use this file

- Don't paste the whole document into one prompt. Prompt boxes are short. Use the sections as a reference and paste one character's description at a time.
- **Prompt template:** `[Style Anchor] + [one character description] + [Technical Requirements]`
- Your own drawn sprites are the source of truth. Upload them as the reference image and use the descriptions below only to describe motion and tone, not to redesign the character.
- Generate in this order: captains, then bosses, then elites, then commons. The test run should be one captain's idle animation, taken all the way into the game.

---

## 1. The game in brief

**The Tremendous Sea** is a roguelite deckbuilder: the player picks a captain, sails through a branching map, and fights turn-based battles using a hand of cards. It has 3 captains and 3 acts, and about 55 enemies across the acts. It is being built as a browser game in Phaser (HTML5 canvas).

**Setting:** a pirate-fantasy ocean where candy has been weaponized and something genuinely wrong hides beneath the sweetness. Candy is the surface motif (hard-candy shine, taffy stretch, gumdrop translucency, chocolate melt). The tone gets darker as the player progresses.

| Act | Name | Visual tone |
|---|---|---|
| 1 | Ocean of Tears | Scrappy, worn, lightly cursed pirate fare. Mostly ordinary creatures with a little candy. |
| 2 | Candied Ocean | The candy motif pushed to excess: oversaturated, glossy, slightly too much. |
| 3 | The Eternal Dark | Still wearing candy, but anatomy, proportions, and expressions underneath are subtly wrong. Cosmic horror in a sweet coating. |

---

## 2. Style Anchor (start every prompt with this)

> A character from a pirate-fantasy world where candy has been weaponized and the deep ocean hides something wrong beneath the sweetness. Bold, readable silhouette. Candy textures (hard-candy shine, taffy stretch, gumdrop translucency, chocolate melt) applied to creature and pirate anatomy rather than replacing it.

**Art style to match:** `[FILL IN — your artist's style: pixel resolution, outline weight, palette, shading approach. Replace this line before generating anything.]`

---

## 3. Technical requirements

These come from how the game screen is laid out.

- **View:** side view. In battle the player's captain stands on the left and enemies stand in a horizontal row on the right, all on the same ground line, facing each other. Up to 3 enemies can be on screen at once.
- **Facing:** captains face **right**, enemies face **left**. One facing direction per character is enough, because the engine can mirror a sprite.
- **Canvas size:** the game currently draws each character in roughly a **110 × 150 px** area on a 1000 × 700 screen (portrait-leaning). PixelLab's animation tools top out around **128 × 128**, so work at **96 × 128 or 128 × 128** per frame and scale up in-engine. Large bosses should fill their frame rather than use a bigger canvas.
- **Sheet format:** one PNG sprite sheet per character, **uniform grid, transparent background**. Tell me the exact frame width, frame height, and rows × columns so I can slice it.
- **Anchor point:** feet (ground contact) at the same position in every frame. Drift here shows up as a floating shake in-game.
- **Animation states per character:**

| State | Frames | Notes |
|---|---|---|
| Idle | 4–6, looping | Subtle breathing or sway |
| Attack | 4–6 | Plays when the character hits; a short lunge toward the other side |
| Hurt | 2–3 | Brief recoil (the game also flashes and shakes the sprite) |
| Death | 4–6 | Collapse or dissolve (the game also fades the sprite) |

---

## 4. Captains (generate first)

Appearance below is as described by the game's creator. Gameplay notes are included only to explain props and effects.

**Branch — Fireball Candy (fire)**
- Tall, athletic build; caramel-colored skin; low-cut fade haircut
- Shirtless, with a tree tattoo across his torso from the chest down
- White-and-purple camouflage shorts
- Combat boots with fire coming off the soles
- Both hands constantly on fire
- Overall feel: relaxed, confident fire-wielder

**Riley — no candy (swords and focus)**
- Short, gymnast's build; Black woman with a dark chocolate complexion
- Spiky white hair, almost punk-rock
- A robe in a yellow, blue and purple palette that reads regal but humble
- Weapon: `[not yet specified — her cards use sword and martial-arts stances]`

**Broderick — Wolf Candy (werewolf rifleman)**
- A werewolf with a grey wolf head
- Dressed in a musket-era French soldier's uniform, no hat
- Abnormally short
- Carries a golden rifle
- Uniform colors: `[not yet specified]`

**Height matters:** Branch is tall, Riley is short, and Broderick is shorter still. Keep all three on the same frame size and ground line so the height difference shows in-game.

---

## 5. Priority order

1. **3 captains** (always on screen).
2. **Bosses** (11 total, the moments that need the most presence).
3. **Elites** (about 21).
4. **Commons** (about 23).

Commons and elites can stay simpler (idle plus hurt) if time runs short.

**Crew members** (15 total, named above) appear only in story events, not combat, so they are optional and lowest priority.

---

## 6. Enemy roster (visual descriptions)

**These are proposals, not final designs.** They were written from each enemy's name and in-game behavior and have not been reviewed yet; edit or replace any of them. Pair each with the Style Anchor and Technical Requirements above.

## ACT 1: Ocean of Tears — Commons

**Grunt Pirate** — An unremarkable, tired-looking pirate deckhand in patched, salt-stained clothing. No candy motif — the baseline "ordinary person" this world is otherwise strange against.

**Reef Crab** — A crab fused with a chunk of hardened reef coral on its back like a natural shield, mottled orange and white, one oversized claw.

**Squabbling Gull** — A pair of scruffy, mean-eyed seagulls perpetually squabbling over the same scrap, wings half-raised at each other, always shown as a bonded pair.

**Sand Viper Fish** — A lean, whip-thin fish with an exaggerated sinuous body built for a darting lunge-and-retreat motion, dull sandy camouflage scales.

**Drowned Sailor** — A waterlogged, bloated sailor's corpse animated and upright, skin a sickly blue-gray, clothing heavy and dripping, movements stiff.

**Mermaid Enchantress** — A mermaid with an unsettling, too-wide smile and swirling, hypnotic eyes, iridescent scales that seem to spiral rather than lie flat.

**Bilge Crab Swarm** — A cluster of three small, identical dark bilge crabs skittering together as one unit, scuttling and overlapping.

## ACT 1: Ocean of Tears — Elites

**Middle Class Merman** — A merman in ostentatious, slightly tacky finery — gaudy jewelry, an overdone pompadour — built like he's compensating for something, chest puffed.

**Rock Candy Brute** — A hulking brute encased in thick, translucent amber rock-candy armor plating, fractured and crystalline, visibly hardening in real time.

**Reef Witch** — A gaunt witch draped in kelp and shell-crusted robes, one eye clouded, carrying an aura of slow, patient exhaustion she inflicts on others.

**Iron-Hulled Coast Bandit** — A bandit whose lower body has been crudely fused with rusted ship-hull plating, standing unnaturally steady no matter the terrain.

**Drowned Choir** — Three drowned figures standing shoulder to shoulder, mouths open in a silent, synchronized hymn, water endlessly pouring from their throats.

**Anchor Brothers** — Two brawny brothers chained together at the wrist by a shared ship's anchor chain, moving and fighting as a single coordinated block.

## ACT 1: Ocean of Tears — Bosses

**Failed Dread Pirate Scott** — A pirate captain whose grand coat and captain's hat don't match his uncertain, over-his-head expression — all bravado, visibly out of his depth, tide rising unnaturally around his boots.

**Rejected Sirens** — Three sirens with cracked, imperfect voices, huddled close, each one singing off-key in a way that's somehow still dangerous.

**Krabby Twins** — Two identical hermit-crab pirates sharing one oversized ornate shell between them, always positioned back-to-back or shoulder-to-shoulder.

---

## ACT 2: Candied Ocean — Commons

**Scurvy Gum Marine** — A grizzled marine chewing a wad of bubblegum the size of a fist, uniform patched with candy-wrapper foil instead of proper fabric.

**Taffy Tongue Spectre** — A translucent ghost with an impossibly long, stretching taffy-pink tongue that droops and pulls like real taffy, rest of the body faint and wispy.

**Gummy Bear Golem** — A lumbering golem built entirely of stacked, fused gummy bears in mismatched candy colors, faintly jiggling with each step.

**Lobster Bisque Knight** — A knight in armor the color and sheen of thick bisque soup, faintly steaming, shell-like plating with a soft, simmered texture.

**Chocolate Wraith** — A wraith whose form is melting dark chocolate, dripping and reforming continuously, leaving a glossy trail.

**Deadly Kendo Mermaid** — A mermaid duelist wielding a candy-cane-striped kendo blade, sharp posture, competitive and precise.

**Flame Dolphins** — A pair of dolphins with fins that flicker like candle flame, water around them faintly steaming, linked by a shared inner fire.

**Flying Fish Marine Unit** — A squadron of small winged flying fish in tiny improvised marine uniforms, darting in tight formation.

## ACT 2: Candied Ocean — Elites

**Sea Floor Boss Man** — A barrel-chested figure standing at the ocean floor with an undertow visibly curling around his boots, unbothered, arms crossed.

**Gummy Worm Disciple** — A robed cultist whose limbs are braided gummy worms, twisting and coiling with a corroded, sticky sheen where they've started to degrade.

**Caramel Crust Soldier** — A soldier encased in a hardened caramel shell that's visibly cracking and flaking away at the edges, revealing corrosion beneath.

**Nepo Baby Merman** — An entitled young merman in flashy, undeserved finery, trailed by an equally overdressed twin, both radiating smug over-confidence.

**Sour Zoina** — A lean, sharp-featured figure with a puckered, permanently sour expression, skin dusted with visible sour-candy crystals that seem to draw blood on contact.

**Flying Fish Fathers** — Three older, mustachioed flying fish in stern paternal poses, wings broader and more weathered than their junior counterparts.

**Giant Inferno Shark** — A massive shark wreathed in real flame along its dorsal ridge, water boiling where fire meets sea, jaws lit from within.

## ACT 2: Candied Ocean — Bosses

**Admiral Aflam** — A decorated, commanding admiral whose medals are candy-coated and whose composure is total — the most competent, dangerous authority figure in the game.

**University of Fish** — Three identical scholarly fish in tiny academic robes and spectacles, each holding a different-colored book, standing in formal formation.

**Armored Tentacle** — A single massive tentacle erupting from the water, plated in overlapping shell-like armor segments, the rest of its owner never visible.

---

## Boss-Only: F&J Emporium Guardian

**King in Green** — A hoarding, regal figure entirely swathed in green — cloak, crown, jewels — seated as if on a throne made of stolen coin and candy, expression greedy and watchful.

---

## ACT 3: The Eternal Dark — Commons

*(The candy motif stays, but something underneath should read as subtly wrong — off proportions, too many joints, expressions that don't quite match the moment.)*

**Melting Smile** — A mascot-shaped figure whose painted smile is visibly sliding down off a face that isn't shaped quite right underneath.

**Sugarplum Eye** — A single large candied eye, glossy purple-pink, floating unsupported, unblinking, always facing the viewer no matter the angle.

**Wrong Number Nougat** — A nougat bar creature whose visible segment-lines don't add up to a sensible count, geometry subtly impossible.

**Static Gumdrop** — A gumdrop that seems to flicker between two or three slightly different shapes when viewed too long, edges faintly doubled.

**Please Stop Smiling** — A stiff, unmoving mascot-suit figure with a painted smile and glassy, motionless eyes, posture just a little too still.

**Aftertaste** — A faint, lingering humanoid haze the color of burnt sugar, trailing behind wherever it's already been, never quite gone.

**Torn Recipe Card** — A fragment of parchment given crude limbs and a mouth, ink bleeding like a wound, hungry and searching for the rest of itself.

**Too-Sweet Choir** — A pair of figures singing in a harmony pitched too perfectly, mouths open slightly wider than a real throat should allow.

## ACT 3: The Eternal Dark — Elites

**Silence Wearing a Smile** — A featureless, doll-like figure with a single painted smile and no other facial detail, unnervingly serene.

**Uncounted Veil** — A shrouded figure behind a shifting, semi-transparent veil that seems to show a different, larger shape depending on the angle.

**Wax-Sealed Choir** — Three sealed, wax-masked singers standing in a tight triangle, seams and drips of hardened candle-wax sealing their mouths shut.

**Unbounded Truth** — A figure that seems to be actively growing as you look at it, joints and proportions stretching slightly beyond what the frame can hold.

**Returnal Scion** — A regal, cyclical figure wreathed in four alternating elemental motifs (arcane shimmer, blunt stone, honed blade, open flame) that rotate around it like a slow halo.

**Djinnball Jar** — A large ornate glass jar containing a compressed, swirling captive djinn, sealed with a candy-wax stopper, energy visibly trying to escape.

**Double Scoop** — A two-scoop ice-cream-shaped creature, one side vanilla-pale and one side chocolate-dark, faintly unstable at the seam where the two halves meet.

**Appetite Concept** — A vague, hungry silhouette with no fixed shape, defined mainly by an open, always-eating mouth at its center.

## ACT 3: The Eternal Dark — Bosses

**Concept of Sweet** — An abstract, crowned figure made of shifting candy-geometry, radiant and cheerful on the surface, its "smile" rotating between different expressions that don't track with anything happening around it.

**Yellow Yonka** — A theatrical, top-hatted confectioner in a mustard-yellow coat, showman's grin fixed too wide, holding a recipe card that seems to write itself.

**Hours That Pass** — A tall, thin figure built like a candy-cane clock hand, dripping wax where numbers should be, moving slightly out of sync with everything around it.

**True Yonk's Shadow** — A towering, half-formed silhouette looming behind and above where Yellow Yonka stood, candy-coating peeling away in patches to reveal something vast, dark, and genuinely ancient underneath.
