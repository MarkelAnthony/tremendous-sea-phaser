const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),seek=document.querySelector('#seek'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
const fps=12,FRAMES=33;let frames=[],time=0,last=0,playing=true;
const load=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(Error('Unable to load '+src));im.src=src;});
// One unified generated animation: character and fire share the same pixel grid.
const VERSION=4;
let fireFrames=[];
const feet=[251,244,229,216,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,210,214,220,229,242,251];
function draw(){
 const layout=arenaLayout();if(!frames.length||!fireFrames.length||!layout)return;
 const frame=Math.min(FRAMES-1,Math.floor(time*fps/1000)),s=layout.scale;
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,1000,700);
 const lift=frame<3?0:frame<8?88*(1-Math.pow(1-(frame-3)/5,2)):frame<25?88:88*Math.pow((32-frame)/7,2);
 const x=Math.round(layout.x-65*s),y=Math.round(layout.feet-(feet[frame]+lift)*s);
 const firing=frame>=9&&frame<=27;
 const start={x:x+127*s,y:y+178*s},end={x:layout.enemyX+18,y:layout.enemyY+12};
 let beam=null;
 if(firing){
  const dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy);
  const reach=Math.min(1,(frame-8)/3),fade=Math.min(1,(28-frame)/3);
  ctx.save();ctx.translate(Math.round(start.x),Math.round(start.y));ctx.rotate(Math.atan2(dy,dx));ctx.globalAlpha=fade;
  ctx.drawImage(fireFrames[frame],0,0,180,82,0,-41*s,len*reach,82*s);ctx.restore();
  beam={start,end,reach};
 }
 ctx.drawImage(frames[frame],x,y,256*s,256*s);
 const target=Object.values(battle.enemySprites)[0]?.container;
 const recoil=firing&&frame>=12?Math.round(5+Math.sin(frame*2)*3):0;
 if(target){target.x=layout.enemyX+recoil;target.setAlpha(firing&&frame%3===0?.78:1);}
 seek.value=String(frame);status.textContent=`Frame ${frame+1} / ${FRAMES} · ${playing?'Playing':'Paused'}`;
 document.querySelector('#phase').textContent=frame<3?'Anticipation':frame<9?'Jump and airborne wind-up':frame<28?'Twisting fire torrent':'Landing and guard';
 window.previewState={ready:true,version:VERSION,frame,frames:FRAMES,playing,lift,beam,recoil,combatChanged:false,attack:'Fireball Candy – Eviscerate',scale:s,anchor:{x,y},bounds:{right:x+132*s,top:y+122*s}};
}
window.seekPreview=n=>{playing=false;time=Math.max(0,Math.min(FRAMES-1,Number(n)))*1000/fps+1;pause.textContent='Play';draw();};window.playtest=()=>window.previewState||{ready:false};
pause.onclick=()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';};document.querySelector('#replay').onclick=()=>{time=0;playing=true;pause.textContent='Pause';};seek.oninput=()=>window.seekPreview(seek.value);document.querySelector('#previous').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)-1);document.querySelector('#next').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)+1);
Promise.all([Promise.all(Array.from({length:FRAMES},(_,i)=>load(`./rebuild/body-${i}.png`))),Promise.all(Array.from({length:FRAMES},(_,i)=>load(`./rebuild/fire-${i}.png`)))]).then(([a,b])=>{frames=a;fireFrames=b;draw();}).catch(e=>{status.textContent=e.message;window.previewState={ready:false,error:e.message};});
function tick(now){if(last&&playing&&frames.length)time=(time+Math.min(80,now-last)*Number(document.querySelector('#speed').value))%(FRAMES*1000/fps+750);last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
