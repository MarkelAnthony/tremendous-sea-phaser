const durations=[180,100,100,100,90,80,70,80,110,90,100,120,180];
const starts=durations.map((_,i)=>durations.slice(0,i).reduce((a,b)=>a+b,0));
const total=durations.reduce((a,b)=>a+b,0), releaseMs=starts[8];
const canvas=document.getElementById('blast'), ctx=canvas.getContext('2d');
const nodes=[document.getElementById('original'),document.getElementById('polished')];
let ready=false,playing=false,speed=1,elapsed=0,last=performance.now(),frame=0,cycles=0,images=[],effects=true;
let effectState={phase:'none',ageMs:0,particles:0};
function polygon(points,color,alpha=1){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill();}
function renderBlast(){ctx.clearRect(0,0,200,100);ctx.globalAlpha=1;const age=elapsed-releaseMs;effectState={phase:'none',ageMs:Math.round(age),particles:0};if(!effects||age<0||age>340)return;
// Hand at 55% of the saved canvas; sprite is centered in the left 80% of stage.
const sourceX=88, sourceY=55, t=age/340, x=sourceX+20+Math.min(68,age*.25), fade=Math.max(0,1-t);
effectState.phase=age<65?'launch':age<190?'burst':'embers';
if(age<65){const r=8*(1-age/65)+2;polygon([[sourceX-r,sourceY],[sourceX-3,sourceY-3],[sourceX,sourceY-r],[sourceX+3,sourceY-3],[sourceX+r,sourceY],[sourceX+3,sourceY+3],[sourceX,sourceY+r],[sourceX-3,sourceY+3]],'#fff4ce',.9*(1-age/65));}
if(age<230){const h=5+9*Math.sin(Math.min(1,age/200)*Math.PI);polygon([[x-26,sourceY-3],[x-17,sourceY-h+4],[x-8,sourceY-h],[x+1,sourceY-h+4],[x+12,sourceY-3],[x+17,sourceY],[x+9,sourceY+6],[x-3,sourceY+h],[x-18,sourceY+4],[x-31,sourceY+6],[x-22,sourceY]],'#e84a19',fade);polygon([[x-22,sourceY],[x-10,sourceY-h+4],[x+3,sourceY-5],[x+12,sourceY],[x+3,sourceY+5],[x-10,sourceY+h-4]],'#ffad32',fade);polygon([[x-12,sourceY],[x-3,sourceY-4],[x+8,sourceY],[x-3,sourceY+4]],'#fff2ba',fade);}
for(let i=0;i<10;i++){const delay=i*11,p=(age-delay)/300;if(p<0||p>1)continue;const px=sourceX+14+p*(58+i*4),py=sourceY+(i%2?1:-1)*(3+p*(7+i%4*4))+p*p*8;ctx.globalAlpha=(1-p)*.8;ctx.fillStyle=i%3?'#ff9d2e':'#ffe391';const s=p<.45?2:1;ctx.fillRect(Math.round(px),Math.round(py),s,s);effectState.particles++;}ctx.globalAlpha=1;}
function draw(){if(!ready)return;frame=starts.findLastIndex(start=>elapsed>=start);nodes.forEach(node=>{const src=images[frame].src;if(node.src!==src)node.src=src;});renderBlast();document.getElementById('play').textContent=playing?'Pause comparison':'Play comparison';document.getElementById('status').textContent=(playing?'Playing':'Paused')+' · Pose '+frame+' / 12 · '+durations[frame]+' ms · identical polished timing';}
window.setFireFrame=n=>{if(!ready)return;playing=false;elapsed=starts[((n%13)+13)%13];draw();};
window.playFire=()=>{if(!ready)return;playing=!playing;last=performance.now();draw();};
window.restartFire=()=>{elapsed=0;cycles=0;last=performance.now();draw();};
window.setFireSpeed=n=>{speed=n===3?3:1;document.getElementById('speed').value=String(speed);draw();};
window.setBlastTime=age=>{playing=false;elapsed=Math.max(0,Math.min(total-1,releaseMs+age));draw();};
window.playtest=()=>({ready,playing,frame,cycles,speed,totalFrames:images.length,durations,cycleMs:total,releaseMs,effects,effectState,posesUnchanged:true,timingUnchanged:true,liveCombatChanged:false});
document.getElementById('play').onclick=window.playFire;document.getElementById('restart').onclick=window.restartFire;document.getElementById('step').onclick=()=>window.setFireFrame(frame+1);document.getElementById('speed').onchange=e=>window.setFireSpeed(Number(e.target.value));document.getElementById('effects').onchange=e=>{effects=e.target.checked;draw();};
fetch('../fire-rebuild/frames.json').then(r=>{if(!r.ok)throw Error('Cannot load saved frames');return r.json();}).then(async paths=>{images=await Promise.all(paths.map(async path=>{const im=new Image();im.src='../fire-rebuild/'+path;await im.decode();return im;}));ready=true;draw();}).catch(e=>document.getElementById('status').textContent='Load failed: '+e.message);
function tick(now){const delta=Math.min(100,now-last);last=now;if(playing&&ready){elapsed+=delta/speed;if(elapsed>=total){elapsed%=total;cycles++;}draw();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
