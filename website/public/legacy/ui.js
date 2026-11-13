// ============ GAME STATE ============
let G = null; // global game state

function freshDeck(starter){
  return { all: starter.map(c=>({...c})), draw: [], discard: [], hand: [] };
}
const SAVE_KEY = "tremendousSeaSave";
function saveGame(){
  if (!G || !G.captainKey || G.over) return;
  try {
    const serialized = JSON.stringify(G, (key, value) => {
      if (key === "cap") return undefined; // re-derived from captainKey on load
      if (value instanceof Set) return {__isSet: true, values: [...value]};
      if (typeof value === "function") return undefined;
      return value;
    });
    localStorage.setItem(SAVE_KEY, serialized);
  } catch(e) { /* localStorage unavailable or full; fail silently, not critical */ }
}
function clearSave(){
  try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
}
function hasSavedGame(){
  try { return !!localStorage.getItem(SAVE_KEY); } catch(e) { return false; }
}
function loadSavedGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw, (key, value) => {
      if (value && value.__isSet) return new Set(value.values);
      return value;
    });
    if (!parsed || !parsed.captainKey || !CAPTAINS[parsed.captainKey]) return null;
    parsed.cap = CAPTAINS[parsed.captainKey];
    return parsed;
  } catch(e) { return null; }
}
function resumeGame(){
  const loaded = loadSavedGame();
  if (loaded){ G = loaded; render(); } else { clearSave(); render(); }
}
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function newCombatReset(deck){
  deck.draw = shuffle(deck.all.map(c=>({...c})));
  deck.discard = [];
  deck.hand = [];
}
function drawCards(deck, n){
  const cap = (typeof G !== "undefined" && G && G.player && typeof hasRelicHook === "function" && hasRelicHook("sugarRushSatchel")) ? 3 : 8;
  for(let i=0;i<n;i++){
    if (deck.hand.length>=cap) break;
    if (deck.draw.length===0){
      if (deck.discard.length===0) return;
      deck.draw = shuffle(deck.discard); deck.discard=[];
    }
    deck.hand.push(deck.draw.pop());
  }
}
function discardHand(deck){ deck.discard.push(...deck.hand); deck.hand=[]; }

function buildBranchingMap(commons, elites, bosses, laneCount, eliteFloorPlan){
  const c = ()=> commons[Math.floor(Math.random()*commons.length)];
  // eliteFloorPlan: array of booleans, one per Elite floor, true = mandatory (no bypass), false = bypassable
  const chosenElites = shuffle([...elites]).slice(0, Math.max(2, eliteFloorPlan.length));
  const floorPlans = [];
  let eliteIdx = 0;
  const addElitePair = (mandatory)=>{
    floorPlans.push({kind:"oasis", bypass: mandatory ? null : "common"});
    floorPlans.push({kind:"elite", eliteIdx: eliteIdx % chosenElites.length, bypass: mandatory ? null : "common"});
    eliteIdx++;
  };
  floorPlans.push({kind:"common", soloFloor:true});
  floorPlans.push({kind:"common"}, {kind:"event"});
  addElitePair(eliteFloorPlan[0]);
  const isLongAct = eliteFloorPlan.length >= 5;
  if (isLongAct){
    floorPlans.push({kind:"shop"}, {kind:"common"}, {kind:"event"});
  } else {
    floorPlans.push({kind:"shop"}, {kind:"common"}, {kind:"common"}, {kind:"event"});
  }
  for (let i=1; i<eliteFloorPlan.length; i++){
    addElitePair(eliteFloorPlan[i]);
    if (i < eliteFloorPlan.length-1 && !isLongAct) floorPlans.push({kind:"common"});
  }
  floorPlans.push({kind:"shop"}, {kind:"common"}, {kind:"oasis"});

  let nodeIdCounter = 0;
  const floors = [];
  for (let f=0; f<floorPlans.length; f++){
    const plan = floorPlans[f];
    const nodesThisFloor = [];
    const floorLaneCount = plan.soloFloor ? 1 : laneCount;
    const guaranteedKeepLane = plan.bypass ? Math.floor(Math.random()*floorLaneCount) : -1;
    // Every floor gets a chance for individual lanes to diverge into a different
    // kind, not just the Elite/Oasis-before-Elite floors — this is what actually
    // makes different lanes feel like different paths rather than parallel copies.
    const altKindFor = k => k==="common" ? (Math.random()<0.5 ? "event" : "oasis") : (k==="event" || k==="shop" || k==="oasis") ? "common" : null;
    for (let lane=0; lane<floorLaneCount; lane++){
      let kind = plan.kind;
      if (plan.soloFloor){
        // first floor: always a guaranteed common fight, no variation
      } else if (plan.bypass && lane !== guaranteedKeepLane && Math.random() < 0.4){
        kind = plan.bypass;
      } else if (!plan.bypass && plan.kind !== "elite" && plan.kind !== "boss" && Math.random() < 0.3){
        const alt = altKindFor(plan.kind);
        if (alt) kind = alt;
      }
      let def = null;
      if (kind === "common") def = c();
      else if (kind === "elite") def = chosenElites[plan.eliteIdx];
      nodesThisFloor.push({id:`n${nodeIdCounter++}`, floor:f, lane, kind, def, connectsTo:[], skippable: !plan.soloFloor && kind!=="elite" && kind!=="boss" && !(plan.bypass===null && plan.kind==="elite")});
    }
    floors.push(nodesThisFloor);
  }
  const bossNode = {id:`n${nodeIdCounter++}`, floor:floorPlans.length, lane:0, kind:"boss", def: bosses[Math.floor(Math.random()*bosses.length)], connectsTo:[]};
  floors.push([bossNode]);

  for (let f=0; f<floors.length-1; f++){
    const current = floors[f];
    const next = floors[f+1];
    for (const node of current){
      const numConnections = next.length===1 ? 1 : (Math.random()<0.35 ? 2 : 1);
      const targets = new Set();
      const primaryIdx = Math.min(node.lane, next.length-1);
      targets.add(primaryIdx);
      while (targets.size < numConnections && targets.size < next.length){
        targets.add(Math.floor(Math.random()*next.length));
      }
      node.connectsTo = [...targets].map(idx=>next[idx].id);
    }
    const reachable = new Set();
    for (const node of current) for (const id of node.connectsTo) reachable.add(id);
    for (const nextNode of next){
      if (!reachable.has(nextNode.id)){
        const src = current[Math.floor(Math.random()*current.length)];
        src.connectsTo.push(nextNode.id);
      }
    }
  }
  // Path-length variation: nodes on skippable (non-mandatory) floors occasionally
  // get an ADDITIONAL connection straight to floor+2, giving some lanes a genuinely
  // shorter route. Additive only — never removes the normal floor+1 connections,
  // so no orphans and mandatory Elite floors are never affected.
  for (let f=0; f<floors.length-2; f++){
    const current = floors[f];
    const skipTarget = floors[f+2];
    if (!skipTarget || skipTarget.length===0) continue;
    for (const node of current){
      if (node.skippable && Math.random() < 0.15){
        const targetIdx = Math.min(node.lane, skipTarget.length-1);
        node.connectsTo.push(skipTarget[targetIdx].id);
      }
    }
  }
  return floors;
}
function findNodeById(id){
  if (id === "start" && G.startNode) return G.startNode;
  if (!G.mapFloors) return null;
  for (const floor of G.mapFloors){
    const found = floor.find(n=>n.id===id);
    if (found) return found;
  }
  return null;
}
function getCurrentNode(){ return findNodeById(G.currentNodeId); }
function startMapAtEntry(){
  G.currentNodeId = G.mapFloors[0][0].id;
  G.visitedNodeIds = new Set([G.currentNodeId]);
  G.pendingMapChoice = false;
}
function advanceFromCurrentNode(){
  const node = getCurrentNode();
  if (!node) return;
  if (node.connectsTo.length === 0) return; // boss node, handled elsewhere
  G.pendingMapChoice = true;
  render();
}
function chooseNextNode(nodeId){
  G.pendingMapChoice = false;
  G.currentNodeId = nodeId;
  G.visitedNodeIds.add(nodeId);
  advanceNode();
}

function startGame(captainKey){
  const cap = CAPTAINS[captainKey];
  G = {
    captainKey, cap,
    player: makeCombatant(cap.name, cap.maxHp, {}),
    deck: freshDeck(cap.starter),
    pool: cap.pool.map(c=>({...c})),
    act: 1,
    mapFloors: buildBranchingMap(ACT1_COMMONS, ACT1_ELITES, ACT1_BOSSES, 3, [true, false]),
    currentNodeId: null,
    visitedNodeIds: new Set(),
    pendingMapChoice: false,
    combat: null,
    log: [],
    over: false,
    won: false,
    flameBodyDone:false,
    rubees: 0,
    removalPrice: 50,
    healPrice: 20,
    crewEventsSeen: new Set(),
    crewPrereqsMet: new Set(),
    pendingCrewCardAward: null,
    pendingEventGearAward: null,
    pendingBonusEnergyNextFight: 0,
    pendingShopGuardVictory: false,
    seizedCard: null,
    seizedCardReturnTurn: 0,
  };
  startMapAtEntry();
  advanceNode();
}

function pushLog(msg){ G.log.unshift(msg); if(G.log.length>40) G.log.pop(); render(); }
function pushLogQuiet(msg){ G.log.unshift(msg); if(G.log.length>40) G.log.pop(); }

// ============ COMBAT SETUP ============
function spawnEnemies(def){
  const n = def.count || 1;
  const list = [];
  const uofProfiles = [
    {resist:{Slashing:0.25}, weak:{Fire:0.10}, suffix:" (Coral Justicar)"},
    {resist:{Fire:0.25}, weak:{Blunt:0.10}, suffix:" (Ember Warden)"},
    {resist:{Blunt:0.25}, weak:{Slashing:0.10}, suffix:" (Tidal Enforcer)"},
  ];
  for(let i=0;i<n;i++){
    let resist = def.resist, weak = def.weak, nameSuffix = "";
    if (def.tag==="uof" && uofProfiles[i]){
      resist = uofProfiles[i].resist; weak = uofProfiles[i].weak; nameSuffix = uofProfiles[i].suffix;
    }
    const e = makeCombatant(def.name+nameSuffix, def.hp, {resist, weak, armored:def.armored, tag:def.tag, atk:def.atk});
    if (def.tag==="shield8") gainBlock(e,8);
    if (def.tag==="shield25") gainBlock(e,25);
    if (def.tag==="shield20") gainBlock(e,20);
    if (def.tag==="shield25_corrosion") gainBlock(e,25);
    list.push(e);
  }
  return list;
}

function enterCombat(def){
  newCombatReset(G.deck);
  G.player.block = 0;
  G.player.status = newStatus();
  G.player.hitBefore = false;
  G.player._t1 = true;
  G.combat = {
    startRubees: G.rubees,
    enemies: spawnEnemies(def),
    immovableCharge: {on:false},
    turn: 1,
    phase: "player", // player | resolving
    selectedCard: null,
    over: false,
    win: null,
  };
  drawCards(G.deck, 5);
  pushLogQuiet(`--- Combat begins: ${def.name}${def.count>1?` x${def.count}`:""} ---`);
  render();
}

function endCombatCleanup(){
  discardHand(G.deck);
  G.combat = null;
}

// ============ PLAYER CARD PLAY ============
function currentCost(card){
  let cost = card.cost;
  if (!G.combat) return cost;
  if (card.name==="Charred Cross" && G.combat.lastCardName==="Flame Jab") cost = 1;
  if (card.name==="Scorch Kick" && G.combat.attacksPlayedThisTurn===1) cost = 0;
  if (card.name==="Wildfire Haymaker" && G.combat.prevTurnCardNames.includes("Flame Jab") && G.combat.prevTurnCardNames.includes("Charred Cross")) cost = 2;
  if (card.name==="Fuel the Fire" && G.combat.fuelDiscountReady) cost = 0;
  if (isRiley() && card.homeStance==="Entropy" && G.player.stance==="Entropy" && !card.locked){
    cost = Math.max(0, cost - 1);
  }
  if (card.name==="Kill Shot" && G.combat.linedUp){
    cost = Math.max(0, cost - 1);
  }
  if (isRiley() && card.costLessIfTargetBleeding && G.combat.enemies.some(e=>e.alive && e.status.bleed>0)){
    cost = Math.max(0, cost - card.costLessIfTargetBleeding);
  }
  if (hasRelicHook("everyFourthCardDiscount") && (((G.combat.cardsPlayedThisTurnCount||0)+1) % 4 === 0)){
    cost = Math.max(0, cost - 1);
  }
  if (card.exhaust && hasRelicHook("powerDiscount")){
    cost = Math.max(0, cost - 1);
  }
  if (hasRelicHook("sugarRushSatchel") && card.exhaust){
    cost = 0;
  }
  return cost;
}
function affordable(card){
  const dazeMod = G.player.status.rattled>0 ? 1 : 0;
  if (isRiley() && card.locked && G.player.stance !== card.homeStance) return false;
  if (isBroderick() && card.requiresEmptyClip && G.player.clip.length > 0) return false;
  if (isRiley() && card.requiresMinClarity && G.player.clarity < card.requiresMinClarity) return false;
  if (isRiley() && card.consumesClarityCost && G.player.clarity < card.consumesClarityCost) return false;
  if (isRiley() && card.requiresSwitchedThisTurn && !G.combat.switchedThisTurn) return false;
  if (G.player.status.muted > 0 && cardRarity(card) !== "Common") return false;
  return (currentCost(card) + dazeMod) <= G.combat.energy;
}

function selectCard(idx){
  if (G.combat.phase!=="player") return;
  const card = G.deck.hand[idx];
  if (!affordable(card)) return;
  const isSingleTargetEffect = (card.dmg>0 && !card.randomHits) || card.enflame>0 || card.bleed>0 || card.tire>0 || card.daze>0 || card.selfDetonate || card.fuelTheFire || card.bankedCoals || card.consumeClarityForDamage>0 || card.scaleWithClarity || (card.consumesBullets>0 && !card.randomHits && !card.distributeAcrossEnemies) || card.dmgPerBulletLoaded>0 || card.consumeClarityMinForDamage>0 || card.doubleThenDetonate || card.detonate;
  const needsTarget = !card.aoe && isSingleTargetEffect;
  const aliveEnemies = G.combat.enemies.filter(e=>e.alive);
  if (needsTarget && aliveEnemies.length>1){
    G.combat.pendingCardIdx = idx;
    render();
  } else {
    playCard(idx, aliveEnemies[0] || null);
  }
}

function playCardOnTarget(enemyIdx){
  if (G.combat.pendingCardIdx==null) return;
  const idx = G.combat.pendingCardIdx;
  G.combat.pendingCardIdx = null;
  playCard(idx, G.combat.enemies[enemyIdx]);
}

function playCard(idx, target, isRepeatedPlay){
  if (!isRepeatedPlay && window.game?.scene.getScenes(true)[0]?.playerBody?.getData?.("clarityAttackPlaying")) return;
  const card = isRepeatedPlay ? idx : G.deck.hand[idx];
  if (!card || (!isRepeatedPlay && !affordable(card))) return;
  window.beginBranchCardAnimation?.(card, G.captainKey === "Branch");
  try { return resolveCardEffects(idx, target, isRepeatedPlay); }
  finally { window.endBranchCardAnimation?.(); }
}

