// ============ CARD HELPER ============
function C(id, name, cost, opts) {
  return Object.assign({ id, name, cost, dmg:0, dtype:null, enflame:0, bleed:0, block:0, heal:0,
    tire:0, daze:0, stun:false, healOnKill:false, selfDetonate:false, scaleBlockFromEnflame:false,
    fuelTheFire:false, bankedCoals:false, scorchKickCombo:false, furyConditional:false,
    haymakerCombo:false, detonateRate:0, energyGain:0, energyGainOnKill:0, draw:0, aoe:false, ignoresBlock:false,
    detonate:false, negate:false, cleanse:false,
    homeStance:null, locked:false, stanceSwitchTo:null, switchThreshold:0, stanceSwitchAlways:false,
    embraceChaos:false, hardenStrip:false, blockConditionalBonus:0, retaliateDmg:0, retaliateDtype:null,
    cleanseOnFullBlock:false, readIntent:false, bleedSecondTarget:false, generateClarityInEntropy:0,
    hpCost:0, hpCostElsewhereOnly:0, consumeClarityForDamage:0, consumeClarityForBlock:0, scaleWithClarity:false, hits:1, tireDuration:0, healFromFieldBleed:false,
    loadBullet:null, consumesBullets:0, autoLoadIfEmpty:null, setLinedUp:false, checksLinedUp:false, bonusMult:0,
    multiplyBullet:0, randomHits:0, hitDmg:0, overrideDtype:null,
    isClaw:false, fireSameTwice:false, dmgMult:0, secondaryMult:0, secondTargetEnflame:0, magicDrawCap:0,
    secondTargetFallbackSame:false, alwaysIgnoresBlock:false, linedUpStun:false, distributeAcrossEnemies:false, linedUpDmgBonus:0, healPctOfDamage:0,
    drawIfMagicLoaded:false, bonusIfMagicLoaded:0,
    requiresEmptyClip:false, fullMoonSweep:false, permanentHealBonus:0, permanentClipSizeBonus:0,
    fullMoonBonusDmgMult:0, fullMoonBonusHeal:0, fullMoonBonusBlock:0, fullMoonBonusStun:false, fullMoonBecomesClaw:false,
    dmgPerBulletLoaded:0, blockPerBulletLoaded:0, drawPerBulletLoadedCap:0, bonusIfClipEmpty:0, bonusIfTargetLowHp:0, exhaust:false, blockBonusIfClipEmpty:0, dazeSelf:false, bleedPerBulletLoaded:0, bonusBountyOnKill:0, drawPerEmptyClipSlot:0,
    selfEnflame:0, permanentFireDmgBonus:0, dmgFromOwnEnflame:0, blockFromOwnEnflame:0, detonateEnergyThreshold:0,
    delayedDetonateMult:0, detonateSpreadHalf:false, detonateReapplyAndAgain:0, requiresTargetEnflamed:false, enflameSpreadHalfIfPresent:false, reapplyOriginalEnflame:false, doubleDmgIfEnflamed:false,
    fireToMagicalPower:false, flameOnPower:false, cinderguardPower:false,
    doubleCashIn:false, costLessIfTargetBleeding:0, cashInSpreadHalf:false,
    retaliatePctOfBlock:0, blockPerHitBlockedThisCombat:0, dmgPerSwitchThisCombat:0, dmgPerSwitchCap:0,
    requiresSwitchedThisTurn:false, generateClarityFlat:0, bonusClarityOnNextSwitch:0,
    requiresMinClarity:0, consumeClarityMinForDamage:0, consumeClarityMinForBlock:0,
    unbrokenFocusPower:false, aboveTimePower:false, bloodFeudPower:false,
    forceRarity:null, doubleThenDetonate:false, doublesNextEntropyCard:false, repeatLastCard:false,
    blockGrantsClarityIfHit:0, loadRandomAfterFire:false, tireOnPlayRandomEnemy:false, consumesClarityCost:0,
    desc:"" }, opts || {});
}

