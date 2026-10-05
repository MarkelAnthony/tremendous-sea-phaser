// ============================================================
// PHASER RENDERING LAYER
// This file is the ONLY place that knows about Phaser. Every rule,
// every card, every enemy AI pattern lives untouched in data.js /
// engine.js / ui.js exactly as built all session. We reuse ui.js's
// full orchestration (playCard, endTurn, resolveEnemyPhase, shop
// logic, event logic, Gear hooks — all of it) by simply REDEFINING
// what render() does: instead of writing HTML, it now syncs a
// Phaser scene and plays animations for whatever changed.
// ============================================================

const PALETTE = {
  bg: 0x0b1420, panel: 0x16283a, accent: 0xe8a33d,
  hp: 0x6fbf6f, enemyHp: 0xd9534f, block: 0x7ea6c9, text: 0xeef3f7, dim: 0x93a6b8,
  captain: { Branch: 0xd9534f, Riley: 0x7ea6c9, Broderick: 0xc9962c },
};

function stripTags(html){
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function rarityBadgeChar(rarity){
  return {Common:"C", Uncommon:"U", Rare:"R", Djinn:"★"}[rarity] || "C";
}
function rarityColor(rarity){
  return {Common:"#9a9a9a", Uncommon:"#3b9bd6", Rare:"#c9962c", Djinn:"#b83bd6"}[rarity] || "#9a9a9a";
}
const STATUS_COLORS = {
  enflame:"#ff8c42", bleed:"#e5484d", tire:"#9b8cff", daze:"#f4d35e", rattled:"#f4d35e",
  muted:"#8fa3b3", harden:"#7ea6c9", corrosion:"#6bbf6b", undertow:"#4fb3d9",
  noAttack:"#ff6b6b", noHeal:"#ff6b6b", noBlock:"#ff6b6b", energyDrain:"#e8a33d", armored:"#7ea6c9",
};
function statusChipList(c){
  const s = c.status; const chips = [];
  if (s.enflame) chips.push(["🔥"+s.enflame, STATUS_COLORS.enflame]);
  if (s.bleed) chips.push(["🩸"+s.bleed, STATUS_COLORS.bleed]);
  if (s.tire) chips.push(["🌀Tire", STATUS_COLORS.tire]);
  if (s.daze) chips.push(["⚡Daze x"+s.daze, STATUS_COLORS.daze]);
  if (s.rattled) chips.push(["😵Rattled", STATUS_COLORS.rattled]);
  if (s.muted) chips.push(["🔇Muted x"+s.muted, STATUS_COLORS.muted]);
  if (s.harden) chips.push(["📈"+s.harden, STATUS_COLORS.harden]);
  if (s.corrosion) chips.push(["☠️"+s.corrosion, STATUS_COLORS.corrosion]);
  if (s.undertow) chips.push(["🌊Undertow", STATUS_COLORS.undertow]);
  if (s.noAttack) chips.push(["🚫⚔️", STATUS_COLORS.noAttack]);
  if (s.noHeal) chips.push(["🚫❤️", STATUS_COLORS.noHeal]);
  if (s.noBlock) chips.push(["🚫🛡️", STATUS_COLORS.noBlock]);
  if (s.energyDrain) chips.push(["🌀-"+s.energyDrain+"⚡next", STATUS_COLORS.energyDrain]);
  if (c.armored) chips.push(["🛡️Armored", STATUS_COLORS.armored]);
  return chips;
}

class MainScene extends Phaser.Scene {
  constructor(){ super("MainScene"); }

  preload(){ window.preloadSeaCaptain(this); }

  makeBar(x, y, w, h, pct, fillColor, bgColor){
    bgColor = bgColor !== undefined ? bgColor : 0x1a2733;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, bgColor).setStrokeStyle(1, 0x334455);
    const fillW = Math.max(0, Math.min(1, pct)) * w;
    const fill = this.add.rectangle(-w/2 + fillW/2, 0, fillW, h, fillColor);
    container.add([bg, fill]);
    container.barW = w; container.barFill = fill;
    return container;
  }

  updateBar(barContainer, pct, fillColor){
    const w = barContainer.barW;
    const fillW = Math.max(0, Math.min(1, pct)) * w;
    barContainer.barFill.width = fillW;
    barContainer.barFill.x = -w/2 + fillW/2;
    if (fillColor !== undefined) barContainer.barFill.setFillStyle(fillColor);
  }

  // lays out small colored status badges in a wrapping row, centered under x/y, returns total height used
  layoutStatusChips(container, chips, centerX, startY, maxWidth){
    let cx = centerX - maxWidth/2, cy = startY, rowH = 16;
    for (const [label, color] of chips){
      const t = this.add.text(0, 0, label, {fontFamily:"sans-serif", fontSize:11, fontStyle:"bold", color}).setOrigin(0, 0);
      const w = t.width + 10;
      if (cx + w > centerX + maxWidth/2){ cx = centerX - maxWidth/2; cy += rowH; }
      t.setPosition(cx, cy);
      container.add(t);
      cx += w;
    }
    return cy + rowH - startY;
  }

  create(){
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    this.uiRoot = this.add.container(0, 0);
    this.enemySprites = {}; // id-keyed, so we can diff/reuse across renders
    this.prevSnapshot = null;

    // Redefine the global render() — everything else in ui.js is untouched.
    const scene = this;
    render = function(){
      try {
        if (G && !G.over) saveGame();
        if (G && G.over) clearSave();
        if (!G || !G.combat || G.combat.over) scene.combatBuilt = false;
        scene.syncFromState();
      } catch(err){
        scene.showFatalError(err);
      }
    };

    render();
    window.gameReady = true;
  }

  showFatalError(err){
    this.clearRoot();
    this.uiRoot.add(this.add.text(500, 200, "⚠️ Something went wrong", {fontFamily:"sans-serif", fontSize:22, color:"#ff6b6b"}).setOrigin(0.5));
    this.uiRoot.add(this.add.text(500, 250, String(err && err.message || err), {fontFamily:"sans-serif", fontSize:13, color:"#eef3f7", wordWrap:{width:700}, align:"center"}).setOrigin(0.5, 0));
    console.error(err);
  }

  clearRoot(){
    this.uiRoot.removeAll(true);
    this.enemySprites = {};
  }

  // ---- top-level dispatch, mirrors the old renderX() functions in ui.js ----
  syncFromState(){
    if (!G){ this.drawCaptainSelect(); return; }
    if (G.over){ this.drawEndScreen(); return; }
    if (G.pendingRestartConfirm){ this.drawRestartConfirmScreen(); return; }
    if (G.pendingCrewMoment){ this.drawTextScreen("A Memory Surfaces", G.pendingCrewMoment.text, [{label:"Continue", onClick:()=>continueCrewMoment()}]); return; }
    if (G.pendingEvent){ this.drawEventScreen(); return; }
    if (G.pendingShop){ this.drawShopScreen(); return; }
    if (G.pendingRelicChoice){ this.drawRelicScreen(); return; }
    if (G.pendingRemoval){ this.drawRemovalScreen(); return; }
    if (G.pendingReward){ this.drawRewardScreen(); return; }
    if (G.combat && !G.combat.over){ this.drawCombat(); return; }
    if (G.combat && G.combat.over){ this.drawCombatResult(); return; }
    this.drawMapScreen();
  }

  drawRestartConfirmScreen(){
    this.drawTextScreen("⚠️ Abandon this run?", "All progress — deck, Gear, Rubees, and map position — will be lost.", [
      {label:"Cancel", onClick:()=>cancelRestart()},
      {label:"Yes, Abandon Run", onClick:()=>restart()},
    ]);
  }

  drawRemovalScreen(){
    this.clearRoot();
    this.addTitle("The Siren claims a card — choose which to remove");
    const counts = {};
    const example = {};
    for (const c of G.deck.all){ counts[c.name] = (counts[c.name]||0)+1; example[c.name] = c; }
    const uniqueNames = Object.keys(counts);
    uniqueNames.forEach((name, i)=>{
      this.uiRoot.add(this.makeButton(400, 140 + i*46, 500, 40, `${name} (x${counts[name]})`, PALETTE.panel, ()=>removeCardByName(name)));
    });
  }

  drawCombatResult(){
    this.combatBuilt = false; // force a fresh skeleton next time combat starts
    const win = G.combat.win;
    this.clearRoot();
    this.addTitle(win ? "🏆 Victory!" : "💀 Defeated...");
    this.uiRoot.add(this.add.text(400, 110, G.log.slice(0,6).join("\n"), {fontFamily:"sans-serif", fontSize:13, color:"#93a6b8", align:"center", wordWrap:{width:600}}).setOrigin(0.5, 0));
    if (win){
      this.uiRoot.add(this.makeButton(400, 340, 220, 50, "Continue", PALETTE.accent, ()=>afterCombatContinue()));
    } else {
      this.uiRoot.add(this.makeButton(400, 340, 260, 50, "Return to Captain Select", PALETTE.accent, ()=>restart()));
    }
  }

  // ---- simple functional screens (not this pass's animation priority) ----
  drawCaptainSelect(){
    this.clearRoot();
    this.addTitle("The Tremendous Sea");
    Object.keys(CAPTAINS).forEach((key, i)=>{
      const cap = CAPTAINS[key];
      const x = 150 + i*250;
      const container = this.add.container(x, 260);
      const bg = this.add.rectangle(0, 0, 220, 300, PALETTE.panel, 0.9).setStrokeStyle(3, PALETTE.captain[key]);
      const name = this.add.text(0, -120, cap.name, {fontFamily:"sans-serif", fontSize:20, fontStyle:"bold", color: "#" + PALETTE.captain[key].toString(16).padStart(6,"0")}).setOrigin(0.5);
      const candy = this.add.text(0, -90, cap.candy, {fontFamily:"sans-serif", fontSize:12, color:"#93a6b8"}).setOrigin(0.5);
      const hp = this.add.text(0, -55, `Max HP: ${cap.maxHp}`, {fontFamily:"sans-serif", fontSize:14, color:"#eef3f7"}).setOrigin(0.5);
      const trait = this.add.text(0, 0, cap.trait, {fontFamily:"sans-serif", fontSize:12, color:"#93a6b8", wordWrap:{width:190}, align:"center"}).setOrigin(0.5, 0.5);
      bg.setInteractive();
      bg.on("pointerover", ()=>bg.setStrokeStyle(4, PALETTE.accent));
      bg.on("pointerout", ()=>bg.setStrokeStyle(3, PALETTE.captain[key]));
      bg.on("pointerdown", ()=>startGame(key));
      container.add([bg, name, candy, hp, trait]);
      this.uiRoot.add(container);
    });
    if (hasSavedGame()){
      this.uiRoot.add(this.makeButton(400, 470, 280, 46, "▶ Continue Voyage in Progress", PALETTE.accent, ()=>resumeGame()));
    }
  }

  drawTextScreen(title, body, buttons){
    this.clearRoot();
    this.addTitle(title);
    this.uiRoot.add(this.add.text(400, 220, body, {fontFamily:"sans-serif", fontSize:16, color:"#eef3f7", wordWrap:{width:700}, align:"center"}).setOrigin(0.5));
    buttons.forEach((b,i)=>{
      this.uiRoot.add(this.makeButton(400, 400 + i*60, 300, 50, b.label, PALETTE.accent, b.onClick));
    });
  }

  drawEventScreen(){
    const ev = G.pendingEvent;
    const buttons = [{label:ev.choiceA, onClick:()=>resolveEvent("A")}, {label:ev.choiceB, onClick:()=>resolveEvent("B")}];
    if (ev.choiceC) buttons.push({label:ev.choiceC, onClick:()=>resolveEvent("C")});
    this.drawTextScreen("❓ Event", ev.text, buttons);
  }

  makeCardPanel(x, y, w, h, name, desc, rarity, priceLabel, onClick){
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, PALETTE.panel, 0.95).setStrokeStyle(2, rarity ? rarityColor(rarity) : PALETTE.accent);
    const parts = [bg];
    let cursorY = -h/2 + 14;
    if (rarity){
      const rarityText = this.add.text(0, cursorY, rarity.toUpperCase(), {fontFamily:"sans-serif", fontSize:10, fontStyle:"bold", color:rarityColor(rarity)}).setOrigin(0.5);
      parts.push(rarityText);
      cursorY += 18;
    }
    const nameText = this.add.text(0, cursorY, name, {fontFamily:"sans-serif", fontSize:13, fontStyle:"bold", color:"#eef3f7", wordWrap:{width:w-16}, align:"center"}).setOrigin(0.5, 0);
    parts.push(nameText);
    cursorY += nameText.height + 8;
    const descLen = (desc || "").length;
    const descFontSize = descLen > 100 ? 11 : 12;
    const descText = this.add.text(0, cursorY, desc || "", {fontFamily:"sans-serif", fontSize:descFontSize, color:"#93a6b8", wordWrap:{width:w-16}, align:"center"}).setOrigin(0.5, 0);
    parts.push(descText);
    if (priceLabel){
      const priceText = this.add.text(0, h/2-18, priceLabel, {fontFamily:"sans-serif", fontSize:12, fontStyle:"bold", color:"#e8a33d"}).setOrigin(0.5);
      parts.push(priceText);
    }
    container.add(parts);
    if (onClick){
      bg.setInteractive();
      bg.on("pointerover", ()=>{ bg.setStrokeStyle(3, PALETTE.accent); container.setScale(1.03); });
      bg.on("pointerout", ()=>{ bg.setStrokeStyle(2, rarity ? rarityColor(rarity) : PALETTE.accent); container.setScale(1); });
      bg.on("pointerdown", onClick);
    } else {
      container.setAlpha(0.5);
    }
    return container;
  }

  drawShopScreen(){
    this.clearRoot();
    this.addTitle("🏪 F&J Emporium");
    this.uiRoot.add(this.add.text(500, 60, `❤️ ${G.player.hp}/${G.player.maxHp}   💰 ${G.rubees}`, {fontFamily:"sans-serif", fontSize:16, color:"#e8a33d"}).setOrigin(0.5));

    const cardW = 180, cardH = 220, gap = 16;
    const cols = 5;
    const gridStartX = 500 - (cols*cardW + (cols-1)*gap)/2 + cardW/2;

    this.uiRoot.add(this.add.text(gridStartX - cardW/2, 100, "Cards", {fontFamily:"sans-serif", fontSize:13, color:"#93a6b8"}).setOrigin(0,0));
    let row = 0;
    G.pendingShop.cards.forEach((c,i)=>{
      const x = gridStartX + (i % cols)*(cardW+gap);
      const y = 130 + Math.floor(i/cols)*(cardH+16) + cardH/2;
      const canAfford = G.rubees >= c.shopPrice;
      this.uiRoot.add(this.makeCardPanel(x, y, cardW, cardH, c.name, c.desc, cardRarity(c), `${c.shopPrice}g`, canAfford ? ()=>buyShopCard(i) : null));
    });
    const cardRows = Math.ceil(G.pendingShop.cards.length / cols) || 1;
    const gearY = 130 + cardRows*(cardH+16) + 30;

    this.uiRoot.add(this.add.text(gridStartX - cardW/2, gearY - 22, "Gear", {fontFamily:"sans-serif", fontSize:13, color:"#93a6b8"}).setOrigin(0,0));
    G.pendingShop.gear.forEach((r,i)=>{
      const x = gridStartX + (i % cols)*(cardW+gap);
      const y = gearY + Math.floor(i/cols)*(cardH+16) + cardH/2;
      const canAfford = G.rubees >= r.shopPrice;
      this.uiRoot.add(this.makeCardPanel(x, y, cardW, cardH, "🏺 "+r.name, r.desc, r.rarity||"Common", `${r.shopPrice}g`, canAfford ? ()=>buyShopGear(i) : null));
    });
    const gearRows = Math.ceil(G.pendingShop.gear.length / cols) || 1;
    const leaveY = gearY + gearRows*(cardH+16) + 20;

    this.uiRoot.add(this.makeButton(500, leaveY, 200, 44, "Leave Shop", PALETTE.accent, ()=>leaveShop()));
  }

  drawRewardScreen(){
    this.clearRoot();
    this.addTitle("Choose a card");
    const n = G.pendingReward.length;
    const cardW = 220, cardH = 260, gap = 24;
    const totalW = n*cardW + (n-1)*gap;
    const startX = 500 - totalW/2 + cardW/2;
    G.pendingReward.forEach((c,i)=>{
      const x = startX + i*(cardW+gap);
      this.uiRoot.add(this.makeCardPanel(x, 260, cardW, cardH, c.name, c.desc, cardRarity(c), `${c.cost} energy`, ()=>pickReward(i)));
    });
    this.uiRoot.add(this.makeButton(500, 440, 200, 44, "Skip", PALETTE.dim, ()=>pickReward(-1)));
  }

  drawRelicScreen(){
    this.clearRoot();
    this.addTitle("Choose Gear");
    const choices = G.pendingRelicChoice.choices;
    const n = choices.length;
    const cardW = 220, cardH = 260, gap = 24;
    const totalW = n*cardW + (n-1)*gap;
    const startX = 500 - totalW/2 + cardW/2;
    choices.forEach((r,i)=>{
      const x = startX + i*(cardW+gap);
      this.uiRoot.add(this.makeCardPanel(x, 260, cardW, cardH, "🏺 "+r.name, r.desc, r.rarity||"Common", null, ()=>pickRelicChoice(i)));
    });
    this.uiRoot.add(this.makeButton(500, 440, 200, 44, "Skip", PALETTE.dim, ()=>pickRelicChoice(-1)));
  }

  drawMapScreen(){
    this.clearRoot();
    const mainCenterX = 630; // shifted right to make room for the sidebar map
    this.addTitle(`${G.cap.name} — Act ${G.act}: The Tremendous Sea`, mainCenterX);
    this.uiRoot.add(this.add.text(mainCenterX, 65, `❤️ ${G.player.hp}/${G.player.maxHp}   💰 ${G.rubees}   🃏 ${G.deck.all.length} cards`, {fontFamily:"sans-serif", fontSize:15, color:"#e8a33d"}).setOrigin(0.5));
    this.drawGearRow(mainCenterX, 90, 700);

    this.uiRoot.add(this.makeButton(920, 45, 150, 36, "📋 View Deck", PALETTE.panel, ()=>this.drawDeckScreen()));

    const current = getCurrentNode();
    this.drawMapSidebar(current);

    if (!G.pendingMapChoice){
      this.uiRoot.add(this.add.text(mainCenterX, 300, "Loading next step...", {fontFamily:"sans-serif", fontSize:14, color:"#93a6b8"}).setOrigin(0.5));
      return;
    }

    const options = current.connectsTo.map(findNodeById).filter(Boolean);
    const icons = {common:"⚔️", elite:"☠️", boss:"💀", oasis:"🏝️", event:"❓", shop:"🏪"};
    const labels = {common:"Fight", elite:"Elite Fight", boss:"Boss Fight", oasis:"Rest at Oasis", event:"Mystery Event", shop:"F&J Emporium"};
    const hints = {
      common:"A common enemy.", elite:"A dangerous fight — real Gear on victory.",
      boss:"The act's final battle.", oasis:"Fully heal and rest.",
      event:"Something strange awaits.", shop:"Spend your Rubees.",
    };

    this.uiRoot.add(this.add.text(mainCenterX, 110, "Choose your path", {fontFamily:"sans-serif", fontSize:16, fontStyle:"bold", color:"#e8a33d"}).setOrigin(0.5));

    const n = options.length;
    const cardW = 200, cardH = 240, gap = 26;
    const totalW = n*cardW + (n-1)*gap;
    const startX = mainCenterX - totalW/2 + cardW/2;
    options.forEach((node, i)=>{
      const x = startX + i*(cardW+gap);
      const y = 320;
      const container = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, cardW, cardH, PALETTE.panel, 0.95).setStrokeStyle(3, PALETTE.accent);
      const iconText = this.add.text(0, -70, icons[node.kind]||"❓", {fontSize:48}).setOrigin(0.5);
      const labelText = this.add.text(0, -10, labels[node.kind]||node.kind, {fontFamily:"sans-serif", fontSize:16, fontStyle:"bold", color:"#eef3f7"}).setOrigin(0.5);
      const hintText = this.add.text(0, 28, hints[node.kind]||"", {fontFamily:"sans-serif", fontSize:12, color:"#93a6b8", wordWrap:{width:cardW-24}, align:"center"}).setOrigin(0.5, 0);
      container.add([bg, iconText, labelText, hintText]);
      bg.setInteractive();
      bg.on("pointerover", ()=>{ bg.setStrokeStyle(4, 0xffffff); container.setScale(1.04); });
      bg.on("pointerout", ()=>{ bg.setStrokeStyle(3, PALETTE.accent); container.setScale(1); });
      bg.on("pointerdown", ()=>chooseNextNode(node.id));
      this.uiRoot.add(container);
    });
  }

  // Compact vertical "floor ladder" map — shows a window of floors around the
  // player's current position, one row per floor, dots spread across lanes.
  // Deliberately does NOT draw the full branching graph (we tried that in an
  // earlier build and it became an unreadable tangle of crossing lines) —
  // only the current node's own connections get a line, everything else is
  // just quiet context.
  drawGearRow(centerX, y, maxWidth){
    const relics = G.player.relics || [];
    if (relics.length === 0){
      this.uiRoot.add(this.add.text(centerX, y, "No Gear yet", {fontFamily:"sans-serif", fontSize:12, color:"#93a6b8"}).setOrigin(0.5));
      return;
    }
    const tooltip = this.add.text(centerX, y+22, "", {fontFamily:"sans-serif", fontSize:12, color:"#eef3f7", wordWrap:{width:maxWidth}, align:"center", backgroundColor:"#16283a"}).setOrigin(0.5, 0).setPadding(6).setVisible(false);
    this.uiRoot.add(tooltip);
    let chips = [];
    relics.forEach(r=>{
      const t = this.add.text(0, 0, `🏺 ${r.name}`, {fontFamily:"sans-serif", fontSize:12, color:"#c9962c", backgroundColor:"#16283a"}).setPadding(4,2,4,2);
      t.setInteractive();
      t.on("pointerover", ()=>{ tooltip.setText(r.desc).setVisible(true); });
      t.on("pointerout", ()=>{ tooltip.setVisible(false); });
      chips.push(t);
    });
    // lay out centered, wrapping rows
    let cx = centerX - maxWidth/2, cy = y, rowH = 24;
    for (const t of chips){
      if (cx + t.width > centerX + maxWidth/2){ cx = centerX - maxWidth/2; cy += rowH; }
      t.setPosition(cx, cy);
      this.uiRoot.add(t);
      cx += t.width + 6;
    }
    tooltip.setPosition(centerX, cy + rowH + 4);
  }

  drawDeckScreen(){
    this.clearRoot();
    this.addTitle("Your Deck");
    const counts = {};
    const example = {};
    for (const c of G.deck.all){ counts[c.name] = (counts[c.name]||0)+1; example[c.name] = c; }
    const names = Object.keys(counts).sort();
    this.uiRoot.add(this.add.text(500, 68, `${G.deck.all.length} total cards`, {fontFamily:"sans-serif", fontSize:13, color:"#93a6b8"}).setOrigin(0.5));

    const cols = 4, cellW = 230, cellH = 90, gap = 8;
    const gridStartX = 500 - (cols*cellW + (cols-1)*gap)/2 + cellW/2;
    names.forEach((name, i)=>{
      const card = example[name];
      const x = gridStartX + (i % cols)*(cellW+gap);
      const y = 110 + Math.floor(i/cols)*(cellH+gap) + cellH/2;
      const bg = this.add.rectangle(x, y, cellW, cellH, PALETTE.panel, 0.9).setStrokeStyle(1, rarityColor(cardRarity(card)));
      this.uiRoot.add(bg);
      const countLabel = counts[name] > 1 ? ` x${counts[name]}` : "";
      this.uiRoot.add(this.add.text(x, y-cellH/2+10, `${card.name}${countLabel}`, {fontFamily:"sans-serif", fontSize:11, fontStyle:"bold", color:"#eef3f7", wordWrap:{width:cellW-14}, align:"center"}).setOrigin(0.5, 0));
      this.uiRoot.add(this.add.text(x, y+4, card.desc, {fontFamily:"sans-serif", fontSize:9, color:"#93a6b8", wordWrap:{width:cellW-14}, align:"center"}).setOrigin(0.5, 0));
    });

    this.uiRoot.add(this.makeButton(500, 660, 200, 44, "Back", PALETTE.accent, ()=>render()));
  }

  drawMapSidebar(current){
    const sidebarX = 20, sidebarW = 230;
    const panelBg = this.add.rectangle(sidebarX + sidebarW/2, 380, sidebarW, 620, PALETTE.panel, 0.5).setStrokeStyle(1, 0x2a3a4a);
    this.uiRoot.add(panelBg);
    this.uiRoot.add(this.add.text(sidebarX + sidebarW/2, 78, "Your Journey", {fontFamily:"sans-serif", fontSize:13, fontStyle:"bold", color:"#e8a33d"}).setOrigin(0.5));

    const totalFloors = G.mapFloors.length;
    const currentFloorIdx = current ? current.floor : 0;
    const windowSize = 9;
    const windowStart = Math.max(0, Math.min(currentFloorIdx - 3, totalFloors - windowSize));
    const windowEnd = Math.min(totalFloors, windowStart + windowSize);
    const rowH = 58, firstRowY = 105;
    const reachableIds = new Set(current ? current.connectsTo : []);

    const nodePositions = {};
    for (let f = windowStart; f < windowEnd; f++){
      const floor = G.mapFloors[f];
      const rowY = firstRowY + (f - windowStart) * rowH;
      const laneGap = sidebarW / (floor.length + 1);
      floor.forEach((node, lane)=>{
        const x = sidebarX + laneGap * (lane + 1);
        nodePositions[node.id] = {x, y: rowY};
      });
    }

    // draw connector lines only from the current node to its real options
    if (current && nodePositions[current.id]){
      const p1 = nodePositions[current.id];
      for (const id of current.connectsTo){
        const p2 = nodePositions[id];
        if (p2){
          const line = this.add.line(0, 0, p1.x, p1.y, p2.x, p2.y, 0xe8a33d, 0.6).setLineWidth(2);
          line.setOrigin(0,0);
          this.uiRoot.add(line);
        }
      }
    }

    const icons = {common:"⚔️", elite:"☠️", boss:"💀", oasis:"🏝️", event:"❓", shop:"🏪"};
    for (let f = windowStart; f < windowEnd; f++){
      const floor = G.mapFloors[f];
      const rowY = firstRowY + (f - windowStart) * rowH;
      const isCurrentRow = f === currentFloorIdx;
      floor.forEach((node)=>{
        const pos = nodePositions[node.id];
        const isCurrent = current && node.id === current.id;
        const isReachable = reachableIds.has(node.id);
        const isPast = f < currentFloorIdx;
        let dotColor = 0x2a3a4a, dotSize = 6, alpha = 0.5;
        if (isCurrent){ dotColor = 0xffffff; dotSize = 10; alpha = 1; }
        else if (isReachable){ dotColor = PALETTE.accent; dotSize = 8; alpha = 1; }
        else if (isPast){ dotColor = 0x4a6a7a; dotSize = 5; alpha = 0.7; }
        const dot = this.add.circle(pos.x, pos.y, dotSize, dotColor, alpha);
        this.uiRoot.add(dot);
        if (isCurrent || isReachable){
          const iconLabel = this.add.text(pos.x, pos.y - 16, icons[node.kind]||"", {fontSize:11}).setOrigin(0.5);
          this.uiRoot.add(iconLabel);
        }
      });
      if (isCurrentRow){
        this.uiRoot.add(this.add.text(sidebarX + 4, rowY - 5, "▶", {fontFamily:"sans-serif", fontSize:11, color:"#eef3f7"}).setOrigin(0.5));
      }
    }
    this.uiRoot.add(this.add.text(sidebarX + sidebarW/2, firstRowY + windowSize*rowH + 10, `Floor ${currentFloorIdx+1} / ${totalFloors+1}`, {fontFamily:"sans-serif", fontSize:11, color:"#93a6b8"}).setOrigin(0.5));
  }

  drawEndScreen(){
    this.clearRoot();
    this.addTitle(G.won ? "🏆 Victory!" : "💀 Defeat");
    this.uiRoot.add(this.makeButton(400, 300, 240, 50, "Return to Menu", PALETTE.accent, ()=>{ G=null; render(); }));
  }

  // ---- COMBAT: the real animation-focused piece ----
  drawCombat(){
    const isFirstDraw = !this.combatBuilt;
    if (isFirstDraw){
      this.clearRoot();
      this.buildCombatSkeleton();
      this.combatBuilt = true;
    }
    this.updateCombatDisplay(true);
  }

  buildCombatSkeleton(){
    this.combatBuilt = false;
    const combatY = 280;
    this.playerContainer = this.add.container(150, combatY);
    const capColor = PALETTE.captain[G.captainKey] || PALETTE.accent;
    this.playerBody = window.createSeaCaptain(this, G.captainKey) || this.add.rectangle(0, 0, 110, 150, capColor).setStrokeStyle(3, 0xffffff);
    this.playerLabel = this.add.text(0, -100, G.cap.name, {fontFamily:"sans-serif", fontSize:16, fontStyle:"bold", color:"#eef3f7"}).setOrigin(0.5);
    this.playerHpBarBg = this.makeBar(0, 90, 130, 16, 1, 0x6fbf6f);
    this.playerHpText = this.add.text(0, 90, "", {fontFamily:"sans-serif", fontSize:12, fontStyle:"bold", color:"#ffffff"}).setOrigin(0.5);
    this.playerBlockText = this.add.text(0, 112, "", {fontFamily:"sans-serif", fontSize:13, fontStyle:"bold", color:"#7ea6c9"}).setOrigin(0.5);
    this.playerStatusContainer = this.add.container(0, 130);
    this.playerContainer.add([this.playerBody, this.playerLabel, this.playerHpBarBg, this.playerHpText, this.playerBlockText, this.playerStatusContainer]);
    this.uiRoot.add(this.playerContainer);

    // top info strip
    const stripBg = this.add.rectangle(500, 32, 960, 48, PALETTE.panel, 0.6).setStrokeStyle(1, 0x2a3a4a);
    this.uiRoot.add(stripBg);
    this.captainInfoText = this.add.text(20, 16, "", {fontFamily:"sans-serif", fontSize:13, color:"#eef3f7"}).setOrigin(0,0);
    this.uiRoot.add(this.captainInfoText);
    this.enchantText = this.add.text(20, 34, "", {fontFamily:"sans-serif", fontSize:11, color:"#c9962c"}).setOrigin(0,0);
    this.uiRoot.add(this.enchantText);
    this.logText = this.add.text(980, 12, "", {fontFamily:"sans-serif", fontSize:11, color:"#93a6b8", wordWrap:{width:400}, align:"right"}).setOrigin(1, 0);
    this.uiRoot.add(this.logText);
    this.drawGearRow(500, 52, 380);

    this.energyBarBg = this.makeBar(150, 460, 150, 22, 1, 0xe8a33d);
    this.energyText = this.add.text(150, 460, "", {fontFamily:"sans-serif", fontSize:14, fontStyle:"bold", color:"#0b1420"}).setOrigin(0.5);
    this.uiRoot.add([this.energyBarBg, this.energyText]);
    this.rattledText = this.add.text(150, 486, "", {fontFamily:"sans-serif", fontSize:11, fontStyle:"bold", color:"#f4d35e"}).setOrigin(0.5);
    this.uiRoot.add(this.rattledText);

    this.enemyContainer = this.add.container(0, 0);
    this.uiRoot.add(this.enemyContainer);

    this.handContainer = this.add.container(0, 0);
    this.uiRoot.add(this.handContainer);

    this.endTurnBtn = this.makeButton(910, 560, 150, 50, "End Turn ▶", PALETTE.accent, ()=>endTurn());
    this.uiRoot.add(this.endTurnBtn);
  }

  updateCombatDisplay(animate){
    const c = G.combat;
    if (!c) return;

    const playerPct = Math.max(0, G.player.hp) / G.player.maxHp;
    this.updateBar(this.playerHpBarBg, playerPct, playerPct > 0.3 ? 0x6fbf6f : 0xe5484d);
    this.playerHpText.setText(`${Math.max(0,G.player.hp)}/${G.player.maxHp}`);
    this.playerBlockText.setText(G.player.block>0 ? `🛡️ ${G.player.block}` : "");
    this.playerStatusContainer.removeAll(true);
    this.layoutStatusChips(this.playerStatusContainer, statusChipList(G.player), 0, 0, 170);

    this.enchantText.setText(`🔮 Enchant ${G.player.enchant||0}/5`);
    this.energyText.setText(`⚡ ${c.energy} energy`);
    this.rattledText.setText(G.player.status.rattled>0 ? "😵 Rattled (+1 cost)" : "");
    this.logText.setText(G.log.slice(0,4).join("\n"));

    let captainInfo = G.cap.name;
    if (isRiley()){
      const stanceName = G.player.stance === "FourSword" ? "Four Sword" : G.player.stance === "FistBlade" ? "Fist Blade" : "One With Entropy";
      captainInfo = `🗡️ ${stanceName}   ✨ Clarity ${G.player.clarity}/6`;
    } else if (isBroderick()){
      const clipMax = G.player.clipMax || 4;
      const slots = Array.from({length:clipMax}, (_,i)=>{
        const b = G.player.clip[i];
        return b==="Fire" ? "🔥" : b==="Plain" ? "⚪" : b==="Magic" ? "✨" : "▫️";
      }).join("");
      captainInfo = `🔫 ${slots} (${G.player.clip.length}/${clipMax})${c.linedUp ? "  ⚡Lined Up" : ""}${G.player.fullMoonActive ? "  🐺Full Moon" : ""}`;
    }
    this.captainInfoText.setText(captainInfo);

    // ---- diff against previous snapshot to decide animations ----
    const snap = { playerHp:G.player.hp, enemies:{} };
    c.enemies.forEach((e,i)=>{ snap.enemies[i] = {hp:e.hp, alive:e.alive}; });
    const prev = this.prevSnapshot;

    const combatY = 280;
    const zoneStart = 470, zoneEnd = 830;
    const n = c.enemies.length;
    c.enemies.forEach((e, i)=>{
      let spr = this.enemySprites[i];
      if (!spr){
        const x = n === 1 ? (zoneStart+zoneEnd)/2 : zoneStart + i*(zoneEnd-zoneStart)/(n-1);
        const container = this.add.container(x, combatY);
        const body = this.add.rectangle(0, 0, 110, 150, PALETTE.enemyHp).setStrokeStyle(3, 0xffffff);
        const label = this.add.text(0, -100, e.name, {fontFamily:"sans-serif", fontSize:13, fontStyle:"bold", color:"#eef3f7", wordWrap:{width:170}, align:"center"}).setOrigin(0.5);
        const hpBarBg = this.makeBar(0, 90, 130, 16, 1, 0xd9534f);
        const hpText = this.add.text(0, 90, "", {fontFamily:"sans-serif", fontSize:11, fontStyle:"bold", color:"#ffffff"}).setOrigin(0.5);
        const blockText = this.add.text(0, 110, "", {fontFamily:"sans-serif", fontSize:12, fontStyle:"bold", color:"#7ea6c9"}).setOrigin(0.5);
        const typeText = this.add.text(0, 128, "", {fontFamily:"sans-serif", fontSize:10, color:"#93a6b8", wordWrap:{width:170}, align:"center"}).setOrigin(0.5, 0);
        const statusContainer = this.add.container(0, 148);
        const intentText = this.add.text(0, 178, "", {fontFamily:"sans-serif", fontSize:12, fontStyle:"bold", color:"#c9962c", wordWrap:{width:170}, align:"center"}).setOrigin(0.5, 0);
        container.add([body, label, hpBarBg, hpText, blockText, typeText, statusContainer, intentText]);
        container.setInteractive(new Phaser.Geom.Rectangle(-55,-75,110,150), Phaser.Geom.Rectangle.Contains);
        container.on("pointerdown", ()=>{ if (c.pendingCardIdx!=null) playCardOnTarget(i); });
        container.on("pointerover", ()=>{ if (c.pendingCardIdx!=null) body.setStrokeStyle(4, PALETTE.accent); });
        container.on("pointerout", ()=>{ body.setStrokeStyle(3, 0xffffff); });
        this.enemyContainer.add(container);
        spr = { container, body, label, hpBarBg, hpText, blockText, typeText, statusContainer, intentText };
        this.enemySprites[i] = spr;
      }
      const isVeiled = e.tag==="uncounted_veil" && !e.veilBroken;
      const displayHp = isVeiled ? Math.max(0, e.maxHp*2 - (e.cumulativeDamageTaken||0)) : Math.max(0,e.hp);
      const displayMax = isVeiled ? e.maxHp*2 : e.maxHp;
      const pct = displayHp / displayMax;
      this.updateBar(spr.hpBarBg, pct, 0xd9534f);
      spr.hpText.setText(`${displayHp}/${displayMax}${isVeiled?" ❓":""}`);
      spr.blockText.setText(e.block>0 ? `🛡️ ${e.block}` : "");
      spr.typeText.setText(stripTags(typeChips(e)));
      spr.statusContainer.removeAll(true);
      this.layoutStatusChips(spr.statusContainer, statusChipList(e), 0, 0, 170);
      spr.intentText.setText(e.alive ? getIntent(e) : "💀 Defeated");
      spr.container.setVisible(true);
      spr.container.setAlpha(e.alive ? 1 : 0.3);

      if (animate && prev && prev.enemies[i]){
        const before = prev.enemies[i];
        if (before.hp > e.hp){
          this.flashAndShake(spr.container, spr.body);
          this.floatingText(spr.container.x, spr.container.y-90, `-${before.hp-e.hp}`, "#ff6b6b");
          this.lungeAttack(this.playerContainer, spr.container.x, spr.container.y);
        }
        if (before.alive && !e.alive){
          this.tweens.add({ targets: spr.container, alpha:0, scale:0.6, duration:400 });
        }
      }
    });

    if (animate && prev && prev.playerHp > G.player.hp){
      this.flashAndShake(this.playerContainer, this.playerBody);
      this.floatingText(this.playerContainer.x, this.playerContainer.y-100, `-${prev.playerHp-G.player.hp}`, "#ff6b6b");
    } else if (animate && prev && G.player.hp > prev.playerHp){
      this.floatingText(this.playerContainer.x, this.playerContainer.y-100, `+${G.player.hp-prev.playerHp}`, "#6fbf6f");
    }

    this.prevSnapshot = snap;

    // hand — now with description text and dynamic cost display
    // Reserve a right-side gutter (x > 800) for the End Turn button at all times.
    this.handContainer.removeAll(true);
    const handCount = Math.max(1, G.deck.hand.length);
    const availableWidth = 780;
    const handCenterX = 420;
    const cardW = Math.min(150, Math.max(75, Math.floor(availableWidth / handCount) - 10));
    const cardH = Math.min(210, cardW * 1.4);
    const gap = 10;
    const startX = handCenterX - (handCount * (cardW+gap))/2 + cardW/2;
    G.deck.hand.forEach((card, i)=>{
      const x = startX + i*(cardW+gap);
      const y = 600;
      const canPlay = affordable(card) && c.phase === "player";
      const cc = currentCost(card);
      const discounted = cc < card.cost;
      // Longer descriptions (Broderick's bullet-mechanic cards especially run much
      // longer than most) need a smaller font to have any chance of fitting —
      // a fixed size was overflowing past the card's bottom edge for these.
      const descLen = (card.desc || "").length;
      const descFontSize = descLen > 100 ? 10 : 11;
      const cardBg = this.add.rectangle(0, 0, cardW, cardH, canPlay ? PALETTE.panel : 0x222b33).setStrokeStyle(2, canPlay ? PALETTE.accent : 0x444444);
      const costText = this.add.text(-cardW/2+16, -cardH/2+16, `${cc}`, {fontFamily:"sans-serif", fontSize:18, fontStyle:"bold", color: discounted ? "#e8a33d" : "#eef3f7"}).setOrigin(0.5);
      const rarityText = this.add.text(cardW/2-16, -cardH/2+16, rarityBadgeChar(cardRarity(card)), {fontFamily:"sans-serif", fontSize:13, fontStyle:"bold", color:rarityColor(cardRarity(card))}).setOrigin(0.5);
      const nameText = this.add.text(0, -cardH/2+42, card.name, {fontFamily:"sans-serif", fontSize:12, fontStyle:"bold", color:"#eef3f7", wordWrap:{width:cardW-16}, align:"center"}).setOrigin(0.5, 0);
      const descText = this.add.text(0, -cardH/2+76, card.desc, {fontFamily:"sans-serif", fontSize:descFontSize, color:"#c3d2de", wordWrap:{width:cardW-14}, align:"center"}).setOrigin(0.5, 0);
      const cardContainer = this.add.container(x, y, [cardBg, costText, rarityText, nameText, descText]);
      if (canPlay){
        cardBg.setInteractive();
        cardBg.on("pointerover", ()=>{ cardContainer.setScale(1.08); cardContainer.setDepth(10); });
        cardBg.on("pointerout", ()=>{ cardContainer.setScale(1); cardContainer.setDepth(0); });
        cardBg.on("pointerdown", ()=>selectCard(i));
      }
      this.handContainer.add(cardContainer);
    });

    if (c.over){
      this.combatBuilt = false; // force skeleton rebuild for the next combat
    }
  }

  // ---- animation helpers ----
  flashAndShake(container, body){
    const origColor = body.fillColor;
    if (body.setTintFill) body.setTintFill(0xffffff);
    else body.setFillStyle(0xffffff);
    this.time.delayedCall(100, () => {
      if (!body.active) return;
      if (body.clearTint) body.clearTint();
      else body.setFillStyle(origColor);
    });
    this.tweens.add({ targets: container, x: container.x+8, duration:40, yoyo:true, repeat:3 });
  }
  lungeAttack(container, targetX, targetY){
    const origX = container.x, origY = container.y;
    this.tweens.add({
      targets: container, x: origX + (targetX-origX)*0.3, y: origY + (targetY-origY)*0.15,
      duration:120, yoyo:true, ease:"Quad.easeOut",
    });
  }
  floatingText(x, y, text, color){
    const t = this.add.text(x, y, text, {fontFamily:"sans-serif", fontSize:18, fontStyle:"bold", color}).setOrigin(0.5);
    this.uiRoot.add(t);
    this.tweens.add({ targets:t, y:y-40, alpha:0, duration:700, onComplete:()=>t.destroy() });
  }

  // ---- generic helpers ----
  addTitle(text, x){
    this.uiRoot.add(this.add.text(x !== undefined ? x : 400, 40, text, {fontFamily:"sans-serif", fontSize:26, color:"#e8a33d"}).setOrigin(0.5));
  }
  makeButton(x, y, w, h, label, color, onClick){
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, color, 0.85).setStrokeStyle(2, 0xffffff);
    const txt = this.add.text(0, 0, label, {fontFamily:"sans-serif", fontSize:14, color:"#0b1420", fontStyle:"bold"}).setOrigin(0.5);
    bg.setInteractive();
    bg.on("pointerover", ()=>bg.setAlpha(1));
    bg.on("pointerout", ()=>bg.setAlpha(0.85));
    bg.on("pointerdown", onClick);
    container.add([bg, txt]);
    return container;
  }
}

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 700,
  parent: "app",
  backgroundColor: "#0b1420",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: MainScene,
};
window.game = new Phaser.Game(config);
window.mountSeaControls(window.game);
window.startVoyage = (captain) => startGame(captain);
window.chooseSeaCard = (index) => selectCard(index);
window.chooseSeaTarget = (index) => playCardOnTarget(index);
window.endSeaTurn = () => endTurn();
window.playtest = () => ({
  scene: window.game.scene.getScenes(true)[0]?.scene.key,
  captain: G?.captainKey || null,
  act: G?.act || null,
  hp: G?.player?.hp,
  energy: G?.combat?.energy,
  phase: G?.combat?.phase,
  hand: G?.deck?.hand?.map((card, index) => ({index, name:card.name, cost:currentCost(card), affordable:affordable(card)})),
  enemies: G?.combat?.enemies.map((e) => ({name:e.name, hp:e.hp, alive:e.alive})),
  pendingCard: G?.combat?.pendingCardIdx,
  saved: hasSavedGame(),
  errors: window.gameErrors.getErrors(),
  sprite: window.game.scene.getScenes(true)[0]?.playerBody?.texture?.key || null,
  frame: window.game.scene.getScenes(true)[0]?.playerBody?.frame?.name || null
});