function resolveCardEffects(idx, target, isRepeatedPlay){
  const card = isRepeatedPlay ? idx : G.deck.hand[idx];
  if (!isRepeatedPlay){
    if (isRiley() && card.locked && G.player.stance !== card.homeStance) return; // safety net
    if (G.player.status.muted > 0 && cardRarity(card) !== "Common") return; // safety net
    const dazeMod = G.player.status.rattled>0 ? 1 : 0;
    let cost = currentCost(card) + dazeMod;
    if (hasRelicHook("firstCardDiscount") && !G.combat.usedFirstCardDiscount && cost > 0){
      cost -= 1; G.combat.usedFirstCardDiscount = true;
      pushLogQuiet("Weathered Rope discounts this card.");
    }
    if (cost > G.combat.energy) return;
    if (card.name==="Fuel the Fire" && G.combat.fuelDiscountReady) G.combat.fuelDiscountReady = false;
    G.combat.energy -= cost;
    G.deck.hand.splice(idx,1);
    G.combat.cardsPlayedThisTurnCount = (G.combat.cardsPlayedThisTurnCount||0) + 1;
    if (card.exhaust){
      pushLogQuiet(`${card.name} is exhausted — removed from the deck for the rest of this combat.`);
      if (hasRelicHook("sugarRushSatchel")){
        pushLogQuiet(`The Sugar Rush Satchel refunds ${card.name}'s Rubees cost — it need not be re-purchased.`);
      }
    } else {
      G.deck.discard.push(card);
    }
    if (hasRelicHook("emptyHandDraw") && G.deck.hand.length===0){
      drawCards(G.deck, 1);
      pushLogQuiet(`Void-Touched Pearl draws an extra card.`);
    }
    G.combat.lastCardName = card.name;
    if (!card.repeatLastCard){
      G.combat.lastCardObj = card;
      G.combat.lastCardTarget = target;
    }
    G.combat.thisTurnCardNames.push(card.name);
    if (card.dmg>0) G.combat.attacksPlayedThisTurn++;
  } else {
    pushLogQuiet(`Encore repeats ${card.name}!`);
  }
  if (card.cursedCandy){
    G.player.hp = Math.max(0, G.player.hp - 5);
    pushLogQuiet(`Cursed Candy bites back — 5 damage to yourself!`);
    if (G.player.hp <= 0){ G.player.alive = false; checkCombatEnd(); render(); return; }
    checkCombatEnd();
    render();
    return;
  }
  const isEffectivelyMagical = card.dtype==="Magical" || (isBranch() && G.player.fireToMagical && card.dtype==="Fire");
  if (isEffectivelyMagical && (card.dmg>0 || card.randomHits>0 || card.scaleWithClarity || card.consumeClarityForDamage>0)){
    grantEnchant(1);
  }
  let magicSynergyBonus = 0;
  if (isBroderick()){
    if (card.drawIfMagicLoaded && G.player.clip.includes("Magic")){
      drawCards(G.deck, 1);
      pushLogQuiet(`A Magic bullet hums in the clip — draws a card.`);
    }
    if (card.bonusIfMagicLoaded){
      const idx2 = G.player.clip.lastIndexOf("Magic");
      if (idx2 !== -1){
        G.player.clip.splice(idx2, 1);
        magicSynergyBonus = card.bonusIfMagicLoaded;
        pushLogQuiet(`Consumes the loaded Magic bullet for +${magicSynergyBonus} bonus damage.`);
      }
    }
  }

  if (isBroderick() && (card.loadBullet || card.consumesBullets)){
    resolveBulletCard(card, target);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }

  if (isBroderick() && card.fullMoonSweep){
    G.player.fullMoonActive = true;
    G.player.fullMoonOriginalDeck = G.deck.all.map(c=>({...c}));
    const bonusBleed = hasRelicHook("lycanBloodWine") ? 1 : 0;
    const template = G.deck.all.find(c=>c.name==="Savage Claw") || {id:"fmclaw",name:"Savage Claw",cost:1,dmg:4,dtype:"Slashing",heal:2,bleed:1,isClaw:true,desc:"Deal 4 dmg. Heal 2. Apply 1 Bleed."};
    const finalTemplate = bonusBleed ? {...template, bleed:(template.bleed||0)+bonusBleed} : template;
    const isBulletCard = c => !!(c.loadBullet || c.consumesBullets || c.permanentHealBonus || c.permanentClipSizeBonus || c.fullMoonSweep);
    const sweep = arr => arr.map(c => isBulletCard(c) ? {...finalTemplate} : c);
    G.deck.all = sweep(G.deck.all);
    G.deck.draw = sweep(G.deck.draw);
    G.deck.hand = sweep(G.deck.hand);
    G.deck.discard = sweep(G.deck.discard);
    pushLogQuiet(`🐺 Full Moon rises! Every bullet-related card becomes Savage Claw.`);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isBroderick() && card.permanentHealBonus){
    G.player.healBonusPct = (G.player.healBonusPct||0) + card.permanentHealBonus;
    pushLogQuiet(`Bloodlust Blessing: healing increased by ${Math.round(card.permanentHealBonus*100)}% for the rest of combat.`);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isBroderick() && card.permanentClipSizeBonus){
    G.player.clipMax = (G.player.clipMax||4) + card.permanentClipSizeBonus;
    pushLogQuiet(`Extended Mag: clip size increased to ${G.player.clipMax}.`);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isBroderick() && (card.dmgPerBulletLoaded || card.blockPerBulletLoaded || card.drawPerBulletLoadedCap || card.bleedPerBulletLoaded)){
    const n = G.player.clip.length;
    if (card.dmgPerBulletLoaded && target && target.alive){
      const dmgAmt = card.dmgPerBulletLoaded * n;
      if (dmgAmt > 0){
        const dealt = takeDamage(target, dmgAmt, card.dtype, false);
        const bonus = tryCashInBleed(target, dealt);
        if (bonus>0){ target.hp = Math.max(0, target.hp-bonus); if(target.hp===0) target.alive=false; }
      }
      pushLogQuiet(`Deals damage for ${n} loaded bullets.`);
    }
    if (card.bleedPerBulletLoaded && target && target.alive){
      const bleedAmt = card.bleedPerBulletLoaded * n;
      if (bleedAmt > 0){
        applyBleed(target, bleedAmt);
        pushLogQuiet(`Applies ${bleedAmt} Bleed for ${n} loaded bullets.`);
      }
    }
    if (card.blockPerBulletLoaded){
      gainBlock(G.player, card.blockPerBulletLoaded * n);
    }
    if (card.drawPerBulletLoadedCap){
      drawCards(G.deck, Math.min(n, card.drawPerBulletLoadedCap));
    }
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }

  if (isBranch() && card.selfEnflame){
    applyEnflame(G.player, card.selfEnflame);
    pushLogQuiet(`You apply ${card.selfEnflame} Enflame to yourself.`);
    if (hasRelicHook("djinnsKindling")){
      const alive = G.combat.enemies.filter(e=>e.alive);
      if (alive.length>0){
        const t = alive[Math.floor(Math.random()*alive.length)];
        applyEnflame(t, 1);
        pushLogQuiet(`Djinn's Kindling spreads 1 Enflame to ${t.name}.`);
      }
    }
  }
  if (isBranch() && card.permanentFireDmgBonus){
    G.player.fireDamageBonus = (G.player.fireDamageBonus||0) + card.permanentFireDmgBonus;
    pushLogQuiet(`Gain +${card.permanentFireDmgBonus} permanent Fire damage.`);
  }
  if (isBranch() && (card.fireToMagicalPower || card.flameOnPower || card.cinderguardPower)){
    if (card.fireToMagicalPower) G.player.fireToMagical = true;
    if (card.flameOnPower) G.player.flameOnActive = true;
    if (card.cinderguardPower) G.player.cinderguardActive = true;
    pushLogQuiet(`${card.name} takes permanent effect.`);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isRiley() && (card.unbrokenFocusPower || card.aboveTimePower || card.bloodFeudPower)){
    if (card.unbrokenFocusPower) G.player.unbrokenFocusActive = true;
    if (card.aboveTimePower) G.player.aboveTimeActive = true;
    if (card.bloodFeudPower) G.player.bloodFeudActive = true;
    pushLogQuiet(`${card.name} takes permanent effect.`);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isRiley() && card.generateClarityFlat){
    if (card.hpCost){
      G.player.hp = Math.max(0, G.player.hp - card.hpCost);
      pushLogQuiet(`${card.name} costs ${card.hpCost} HP.`);
      if (G.player.hp <= 0){ G.player.alive = false; checkCombatEnd(); render(); return; }
    }
    gainClarity(card.generateClarityFlat);
    if (card.bonusClarityOnNextSwitch){
      G.combat.bonusClarityOnNextSwitch = card.bonusClarityOnNextSwitch;
      pushLogQuiet(`Your next stance switch this turn will generate bonus Clarity.`);
    }
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isRiley() && (card.consumeClarityMinForDamage || card.consumeClarityMinForBlock)){
    if (G.player.clarity < (card.requiresMinClarity||0)){
      pushLogQuiet(`Not enough Clarity to play ${card.name}.`);
      return;
    }
    const consumed = G.player.clarity;
    G.player.clarity = 0;
    recomputeEffectiveMaxHp();
    if (card.consumeClarityMinForDamage && target && target.alive){
      const dmgAmt = consumed * card.consumeClarityMinForDamage;
      const dealt = takeDamage(target, dmgAmt, card.dtype, false);
      const bonus = tryCashInBleed(target, dealt);
      if (bonus>0){ target.hp = Math.max(0, target.hp-bonus); if(target.hp===0) target.alive=false; }
      pushLogQuiet(`Consumes ${consumed} Clarity for ${dmgAmt} damage.`);
    }
    if (card.consumeClarityMinForBlock){
      const blockAmt = consumed * card.consumeClarityMinForBlock;
      gainBlock(G.player, blockAmt);
      pushLogQuiet(`Consumes ${consumed} Clarity for ${blockAmt} Block.`);
    }
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isBranch() && (card.dmgFromOwnEnflame || card.blockFromOwnEnflame)){
    const ownEnflame = G.player.status.enflame || 0;
    if (card.dmgFromOwnEnflame){
      const dmgAmt = ownEnflame * card.dmgFromOwnEnflame;
      const targets = card.aoe ? G.combat.enemies.filter(e=>e.alive) : (target ? [target] : []);
      for (const t of targets){
        if (dmgAmt > 0){
          const dealt = takeDamage(t, dmgAmt, card.dtype, false);
          const bonus = tryCashInBleed(t, dealt);
          if (bonus>0){ t.hp = Math.max(0, t.hp-bonus); if(t.hp===0) t.alive=false; }
        }
      }
      pushLogQuiet(`Deals damage based on your ${ownEnflame} Enflame.`);
    }
    if (card.blockFromOwnEnflame){
      gainBlock(G.player, ownEnflame * card.blockFromOwnEnflame);
    }
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (isBranch() && card.delayedDetonateMult && target){
    target.c4Marked = true;
    target.c4Mult = card.delayedDetonateMult;
    pushLogQuiet(`${target.name} is marked — their Enflame will detonate at ${card.delayedDetonateMult}x on their next turn.`);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }

  // ===== Riley: unified 2x-home/1x-elsewhere stance multiplier + flat Entropy HP costs + usage-based ending =====
  let stanceMult = 1;
  let entropyEndsAfterThisCard = false;
  let ampDoubleActive = false;
  if (isRiley()){
    const inEntropyNow = G.player.stance === "Entropy";
    ampDoubleActive = !!(G.combat.nextEntropyCardDoubled && card.homeStance === "Entropy");
    let hpTax = 0;
    if (card.hpCost){
      hpTax = card.hpCost; // flat, stance-independent cost
    }
    if (card.hpCostElsewhereOnly && !inEntropyNow){
      hpTax = card.hpCostElsewhereOnly; // free in home stance, costs this elsewhere (e.g. Bleeding Edge)
    }
    if (ampDoubleActive) hpTax *= 2;
    if (hpTax > 0){
      G.player.hp = Math.max(0, G.player.hp - hpTax);
      pushLogQuiet(`${card.name} costs ${hpTax} HP${ampDoubleActive ? " (doubled by Amp's Feedback!)" : ""}.`);
      if (G.player.hp <= 0){ G.player.alive = false; checkCombatEnd(); render(); return; }
    }
    if (card.homeStance && !card.locked){
      stanceMult = (card.homeStance === G.player.stance) ? 1.5 : 1;
    }
    if (inEntropyNow && card.homeStance === "Entropy" && !card.generateClarityInEntropy){
      if (G.player.aboveTimeActive && !G.combat.entropyCardsPlayedThisVisit){
        G.combat.entropyCardsPlayedThisVisit = 1;
        pushLogQuiet(`Above Time keeps the chaos going — one more Entropy card before it ends.`);
      } else {
        pushLogQuiet(`Having spent her chaos, Riley's banked Clarity (${G.player.clarity}) is released!`);
        G.player.clarity = 0;
        recomputeEffectiveMaxHp();
        entropyEndsAfterThisCard = true;
        G.combat.entropyCardsPlayedThisVisit = 0;
      }
    }
  }

  if (card.draw || card.drawPerEmptyClipSlot){
    let drawAmt = card.draw || 0;
    if (isBroderick() && card.drawPerEmptyClipSlot){
      const emptySlots = Math.max(0, (G.player.clipMax||4) - G.player.clip.length);
      drawAmt += emptySlots * card.drawPerEmptyClipSlot;
      pushLogQuiet(`Lassie's Toolkit draws for ${emptySlots} empty clip slots.`);
    }
    drawCards(G.deck, drawAmt);
  }
  if (card.energyGain) G.combat.energy += card.energyGain;
  if (card.negate) G.combat.immovableCharge.on = true;
  if (card.block) {
    let blockAmt = Math.round(card.block * stanceMult);
    if (hasRelicHook("firstBlockBonus") && !G.combat.usedFirstBlockThisTurn){
      blockAmt += relicVal("firstBlockBonus");
      G.combat.usedFirstBlockThisTurn = true;
      pushLogQuiet("Rusted Anchor grants bonus Block.");
    }
    if (isBroderick() && card.fullMoonBonusBlock && G.player.fullMoonActive){
      blockAmt += card.fullMoonBonusBlock;
      pushLogQuiet(`Full Moon empowers the Block.`);
    }
    if (isBroderick() && card.blockBonusIfClipEmpty && G.player.clip.length===0){
      blockAmt += card.blockBonusIfClipEmpty;
      pushLogQuiet(`Empty clip grants extra Block.`);
    }
    if (isRiley() && card.blockPerHitBlockedThisCombat){
      const bonus = (G.combat.hitsBlockedThisCombat||0) * card.blockPerHitBlockedThisCombat;
      if (bonus>0){ blockAmt += bonus; pushLogQuiet(`Unshaken adds ${bonus} Block from experience.`); }
    }
    gainBlock(G.player, blockAmt);
    if (isBroderick() && card.tireOnPlayRandomEnemy){
      const alive = G.combat.enemies.filter(e=>e.alive);
      if (alive.length>0){
        const t = alive[Math.floor(Math.random()*alive.length)];
        applyTire(t);
        pushLogQuiet(`Screaming Candy wears down ${t.name}!`);
      }
    }
  }
  if (card.scaleBlockFromEnflame){
    const totalEnflame = G.combat.enemies.filter(e=>e.alive).reduce((sum,e)=>sum+e.status.enflame, 0);
    gainBlock(G.player, totalEnflame);
    pushLogQuiet(`Cinderwall grants ${totalEnflame} Block from board Enflame.`);
  }
  if (card.consumeClarityForBlock && isRiley()){
    const consumed = G.player.clarity;
    G.player.clarity = 0;
    recomputeEffectiveMaxHp();
    const blockGained = consumed * card.consumeClarityForBlock;
    gainBlock(G.player, blockGained);
    pushLogQuiet(`Consumes ${consumed} Clarity for ${blockGained} Block.`);
  }
  if (card.heal){
    let healAmt = Math.round(card.heal * stanceMult);
    if (isBroderick() && G.player.healBonusPct) healAmt = Math.round(healAmt * (1+G.player.healBonusPct));
    healPlayer(healAmt);
  }
  if (isBroderick() && card.fullMoonBonusHeal && G.player.fullMoonActive){
    let healAmt = card.fullMoonBonusHeal;
    if (G.player.healBonusPct) healAmt = Math.round(healAmt * (1+G.player.healBonusPct));
    const actualHeal1 = healPlayer(healAmt);
    pushLogQuiet(`Full Moon grants an extra ${actualHeal1} healing.`);
  }
  if (card.healFromFieldBleed){
    const totalBleed = G.combat.enemies.filter(e=>e.alive).reduce((sum,e)=>sum+e.status.bleed, 0) + G.player.status.bleed;
    const healAmt = Math.round(totalBleed * stanceMult);
    const actualHeal2 = healPlayer(healAmt);
    pushLogQuiet(`Bloodletting heals ${actualHeal2} HP from the field's Bleed (including your own).`);
  }
  if (card.cleanse){
    G.player.status.tire = 0; G.player.status.rattled = 0; G.player.status.daze = 0; G.player.status.enflame = 0;
    pushLogQuiet(`${G.player.name} cleanses debuffs.`);
  }
  if (card.hardenStrip && target && target.status.harden > 0){
    target.status.harden--;
    pushLogQuiet(`Strips 1 Harden from ${target.name}.`);
  }
  if (card.readIntent && target){
    // re-run bonus block if target's telegraphed intent is an Attack
    const intentText = getIntent(target);
    if (intentText.includes("Attack") && card.block){
      gainBlock(G.player, Math.round(card.block * stanceMult));
      pushLogQuiet("Read the Strike doubles Block — the intent was an Attack!");
    }
  }
  if (card.generateClarityInEntropy && isRiley()){
    G.player.clarity += card.generateClarityInEntropy;
    recomputeEffectiveMaxHp();
    pushLogQuiet(`Moment of Clarity generates ${card.generateClarityInEntropy} Clarity, even in Entropy.`);
  }
  if (card.doublesNextEntropyCard && isRiley()){
    G.player.clarity -= card.consumesClarityCost;
    recomputeEffectiveMaxHp();
    G.combat.nextEntropyCardDoubled = true;
    pushLogQuiet(`Amp's Feedback charges up — the next Entropy card played this turn is doubled!`);
    pushLogQuiet(`You play ${card.name}.`);
    checkCombatEnd();
    render();
    return;
  }
  if (card.repeatLastCard && isRiley()){
    G.player.hp = 1;
    G.player.clarity = 0;
    recomputeEffectiveMaxHp();
    pushLogQuiet(`Encore for the Captain drops you to 1 HP and empties your Clarity!`);
    if (G.combat.thisTurnCardNames.length > 0 && G.combat.lastCardObj){
      const repeatCard = G.combat.lastCardObj;
      const repeatTarget = G.combat.lastCardTarget;
      pushLogQuiet(`You play ${card.name}.`);
      checkCombatEnd();
      if (G.player.alive) playCard(repeatCard, repeatTarget, true);
      if (G.player.clarity < 0) G.player.clarity = 0;
      if (G.player.hp < 0) G.player.hp = 0;
      recomputeEffectiveMaxHp();
      return;
    } else {
      pushLogQuiet(`There was nothing to repeat.`);
      pushLogQuiet(`You play ${card.name}.`);
      checkCombatEnd();
      render();
      return;
    }
  }
  if (card.blockGrantsClarityIfHit && isRiley()){
    G.combat.pendingBlockClarityBonus = card.blockGrantsClarityIfHit;
  }
  if (card.embraceChaos && isRiley()){
    G.player.stanceBeforeEntropy = G.player.stance;
    switchStance("Entropy");
    G.combat.energy += 2;
    if (hasRelicHook("chaosBoundLocket") && !G.combat.usedChaosBoundLocket){
      G.combat.usedChaosBoundLocket = true;
      G.combat.energy += 1;
      pushLogQuiet(`Chaos-Bound Locket grants an extra energy.`);
    }
    drawSpecificStanceCard("Entropy");
    pushLogQuiet("Riley deliberately embraces the chaos, gaining 2 energy.");
  }
  if (card.stanceSwitchAlways && isRiley()){
    const to = G.player.stance === "FourSword" ? "FistBlade" : (G.player.stance === "FistBlade" ? "FourSword" : null);
    if (to) switchStance(to);
  }
  if (card.stanceSwitchTo && isRiley() && G.player.clarity >= card.switchThreshold && G.player.stance !== card.stanceSwitchTo){
    switchStance(card.stanceSwitchTo);
  }
  if (card.retaliateDmg){
    G.combat.pendingRetaliate = { dmg: card.retaliateDmg, dtype: card.retaliateDtype };
  }
  if (card.retaliatePctOfBlock){
    G.combat.pendingRetaliate = { pctOfBlock: card.retaliatePctOfBlock, dtype: null };
  }
  if (card.cleanseOnFullBlock && isRiley()){
    G.combat.pendingCleanseOnFullBlock = true;
  }
  if (card.fuelTheFire && target){
    const removed = target.status.enflame;
    target.status.enflame = 0;
    if (removed > 0){
      G.combat.energy += 2;
      pushLogQuiet(`Fuel the Fire strips ${removed} Enflame, gains 2 energy.`);
      if (removed >= 5){ G.combat.fuelDiscountReady = true; pushLogQuiet(`Fuel the Fire will cost 0 next draw!`); }
    } else {
      pushLogQuiet(`Fuel the Fire finds no Enflame to strip.`);
    }
  }
  if (card.bankedCoals && target){
    const removed = target.status.enflame;
    target.status.enflame = 0;
    if (removed > 0){
      gainBlock(G.player, removed);
      drawCards(G.deck, 1);
      pushLogQuiet(`Banked Coals converts ${removed} Enflame into ${removed} Block and a card.`);
    } else {
      pushLogQuiet(`Banked Coals finds no Enflame to convert.`);
    }
  }

  const aliveEnemies = G.combat.enemies.filter(e=>e.alive);
  const targets = card.aoe ? aliveEnemies : (target ? [target] : []);

  if (G.captainKey === "Branch") {
    const scene = window.game?.scene.getScenes(true)[0];
    if (scene?.playerBody) {
      const special = (targets.length || card.selfEnflame) && window.playSeaBranchSpecial(scene, scene.playerBody, card, G.combat.enemies.indexOf(target));
      const punched = !special && targets.length && card.dmg > 0 && window.playSeaBranchPunch(scene, scene.playerBody, card.name);
      const burned = !special && !punched && (targets.length || card.selfEnflame) && window.playSeaBranchBurn(scene, scene.playerBody, card);
      if (!special && !punched && !burned && targets.length && (card.dmg > 0 || card.detonate || card.detonateRate || card.doubleThenDetonate)) window.playSeaBranchFallback?.(scene, scene.playerBody, card.name);
    }
  }

  let clarityBasedDmg = card.dmg;
  if (isRiley() && card.scaleWithClarity){
    clarityBasedDmg = card.dmg + G.player.clarity;
  }
  if (isRiley() && card.consumeClarityForDamage){
    const consumed = G.player.clarity;
    G.player.clarity = 0;
    recomputeEffectiveMaxHp();
    clarityBasedDmg = consumed * card.consumeClarityForDamage;
    pushLogQuiet(`Consumes ${consumed} Clarity for ${clarityBasedDmg} damage.`);
  }

  for (const t of targets){
    if (clarityBasedDmg>0 || card.detonate || card.detonateRate || card.doubleThenDetonate){
      const numHits = card.randomHits || card.hits || 1;
      let totalDealt = 0;
      let wasEnflamedBefore = t.status.enflame > 0;
      for (let hitNum = 1; hitNum <= numHits; hitNum++){
        const isLastHit = hitNum === numHits;
        let hitTarget = t;
        if (card.randomHits){
          const liveTargets = G.combat.enemies.filter(en=>en.alive);
          if (liveTargets.length===0) break;
          hitTarget = liveTargets[Math.floor(Math.random()*liveTargets.length)];
        }
        // Default stance animation; explicitly dedicated animations retain priority.
        if (isRiley() && clarityBasedDmg > 0){
          const scene = window.game?.scene.getScenes(true)[0];
          if (scene?.playerBody) window.playSeaRileyDefaultAttack?.(scene, scene.playerBody, G.player.stance, G.combat.enemies.indexOf(hitTarget));
        }
        const mult = outgoingMultiplier(G.player);
        let baseDmg = clarityBasedDmg*mult*stanceMult;
        if (card.blockConditionalBonus && G.player.block > 0) baseDmg += card.blockConditionalBonus;
        if (card.dtype==="Fire") baseDmg += (G.player.fireDamageBonus||0);
        if (magicSynergyBonus) baseDmg += magicSynergyBonus;
        if (isBroderick() && card.bonusIfClipEmpty && G.player.clip.length===0) baseDmg += card.bonusIfClipEmpty;
        if (isBroderick() && card.bonusIfTargetLowHp && hitTarget.hp <= hitTarget.maxHp*0.3) baseDmg += card.bonusIfTargetLowHp;
        if (isBroderick() && card.fullMoonBonusDmgMult && G.player.fullMoonActive) baseDmg *= card.fullMoonBonusDmgMult;
        if (isRiley() && card.dmgPerSwitchThisCombat){
          const switches = Math.min(G.combat.switchCountThisCombat||0, card.dmgPerSwitchCap || 999);
          baseDmg += switches * card.dmgPerSwitchThisCombat;
        }
        if (isRiley() && G.player.bloodFeudActive && card.dtype !== undefined){
          baseDmg = baseDmg * 0.5;
        }
        if (G.combat.attacksPlayedThisTurn===0 && hitNum===1 && hasRelicHook("firstAttackBonus")){
          baseDmg += relicVal("firstAttackBonus");
        }
        if (isRiley() && ampDoubleActive) baseDmg *= 2;
        if (hasRelicHook("sugarbloodCrown")) baseDmg *= 1.4;
        if (card.doubleDmgIfEnflamed && wasEnflamedBefore) baseDmg *= 2;
        if (hasRelicHook("bittersweetHeart")) baseDmg += Math.max(0, (G.combat.turn||1) - 1);
        if (G.player.heartOfAbyss) baseDmg *= 2;
        if (hasRelicHook("twoFacedToffee")) baseDmg *= 1.25;
        if (hasRelicHook("killStackDamage")) baseDmg += (G.killStackBonus||0);
        const effectiveDtype = (isBranch() && G.player.fireToMagical && card.dtype==="Fire") ? "Magical" : card.dtype;
        let dealt = takeDamage(hitTarget, baseDmg, effectiveDtype, card.ignoresBlock);
        if (hasRelicHook("executeThreshold") && hitTarget.alive && hitTarget.hp <= hitTarget.maxHp*relicVal("executeThreshold")){
          dealt += hitTarget.hp;
          hitTarget.hp = 0; hitTarget.alive=false;
          pushLogQuiet(`The Leviathan's Eye finishes off ${hitTarget.name}!`);
        }
        if (hasRelicHook("wishingGumball") && hitTarget.alive && hitTarget.hp <= hitTarget.maxHp*0.20){
          dealt += hitTarget.hp;
          hitTarget.hp = 0; hitTarget.alive=false;
          pushLogQuiet(`The Wishing Gumball finishes off ${hitTarget.name}!`);
        }
        totalDealt += dealt;
        if (isRiley() && (G.player.stance === "FourSword" || G.player.unbrokenFocusActive) && dealt > 0){ gainClarity(1, true); }
        if (isBroderick() && (card.isClaw || (card.fullMoonBecomesClaw && G.player.fullMoonActive)) && dealt > 0){
          G.combat.clawCount = (G.combat.clawCount||0)+1;
          const triggersNow = (G.combat.clawCount % 2 === 0) || (G.combat.clawCount === 1 && hasRelicHook("pocketMoon"));
          if (triggersNow){
            let healAmt = 3;
            if (G.player.healBonusPct) healAmt = Math.round(healAmt * (1+G.player.healBonusPct));
            const actualHeal3 = healPlayer(healAmt);
            pushLogQuiet(`Lunar Longevity heals ${actualHeal3} HP.`);
          }
        }
        if (card.bleed && numHits > 1){
          applyBleed(hitTarget, Math.max(1, Math.round(card.bleed * stanceMult * (isRiley() && G.player.bloodFeudActive ? 2 : 1))));
        }
        if (card.enflame && numHits > 1){
          applyEnflame(hitTarget, Math.max(1, Math.round(card.enflame * stanceMult)));
        }
        if (isLastHit && !card.randomHits){
          let bonus = tryCashInBleed(hitTarget, dealt);
          if (bonus>0 && isRiley() && card.doubleCashIn){ bonus *= 2; pushLogQuiet(`Unraveling doubles the cash-in!`); }
          if (bonus>0){
            hitTarget.hp = Math.max(0, hitTarget.hp-bonus); if(hitTarget.hp===0) hitTarget.alive=false;
            pushLogQuiet(`Bleed cashes in on ${hitTarget.name} for ${bonus}!`);
            if (isRiley() && card.cashInSpreadHalf){
              const others = G.combat.enemies.filter(en=>en.alive && en!==hitTarget);
              if (others.length>0){
                const t2 = others[Math.floor(Math.random()*others.length)];
                const spreadAmt = Math.floor(bonus/2);
                if (spreadAmt>0){ applyBleed(t2, spreadAmt); pushLogQuiet(`${t2.name} catches ${spreadAmt} spread Bleed.`); }
              }
            }
            if (isRiley() && bonus >= 10 && hasRelicHook("crimsonTally")){
              const others = G.combat.enemies.filter(en=>en.alive && en!==hitTarget);
              if (others.length>0){
                const t2 = others[Math.floor(Math.random()*others.length)];
                applyBleed(t2, 5);
                pushLogQuiet(`Crimson Tally applies 5 Bleed to ${t2.name}.`);
              }
            }
          }
        } else if (card.randomHits){
          const bonus = tryCashInBleed(hitTarget, dealt);
          if (bonus>0){ hitTarget.hp = Math.max(0, hitTarget.hp-bonus); if(hitTarget.hp===0) hitTarget.alive=false; pushLogQuiet(`Bleed cashes in on ${hitTarget.name} for ${bonus}!`); }
        }
        if (!t.alive) break;
      }
      let dealt = totalDealt;
      if (card.doubleThenDetonate && t.status.enflame>0){
        t.status.enflame *= 2;
        let bonusTB = t.status.enflame;
        if (hasRelicHook("cinderglassVial") && !G.combat.usedCinderglassVial){ bonusTB *= 2; G.combat.usedCinderglassVial = true; pushLogQuiet("Cinderglass Vial doubles the detonation!"); }
        t.hp = Math.max(0, t.hp - bonusTB); t.status.enflame = 0;
        if (t.hp===0) t.alive=false;
        pushLogQuiet(`${card.name} doubles then detonates Enflame on ${t.name} for ${bonusTB}!`);
        if (isBranch() && hasRelicHook("bigDetonateEnergy") && bonusTB >= 15){
          G.combat.energy += 2;
          pushLogQuiet(`Hotstreak Gumball grants 2 energy from the blast!`);
        }
        dealt = bonusTB;
      }
      if (card.detonate && t.status.enflame>0){
        let bonus2 = t.status.enflame;
        if (hasRelicHook("cinderglassVial") && !G.combat.usedCinderglassVial){ bonus2 *= 2; G.combat.usedCinderglassVial = true; pushLogQuiet("Cinderglass Vial doubles the detonation!"); }
        t.hp = Math.max(0, t.hp - bonus2); t.status.enflame = 0;
        if (t.hp===0) t.alive=false;
        pushLogQuiet(`${card.name} detonates Enflame on ${t.name} for ${bonus2}!`);
        if (isBranch() && hasRelicHook("bigDetonateEnergy") && bonus2 >= 15){
          G.combat.energy += 2;
          pushLogQuiet(`Hotstreak Gumball grants 2 energy from the blast!`);
        }
        if (isBranch() && card.detonateEnergyThreshold && bonus2 >= card.detonateEnergyThreshold){
          G.combat.energy += 1;
          pushLogQuiet(`Burn Bomb refunds 1 energy!`);
        }
        if (isBranch() && card.detonateSpreadHalf){
          const others = G.combat.enemies.filter(en=>en.alive && en!==t);
          const spreadAmt = Math.floor(bonus2/2);
          if (spreadAmt>0){
            if (others.length>0){
              const t2 = others[Math.floor(Math.random()*others.length)];
              applyEnflame(t2, spreadAmt);
              pushLogQuiet(`${t2.name} catches ${spreadAmt} Enflame from the blast.`);
            } else if (t.alive){
              applyEnflame(t, spreadAmt);
              pushLogQuiet(`With no one else to catch it, ${t.name} catches ${spreadAmt} Enflame from its own blast.`);
            }
          }
        }
        if (isBranch() && card.reapplyOriginalEnflame && t.alive){
          applyEnflame(t, bonus2);
          pushLogQuiet(`Fire Spin re-ignites ${t.name} with ${bonus2} fresh Enflame.`);
        }
      }
      if (card.detonateRate && t.status.enflame>0){
        let bonus3 = t.status.enflame * card.detonateRate;
        if (hasRelicHook("cinderglassVial") && !G.combat.usedCinderglassVial){ bonus3 *= 2; G.combat.usedCinderglassVial = true; pushLogQuiet("Cinderglass Vial doubles the detonation!"); }
        t.hp = Math.max(0, t.hp - bonus3); t.status.enflame = 0;
        if (t.hp===0) t.alive=false;
        pushLogQuiet(`${card.name} detonates Enflame on ${t.name} for ${bonus3} (${card.detonateRate}x)!`);
        if (isBranch() && hasRelicHook("bigDetonateEnergy") && bonus3 >= 15){
          G.combat.energy += 2;
          pushLogQuiet(`Hotstreak Gumball grants 2 energy from the blast!`);
        }
      }
      if (card.furyConditional && wasEnflamedBefore){
        t.hp = Math.max(0, t.hp - 10);
        if (t.hp===0) t.alive=false;
        G.player.fireDamageBonus = (G.player.fireDamageBonus||0) + 1;
        pushLogQuiet(`Branch's Fury deals +10 bonus damage and grants permanent +1 Fire damage!`);
      }
      if (!t.alive){ t.diedEnflamed = t.status.enflame>0;
        if (G.captainKey==="Branch" && (t.status.enflame>0 || t.diedEnflamed)){
          const healAmt = hasRelicHook("flameBodyTriple") ? 3 : 1;
          healPlayer(healAmt);
        }
        if (hasRelicHook("onKillHeal")){
          healPlayer(relicVal("onKillHeal"));
        }
        if (hasRelicHook("statusKillHeal")){
          healPlayer(relicVal("statusKillHeal"));
        }
        if (hasRelicHook("killStackDamage")){
          G.killStackBonus = (G.killStackBonus||0) + relicVal("killStackDamage");
        }
        if (card.healOnKill){
          healPlayer(dealt);
          pushLogQuiet(`${card.name}'s kill heals ${dealt} HP.`);
        }
        if (card.energyGainOnKill){
          G.combat.energy += card.energyGainOnKill;
          pushLogQuiet(`${card.name}'s kill grants ${card.energyGainOnKill} energy.`);
        }
        if (t.tag==="uof"){
          const siblings = aliveEnemies.filter(x=>x!==t && x.tag==="uof" && x.alive);
          const anyAbove50 = siblings.some(s=>s.hp > s.maxHp*0.5);
          if (anyAbove50 && siblings.length>0){
            for (const s of siblings){ s.enraged = 3; }
            pushLogQuiet(`The surviving schoolmates enrage — bonus damage for 3 turns!`);
          }
        }
      }
      if ((card.stun || (isBroderick() && card.fullMoonBonusStun && G.player.fullMoonActive)) && dealt > 0 && t.alive && (!card.requiresTargetEnflamed || wasEnflamedBefore)){
        t.status.stun = true;
        pushLogQuiet(`${t.name} is stunned!`);
        if (hasRelicHook("stunAppliesTire")){
          applyTire(t);
          pushLogQuiet(`Moonstone Shard applies Tire.`);
        }
      }
      if (card.healPctOfDamage && dealt > 0){
        const healAmt = Math.round(dealt * card.healPctOfDamage);
        const actualHeal4 = healPlayer(healAmt);
        pushLogQuiet(`Heals ${actualHeal4} HP from the blow.`);
      }
    }
    if (card.enflame){
      if (hasRelicHook("krakensTooth") && t.status.enflame > 0){
        const bonus = t.status.enflame;
        t.hp = Math.max(0, t.hp - bonus);
        if (t.hp===0) t.alive=false;
        pushLogQuiet(`Kraken's Tooth deals ${bonus} bonus damage for re-Enflaming!`);
      }
      applyEnflame(t, Math.max(1, Math.round(card.enflame * stanceMult)));
      if (hasRelicHook("instantFirstTick")){
        const tick = Math.round(t.status.enflame * (1+relicVal("tickDamageBonus")));
        t.hp = Math.max(0, t.hp - tick); if(t.hp===0) t.alive=false;
        pushLogQuiet(`Witch-Light Lantern triggers an instant Enflame tick for ${tick}.`);
      }
      onPlayerAppliedDebuff(t, "enflame");
    }
    if (isBranch() && card.enflameSpreadHalfIfPresent && t.status.enflame > 0){
      const others = G.combat.enemies.filter(en=>en.alive && en!==t);
      const spreadAmt = Math.floor(t.status.enflame/2);
      if (spreadAmt>0){
        if (others.length>0){
          const t2 = others[Math.floor(Math.random()*others.length)];
          applyEnflame(t2, spreadAmt);
          pushLogQuiet(`${t2.name} catches ${spreadAmt} spread Enflame.`);
        } else if (t.alive){
          applyEnflame(t, spreadAmt);
          pushLogQuiet(`With no one else to catch it, ${t.name} catches ${spreadAmt} Enflame from its own spread.`);
        }
      }
    }
    if (card.bleed && (card.hits||1) === 1){
      applyBleed(t, Math.max(1, Math.round(card.bleed * stanceMult * (isRiley() && G.player.bloodFeudActive ? 2 : 1))));
      onPlayerAppliedDebuff(t, "bleed");
    }
    if (card.bleedSecondTarget && aliveEnemies.length > 1){
      const others = aliveEnemies.filter(x=>x!==t);
      const second = others[Math.floor(Math.random()*others.length)];
      applyBleed(second, Math.max(1, Math.round((card.bleed || 2) * stanceMult * (isRiley() && G.player.bloodFeudActive ? 2 : 1))));
      pushLogQuiet(`Applies Bleed to a second target: ${second.name}.`);
    }
    if (card.tire && (!card.requiresTargetEnflamed || t.status.enflame>0)){
      applyTire(t, card.tireDuration);
      onPlayerAppliedDebuff(t, "tire");
    }
    if (card.daze && (!card.requiresTargetEnflamed || t.status.enflame>0)){
      applyDaze(t, card.daze===true ? 1 : card.daze);
      onPlayerAppliedDebuff(t, "daze");
      if (hasRelicHook("dazeApplyBlock")){
        gainBlock(G.player, relicVal("dazeApplyBlock"));
      }
    }
    if (card.dazeSelf){ applyDaze(G.player); pushLogQuiet(`You are Dazed.`); }
    if (card.selfDetonate && t.status.enflame > 0){
      const total = t.status.enflame;
      let dealt2 = takeDamage(t, total, card.dtype, false);
      t.status.enflame = 0;
      if (!t.alive){
        t.diedEnflamed = true;
        if (G.captainKey==="Branch") healPlayer(1);
      }
      pushLogQuiet(`${card.name} detonates ${total} Enflame on ${t.name}!`);
      if (isBranch() && hasRelicHook("bigDetonateEnergy") && total >= 15){
        G.combat.energy += 2;
        pushLogQuiet(`Hotstreak Gumball grants 2 energy from the blast!`);
      }
    }
  }

  pushLogQuiet(`You play ${card.name}.`);
  if (ampDoubleActive){
    G.combat.nextEntropyCardDoubled = false;
  }
  if (entropyEndsAfterThisCard){
    const returnTo = G.player.stanceBeforeEntropy || "FourSword";
    forceRevertFromEntropy(returnTo);
    pushLogQuiet(`The chaos subsides — Riley returns to ${returnTo === "FourSword" ? "Four Sword" : "Fist Blade"} Style.`);
  }
  checkCombatEnd();
  render();
}

function endTurn(){
  if (window.game?.scene.getScenes(true)[0]?.playerBody?.getData?.("clarityAttackPlaying")) return;
  if (!G.combat || G.combat.phase!=="player") return;
  discardHand(G.deck);
  G.player.status.noAttack = false;
  G.player.status.noHeal = false;
  G.player.status.noBlock = false;
  G.combat.playerBlockedOrHealedLastTurn = !!(G.combat.blockedThisTurn || G.combat.healedThisTurn);
  G.combat.blockedThisTurn = false;
  G.combat.healedThisTurn = false;
  G.combat.phase = "enemy";
  render();
  setTimeout(resolveEnemyPhase, 400);
}

function resolveEnemyPhase(){
  const c = G.combat;
  for (const e of c.enemies){
    if (!e.alive) continue;
    if (e.c4Marked && e.status.enflame > 0){
      const bonus = e.status.enflame * (e.c4Mult||3);
      e.hp = Math.max(0, e.hp - bonus);
      if (e.hp===0) e.alive=false;
      e.status.enflame = 0;
      e.c4Marked = false;
      pushLogQuiet(`${e.name}'s marked Enflame detonates for ${bonus}!`);
      if (isBranch() && hasRelicHook("bigDetonateEnergy") && bonus >= 15){
        G.combat.energy += 2;
        pushLogQuiet(`Hotstreak Gumball grants 2 energy from the blast!`);
      }
      startOfTurnTicks(e, pushLogQuiet); // still tick tire/daze/etc, enflame already cleared above
      continue;
    }
    e.c4Marked = false;
    const hadEnflameBefore = e.status.enflame > 0;
    startOfTurnTicks(e, pushLogQuiet);
    if (e.alive && isBranch() && G.player.flameOnActive && hadEnflameBefore && (G.player.status.enflame||0) > 0){
      const bonus = G.player.status.enflame;
      e.hp = Math.max(0, e.hp - bonus);
      if (e.hp===0) e.alive=false;
      pushLogQuiet(`Flame On! deals ${bonus} extra damage to ${e.name}!`);
    }
  }
  if (G.player.status.enflame || G.player.status.bleed || G.player.status.corrosion || G.player.status.undertow || G.player.status.tire || G.player.status.daze || G.player.status.rattled || G.player.status.muted){
    startOfTurnTicks(G.player, pushLogQuiet);
  }
  if (checkCombatEnd()) { render(); return; }

  for (const e of c.enemies){
    if (!e.alive || !G.player.alive) continue;
    // Flame Body: first hit taken this combat
    const wasFirst = !G.player.hitBefore;
    const hpBefore = G.player.hp;
    const blockBefore = G.player.block;
    let incomingMult = 1;
    if (hasRelicHook("rockCandyCurse")) incomingMult *= 1.5;
    if (hasRelicHook("twoFacedToffee")) incomingMult *= 1.25;
    if (!G.combat.firstHitTakenThisCombat && hasRelicHook("firstHitReduction")){
      incomingMult *= (1 - relicVal("firstHitReduction"));
      G.combat.firstHitTakenThisCombat = true;
    }
    enemyTurn(e, G.player, c.enemies, c.immovableCharge, G.captainKey, pushLogQuiet, hasRelicHook("chipReduction"), incomingMult);
    if (blockBefore === 0 && hpBefore > G.player.hp && hasRelicHook("zeroBlockPunish") && e.alive){
      const bonus = relicVal("zeroBlockPunish");
      e.hp = Math.max(0, e.hp - bonus); if(e.hp===0) e.alive=false;
      pushLogQuiet(`Snarled Netting deals ${bonus} damage to ${e.name}.`);
    }
    const blockConsumed = blockBefore - G.player.block;
    const hpLost = hpBefore - G.player.hp;
    const wasAttacked = (blockConsumed > 0 || hpLost > 0);
    const tookNoHpDamage = hpLost === 0 && wasAttacked;
    if (hasRelicHook("autoCleanseRattled") && !G.combat.usedAutoCleanseRattled && G.player.status.rattled > 0){
      G.player.status.rattled = 0;
      G.combat.usedAutoCleanseRattled = true;
      pushLogQuiet(`Salt-Crusted Bandana cleanses Rattled.`);
    }
    if (hasRelicHook("firstLowHpHeal") && !G.combat.usedFirstLowHpHeal && G.player.alive && G.player.hp <= G.player.maxHp*0.5 && hpBefore > G.player.maxHp*0.5){
      G.combat.usedFirstLowHpHeal = true;
      const actualHeal5 = healPlayer(relicVal("firstLowHpHeal"));
      pushLogQuiet(`Moldy Hardtack heals ${actualHeal5} HP.`);
    }
    if (isRiley() && blockConsumed > 0){
      G.combat.hitsBlockedThisCombat = (G.combat.hitsBlockedThisCombat||0) + 1;
      if (G.combat.pendingBlockClarityBonus){
        gainClarity(G.combat.pendingBlockClarityBonus);
        pushLogQuiet(`Belt's Backup grants ${G.combat.pendingBlockClarityBonus} Clarity from the hit.`);
        G.combat.pendingBlockClarityBonus = 0;
      }
    }
    if (isRiley() && (G.player.stance === "FistBlade" || G.player.unbrokenFocusActive) && wasAttacked){
      gainClarity(1);
    }
    if (c.pendingRetaliate && wasAttacked){
      const r = c.pendingRetaliate;
      const retaliateDmg = r.pctOfBlock ? Math.round(G.player.block * r.pctOfBlock) : r.dmg;
      const dealt = takeDamage(e, retaliateDmg, r.dtype, false);
      pushLogQuiet(`Retaliation deals ${dealt} damage back to ${e.name}!`);
      c.pendingRetaliate = null;
    }
    if (isRiley() && c.pendingCleanseOnFullBlock && tookNoHpDamage){
      G.player.status.tire = 0; G.player.status.rattled = 0;
      pushLogQuiet("Iron Perimeter's full block cleanses a debuff.");
      c.pendingCleanseOnFullBlock = false;
    }
    if (G.player.hp < G.player.maxHp || G.player.block>0 || wasFirst){
      if (wasFirst && G.captainKey==="Branch" && !G.flameBodyDoneThisCombat){
        e.status.enflame += 3;
        G.flameBodyDoneThisCombat = true;
        pushLogQuiet(`Flame Body ignites ${e.name}!`);
      }
      G.player.hitBefore = true;
    }
  }
  c.pendingRetaliate = null;
  c.pendingCleanseOnFullBlock = false;
  if (checkCombatEnd()) { render(); return; }

  // Riley: Clarity decays if not generated this turn (Entropy exit is now usage-based, handled in playCard)
  if (isRiley()){
    if (!c.clarityGeneratedThisTurn && G.player.clarity > 0 && G.player.stance !== "Entropy" && !hasRelicHook("clarityBandana")){
      G.player.clarity--;
      recomputeEffectiveMaxHp();
      pushLogQuiet(`Clarity fades to ${G.player.clarity} (unused this turn).`);
    }
    c.clarityGeneratedThisTurn = false;
  }

  c.turn++;
  c.phase = "player";
  c.energy = (isRiley() && G.player.stance === "Entropy") ? 5 : 3;
  if (hasRelicHook("candyCornCrown")) c.energy += 2;
  if (G.player.status.energyDrain > 0){
    const drainAmt = Math.min(c.energy, G.player.status.energyDrain);
    c.energy -= drainAmt;
    pushLogQuiet(`Your stolen momentum costs you ${drainAmt} energy this turn.`);
    G.player.status.energyDrain = 0;
  }
  c.cardsPlayedThisTurnCount = 0;
  c.usedFirstDebuffReduction = c.usedFirstDebuffReduction || false;
  if (isRiley() && G.player.stance === "Entropy" && !G.deck.hand.some(hc=>hc.homeStance==="Entropy")){
    drawSpecificStanceCard("Entropy");
  }
  if (isBroderick() && G.player.clip && G.player.clip.length === 0){
    G.player.clip.push("Plain");
    pushLogQuiet(`Always Armed: clip was empty, loads a Plain bullet.`);
  }
  c.lastCardName = null;
  c.prevTurnCardNames = c.thisTurnCardNames.slice();
  c.thisTurnCardNames = [];
  c.attacksPlayedThisTurn = 0;
  c.switchedThisTurn = false;
  c.usedFirstBlockThisTurn = false;
  const endedLastTurnEmptyHand = G.deck.hand.length === 0;
  G.player.block = 0; // block resets at start of player's own turn
  if (isBranch() && G.player.cinderguardActive){
    const totalEnflame = G.combat.enemies.filter(e=>e.alive).reduce((sum,e)=>sum+e.status.enflame, 0);
    if (totalEnflame > 0){
      gainBlock(G.player, totalEnflame);
      pushLogQuiet(`Cinderguard grants ${totalEnflame} Block from the board's Enflame.`);
    }
  }
  if (endedLastTurnEmptyHand && hasRelicHook("emptyHandBlock")){
    gainBlock(G.player, relicVal("emptyHandBlock"));
    pushLogQuiet(`Hollow Gourd grants ${relicVal("emptyHandBlock")} Block.`);
  }
  if (hasRelicHook("everyThirdTurnBlock") && c.turn % 3 === 0){
    gainBlock(G.player, relicVal("everyThirdTurnBlock"));
    pushLogQuiet(`Tidepool Marble grants ${relicVal("everyThirdTurnBlock")} Block.`);
  }
  if (G.seizedCard && c.turn >= G.seizedCardReturnTurn){
    G.deck.hand.push(G.seizedCard);
    pushLogQuiet(`${G.seizedCard.name} is returned to your hand!`);
    G.seizedCard = null;
    G.seizedCardReturnTurn = 0;
  }
  drawCards(G.deck, 5);
  if (G.combat.enemies){
    for (const e of G.combat.enemies){
      if (e.alive && e.tag==="uof"){
        e.uofNextIsJudgment = Math.random() < 0.5;
      }
    }
  }
  render();
}

function checkCombatEnd(){
  if (!G.combat) return true;
  if (!G.player.alive){
    if (hasRelicHook("soulBoundSave") && !G.combat.usedSoulBoundSave){
      G.combat.usedSoulBoundSave = true;
      const discarded = G.deck.hand.length;
      G.deck.discard.push(...G.deck.hand);
      G.deck.hand = [];
      const blockGained = discarded * 5;
      G.player.alive = true;
      G.player.hp = 1;
      gainBlock(G.player, blockGained);
      pushLogQuiet(`Soul-Bound Locket saves you! Discards ${discarded} cards for ${blockGained} Block.`);
      return false;
    }
    if (hasRelicHook("deathSave") && !G.combat.usedDeathSave){
      G.combat.usedDeathSave = true;
      G.player.alive = true;
      G.player.hp = 1;
      const beadIdx = G.player.relics.findIndex(r=>r.hook==="deathSave");
      if (beadIdx >= 0){
        const brokenBead = RELIC_POOL.find(r=>r.id==="g18b");
        G.player.relics[beadIdx] = brokenBead;
      }
      pushLogQuiet(`Sea Witch's Bead saves you at 1 HP, then shatters!`);
      return false;
    }
    if (hasRelicHook("ferrymanToll") && !G.usedFerrymanToll){
      G.usedFerrymanToll = true;
      G.rubees = 0;
      G.player.alive = true;
      G.player.hp = Math.round(G.player.maxHp * 0.25);
      pushLogQuiet(`The Ferryman's Toll saves you, but claims all your Rubees!`);
      return false;
    }
    if (hasRelicHook("oneLastGumdrop") && !G.combat.usedOneLastGumdrop){
      G.combat.usedOneLastGumdrop = true;
      G.player.alive = true;
      G.player.hp = 1;
      pushLogQuiet(`One Last Gumdrop saves you at 1 HP!`);
      return false;
    }
    G.combat.over = true; G.combat.win = false;
    G.over = true; G.won = false;
    return true;
  }
  if (G.combat.enemies.every(e=>!e.alive)){
    G.combat.over = true; G.combat.win = true;
    return true;
  }
  return false;
}

// ============ NODE PROGRESSION ============
function advanceNode(){
  const node = getCurrentNode();
  if (node.kind==="oasis"){
    const missing = G.player.maxHp - G.player.hp;
    healPlayer(missing);
    G.player.block = 0;
    pushLogQuiet(hasRelicHook("bittersweetHeart") ? "You rest at the Oasis, but Bittersweet Heart dulls the healing." : "You rest at the Oasis. Fully healed.");
    if (hasRelicHook("oasisBonus")){
      const bonus = relicVal("oasisBonus");
      G.player.maxHp += bonus;
      G.player.hp += bonus;
      if (isRiley() && G.player.baseMaxHp!==undefined) G.player.baseMaxHp += bonus;
      pushLogQuiet(`Weathered Buoy grants +${bonus} max HP.`);
    }
    advanceFromCurrentNode();
    return;
  }
  if (node.kind==="event"){
    G.pendingEvent = rollEvent();
    render();
    return;
  }
  if (node.kind==="shop"){
    if (hasRelicHook("greedyDjinnsJar")){
      pushLogQuiet(`The Greedy Djinn's Jar hums — King in Green blocks the way to F&J Emporium!`);
      G.pendingShopGuardVictory = true;
      G.flameBodyDoneThisCombat = false;
      G.combat = null;
      enterCombatFull(KING_IN_GREEN, "boss");
      return;
    }
    G.pendingShop = rollShopInventory();
    render();
    return;
  }
  G.flameBodyDoneThisCombat = false;
  G.combat = null;
  enterCombatFull(node.def);
}

function enterCombatFull(def, fightKindOverride){
  newCombatReset(G.deck);
  G.player.block = 0;
  G.player.status = newStatus();
  G.player.hitBefore = false;
  G.player.fireDamageBonus = 0;
  G.player.cinderguardActive = false;
  G.player.fireToMagical = false;
  G.player.flameOnActive = false;
  G.player.enchant = 0;
  if (isBroderick()){
    G.player.clipMax = 4;
    G.player.healBonusPct = 0;
    G.player.fullMoonActive = false;
  }
  if (isRiley()){
    if (!G.player.baseMaxHp) G.player.baseMaxHp = G.player.maxHp;
    G.player.stance = "FourSword"; // always starts here per design
    G.player.clarity = 0;
    G.player.maxHp = G.player.baseMaxHp;
    G.player.hp = Math.min(G.player.hp, G.player.maxHp);
    G.player.unbrokenFocusActive = false;
    G.player.aboveTimeActive = false;
    G.player.bloodFeudActive = false;
  }
  if (G.captainKey === "Broderick"){
    G.player.clip = [];
    G.player.clip.push("Plain"); // Always Armed: turn 1 always starts with an empty clip
  }
  const fightKind = fightKindOverride || (getCurrentNode() ? getCurrentNode().kind : "common");
  G.combat = {
    startRubees: G.rubees,
    enemies: spawnEnemies(def),
    immovableCharge: {on:false},
    turn: 1,
    phase: "player",
    energy: 3,
    pendingCardIdx: null,
    over: false,
    win: null,
    clawCount: 0,
    attacksPlayedThisTurn: 0,
    thisTurnCardNames: [],
    prevTurnCardNames: [],
    fuelDiscountReady: false,
    clarityGeneratedThisTurn: false,
    entropyLockedThisTurn: false,
    stanceAtTurnStart: isRiley() ? "FourSword" : null,
    pendingStanceOffer: null,
    pendingEntropyReturn: false,
    entropySpent: false,
    switchCountThisCombat: 0,
    switchedThisTurn: false,
    hitsBlockedThisCombat: 0,
    entropyCardsPlayedThisVisit: 0,
    bonusClarityOnNextSwitch: 0,
    fightKind,
    entropyEnteredThisCombat: false,
  };
  drawCards(G.deck, 5);
  for (const e of G.combat.enemies){
    if (e.alive && e.tag==="uof"){
      e.uofNextIsJudgment = Math.random() < 0.5;
    }
  }
  applyRelicHooks("combatStartHeal");
  applyRelicHooks("combatStartTire");
  if (hasRelicHook("firstTurnDraw")) drawCards(G.deck, relicVal("firstTurnDraw"));
  if (fightKind === "elite" && hasRelicHook("eliteFirstTurnBlock")){
    gainBlock(G.player, relicVal("eliteFirstTurnBlock"));
    pushLogQuiet("Rusty Hook grants Block for the fight ahead.");
  }
  if (hasRelicHook("firstTurnEnergy")){
    G.combat.energy += relicVal("firstTurnEnergy");
  }
  if (G.pendingBonusEnergyNextFight){
    G.combat.energy += G.pendingBonusEnergyNextFight;
    pushLogQuiet(`Something vast still favors you: +${G.pendingBonusEnergyNextFight} energy this fight.`);
    G.pendingBonusEnergyNextFight = 0;
  }
  if (G.player.signMarked){
    applyEnflame(G.player, 10);
    pushLogQuiet(`The sign's mark ignites you: 10 Enflame.`);
  }
  if (fightKind === "boss" && hasRelicHook("bossOpeningHandBonus")){
    drawCards(G.deck, relicVal("bossOpeningHandBonus"));
  }
  if (hasRelicHook("oneLastGumdrop")){
    applyRattled(G.player, 4);
  }
  if (hasRelicHook("brokenSeaWitchBead")){
    applyBleed(G.player, 2);
  }
  if (hasRelicHook("bottomlessCandyBag")){
    drawCards(G.deck, 2);
  }
  if (isBroderick() && hasRelicHook("extraClip")){
    G.player.clipMax += 1;
  }
  if (hasRelicHook("autoTireStrongest")){
    const alive = G.combat.enemies.filter(e=>e.alive);
    if (alive.length){
      const strongest = alive.reduce((a,b)=> b.atk>a.atk ? b : a, alive[0]);
      applyTire(strongest);
      pushLogQuiet(`Rotten Figurehead applies Tire to ${strongest.name}.`);
    }
  }
  if (hasRelicHook("krakensBargain")){
    G.combat.energy = Math.max(0, G.combat.energy - 1);
    pushLogQuiet(`Kraken's Bargain reduces your first turn's energy by 1.`);
  }
  if (hasRelicHook("candyCornCrown")){
    G.player.maxHp = Math.max(1, Math.round(G.player.maxHp * 0.93));
    G.player.hp = Math.min(G.player.hp, G.player.maxHp);
    if (isRiley() && G.player.baseMaxHp!==undefined) G.player.baseMaxHp = Math.round(G.player.baseMaxHp*0.93);
    pushLogQuiet(`Candy Corn Crown costs you 7% max HP.`);
    G.combat.energy += 2;
  }
  G.combat.usedFirstCardDiscount = false;
  G.combat.usedCinderglassVial = false;
  if (def.dazedOpen){
    G.combat.enemies.forEach(e=>{ e.openingTurnHalved = true; });
    pushLogQuiet(`The poke leaves ${def.name} reeling — its opening attack is halved!`);
  }
  pushLogQuiet(`--- ${def.name}${def.count>1?` x${def.count}`:""} appears! ---`);
  render();
}

function afterCombatContinue(){
  if (!G?.combat?.win || G.pendingVictory) return;
  const before = Number(G.combat.startRubees ?? G.rubees);
  const branch = G.captainKey === "Branch";
  window.seaResolvingVictory = true;
  try { resolveCombatRewards(); }
  finally { window.seaResolvingVictory = false; }
  G.pendingVictory = {earned: G.rubees - before, total: G.rubees, branch};
  render();
}

function resolveCombatRewards(){
  if (G.pendingShopGuardVictory){
    G.pendingShopGuardVictory = false;
    G.combat = null;
    G.rubees += KING_IN_GREEN.bounty || 120;
    pushLogQuiet(`💰 Earned ${KING_IN_GREEN.bounty || 120} Rubees.`);
    pushLogQuiet(`King in Green falls — F&J Emporium's doors swing open.`);
    G.pendingShop = rollShopInventory();
    render();
    return;
  }
  if (isBroderick() && G.player.fullMoonActive && G.player.fullMoonOriginalDeck){
    G.deck.all = G.player.fullMoonOriginalDeck;
    G.player.fullMoonOriginalDeck = null;
    G.player.fullMoonActive = false;
    pushLogQuiet(`🌙 The full moon fades — your gear returns to normal.`);
  }
  if (G.pendingCrewCardAward){
    const award = G.pendingCrewCardAward;
    G.pendingCrewCardAward = null;
    G.combat = null;
    const bounty = (G.act===1 ? 6 : 8) * 2;
    G.rubees += bounty;
    pushLogQuiet(`💰 Earned ${bounty} Rubees.`);
    G.pendingCrewMoment = {text: award.resultText, cardName: award.cardName};
    render();
    return;
  }
  if (G.pendingEventGearAward){
    const award = G.pendingEventGearAward;
    G.pendingEventGearAward = null;
    G.combat = null;
    if (award.bonusRubees){
      G.rubees += award.bonusRubees;
      pushLogQuiet(`💰 Earned ${award.bonusRubees} bonus Rubees.`);
    }
    offerRelicChoice("event_gear_award", award.tier);
    return;
  }
  const node = getCurrentNode();
  G.combat = null;
  let bounty = 0;
  if (node.kind==="common"){
    const perEnemy = G.act===1 ? 6 : 8;
    bounty = perEnemy * (node.def.count||1);
    bounty += relicVal("bonusBountyPerKill") * (node.def.count||1);
    bounty += relicVal("commonBountyBonus");
  } else if (node.kind==="elite"){
    bounty = node.def.bounty || 30;
    bounty += relicVal("bonusBountyPerKill") * (node.def.count||1);
    if (hasRelicHook("eliteDoubleBounty")) bounty *= 2;
  } else if (node.kind==="boss"){
    bounty = node.def.bounty || 70;
    bounty += relicVal("bonusBountyPerKill") * (node.def.count||1);
  }
  if (node.kind!=="event" && node.kind!=="oasis" && node.kind!=="shop"){
    if (hasRelicHook("greedyDjinnsJar")) bounty *= 3;
    G.rubees += Math.round(bounty);
    pushLogQuiet(`💰 Earned ${Math.round(bounty)} Rubees.`);
    if (hasRelicHook("postCombatHeal")){
      healPlayer(relicVal("postCombatHeal"));
    }
  }
  if (node.kind==="elite"){
    offerRelicChoice("elite");
    return;
  }
  if (node.kind==="boss"){
    offerBossRelicChoice();
    return;
  }
  if (node.kind==="common"){
    G.pendingReward = rollReward(false);
    render();
  } else {
    advanceFromCurrentNode();
  }
}

function offerRelicChoice(onComplete, tier){
  if (!G.player.relics) G.player.relics = [];
  const owned = new Set(G.player.relics.map(r=>r.id));
  const available = RELIC_POOL.filter(r=>{
    if (owned.has(r.id)) return false;
    if (r.captainOnly && r.captainOnly !== G.captainKey) return false;
    if (r.hiddenFromDraft) return false;
    return true;
  });
  if (available.length===0){
    dispatchRelicComplete(onComplete);
    return;
  }
  const bonusChoices = hasRelicHook("abyssalCompass") ? 1 : 0;
  const totalN = Math.min(3 + bonusChoices, available.length);
  const weights = rarityWeightsFor(tier || "eliteReward");
  const choices = weightedRarityPick(available, totalN, weights, r=>r.rarity||"Common");

  G.pendingRelicChoice = { choices, onComplete };
  render();
}
function offerBossRelicChoice(){
  if (!G.player.relics) G.player.relics = [];
  const owned = new Set(G.player.relics.map(r=>r.id));
  const available = BOSS_RELIC_POOL.filter(r=>!owned.has(r.id));
  if (available.length===0){
    dispatchRelicComplete("boss");
    return;
  }
  const choices = shuffle([...available]).slice(0, Math.min(3, available.length));
  G.pendingRelicChoice = { choices, onComplete:"boss" };
  render();
}
function pickRelicChoice(idx){
  const choice = G.pendingRelicChoice.choices[idx];
  const onComplete = G.pendingRelicChoice.onComplete;
  if (choice){
    G.player.relics.push(choice);
    if (choice.apply) choice.apply(G.player);
    pushLogQuiet(`🏺 Gear gained: ${choice.name} — ${choice.desc}`);
  }
  G.pendingRelicChoice = null;
  dispatchRelicComplete(onComplete);
}
function dispatchRelicComplete(onComplete){
  if (onComplete === "elite"){
    G.pendingReward = rollReward(true);
  } else if (onComplete === "boss"){
    if (G.act===1){
      G.act = 2;
      G.mapFloors = buildBranchingMap(ACT2_COMMONS, ACT2_ELITES, ACT2_BOSSES, 4, [true, false, true, false]);
      startMapAtEntry();
      G.player.hp = G.player.maxHp; // full heal entering a new act
      pushLogQuiet("=== Entering Act 2 — fully healed ===");
      advanceNode();
      return;
    } else if (G.act===2){
      G.act = 3;
      G.mapFloors = buildBranchingMap(ACT3_COMMONS, ACT3_ELITES, ACT3_BOSSES, 5, [true, false, true, false, true]);
      startMapAtEntry();
      G.player.hp = G.player.maxHp; // full heal entering a new act
      pushLogQuiet("=== Entering Act 3: The Eternal Dark — fully healed ===");
      advanceNode();
      return;
    } else {
      G.over = true; G.won = true;
    }
  } else {
    advanceFromCurrentNode();
    return;
  }
  render();
}

function rollReward(fromElite){
  const n = (fromElite && hasRelicHook("eliteRewardBonus")) ? 4 : 3;
  const bonusN = hasRelicHook("abyssalCompass") ? 1 : 0;
  const totalN = n + bonusN;
  const weights = rarityWeightsFor(fromElite ? "eliteReward" : "commonReward");
  const picked = weightedRarityPick(G.pool, Math.min(totalN, G.pool.length), weights, cardRarity);
  const byRarityForGuarantee = {Uncommon: G.pool.filter(c=>cardRarity(c)==="Uncommon"), Rare: G.pool.filter(c=>cardRarity(c)==="Rare")};

  if (fromElite && picked.length>0){
    const hasStrong = picked.some(c => cardRarity(c) !== "Common");
    if (!hasStrong){
      const pickedIds = new Set(picked.map(c=>c.id));
      const strongPool = [...byRarityForGuarantee.Uncommon, ...byRarityForGuarantee.Rare].filter(c=>!pickedIds.has(c.id));
      if (strongPool.length>0){
        picked[0] = strongPool[Math.floor(Math.random()*strongPool.length)];
      }
    }
  }

  return picked;
}
function pickReward(idx){
  if (idx>=0 && G.pendingReward[idx]){
    const card = G.pendingReward[idx];
    G.deck.all.push({...card});
    G.pool = G.pool.filter(c=>c.id!==card.id);
  }
  G.pendingReward = null;
  advanceFromCurrentNode();
}

const CREW_EVENTS = {
  Branch: [
    {id:"pine", cardName:"Rock Candy - Stoneskin", isFight:true,
      text:"A hulking shape made of hardened rock candy blocks the path, its cracked shell slowly reforming.",
      choiceA:"Fight it", choiceB:"Leave it be",
      enemyBase:"Rock Candy Brute", enemyHpMult:0.6,
      resultText:"The shell cracks open — someone was standing guard inside the whole time. Pine had fused into the golem's husk rather than abandon her post, and you just cracked her free."},
    {id:"christmas", cardName:"Christmas Dinner", isFight:false,
      text:"An entire stretch of beach smells like gingerbread, warm without a fire source, sugar crunching underfoot.",
      choiceA:"Investigate the warmth", choiceB:"Make camp elsewhere",
      resultText:"The memory surfaces: the first meal Christmas ever cooked this crew, made from nothing but scraps and stubbornness, the night everyone stopped being strangers."},
    {id:"sage", cardName:"Sage's Remedy", isFight:false,
      text:"A low fog rolls in, and it starts murmuring symptoms you don't have — aches that haven't started yet, a cough that isn't real.",
      choiceA:"Push through it", choiceB:"Wait for it to pass",
      resultText:"The fog clears on Sage's medical tent, and the night she pulled something out of Branch that was never supposed to be inside a person."},
    {id:"thistle_setup", part:1, unlocks:"thistle_payoff",
      text:"Cherry-bomb-textured candy husks litter a stretch of beach — old, spent, but one of the craters still smokes faintly.",
      choiceA:"Search the crater", choiceB:"Walk past",
      resultText:"Something about this place feels unfinished, like it's waiting for someone to come back."},
    {id:"thistle_payoff", part:2, requires:"thistle_setup", cardName:"Thistle's Boom", isFight:true,
      text:"You're drawn back to the crater — and this time, one of the husks is ticking.",
      choiceA:"Disarm it", choiceB:"Detonate it from a distance",
      enemyBase:"Reef Crab", enemyHpMult:0.7,
      resultText:"The blast clears to reveal someone alive at the center — Thistle's first demolition, gone right in the worst way possible, and she's laughing about it already."},
    {id:"willow", cardName:"Willow's Prone Shot", isFight:false,
      text:"Something on a distant ridge catches the light, again and again, too rhythmic to be an accident.",
      choiceA:"Investigate", choiceB:"Keep moving",
      resultText:"The memory surfaces: the day Willow put an arrow through an ambush before anyone else even knew it was there."},
  ],
  Riley: [
    {id:"belt", cardName:"Belt's Backup", isFight:false,
      text:"A steady thump comes from beneath the deck, in time with nothing, too even to be alive.",
      choiceA:"Follow it down", choiceB:"Leave it be",
      resultText:"It's Belt's ritual before every fight — drumming out a rhythm on anything within reach until her nerves settled."},
    {id:"riff", cardName:"Riff's Fifth Blade", isFight:false,
      text:"Steel rings against steel somewhere close, but there's no one there.",
      choiceA:"Step into the sound", choiceB:"Walk past",
      resultText:"The memory resolves: the first time Riff and Riley crossed blades, not as enemies, testing each other until neither could stand."},
    {id:"encore_setup", part:1, unlocks:"encore_payoff",
      text:"An entire island coated in stretching, echoing taffy — every footstep repeats twice, wrong.",
      choiceA:"Cross it", choiceB:"Go the long way around",
      resultText:"Something about this place remembers you before you've even left it."},
    {id:"encore_payoff", part:2, requires:"encore_setup", cardName:"Encore for the Captain", isFight:false,
      text:"You find yourself back on the taffy coast, and this time the echoes are singing.",
      choiceA:"Listen", choiceB:"Cover your ears and leave",
      resultText:"Encore's candy in action for the first time — the show she never gave the mic back from."},
    {id:"harmony", cardName:"Harmony's Lecture", isFight:false,
      text:"A melody drifts in slightly off-key, and something about your own stance feels unsteady while it plays.",
      choiceA:"Follow it", choiceB:"Ignore it",
      resultText:"Harmony's healing song — the one she hums over wounds that shouldn't be closing this fast."},
    {id:"amp_setup", part:1, unlocks:"amp_payoff",
      text:"The air itself feels charged here, wrong, sugar-sweet ozone thick enough to taste.",
      choiceA:"Investigate the charge", choiceB:"Steer clear",
      resultText:"Whatever did this isn't finished. You can feel it building toward something."},
    {id:"amp_payoff", part:2, requires:"amp_setup", cardName:"Amp's Feedback", isFight:true,
      text:"The charge in the air breaks into a full storm, crackling and candy-sweet, something caught at its center.",
      choiceA:"Brave the storm", choiceB:"Wait it out",
      enemyBase:"Mermaid Enchantress", enemyHpMult:0.7,
      resultText:"You pull her out mid-experiment, mid-backlash — Amp's first taste of forbidden power, and the grin she had even as it nearly killed her."},
  ],
  Broderick: [
    {id:"pluto", cardName:"Pluto's Shuffle", isFight:false,
      text:"Gunfire cracks somewhere close, again and again, and there's never anyone standing there.",
      choiceA:"Investigate", choiceB:"Keep moving",
      resultText:"It's Pluto, showing off — the memory of his first trick shot, and the crew's collective decision to never bet against him again."},
    {id:"yeller_setup", part:1, unlocks:"yeller_payoff",
      text:"Something screams in the distance, candy-coated and awful, and it doesn't stop when you'd expect it to.",
      choiceA:"Move toward the scream", choiceB:"Move away from it",
      resultText:"Whatever that was, it's still out there. You haven't heard the end of it."},
    {id:"yeller_payoff", part:2, requires:"yeller_setup", cardName:"Screaming Candy - Yeller's Wall", isFight:true,
      text:"The scream returns, closer now — something candy-coated and shrieking has cornered its prey in the dark.",
      choiceA:"Fight it off", choiceB:"Leave it be",
      enemyBase:"Drowned Sailor", enemyHpMult:0.7,
      resultText:"It had cornered him — Yeller, his own Screaming Candy the only thing keeping him alive until you got there."},
    {id:"lassie", cardName:"Lassie's Toolkit", isFight:false,
      text:"Tracks lead somewhere they shouldn't be able to reach.",
      choiceA:"Follow them", choiceB:"Leave them",
      resultText:"Lassie finding the one route out of a dead end that saved the whole crew, sniffed out from nothing."},
    {id:"cerberus", cardName:"Cerberus's Bite", isFight:true,
      text:"Something with too many heads stalks just past the treeline.",
      choiceA:"Fight it", choiceB:"Avoid it",
      enemyBase:"Sand Viper Fish", enemyHpMult:0.7,
      resultText:"It wasn't hunting you — it was already half-tamed, and Cerberus was mid-taming it when you interrupted."},
    {id:"scrappy", cardName:"Scrappy's Second Chance", isFight:false,
      text:"A tiny whimper, easy to miss, easy to ignore, comes from somewhere low to the ground.",
      choiceA:"Investigate", choiceB:"Walk past",
      resultText:"Scrappy — the smallest of the crew, and the reason someone else is still alive to tell the story."},
  ],
};
function getEligibleCrewEvents(){
  const crew = CREW_EVENTS[G.captainKey] || [];
  if (!G.crewEventsSeen) G.crewEventsSeen = new Set();
  if (!G.crewPrereqsMet) G.crewPrereqsMet = new Set();
  return crew.filter(ev => {
    if (G.crewEventsSeen.has(ev.id)) return false;
    if (ev.requires && !G.crewPrereqsMet.has(ev.requires)) return false;
    return true;
  });
}
function rollCrewEvent(){
  const eligible = getEligibleCrewEvents();
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random()*eligible.length)];
}
function rollEvent(){
  const crewEv = (Math.random() < 0.30) ? rollCrewEvent() : null;
  if (crewEv) return {crew:true, crewData:crewEv, text:crewEv.text, choiceA:crewEv.choiceA, choiceB:crewEv.choiceB, choiceC:null};
  const roll = Math.random();
  if (roll < 0.10) return {text:"A Taffy-Sealed Letter washes ashore, its message stuck fast inside.", choiceA:"Peel it open (-8 HP, gain minor gear feel)", choiceB:"Toss it back", choiceC:null, effect:"bottle"};
  if (roll < 0.20) return {text:"Candied Siren's Toll: she'll take a card from your deck, for a price.", choiceA:"Accept (-5% max HP, remove weakest card)", choiceB:"Refuse", choiceC:null, effect:"siren"};
  if (roll < 0.30) return {text:"Sugarplum Cyclops blocks the path, hoard glittering beside it.", choiceA:"Poke its eye (fight at 75% strength, it starts Dazed)", choiceB:"Steal from its hoard (50% chance: gold+gear feel, no fight / 50% chance: wakes at FULL strength)", choiceC:"Leave it be", effect:"cyclops"};
  if (roll < 0.40) return {text:"Gambling Gull eyes your coin purse.", choiceA:"Feed it (+3 max HP, -10 Rubees)", choiceB:"Ignore it", choiceC:null, effect:"gull"};
  if (roll < 0.50) return {text:"A Confection in Yellow — a tattered wrapper printed in a color wrong to look at directly, promising a recipe that cannot be unmade once read.", choiceA:"Read it (-5% max HP, draw a card as if from a common victory)", choiceB:"Burn it unread (heal 5 HP)", choiceC:null, effect:"confection_yellow"};
  if (roll < 0.60) return {text:"A Rock Candy shard, colored something that isn't a real color, shifts slightly whenever you look away.", choiceA:"Taste it (-5% max HP, draw a card as if from a common victory)", choiceB:"Leave it buried (+12 Rubees)", choiceC:null, effect:"wrong_candy"};
  if (roll < 0.70) return {text:"A gingerbread house folds back on itself — more house inside than its walls should allow outside.", choiceA:"Go deeper (fight The Gingerbread Man for a real reward)", choiceB:"Leave now (+12 Rubees)", choiceC:null, effect:"gingerbread"};
  if (roll < 0.80) return {text:"Something ancient sings from beneath the waves. Candy-coated, fish-eyed things surface to listen alongside you.", choiceA:"Offer something (-30 Rubees, guaranteed Gear)", choiceB:"Refuse (fight the Choir's Herald for better Gear)", choiceC:null, effect:"deep_choir"};
  if (roll < 0.90) return {text:"A gumdrop, eaten, might show you something vast and asleep beneath the sea — utterly indifferent to whether you exist at all.", choiceA:"Eat it (-5% max HP, random benefit)", choiceB:"Discard it (+12 Rubees)", choiceC:null, effect:"dreaming_gumdrop"};
  return {text:"A sigil built from hardened candy shards. Touching it doesn't hurt — but something now knows you touched it.", choiceA:"Accept the mark (Gear, but you start every combat with 10 Enflame from now on)", choiceB:"Destroy it (fight a random Elite for Gear, no lasting cost)", choiceC:null, effect:"sugarcoated_sign"};
}
function renderCrewMoment(){
  const cm = G.pendingCrewMoment;
  return `
    <div id="eventBox">
      <h3>🎴 A Memory Surfaces</h3>
      <p style="font-style:italic;line-height:1.6">${cm.text}</p>
      <p style="color:var(--accent);font-weight:bold;margin-top:12px">${cm.cardName} joins your deck.</p>
      <div class="choices">
        <button class="btn primary" onclick="continueCrewMoment()">Continue</button>
      </div>
    </div>`;
}
function continueCrewMoment(){
  const cm = G.pendingCrewMoment;
  G.pendingCrewMoment = null;
  grantSpecificCard(cm.cardName);
  advanceFromCurrentNode();
}
function grantSpecificCard(cardName){
  const card = G.pool.find(c=>c.name===cardName);
  if (card){
    G.deck.all.push({...card});
    G.pool = G.pool.filter(c=>c.id!==card.id);
    pushLogQuiet(`🎴 ${cardName} joins your deck!`);
  } else {
    const consolation = 30 + Math.floor(Math.random()*20);
    G.rubees += consolation;
    pushLogQuiet(`You already carry ${cardName} — instead, you find ${consolation} Rubees left behind.`);
  }
}
function resolveEvent(choice){
  const ev = G.pendingEvent;
  if (!ev) return;
  if (ev.crew){
    const cd = ev.crewData;
    if (!G.crewEventsSeen) G.crewEventsSeen = new Set();
    if (!G.crewPrereqsMet) G.crewPrereqsMet = new Set();
    G.crewEventsSeen.add(cd.id);
    if (cd.part === 1){
      G.crewPrereqsMet.add(cd.id);
      if (choice === "A"){
        const dmg = 5;
        G.player.hp = Math.max(1, G.player.hp - dmg);
        const reward = 20 + Math.floor(Math.random()*11);
        G.rubees += reward;
        pushLogQuiet(`${cd.resultText} (−${dmg} HP, +${reward} Rubees)`);
      } else {
        const reward = 8 + Math.floor(Math.random()*8);
        G.rubees += reward;
        pushLogQuiet(`You keep your distance, but something has shifted. (+${reward} Rubees)`);
      }
      G.pendingEvent = null;
      advanceFromCurrentNode();
      return;
    }
    if (choice === "B"){
      const consolation = 10 + Math.floor(Math.random()*10);
      G.rubees += consolation;
      pushLogQuiet(`You walk away. (+${consolation} Rubees)`);
      G.pendingEvent = null;
      advanceFromCurrentNode();
      return;
    }
    // choice A: interact
    if (cd.isFight){
      G.pendingEvent = null;
      G.pendingCrewCardAward = {cardName: cd.cardName, resultText: cd.resultText};
      const baseEnemy = ACT1_COMMONS.find(e=>e.name===cd.enemyBase) || ACT1_ELITES.find(e=>e.name===cd.enemyBase);
      const flavoredEnemy = {...baseEnemy, hp: Math.round(baseEnemy.hp * (cd.enemyHpMult||1)), name: cd.text.split('.')[0].length < 40 ? baseEnemy.name : baseEnemy.name};
      enterCombatFull(flavoredEnemy, "common");
      return;
    } else {
      G.pendingEvent = null;
      G.pendingCrewMoment = {text: cd.resultText, cardName: cd.cardName};
      render();
      return;
    }
  }
  if ((ev.effect==="confection_yellow" || ev.effect==="wrong_candy") && choice==="A"){
    G.player.maxHp = Math.round(G.player.maxHp*0.95);
    if (isRiley() && G.player.baseMaxHp!==undefined) G.player.baseMaxHp = Math.round(G.player.baseMaxHp*0.95);
    G.player.hp = Math.min(G.player.hp, G.player.maxHp);
    pushLogQuiet(`${ev.effect==="confection_yellow" ? "The recipe cannot be unread." : "The taste lingers wrong."} −5% max HP.`);
    G.pendingEvent = null;
    G.pendingReward = rollReward(false);
    render();
    return;
  }
  if (ev.effect==="confection_yellow" && choice==="B"){
    const h = healPlayer(5);
    pushLogQuiet(`You burn it unread. Heals ${h} HP.`);
    G.pendingEvent = null;
    advanceFromCurrentNode();
    return;
  }
  if (ev.effect==="wrong_candy" && choice==="B"){
    G.rubees += 12;
    pushLogQuiet("You leave it buried. +12 Rubees.");
    G.pendingEvent = null;
    advanceFromCurrentNode();
    return;
  }
  if (ev.effect==="gingerbread" && choice==="A"){
    G.pendingEvent = null;
    G.pendingEventGearAward = {tier:"eliteReward", bonusRubees:0};
    const pool = G.act===1 ? ACT1_ELITES : ACT2_ELITES;
    const base = pool[Math.floor(Math.random()*pool.length)];
    const flavored = {...base, name:"The Gingerbread Man"};
    enterCombatFull(flavored, "elite");
    return;
  }
  if (ev.effect==="gingerbread" && choice==="B"){
    G.rubees += 12;
    pushLogQuiet("You leave now. +12 Rubees.");
    G.pendingEvent = null;
    advanceFromCurrentNode();
    return;
  }
  if (ev.effect==="deep_choir" && choice==="A"){
    G.rubees = Math.max(0, G.rubees - 30);
    pushLogQuiet("The choir accepts your offering.");
    G.pendingEvent = null;
    offerRelicChoice("deep_choir", "commonReward");
    return;
  }
  if (ev.effect==="deep_choir" && choice==="B"){
    G.pendingEvent = null;
    G.pendingEventGearAward = {tier:"eliteReward", bonusRubees:15};
    const pool = G.act===1 ? ACT1_ELITES : ACT2_ELITES;
    const base = pool[Math.floor(Math.random()*pool.length)];
    const flavored = {...base, name:"The Choir's Herald"};
    enterCombatFull(flavored, "elite");
    return;
  }
  if (ev.effect==="dreaming_gumdrop" && choice==="A"){
    G.player.maxHp = Math.round(G.player.maxHp*0.95);
    if (isRiley() && G.player.baseMaxHp!==undefined) G.player.baseMaxHp = Math.round(G.player.baseMaxHp*0.95);
    G.player.hp = Math.min(G.player.hp, G.player.maxHp);
    const outcome = Math.floor(Math.random()*3);
    if (outcome === 0){
      const h = healPlayer(15);
      pushLogQuiet(`Something vast stirs. −5% max HP. Heals ${h} HP.`);
    } else if (outcome === 1){
      G.rubees += 25;
      pushLogQuiet(`Something vast stirs. −5% max HP. +25 Rubees.`);
    } else {
      G.pendingBonusEnergyNextFight = 2;
      pushLogQuiet(`Something vast stirs. −5% max HP. Your next fight opens with +2 energy.`);
    }
    G.pendingEvent = null;
    advanceFromCurrentNode();
    return;
  }
  if (ev.effect==="dreaming_gumdrop" && choice==="B"){
    G.rubees += 12;
    pushLogQuiet("You discard it. +12 Rubees.");
    G.pendingEvent = null;
    advanceFromCurrentNode();
    return;
  }
  if (ev.effect==="sugarcoated_sign" && choice==="A"){
    G.player.signMarked = true;
    pushLogQuiet("Something is aware of you now. You will start every combat with 10 Enflame.");
    G.pendingEvent = null;
    offerRelicChoice("sugarcoated_sign", "commonReward");
    return;
  }
  if (ev.effect==="sugarcoated_sign" && choice==="B"){
    G.pendingEvent = null;
    G.pendingEventGearAward = {tier:"eliteReward", bonusRubees:0};
    const pool = G.act===1 ? ACT1_ELITES : ACT2_ELITES;
    const base = pool[Math.floor(Math.random()*pool.length)];
    enterCombatFull({...base}, "elite");
    return;
  }
  if (ev.effect==="bottle" && choice==="A"){
    G.player.hp = Math.max(1, G.player.hp-8);
    pushLogQuiet("You read the bottle. -8 HP.");
    G.pendingEvent = null;
    offerRelicChoice("bottle");
    return;
  } else if (ev.effect==="siren" && choice==="A"){
    G.player.maxHp = Math.round(G.player.maxHp*0.95);
    if (isRiley() && G.player.baseMaxHp!==undefined) G.player.baseMaxHp = Math.round(G.player.baseMaxHp*0.95);
    G.player.hp = Math.min(G.player.hp, G.player.maxHp);
    G.pendingEvent = null;
    G.pendingRemoval = true;
    render();
    return;
  } else if (ev.effect==="cyclops" && choice==="A"){
    G.pendingEvent = null;
    const discounted = {...ACT1_ELITES[0], hp: Math.round(ACT1_ELITES[0].hp*0.75), name:"Sugarplum Cyclops", dazedOpen:true};
    enterCombatFull(discounted, "elite");
    return;
  } else if (ev.effect==="cyclops" && choice==="B"){
    const success = Math.random() < 0.5;
    if (success){
      pushLogQuiet("You successfully steal from the Cyclops's hoard! No fight.");
      G.pendingEvent = null;
      offerRelicChoice("cyclops");
      return;
    } else {
      pushLogQuiet("Sugarplum Cyclops wakes at FULL strength — no discount this time!");
      G.pendingEvent = null;
      enterCombatFull(ACT1_ELITES[0], "elite");
      return;
    }
  } else if (ev.effect==="gull" && choice==="A"){
    G.player.maxHp += 3; G.player.hp += 3;
    G.rubees = Math.max(0, G.rubees - 10);
    if (isRiley() && G.player.baseMaxHp!==undefined) G.player.baseMaxHp += 3;
    pushLogQuiet("Gambling Gull is pleased. +3 max HP, -10 Rubees.");
  }
  G.pendingEvent = null;
  advanceFromCurrentNode();
}