// ============ BRANCH ============
const BRANCH_STARTER = [
  C("bfj1","Flame Jab",1,{dmg:5,dtype:"Fire",enflame:2,desc:"Deal 5 dmg. Apply 2 Enflame."}),
  C("bfj0","Flame Jab",1,{dmg:5,dtype:"Fire",enflame:2,desc:"Deal 5 dmg. Apply 2 Enflame."}),
  C("bcf1","Cinder Fist",1,{dmg:8,dtype:"Blunt",doubleDmgIfEnflamed:true,desc:"Deal 8 dmg. Double if target has Enflame."}),
  C("bcf2","Cinder Fist",1,{dmg:8,dtype:"Blunt",doubleDmgIfEnflamed:true,desc:"Deal 8 dmg. Double if target has Enflame."}),
  C("bres1","Branch's Resolve",1,{block:6,desc:"Gain 6 Block."}),
  C("bres2","Branch's Resolve",1,{block:6,desc:"Gain 6 Block."}),
  C("bres3","Branch's Resolve",1,{block:6,desc:"Gain 6 Block."}),
  C("bsb1","Slow Burn",0,{enflame:3,desc:"Apply 3 Enflame."}),
  C("bsb2","Slow Burn",0,{enflame:3,desc:"Apply 3 Enflame."}),
  C("bcc1","Charred Cross",2,{dmg:11,dtype:"Fire",enflame:2,desc:"Deal 11 dmg. Apply 2 Enflame."}),
];
const BRANCH_POOL = [
  C("bfj2","Flame Jab",1,{dmg:5,dtype:"Fire",enflame:2,desc:"Deal 5 dmg. Apply 2 Enflame."}),
  C("brb","Reckless Blaze",1,{dmg:10,dazeSelf:true,desc:"Deal 10 dmg. Apply 1 Daze to yourself (the next attack against you deals double)."}),
  C("bsk","Scorch Kick",2,{dmg:15,dtype:"Blunt",scorchKickCombo:true,desc:"Deal 15 dmg. Costs 0 if this is your 2nd Attack card played this turn."}),
  C("bbe","Blazing Edge",2,{dmg:13,dtype:"Slashing",enflame:3,desc:"Deal 13 dmg. Apply 3 Enflame."}),
  C("bdf","Dark Flame",2,{dmg:16,dtype:"Magical",detonate:true,desc:"Deal 16 dmg. Detonate Enflame (1x)."}),
  C("bsf","Solar Flare",2,{dmg:13,dtype:"Fire",stun:true,desc:"Deal 13 dmg. Stun if it penetrates Block."}),
  C("bpf","Phoenix Straight",1,{dmg:5,dtype:"Magical",enflame:2,healOnKill:true,desc:"Deal 5 dmg. Apply 2 Enflame. If this kills, heal = dmg dealt."}),
  C("bwb","Wraithfire Bolt",3,{dmg:28,dtype:"Magical",energyGainOnKill:3,desc:"Deal 28 dmg. Gain 3 energy if this kills the target."}),
  C("bwh","Wildfire Haymaker",3,{dmg:16,dtype:"Fire",enflame:3,aoe:true,haymakerCombo:true,desc:"Deal 16 dmg to ALL. Apply 3 Enflame. Costs 2 if Flame Jab + Charred Cross played last turn."}),
  C("bbf","Branch's Fury",3,{dmg:14,dtype:"Fire",furyConditional:true,desc:"Deal 14 dmg. If target has Enflame: +10 bonus dmg AND permanent +1 Fire damage for rest of combat."}),
  C("bffa","Fireball Candy - Fafnir",3,{dmg:20,dtype:"Fire",detonateRate:2,desc:"★ Deal 20 dmg. Detonate all Enflame on target for 2x stacks as bonus damage."}),
  C("bemb","Emberfy",1,{dmg:5,dtype:"Fire",enflame:3,desc:"Deal 5 dmg. Apply 3 Enflame."}),
  C("bwl","Wildfire Lash",1,{dmg:3,dtype:"Fire",enflame:3,aoe:true,desc:"Deal 3 dmg to ALL. Apply 3 Enflame. (Cheap AoE Enflame seed.)"}),
  C("bfs","Phoenix Fire Storm",3,{dmg:11,dtype:"Magical",enflame:3,aoe:true,healOnKill:true,desc:"Deal 11 dmg to ALL. Apply 3 Enflame to all. Heal HP = dmg dealt for each enemy killed by this hit."}),
  C("bfw","Fireball Candy - Wildfire",3,{dmg:16,dtype:"Fire",enflame:5,aoe:true,desc:"★ Deal 16 dmg to ALL. Apply 5 Enflame, no decay 2 turns."}),
  C("bdu","Draft Up",1,{draw:2,desc:"Draw 2 cards."}),
  C("bsr","Sage's Remedy",2,{heal:7,cleanse:true,desc:"Heal 7. Remove all debuffs."}),
  C("bbc","Banked Coals",2,{bankedCoals:true,desc:"Remove all Enflame from target. Gain Block = stacks removed. Draw a card if any were removed."}),
  C("bft","Fuel the Fire",1,{dtype:"Fire",fuelTheFire:true,desc:"Remove all Enflame from target. Gain 2 energy if any removed. Costs 0 next draw if 5+ removed."}),
  C("bcw","Cinderwall",1,{block:0,scaleBlockFromEnflame:true,desc:"Gain Block equal to total Enflame stacks on all enemies (no consume)."}),
  C("bab","Implode",2,{dtype:"Fire",enflame:10,selfDetonate:true,desc:"Apply 10 Enflame, then immediately detonate all current stacks on target for damage equal to the total."}),
  C("bfe","Fireball Candy - Eviscerate",3,{dmg:24,dtype:"Fire",detonate:true,aoe:true,desc:"★ Deal 24 to ALL + detonate Enflame."}),
  C("brcs","Rock Candy - Stoneskin",3,{negate:true,desc:"Negate the next attack this turn."}),
  C("bcd","Christmas Dinner",1,{energyGain:2,desc:"Gain 2 energy."}),
  // ===== Self-Enflame =====
  C("bfcbi","Fireball Candy - Blood Ignite",1,{selfEnflame:4,permanentFireDmgBonus:2,desc:"Apply 4 Enflame to yourself. Gain +2 permanent Fire damage for the rest of combat."}),
  C("bfcsn","Fireball Candy - Supernova",3,{dmg:20,dtype:"Fire",selfEnflame:5,aoe:true,desc:"Deal 20 dmg to ALL. Apply 5 Enflame to yourself."}),
  C("btfi","Fire Inside",1,{selfEnflame:3,draw:3,desc:"Apply 3 Enflame to yourself. Draw 3 cards."}),
  C("bbb","Branch Bomb",2,{dmgFromOwnEnflame:3,aoe:true,dtype:"Fire",desc:"Deal damage to ALL equal to 3x your own current Enflame stacks."}),
  C("bng","Nova Guard",1,{blockFromOwnEnflame:2,desc:"Gain Block equal to 2x your own current Enflame stacks."}),
  C("bfcmt","Fireball Candy - Megaton",3,{dmg:30,dtype:"Fire",selfEnflame:8,desc:"Deal 30 dmg. Apply 8 Enflame to yourself."}),
  C("ble","Living Ember",2,{dmg:13,dtype:"Fire",selfEnflame:3,desc:"Deal 13 dmg. Apply 3 Enflame to yourself."}),
  // ===== Detonate variety =====
  C("bbbomb","Burn Bomb",1,{dmg:0,dtype:"Fire",detonate:true,detonateEnergyThreshold:5,desc:"Detonate target's Enflame at 1x. Gain 1 energy if it detonates for 5+."}),
  C("bfc4t","Fireball Candy - C4 Trigger",2,{delayedDetonateMult:3,desc:"Marks the target — at the start of their next turn, all their current Enflame detonates at 3x instead of ticking normally."}),
  C("bhf","Hot Flash",2,{dmg:0,dtype:"Fire",detonate:true,detonateSpreadHalf:true,desc:"Detonate target's Enflame at 1x, then apply half that amount as fresh Enflame to a second random enemy."}),
  C("bfspin","Fire Spin",2,{dmg:0,dtype:"Fire",detonate:true,reapplyOriginalEnflame:true,desc:"Detonate target's Enflame (1x), then reapply the same amount as fresh Enflame."}),
  // ===== Enflame-as-control =====
  C("blsmoke","Lung Smoke",1,{dmg:5,dtype:"Fire",requiresTargetEnflamed:true,tire:1,desc:"Deal 5 dmg. If target has Enflame, also apply Tire."}),
  C("bwg","Wildfire Gambit",2,{dmg:11,dtype:"Fire",requiresTargetEnflamed:true,enflameSpreadHalfIfPresent:true,desc:"Deal 11 dmg. If target has Enflame, spread half of it to a second random enemy."}),
  C("bhh","Hot Hand",2,{dmg:13,dtype:"Fire",requiresTargetEnflamed:true,stun:true,desc:"Deal 13 dmg. If target has Enflame, also Stun."}),
  C("bsuf","Suffocate",2,{dmg:9,dtype:"Fire",requiresTargetEnflamed:true,daze:2,desc:"Deal 9 dmg. If target has Enflame, also apply 2 Daze stacks."}),
  // ===== Powers =====
  C("bfcpa","Fireball Candy - Phoenix Awakening",2,{fireToMagicalPower:true,heal:6,exhaust:true,forceRarity:"Rare",desc:"Heal 6 HP. Exhaust. Permanent: your Fire-typed cards deal Magical damage instead."}),
  C("bfcfo","Fireball Candy - Flame On!",2,{flameOnPower:true,exhaust:true,desc:"★ Exhaust. Permanent: enemy Enflame ticks deal bonus damage equal to your own current Enflame stacks."}),
  C("bfccg","Fireball Candy - Cinderguard",2,{cinderguardPower:true,exhaust:true,desc:"★ Exhaust. Permanent: at the start of each of your turns, gain Block equal to total current Enflame on all enemies."}),
  // ===== Plain fillers =====
  C("bthb","Thistle's Boom",2,{dmg:0,dtype:"Fire",doubleThenDetonate:true,forceRarity:"Djinn",desc:"★ Double the target's current Enflame stacks, then detonate the total."}),
  C("bwps","Willow's Prone Shot",2,{dmg:12,dtype:"Fire",ignoresBlock:true,forceRarity:"Rare",desc:"Deal 12 dmg, ignores Block."}),
  C("btwst","Twin Strike",2,{dmg:13,dtype:"Slashing",stun:true,desc:"Deal 13 dmg. Stun if it penetrates Block."}),
  C("bmwall","Arcane Cinder",2,{dmg:13,dtype:"Magical",desc:"Deal 13 dmg."}),
  // ===== Magical (Enchant-granting) =====
  C("bme1","Phoenix Ember",1,{dmg:4,dtype:"Magical",enflame:2,heal:2,desc:"Deal 4 dmg. Apply 2 Enflame. Heal 2."}),
  C("bme2","Mystic Detonation",1,{dmg:0,dtype:"Magical",detonate:true,desc:"Detonate all Enflame on target for 1x — no base damage."}),
  C("bme3","Phoenix Ward",1,{block:4,heal:2,desc:"Gain 4 Block. Heal 2."}),
  C("bme4","Piercing Hex",2,{dmg:12,dtype:"Magical",ignoresBlock:true,desc:"Deal 12 dmg, ignores Block."}),
  C("bme5","Phoenix Cascade",2,{dmg:8,dtype:"Magical",aoe:true,detonate:true,healOnKill:true,desc:"Deal 8 dmg to ALL. Detonates Enflame (1x) on any that have it. Heals on kill."}),
  C("bme6","Phantom Volley",2,{dmg:4,dtype:"Magical",randomHits:3,enflame:1,desc:"3 random hits, 4 dmg each. Each hit applies 1 Enflame."}),
  C("bme7","Wraith's Grasp",2,{dmg:10,dtype:"Magical",stun:true,desc:"Deal 10 dmg. Stun if it penetrates Block."}),
  C("bme8","Phoenix Rebirth",3,{dmg:14,dtype:"Magical",healPctOfDamage:1.0,desc:"Deal 14 dmg. Heal 100% of damage dealt."}),
  C("bme9","Fireball Candy - Arcane Immolation",3,{dmg:13,dtype:"Magical",enflame:4,aoe:true,desc:"Deal 13 dmg to ALL. Apply 4 Enflame to all."}),
  C("bme10","Fireball Candy - Phoenix Reckoning",3,{dmg:14,dtype:"Magical",enflame:5,aoe:true,heal:6,desc:"★ Deal 14 dmg to ALL. Apply 5 (heavy) Enflame to all. Heal 6 HP."}),
];

