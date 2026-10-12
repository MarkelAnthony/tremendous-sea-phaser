# Tremendous Sea — Asset Checklist

Every asset to generate, in build order. Sizes are exact pixel sizes: never resize. Designs are in `ART_DIRECTION.md`. Check items off as they're approved in-game.

**Animation set** = idle (6 frames, loop), attack (6–8), hurt (3), death (6). Files go in the listed folder as `<id>_<animation>.png` strips.


---

## Phase 0 — Style reference

| ✓ | ID | Folder | Size | Notes |
|---|---|---|---|---|
| ☐ | `branch_reference` | assets/style | 128×128 | Still image of Branch, facing right. Once approved, it's the style reference for every later generation. |

---

## Phase 1 — Vertical slice (Branch, Act 1)

### Captain

| ✓ | ID | Folder | Size | Animations |
|---|---|---|---|---|
| ☐ | `branch` | assets/captains | 128×128 | full set, facing right |

### Background

| ✓ | ID | Folder | Size | Notes |
|---|---|---|---|---|
| ☐ | `kindleroot_deck` | assets/backgrounds/ships | 640×120 (build in pieces if needed) | Deck foreground with a flat fighting strip |
| ☐ | `kindleroot_props` | assets/backgrounds/ships | pieces | Mast, sails, braziers, saplings, muted |
| ☐ | `sky_act1`, `sea_act1` | assets/backgrounds/skies | 640×180 / 640×80, tileable horizontally | Act 1 open ocean |

### Act 1 commons

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `grunt_pirate` (Grunt Pirate) | 128×128 | full set, facing left |  |
| ☐ | `reef_crab` (Reef Crab) | 128×128 | full set, facing left |  |
| ☐ | `squabbling_gull` (Squabbling Gull) | 64×64 | full set, facing left | ×2 in fight: one sprite, recolored in code |
| ☐ | `sand_viper_fish` (Sand Viper Fish) | 128×128 | full set, facing left |  |
| ☐ | `drowned_sailor` (Drowned Sailor) | 128×128 | full set, facing left |  |
| ☐ | `mermaid_enchantress` (Mermaid Enchantress) | 128×128 | full set, facing left |  |
| ☐ | `bilge_crab_swarm` (Bilge Crab Swarm) | 64×64 | full set, facing left | ×3 in fight: one sprite, recolored in code |

### Act 1 elites

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `middle_class_merman` (Middle Class Merman) | 128×128 | full set, facing left |  |
| ☐ | `rock_candy_brute` (Rock Candy Brute) | 128×128 | full set, facing left |  |
| ☐ | `reef_witch` (Reef Witch) | 128×128 | full set, facing left |  |
| ☐ | `iron_hulled_coast_bandit` (Iron-Hulled Coast Bandit) | 128×128 | full set, facing left |  |
| ☐ | `drowned_choir` (Drowned Choir) | 128×128 | full set, facing left | ×3 in fight: one sprite, recolored in code |
| ☐ | `anchor_brothers` (Anchor Brothers) | 128×128 | full set, facing left | ×2 in fight: one sprite, recolored in code |

### Act 1 bosses

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `failed_dread_pirate_scott` (Failed Dread Pirate Scott) | 128×128 | full set, facing left | arena water level animated in code |
| ☐ | `rejected_sirens` (Rejected Sirens) | 128×128 | full set, facing left | ×3 in fight: one sprite, recolored in code |
| ☐ | `krabby_twins` (Krabby Twins) | 128×128 | full set, facing left | ×2 in fight: one sprite, recolored in code; + `block` pose (shell closed) |

### Act 1 boss arenas

| ✓ | ID | Folder | Size |
|---|---|---|---|
| ☐ | `arena_failed_dread_pirate_scott` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_rejected_sirens` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_krabby_twins` | assets/backgrounds/arenas | 640×360, in layers |

### Core UI