function restart(){ clearSave(); G = null; render(); }
function confirmRestart(){
  G.pendingRestartConfirm = true;
  render();
}
function cancelRestart(){
  G.pendingRestartConfirm = false;
  render();
}

// ============ RILEY STANCE SYSTEM ============
function isRiley(){ return G.captainKey === "Riley"; }
function isBroderick(){ return G.captainKey === "Broderick"; }
function isBranch(){ return G.captainKey === "Branch"; }
function cardRarity(card){
  if (card.forceRarity) return card.forceRarity;
  const hitMultiplier = card.hits > 1 ? card.hits : (card.randomHits > 0 ? card.randomHits : 1);
  const guaranteedDmg = (card.dmg||0) * hitMultiplier;
  if (card.exhaust || guaranteedDmg > 20) return "Djinn";
  if (card.locked || card.cost >= 3) return "Rare";
  const secondaryEffectFields = [
    "bleed","enflame","stun","tire","daze","requiresTargetEnflamed","dmgPerBulletLoaded","blockPerBulletLoaded","doubleDmgIfEnflamed",
    "retaliateDmg","retaliatePctOfBlock","scaleWithClarity","consumeClarityForDamage","consumeClarityForBlock",
    "healOnKill","energyGainOnKill","energyGain","draw","cleanse","ignoresBlock","selfEnflame","dmgFromOwnEnflame","blockFromOwnEnflame",
    "detonate","detonateRate","fullMoonBonusDmgMult","fullMoonBonusHeal","fullMoonBonusBlock","fullMoonBonusStun",
    "bonusIfClipEmpty","bonusIfTargetLowHp","dmgPerSwitchThisCombat","requiresSwitchedThisTurn","costLessIfTargetBleeding",
    "doubleCashIn","cashInSpreadHalf","healPctOfDamage","randomHits","hits","dazeSelf","bleedSecondTarget",
    "consumeClarityMinForDamage","consumeClarityMinForBlock","secondTargetEnflame","drawIfMagicLoaded","bonusIfMagicLoaded",
    "enflameSpreadHalfIfPresent","enflameSpreadHalf","delayedDetonateMult","detonateSpreadHalf","detonateReapplyAndAgain","reapplyOriginalEnflame",
    "generateClarityFlat","generateClarityInEntropy","bonusClarityOnNextSwitch",
  ];
  const hasSecondaryEffect = secondaryEffectFields.some(f => {
    if (f === "hits") return card.hits > 1;
    return !!card[f];
  });
  if ((card.desc && card.desc.includes("★")) || hasSecondaryEffect) return "Uncommon";
  return "Common";
}
function rarityBadge(rarity){
  const colors = {Common:"#9a9a9a", Uncommon:"#3b9bd6", Rare:"#c9962c", Djinn:"#b83bd6"};
  const color = colors[rarity] || colors.Common;
  const glow = rarity==="Djinn" ? `box-shadow:0 0 4px ${color};` : "";
  return `<span style="display:inline-block;font-size:10px;font-weight:bold;letter-spacing:0.5px;color:${color};border:1px solid ${color};border-radius:3px;padding:1px 5px;margin-bottom:3px;${glow}">${rarity.toUpperCase()}</span>`;
}
function cardPrice(card){
  const r = cardRarity(card);
  return r==="Djinn" ? 150 : r==="Rare" ? 90 : r==="Uncommon" ? 65 : 45;
}
function gearPrice(relic){
  const r = relic.rarity || "Common";
  return r==="Djinn" ? 240 : r==="Rare" ? 150 : r==="Uncommon" ? 100 : 60;
}
function rarityWeightsFor(context){
  // context: "commonReward" | "eliteReward" | "shop"
  if (context === "eliteReward") return G.act===1 ? {Common:0.49, Uncommon:0.38, Rare:0.11, Djinn:0.02} : {Common:0.36, Uncommon:0.40, Rare:0.20, Djinn:0.04};
  if (context === "shop") return G.act===1 ? {Common:0.40, Uncommon:0.40, Rare:0.16, Djinn:0.04} : {Common:0.28, Uncommon:0.40, Rare:0.24, Djinn:0.08};
  return G.act===1 ? {Common:0.70, Uncommon:0.25, Rare:0.04, Djinn:0.01} : {Common:0.56, Uncommon:0.34, Rare:0.08, Djinn:0.02};
}
function weightedRarityPick(items, totalN, weights, getRarity){
  const byRarity = {Common:[], Uncommon:[], Rare:[], Djinn:[]};
  for (const it of items){
    byRarity[getRarity(it)].push(it);
  }
  const specialRoll = Math.random();
  let specialTier = null;
  if (specialRoll < weights.Djinn && byRarity.Djinn.length > 0) specialTier = "Djinn";
  else if (specialRoll < weights.Djinn + weights.Rare && byRarity.Rare.length > 0) specialTier = "Rare";
  const specialSlotIndex = specialTier ? Math.floor(Math.random() * totalN) : -1;
  const commonUncommonTotal = weights.Common + weights.Uncommon;
  const commonNormalized = commonUncommonTotal > 0 ? weights.Common / commonUncommonTotal : 0.5;

  const picked = [];
  const pickedIds = new Set();
  for (let slot = 0; slot < totalN; slot++){
    const wantRarity = (slot === specialSlotIndex) ? specialTier : (Math.random() < commonNormalized ? "Common" : "Uncommon");
    const fallbackOrders = {
      Djinn: ["Djinn","Rare","Uncommon","Common"],
      Rare: ["Rare","Uncommon","Common"],
      Common: ["Common","Uncommon","Rare"],
      Uncommon: ["Uncommon","Common","Rare"],
    };
    let placed = false;
    for (const r of fallbackOrders[wantRarity]){
      const pool = byRarity[r].filter(x=>!pickedIds.has(x.id));
      if (pool.length===0) continue;
      const item = pool[Math.floor(Math.random()*pool.length)];
      picked.push(item);
      pickedIds.add(item.id);
      placed = true;
      break;
    }
    if (!placed) break;
  }
  if (picked.length < totalN){
    const remaining = shuffle(items.filter(x=>!pickedIds.has(x.id)));
    for (const it of remaining){
      if (picked.length>=totalN) break;
      picked.push(it); pickedIds.add(it.id);
    }
  }
  return picked;
}
function rollShopInventory(){
  const captainStarterNames = new Set(G.deck.all.map(c=>c.name));
  const availableCards = G.pool.filter(c => !captainStarterNames.has(c.name) || G.deck.all.filter(x=>x.name===c.name).length < 3);
  const pickedCards = weightedRarityPick(availableCards, Math.min(4, availableCards.length), rarityWeightsFor("shop"), cardRarity);
  const shopCards = pickedCards.map(c=>({...c, shopPrice: cardPrice(c)}));

  const owned = new Set((G.player.relics||[]).map(r=>r.id));
  const availableGear = RELIC_POOL.filter(r=>{
    if (owned.has(r.id)) return false;
    if (r.captainOnly && r.captainOnly !== G.captainKey) return false;
    if (r.hiddenFromDraft) return false;
    return true;
  });
  const pickedGear = weightedRarityPick(availableGear, Math.min(3, availableGear.length), rarityWeightsFor("shop"), r=>r.rarity||"Common");
  const shopGear = pickedGear.map(r=>({...r, shopPrice: gearPrice(r)}));

  return { cards: shopCards, gear: shopGear };
}
function buyShopCard(idx){
  const item = G.pendingShop.cards[idx];
  if (!item || G.rubees < item.shopPrice) return;
  G.rubees -= item.shopPrice;
  G.deck.all.push({...item});
  G.deck.discard.push({...item});
  pushLogQuiet(`Bought ${item.name} for ${item.shopPrice} Rubees.`);
  G.pendingShop.cards.splice(idx, 1);
  render();
}
function buyShopGear(idx){
  const item = G.pendingShop.gear[idx];
  if (!item || G.rubees < item.shopPrice) return;
  G.rubees -= item.shopPrice;
  if (!G.player.relics) G.player.relics = [];
  G.player.relics.push(item);
  if (item.apply) item.apply(G.player);
  pushLogQuiet(`Bought ${item.name} for ${item.shopPrice} Rubees.`);
  G.pendingShop.gear.splice(idx, 1);
  render();
}
function buyShopRemoval(){
  if (G.rubees < G.removalPrice) return;
  G.rubees -= G.removalPrice;
  G.removalPrice *= 2;
  G.savedShopState = G.pendingShop;
  G.pendingShop = null;
  G.pendingRemoval = true;
  G.pendingRemovalReturnsToShop = true;
  render();
}
function buyShopHeal(){
  if (G.rubees < G.healPrice) return;
  G.rubees -= G.healPrice;
  G.healPrice *= 2;
  const healAmt = Math.round(G.player.maxHp * 0.5);
  const actualHealed = healPlayer(healAmt);
  pushLogQuiet(`F&J Emporium's medic heals you for ${actualHealed} HP.`);
  render();
}
function leaveShop(){
  G.pendingShop = null;
  advanceFromCurrentNode();
}
function onPlayerAppliedDebuff(target, debuffType){
  if (hasRelicHook("healOnDebuffApply") && !G.combat.usedSailorsLocket){
    G.combat.usedSailorsLocket = true;
    const actualHeal6 = healPlayer(relicVal("healOnDebuffApply"));
    pushLogQuiet(`Sailor's Locket heals ${actualHeal6} HP.`);
  }
  if (hasRelicHook("multiDebuffBonusDmg") && target && target.alive){
    const s = target.status;
    const typeCount = (s.enflame>0?1:0)+(s.bleed>0?1:0)+(s.tire>0?1:0)+(s.daze>0?1:0);
    if (typeCount >= 2){
      const bonus = relicVal("multiDebuffBonusDmg");
      target.hp = Math.max(0, target.hp - bonus);
      if (target.hp===0) target.alive=false;
      pushLogQuiet(`Kraken's Signet Ring deals ${bonus} bonus damage.`);
    }
  }
}
function grantEnchant(n){
  if (!G.combat) return;
  n = n || 1;
  G.player.enchant = (G.player.enchant||0) + n;
  pushLogQuiet(`Enchant: ${G.player.enchant}.`);
  if (G.player.enchant >= 5){
    G.player.enchant -= 5;
    G.combat.energy += 1;
    pushLogQuiet(`⚡ Enchant surges! +1 energy.`);
    if (hasRelicHook("enchantBonusDraw")){
      drawCards(G.deck, 1);
      pushLogQuiet(`Hollow Conch draws a card from the surge.`);
    }
  }
}
function bulletEffect(type){
  if (type === "Fire") return {dmg:5, dtype:"Fire", enflame:2, block:0, draw:0};
  if (type === "Plain") return {dmg:3, dtype:"Blunt", block:4, enflame:0, draw:0};
  if (type === "Magic") return {dmg:2, dtype:"Magical", block:0, enflame:0, draw:1};
  return {dmg:0, dtype:null, enflame:0, block:0, draw:0};
}
function resolveBulletCard(card, target){
  if (!isBroderick() || !G.combat) return;
  const clipMax = G.player.clipMax || 4;
  if (card.loadBullet){
    if (G.player.clip.length < clipMax){
      G.player.clip.push(card.loadBullet);
      pushLogQuiet(`Loads a ${card.loadBullet} bullet. Clip: [${G.player.clip.join(", ")}]`);
    } else {
      G.player.clip.shift(); // FIFO: drop the oldest bullet
      G.player.clip.push(card.loadBullet);
      pushLogQuiet(`Clip full — replaces the oldest bullet with ${card.loadBullet}. Clip: [${G.player.clip.join(", ")}]`);
    }
    if (card.setLinedUp){ G.combat.linedUp = true; pushLogQuiet(`Lined up for the next Kill Shot.`); }
    return;
  }
  if (!card.consumesBullets) return;

  if (card.autoLoadIfEmpty && G.player.clip.length === 0){
    G.player.clip.push(card.autoLoadIfEmpty);
    pushLogQuiet(`No bullets loaded — loads a ${card.autoLoadIfEmpty} bullet instead of firing.`);
    return; // does not fire this play
  }

  // Trick Shot: fire bullet at target 1 normally, flat Enflame at target 2 (or same target if solo)
  if (card.secondTargetEnflame){
    if (G.player.clip.length === 0){ pushLogQuiet(`No bullets to fire.`); return; }
    const type = G.player.clip.pop();
    if (type === "Magic") grantEnchant(1);
    const eff = bulletEffect(type);
    fireOneBullet(type, eff, target, 1, 1, false);
    const others = G.combat.enemies.filter(en=>en.alive && en!==target);
    if (others.length>0){
      const t2 = others[Math.floor(Math.random()*others.length)];
      applyEnflame(t2, card.secondTargetEnflame);
      pushLogQuiet(`${t2.name} catches a stray spark: ${card.secondTargetEnflame} Enflame.`);
    } else if (card.secondTargetFallbackSame && target && target.alive){
      applyEnflame(target, card.secondTargetEnflame);
      pushLogQuiet(`${target.name} catches the full blast: ${card.secondTargetEnflame} extra Enflame.`);
    }
    return;
  }

  // Double Tap: fire the SAME bullet twice, damage doubles, secondary applies once
  if (card.fireSameTwice){
    if (G.player.clip.length === 0){ pushLogQuiet(`No bullets to fire.`); return; }
    const type = G.player.clip.pop();
    if (type === "Magic") grantEnchant(1);
    const eff = bulletEffect(type);
    fireOneBullet(type, eff, target, 2, 1, !!card.detonate);
    pushLogQuiet(`Fires the same ${type} bullet twice.`);
    return;
  }

  const n = card.consumesBullets >= 99 ? G.player.clip.length : Math.min(card.consumesBullets, G.player.clip.length);
  if (n === 0){ pushLogQuiet(`No bullets to fire.`); return; }
  const bulletsToFire = [];
  for (let i=0;i<n;i++){ bulletsToFire.push(G.player.clip.pop()); }

  let dmgMult = 1, secMult = 1, killShotStun = false;
  if (card.checksLinedUp){
    if (G.combat.linedUp){
      if (card.linedUpStun){ killShotStun = true; pushLogQuiet(`Lined Up! Kill Shot will Stun on hit.`); }
      else { drawCards(G.deck, 1); pushLogQuiet(`Lined Up! Kill Shot draws a card.`); }
      G.combat.linedUp = false;
    }
    dmgMult = secMult = card.bonusMult || 1;
  } else if (card.dmgMult || card.secondaryMult){
    dmgMult = card.dmgMult || 1;
    secMult = card.secondaryMult || 1;
  }

  if (card.randomHits){
    const type = bulletsToFire[0];
    if (type === "Magic") grantEnchant(1);
    const eff = bulletEffect(type);
    let secondaryApplied = false;
    for (let h=0; h<card.randomHits; h++){
      const liveTargets = G.combat.enemies.filter(en=>en.alive);
      if (liveTargets.length===0) break;
      const t = liveTargets[Math.floor(Math.random()*liveTargets.length)];
      const dealt = takeDamage(t, card.hitDmg, eff.dtype, false);
      const bonus = tryCashInBleed(t, dealt);
      if (bonus>0){ t.hp = Math.max(0, t.hp-bonus); if(t.hp===0) t.alive=false; }
      if (eff.enflame){ applyEnflame(t, eff.enflame); }
      if (!secondaryApplied){
        if (eff.block) gainBlock(G.player, eff.block);
        if (eff.draw) drawCards(G.deck, eff.draw);
        secondaryApplied = true;
      }
    }
    pushLogQuiet(`Bullet Hell scatters ${card.randomHits} ${type} shots!`);
    return;
  }

  if (card.distributeAcrossEnemies){
    if (bulletsToFire.includes("Magic")) grantEnchant(1);
    const liveTargets = G.combat.enemies.filter(en=>en.alive);
    bulletsToFire.forEach((type, i) => {
      const t = liveTargets[i % liveTargets.length];
      if (!t) return;
      const eff = bulletEffect(type);
      fireOneBullet(type, eff, t, dmgMult, secMult, !!card.detonate, card.overrideDtype, card.magicDrawCap, false);
    });
    pushLogQuiet(`Mag Dump spreads ${bulletsToFire.join(", ")} across the field.`);
    return;
  }

  if (card.linedUpDmgBonus && G.combat.linedUp){
    dmgMult *= (1 + card.linedUpDmgBonus);
    G.combat.linedUp = false;
    pushLogQuiet(`Lined Up! This shot deals +${Math.round(card.linedUpDmgBonus*100)}% damage.`);
  }

  if (bulletsToFire.includes("Magic") && !card.overrideDtype) grantEnchant(1);
  const wasAliveBeforeFire = target && target.alive;
  for (const type of bulletsToFire){
    const eff = bulletEffect(type);
    const ignoresBlk = !!card.alwaysIgnoresBlock;
    fireOneBullet(type, eff, target, dmgMult, secMult, !!card.detonate, card.overrideDtype, card.magicDrawCap, ignoresBlk);
    if (killShotStun && target && target.alive){
      target.status.stun = true;
      pushLogQuiet(`${target.name} is stunned!`);
    }
  }
  if (card.bonusBountyOnKill && wasAliveBeforeFire && target && !target.alive){
    G.rubees += card.bonusBountyOnKill;
    pushLogQuiet(`A clean kill! +${card.bonusBountyOnKill} bonus Rubees.`);
  }
  pushLogQuiet(`Fires: ${bulletsToFire.join(", ")}.`);
  if (card.loadRandomAfterFire){
    const types = ["Plain","Fire","Magic"];
    const randomType = types[Math.floor(Math.random()*types.length)];
    G.player.clip.push(randomType);
    pushLogQuiet(`Pluto's Shuffle loads a random ${randomType} bullet.`);
  }
}