// ============ RILEY ============
const RILEY_STARTER = [
  C("rbs1","Basic Slash",1,{dmg:4,dtype:"Slashing",bleed:2,homeStance:"FourSword",stanceSwitchTo:"FourSword",switchThreshold:0,desc:"Deal 4 dmg. Apply 2 Bleed. Switches you into Four Sword Style."}),
  C("rbs2","Basic Slash",1,{dmg:4,dtype:"Slashing",bleed:2,homeStance:"FourSword",stanceSwitchTo:"FourSword",switchThreshold:0,desc:"Deal 4 dmg. Apply 2 Bleed. Switches you into Four Sword Style."}),
  C("rbs3","Basic Slash",1,{dmg:4,dtype:"Slashing",bleed:2,homeStance:"FourSword",stanceSwitchTo:"FourSword",switchThreshold:0,desc:"Deal 4 dmg. Apply 2 Bleed. Switches you into Four Sword Style."}),
  C("rgu1","Guard Up",0,{block:6,homeStance:"FistBlade",stanceSwitchTo:"FourSword",switchThreshold:0,desc:"Gain 6 Block. Switches you into Four Sword Style."}),
  C("rgu2","Guard Up",0,{block:6,homeStance:"FistBlade",stanceSwitchTo:"FourSword",switchThreshold:0,desc:"Gain 6 Block. Switches you into Four Sword Style."}),
  C("rwf1","Whirlwind Focus",0,{stanceSwitchAlways:true,desc:"Switch to the other main stance (Four Sword <-> Fist Blade)."}),
  C("eclipse0","One With Entropy - Eclipse",2,{dmg:38,dtype:"Magical",homeStance:"Entropy",locked:true,hpCost:5,desc:"★🔒 Consume all Clarity. Deal 38+ dmg. Entropy-exclusive. Costs 5 HP."}),
  C("rfc1","Flicker Cut",0,{dmg:3,dtype:"Slashing",homeStance:"FourSword",desc:"Deal 3 dmg."}),
  C("rkr0","Knuckle Rap",1,{dmg:5,dtype:"Blunt",blockConditionalBonus:3,homeStance:"FistBlade",stanceSwitchTo:"FistBlade",switchThreshold:0,desc:"Deal 5 dmg (+3 if you have Block). Switches you into Fist Blade Style. Fist Blade's basic attack."}),
  C("rwf","Whirlwind Focus",0,{stanceSwitchAlways:true,desc:"Switch to the other main stance (Four Sword <-> Fist Blade)."}),
  C("rrs0","Read the Strike",1,{block:6,homeStance:"FistBlade",readIntent:true,desc:"Gain 6 Block. Double Block if enemy's telegraphed intent is an Attack."}),
];

