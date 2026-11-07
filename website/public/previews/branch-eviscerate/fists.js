// Preview-only choreography. Approved punch pixels are preserved without repainting gloves.
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),seek=document.querySelector('#seek'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
const FRAMES=64,fps=20;let time=0,last=0,playing=true,images={};
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error(src));im.src=src;});
const launches=[{f:9,hand:'left',target:0},{f:15,hand:'right',target:1},{f:21,hand:'left',target:2},{f:27,hand:'right',target:0},{f:33,hand:'left',target:1},{f:39,hand:'right',target:2},{f:47,hand:'left',target:0,finish:true},{f:47,hand:'right',target:1,finish:true},{f:48,hand:'left',target:2,finish:true}];
// Native sprite pixels, not vector anatomy. Reference: stretched-arm punch afterimages.
const punchBuffer=document.createElement('canvas');punchBuffer.width=112;punchBuffer.height=40;
const pc=punchBuffer.getContext('2d');
function fist(x,y,scale,angle,age,finish,reach){
 if(!images.glove)return;
 pc.clearRect(0,0,112,40);pc.imageSmoothingEnabled=false;
 const tail=Math.min(88,Math.max(24,reach/scale));
 // Uneven horizontal streaks make a stretched fiery forearm, not a comet/round fireball.
 const colors=['#a82e22','#df4622','#f77921','#ffb83e','#ffd66b'];
 for(let row=0;row<10;row++){
  const yy=10+row*2,notch=(row*7+Math.floor(age*35)*3)%13;
  const length=tail-(row%3)*6-notch;
  pc.fillStyle=colors[row===0||row===9?0:row===1||row===8?1:row%3+2];
  pc.fillRect(Math.round(88-length),yy,Math.round(length+3),2);
 }
 // Short broken tongues stay behind the hand, leaving the approved mitt readable.
 pc.fillStyle='#df4622';pc.fillRect(70,7,12,3);pc.fillRect(59,30,18,2);
 pc.fillStyle='#ffb83e';pc.fillRect(75,10,11,2);pc.fillRect(69,28,15,2);
 pc.drawImage(images.glove,0,0,16,17,81,7,30,27);
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(punchBuffer,-104*scale,-20*scale,112*scale,40*scale);
 ctx.restore();
}
function draw(){
 const layout=arenaLayout();if(!images.jab0||!layout)return;
 const frame=Math.min(FRAMES-1,Math.floor(time*fps/1000));const enemies=Object.values(battle.enemySprites);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,1000,700);
 const s=layout.scale*107/66;let pose='jab2',active=null;
 for(const launch of launches){const d=frame-launch.f;if(d>=-3&&d<=2)active=launch;}
 if(frame<7)pose=frame<4?'jab2':'heavy4';
 else if(active){const d=frame-active.f;pose=active.hand==='left'?(d<0?'jab1':d<2?'jab0':'jab1'):(d<0?'heavy4':d<2?'heavy5':'heavy2');}
 else if(frame>53)pose='jab2';
 const recoil=active?(frame<active.f?-5:frame===active.f?5:-3):0;
 // Fixed canvas anchor per approved jab/heavy sequence, never fit to changing fists.
 const heavy=pose.startsWith('heavy');const px=layout.x-(heavy?79:76)*s+recoil,py=layout.feet-(heavy?110:112)*s;
 ctx.drawImage(images[pose],Math.round(px),Math.round(py),144*s,144*s);
 const visible=[],hits=[],reactions=new Map();
 for(const launch of launches){
  const d=frame-launch.f;if(d<0||d>14)continue;
  const target=enemies[launch.target%enemies.length]?.container;if(!target)continue;
  const tx=target.getData('reviewHomeX'),ty=target.y-8;const start={x:layout.x+47,y:layout.feet-109+(launch.hand==='right'?13:-4)};
  const size=launch.finish?2.7:2.2,impact=6,hold=launch.finish?3:1;
  const end={x:tx-7*size,y:ty};const angle=Math.atan2(end.y-start.y,end.x-start.x);
  if(d<=impact+hold){
   // Two-frame gathering pause, then an accelerating thrust. Hold the solid fist on contact.
   const progress=d<1?0:Math.pow(Math.min(1,(d-1)/5),2.6);
   const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress;
   fist(x,y,size*(d<1?.7:1),angle,d/14,launch.finish,Math.hypot(x-start.x,y-start.y));
   visible.push({hand:launch.hand,target:launch.target,x,y,contact:d>=impact});
  }
  if(d>=impact){
   hits.push(launch.target%enemies.length);const elapsed=d-impact,p=elapsed/7;
   reactions.set(launch.target%enemies.length,{offset:(launch.finish?22:13)*(elapsed<hold?1:Math.max(0,1-(elapsed-hold)/5)),flash:elapsed<hold});
   ctx.save();ctx.translate(tx,ty);ctx.globalAlpha=Math.max(0,1-p);
   // Sprite-sized broken impact streaks: no smooth rings or giant UI-like crosses.
   for(let k=0;k<7;k++){
    const yy=-27+k*8,spread=elapsed*6;
    ctx.fillStyle=k%2?'#f77921':'#ffd66b';
    ctx.fillRect(Math.round(4+spread+(k%3)*5),yy,Math.max(3,16-elapsed*2),3);
   }
   ctx.restore();
  }
 }
 enemies.forEach((entry,i)=>{const reaction=reactions.get(i);entry.container.x=entry.container.getData('reviewHomeX')+(reaction?.offset||0);entry.container.setAlpha(reaction?.flash?.65:1);});
 seek.value=String(frame);status.textContent=`Frame ${frame+1} / ${FRAMES} · ${playing?'Playing':'Paused'}`;
 document.querySelector('#phase').textContent=frame<7?'Plant feet · wind-up':frame<45?'Alternating punches · fire fists fan across the enemy line':frame<55?'Heavy finishing volley':'Recover to guard';
 window.previewState={ready:true,version:7,frame,frames:FRAMES,playing,pose,visibleFists:visible,hitTargets:hits,enemyCount:enemies.length,launches:launches.length,combatChanged:false};
}
window.seekPreview=n=>{playing=false;time=Math.max(0,Math.min(FRAMES-1,Number(n)))*1000/fps+1;pause.textContent='Play';draw();};window.playtest=()=>window.previewState||{ready:false};
pause.onclick=()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';};document.querySelector('#replay').onclick=()=>{time=0;playing=true;pause.textContent='Pause';};seek.max=String(FRAMES-1);seek.oninput=()=>window.seekPreview(seek.value);document.querySelector('#previous').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)-1);document.querySelector('#next').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)+1);
Promise.all(['jab0','jab1','jab2','heavy0','heavy2','heavy4','heavy5'].map(async key=>{images[key]=await load(`../branch-redraw-attacks/${key.replace(/(\d)/,'-$1')}.png`);})).then(async()=>{images.glove=await load('./glove-source.png');draw();}).catch(e=>{status.textContent=e.message;});
function tick(now){if(last&&playing)time=(time+Math.min(80,now-last)*Number(document.querySelector('#speed').value))%(FRAMES*1000/fps+850);last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