// Resolves one bullet's effect. dmgMult/secMult separate damage scaling from secondary-effect scaling.
function fireOneBullet(type, eff, target, dmgMult, secMult, canDetonate, overrideDtype, magicDrawCap, ignoresBlock){
  const finalDtype = overrideDtype || eff.dtype;
  const dmgAmt = Math.round(eff.dmg * dmgMult);
  if (dmgAmt > 0 && target && target.alive){
    const dealt = takeDamage(target, dmgAmt, finalDtype, !!ignoresBlock);
    const bonus = tryCashInBleed(target, dealt);
    if (bonus>0){ target.hp = Math.max(0, target.hp-bonus); if(target.hp===0) target.alive=false; }
    if (canDetonate && target.status.enflame>0){
      const b2 = target.status.enflame; target.hp = Math.max(0, target.hp-b2); target.status.enflame=0;
      if (target.hp===0) target.alive=false;
      pushLogQuiet(`Detonates ${b2} Enflame!`);
    }
  }
  if (eff.enflame && target) applyEnflame(target, Math.round(eff.enflame*secMult));
  if (eff.block) gainBlock(G.player, Math.round(eff.block*secMult));
  if (eff.draw){
    let drawAmt = Math.round(eff.draw*secMult);
    if (magicDrawCap) drawAmt = Math.min(drawAmt, magicDrawCap);
    drawCards(G.deck, drawAmt);
  }
}
function entropyHpCost(cost, inEntropy){
  const tiers = {0:[3,2], 1:[5,3], 2:[7,4], 3:[9,5], 4:[11,6]};
  const t = tiers[cost] || [9,5];
  return inEntropy ? t[0] : t[1];
}
function recomputeEffectiveMaxHp(){
  if (!isRiley()) return;
  const bonus = (G.player.stance === "FistBlade") ? G.player.clarity : 0;
  G.player.maxHp = G.player.baseMaxHp + bonus;
  if (G.player.hp > G.player.maxHp) G.player.hp = G.player.maxHp;
}
function healPlayer(amount){
  if (amount <= 0) return 0;
  if (G.player.status.noHeal){ pushLogQuiet("The silence holds — no healing takes effect."); return 0; }
  const mult = hasRelicHook("bittersweetHeart") ? 0.5 : 1;
  const actual = Math.round(amount * mult);
  if (actual > 0) window.noteBranchCardEffect?.("heal");
  const before = G.player.hp;
  G.player.hp = Math.min(G.player.maxHp, G.player.hp + actual);
  if (G.player.hp > before && G.combat){ G.combat.healedThisTurn = true; }
  return G.player.hp - before;
}
function gainClarity(n, fromAttack = false){
  if (!isRiley() || !G.combat) return;
  if (fromAttack && n > 0 && G.player.stance === "FourSword"){
    const scene = window.game?.scene.getScenes(true)[0];
    if (scene?.playerBody) window.playSeaClarityAttack(scene, scene.playerBody);
  }
  if (G.player.stance === "Entropy" && !G.player.unbrokenFocusActive) return; // no generation in Entropy unless Unbroken Focus is active (Moment of Clarity is the other exception, handled separately)
  G.player.clarity += n;
  G.combat.clarityGeneratedThisTurn = true;
  recomputeEffectiveMaxHp();
  pushLogQuiet(`Clarity: ${G.player.clarity}.`);
  const autoTriggerThreshold = G.player.unbrokenFocusActive ? 12 : 6;
  if (G.player.clarity >= autoTriggerThreshold && G.player.stance !== "Entropy"){
    G.player.stanceBeforeEntropy = G.player.stance;
    gainBlock(G.player, 1);
    pushLogQuiet(`Honed Clarity grants 1 Block from the stance shift.`);
    G.player.stance = "Entropy";
    G.combat.energy += 2;
    if (hasRelicHook("chaosBoundLocket") && !G.combat.usedChaosBoundLocket){
      G.combat.usedChaosBoundLocket = true;
      G.combat.energy += 1;
      pushLogQuiet(`Chaos-Bound Locket grants an extra energy.`);
    }
    recomputeEffectiveMaxHp();
    onStanceSwitchTracking();
    drawSpecificStanceCard("Entropy");
    pushLogQuiet(`⚡ Clarity overflow! Riley is pulled into One With Entropy, gaining 2 energy!`);
  }
}
function drawSpecificStanceCard(stance){
  if (G.deck.hand.length >= 8) return;
  let idx = G.deck.draw.findIndex(c => c.homeStance === stance && c.name==="One With Entropy - Eclipse");
  if (idx === -1) idx = G.deck.draw.findIndex(c => c.homeStance === stance);
  if (idx === -1){
    // reshuffle discard into draw and search again if needed
    if (G.deck.discard.some(c => c.homeStance === stance)){
      G.deck.draw = shuffle(G.deck.draw.concat(G.deck.discard));
      G.deck.discard = [];
      idx = G.deck.draw.findIndex(c => c.homeStance === stance && c.name==="One With Entropy - Eclipse");
      if (idx === -1) idx = G.deck.draw.findIndex(c => c.homeStance === stance);
    }
  }
  if (idx >= 0){
    const [card] = G.deck.draw.splice(idx, 1);
    G.deck.hand.push(card);
    pushLogQuiet(`Draws ${card.name} from the surge of chaos.`);
  } else {
    drawCards(G.deck, 1); // fallback: no Entropy card available anywhere, draw normally
  }
}
function onStanceSwitchTracking(){
  G.combat.switchCountThisCombat = (G.combat.switchCountThisCombat||0) + 1;
  G.combat.switchedThisTurn = true;
  if (G.combat.bonusClarityOnNextSwitch){
    gainClarity(G.combat.bonusClarityOnNextSwitch);
    pushLogQuiet(`Clarity's Turn grants bonus Clarity from the switch.`);
    G.combat.bonusClarityOnNextSwitch = 0;
  }
  if (hasRelicHook("weaversThread") && G.combat.switchCountThisCombat % 3 === 0){
    drawCards(G.deck, 1);
    pushLogQuiet(`The Weaver's Thread grants a card from the switch.`);
  }
}
function switchStance(to){
  if (!isRiley() || !G.combat) return;
  if (G.player.stance === "Entropy" && to !== "Entropy") return; // can't voluntarily leave Entropy; only usage-based exit works
  if (G.player.stance !== to){
    gainBlock(G.player, 1);
    pushLogQuiet(`Honed Clarity grants 1 Block from the stance shift.`);
    onStanceSwitchTracking();
  }
  G.player.stance = to;
  recomputeEffectiveMaxHp();
  pushLogQuiet(`Riley shifts into ${to === "FourSword" ? "Four Sword" : to === "FistBlade" ? "Fist Blade" : "One With Entropy"} Style.`);
}
function forceRevertFromEntropy(to){
  if (!isRiley() || !G.combat) return;
  if (G.player.stance !== to){
    gainBlock(G.player, 1);
    pushLogQuiet(`Honed Clarity grants 1 Block from the stance shift.`);
    onStanceSwitchTracking();
  }
  G.player.stance = to;
  recomputeEffectiveMaxHp();
}
function resolveEntropyReturn(to){
  G.combat.pendingEntropyReturn = false;
  switchStance(to);
  render();
}
function resolveStanceOffer(accept){
  const to = G.combat.pendingStanceOffer;
  G.combat.pendingStanceOffer = null;
  if (accept) switchStance(to);
  render();
}

