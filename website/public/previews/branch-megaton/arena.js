// Review only: use the live battle renderer and its measured layout, never a larger mock stage.
const stage=document.querySelector('#arena'), gameFrame=document.querySelector('#battle');
let battle=null, model=null, gameCanvas=null;
gameFrame.addEventListener('load',()=>{
 const check=setInterval(()=>{
  const w=gameFrame.contentWindow;
  if(!w.game?.scene?.getScenes(true)[0]||!w.startVoyage)return;
  if(!w.playtest?.().captain){w.startVoyage('Branch');return;}
  const scene=w.game.scene.getScenes(true)[0];
  if(!scene.playerBody||!scene.enemySprites||!Object.keys(scene.enemySprites).length)return;
  battle=scene;model=scene.playerBody;gameCanvas=w.game.canvas;
  model.setVisible(false);clearInterval(check);
 },150);
});
function arenaLayout(){
 if(!battle||!gameCanvas)return null;
 const r=gameCanvas.getBoundingClientRect(), s=stage.getBoundingClientRect();
 canvas.style.left=r.left+'px';canvas.style.top=r.top+'px';canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';
 const target=Object.values(battle.enemySprites)[0]?.container;
 return {x:battle.playerContainer.x,feet:battle.playerContainer.y+75,enemyX:target?.x||715,enemyY:target?.y||280,scale:Number(model.getData('visibleModelHeight')||176)/107,viewport:{width:1000,height:700,displayWidth:s.width}};
}