const RILEY_POOL = [
  // ===== FOUR SWORD (flexible unless locked) =====
  C("res","Ember Slash",1,{dmg:6,dtype:"Fire",bleed:4,homeStance:"FourSword",desc:"Deal 6 Fire dmg. Apply 4 Bleed (off-type Slashing answer)."}),
  C("rcs","Crippling Strike",1,{dmg:7,dtype:"Slashing",stun:true,hardenStrip:true,homeStance:"FourSword",desc:"Deal 7 dmg. Stun if it penetrates Block. Remove 1 Harden if any."}),
  C("rpb","Purging Blade",1,{dmg:5,dtype:"Slashing",cleanse:true,homeStance:"FourSword",desc:"Deal 5 dmg. Remove Tire, Daze, and Enflame."}),
  C("rps2","Precision Strike",2,{dmg:14,dtype:"Slashing",stun:true,homeStance:"FourSword",desc:"Deal 14 dmg. Always generates Clarity. Stun if it penetrates Block."}),
  C("rbd","Blade Dance",2,{dmg:8,dtype:"Slashing",bleed:2,aoe:true,homeStance:"FourSword",desc:"Deal 8 to ALL. Apply 2 Bleed."}),
  C("row","Overwhelm",3,{dmg:20,dtype:"Slashing",ignoresBlock:true,homeStance:"FourSword",desc:"Deal 20 dmg, ignores Block."}),
  C("rrfb","Riff's Fifth Blade",2,{dmg:13,dtype:"Slashing",homeStance:"FourSword",desc:"Deal 13 dmg. Generates bonus Clarity."}),
  C("rfl","Riley's Flourish",2,{dmg:5,dtype:"Slashing",aoe:true,scaleWithClarity:true,homeStance:"FourSword",desc:"★ Deal 5 + current Clarity damage to ALL enemies (does not consume Clarity). Generates 1 Clarity per enemy hit."}),
  C("rfso","Four Swords As One",3,{dtype:"Slashing",consumeClarityForDamage:5,homeStance:"FourSword",desc:"★ Consume all Clarity. Deal 5x Clarity consumed as damage."}),
  C("rembr","Embrace the Chaos",4,{homeStance:"FourSword",embraceChaos:true,hpCost:3,desc:"Costs 3 HP. Switch to One With Entropy. Clarity unaffected."}),
  // LOCKED to Four Sword only
  C("rce","Consume the Edge",2,{dtype:"Slashing",bleed:3,bleedSecondTarget:true,consumeClarityForDamage:4,homeStance:"FourSword",locked:true,desc:"🔒 Consume all Clarity. Deal 4x Clarity consumed as damage. Apply 3 Bleed to a 2nd enemy."}),
  C("rff","Fourfold Fury",2,{dmg:4,dtype:"Slashing",bleed:2,hits:4,homeStance:"FourSword",locked:true,desc:"🔒 Deal 4 dmg, 4 separate hits. Apply 2 Bleed per hit. Bleed only cashes in on the final hit."}),
  C("rtb","Telekinetic Barrage",3,{dmg:7,dtype:"Slashing",bleed:2,hits:2,aoe:true,homeStance:"FourSword",locked:true,desc:"🔒 Deal 7 dmg to ALL, 2 separate hits each. Apply 2 Bleed per hit. Bleed only cashes in on the final hit."}),

  // ===== FIST BLADE (flexible unless locked) =====
  C("rkr","Knuckle Rap",1,{dmg:5,dtype:"Blunt",blockConditionalBonus:3,homeStance:"FistBlade",stanceSwitchTo:"FistBlade",switchThreshold:0,desc:"Deal 5 dmg (+3 if you have Block). Switches you into Fist Blade Style."}),
  C("rps","Parry Step",1,{block:6,homeStance:"FistBlade",desc:"Gain 6 Block. If hit, generate Clarity."}),
  C("rag","Arcane Guard",1,{block:5,retaliateDmg:3,retaliateDtype:"Magical",homeStance:"FistBlade",desc:"Gain 5 Block. If hit, deal 3 Magical dmg back."}),
  C("rrt","Retaliate",2,{block:8,retaliateDmg:5,retaliateDtype:"Blunt",homeStance:"FistBlade",desc:"Gain 8 Block. If hit, deal 5 Blunt dmg back."}),
  C("rog","Overwhelming Guard",3,{block:16,homeStance:"FistBlade",desc:"Gain 16 Block."}),
  C("rrb","Riley's Bulwark",2,{block:14,homeStance:"FistBlade",desc:"★ Gain 14 Block. Generates Clarity = half Block."}),
  C("rimm","Immovable",3,{negate:true,homeStance:"FistBlade",desc:"★ Negate the next attack this turn."}),
  C("rhl","Harmony's Lecture",1,{heal:7,cleanse:true,homeStance:"FistBlade",desc:"Heal 7 HP. Remove all debuffs."}),
  C("rctm","Clear the Mind",1,{block:5,cleanse:true,homeStance:"FistBlade",desc:"Remove Tire, Daze, and Enflame. Gain 5 Block."}),
  C("rsb","Second Breath",0,{energyGain:1,desc:"Gain 1 energy. (Stance-agnostic.)"}),
  // LOCKED to Fist Blade only
  C("rip","Iron Perimeter",2,{block:10,cleanseOnFullBlock:true,homeStance:"FistBlade",locked:true,desc:"🔒 Gain 10 Block. If it fully absorbs the hit, also cleanse 1 debuff."}),
  C("rcsh","Clarity's Shield",3,{consumeClarityForBlock:5,homeStance:"FistBlade",locked:true,desc:"🔒 Consume all Clarity. Gain Block = 5x Clarity consumed."}),

  // ===== ONE WITH ENTROPY (dual-mode: full in Entropy, halved elsewhere) =====
  C("ebe","Bleeding Edge",2,{dmg:10,dtype:"Slashing",bleed:4,homeStance:"Entropy",hpCostElsewhereOnly:3,desc:"Deal 10 dmg + 4 Bleed (20 dmg + 8 Bleed in Entropy). Costs 2, drops to 1 in Entropy. Free HP cost in Entropy; 3 HP elsewhere."}),
  C("etf","Twin Flame",2,{dmg:7,dtype:"Fire",hits:2,homeStance:"Entropy",hpCost:3,desc:"Deal 7 dmg, 2 separate hits (14 total; 28 in Entropy). Costs 2, drops to 1 in Entropy. Costs 3 HP."}),
  C("ecat","Cataclysm",3,{dmg:12,dtype:"Fire",aoe:true,homeStance:"Entropy",hpCost:3,desc:"Deal 12 Fire dmg to ALL (24 in Entropy). Costs 3, drops to 2 in Entropy. Costs 3 HP."}),
  C("emoc","Moment of Clarity",0,{generateClarityInEntropy:2,homeStance:"Entropy",hpCost:10,desc:"Generate 2 Clarity (the one Entropy exception, doesn't end Entropy). Costs 10 HP."}),
  C("encore","Encore for the Captain",1,{repeatLastCard:true,homeStance:"Entropy",forceRarity:"Djinn",desc:"★ Set your HP to 1. Remove all Clarity. Repeat the last card played this turn."}),
  C("eclipse","One With Entropy - Eclipse",2,{dmg:38,dtype:"Magical",homeStance:"Entropy",locked:true,hpCost:5,desc:"★🔒 Consume all Clarity. Deal 38+ dmg. Entropy-exclusive. Costs 5 HP."}),
  // ===== Magical (Enchant-granting, stance-neutral) =====
  C("rme1","Amp's Feedback",2,{doublesNextEntropyCard:true,consumesClarityCost:4,forceRarity:"Djinn",desc:"★ Costs 4 Clarity. Doubles the HP cost and damage of the next Entropy card played this turn."}),
  C("rme2","Phase Strike",1,{dmg:4,dtype:"Magical",ignoresBlock:true,desc:"Deal 4 dmg, ignores Block."}),
  C("rme3","Belt's Backup",2,{block:10,blockGrantsClarityIfHit:2,forceRarity:"Rare",desc:"Gain 10 Block. If hit while blocked, generate 2 Clarity."}),
  C("rme4","Arcane Barrage",2,{dmg:7,dtype:"Magical",bleed:1,aoe:true,desc:"Deal 7 dmg to ALL. Apply 1 Bleed to all."}),
  C("rme5","Chaos Bolt",2,{dmg:4,dtype:"Magical",randomHits:3,desc:"3 random hits, 4 dmg each."}),
  C("rme6","Arcane Focus",3,{dmg:14,dtype:"Magical",heal:3,desc:"Deal 14 dmg. Heal 3."}),
  C("rme7","Spectral Guard",2,{block:12,desc:"Gain 12 Block, full value regardless of stance."}),
  C("rme8","Piercing Truth",2,{dmg:12,dtype:"Magical",ignoresBlock:true,desc:"Deal 12 dmg, ignores Block."}),
  C("rme9","Arcane Reckoning",3,{dmg:3,dtype:"Magical",scaleWithClarity:true,desc:"Deal 3 + current Clarity as damage (reads, doesn't consume), unconditional regardless of stance."}),
  C("rme10","Convergence",3,{dmg:10,dtype:"Magical",aoe:true,desc:"★ Deal 10 dmg to ALL. Cashes in Bleed on every enemy hit for bonus damage."}),
  // ===== Bleed identity =====
  C("rfe","Fraying Edge",1,{dmg:0,bleed:6,dtype:"Slashing",desc:"Apply 6 Bleed. No direct damage — pure setup."}),
  C("runr","Unraveling",2,{dmg:8,dtype:"Slashing",doubleCashIn:true,desc:"Deal 8 dmg. If this triggers a Bleed cash-in, the bonus is doubled."}),
  C("rcic","Clarity in Chaos",2,{dmg:9,dtype:"Slashing",costLessIfTargetBleeding:1,desc:"Deal 9 dmg. Costs 1 less if the target is already Bleeding."}),
  C("rcw","Cascading Wound",2,{dmg:8,dtype:"Slashing",bleed:2,cashInSpreadHalf:true,desc:"Deal 8 dmg. Apply 2 Bleed. On cash-in, half the cashed-in amount spreads as fresh Bleed to a second random enemy."}),
  // ===== Fist Blade identity =====
  C("rmr","Measured Response",2,{block:8,retaliatePctOfBlock:1.0,homeStance:"FistBlade",desc:"Gain 8 Block. If hit while Blocked, retaliate with your full current Block as damage."}),
  C("rush","Unshaken",2,{block:6,blockPerHitBlockedThisCombat:2,homeStance:"FistBlade",desc:"Gain 6 Block + 2 more per hit you've blocked so far this combat."}),
  // ===== Switch-triggered =====
  C("rmedge","Momentum's Edge",1,{dmg:5,dtype:"Slashing",dmgPerSwitchThisCombat:1,dmgPerSwitchCap:8,desc:"Deal 5 dmg + 1 per stance switch performed this combat (capped at +8)."}),
  C("rbf","Between Forms",2,{dmg:14,dtype:"Slashing",ignoresBlock:true,requiresSwitchedThisTurn:true,desc:"Playable only the same turn you've switched stances. Deal 14 dmg, ignores Block."}),
  C("rct","Clarity's Turn",0,{generateClarityFlat:1,bonusClarityOnNextSwitch:1,hpCost:5,desc:"Generate 1 Clarity. Your next stance switch this turn also generates 1 bonus Clarity. Costs 5 HP."}),
  // ===== Clarity-payoff =====
  C("rcritm","Critical Mass",3,{dtype:"Slashing",consumeClarityMinForDamage:4,requiresMinClarity:8,desc:"Requires 8+ Clarity. Consume all Clarity, deal 4x consumed as damage."}),
  C("rfbar","Focused Barrier",2,{consumeClarityMinForBlock:3,requiresMinClarity:8,desc:"Requires 8+ Clarity. Consume all Clarity, gain 3x consumed as Block."}),
  // ===== Powers =====
  C("rufoc","Unbroken Focus",3,{unbrokenFocusPower:true,exhaust:true,desc:"★ Exhaust. Permanent: generate Clarity in every stance. While active, the Entropy auto-trigger threshold rises to 12."}),
  C("rabtm","Above Time",3,{aboveTimePower:true,exhaust:true,desc:"★ Exhaust. Permanent: Entropy lasts 2 cards instead of ending after the first."}),
  C("rfsbf","Four Sword Style - Blood Feud",3,{bloodFeudPower:true,exhaust:true,homeStance:"FourSword",desc:"★ Exhaust. Permanent: all Bleed you apply is doubled; all other damage you deal is halved."}),
];