// ============ INTENT PREVIEW (non-mutating estimate) ============
function getIntent(e){
  const t = e.tag; const nextTurn = e.turn+1;
  const base = e.atk + e.status.harden;
  if (e.status.stun) return "😵‍💫 Stunned (skips turn)";
  if (t==="pair") return `⚔️ Attack ${e_partnerAlive(e) ? base+2 : base}`;
  if (t==="tire_alt") return nextTurn%2===0 ? "🌀 Apply Tire (0 dmg)" : `⚔️ Attack ${base}`;
  if (t==="daze_open") return nextTurn===1 ? "😵 Apply Rattled (0 dmg)" : `⚔️ Attack ${base}`;
  if (t==="corrosion"){
    const cyc = nextTurn % 3;
    const bonus = e.hp <= e.maxHp*0.5 ? 3 : 0;
    if (cyc===1) return "☠️ Corrosion 3 (0 dmg)";
    if (cyc===2) return `⚔️ Attack ${e.atk + bonus}`;
    return `⚔️ Heavy Attack ${e.atk+8+bonus}`;
  }
  if (t==="undertow_open"){
    if (nextTurn===1) return `🌊 Undertow + Attack ${base}`;
    if (nextTurn%3===0) return `🌀 Tire + Attack ${base + (e.hp<=e.maxHp*0.5?3:0)}`;
    return `⚔️ Attack ${base}`;
  }
  if (t==="shield25_corrosion"){
    const parts = [];
    if (nextTurn%3===0) parts.push("☠️2 Corrosion");
    if (e.block<=0){
      if (nextTurn%2===0) parts.push(`⚔️${e.atk+4}`);
      else parts.push(`⚔️${base}`);
    } else parts.push(`⚔️${base} (shielded)`);
    return parts.join(" + ");
  }
  if (t==="shield25"){
    if (e.block > 0) return `⚔️ Attack ${base} (shielded)`;
    return nextTurn%2===1 ? "⚔️ Attack 16" : "💥 Shell Fragments: 8 dmg + Tire";
  }
  if (t==="tire_atk_daze"){
    const cyc = nextTurn % 3;
    if (cyc===1) return "🌀 Apply Tire (0 dmg)";
    if (cyc===2) return `⚔️ Attack ${e.atk}${e.hp<=e.maxHp*0.5?" + Tire":""}`;
    return "😵 Apply Rattled (0 dmg)";
  }
  if (t==="trio_harden"){
    const siblings = G.combat ? G.combat.enemies.filter(x=>x.tag==="trio_harden" && x.alive) : [];
    return siblings.length===1 ? `🎵 Solo Dirge: ${e.atk+8} dmg` : `⚔️ Attack ${base}`;
  }
  if (t==="duo_block_share"){
    const siblings = G.combat ? G.combat.enemies.filter(x=>x.tag===t && x.alive) : [];
    if (siblings.length===1){
      const nextSoloTurns = (e.soloTurns||0) + 1;
      return `😡 Enraged Attack ${e.atk + 2*nextSoloTurns}`;
    }
    return `⚔️ Attack ${base}`;
  }
  if (t==="duo_harden_share"){
    const siblings = G.combat ? G.combat.enemies.filter(x=>x.tag===t && x.alive) : [];
    return siblings.length===1 ? `😡 Enraged Attack ${e.atk+6}` : `⚔️ Attack ${base}`;
  }
  if (t==="twins"){
    if (e.hp <= e.maxHp*0.3 && !e.ultimateFired) return "💥 Twin Fury: 24 dmg";
    const twinSiblings = G.combat ? G.combat.enemies.filter(x=>x.tag==="twins") : [];
    const myIndex = twinSiblings.indexOf(e);
    const isBlockPhase = (nextTurn + myIndex) % 2 === 0;
    if (isBlockPhase) return "🛡️ Braces: +6 Block (0 dmg)";
    return `⚔️ Attack ${base}`;
  }
  if (t==="rising_tide_boss"){
    if (e.hp <= e.maxHp*0.5){
      if (!e.ultimateFired) return `💥 Captain's Last Stand: ${e.status.harden*3} dmg`;
      return nextTurn%2===1 ? `⚔️ Attack ${20+e.status.harden}` : `💀 THE TOLL: ${e.status.harden} dmg`;
    }
    return nextTurn%2===1 ? "⚔️ Attack 20" : "📈 Rising Tide (0 dmg, +2 Harden)";
  }
  if (t==="trio_lowest_first"){
    const siblings = G.combat ? G.combat.enemies.filter(x=>x.tag==="trio_lowest_first" && x.alive) : [];
    if (siblings.length===1 && !e.ultimateFired) return "🎵 Solo Aria: 20 dmg";
    return `⚔️ Attack ${base} (lowest-HP member only)`;
  }
  if (t==="aflam"){
    if (nextTurn % 5 === 0) return "📈 Fortify Orders (0 dmg, +2 Harden, Rattles you)";
    return (nextTurn % 2 === 1) ? "⚔️ Magma Lash: 18 dmg + Enflame" : "🔥/☠️ Corrode the Flame (0 dmg, status only)";
  }
  if (t==="tentacle"){
    if (e.hp <= e.maxHp*0.4 && !e.ultimateFired) return "💥 Crushing Grip: 40 dmg";
    return nextTurn%2===0 ? "🌊 Grasping Tendrils (0 dmg, 2 Corrosion)" : `⚔️ Attack ${e.hp>e.maxHp*0.4?e.atk:26}`;
  }
  if (t==="flying"){
    const capTurns = e.maxHp>=45?3:2;
    if (e.turn+1 <= capTurns) return `🕊️ Flying Attack ${base} (melee immune)`;
    return e.hp<=e.maxHp*0.5 ? `💥 Dive Bomb: ${e.atk+4} dmg` : `⚔️ Attack ${base}`;
  }
  if (t==="burst_buff"){
    if (nextTurn%3===0) return `📈 Building Fury (0 dmg, +3 Harden${e.hp<=e.maxHp*0.5?", Rattles you":""})`;
    return `⚔️ Attack ${e.atk + e.status.harden}`;
  }
  if (t==="muted_source") return `⚔️ Attack ${base} + 🔇 Applies Muted`;
  if (t==="uncounted_veil") return `⚔️ Attack ${base}`;
  if (t==="wax_sealed_choir") return `⚔️ Attack ${base} (reflects any status on the choir, amplified)`;
  if (t==="unbounded_truth") return `⚔️ Attack ${base} (grows every turn — exponentially if you Block or Heal)`;
  if (t==="returnal_scion") return `⚔️ Attack ${base} (only damageable by ${e.allowedType || "Magical"} this window)`;
  if (t==="djinnball_jar") return `⚔️ Attack ${base} + 🔒 Locks 1 energy (Fire damage frees it)`;
  if (t==="double_scoop") return `⚔️ Attack ${base} + 🌀 Tire + 😵 Daze`;
  if (t==="double_scoop_tire") return `⚔️ Attack ${base} + 🌀 Tire`;
  if (t==="double_scoop_daze") return `⚔️ Attack ${base} + 😵 Daze`;
  if (t==="appetite_concept") return `⚔️ Attack ${base} + 🍽️ Devours a card from your discard`;
  if (t==="concept_of_sweet"){
    const cyclePos = nextTurn % 3;
    const denial = cyclePos===1 ? "🚫⚔️ Silence Attack" : cyclePos===2 ? "🚫❤️ Silence Heal" : "🚫🛡️ Silence Block";
    return `⚔️ Attack ${base} + ${denial}`;
  }
  if (t==="yellow_yonka"){
    if (nextTurn % 3 === 0) return `⚔️ Attack ${base} + 🃏 Scrambles & curses your hand`;
    return `⚔️ Attack ${base}`;
  }
  if (t==="hours_that_pass"){
    if (nextTurn % 4 === 0) return `⚔️⚔️ Double Strike: ${base*2} dmg`;
    return `⚔️ Attack ${base} + 🌀 Drains 2 energy next turn`;
  }
  if (t==="true_yonk_shadow"){
    if (e.phase4Active){
      const dmgShown = base + 4;
      return (nextTurn % 3 === 0) ? `⚔️ Attack ${dmgShown} + 🩸 Devours 4 max HP permanently` : `⚔️ Attack ${dmgShown} (damage you deal is mirrored back at 25%)`;
    } else if (e.hp > e.maxHp*0.66){
      return (nextTurn % 2 === 0) ? "📈 Builds Harden (0 dmg)" : `⚔️ Attack ${base + Math.floor(e.status.harden/2)}`;
    } else if (e.hp > e.maxHp*0.33){
      return `⚔️ Attack ${base} + 💰 Steals Rubees`;
    } else {
      if (!e.finalFormFired) return "👑 Becomes Everything It Has Fought (huge dmg)";
      const cyclePos = nextTurn % 3;
      const denial = cyclePos===1 ? "🚫⚔️" : cyclePos===2 ? "🚫❤️" : "🚫🛡️";
      return `⚔️ Attack ${base*2} + ${denial} Silence`;
    }
  }
  if (t==="king_in_green"){
    if (e.hp > e.maxHp*0.66){
      return (nextTurn % 3 === 0) ? "💰 Steals Rubees (0 dmg)" : `⚔️ Attack ${base}`;
    } else if (e.hp > e.maxHp*0.33){
      return `⚔️ Attack ${base} (steals 50% of your Block as Harden)`;
    } else {
      if (!e.hoarderWrathFired) return "👑 The Hoarder's Wrath (huge dmg)";
      return `⚔️ Attack ${base} or 🎴 Seizes a card (1 turn)`;
    }
  }
  if (t==="uof"){
    const siblings = G.combat ? G.combat.enemies.filter(x=>x.tag==="uof" && x.alive) : [];
    const alreadyFired = siblings.some(s=>s.uofUltimateFired);
    const anyCritical = siblings.some(s=>s.hp>0 && s.hp<=s.maxHp*0.2);
    if (anyCritical && !alreadyFired) return "📢 The Lecture: 18 dmg";
    return e.uofNextIsJudgment ? "📈 Judgment (0 dmg, Hardens schoolmates)" : `⚔️ Attack ${base}${e.enraged>0?" x2":""}`;
  }
  if (t==="bleed_applier" || t==="bleed_applier_rage") return `🩸 Attack ${e.atk}${e.hp<=e.maxHp*0.5?"+3":""} + Bleed`;
  if (t==="harden_grow") return `⚔️ Attack ${base + (e.hp<=e.maxHp*0.5?3:0)} (+1 Harden after)`;
  return `⚔️ Attack ${base}`;
}
function e_partnerAlive(e){ return G.combat && G.combat.enemies.filter(x=>x!==e && x.alive).length>0; }

