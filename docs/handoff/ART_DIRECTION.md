# Tremendous Sea — Art Direction

Everything in this document has been approved by the game's creator. Follow it exactly and ask before deviating.

---

## 1. Master style prompt

Start every PixelLab generation with this text, then add the act mood (section 3) and the asset's own description.

> Pixel art game asset. Bold, clean style: solid black outer outline with darker colored inner lines, slightly stylized proportions with slightly larger head and hands, highly detailed with dithered shading, single light source from the top-right, crisp readable silhouette, transparent background. Limited palette of about 32 colors. Setting: a pirate-fantasy ocean where candy is weaponized; candy materials such as hard-candy shine, taffy, gummy, chocolate and sugar glass appear on pirate and sea-creature designs.

After the Phase 0 reference image is approved, also attach it as the **style reference image** for every generation.

---

## 2. Style rules

| Element | Rule |
|---|---|
| Overall | Bold and clean, as detailed as that style allows |
| Brightness | Balanced: neither washed out nor gloomy (Act 3 excepted) |
| Outlines | Black on the outer silhouette; darker shades of each color for inner lines |
| Proportions | Slightly stylized: slightly larger heads and hands |
| Shading | Dithering for texture |
| Light | One source, top-right, on every asset |
| Effects (fire, magic, impacts) | Glowing, with light bloom |
| Animation | Smooth and fluid |
| Palette | About 32 colors, one shared base palette; each act shifts the mood |
| Candy textures | Vary by material: glossy hard candy, soft taffy, translucent gummy, matte chocolate, and so on |
| Backgrounds | Muted and lower contrast than characters so characters stand out |

---

## 3. Act moods (add one line to every prompt)

- **Act 1, Ocean of Tears:** classic swashbuckling open-sea adventure. Sea blues, weathered wood, sailcloth whites and warm sunlight; candy appears only in small touches.
- **Act 2, Candied Ocean:** the same pirate adventure turned candy-land. Saturated candy colors and pastels, glossy sugar surfaces, sweets everywhere.
- **Act 3, The Eternal Dark:** a dark turn into near-horror. Drained, desaturated colors with eerie glowing accents; still candy-coated, but proportions and expressions are subtly wrong.

Captains, crews, ships and UI are not tied to one act. Use the Act 1 line for them.

---

## 4. Technical specs