| ✓ | ID | Folder | Size | Notes |
|---|---|---|---|---|
| ☐ | `frame_branch` | assets/ui/cards | 72×100 | Hot-cinnamon candy frame |
| ☐ | `card_back_branch` | assets/ui/cards | 72×100 | Wrapper with T/S monogram; tint per captain in code |
| ☐ | `icon_attack, icon_block, icon_skill, icon_power` | assets/ui/icons | 16×16 each | Sword, shield, scroll, star |
| ☐ | `rarity_gem` | assets/ui/icons | 10×10 | One gem, recolored in code |
| ☐ | `bar_hp, bar_block` | assets/ui/icons | 9-slice pieces | Candy-textured bars |
| ☐ | `orb_energy` | assets/ui/icons | 32×32 | Candy-textured orb |
| ☐ | `pile_draw, pile_discard, pile_exhaust` | assets/ui/icons | 24×24 each | Chest, barrel, whirlpool |
| ☐ | `btn_end_turn` | assets/ui/menus | 9-slice pieces | Wrapped-candy button |
| ☐ | `impact_flash` | assets/ui/icons | 32×32, 4 frames | Sharp hit flash under damage numbers |

### Act 1 map

| ✓ | ID | Folder | Size | Notes |
|---|---|---|---|---|
| ☐ | `map_act1` | assets/ui/map | 640×360 | Parchment sea chart |
| ☐ | `node_fight, node_elite, node_boss, node_event, node_shop, node_oasis` | assets/ui/map | 24×24 each | Pirate symbols |

---

## Phase 2 — Riley and Broderick

| ✓ | ID | Folder | Size | Animations / notes |
|---|---|---|---|---|
| ☐ | `riley_foursword` | assets/captains | 128×128 | idle + attack, facing right |
| ☐ | `riley_fistblade` | assets/captains | 128×128 | idle + attack |
| ☐ | `riley_entropy` | assets/captains | 128×128 (sword may need the largest allowed frame) | idle + attack |
| ☐ | `riley` | assets/captains | 128×128 | hurt + death (shared by all stances) |
| ☐ | `broderick` | assets/captains | 128×128 | full set, facing right |
| ☐ | `broderick_fullmoon` | assets/captains | 128×128 | full set, facing right |
| ☐ | `stage_deck, stage_props` | assets/backgrounds/ships | 640×120 / pieces | Riley's ship |
| ☐ | `howling_shell_deck, howling_shell_props` | assets/backgrounds/ships | 640×120 / pieces | Broderick's ship |
| ☐ | `frame_riley, frame_broderick` | assets/ui/cards | 72×100 | Sugar glass / butterscotch |
| ☐ | `clarity_gauge, stance_banner_foursword, stance_banner_fistblade, stance_banner_entropy` | assets/ui/icons | gauge 64×16, banners 32×48 | Riley's displays |
| ☐ | `bullet_clip, bullet_fire, bullet_plain, bullet_magic` | assets/ui/icons | clip 64×16, bullets 8×16 | Broderick's display |

---

## Phase 3 — Act 2

| ✓ | ID | Folder | Size | Notes |
|---|---|---|---|---|
| ☐ | `sky_act2`, `sea_act2` | assets/backgrounds/skies | 640×180 / 640×80 | Candy-land ocean |
| ☐ | `map_act2` | assets/ui/map | 640×360 | Candied chart |
| ☐ | `navy_emblem` | assets/ui/icons | 32×32 | Supreme Oversight Navy, for the flag and uniforms |

### Act 2 commons

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `scurvy_gum_marine` (Scurvy Gum Marine) | 128×128 | full set, facing left |  |
| ☐ | `taffy_tongue_spectre` (Taffy Tongue Spectre) | 128×128 | full set, facing left |  |
| ☐ | `gummy_bear_golem` (Gummy Bear Golem) | 128×128 | full set, facing left |  |
| ☐ | `lobster_bisque_knight` (Lobster Bisque Knight) | 128×128 | full set, facing left |  |
| ☐ | `chocolate_wraith` (Chocolate Wraith) | 128×128 | full set, facing left |  |
| ☐ | `deadly_kendo_mermaid` (Deadly Kendo Mermaid) | 128×128 | full set, facing left |  |
| ☐ | `flame_dolphins` (Flame Dolphins) | 128×128 | full set, facing left | ×3 in fight: one sprite, recolored in code |
| ☐ | `flying_fish_marine_unit` (Flying Fish Marine Unit) | 64×64 | full set, facing left | ×3 in fight: one sprite, recolored in code |

