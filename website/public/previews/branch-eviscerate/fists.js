// Preview-only choreography. Approved punch pixels are preserved without repainting gloves.
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),seek=document.querySelector('#seek'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
const FRAMES=64,fps=20;let time=0,last=0,playing=true,images={};
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error(src));im.src=src;});
const launches=[{f:9,hand:'left',target:0},{f:15,hand:'right',target:1},{f:21,hand:'left',target:2},{f:27,hand:'right',target:0},{f:33,hand:'left',target:1},{f:39,hand:'right',target:2},{f:47,hand:'left',target:0,finish:true},{f:47,hand:'right',target:1,finish:true},{f:48,hand:'left',target:2,finish:true}];
function fist(x,y,scale,angle,age,finish){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.scale(scale,scale);
 // Solid anatomical silhouette first; fire stays behind the wrist, never over the fingers.
 const p=(color,points)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();};
 const r=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 p('#c34024',[[-47,-13],[-23,-9],[-33,-22],[-12,-14],[-9,-9],[-9,12],[-24,19],[-20,10],[-44,16],[-32,4],[-53,0],[-27,-3]]);
 p('#ff8b28',[[-38,-9],[-16,-5],[-22,-14],[-7,-8],[-6,9],[-25,13],[-18,5],[-38,7],[-25,0]]);
 p('#64272a',[[-15,-13],[-7,-19],[6,-19],[6,-23],[17,-23],[17,-20],[26,-20],[26,-16],[30,-16],[30,-7],[32,-7],[32,2],[30,2],[30,11],[24,11],[24,17],[14,17],[14,22],[1,22],[-6,18],[-8,12],[-15,10]]);
 p('#f77426',[[-12,-11],[-5,-16],[9,-16],[9,-20],[16,-20],[16,-17],[24,-17],[24,-13],[27,-13],[27,-5],[29,-5],[29,0],[27,0],[27,8],[21,8],[21,14],[12,14],[12,19],[1,19],[-3,15],[-5,8],[-12,7]]);
 // Four separate curled fingers with dark crease channels and square leading knuckles.
 r('#9f3825',5,-16,4,26);
 for(const [yy,xx,ww] of [[-17,10,14],[-9,10,17],[-1,10,17],[7,9,12]]){
  r('#963024',xx,yy,ww,7);r('#ffb53d',xx+1,yy,ww-1,5);
  r('#ffe78a',xx+ww-5,yy,4,4);r('#ef7626',xx+1,yy+4,ww-2,1);
 }
 // Broad hooked thumb crosses the palm beneath the curled fingers.
 p('#7e2b26',[[-7,1],[-1,-2],[6,0],[9,6],[18,7],[18,14],[11,17],[0,16],[-5,12]]);
 p('#ffbc43',[[-4,2],[0,1],[4,3],[7,9],[15,10],[15,12],[9,14],[1,13],[-2,10]]);
 r('#fff0a1',-2,3,4,5);r('#df5526',-9,-9,4,10);r('#ffcf57',-7,-12,9,4);
 for(let i=0;i<(finish?6:3);i++){const a=((age*36+i*7)%22);r(i%2?'#ffb53d':'#ec5928',-30-a,-10+((i*11+Math.floor(age*20))%23),3,2);}
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
  const size=launch.finish?3.1:2.5,impact=8,hold=launch.finish?3:2;
  const end={x:tx-24*size,y:ty};const angle=Math.atan2(end.y-start.y,end.x-start.x);
  if(d<=impact+hold){
   // Two-frame gathering pause, then an accelerating thrust. Hold the solid fist on contact.
   const progress=d<2?0:Math.pow(Math.min(1,(d-2)/6),2.4);
   const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress;
   fist(x,y,size*(d<2?.82+d*.09:1),angle,d/14,launch.finish);
   visible.push({hand:launch.hand,target:launch.target,x,y,contact:d>=impact});
  }
  if(d>=impact){
   hits.push(launch.target%enemies.length);const elapsed=d-impact,p=elapsed/7;
   reactions.set(launch.target%enemies.length,{offset:(launch.finish?22:13)*(elapsed<hold?1:Math.max(0,1-(elapsed-hold)/5)),flash:elapsed<hold});
   ctx.save();ctx.translate(tx,ty);ctx.globalAlpha=Math.max(0,1-p);
   // Sharp compression cross and expanding broken shock ring, not an obscuring fireball.
   ctx.strokeStyle='#ffbc43';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,12+p*38,27+p*42,0,-1.2,1.2);ctx.stroke();
   ctx.fillStyle='#fff0bd';ctx.fillRect(-3,-28-p*14,6,16);ctx.fillRect(-3,12+p*14,6,16);ctx.fillRect(12,-3,20+p*16,6);
   for(let k=0;k<5;k++){const a=-1.2+k*.6,r=15+p*60;ctx.fillStyle=k%2?'#ff8c2b':'#ffe7a3';ctx.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),6,3);}
   ctx.restore();
  }
 }
 enemies.forEach((entry,i)=>{const reaction=reactions.get(i);entry.container.x=entry.container.getData('reviewHomeX')+(reaction?.offset||0);entry.container.setAlpha(reaction?.flash?.65:1);});
 seek.value=String(frame);status.textContent=`Frame ${frame+1} / ${FRAMES} · ${playing?'Playing':'Paused'}`;
 document.querySelector('#phase').textContent=frame<7?'Plant feet · wind-up':frame<45?'Alternating punches · fire fists fan across the enemy line':frame<55?'Heavy finishing volley':'Recover to guard';
 window.previewState={ready:true,version:6,frame,frames:FRAMES,playing,pose,visibleFists:visible,hitTargets:hits,enemyCount:enemies.length,launches:launches.length,combatChanged:false};
}
window.seekPreview=n=>{playing=false;time=Math.max(0,Math.min(FRAMES-1,Number(n)))*1000/fps+1;pause.textContent='Play';draw();};window.playtest=()=>window.previewState||{ready:false};
pause.onclick=()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';};document.querySelector('#replay').onclick=()=>{time=0;playing=true;pause.textContent='Pause';};seek.max=String(FRAMES-1);seek.oninput=()=>window.seekPreview(seek.value);document.querySelector('#previous').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)-1);document.querySelector('#next').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)+1);
Promise.all(['jab0','jab1','jab2','heavy0','heavy2','heavy4','heavy5'].map(async key=>{images[key]=await load(`../branch-redraw-attacks/${key.replace(/(\d)/,'-$1')}.png`);})).then(draw).catch(e=>{status.textContent=e.message;});
function tick(now){if(last&&playing)time=(time+Math.min(80,now-last)*Number(document.querySelector('#speed').value))%(FRAMES*1000/fps+850);last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