// ============ BRODERICK ============
const BRODERICK_STARTER = [
  C("bsc1","Savage Claw",1,{dmg:4,dtype:"Slashing",heal:2,bleed:1,isClaw:true,desc:"Deal 4 dmg. Heal 2. Apply 1 Bleed."}),
  C("bsc2","Savage Claw",1,{dmg:4,dtype:"Slashing",heal:2,bleed:1,isClaw:true,desc:"Deal 4 dmg. Heal 2. Apply 1 Bleed."}),
  C("bsc3","Savage Claw",1,{dmg:4,dtype:"Slashing",heal:2,bleed:1,isClaw:true,desc:"Deal 4 dmg. Heal 2. Apply 1 Bleed."}),
  C("blb1","Load Bullet",0,{loadBullet:"Plain",desc:"Load a Plain bullet (3 dmg + 4 Block when fired). Replaces oldest if clip is full."}),
  C("blbf1","Load Flame Bullet",0,{loadBullet:"Fire",desc:"Load a Fire bullet (5 dmg + 1 Enflame when fired). Replaces oldest if clip is full."}),
  C("brf1","Rifle Fire",1,{consumesBullets:1,autoLoadIfEmpty:"Plain",linedUpDmgBonus:0.5,desc:"Fire your last loaded bullet (+50% if Lined Up). Empty clip: loads a Plain bullet instead."}),
  C("brf2","Rifle Fire",1,{consumesBullets:1,autoLoadIfEmpty:"Plain",linedUpDmgBonus:0.5,desc:"Fire your last loaded bullet (+50% if Lined Up). Empty clip: loads a Plain bullet instead."}),
  C("bid1","Iron Discipline",1,{block:6,desc:"Gain 6 Block."}),
  C("bid2","Iron Discipline",1,{block:6,desc:"Gain 6 Block."}),
  C("bid3","Iron Discipline",1,{block:6,desc:"Gain 6 Block."}),
];
const BRODERICK_POOL = [
  C("bfm","Feral Maw",2,{dmg:13,dtype:"Slashing",heal:8,bleed:1,isClaw:true,desc:"Deal 13 dmg. Heal 8. Apply 1 Bleed."}),
  C("brc","Rending Claws",2,{dmg:7,dtype:"Slashing",hits:2,bleed:1,isClaw:true,desc:"Deal 7 dmg, 2 separate hits (14 total). Apply 1 Bleed per hit."}),
  C("bas","Wolf Barrage",3,{dmg:7,dtype:"Slashing",randomHits:4,bleed:1,isClaw:true,desc:"Deal 7 dmg, 4 random hits (28 total). Apply 1 Bleed per hit."}),
  C("bpo","Pounce",1,{dmg:6,dtype:"Slashing",bleed:3,isClaw:true,desc:"Deal 6 dmg. Apply 3 Bleed (heavy)."}),
  C("bca","Coordinated Assault",2,{dmg:13,dtype:"Slashing",daze:1,bleed:1,isClaw:true,desc:"Deal 13 dmg. Apply 1 Daze stack (your next hit on this target deals double). Apply 1 Bleed."}),
  C("bbd","Bite Down",2,{dmg:13,dtype:"Slashing",bleed:3,stun:true,isClaw:true,desc:"Deal 13 dmg. Apply 3 Bleed. Stun if it penetrates Block."}),
  C("bdt","Double Tap",1,{consumesBullets:1,fireSameTwice:true,stun:true,desc:"Fire your last bullet twice (dmg doubles, secondary effect once). Stun if it penetrates Block."}),
  C("bss","Snap Shot",1,{dmg:4,dtype:"Fire",enflame:2,detonate:true,desc:"Deal 4 dmg + 2 Enflame. Detonate if target already has Enflame."}),
  C("bef","Ember Fang",1,{dmg:7,dtype:"Fire",enflame:2,desc:"Deal 7 dmg. Apply 2 Enflame."}),
  C("bts","Trick Shot",1,{consumesBullets:1,secondTargetEnflame:2,secondTargetFallbackSame:true,desc:"Fire your last bullet at one enemy. A second enemy (or the same, if solo) gets 2 Enflame."}),
  C("blbm","Load Magic Bullet",0,{loadBullet:"Magic",desc:"Load a Magic bullet (2 dmg + draw 1 when fired). Replaces oldest if clip is full."}),
  C("blbf2","Load Flame Bullet",0,{loadBullet:"Fire",desc:"Load a Fire bullet (5 dmg + 1 Enflame when fired). Replaces oldest if clip is full."}),
  C("blbf3","Load Flame Bullet",0,{loadBullet:"Fire",desc:"Load a Fire bullet (5 dmg + 1 Enflame when fired). Replaces oldest if clip is full."}),
  C("bsa","Steady Aim",1,{loadBullet:"Fire",setLinedUp:true,desc:"Load a Fire bullet. Lines up your next shot — Rifle Fire +50% dmg, or Kill Shot costs 1 less and Stuns."}),
  C("bks","Kill Shot",2,{consumesBullets:1,checksLinedUp:true,bonusMult:1.5,alwaysIgnoresBlock:true,linedUpStun:true,bonusBountyOnKill:8,desc:"Fire your last bullet at 1.5x, ignoring Block. If Lined Up: costs 1 less and Stuns. Kills grant +8 Rubees."}),
  C("bbh","Bullet Hell",2,{consumesBullets:1,randomHits:4,hitDmg:3,desc:"Fire the most recent bullet as 4 random 3-dmg hits (its secondary effect applies once, capped)."}),
  C("bar","Alpha's Roar",3,{dmg:18,dtype:"Slashing",bleed:3,aoe:true,isClaw:true,desc:"★ Deal 18 to ALL. Apply 3 Bleed."}),
  C("bmd","Mag Dump",3,{consumesBullets:99,distributeAcrossEnemies:true,desc:"★ Fire every loaded bullet, each at a different enemy (up to 4)."}),
  C("bps","Prone Shot",3,{consumesBullets:1,dmgMult:5,secondaryMult:3,magicDrawCap:1,desc:"★ Fire your last bullet at 5x dmg, 3x secondary effect (Magic draw capped at 1)."}),
  C("yellerwall","Screaming Candy - Yeller's Wall",3,{block:20,tireOnPlayRandomEnemy:true,forceRarity:"Djinn",desc:"★ Gain 20 Block. Apply Tire to a random enemy."}),
  C("bfd","Field Dressing",1,{heal:7,cleanse:true,desc:"Heal 7. Remove 1 debuff."}),
  C("lassietk","Lassie's Toolkit",1,{draw:1,drawPerEmptyClipSlot:1,energyGain:1,forceRarity:"Rare",desc:"Draw 1 card, plus 1 more for each empty slot in your clip. Gain 1 energy."}),
  C("bmf","Moonlit Fury",2,{dmg:10,dtype:"Slashing",fullMoonBonusDmgMult:1.5,fullMoonBecomesClaw:true,desc:"Deal 10 dmg. If Full Moon is active: becomes a Claw attack and deals +50% damage."}),
  C("bsm","Silver Moon",3,{dmg:10,dtype:"Slashing",heal:5,desc:"Deal 10 dmg. Heal based on Bleed."}),
  C("badr","Adrenaline",0,{energyGain:1,desc:"Gain 1 energy."}),
  C("bsw","Second Wind",1,{draw:2,desc:"Draw 2 cards."}),
  C("brf3","Rifle Fire",1,{consumesBullets:1,autoLoadIfEmpty:"Plain",linedUpDmgBonus:0.5,desc:"Fire your last loaded bullet (+50% if Lined Up). Empty clip: loads a Plain bullet instead."}),
  // ===== Magical (Enchant-granting, standalone) =====
  C("plutoshuffle","Pluto's Shuffle",1,{consumesBullets:1,autoLoadIfEmpty:"Plain",loadRandomAfterFire:true,forceRarity:"Uncommon",desc:"Fire the most recently loaded bullet. Then load a random bullet type into the clip."}),
  C("bme2","Ricochet Shot",1,{dmg:3,dtype:"Magical",randomHits:2,desc:"2 random hits, 3 dmg each."}),
  C("bme3","Ghost Load",1,{dmg:4,dtype:"Magical",drawIfMagicLoaded:true,desc:"Deal 4 dmg. Draws a card if a Magic bullet is currently loaded."}),
  C("bme4","Etherfall",2,{dmg:7,dtype:"Magical",enflame:1,aoe:true,desc:"Deal 7 dmg to ALL. Apply 1 Enflame to all."}),
  C("bme5","Arcane Takedown",2,{dmg:11,dtype:"Magical",stun:true,desc:"Deal 11 dmg. Stun if it penetrates Block."}),
  C("bme6","Spectral Rounds",2,{dmg:9,dtype:"Magical",ignoresBlock:true,desc:"Deal 9 dmg, ignores Block."}),
  C("bme7","Ether Charm",2,{dmg:8,dtype:"Magical",bonusIfMagicLoaded:5,desc:"Deal 8 dmg. If a Magic bullet is loaded, consumes it for +5 bonus dmg."}),
  C("bme8","Wraith Barrage",2,{dmg:3,dtype:"Magical",randomHits:4,desc:"4 random hits, 3 dmg each."}),
  C("bme9","Ether Storm",3,{dmg:12,dtype:"Magical",stun:true,aoe:true,desc:"★ Deal 12 dmg to ALL. Stun on each target it penetrates Block against."}),
  C("bme10","Ether Reckoning",3,{dmg:22,dtype:"Magical",energyGainOnKill:2,desc:"★ Deal 22 dmg. Gain 2 energy if this kills the target."}),
  // ===== Wolf Candy: Full Moon win-condition shift =====
  C("bwcfm","Wolf Candy - Full Moon",2,{requiresEmptyClip:true,fullMoonSweep:true,exhaust:true,desc:"★ Exhaust. Requires empty clip. Permanently turns every bullet card in your deck into Savage Claw."}),
  C("bwcbb","Wolf Candy - Bloodlust Blessing",2,{permanentHealBonus:0.5,exhaust:true,desc:"★ Exhaust. Permanent: all healing you receive is increased by 50%."}),
  C("bem","Extended Mag",2,{permanentClipSizeBonus:2,exhaust:true,desc:"Exhaust. Permanent: max clip size increases from 4 to 6."}),
  // ===== Clip-scaling =====
  C("bwew","Well Equipped Wolf",1,{dmgPerBulletLoaded:2,bleedPerBulletLoaded:1,dtype:"Blunt",desc:"Deal 2 dmg per bullet currently loaded. Apply 1 Bleed per bullet loaded. Doesn't consume them."}),
  C("bfc","Full Chamber",1,{blockPerBulletLoaded:3,desc:"Gain 3 Block per bullet currently loaded (doesn't consume them)."}),
  C("bac","Ammo Cache",2,{drawPerBulletLoadedCap:3,desc:"Draw 1 card per bullet loaded, capped at 3 (doesn't consume them)."}),
  // ===== Full Moon payoffs =====
  C("blr","Lycan Round",2,{dmg:8,dtype:"Blunt",fullMoonBonusHeal:5,fullMoonBecomesClaw:true,desc:"Deal 8 dmg. If Full Moon: also heal 5 and count as a Claw attack."}),
  C("bww","Werewolf's Ward",2,{block:8,fullMoonBonusBlock:6,desc:"Gain 8 Block. If Full Moon: gain 14 total instead."}),
  C("bhs","Howling Strike",2,{dmg:9,dtype:"Blunt",fullMoonBonusStun:true,desc:"Deal 9 dmg. If Full Moon: also applies Stun."}),
  C("bwcli","Wolf Candy - Lycan Instinct",1,{dmg:5,dtype:"Slashing",isClaw:true,bonusIfClipEmpty:4,desc:"Deal 5 dmg. +4 bonus damage if your clip is currently empty."}),
  // ===== Plain fillers =====
  C("bbrace","Brace",2,{block:9,cleanse:true,desc:"Gain 9 Block. Remove 1 debuff."}),
  C("brb2","Rending Bite",2,{dmg:11,dtype:"Slashing",bleed:1,isClaw:true,desc:"Deal 11 dmg. Apply 1 Bleed."}),
  C("bsfin","Savage Finisher",3,{dmg:18,dtype:"Slashing",isClaw:true,bonusIfTargetLowHp:6,desc:"Deal 18 dmg. +6 bonus if target is below 30% HP."}),
  C("bwcec","Wolf Candy - Ember Claw",3,{dmg:20,dtype:"Slashing",enflame:3,isClaw:true,desc:"Deal 20 dmg. Apply 3 Enflame."}),
  // ===== Healing & Defense =====
  C("cerberusbite","Cerberus's Bite",2,{dmg:15,dtype:"Slashing",enflame:2,isClaw:true,forceRarity:"Rare",desc:"Deal 15 dmg. Apply 2 Enflame."}),
  C("bds","Defensive Stance",2,{block:10,blockBonusIfClipEmpty:4,desc:"Gain 10 Block. +4 more if your clip is currently empty."}),
  C("bwcsc","Scrappy's Second Chance",2,{dmg:8,dtype:"Slashing",heal:4,isClaw:true,desc:"Deal 8 dmg. Heal 4."}),
  C("bih","Iron Hide",2,{block:12,cleanse:true,desc:"Gain 12 Block. Remove 1 debuff."}),
  C("bfmed","Field Medic",3,{heal:12,desc:"Heal 12."}),
  C("brp","Retaliation Plating",2,{block:7,retaliateDmg:5,retaliateDtype:"Blunt",desc:"Gain 7 Block. If hit while Blocked, deal 5 dmg back."}),
  C("bwctf","Wolf Candy - Thick Fur",1,{block:6,fullMoonBonusBlock:4,desc:"Gain 6 Block. If Full Moon is active, gain 10 total instead."}),
];

