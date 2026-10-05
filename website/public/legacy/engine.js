// ============ ENGINE ============
function newStatus(){ return {enflame:0,bleed:0,bleedPendingHits:0,tire:0,daze:0,rattled:0,stun:false,harden:0,corrosion:0,undertow:0,noAttack:false,noHeal:false,noBlock:false,energyDrain:0,muted:0}; }

function makeCombatant(name, hp, opts){
  opts = opts||{};
  return { name, maxHp:hp, hp, block:0, status:newStatus(),
    resist:opts.resist||{}, weak:opts.weak||{}, armored:!!opts.armored,
    tag:opts.tag||null, atk:opts.atk||0, turn:0, alive:true, hitBefore:false, diedEnflamed:false,
    ultimateFired:false, uofUltimateFired:false, enraged:0 };
}

function typeMod(c, dtype){
  let mult = 1;
  if (dtype && c.resist[dtype]) mult *= (1 - c.resist[dtype]);
  if (dtype && c.weak[dtype]) mult *= (1 + c.weak[dtype]);
  return mult;
}

// returns {dealt, blocked}
function takeDamage(c, amount, dtype, ignoresBlock){
  if (typeof G !== "undefined" && G && G.player && c !== G.player && G.player.status && G.player.status.noAttack){
    amount = 0;
  }
  if (c.tag === "returnal_scion" && c.allowedType && dtype !== c.allowedType){
    amount = 0;
  }
  if (c.status.daze > 0){ amount = amount * 2; c.status.daze--; }
  amount = Math.max(0, Math.round(amount * typeMod(c, dtype)));
  let dealt = 0;
  if (ignoresBlock){
    c.hp -= amount; dealt = amount;
  } else {
    if (c.block >= amount){ c.block -= amount; }
    else { let rem = amount - c.block; c.block = 0; c.hp -= rem; dealt = rem; }
  }
  c.hp = Math.max(0, c.hp);
  const Gref2 = (typeof G !== "undefined") ? G : null;
  if (c.tag === "djinnball_jar" && dtype === "Fire" && dealt > 0 && Gref2 && Gref2.player){
    if (Gref2.player.status.energyDrain > 0){
      Gref2.player.status.energyDrain = Math.max(0, Gref2.player.status.energyDrain - 1);
      if (typeof pushLogQuiet === "function") pushLogQuiet(`The Fire cracks the jar — 1 locked energy freed!`);
    }
  }
  if (c.tag === "uncounted_veil" && c !== (Gref2 && Gref2.player) && dealt > 0){
    c.cumulativeDamageTaken = (c.cumulativeDamageTaken||0) + dealt;
    if (!c.veilBroken && c.cumulativeDamageTaken >= c.maxHp*0.3){
      c.veilBroken = true;
      if (typeof pushLogQuiet === "function") pushLogQuiet(`The veil cracks — its true HP is revealed!`);
    }
  }
  if (c.tag === "true_yonk_shadow" && c.phase4Active && Gref2 && Gref2.player && c !== Gref2.player && dealt > 0){
    const mirrored = Math.round(dealt * 0.25);
    if (mirrored > 0 && Gref2.player.alive !== false){
      Gref2.player.hp = Math.max(0, Gref2.player.hp - mirrored);
      if (Gref2.player.hp === 0) Gref2.player.alive = false;
    }
  }
  if (c.hp === 0){
    if (c.tag === "true_yonk_shadow" && !c.trueFormRevealed){
      c.trueFormRevealed = true;
      c.phase4Active = true;
      c.hp = Math.round(c.maxHp * 0.5);
      c.status.harden = 0;
      if (typeof pushLogQuiet === "function"){
        pushLogQuiet(`⚠️ ${c.name} was never truly here. Its true form rises, HP restored!`);
      }
    } else if (c.tag === "double_scoop" && !c.hasSplit){
      c.hasSplit = true;
      c.alive = false;
      const Gref3 = (typeof G !== "undefined") ? G : null;
      if (Gref3 && Gref3.combat && Gref3.combat.enemies){
        const vanilla = makeCombatant("Vanilla", Math.round(c.maxHp*0.4), {tag:"double_scoop_tire", atk:Math.round(c.atk*0.7)});
        const cookieDough = makeCombatant("Cookie Dough", Math.round(c.maxHp*0.4), {tag:"double_scoop_daze", atk:Math.round(c.atk*0.7)});
        Gref3.combat.enemies.push(vanilla, cookieDough);
        if (typeof pushLogQuiet === "function"){
          pushLogQuiet(`💥 ${c.name} splits apart into Vanilla and Cookie Dough!`);
        }
      }
    } else {
      c.alive = false;
    }
  }
  return dealt;
}