### Act 2 elites

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `sea_floor_boss_man` (Sea Floor Boss Man) | 128×128 | full set, facing left |  |
| ☐ | `gummy_worm_disciple` (Gummy Worm Disciple) | 128×128 | full set, facing left |  |
| ☐ | `caramel_crust_soldier` (Caramel Crust Soldier) | 128×128 | full set, facing left |  |
| ☐ | `nepo_baby_merman` (Nepo Baby Merman) | 128×128 | full set, facing left | ×2 in fight: one sprite, recolored in code |
| ☐ | `sour_zoina` (Sour Zoina) | 128×128 | full set, facing left |  |
| ☐ | `flying_fish_fathers` (Flying Fish Fathers) | 128×128 | full set, facing left | ×3 in fight: one sprite, recolored in code |
| ☐ | `giant_inferno_shark` (Giant Inferno Shark) | 128×128 | full set, facing left |  |

### Act 2 bosses

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `admiral_aflam` (Admiral Aflam) | 128×128 | full set, facing left |  |
| ☐ | `university_of_fish` (University of Fish) | 128×128 | full set, facing left | ×3 in fight: one sprite, recolored in code |
| ☐ | `armored_tentacle` (Armored Tentacle) | 128×128 | full set, facing left | + `defend` pose (half-submerged) |
| ☐ | `king_in_green` (King in Green) | 128×128 | full set, facing left | + hoard background layer, 3 sizes |

### Act 2 boss arenas