function typeChips(e){
  const chips = [];
  for (const [type, pct] of Object.entries(e.resist||{})){
    chips.push(`<span class="status-chip tag-${type}" title="Resists ${type}">🛡️${type} -${Math.round(pct*100)}%</span>`);
  }
  for (const [type, pct] of Object.entries(e.weak||{})){
    chips.push(`<span class="status-chip tag-${type}" title="Weak to ${type}">⚡${type} +${Math.round(pct*100)}%</span>`);
  }
  return chips.join("");
}
function statusChips(c){
  const s = c.status; const chips=[];
  if (s.enflame) chips.push(`🔥${s.enflame}`);
  if (s.bleed) chips.push(`🩸${s.bleed}`);
  if (s.tire) chips.push(`🌀Tire`);
  if (s.daze) chips.push(`⚡Daze x${s.daze}`);
  if (s.rattled) chips.push(`😵Rattled`);
  if (s.muted) chips.push(`🔇Muted x${s.muted}`);
  if (s.harden) chips.push(`📈${s.harden}`);
  if (s.corrosion) chips.push(`☠️${s.corrosion}`);
  if (s.undertow) chips.push(`🌊`);
  if (s.noAttack) chips.push(`🚫⚔️No Attack`);
  if (s.noHeal) chips.push(`🚫❤️No Heal`);
  if (s.noBlock) chips.push(`🚫🛡️No Block`);
  if (s.energyDrain) chips.push(`🌀-${s.energyDrain} Energy Next`);
  if (c.armored) chips.push(`🛡️Armored`);
  return chips.map(x=>`<span class="status-chip">${x}</span>`).join("");
}