const RELIC_POOL = [
  // ===== Common (15) =====
  {id:"g1", name:"Rusty Hook", desc:"Gain 3 Block on your first turn of every Elite fight.", rarity:"Common", hook:"eliteFirstTurnBlock", val:3},
  {id:"g2", name:"Sailor's Locket", desc:"The first time you apply a debuff to an enemy each combat, heal 3 HP.", rarity:"Common", hook:"healOnDebuffApply", val:3},
  {id:"g3", name:"Chum Bucket", desc:"Defeating any enemy grants +1 bonus Bounty.", rarity:"Common", hook:"bonusBountyPerKill", val:1},
  {id:"g4", name:"Tarnished Compass", desc:"Heal 2 HP after winning any combat.", rarity:"Common", hook:"postCombatHeal", val:2},
  {id:"g5", name:"Frayed Knot", desc:"Gain 1 extra energy on the first turn of combat only.", rarity:"Rare", hook:"firstTurnEnergy", val:1},
  {id:"g6", name:"Cursed Doubloon", desc:"The first debuff applied to you each combat has its potency reduced by 1.", rarity:"Common", hook:"firstDebuffReduced"},
  {id:"g7", name:"Chipped Cutlass", desc:"Your first Attack each turn deals +2 damage.", rarity:"Common", hook:"firstAttackBonus", val:2},
  {id:"g8", name:"Weathered Buoy", desc:"Resting at an Oasis also grants +2 permanent max HP.", rarity:"Common", hook:"oasisBonus", val:2},
  {id:"g9", name:"Crab Shell Fragment", desc:"The first attack you take each combat deals 25% less damage.", rarity:"Common", hook:"firstHitReduction", val:0.25},
  {id:"g10", name:"Hollow Gourd", desc:"Ending your turn with an empty hand grants 4 Block at the start of your next turn.", rarity:"Common", hook:"emptyHandBlock", val:4},
  {id:"g11", name:"Tidepool Marble", desc:"Gain 3 Block automatically every 3rd turn.", rarity:"Common", hook:"everyThirdTurnBlock", val:3},
  {id:"g12", name:"Bent Fishhook", desc:"Heal 2 HP whenever a status effect (not a direct hit) finishes off an enemy.", rarity:"Common", hook:"statusKillHeal", val:2},
  {id:"g13", name:"Salted Twine", desc:"Your opening hand every boss fight is 6 cards instead of 5.", rarity:"Common", hook:"bossOpeningHandBonus", val:1},
  {id:"g14", name:"Moldy Hardtack", desc:"The first time you drop below 50% HP each combat, immediately heal 4 HP.", rarity:"Common", hook:"firstLowHpHeal", val:4},
  {id:"g15", name:"Fool's Gold Tooth", desc:"Common enemies grant +3 bonus Bounty.", rarity:"Common", hook:"commonBountyBonus", val:3},
  // ===== Uncommon (12) =====
  {id:"g16", name:"Kraken's Signet Ring", desc:"Applying a debuff to an enemy already carrying 2+ different debuff types deals 2 bonus damage.", rarity:"Uncommon", hook:"multiDebuffBonusDmg", val:2},
  {id:"g17", name:"Hollow Conch", desc:"Whenever Enchant triggers its energy payout, also draw 1 card.", rarity:"Uncommon", hook:"enchantBonusDraw", val:1},
  {id:"g18", name:"Sea Witch's Bead", desc:"Once per combat, the first time you'd die, survive at 1 HP instead. Breaks when it saves you.", rarity:"Uncommon", hook:"deathSave"},
  {id:"g18b", name:"Broken Sea Witch's Bead", desc:"You start every combat with 2 Bleed.", rarity:"Common", hook:"brokenSeaWitchBead", hiddenFromDraft:true},
  {id:"g19", name:"Snarled Netting", desc:"Enemies that attack you while you have 0 Block take 3 damage.", rarity:"Uncommon", hook:"zeroBlockPunish", val:3},
  {id:"g20", name:"Cracked Hourglass", desc:"Every 4th card you play each turn costs 1 less energy.", rarity:"Rare", hook:"everyFourthCardDiscount"},
  {id:"g21", name:"Sharpened Focus", desc:"Whenever you apply a Daze stack to an enemy, gain 1 Block.", rarity:"Uncommon", hook:"dazeApplyBlock", val:1},
  {id:"g22", name:"Witch-Light Lantern", desc:"Bleed and Enflame deal their first tick immediately on application, in addition to ticking normally later.", rarity:"Uncommon", hook:"instantFirstTick"},
  {id:"g23", name:"Moonstone Shard", desc:"Whenever you Stun an enemy, also apply 1 Tire to them.", rarity:"Uncommon", hook:"stunAppliesTire"},
  {id:"g24", name:"Salt-Crusted Bandana", desc:"The first time you're Rattled each combat, it's cleansed immediately.", rarity:"Uncommon", hook:"autoCleanseRattled"},
  {id:"g25", name:"Gilded Tusk", desc:"Elite kills grant double Bounty.", rarity:"Uncommon", hook:"eliteDoubleBounty"},
  {id:"g26", name:"Void-Touched Pearl", desc:"Whenever your hand is empty right after playing a card, draw 1 extra card.", rarity:"Uncommon", hook:"emptyHandDraw"},
  {id:"g27", name:"Rotten Figurehead", desc:"The strongest enemy in each fight is automatically Tired on their first turn.", rarity:"Uncommon", hook:"autoTireStrongest"},
  // ===== Rare (8) =====
  {id:"g28", name:"Plunderer's Taffy", desc:"Each enemy you kill grants a small permanent stacking damage bonus for the rest of the run.", rarity:"Djinn", hook:"killStackDamage", val:0.5},
  {id:"g29", name:"Deep Licorice", desc:"Max HP halved. All damage you deal is doubled.", rarity:"Djinn", apply:(p)=>{p.maxHp=Math.round(p.maxHp*0.5); p.hp=Math.min(p.hp, p.maxHp); if(p.baseMaxHp!==undefined) p.baseMaxHp=Math.round(p.baseMaxHp*0.5); p.heartOfAbyss=true;}},
  {id:"g30", name:"Kraken's Bargain", desc:"Permanent +25% max HP. Every combat's first turn starts with 2 energy instead of 3.", rarity:"Rare", hook:"krakensBargain", apply:(p)=>{const bonus=Math.round(p.maxHp*0.25); p.maxHp+=bonus; p.hp+=bonus; if(p.baseMaxHp!==undefined) p.baseMaxHp+=bonus;}},
  {id:"g31", name:"Ferryman's Toll", desc:"Once per run: instead of dying, lose all Rubees and survive at 25% max HP.", rarity:"Rare", hook:"ferrymanToll"},
  {id:"g32", name:"Sugarplum Sextant", desc:"Relic and card rewards always offer 1 additional choice.", rarity:"Djinn", hook:"abyssalCompass"},
  {id:"g33", name:"Leviathan's Eye", desc:"Enemies below 5% HP are instantly defeated the moment you deal damage to them.", rarity:"Rare", hook:"executeThreshold", val:0.05},
  {id:"g34", name:"Bloodmoon Shard", desc:"All Bleed and Enflame tick damage is increased by 50%.", rarity:"Rare", hook:"tickDamageBonus", val:0.5},
  {id:"g35", name:"Castaway's Life Saver", desc:"Once per combat, fatal damage instead discards your hand and grants Block equal to 5x cards discarded.", rarity:"Djinn", hook:"soulBoundSave"},
  // ===== Branch exclusive (5) =====
  {id:"gb1", name:"Djinn's Kindling", desc:"Whenever you apply Enflame to yourself, also apply 1 Enflame to a random enemy.", rarity:"Uncommon", hook:"djinnsKindling", captainOnly:"Branch"},
  {id:"gb2", name:"Marked Man's Ledger", desc:"The first detonate-effect card each combat deals double bonus damage.", rarity:"Djinn", hook:"cinderglassVial", captainOnly:"Branch"},
  {id:"gb3", name:"Phoenix Down Charm", desc:"Power cards cost 1 less to play.", rarity:"Rare", hook:"powerDiscount", captainOnly:"Branch"},
  {id:"gb4", name:"Flamebound Talon", desc:"Flame Body's Enflamed-death heal is tripled.", rarity:"Uncommon", hook:"flameBodyTriple", captainOnly:"Branch"},
  {id:"gb5", name:"Hotstreak Gumball", desc:"Whenever a detonation deals 15+ damage in one hit, gain 2 energy.", rarity:"Djinn", hook:"bigDetonateEnergy", captainOnly:"Branch"},
  // ===== Riley exclusive (5) =====
  {id:"gr1", name:"Weaver's Thread", desc:"Every 3rd stance switch this combat also grants 1 free card draw.", rarity:"Djinn", hook:"weaversThread", captainOnly:"Riley"},
  {id:"gr2", name:"Chaos-Bound Locket", desc:"The first time you enter Entropy each combat, gain 1 extra energy on top of the normal bonus.", rarity:"Uncommon", hook:"chaosBoundLocket", captainOnly:"Riley"},
  {id:"gr3", name:"Crimson Tally", desc:"Whenever a Bleed cash-in deals 10+ bonus damage, apply 5 Bleed to a second random enemy.", rarity:"Uncommon", hook:"crimsonTally", captainOnly:"Riley"},
  {id:"gr4", name:"Clarity Bandana", desc:"Clarity no longer decays from being unused at end of turn.", rarity:"Djinn", hook:"clarityBandana", captainOnly:"Riley"},
  {id:"gr5", name:"Fractured Hourglass", desc:"Power cards cost 1 less to play.", rarity:"Rare", hook:"powerDiscount", captainOnly:"Riley"},
  // ===== Broderick exclusive (5) =====
  {id:"gd1", name:"Extra Clip", desc:"Your clip's maximum size increases by 1 permanently.", rarity:"Rare", hook:"extraClip", captainOnly:"Broderick"},
  {id:"gd2", name:"Pocket Moon", desc:"Lunar Longevity triggers on your 1st Claw landing too, not just the 2nd.", rarity:"Djinn", hook:"pocketMoon", captainOnly:"Broderick"},
  {id:"gd3", name:"Lycan Blood Wine", desc:"Full Moon's Savage Claw conversions also grant +1 Bleed on top of their normal effect.", rarity:"Djinn", hook:"lycanBloodWine", captainOnly:"Broderick"},
  {id:"gd4", name:"FireWolf Soul", desc:"Re-applying Enflame to an already-Enflamed enemy deals +1 bonus damage per existing stack.", rarity:"Uncommon", hook:"krakensTooth", captainOnly:"Broderick"},
  {id:"gd5", name:"Utility Jacket", desc:"Power cards cost 1 less to play.", rarity:"Rare", hook:"powerDiscount", captainOnly:"Broderick"},
];
const BOSS_RELIC_POOL = [
  {id:"gboss1", name:"Sugarblood Crown", desc:"+40% damage on all your attacks. −25% max HP.", rarity:"Djinn", hook:"sugarbloodCrown"},
  {id:"gboss2", name:"Bittersweet Heart", desc:"+1 damage per turn elapsed in the current fight (resets each combat). Healing reduced 50% for the rest of the run.", rarity:"Djinn", hook:"bittersweetHeart"},
  {id:"gboss3", name:"One Last Gumdrop", desc:"Once per combat, the first time you'd die, survive at 1 HP instead. Also, start every combat Rattled for the first 4 turns.", rarity:"Djinn", hook:"oneLastGumdrop"},
  {id:"gboss4", name:"Bottomless Candy Bag", desc:"Your starting hand size increases by 2 every combat. You can no longer gain Block from any source.", rarity:"Djinn", hook:"bottomlessCandyBag"},
  {id:"gboss5", name:"Rock Candy Curse", desc:"All Enflame, Bleed, Daze, and Tire you apply are permanently doubled. Enemies apply their own debuffs to you at double potency. All damage you take is increased by 50%.", rarity:"Djinn", hook:"rockCandyCurse"},
  {id:"gboss6", name:"Greedy Djinn's Jar", desc:"Triples all Bounty earned for the rest of the run. King in Green now guards F&J Emporium — you must defeat him each time you try to shop.", rarity:"Djinn", hook:"greedyDjinnsJar"},
  {id:"gboss7", name:"Candy Corn Crown", desc:"Gain 2 extra energy every turn. Lose 7% of your max HP permanently at the start of every combat.", rarity:"Djinn", hook:"candyCornCrown"},
  {id:"gboss8", name:"Sugar Rush Satchel", desc:"All your Power cards are free to play and never cost Rubees to acquire. You may only carry 3 cards in hand at a time for the rest of the run.", rarity:"Djinn", hook:"sugarRushSatchel"},
  {id:"gboss9", name:"Wishing Gumball", desc:"Instantly defeat any enemy below 20% HP the moment you deal damage to them. Your maximum HP is permanently halved.", rarity:"Djinn", hook:"wishingGumball"},
  {id:"gboss10", name:"Two-Faced Toffee", desc:"All damage you deal is increased by 25%, and all damage you take is increased by 25%.", rarity:"Djinn", hook:"twoFacedToffee"},
];
function applyRelicHooks(hookName, ctx){
  if (!G.player.relics) return;
  for (const r of G.player.relics){
    if (r.hook === hookName){
      switch(hookName){
        case "combatStartHeal": G.player.hp = Math.min(G.player.maxHp, G.player.hp + r.val); pushLogQuiet(`${r.name} heals ${r.val} HP.`); break;
        case "combatStartTire": { const alive = G.combat.enemies.filter(e=>e.alive); if(alive.length){ applyTire(alive[Math.floor(Math.random()*alive.length)]); pushLogQuiet(`${r.name} applies Tire.`);} break; }
        case "onKillHeal": G.player.hp = Math.min(G.player.maxHp, G.player.hp + r.val); break;
      }
    }
  }
}
function hasRelicHook(hookName){ return (G.player.relics||[]).some(r=>r.hook===hookName); }
function relicVal(hookName){ const r=(G.player.relics||[]).find(r=>r.hook===hookName); return r?r.val:0; }
function relicHookCount(hookName){ return (G.player.relics||[]).filter(r=>r.hook===hookName).length; }
const CAPTAINS = {
  Branch: { name:"Branch", maxHp:75, starter:BRANCH_STARTER, pool:BRANCH_POOL, candy:"Fireball Candy",
            trait:"Flame Body — first attacker each combat is Enflamed; heal 1 HP whenever an Enflamed enemy dies.",
            color:"var(--fire)" },
  Riley: { name:"Riley", maxHp:70, starter:RILEY_STARTER, pool:RILEY_POOL, candy:"No Candy — Clarity",
            trait:"Honed Clarity — gain 1 Block whenever you switch stances (Four Sword, Fist Blade, or Entropy).",
            color:"var(--slash)" },
  Broderick: { name:"Broderick", maxHp:80, starter:BRODERICK_STARTER, pool:BRODERICK_POOL, candy:"Wolf Candy",
            trait:"Lunar Longevity — heal 3 HP on your 2nd genuine Claw attack each turn. Always Armed — load a Plain bullet at the start of any turn your clip is empty.",
            color:"var(--blunt)" },
};