| ✓ | ID | Folder | Size |
|---|---|---|---|
| ☐ | `arena_admiral_aflam` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_university_of_fish` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_armored_tentacle` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_king_in_green` | assets/backgrounds/arenas | 640×360, in layers |

---

## Phase 4 — Act 3

| ✓ | ID | Folder | Size | Notes |
|---|---|---|---|---|
| ☐ | `sky_act3`, `sea_act3` | assets/backgrounds/skies | 640×180 / 640×80 | Dark, eerie sea |
| ☐ | `map_act3` | assets/ui/map | 640×360 | Rotting chart |

### Act 3 commons

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `melting_smile` (Melting Smile) | 128×128 | full set, facing left |  |
| ☐ | `sugarplum_eye` (Sugarplum Eye) | 128×128 | full set, facing left |  |
| ☐ | `wrong_number_nougat` (Wrong Number Nougat) | 128×128 | full set, facing left |  |
| ☐ | `static_gumdrop` (Static Gumdrop) | 128×128 | full set, facing left |  |
| ☐ | `please_stop_smiling` (Please Stop Smiling) | 128×128 | full set, facing left |  |
| ☐ | `aftertaste` (Aftertaste) | 128×128 | full set, facing left |  |
| ☐ | `torn_recipe_card` (Torn Recipe Card) | 128×128 | full set, facing left |  |
| ☐ | `too_sweet_choir` (Too-Sweet Choir) | 128×128 | full set, facing left | ×2 in fight: one sprite, recolored in code |

### Act 3 elites

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `silence_wearing_a_smile` (Silence Wearing a Smile) | 128×128 | full set, facing left |  |
| ☐ | `uncounted_veil` (Uncounted Veil) | 128×128 | full set, facing left | + second sprite `true_form` (full set) |
| ☐ | `wax_sealed_choir` (Wax-Sealed Choir) | 128×128 | full set, facing left | ×3 in fight: one sprite, recolored in code |
| ☐ | `unbounded_truth` (Unbounded Truth) | 128×128 | full set, facing left |  |
| ☐ | `returnal_scion` (Returnal Scion) | 128×128 | full set, facing left | halo tinted in code |
| ☐ | `djinnball_jar` (Djinnball Jar) | 128×128 | full set, facing left |  |
| ☐ | `double_scoop` (Double Scoop) | 128×128 | full set, facing left | + two split sprites `vanilla`, `cookie_dough` (full sets) |
| ☐ | `appetite_concept` (Appetite Concept) | 128×128 | full set, facing left |  |

### Act 3 bosses

| ✓ | ID | Size | Animations | Notes |
|---|---|---|---|---|
| ☐ | `concept_of_sweet` (Concept of Sweet) | 128×128 | full set, facing left | + 3 face variants (deny attack / heal / block) |
| ☐ | `yellow_yonka` (Yellow Yonka) | 128×128 | full set, facing left |  |
| ☐ | `hours_that_pass` (Hours That Pass) | 128×128 | full set, facing left |  |
| ☐ | `true_yonks_shadow` (True Yonk's Shadow) | 128×128 | full set, facing left | phases 1–4 as separate sprites (full set each) |

### Act 3 boss arenas

| ✓ | ID | Folder | Size |
|---|---|---|---|
| ☐ | `arena_concept_of_sweet` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_yellow_yonka` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_hours_that_pass` | assets/backgrounds/arenas | 640×360, in layers |
| ☐ | `arena_true_yonks_shadow` | assets/backgrounds/arenas | 640×360, in layers |

---

## Phase 5 — Screens, portraits, Gear

| ✓ | ID | Folder | Size | Notes |
|---|---|---|---|---|
| ☐ | `title_background` | assets/backgrounds/screens | 640×360, in layers | Open sea, candy-colored horizon |
| ☐ | `logo_t, logo_s` | assets/logo | 48×48 each | Peppermint-stick T, gummy-worm S |
| ☐ | `portrait_branch, portrait_riley, portrait_broderick` | assets/portraits | 96×96 each | Busts for captain select |
| ☐ | `shop_interior` | assets/backgrounds/screens | 640×360 | Counter, candy-jar shelves, lantern light |
| ☐ | `flotsam, jetsam` | assets/portraits | 96×96 each | Shrimp and lobster behind the counter (idle optional) |
| ☐ | `oasis_campfire` | assets/backgrounds/screens | pieces | Campfire layered onto the captain's deck |
| ☐ | `event_backdrop_act1, _act2, _act3` | assets/backgrounds/screens | 640×360 each | Shared event backdrops |
| ☐ | `banner_victory, banner_defeat` | assets/ui/menus | 256×64 each | Candy-styled banners |
| ☐ | `pause_panel, pause_wheel` | assets/ui/menus | 9-slice pieces / 32×32 | Sugar glass, ship's wheel |
| ☐ | `frame_curse` | assets/ui/cards | 72×100 | Yellow Yonka's wax-paper frame |
| ☐ | `gear_porthole` | assets/ui/gear | 32×32 | One rim, recolored by rarity in code |

### Crew portraits (64×64, folder assets/crew)

| ✓ | ID |
|---|---|
| ☐ | `crew_pine` (Pine) |
| ☐ | `crew_christmas` (Christmas) |
| ☐ | `crew_sage` (Sage) |
| ☐ | `crew_thistle` (Thistle) |
| ☐ | `crew_willow` (Willow) |
| ☐ | `crew_belt` (Belt) |
| ☐ | `crew_riff` (Riff) |
| ☐ | `crew_encore` (Encore) |
| ☐ | `crew_harmony` (Harmony) |
| ☐ | `crew_amp` (Amp) |
| ☐ | `crew_pluto` (Pluto) |
| ☐ | `crew_yeller` (Yeller) |
| ☐ | `crew_lassie` (Lassie) |
| ☐ | `crew_cerberus` (Cerberus) |
| ☐ | `crew_scrappy` (Scrappy) |

### Gear icons (24×24 item drawn inside the porthole, folder assets/ui/gear)

| ✓ | ID | Rarity |
|---|---|---|
| ☐ | `gear_rusty_hook` (Rusty Hook) | Common |
| ☐ | `gear_sailors_locket` (Sailor's Locket) | Common |
| ☐ | `gear_chum_bucket` (Chum Bucket) | Common |
| ☐ | `gear_tarnished_compass` (Tarnished Compass) | Common |
| ☐ | `gear_frayed_knot` (Frayed Knot) | Rare |
| ☐ | `gear_cursed_doubloon` (Cursed Doubloon) | Common |
| ☐ | `gear_chipped_cutlass` (Chipped Cutlass) | Common |
| ☐ | `gear_weathered_buoy` (Weathered Buoy) | Common |
| ☐ | `gear_crab_shell_fragment` (Crab Shell Fragment) | Common |
| ☐ | `gear_hollow_gourd` (Hollow Gourd) | Common |
| ☐ | `gear_tidepool_marble` (Tidepool Marble) | Common |
| ☐ | `gear_bent_fishhook` (Bent Fishhook) | Common |
| ☐ | `gear_salted_twine` (Salted Twine) | Common |
| ☐ | `gear_moldy_hardtack` (Moldy Hardtack) | Common |
| ☐ | `gear_fools_gold_tooth` (Fool's Gold Tooth) | Common |
| ☐ | `gear_krakens_signet_ring` (Kraken's Signet Ring) | Uncommon |
| ☐ | `gear_hollow_conch` (Hollow Conch) | Uncommon |
| ☐ | `gear_sea_witchs_bead` (Sea Witch's Bead) | Uncommon |
| ☐ | `gear_broken_sea_witchs_bead` (Broken Sea Witch's Bead) | Common |
| ☐ | `gear_snarled_netting` (Snarled Netting) | Uncommon |
| ☐ | `gear_cracked_hourglass` (Cracked Hourglass) | Rare |
| ☐ | `gear_sharpened_focus` (Sharpened Focus) | Uncommon |
| ☐ | `gear_witch_light_lantern` (Witch-Light Lantern) | Uncommon |
| ☐ | `gear_moonstone_shard` (Moonstone Shard) | Uncommon |
| ☐ | `gear_salt_crusted_bandana` (Salt-Crusted Bandana) | Uncommon |
| ☐ | `gear_gilded_tusk` (Gilded Tusk) | Uncommon |
| ☐ | `gear_void_touched_pearl` (Void-Touched Pearl) | Uncommon |
| ☐ | `gear_rotten_figurehead` (Rotten Figurehead) | Uncommon |
| ☐ | `gear_plunderers_taffy` (Plunderer's Taffy) | Djinn |
| ☐ | `gear_deep_licorice` (Deep Licorice) | Djinn |
| ☐ | `gear_krakens_bargain` (Kraken's Bargain) | Rare |
| ☐ | `gear_ferrymans_toll` (Ferryman's Toll) | Rare |
| ☐ | `gear_sugarplum_sextant` (Sugarplum Sextant) | Djinn |
| ☐ | `gear_leviathans_eye` (Leviathan's Eye) | Rare |
| ☐ | `gear_bloodmoon_shard` (Bloodmoon Shard) | Rare |
| ☐ | `gear_castaways_life_saver` (Castaway's Life Saver) | Djinn |
| ☐ | `gear_djinns_kindling` (Djinn's Kindling) | Uncommon |
| ☐ | `gear_marked_mans_ledger` (Marked Man's Ledger) | Djinn |
| ☐ | `gear_phoenix_down_charm` (Phoenix Down Charm) | Rare |
| ☐ | `gear_flamebound_talon` (Flamebound Talon) | Uncommon |
| ☐ | `gear_hotstreak_gumball` (Hotstreak Gumball) | Djinn |
| ☐ | `gear_weavers_thread` (Weaver's Thread) | Djinn |
| ☐ | `gear_chaos_bound_locket` (Chaos-Bound Locket) | Uncommon |
| ☐ | `gear_crimson_tally` (Crimson Tally) | Uncommon |
| ☐ | `gear_clarity_bandana` (Clarity Bandana) | Djinn |
| ☐ | `gear_fractured_hourglass` (Fractured Hourglass) | Rare |
| ☐ | `gear_extra_clip` (Extra Clip) | Rare |
| ☐ | `gear_pocket_moon` (Pocket Moon) | Djinn |
| ☐ | `gear_lycan_blood_wine` (Lycan Blood Wine) | Djinn |
| ☐ | `gear_firewolf_soul` (FireWolf Soul) | Uncommon |
| ☐ | `gear_utility_jacket` (Utility Jacket) | Rare |
| ☐ | `gear_sugarblood_crown` (Sugarblood Crown) | Djinn |
| ☐ | `gear_bittersweet_heart` (Bittersweet Heart) | Djinn |
| ☐ | `gear_one_last_gumdrop` (One Last Gumdrop) | Djinn |
| ☐ | `gear_bottomless_candy_bag` (Bottomless Candy Bag) | Djinn |
| ☐ | `gear_rock_candy_curse` (Rock Candy Curse) | Djinn |
| ☐ | `gear_greedy_djinns_jar` (Greedy Djinn's Jar) | Djinn |
| ☐ | `gear_candy_corn_crown` (Candy Corn Crown) | Djinn |
| ☐ | `gear_sugar_rush_satchel` (Sugar Rush Satchel) | Djinn |
| ☐ | `gear_wishing_gumball` (Wishing Gumball) | Djinn |
| ☐ | `gear_two_faced_toffee` (Two-Faced Toffee) | Djinn |