// ============ RENDER ============
function render(){
  const app = document.getElementById("app");
  if (!G){ app.innerHTML = renderCaptainSelect(); return; }
  if (G.over){ clearSave(); app.innerHTML = renderEndScreen(); return; }
  saveGame();
  if (G.pendingRestartConfirm){ app.innerHTML = renderRestartConfirm(); return; }
  if (G.pendingCrewMoment){ app.innerHTML = renderCrewMoment(); return; }
  if (G.pendingEvent){ app.innerHTML = renderEvent(); return; }
  if (G.pendingShop){ app.innerHTML = renderShop(); return; }
  if (G.pendingRelicChoice){ app.innerHTML = renderRelicChoice(); return; }
  if (G.pendingRemoval){ app.innerHTML = renderRemoval(); return; }
  if (G.pendingReward){ app.innerHTML = renderReward(); return; }
  if (G.combat && !G.combat.over){ app.innerHTML = renderCombat(); return; }
  if (G.combat && G.combat.over){ app.innerHTML = renderCombatResult(); return; }
  app.innerHTML = renderMap();
}
function renderRestartConfirm(){
  return `
    <div class="center" style="margin-top:60px">
      <h2>⚠️ Abandon this run?</h2>
      <p style="color:var(--dim)">All progress — deck, Gear, Rubees, and map position — will be lost.</p>
      <div style="margin-top:20px">
        <button class="btn" onclick="cancelRestart()">Cancel</button>
        <button class="btn primary" style="margin-left:10px" onclick="restart()">Yes, Abandon Run</button>
      </div>
    </div>`;
}
function renderShop(){
  const s = G.pendingShop;
  return `
    <h2 class="center">🏪 F&J Emporium</h2>
    <p class="center">❤️ HP: <b>${G.player.hp} / ${G.player.maxHp}</b> &nbsp;|&nbsp; 💰 Rubees: <b>${G.rubees}</b></p>
    <h3>Cards for Sale</h3>
    <div class="reward-cards">
      ${s.cards.length===0 ? '<p>Sold out.</p>' : s.cards.map((c,i)=>`
        <div class="card" style="width:180px;cursor:pointer;opacity:${G.rubees>=c.shopPrice?1:0.5}" onclick="${G.rubees>=c.shopPrice?`buyShopCard(${i})`:''}">
          <span class="ccost">${c.cost}</span>
          <div>${rarityBadge(cardRarity(c))}</div>
          <div class="cname">${c.name}</div>
          <div class="ceffect">${c.desc}</div>
          <div style="color:var(--accent);font-weight:bold">${c.shopPrice} Rubees</div>
        </div>`).join("")}
    </div>
    <h3>Gear for Sale</h3>
    <div class="reward-cards">
      ${s.gear.length===0 ? '<p>Sold out.</p>' : s.gear.map((r,i)=>`
        <div class="card" style="width:180px;cursor:pointer;opacity:${G.rubees>=r.shopPrice?1:0.5}" onclick="${G.rubees>=r.shopPrice?`buyShopGear(${i})`:''}">
          <div>${rarityBadge(r.rarity||"Common")}</div>
          <div class="cname">🏺 ${r.name}</div>
          <div class="ceffect">${r.desc}</div>
          <div style="color:var(--accent);font-weight:bold">${r.shopPrice} Rubees</div>
        </div>`).join("")}
    </div>
    <h3>Services</h3>
    <div class="reward-cards">
      <div class="card" style="width:180px;cursor:pointer;opacity:${G.rubees>=G.removalPrice?1:0.5}" onclick="${G.rubees>=G.removalPrice?'buyShopRemoval()':''}">
        <div class="cname">✂️ Remove a Card</div>
        <div class="ceffect">Permanently remove one card from your deck.</div>
        <div style="color:var(--accent);font-weight:bold">${G.removalPrice} Rubees</div>
      </div>
      <div class="card" style="width:180px;cursor:pointer;opacity:${G.rubees>=G.healPrice?1:0.5}" onclick="${G.rubees>=G.healPrice?'buyShopHeal()':''}">
        <div class="cname">❤️ Medic's Care</div>
        <div class="ceffect">Heal 50% of your max HP.</div>
        <div style="color:var(--accent);font-weight:bold">${G.healPrice} Rubees</div>
      </div>
    </div>
    <div class="center" style="margin-top:12px"><button onclick="leaveShop()">Leave Shop</button></div>
  `;
}
function renderRelicChoice(){
  return `
    <h2 class="center">Choose Gear</h2>
    <div class="reward-cards">
      ${G.pendingRelicChoice.choices.map((r,i)=>`
        <div class="card" style="width:180px;cursor:pointer" onclick="pickRelicChoice(${i})">
          <div>${rarityBadge(r.rarity||"Common")}</div>
          <div class="cname">🏺 ${r.name}</div>
          <div class="ceffect">${r.desc}</div>
        </div>`).join("")}
    </div>
    <div class="center" style="margin-top:16px"><button class="btn" onclick="pickRelicChoice(-1)">Skip</button></div>`;
}