// ============ ENEMIES ============
function E(name, hp, atk, opts) {
  return Object.assign({ name, hp, atk, resist:{}, weak:{}, armored:false, tag:null, count:1 }, opts||{});
}
const ACT1_COMMONS = [
  E("Grunt Pirate",40,6,{weak:{Blunt:0.10}}),
  E("Reef Crab",34,5,{resist:{Slashing:0.20},weak:{Blunt:0.15},tag:"shield8"}),
  E("Squabbling Gull",18,4,{weak:{Fire:0.10},tag:"pair",count:2}),
  E("Sand Viper Fish",30,5,{tag:"tire_alt"}),
  E("Drowned Sailor",44,6,{resist:{Magical:0.10},tag:"harden_grow"}),
  E("Mermaid Enchantress",32,5,{tag:"daze_open"}),
  E("Bilge Crab Swarm",12,2,{resist:{Slashing:0.10},tag:"swarm3",count:3}),
];
const ACT1_ELITES = [
  E("Middle Class Merman",100,14,{tag:"burst_buff",bounty:32}),
  E("Rock Candy Brute",105,10,{resist:{Slashing:0.20},weak:{Blunt:0.15},tag:"shield25",bounty:35}),
  E("Reef Witch",95,12,{tag:"tire_atk_daze",bounty:30}),
  E("Iron-Hulled Coast Bandit",110,10,{tag:"sea_legs",bounty:28}),
  E("Drowned Choir",40,4,{tag:"trio_harden",count:3,bounty:25}),
  E("Anchor Brothers",70,7,{tag:"duo_block_share",count:2,bounty:26}),
];
const ACT1_BOSSES = [
  E("Failed Dread Pirate Scott",200,20,{tag:"rising_tide_boss",bounty:70}),
  E("Rejected Sirens",60,9,{tag:"trio_lowest_first",count:3,bounty:65}),
  E("Krabby Twins",90,10,{tag:"twins",count:2,bounty:65}),
];
const ACT2_COMMONS = [
  E("Scurvy Gum Marine",50,7,{weak:{Blunt:0.10}}),
  E("Taffy Tongue Spectre",50,6,{resist:{Magical:0.10},tag:"undertow_open"}),
  E("Gummy Bear Golem",58,7,{resist:{Slashing:0.10},tag:"harden_grow"}),
  E("Lobster Bisque Knight",55,6,{resist:{Slashing:0.25},weak:{Blunt:0.15},tag:"shield20"}),
  E("Chocolate Wraith",60,7,{tag:"corrosion"}),
  E("Deadly Kendo Mermaid",65,8,{tag:"bleed_applier"}),
  E("Flame Dolphins",25,4,{tag:"enflame_mutual",count:3}),
  E("Flying Fish Marine Unit",20,5,{weak:{Fire:0.10},tag:"flying",count:3}),
];
const ACT2_ELITES = [
  E("Sea Floor Boss Man",120,9,{tag:"undertow_open",bounty:30}),
  E("Gummy Worm Disciple",130,8,{resist:{Slashing:0.25,Fire:0.10},weak:{Blunt:0.15},tag:"shield25_corrosion",bounty:34}),
  E("Caramel Crust Soldier",130,10,{tag:"corrosion",bounty:34}),
  E("Nepo Baby Merman",70,6,{tag:"duo_harden_share",count:2,bounty:28}),
  E("Sour Zoina",130,9,{tag:"bleed_applier_rage",bounty:36}),
  E("Flying Fish Fathers",45,5,{tag:"flying",count:3,bounty:32}),
  E("Giant Inferno Shark",140,12,{tag:"enflame_mutual",bounty:40}),
];
const ACT2_BOSSES = [
  E("Admiral Aflam",300,18,{tag:"aflam",bounty:100}),
  E("University of Fish",85,8,{resist:{Slashing:0.25},weak:{Fire:0.10},tag:"uof",count:3,bounty:75}),
  E("Armored Tentacle",290,20,{resist:{Slashing:0.30,Fire:0.10},weak:{Blunt:0.15},armored:true,tag:"tentacle",bounty:85}),
];
const KING_IN_GREEN = E("King in Green",400,22,{tag:"king_in_green",bounty:120});
const ACT3_BOSSES = [
  E("Concept of Sweet",340,20,{tag:"concept_of_sweet",bounty:140}),
  E("Yellow Yonka",350,18,{tag:"yellow_yonka",bounty:150}),
  E("Hours That Pass",360,16,{tag:"hours_that_pass",bounty:160}),
  E("True Yonk's Shadow",480,22,{tag:"true_yonk_shadow",bounty:200}),
];
const ACT3_COMMONS = [
  E("Melting Smile",130,10,{tag:"corrosion"}),
  E("Sugarplum Eye",120,9,{tag:"daze_open"}),
  E("Wrong Number Nougat",130,9,{tag:"harden_grow"}),
  E("Static Gumdrop",125,10,{tag:"tire_alt"}),
  E("Please Stop Smiling",135,9,{tag:"shield25"}),
  E("Aftertaste",130,10,{tag:"enflame_mutual"}),
  E("Torn Recipe Card",125,10,{tag:"bleed_applier_rage"}),
  E("Too-Sweet Choir",70,8,{tag:"duo_harden_share",count:2}),
];
const ACT3_ELITES = [
  E("Silence Wearing a Smile",140,14,{tag:"muted_source",bounty:55}),
  E("Uncounted Veil",160,15,{tag:"uncounted_veil",bounty:58}),
  E("Wax-Sealed Choir",60,7,{tag:"wax_sealed_choir",count:3,bounty:60}),
  E("Unbounded Truth",150,12,{tag:"unbounded_truth",bounty:57}),
  E("Returnal Scion",170,14,{tag:"returnal_scion",bounty:62}),
  E("Djinnball Jar",150,13,{tag:"djinnball_jar",bounty:60}),
  E("Double Scoop",130,12,{tag:"double_scoop",bounty:55}),
  E("Appetite Concept",160,13,{tag:"appetite_concept",bounty:58}),
];
