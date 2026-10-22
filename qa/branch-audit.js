// Run against the live game with: browser eval "$(cat qa/branch-audit.js)"
(() => {
  const original = localStorage.getItem(SAVE_KEY);
  window.branchAuditSave = original;
  const results = [];
  const unique = [...new Map([...BRANCH_STARTER, ...BRANCH_POOL].map(c => [c.name,c])).values()];
  window.startVoyage('Branch');
  for (const template of unique) {
    try {
      enterCombatFull(E('Audit target', 1000, 5, {count:2}));
      G.player.hp = 45; G.player.status.enflame = 6;
      G.combat.energy = 20;
      G.combat.enemies.forEach(e => {e.status.enflame = 8;});
      G.deck.hand = [{...template}];
      const body = window.game.scene.getScenes(true)[0].playerBody;
      body.removeAllListeners('animationcomplete');
      body.setData('clarityAttackPlaying', false);
      const before = {hp:G.player.hp,energy:G.combat.energy};
      playCard(0, G.combat.enemies[0]);
      results.push({name:template.name,description:template.desc,before,after:{hp:G.player.hp,energy:G.combat.energy,block:G.player.block,hand:G.deck.hand.length,enemies:G.combat.enemies.map(e=>({hp:e.hp,burn:e.status.enflame}))},clip:body.getData('approvedClip')});
    } catch(error) { results.push({name:template.name,error:String(error)}); }
  }
  window.branchCardAudit = results;
  window.startVoyage('Branch');
  if (original === null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY,original);
  return JSON.stringify({tested:results.length,failures:results.filter(r=>r.error),results});
})()
