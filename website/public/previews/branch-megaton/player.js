// Megaton v4: one generated animation drawn at Branch's real in-game scale, sun and body share one pixel grid.
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),seek=document.querySelector('#seek'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
const fps=12,FRAMES=32,impactFrame=24;let frames=[],sun=null,time=0,last=0,playing=true;
const load=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(Error('Unable to load '+src));im.src=src;});
function draw(){const layout=arenaLayout();if(!frames.length||!sun||!layout)return;
 const frame=Math.min(FRAMES-1,Math.floor(time*fps/1000)),age=frame-impactFrame,s=layout.scale;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,1000,700);
 const recoil=age<0?0:Math.min(40,(age+1)*8);const target=Object.values(battle.enemySprites)[0]?.container;
 if(target){target.x=layout.enemyX+recoil;target.setAlpha(age===0||age===2?0.55:1);}
 const im=frames[Math.min(24,frame)],x=Math.round(layout.x-65*s),y=Math.round(layout.feet-251*s);
 ctx.drawImage(im,x,y,256*s,256*s);
 let sunBox=null;
 if(frame>=21&&frame<=impactFrame+3){const sw=sun.width*s,sh=sun.height*s;
  const startX=x+170*s,startY=y+105*s,endX=layout.enemyX+recoil,endY=layout.enemyY-30;
  const p=Math.min(1,(frame-21)/(impactFrame-21));let cx=startX+(endX-startX)*p,cy=startY+(endY-startY)*p;
  if(age>0){ctx.globalAlpha=age===1?0.85:age===2?0.5:0.25;}
  ctx.drawImage(sun,Math.round(cx-sw/2),Math.round(cy-sh/2),sw,sh);ctx.globalAlpha=1;sunBox={x:cx,y:cy,w:sw,h:sh};}
 const top=y+2*s;window.sunReview={spriteTop:Math.round(top),fitsArena:top>=0,scale:s,sunBox};
 seek.value=String(frame);status.textContent=`Frame ${frame+1} / ${FRAMES} · ${playing?'Playing':'Paused'}`;
 document.querySelector('#phase').textContent=frame<8?'One hand rises · a spark ignites':frame<20?'The sun swells overhead':frame<21?'Wind-up and throw':frame<impactFrame?'Sun in flight':frame<impactFrame+4?'Solar impact':'Back to guard';
 window.previewState={ready:true,frame,frames:FRAMES,playing,enemyHit:age>=0,recoil,impactFrame,combatChanged:false,attack:'Fireball Candy – Megaton',version:4,sunTop:Math.round(top)};}
window.seekPreview=n=>{playing=false;time=Math.max(0,Math.min(FRAMES-1,Number(n)))*1000/fps+1;pause.textContent='Play';draw();};window.playtest=()=>window.previewState||{ready:false};
pause.onclick=()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';};document.querySelector('#replay').onclick=()=>{time=0;playing=true;pause.textContent='Pause';};seek.oninput=()=>window.seekPreview(seek.value);
document.querySelector('#previous').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)-1);document.querySelector('#next').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)+1);
Promise.all([Promise.all(Array.from({length:25},(_,i)=>load(i>=21?`./v4/b${i}.png`:`./v4/${i}.png`))),load('./v4/sun-flight.png')]).then(([a,b])=>{frames=a;sun=b;draw();}).catch(e=>{status.textContent=e.message;window.previewState={ready:false,error:e.message};});
function tick(now){if(last&&playing&&frames.length)time=(time+Math.min(80,now-last)*Number(document.querySelector('#speed').value))%(FRAMES*1000/fps+750);last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
