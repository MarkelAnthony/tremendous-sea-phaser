// Preview-only choreography. Approved punch pixels are preserved without repainting gloves.
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),seek=document.querySelector('#seek'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
const FRAMES=64,fps=20;let time=0,last=0,playing=true,images={};
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error(src));im.src=src;});
const launches=[{f:9,hand:'left',target:0},{f:15,hand:'right',target:1},{f:21,hand:'left',target:2},{f:27,hand:'right',target:0},{f:33,hand:'left',target:1},{f:39,hand:'right',target:2},{f:47,hand:'left',target:0,finish:true},{f:47,hand:'right',target:1,finish:true},{f:48,hand:'left',target:2,finish:true}];
function fist(x,y,scale,angle,age,finish){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.scale(scale,scale);ctx.globalAlpha=Math.min(1,age*3,(1-age)*5);
 // Native pixel-art fist: separate knuckle ridges, curled fingers and underslung thumb.
 const p=(color,points)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();};
 p('#942c25',[[-37,-5],[-28,-8],[-35,-14],[-20,-10],[-17,-17],[-5,-12],[4,-15],[12,-12],[19,-11],[24,-5],[24,6],[19,13],[6,16],[-9,12],[-28,15],[-21,8],[-39,11],[-30,2]]);
 p('#ef5727',[[-32,-5],[-17,-3],[-24,-11],[-9,-7],[-9,-13],[2,-9],[10,-11],[18,-8],[21,-4],[21,7],[15,12],[4,13],[-8,8],[-25,11],[-17,4],[-33,7],[-24,0]]);
 p('#ffad35',[[-19,-3],[-6,0],[-11,-8],[0,-5],[2,-10],[8,-10],[8,-7],[12,-8],[17,-6],[19,-2],[19,5],[15,10],[5,10],[-2,7],[-14,7],[-9,2],[-23,4]]);
 // Squared finger columns are deliberately readable, not a round fireball.
 p('#ffe08b',[[2,-8],[7,-8],[7,0],[9,0],[9,-7],[13,-6],[13,1],[15,1],[15,-4],[18,-2],[18,5],[14,7],[5,7],[5,3],[0,2]]);
 p('#fff0b0',[[3,-7],[6,-7],[6,-2],[3,-2]]);p('#fff0b0',[[10,-5],[12,-5],[12,-1],[10,-1]]);
 p('#d94b22',[[0,4],[6,4],[9,7],[15,7],[14,10],[5,12],[-2,9],[-4,6]]);
 p('#ffbe50',[[0,5],[5,5],[7,8],[12,8],[9,10],[3,9],[-1,7]]);
 for(let i=0;i<7;i++){const a=((age*36+i*7)%31);ctx.fillStyle=i%2?'#ffb53d':'#ec5928';ctx.fillRect(-25-a,-13+((i*11+Math.floor(age*20))%27),i%2?3:2,2);}
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
 const recoil=active&&frame>=active.f?3:0;
 // Fixed canvas anchor per approved jab/heavy sequence, never fit to changing fists.
 const heavy=pose.startsWith('heavy');const px=layout.x-(heavy?79:76)*s+recoil,py=layout.feet-(heavy?110:112)*s;
 ctx.drawImage(images[pose],Math.round(px),Math.round(py),144*s,144*s);
 const visible=[],hits=[];
 for(const launch of launches){
  const age=(frame-launch.f)/8;if(age<0||age>1.65)continue;
  const target=enemies[launch.target%enemies.length]?.container;if(!target)continue;
  const tx=target.getData('reviewHomeX'),ty=target.y-8;const start={x:layout.x+47,y:layout.feet-109+(launch.hand==='right'?13:-4)};
  const progress=Math.min(1,age);const end={x:tx+8,y:ty};
  if(age<1){const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress;fist(x,y,(launch.finish?2.2:1.65)*(0.65+0.35*Math.min(1,age*4)),Math.atan2(end.y-start.y,end.x-start.x),Math.min(.92,.15+age*.75),launch.finish);visible.push({hand:launch.hand,target:launch.target,x,y});}
  else {hits.push(launch.target%enemies.length);const p=(age-1)/.65;ctx.save();ctx.translate(tx,ty);ctx.globalAlpha=1-p;ctx.fillStyle='#ffe7a3';for(let k=0;k<8;k++){const a=k*Math.PI/4,r=8+p*30;ctx.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),k%2?3:5,k%2?3:5);}ctx.restore();}
 }
 enemies.forEach((entry,i)=>{const hit=hits.includes(i);entry.container.x=entry.container.getData('reviewHomeX')+(hit?6:0);entry.container.setAlpha(hit?.72:1);});
 seek.value=String(frame);status.textContent=`Frame ${frame+1} / ${FRAMES} · ${playing?'Playing':'Paused'}`;
 document.querySelector('#phase').textContent=frame<7?'Plant feet · wind-up':frame<45?'Alternating punches · fire fists fan across the enemy line':frame<55?'Heavy finishing volley':'Recover to guard';
 window.previewState={ready:true,version:5,frame,frames:FRAMES,playing,pose,visibleFists:visible,hitTargets:hits,enemyCount:enemies.length,launches:launches.length,combatChanged:false};
}
window.seekPreview=n=>{playing=false;time=Math.max(0,Math.min(FRAMES-1,Number(n)))*1000/fps+1;pause.textContent='Play';draw();};window.playtest=()=>window.previewState||{ready:false};
pause.onclick=()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';};document.querySelector('#replay').onclick=()=>{time=0;playing=true;pause.textContent='Pause';};seek.max=String(FRAMES-1);seek.oninput=()=>window.seekPreview(seek.value);document.querySelector('#previous').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)-1);document.querySelector('#next').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)+1);
Promise.all(['jab0','jab1','jab2','heavy0','heavy2','heavy4','heavy5'].map(async key=>{images[key]=await load(`../branch-redraw-attacks/${key.replace(/(\d)/,'-$1')}.png`);})).then(draw).catch(e=>{status.textContent=e.message;});
function tick(now){if(last&&playing)time=(time+Math.min(80,now-last)*Number(document.querySelector('#speed').value))%(FRAMES*1000/fps+850);last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