function renderCaptainSelect(){
  return `
    <h1 class="center">The Tremendous Sea — Playtest</h1>
    <p class="center" style="color:var(--dim)">Choose your captain to begin a voyage across the Tremendous Sea.</p>
    ${hasSavedGame() ? `<div class="center" style="margin-bottom:16px"><button class="btn primary" onclick="resumeGame()">▶ Continue Voyage in Progress</button></div>` : ''}
    <div class="card-select">
      ${Object.keys(CAPTAINS).map(k=>{
        const c = CAPTAINS[k];
        return `<div class="captain-card" onclick="startGame('${k}')">
          <h2 style="color:${c.color}">${c.name}</h2>
          <div style="color:var(--dim);font-size:12px">${c.candy}</div>
          <div style="margin:8px 0">Max HP: <b>${c.maxHp}</b></div>
          <div style="font-size:12px;color:var(--dim)">${c.trait}</div>
        </div>`;
      }).join("")}
    </div>`;
}

function renderMap(){
  const current = getCurrentNode();
  const icons = {common:"⚔️", elite:"☠️", boss:"💀", oasis:"🏝️", event:"❓", shop:"🏪"};
  const labelFor = n => n.kind==="boss" ? "Boss Fight" : n.kind==="elite" ? "Elite Fight" : n.kind==="oasis" ? "Rest at Oasis" : n.kind==="event" ? "Mystery Event" : n.kind==="shop" ? "F&J Emporium" : "Fight";
  const hintFor = n => n.kind==="boss" ? "The act's final battle." : n.kind==="elite" ? "A dangerous fight — real Gear on victory." : n.kind==="oasis" ? "Fully heal and rest." : n.kind==="event" ? "Something strange awaits." : n.kind==="shop" ? "Spend your Rubees." : "A common enemy.";
  const reachableNodes = current ? current.connectsTo.map(findNodeById).filter(Boolean) : [];

  const currentFloorIdx = current ? current.floor : 0;
  const totalFloors = G.mapFloors.length;
  const strip = G.mapFloors.map((floor, fi)=>{
    const done = fi < currentFloorIdx;
    const isCurrentFloor = fi === currentFloorIdx;
    const dotColor = done ? "var(--accent)" : (isCurrentFloor ? "var(--accent)" : "#2a3a4a");
    const size = isCurrentFloor ? 14 : 9;
    const pulse = isCurrentFloor ? "box-shadow:0 0 8px var(--accent);" : "";
    return `<div title="Floor ${fi+1}" style="width:${size}px;height:${size}px;border-radius:50%;background:${dotColor};${pulse}flex-shrink:0"></div>`;
  }).join(`<div style="width:10px;height:2px;background:#2a3a4a;flex-shrink:0"></div>`);

  return `
    <div style="display:flex;justify-content:flex-end">
      <button class="btn" style="font-size:11px;padding:4px 8px" onclick="confirmRestart()">🔄 Restart Run</button>
    </div>
    <h2 class="center">${G.cap.name} — Act ${G.act}: ${G.act===1 ? "Ocean of Tears" : G.act===2 ? "Candied Ocean" : "The Eternal Dark"}</h2>
    <div id="playerPanel">
      <div class="hpblock">
        <div>❤️ ${G.player.hp} / ${G.player.maxHp}</div>
        <div style="width:160px" class="bar-bg"><div class="bar-fill player" style="width:${100*G.player.hp/G.player.maxHp}%"></div></div>
      </div>
      <div>Deck size: ${G.deck.all.length}</div>
      <div>💰 Rubees: ${G.rubees}</div>
    </div>
    <div class="center" style="margin:10px 0">
      ${(G.player.relics||[]).map(r=>`<span class="status-chip" title="${r.desc}" style="margin:2px">🏺 ${r.name}</span>`).join(" ") || '<span style="color:var(--dim);font-size:12px">No gear yet</span>'}
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:2px;margin:16px auto;max-width:520px;overflow-x:auto;padding:4px">
      ${strip}
    </div>
    <p class="center" style="color:var(--dim);font-size:12px">${currentFloorIdx < 0 ? "The journey begins" : `Floor ${currentFloorIdx+1} of ${totalFloors+1}`}</p>
    ${G.pendingMapChoice ? `
      <p class="center" style="color:var(--accent);font-weight:bold;margin-top:16px">${currentFloorIdx < 0 ? "Choose your starting path" : "Choose your path"}</p>
      <div class="reward-cards">
        ${reachableNodes.map(n=>`
          <div class="card" style="width:150px;cursor:pointer" onclick="chooseNextNode('${n.id}')">
            <div style="font-size:32px;text-align:center">${icons[n.kind]}</div>
            <div class="cname" style="text-align:center">${labelFor(n)}</div>
            <div class="ceffect" style="text-align:center">${hintFor(n)}</div>
          </div>`).join("")}
      </div>` : ''}
    <div id="log" style="margin-top:20px">${G.log.slice(0,10).map(l=>`<div>${l}</div>`).join("")}</div>`;
}

function stanceNote(card){
  if (!isRiley() || !card.homeStance) return "";
  const stanceName = {FourSword:"Four Sword", FistBlade:"Fist Blade", Entropy:"Entropy"}[card.homeStance];
  const inHome = G.combat && G.player.stance === card.homeStance;
  if (card.locked){
    return `<div style="color:var(--accent);font-size:10px;margin-top:3px">🔒 Only playable in ${stanceName} Style${inHome ? " (active now)" : ""}.</div>`;
  }
  return `<div style="color:var(--dim);font-size:10px;margin-top:3px">×1.5 in ${stanceName}${inHome?" (active now)":""}.</div>`;
}
function renderCombat(){
  const c = G.combat;
  const dazeMod = G.player.status.rattled>0?1:0;
  return `
    <h3 class="center">${c.enemies[0].name}${c.enemies.length>1?` (x${c.enemies.length})`:""}</h3>
    ${isRiley() ? `<div class="center" style="margin-bottom:6px">
      <span class="status-chip" style="font-size:13px">🗡️ Stance: <b>${G.player.stance === "FourSword" ? "Four Sword" : G.player.stance === "FistBlade" ? "Fist Blade" : "One With Entropy"}</b></span>
      <span class="status-chip" style="font-size:13px">✨ Clarity: <b>${G.player.clarity}</b>/6</span>
      <span class="status-chip" style="font-size:11px;color:var(--dim)">(only Fist Blade Block/hits and Four Sword hits generate Clarity)</span>
    </div>` : ""}
    ${isBroderick() ? `<div class="center" style="margin-bottom:6px">
      <span class="status-chip" style="font-size:13px">🔫 Clip: ${
        Array.from({length: G.player.clipMax||4}, (_,i)=>i).map(i=>{
          const b = G.player.clip[i];
          const icon = b==="Fire" ? "🔥" : b==="Plain" ? "⚪" : b==="Magic" ? "✨" : "▫️";
          return `<span title="${b||'empty'}" style="margin:0 2px">${icon}</span>`;
        }).join("")
      } <b>(${G.player.clip.length}/${G.player.clipMax||4})</b>${G.combat.linedUp ? ' <span style="color:var(--accent)">⚡ Lined Up</span>' : ''}${G.player.fullMoonActive ? ' <span style="color:var(--accent)">🐺 Full Moon</span>' : ''}</span>
      <span class="status-chip" style="font-size:11px;color:var(--dim)">most recently loaded fires first</span>
    </div>` : ""}
    <div class="center" style="margin-bottom:6px">
      <span class="status-chip" style="font-size:12px">🔮 Enchant: <b>${G.player.enchant||0}</b>/5 <span style="color:var(--dim);font-size:10px">(5 stacks = +1 energy, from Magical damage cards)</span></span>
    </div>
    <div class="enemies-row">
      ${c.enemies.map((e,i)=>{
        const targetable = c.pendingCardIdx!=null && e.alive;
        const isVeiled = e.tag==="uncounted_veil" && !e.veilBroken;
        const displayHp = isVeiled ? Math.max(0, e.maxHp*2 - (e.cumulativeDamageTaken||0)) : Math.max(0,e.hp);
        const displayMax = isVeiled ? e.maxHp*2 : e.maxHp;
        return `<div class="enemy ${e.alive?'':'dead'} ${targetable?'targetable':''}"
                 onclick="${targetable? `playCardOnTarget(${i})`:''}">
          <div style="font-weight:bold">${e.name}</div>
          <div class="bar-bg"><div class="bar-fill" style="width:${100*displayHp/displayMax}%"></div></div>
          <div style="font-size:11px">${displayHp} / ${displayMax} HP${isVeiled ? " ❓" : ""} ${e.block>0?`(🛡️${e.block})`:""}</div>
          <div class="statuses">${typeChips(e)}${statusChips(e)}</div>
          <div class="intent">${e.alive? getIntent(e) : "💀 Defeated"}</div>
        </div>`;
      }).join("")}
    </div>
    <div id="playerPanel">
      <div class="hpblock">
        <div>❤️ ${G.player.hp} / ${G.player.maxHp}</div>
        <div style="width:120px" class="bar-bg"><div class="bar-fill player" style="width:${100*G.player.hp/G.player.maxHp}%"></div></div>
        ${G.player.block>0?`<div>🛡️ ${G.player.block}</div>`:""}
      </div>
      <div class="statuses">${statusChips(G.player)}</div>
      <div class="energy-pips">
        ${Array.from({length: Math.max(3, c.energy)}, (_,i)=>`<div class="pip ${i<c.energy?'on':''}"></div>`).join("")}
        <span style="font-size:11px;margin-left:4px">${c.energy} energy</span>
        ${dazeMod?'<span style="color:var(--accent);font-size:11px;margin-left:6px">Rattled (+1 cost)</span>':''}
      </div>
      <button class="btn primary" onclick="endTurn()" ${c.phase!=='player'?'disabled':''}>End Turn</button>
    </div>
    <div class="hand">
      ${G.deck.hand.map((card,i)=>{
        const can = affordable(card) && c.phase==='player';
        const cc = currentCost(card);
        const discounted = cc < card.cost;
        return `<div class="card ${can?'':'unaffordable'}" onclick="${can?`selectCard(${i})`:''}">
          <span class="ccost" style="${discounted?'color:var(--accent);font-weight:bold':''}">${cc}</span>
          <div class="cname tag-${card.dtype||''}">${card.name}${discounted?' ⚡':''}</div>
          <div class="ceffect">${card.desc}</div>
          ${stanceNote(card)}
        </div>`;
      }).join("")}
    </div>
    <div id="log">${G.log.slice(0,8).map(l=>`<div>${l}</div>`).join("")}</div>`;
}

function renderCombatResult(){
  const win = G.combat.win;
  return `
    <div class="end-screen">
      <h2>${win? "Victory!" : "Defeated..."}</h2>
      <div id="log" style="max-width:500px;margin:16px auto">${G.log.slice(0,6).map(l=>`<div>${l}</div>`).join("")}</div>
      ${win ? `<button class="btn primary" onclick="afterCombatContinue()">Continue</button>`
            : `<button class="btn primary" onclick="restart()">Return to Captain Select</button>`}
    </div>`;
}

function renderReward(){
  return `
    <h2 class="center">Choose a card to add to your deck</h2>
    <div class="reward-cards">
      ${G.pendingReward.map((card,i)=>`
        <div class="card" style="width:160px;cursor:pointer" onclick="pickReward(${i})">
          <span class="ccost">${card.cost}</span>
          <div>${rarityBadge(cardRarity(card))}</div>
          <div class="cname tag-${card.dtype||''}">${card.name}</div>
          <div class="ceffect">${card.desc}</div>
        </div>`).join("")}
    </div>
    <div class="center" style="margin-top:16px"><button class="btn" onclick="pickReward(-1)">Skip</button></div>`;
}

function renderRemoval(){
  const counts = {};
  const example = {};
  for (const c of G.deck.all){
    counts[c.name] = (counts[c.name]||0) + 1;
    example[c.name] = c;
  }
  const uniqueNames = Object.keys(counts);
  return `
    <h2 class="center">The Siren claims a card — choose which to remove</h2>
    <div class="reward-cards">
      ${uniqueNames.map(name=>{
        const c = example[name];
        return `<div class="card" style="width:160px;cursor:pointer" onclick="removeCardByName('${name.replace(/'/g,"\\'")}')">
          <span class="ccost">${c.cost}</span>
          <div class="cname tag-${c.dtype||''}">${name} (x${counts[name]})</div>
          <div class="ceffect">${c.desc}</div>
        </div>`;
      }).join("")}
    </div>`;
}
function removeCardByName(name){
  const idx = G.deck.all.findIndex(c=>c.name===name);
  if (idx>=0){
    G.deck.all.splice(idx,1);
    pushLogQuiet(`The Siren claims a copy of ${name}.`);
  }
  G.pendingRemoval = null;
  if (G.pendingRemovalReturnsToShop){
    G.pendingRemovalReturnsToShop = false;
    G.pendingShop = G.savedShopState || rollShopInventory();
    G.savedShopState = null;
    render();
  } else {
    advanceFromCurrentNode();
  }
}

function renderEvent(){
  const ev = G.pendingEvent;
  return `
    <div id="eventBox">
      <h3>❓ Event</h3>
      <p>${ev.text}</p>
      <div class="choices">
        <button class="btn primary" onclick="resolveEvent('A')">${ev.choiceA}</button>
        <button class="btn" onclick="resolveEvent('B')">${ev.choiceB}</button>
        ${ev.choiceC ? `<button class="btn" onclick="resolveEvent('C')">${ev.choiceC}</button>` : ""}
      </div>
    </div>`;
}

function renderEndScreen(){
  return `
    <div class="end-screen">
      <h1>${G.won ? "🏆 You conquered The Tremendous Sea!" : "☠️ Your voyage ends here."}</h1>
      <p style="color:var(--dim)">Playing as ${G.cap.name} — reached Act ${G.act}</p>
      <button class="btn primary" onclick="restart()">Play Again</button>
    </div>`;
}

render();