- **Game screen:** 640×360 base resolution, scaled up only by whole numbers (2× to 1280×720, 3× to 1920×1080). Never resize assets.
- **Character frames:** 128×128 for captains and most enemies; 64×64 for small group enemies (gulls, bilge crabs, flying fish). Bosses use the largest frame PixelLab can animate on the creator's plan, with 128×128 as the minimum.
- **Ground line:** feet rest at the same height in every frame of every character (bottom center, 8 px above the frame's bottom edge). Heights should show the size differences: Branch is tall, Riley is short, and Broderick is shorter still.
- **Facing:** captains face **right**. Enemies are generated **facing left**. Do not mirror sprites, because that would flip the top-right lighting.
- **Animations:**

| Animation | Frames | Notes |
|---|---|---|
| idle | 6, looping | Breathing and sway |
| attack | 6–8 | Lunge toward the opponent |
| hurt | 3 | Recoil |
| death | 6 | Collapse or dissolve |

- **Files:** PNG with a transparent background. Frames may be generated one at a time; assemble each animation into one horizontal strip named `<asset-id>_<animation>.png`.
- **Group enemies:** one sprite per enemy type. Individual members get slight color shifts in code, not separate generations.

---

## 5. Captains

### Branch — Fireball Candy
- **Look:** tall and athletic; caramel-colored skin; low-cut fade haircut; shirtless with a tree tattoo across his torso from the chest down; white-and-purple camouflage shorts; combat boots with fire coming off the soles; both hands constantly on fire.
- **Fighting style:** sets enemies on fire, then detonates the flames.
- **Favorite candy:** Maple Candy.
- **Crew:** Evergreen Pirates. **Ship:** Kindleroot.
- **Animations:** idle, attack, hurt, death.

### Riley — No Candy
- **Look:** short, compact and powerful, with a gymnast's build and a shapely, curvy athletic figure: strong shoulders, defined arms, muscular legs. Dark chocolate complexion. Short white hair, styled and punk, spiky on top with shaved sides. A fitted, flattering robe cinched at the waist with a high leg slit for movement, trimmed in yellow, blue and purple; regal, but made for fighting.
- **Weapons:** four swords, one red, one green, one blue, and one golden.
- **Stances**, each with its own idle and attack animation:
  - **Four Sword:** she holds two swords while the other two float behind her.
  - **Fist Blade:** all four swords float behind her, one fist raised.
  - **Entropy:** the swords merge into one very large golden sword floating above her.
- **Shared animations:** hurt, death.
- **Fighting style:** switches stances and builds Clarity.
- **Favorite candy:** Pop Candy.
- **Crew:** Pop Rock Pirates. **Ship:** Stage.

### Broderick — Wolf Candy
- **Look:** a werewolf with a grey wolf head; blue musket-era French soldier's uniform with gold accents, no hat; abnormally short; golden rifle.
- **Full Moon form** (a full second animation set): a large werewolf with pink fur; his clothes stretched over the bigger body; musket slung on his back; claws at the ready.
- **Fighting style:** loads bullets into his rifle and fires them; claw attacks; transforms under the Full Moon.
- **Favorite candy:** Butterscotch.
- **Crew:** Moonshot Pirates. **Ship:** Howling Shell.

**Captain portraits:** a bust of each captain for the captain select screen.

---

## 6. Crews (portraits only)

**Casting rule for crews:** human crew members are all Black; everyone else is a bipedal animal.

### Evergreen Pirates (Branch)
| Name | Role | Look |
|---|---|---|
| Pine | First Mate | Broad-shouldered Black man in a pine-green longcoat, pinecones braided into his beard; amber rock candy crystallizes on his forearms |
| Christmas | Cook | Bipedal reindeer in a peppermint-striped apron, candy-cane ornaments hanging from his antlers, soup ladle worn like a cutlass |
| Sage | Doctor | Old bipedal tortoise whose shell is fitted like a medicine cabinet with little drawers of sugar pills; herb pouches; round spectacles |
| Thistle | Demolitions | Young Black woman with wild, puffy purple hair, scorched goggles and a bandolier of cherry-bomb candies |
| Willow | Sniper | Tall bipedal grey heron in a cloak of willow leaves, long rifle on a licorice-rope sling |

### Pop Rock Pirates (Riley): an all-girl, 2000s R&B-style group
Coordinated outfits like a girl group on an album cover: matching pieces, but each member has her own color and style. Fashion: bandanas, hoop earrings, chokers, rhinestones, cargo pants, cropped jackets.

| Name | Role | Look | Color |
|---|---|---|---|
| Belt | First Mate, lead vocalist | Tall and strong; cropped captain's jacket over a rhinestone crop top; translucent gummy-bear armor on her shoulders; championship-belt sash | Red |
| Riff | Swordswoman | Sharp and confident; low-rise cargo pants and a pirate bandana; sword shaped like a microphone stand with a lollipop-swirl hilt | Blue |
| Encore | Musician, showstopper | Glamorous; big curly blowout; iridescent hard-candy feather boa; cropped ringmaster's coat | Purple |
| Harmony | Doctor, backing vocals | Warm and steady; long braids tipped in sugar beads; big headphones; medic's sash; boombox-shaped medical kit | Green |
| Amp | Entropy specialist, hype girl | Wild card; spiky two-tone buns; candy-chain choker; speaker on her back crackling with popping-candy sparks | Yellow |

### Moonshot Pirates (Broderick)
| Name | Role | Look |
|---|---|---|
| Pluto | Rifleman | Sleek Doberman in a blue naval coat with a star-chart bandana and a long rifle |
| Yeller | First Mate | Basenji with a tower shield made from a giant jawbreaker and a brass megaphone |
| Lassie | Mechanic | Dachshund in goggles with a long tool belt of candy-wrapper tools |
| Cerberus | Brawler | Huge Rottweiler wearing two snarling dog-head shoulder pads (three heads total), claws coated in red hard candy |
| Scrappy | Doctor | Scruffy little terrier medic with bandages, a stitched eyepatch and a lunchbox-style med kit full of gumdrops |

---

## 7. Ships (backgrounds for every non-boss fight)

Each captain's non-boss fights take place on their own ship's deck. The deck itself never changes; only the sky and sea around it change by act. Keep a flat, open strip of deck for the fight, with masts and props muted behind it.

- **Kindleroot (Branch):** a living-wood ship whose hull and mast grow from one giant tree. Branches form the rigging and leaves fill the sails. Deck planks are scorched dark with ember-glowing cracks; iron braziers and fire lanterns line the rails; small potted saplings tended by the crew. Warm and cozy, with a fire hazard built in.
- **Stage (Riley):** half dojo, half concert stage. A clean, polished deck with a training mat at center and sword racks along the sides; her three stance symbols painted on the floor; yellow, blue and purple banners; stage lights and speakers rigged to the masts.
- **Howling Shell (Broderick):** a musket-era military frigate. Cannon ports, powder kegs and stacked ammunition crates; a wolf figurehead mid-howl at the bow; brass fittings that match his golden rifle; a large moon emblem on the mainsail; kennel-style crew quarters.

**Skies and seas, one set per act:** Act 1 classic open ocean under a bright sky; Act 2 the same ocean turned candy-colored; Act 3 a dark, eerie sea under an unnatural sky.

**Oasis (rest) screen:** a campfire scene on the current captain's deck.

---

## 8. Boss arenas

Each keeps a flat, open fighting area with a muted backdrop.

| Act | Boss | Arena |
|---|---|---|
| 1 | Failed Dread Pirate Scott | His oversized flagship, half-sunk and tilting. Seawater creeps across the planks and the water level rises as he weakens. |
| 1 | Rejected Sirens | A jagged rock outcrop at sea in moonlit mist, wrecked rowboats around the base, a cracked rock ledge they sing from like a stage |
| 1 | Krabby Twins | A shallow tidepool cove at low tide with giant shells, kelp and their shared shell home in the background |
| 2 | Admiral Aflam | The flag deck of a gleaming Supreme Oversight Navy flagship: rows of candy-cane cannons, polished brass, and the navy's flag |
| 2 | University of Fish | A sunken lecture hall of coral and sugar glass, with tiered seats and chalkboards of equations |
| 2 | Armored Tentacle | A raft of hard-candy wreckage over a churning syrup whirlpool |
| 2 | King in Green | The F&J Emporium's back vault, piled with stolen coins and candy around a green velvet throne |
| 3 | Concept of Sweet | A pastel candy plaza that's too perfect and too still, under a sky with no sun |
| 3 | Yellow Yonka | A sprawling confectionery factory floor: conveyor belts, bubbling vats, sticky mustard yellow everywhere, recipe pages pinned to every surface |
| 3 | Hours That Pass | The inside of a dripping wax clock tower, gears and hands turning out of sync, the floor one giant clock face |
| 3 | True Yonk's Shadow | The factory collapsing into the sea floor of the Eternal Dark; candy coating peeling off the world; a vast shape in the black. It gets darker with each phase. |

---

## 9. Supreme Oversight Navy

The government's navy.
- **Emblem:** a single watchful eye whose iris is a glossy gumball, over a crossed anchor and candy cane, in navy blue and white with gold trim.
- **Wearers:** Admiral Aflam, Scurvy Gum Marine, Flying Fish Marine Unit, Flying Fish Fathers and Caramel Crust Soldier.

---

## 10. Enemies

All enemies face left. The ×2 and ×3 marks mean one design, recolored slightly per member.

### Act 1 commons
- **Grunt Pirate:** a scruffy deckhand in a striped shirt and bandana, swinging an oversized cutlass and chewing a wad of toffee.
- **Reef Crab:** a chunky crab with one oversized claw, its back crusted with coral that glints like rock candy.
- **Squabbling Gull (×2, small):** a scruffy gull in a tiny bandana, mid-squabble over a stolen lollipop.
- **Sand Viper Fish:** a lean, fanged fish frozen mid-lunge, with sandy scales that shimmer like sugar grains.
- **Drowned Sailor:** a waterlogged blue-grey sailor draped in seaweed, with rotting saltwater taffy dangling from his pockets.
- **Mermaid Enchantress:** spiraling hypnotic eyes and a lollipop-swirl pattern running down her tail.
- **Bilge Crab Swarm (×3, small):** a small dark crab carrying a bottle cap or candy wrapper as a shield.

### Act 1 elites
- **Middle Class Merman:** a puffed-up merman flexing in gaudy jewelry, his rings made of gummy candy, with a tacky pompadour.
- **Rock Candy Brute:** a hulking brute in thick amber rock-candy armor, the crystals cracking and regrowing.
- **Reef Witch:** a gaunt witch in kelp and shell-crusted robes with one clouded eye, holding a driftwood staff topped with sea-glass candy.
- **Iron-Hulled Coast Bandit:** a bandit whose lower half is rusted, riveted ship hull, with a small cannon at his hip.
- **Drowned Choir (×3):** drowned choir singers in tattered robes, water pouring from their open mouths.
- **Anchor Brothers (×2):** brawny brothers in striped shirts, chained together by an anchor chain.

### Act 1 bosses
- **Failed Dread Pirate Scott:** a would-be pirate legend in a coat and hat a size too grand for him, gripping a cutlass with more bravado than skill.
- **Rejected Sirens (×3):** sirens with cracked voices and tangled hair, huddled together, each singing slightly off-key.
- **Krabby Twins (×2):** hermit-crab pirates sharing one huge ornate shell. **Extra pose:** shell closed, for block turns.

### Act 2 commons
- **Scurvy Gum Marine:** a Supreme Oversight Navy marine in navy blue and gold with the emblem, blowing a huge bubblegum bubble.
- **Taffy Tongue Spectre:** a pastel ghost whose long, stretchy taffy tongue droops to the floor.
- **Gummy Bear Golem:** a hulking golem of stacked translucent gummy bears that jiggle when it moves.
- **Lobster Bisque Knight:** a knight in lobster-shell armor glazed like creamy bisque, steaming, with a ladle-shaped lance.
- **Chocolate Wraith:** a glossy, melting chocolate figure that drips and re-forms as it moves.
- **Deadly Kendo Mermaid:** kendo armor made of hard candy and a candy-cane practice sword.
- **Flame Dolphins (×3):** dolphins whose fins flicker with caramelizing sugar flames.
- **Flying Fish Marine Unit (×3, small):** winged fish in Supreme Oversight Navy marine caps with the emblem.

### Act 2 elites
- **Sea Floor Boss Man:** a barrel-chested crime boss in a licorice pinstripe suit, chewing a rolled-chocolate cigar, with the undertow swirling at his feet.
- **Gummy Worm Disciple:** a robed cultist whose arms are braided gummy worms, slick with a sticky, corroding sheen.
- **Caramel Crust Soldier:** a Supreme Oversight Navy soldier encased in a caramel shell that's cracking and flaking.
- **Nepo Baby Merman (×2):** spoiled young mermen in candy-jewel crowns and sugar-pearl necklaces.
- **Sour Zoina:** a lean, sharp fighter dusted in sour-sugar crystals, with a puckered scowl and crystal blades.
- **Flying Fish Fathers (×3):** older, mustached flying fish in Supreme Oversight Navy officer coats.
- **Giant Inferno Shark:** a massive shark with caramelizing sugar flames along its fin and jaws glowing like molten toffee.

### Act 2 bosses
- **Admiral Aflam:** the most commanding officer of the Supreme Oversight Navy. A spotless navy-and-gold uniform, candy-coated medals across his chest, the emblem on his hat, and an unshakable posture.
- **University of Fish (×3):** scholarly fish in tiny academic robes and spectacles, each holding a book of a different color.
- **Armored Tentacle:** one enormous tentacle rising from the syrup, plated in overlapping shell armor. **Extra pose:** half-submerged, for defensive turns.
- **King in Green:** a greedy king swathed entirely in green, with a crown of stolen jewels, seated on his hoard. The treasure pile behind him grows with each phase; build it as a separate background layer.

### Act 3 commons
- **Melting Smile:** a mascot whose painted smile is sliding off a face that's the wrong shape underneath.
- **Sugarplum Eye:** one huge, glossy purple candied eye floating in place and never blinking.
- **Wrong Number Nougat:** a nougat bar whose segments don't add up, its geometry subtly impossible.
- **Static Gumdrop:** a gumdrop that flickers between slightly different shapes, its edges doubled.
- **Please Stop Smiling:** a stiff mascot costume with glassy, unmoving eyes and a fixed painted grin, standing far too still.
- **Aftertaste:** a burnt-sugar haze in a roughly human shape, leaving a faint trail behind it.
- **Torn Recipe Card:** a scrap of Yellow Yonka's recipe book with crude limbs and a mouth, its ink bleeding like a wound.
- **Too-Sweet Choir (×2):** singers with mouths opened slightly wider than a throat should allow.

### Act 3 elites
- **Silence Wearing a Smile:** a featureless candy-porcelain doll with nothing on its face but a painted smile.
- **Uncounted Veil:** a towering shape under a translucent wrapper-cloth veil. **Extra form:** the veil torn away, revealing a smaller cluster of mismatched eyes and limbs.
- **Wax-Sealed Choir (×3):** singers whose mouths are sealed shut with dripping candle wax.
- **Unbounded Truth:** a figure with too many joints and limbs that stretch past the edge of its frame.
- **Returnal Scion:** a regal figure with a slowly rotating halo. The halo's color changes with its current weakness; tint it in code.
- **Djinnball Jar:** an ornate jar with a swirling captive djinn pressing against the glass, sealed with a wax stopper.
- **Double Scoop:** a two-scoop ice cream creature with an unstable seam. **Extra forms:** it splits into Vanilla (pale and smooth) and Cookie Dough (lumpy and brown).
- **Appetite Concept:** a shapeless silhouette around one ever-open mouth ringed with sugar teeth.

### Act 3 bosses
- **Concept of Sweet:** a crowned figure built from shifting candy geometry, cheerful on the surface. **Extra:** three faces that rotate depending on whether it's denying attack, healing or block.
- **Yellow Yonka:** a theatrical confectioner in a mustard-yellow coat and top hat, with a showman's grin that's slightly too wide and a recipe book that writes itself.
- **Hours That Pass:** a tall, thin figure shaped like a clock hand, dripping wax where numbers should be, moving slightly out of sync with everything else.
- **True Yonk's Shadow (4 phases, each its own sprite):**
  1. A towering, candy-coated silhouette, hard and sealed, looming over the collapsing factory.
  2. Hands reaching out to grab coins and candy.
  3. Bloated with its hoard.
  4. The coating peels away completely to reveal the vast, dark true form, with a mouth that reflects the player back at them.

---

## 11. UI

**Material:** candy (wrappers and sugar glass). **Fonts:** Pixelify Sans for headers, Nunito for card and body text, IM Fell English SC for the logo's non-candy letters. All three are free Google Fonts; load them, don't generate text.

### Cards
- **Frames, one per captain:**
  - Branch: red-orange hot-cinnamon hard candy, ember glow at the corners, a thin vine of leaves wrapping the border.
  - Riley: clear, crystal-like sugar glass trimmed in yellow, blue and purple, with her three stance symbols at the corners.
  - Broderick: golden butterscotch toffee with twisted wrapper ends shaped like braided uniform cord, and a small moon at the top.
- **Curse card frame (Yellow Yonka's Cursed Candy):** mustard-yellow wax paper, torn at the edges, stained with sticky drips, stamped with his seal. It looks like a page torn from his recipe book.
- **Card back:** a twisted candy wrapper with the logo's peppermint T and gummy-worm S as a monogram, tinted in each captain's color.
- **Card art:** none. Each card shows a shared type icon: **sword** (Attack), **shield** (Block), **scroll** (Skill), **star** (Power).
- **Rarity:** a colored gem in the same spot on every frame. Grey for Common, blue for Uncommon, gold for Rare, glowing purple for Djinn. Generate one gem and recolor it in code.

### Combat UI
- **HP and Block:** classic bars with candy textures. **Energy:** a classic orb with a candy texture.
- **Branch:** no extra display.
- **Riley:** a Clarity gauge and stance banners.
- **Broderick:** a bullet clip showing each loaded bullet (Fire, Plain, Magic).
- **Pile icons:** treasure chest (draw), barrel (discard), whirlpool (exhausted cards).
- **Damage numbers:** crisp white numbers with a sharp impact flash.
- **Status effects and enemy intents:** keep the current emoji for now.
- **Gear icons:** each of the 61 items drawn small inside a round porthole frame. The rim is colored by rarity using the same colors as the card gems; generate one porthole and recolor it in code.

### Screens
- **Title screen:** comes before captain select. An open sea with a candy-colored horizon behind the logo.
- **Logo:** "Tremendous Sea." The **T** is a peppermint-striped candy stick and the **S** is a coiled gummy worm, each generated as its own image. The remaining letters are set in IM Fell English SC.
- **Captain select:** a portrait of each captain beside a stats panel listing name, fighting style, favorite candy and crew members.
- **Map:** a different look per act. Act 1 is a weathered parchment sea chart with ink routes and a compass rose. Act 2 is the same chart candied: sugar paper, licorice-rope routes, sprinkle-dotted islands. Act 3 is the chart going wrong: darkening, rotting paper, ink bleeding into vein-like routes, melting edges.
- **Map node icons:** pirate symbols, such as a skull for elites and a chest for treasure or shop.
- **Shop (F&J Emporium, short for Flotsam & Jetsam):** a small, cozy candy shop with one wooden counter, shelves of candy jars on the wall behind it, and warm lantern light. Behind the counter stand:
  - **Flotsam:** a shrimp, small and round, cheerful and messy, in a patched coat with stuffed pockets.
  - **Jetsam:** a lobster, tall and neat, strict, with an apron and a monocle, holding the ledger in one claw.
- **Events:** a shared backdrop per act with a text panel.
- **Crew story moments:** the crew member's portrait beside the text.
- **Victory and defeat:** a big candy-styled banner over the dimmed battle.
- **Pause menu:** a sugar-glass panel with a ship's wheel emblem at the top and buttons shaped like wrapped candies (Resume, Settings, Abandon Run).

---

## 12. Prompt template

```
[Master style prompt, section 1]
[Act mood line, section 3]
[Asset description from this document]
[Size and facing from ASSET_LIST.md, e.g. "128x128, side view, facing left"]
```

For animations, start from the approved still image and describe only the motion, for example "idle: gentle breathing, flames flicker on both hands".