function gainBlock(c, amt){
  if (typeof G !== "undefined" && G && G.player && c === G.player && typeof hasRelicHook === "function" && hasRelicHook("bottomlessCandyBag")) return;
  if (typeof G !== "undefined" && G && G.player && c === G.player && G.player.status.noBlock) return;
  if (typeof G !== "undefined" && G && G.player && c === G.player && amt > 0 && G.combat){ G.combat.blockedThisTurn = true; }
  c.block += amt;
}

function applyEnflame(c, n){ c.status.enflame += n; }
function applyBleed(c, n){ c.status.bleed += n; }
function applyTire(c, duration){ c.status.tire = Math.max(c.status.tire, duration || 2); }
function applyMuted(c, n){ c.status.muted = (c.status.muted||0) + (n||2); }
function applyDaze(c, n){ c.status.daze = (c.status.daze||0) + (n||1); }
function applyRattled(c, n){
  let amt = n||2;
  if (typeof G !== "undefined" && G && G.player && c === G.player && typeof hasRelicHook === "function" && hasRelicHook("firstDebuffReduced") && !G.combat.usedFirstDebuffReduction){
    amt = Math.max(0, amt - 1);
    G.combat.usedFirstDebuffReduction = true;
  }
  c.status.rattled = (c.status.rattled||0) + amt;
}
function applyHarden(c, n, cap){ c.status.harden += n; if(cap!=null) c.status.harden = Math.min(c.status.harden, cap); }

// call at start of this combatant's own turn
function startOfTurnTicks(c, log){
  let dmg = 0;
  const isEnemyTarget = !(typeof G !== "undefined" && G && G.player && c === G.player);
  const tickBonusMult = (isEnemyTarget && typeof hasRelicHook === "function" && hasRelicHook("tickDamageBonus")) ? (1 + relicVal("tickDamageBonus")) : 1;
  if (c.status.enflame > 0){ dmg += Math.floor((c.status.enflame / 2) * tickBonusMult); c.status.enflame = Math.max(0, c.status.enflame - 1); }
  if (c.status.bleed > 0){ dmg += Math.round(1 * tickBonusMult); c.status.bleed = Math.max(0, c.status.bleed - 1); }
  if (c.status.corrosion > 0){ dmg += c.status.corrosion; c.status.corrosion = Math.max(0, c.status.corrosion - 1); }
  if (c.status.undertow > 0){ dmg += 1; }
  if (dmg > 0){ c.hp -= dmg; if(c.hp<=0){c.hp=0; c.alive=false;} if(log) log(`${c.name} takes ${dmg} from lingering effects.`); }
  if (c.status.tire > 0) c.status.tire--;
  if (c.status.daze > 0) c.status.daze = Math.max(0, c.status.daze - 1);
  if (c.status.rattled > 0) c.status.rattled--;
  if (c.status.muted > 0) c.status.muted--;
}

// call after an attack lands HP damage on target; returns bonus dmg from cash-in
function tryCashInBleed(t, hpDamageDealt){
  if (hpDamageDealt <= 0 || t.status.bleed <= 0) return 0;
  if (t.armored){
    t.bleedPendingHits = (t.bleedPendingHits||0) + 1;
    if (t.bleedPendingHits >= 2){
      const bonus = t.status.bleed; t.status.bleed = 0; t.bleedPendingHits = 0; return bonus;
    }
    return 0;
  } else {
    const bonus = t.status.bleed; t.status.bleed = 0; return bonus;
  }
}

