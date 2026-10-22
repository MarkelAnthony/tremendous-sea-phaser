(() => {
 const saved=localStorage.getItem(SAVE_KEY), results=[];
 const check=(name,expected,actual)=>results.push({name,expected,actual,pass:JSON.stringify(expected)===JSON.stringify(actual)});
 const reset=()=>{startVoyage('Branch');enterCombatFull(E('Audit target',1000,5));G.player.hp=60;G.combat.energy=20;return G.combat.enemies[0];};
 const play=name=>{G.deck.hand=[{...[...BRANCH_STARTER,...BRANCH_POOL].find(c=>c.name===name)}];const b=game.scene.getScenes(true)[0].playerBody;b.removeAllListeners('animationcomplete');b.setData('clarityAttackPlaying',false);playCard(0,G.combat.enemies[0]);};
 let e=reset();play('Flame Jab');check('Charred Cross combo cost',1,currentCost(BRANCH_STARTER.find(c=>c.name==='Charred Cross')));check('Scorch Kick second-attack discount',0,currentCost(BRANCH_POOL.find(c=>c.name==='Scorch Kick')));
 reset();G.combat.prevTurnCardNames=['Flame Jab','Charred Cross'];check('Wildfire Haymaker prior-turn combo',2,currentCost(BRANCH_POOL.find(c=>c.name==='Wildfire Haymaker')));
 e=reset();e.hp=5;play('Wraithfire Bolt');check('Bolt refunds energy on kill',20,G.combat.energy);
 e=reset();e.hp=5;play('Phoenix Straight');check('Phoenix Straight kill healing including passive',66,G.player.hp);
 e=reset();e.status.enflame=8;play('Banked Coals');check('Banked Coals consumes burn into block',[0,8,1],[e.status.enflame,G.player.block,G.deck.hand.length]);
 e=reset();e.status.enflame=8;play('Fuel the Fire');check('Fuel consumes burn and gains energy',[0,21],[e.status.enflame,G.combat.energy]);
 e=reset();G.player.status.bleed=3;G.player.status.rattled=2;play("Sage's Remedy");check('Remedy heals and cleanses',[67,0,0],[G.player.hp,G.player.status.bleed,G.player.status.rattled]);
 e=reset();G.player.hp=74;play("Sage's Remedy");check('Healing capped at maximum',75,G.player.hp);
 e=reset();e.block=100;play('Solar Flare');check('Fully blocked Solar Flare does not stun',false,e.status.stun);
 e=reset();play('Solar Flare');check('Penetrating Solar Flare stuns',true,e.status.stun);
 reset();play('Rock Candy - Stoneskin');resolveEnemyPhase();check('Stoneskin negates next attack',60,G.player.hp);
 startVoyage('Branch');const node=getCurrentNode();G.combat.enemies.forEach(e=>{e.alive=false;e.hp=0;});checkCombatEnd();check('Combat victory flag',true,G.combat.win);const money=G.rubees;afterCombatContinue();check('Normal victory offers three rewards',3,G.pendingReward?.length);check('Normal victory awards bounty',6*(node.def.count||1),G.rubees-money);
 const reward=G.pendingReward[0].name;const size=G.deck.all.length;pickReward(0);check('Reward joins deck',size+1,G.deck.all.length);check('Reward is the selected card',reward,G.deck.all[G.deck.all.length-1].name);check('Victory reaches route choice',true,!!G.pendingMapChoice);
 reset();G.act=3;G.currentNodeId=G.mapFloors[G.mapFloors.length-1][0].id;G.pendingBossRelic=null;G.pendingRelicChoice=null;G.combat=null;dispatchRelicComplete('boss');check('Final-act completion sets victory',[true,true],[G.over,G.won]);
 window.branchFlowAudit=results;startVoyage('Branch');if(saved===null)localStorage.removeItem(SAVE_KEY);else localStorage.setItem(SAVE_KEY,saved);
 return JSON.stringify({total:results.length,failed:results.filter(r=>!r.pass),results});
})()
