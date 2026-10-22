(async () => {
  const saved = localStorage.getItem(SAVE_KEY);
  const results = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const reset = (count = 1, atk = 5) => {
    window.startVoyage('Branch');
    enterCombatFull(E('Audit target',1000,atk,{count}));
    G.player.hp = 60;
    G.combat.energy = 20;
    return G.combat.enemies;
  };
  const play = name => {
    const card = [...BRANCH_STARTER,...BRANCH_POOL].find(c => c.name === name);
    G.deck.hand = [{...card}];
    const sprite = window.game.scene.getScenes(true)[0].playerBody;
    sprite.removeAllListeners('animationcomplete');
    sprite.setData('clarityAttackPlaying',false);
    playCard(0,G.combat.enemies[0]);
  };
  const check = (name, expected, actual) => results.push({name,expected,actual,pass:JSON.stringify(expected)===JSON.stringify(actual)});
  let enemies = reset(2);
  G.deck.hand = [{...BRANCH_STARTER[0]}];
  selectCard(0);
  check('Multiple enemies require target',0,G.combat.pendingCardIdx);
  playCardOnTarget(1);
  check('Chosen enemy takes Flame Jab', [1000,995], enemies.map(e=>e.hp));
  enemies = reset(); G.combat.energy=0;
  G.deck.hand=[{...BRANCH_STARTER[0]}];selectCard(0);
  check('Unaffordable card is not spent',[1,1000],[G.deck.hand.length,enemies[0].hp]);
  enemies = reset(); play('Flame Jab');
  const s = window.game.scene.getScenes(true)[0].playerBody;
  check('Jab starts',[true,'jab'],[s.getData('clarityAttackPlaying'),s.getData('approvedClip')]);
  await wait(1500);
  check('Jab returns to idle',[false,'idle'],[s.getData('clarityAttackPlaying'),s.getData('approvedClip')]);
  for(const [name,clip,ms] of [["Branch's Resolve",'block',2000],["Sage's Remedy",'heal',2200],["Scorch Kick",'kick',1500],["Wildfire Haymaker",'heavy',1500],["Slow Burn",'fire',2000],["Phoenix Ward",'block',4200]]) {
    reset();play(name);
    const body=window.game.scene.getScenes(true)[0].playerBody;
    check(name+' animation starts',clip,body.getData('approvedClip'));
    await wait(ms);
    check(name+' animation releases input',[false,'idle'],[body.getData('clarityAttackPlaying'),body.getData('approvedClip')]);
  }
  enemies=reset();enemies[0].hp=1;enemies[0].status.enflame=4;
  resolveEnemyPhase();
  check('Flame Body heals on burn-tick kill',61,G.player.hp);
  check('Burn kill reaches victory',true,G.combat.win);
  enemies=reset();enemies[0].atk=0;resolveEnemyPhase();
  check('Non-damaging action does not consume Flame Body',[false,0],[!!G.flameBodyDoneThisCombat,enemies[0].status.enflame]);
  enemies=reset();resolveEnemyPhase();
  check('First actual attacker ignited',3,enemies[0].status.enflame);
  const afterHit=G.player.hp;resolveEnemyPhase();
  check('Flame Body triggers once',2,enemies[0].status.enflame);
  check('Enemy damage applied',55,afterHit);
  enemies=reset();enemies[0].hp=1;enemies[0].status.enflame=2;play('Mystic Detonation');
  check('Flame Body heals on detonation kill',61,G.player.hp);
  enemies=reset();enemies[0].hp=1;enemies[0].status.enflame=2;play('Cinder Fist');
  check('Flame Body heals on direct kill',61,G.player.hp);
  enemies=reset(1,0);G.flameBodyDoneThisCombat=true;play('Fireball Candy - Wildfire');
  const stacks=enemies[0].status.enflame;resolveEnemyPhase();
  check('Wildfire prevents first-turn Enflame decay',stacks,enemies[0].status.enflame);
  enemies=reset();G.player.hp=1;resolveEnemyPhase();
  check('Lethal enemy attack reaches defeat',[true,false,true],[G.combat.over,G.combat.win,G.over]);
  window.startVoyage('Branch');saveGame();
  const before=G.player.hp;G=null;resumeGame();
  check('Save/resume restores Branch',['Branch',before], [G.captainKey,G.player.hp]);
  window.branchRegressionAudit=results;
  if(saved===null)localStorage.removeItem(SAVE_KEY);else localStorage.setItem(SAVE_KEY,saved);
  return JSON.stringify({total:results.length,failed:results.filter(r=>!r.pass),results,errors:window.gameErrors.getErrors()});
})()