function outgoingMultiplier(c){ return c.status.tire > 0 ? 0.5 : 1.0; }

// ============ ENEMY AI TURN ============
// returns a log line
function enemyTurn(e, player, allEnemies, immovableCharge, captainName, log, hasChipReduction, incomingDmgMult){
  if (e.status.stun){ e.status.stun = false; log(`${e.name} is stunned and skips its turn.`); return; }
  e.turn++;
  let dmg = e.atk + e.status.harden;
  if (e.openingTurnHalved && e.turn===1){ dmg = Math.round(dmg*0.5); e.openingTurnHalved = false; }
  let noDamage = false;
  const tag = e.tag;

  if (tag==="harden_grow"){
    applyHarden(e,1);
    if (e.hp <= e.maxHp*0.5){ dmg += 3; }
  }
  if (tag==="tire_alt"){ if(e.turn%2===0){ applyTire(player); noDamage=true; log(`${e.name} applies Tire.`);} }
  if (tag==="daze_open" && e.turn===1){ applyRattled(player); noDamage=true; log(`${e.name} applies Rattled.`); }
  if (tag==="corrosion"){
    const cyc = e.turn % 3;
    if (cyc===1){ player.status.corrosion += 3; noDamage=true; log(`${e.name} applies 3 Corrosion.`); }
    else if (cyc===2){ dmg = e.atk; }
    else { dmg = e.atk + 8; }
    if (e.hp <= e.maxHp*0.5 && !noDamage){ dmg += 3; }
  }
  if (tag==="undertow_open" && e.turn===1){ player.status.undertow = 1; }
  if (tag==="undertow_open" && e.turn%3===0){
    applyTire(player);
    if (e.hp <= e.maxHp*0.5){ dmg += 3; log(`${e.name} strikes harder, weakened but desperate.`); }
  }
  if (tag==="shield25_corrosion"){
    if (e.turn%3===0) player.status.corrosion += 2;
    if (e.block<=0){
      if (e.turn%2===0){ dmg = e.atk + 4; log(`${e.name} lashes out post-break.`); }
      if (e.hp <= e.maxHp*0.3){ player.status.corrosion += 1; }
    }
  }
  if (tag==="pair"){
    const othersAlive = allEnemies.filter(x=>x!==e && x.alive).length;
    if (othersAlive>0) dmg += 2;
  }
  if (tag==="shield25"){
    if (e.block <= 0){
      if (e.turn % 2 === 1){ dmg = 16; }
      else { dmg = 8; applyTire(player); log(`${e.name} scatters Shell Fragments.`); }
      if (e.hp <= e.maxHp*0.3){ gainBlock(e, 3); log(`${e.name} regrows makeshift armor.`); }
    }
  }
  if (tag==="tire_atk_daze"){
    const cyc = e.turn % 3;
    if (cyc===1){ applyTire(player); noDamage=true; log(`${e.name} applies Tire.`); }
    else if (cyc===2){ dmg = e.atk; if (e.hp<=e.maxHp*0.5){ applyTire(player); } }
    else { applyRattled(player); noDamage=true; log(`${e.name} applies Rattled.`); }
  }
  if (tag==="trio_harden"){
    const siblings = allEnemies.filter(x=>x.tag==="trio_harden" && x.alive);
    if (siblings.length===1){ dmg = e.atk + 8; log(`${e.name} sings a mournful Solo Dirge.`); }
  }
  if (tag==="duo_block_share"){
    const siblings = allEnemies.filter(x=>x.tag==="duo_block_share" && x.alive);
    if (siblings.length===1){
      e.soloTurns = (e.soloTurns||0) + 1;
      dmg = e.atk + 2*e.soloTurns;
    }
  }
  if (tag==="duo_harden_share"){
    const siblings = allEnemies.filter(x=>x.tag==="duo_harden_share" && x.alive);
    if (siblings.length===1){ dmg = e.atk + 6; }
  }
  if (tag==="twins"){
    if (e.hp <= e.maxHp*0.3 && !e.ultimateFired){
      dmg = 24; e.ultimateFired = true;
      log(`${e.name} erupts in Twin Fury!`);
    } else {
      const twinSiblings = allEnemies.filter(x=>x.tag==="twins");
      const myIndex = twinSiblings.indexOf(e);
      const isBlockPhase = (e.turn + myIndex) % 2 === 0;
      if (isBlockPhase){
        const blockGain = 6;
        e.block += blockGain;
        noDamage = true;
        log(`${e.name} braces, gaining ${blockGain} Block.`);
      }
    }
  }
  if (tag==="rising_tide_boss"){
    if (e.hp <= e.maxHp*0.5){
      if (!e.ultimateFired){
        dmg = e.status.harden * 3;
        e.status.harden = 0;
        e.ultimateFired = true;
        log(`${e.name} unleashes Captain's Last Stand!`);
      } else if (e.turn%2===1){ dmg = 20 + e.status.harden; }
      else { dmg = e.status.harden; e.status.harden = 0; log(`${e.name} unleashes The Toll!`); }
    } else {
      if (e.turn%2===1){ dmg = 20; }
      else { applyHarden(e,2); noDamage=true; log(`${e.name} channels Rising Tide.`); }
    }
  }
  if (tag==="trio_lowest_first"){
    const siblings = allEnemies.filter(x=>x.tag==="trio_lowest_first" && x.alive);
    const lowest = siblings.reduce((a,b)=> b.hp<a.hp?b:a, siblings[0]);
    if (e !== lowest){ return; }
    if (siblings.length===1 && !e.ultimateFired){
      dmg = 20; e.ultimateFired = true;
      log(`${e.name} sings a haunting Solo Aria!`);
    } else if (e.turn % 3 === 0){
      e.block += 12;
      noDamage = true;
      log(`${e.name} weaves a defensive round, gaining 12 Block.`);
    } else {
      if (siblings.length>=2) applyHarden(e,2);
      dmg = e.atk + e.status.harden;
    }
  }
  if (tag==="aflam"){
    let move;
    if (e.turn % 5 === 0) move = "fortify";
    else move = (e.turn % 2 === 1) ? "magma" : "corrode";
    if (move === "magma"){ dmg = 18; if(captainName!=="Branch") applyEnflame(player,3); }
    else if (move === "corrode"){
      noDamage = true;
      if (captainName==="Branch"){ player.status.corrosion += 3; log(`${e.name}'s Corrode the Flame scorches you.`);}
      else { applyEnflame(player,3); log(`${e.name}'s Corrode the Flame ignites you.`); }
    } else { applyHarden(e,2); applyRattled(player); noDamage=true; log(`${e.name} issues Fortify Orders.`); }
    if (e.hp <= e.maxHp*0.3 && e.turn%4===0){ dmg = e.status.harden*2; e.status.harden=0; log(`${e.name} unleashes Full Broadside!`); }
    if (e.hp <= e.maxHp*0.3){ player.status.undertow = 1; }
  }
  if (tag==="concept_of_sweet"){
    dmg = e.atk;
    player.status.noAttack = false; player.status.noHeal = false; player.status.noBlock = false;
    const cyclePos = e.turn % 3;
    if (cyclePos === 1){ player.status.noAttack = true; log(`${e.name} silences your ability to Attack — your next turn's attacks deal no damage!`); }
    else if (cyclePos === 2){ player.status.noHeal = true; log(`${e.name} silences your ability to Heal — no healing takes effect next turn!`); }
    else { player.status.noBlock = true; log(`${e.name} silences your ability to Block — no Block can be gained next turn!`); }
  }
  if (tag==="yellow_yonka"){
    dmg = e.atk;
    if (e.turn % 3 === 0){
      const Gref = (typeof G !== "undefined") ? G : null;
      if (Gref && Gref.deck && Gref.deck.hand.length > 0){
        Gref.deck.hand = shuffle(Gref.deck.hand);
        const idx = Math.floor(Math.random()*Gref.deck.hand.length);
        Gref.deck.hand[idx] = {id:"cursedcandy", name:"Cursed Candy", cost:1, cursedCandy:true, dmg:0, desc:"A wrapper with nothing sweet inside. Deals 5 damage to yourself when played."};
        log(`${e.name} scrambles your hand and slips a cursed candy in among your cards!`);
      }
    }
  }
  if (tag==="hours_that_pass"){
    if (e.turn % 4 === 0){
      dmg = e.atk * 2;
      log(`${e.name} acts twice in the same breath!`);
    } else {
      dmg = e.atk;
      player.status.energyDrain = (player.status.energyDrain||0) + 2;
      log(`${e.name} steals your momentum — your next turn opens with 2 less energy!`);
    }
  }
  if (tag==="true_yonk_shadow"){
    const Gref = (typeof G !== "undefined") ? G : null;
    if (e.phase4Active){
      // True form: Mirrored Hunger (reflection handled centrally in takeDamage) + Consuming
      dmg = e.atk + 4;
      if (e.turn % 3 === 0){
        if (Gref && Gref.player){
          Gref.player.maxHp = Math.max(1, Gref.player.maxHp - 4);
          Gref.player.hp = Math.min(Gref.player.hp, Gref.player.maxHp);
          if (typeof isRiley === "function" && isRiley() && Gref.player.baseMaxHp!==undefined){
            Gref.player.baseMaxHp = Math.max(1, Gref.player.baseMaxHp - 4);
          }
          log(`${e.name} devours a piece of you permanently — max HP -4!`);
        }
      } else {
        log(`${e.name}, in its true form, strikes without pattern or mercy.`);
      }
    } else if (e.hp > e.maxHp*0.66){
      if (e.turn % 2 === 0){
        applyHarden(e, 4);
        noDamage = true;
        log(`${e.name} remembers an old trick, building Harden.`);
      } else {
        dmg = e.atk + Math.floor(e.status.harden/2);
      }
    } else if (e.hp > e.maxHp*0.33){
      dmg = e.atk;
      if (Gref){
        const stolen = Math.min(Gref.rubees, 20);
        Gref.rubees -= stolen;
        e.hoardValue = (e.hoardValue||0) + stolen;
        log(`${e.name} remembers another trick, stealing ${stolen} Rubees.`);
      }
    } else {
      if (!e.finalFormFired){
        e.finalFormFired = true;
        dmg = Math.min(80, (e.hoardValue||0) + (e.status.harden||0)*2);
        log(`${e.name} remembers everything it has ever fought, and becomes it all at once!`);
      } else {
        dmg = e.atk * 2;
        const cyclePos = e.turn % 3;
        if (cyclePos === 1) player.status.noAttack = true;
        else if (cyclePos === 2) player.status.noHeal = true;
        else player.status.noBlock = true;
        log(`${e.name} denies you everything, all at once.`);
      }
    }
  }
  if (tag==="muted_source"){
    dmg = e.atk;
    applyMuted(player, 2);
    log(`${e.name} plants a smiling silence on you — Muted.`);
  }
  if (tag==="uncounted_veil"){
    dmg = e.atk;
    const Gref = (typeof G !== "undefined") ? G : null;
    if (Gref && !e.veilBroken){
      e.cumulativeDamageTaken = e.cumulativeDamageTaken || 0;
    }
  }
  if (tag==="wax_sealed_choir"){
    const siblings = allEnemies.filter(x=>x.tag==="wax_sealed_choir" && x.alive);
    dmg = e.atk;
    let copiedAny = false;
    for (const s of siblings){
      for (const key of ["enflame","bleed","tire","daze","rattled","corrosion"]){
        if (s.status[key] > 0 && !copiedAny){
          const amt = Math.ceil(s.status[key] * 1.5);
          if (key==="tire") applyTire(player, amt);
          else if (key==="daze") applyDaze(player, amt);
          else if (key==="rattled") applyRattled(player, amt);
          else player.status[key] = (player.status[key]||0) + amt;
          log(`${e.name} reflects an amplified ${key} back at you!`);
          copiedAny = true;
        }
      }
    }
  }
  if (tag==="unbounded_truth"){
    const Gref = (typeof G !== "undefined") ? G : null;
    const blockedOrHealedLastTurn = Gref && Gref.combat && Gref.combat.playerBlockedOrHealedLastTurn;
    if (blockedOrHealedLastTurn){
      e.atk = Math.round(e.atk * 1.5);
      log(`${e.name} grows explosively — your caution feeds it!`);
    } else {
      e.atk += 2;
    }
    dmg = e.atk;
  }
  if (tag==="returnal_scion"){
    const cyclePos = Math.floor((e.turn-1)/3) % 4;
    const types = ["Magical","Blunt","Slashing","Fire"];
    e.allowedType = types[cyclePos];
    dmg = e.atk;
  }
  if (tag==="djinnball_jar"){
    dmg = e.atk;
    const Gref = (typeof G !== "undefined") ? G : null;
    if (Gref){
      Gref.player.status.energyDrain = (Gref.player.status.energyDrain||0) + 1;
      log(`${e.name} locks away 1 of your energy — deal Fire damage to unlock it.`);
    }
  }
  if (tag==="double_scoop"){
    dmg = e.atk;
    applyTire(player, 2);
    applyDaze(player, 1);
    log(`${e.name} chills and rattles you at once.`);
  }
  if (tag==="double_scoop_tire"){
    dmg = e.atk;
    applyTire(player, 2);
    log(`${e.name} chills you.`);
  }
  if (tag==="double_scoop_daze"){
    dmg = e.atk;
    applyDaze(player, 1);
    log(`${e.name} rattles you.`);
  }
  if (tag==="appetite_concept"){
    dmg = e.atk;
    const Gref = (typeof G !== "undefined") ? G : null;
    if (Gref && Gref.deck && Gref.deck.discard.length > 0){
      const idx = Math.floor(Math.random()*Gref.deck.discard.length);
      const eaten = Gref.deck.discard.splice(idx,1)[0];
      Gref.deck.all = Gref.deck.all.filter(c => c !== eaten);
      log(`${e.name} devours ${eaten.name} from your discard — gone for the rest of this combat.`);
    }
  }
  if (tag==="king_in_green"){
    const Gref = (typeof G !== "undefined") ? G : null;
    if (e.hp > e.maxHp*0.66){
      // Phase 1: periodic Rubee theft
      if (e.turn % 3 === 0 && Gref){
        const stolen = Math.min(Gref.rubees, 15 + Math.floor(Math.random()*10));
        Gref.rubees -= stolen;
        e.hoardValue = (e.hoardValue||0) + stolen;
        noDamage = true;
        log(`${e.name} pilfers ${stolen} Rubees from your purse!`);
      } else {
        dmg = e.atk;
      }
    } else if (e.hp > e.maxHp*0.33){
      // Phase 2: converts your current Block into his own Harden on hit
      dmg = e.atk;
      const blockStolen = Math.floor(player.block * 0.5);
      if (blockStolen > 0){
        applyHarden(e, blockStolen);
        e.hoardValue = (e.hoardValue||0) + blockStolen;
        log(`${e.name} siphons ${blockStolen} Block into his own Harden!`);
      }
    } else {
      // Phase 3 (enrage): The Hoarder's Wrath transition ultimate, then occasional card seizure
      if (!e.hoarderWrathFired){
        e.hoarderWrathFired = true;
        dmg = Math.min(70, (e.hoardValue||0) * 2);
        log(`${e.name} unleashes The Hoarder's Wrath, converting every stolen thing into raw power!`);
      } else if (Math.random() < 0.4 && Gref && Gref.deck && Gref.deck.hand.length>0){
        dmg = e.atk;
        const idx = Math.floor(Math.random()*Gref.deck.hand.length);
        const seized = Gref.deck.hand.splice(idx,1)[0];
        Gref.seizedCard = seized;
        Gref.seizedCardReturnTurn = (Gref.combat ? Gref.combat.turn : 0) + 1;
        log(`${e.name} seizes ${seized.name} from your hand!`);
      } else {
        dmg = e.atk;
      }
    }
  }
  if (tag==="tentacle"){
    if (e.hp <= e.maxHp*0.4 && !e.ultimateFired){
      dmg = 40; e.ultimateFired = true;
      log(`${e.name} exerts a Crushing Grip!`);
    } else if (e.turn%2===0){
      player.status.corrosion += 2; noDamage = true;
      e.block += 20;
      log(`${e.name} vanishes beneath the waves, its armored hide closing tight (Grasping Tendrils, +20 Block).`);
      if (e.hp <= e.maxHp*0.4) player.status.undertow = 1;
    } else { dmg = e.hp > e.maxHp*0.4 ? e.atk : 26; }
  }
  if (tag==="flying"){
    const capTurns = e.maxHp >= 45 ? 3 : 2;
    if (e.turn > capTurns){
      applyHarden(e,1);
      if (e.hp <= e.maxHp*0.5){ dmg = e.atk + 4; log(`${e.name} Dive Bombs!`); }
    }
  }
  if (tag==="burst_buff"){
    if (e.turn%3===0){
      applyHarden(e,3); noDamage=true;
      log(`${e.name} channels Building Fury.`);
      if (e.hp <= e.maxHp*0.5){ applyRattled(player); }
    } else { dmg = e.atk + e.status.harden; e.status.harden = 0; }
  }
  if (tag==="bleed_applier_rage" && e.hp <= e.maxHp*0.5){ dmg += 3; }

  if (tag==="uof"){
    const siblings = allEnemies.filter(x=>x.tag==="uof" && x.alive);
    const alreadyFired = siblings.some(s=>s.uofUltimateFired);
    const anyCritical = siblings.some(s=>s.hp>0 && s.hp<=s.maxHp*0.2);
    if (anyCritical && !alreadyFired){
      dmg = 18; e.uofUltimateFired = true;
      log(`${e.name} calls The Lecture!`);
    } else {
      const usesJudgment = e.uofNextIsJudgment;
      if (usesJudgment){
        noDamage = true;
        for (const s of siblings){ if (s!==e) applyHarden(s, 1, 8); }
        log(`${e.name} calls Judgment — its schoolmates grow Hardened.`);
      } else {
        dmg = e.atk + e.status.harden;
        if (e.enraged > 0){ dmg *= 2; }
      }
    }
  }

  if (noDamage) {
    if (e.enraged > 0) e.enraged--;
    return;
  }
  if (e.status.tire > 0){ dmg = Math.round(dmg * 0.5); }
  if (immovableCharge.on){ immovableCharge.on = false; log(`${player.name} negates the attack with Immovable!`); if (e.enraged > 0) e.enraged--; return; }
  if (incomingDmgMult && incomingDmgMult !== 1){ dmg = Math.round(dmg * incomingDmgMult); }
  const dealt = takeDamage(player, dmg, null, false);
  if (hasChipReduction && dealt > 0 && dealt <= 3 && player.hp > 0){
    const refund = dealt - 1;
    player.hp = Math.min(player.maxHp, player.hp + refund);
    log(`Whale Tooth Charm reduces the chip damage to 1.`);
  }
  log(`${e.name} attacks for ${dmg} damage${dealt<dmg?" (partially blocked)":""}.`);
  if (tag==="twins" && dealt > 0){
    const blockGained = Math.round(dealt * 0.3);
    e.block += blockGained;
    log(`${e.name} converts part of the unblocked blow into ${blockGained} Block.`);
  }
  if ((tag==="bleed_applier" || tag==="bleed_applier_rage") && dealt > 0){
    applyBleed(player, 2);
    log(`${e.name}'s strike leaves you Bleeding.`);
  }
  if (e.enraged > 0) e.enraged--;
}
