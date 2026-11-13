const loadImage=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Cannot load '+src));im.src=src;});
const loadClip=async url=>{const meta=await fetch(url).then(r=>r.json());return {meta,frames:await Promise.all(meta.frames.map(loadImage))};};
const [sword,fist,swordIdle,fistIdle]=await Promise.all([loadClip('./art/riley-four-sword-attack-cleaned.json'),loadClip('./art/riley-fistblade-attack.json'),Promise.all(Array.from({length:33},(_,i)=>loadImage('./art/riley-smooth-idle/'+i+'.png'))),Promise.all(Array.from({length:17},(_,i)=>loadImage('./assets/images/9084b021-f2cd-5215-a73f-8e4c66f2e445/frames/'+i+'.png')))]);
const clips={swords:{...sword,idle:swordIdle,scale:1.65,anchorX:100,anchorY:172,durations:sword.frames.map(()=>100/1.5),reach:220,contactFrames:[8,12,16,20],advanceStart:.10,advanceEnd:.24,returnStart:.77},fist:{...fist,idle:fistIdle,scale:2.2,anchorX:60,anchorY:124,durations:fist.meta.durations,reach:300,contactFrames:[7],advanceStart:.27,advanceEnd:.41,returnStart:.69}};
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const startX=150,targetX=570,ground=285;
let stance='swords',elapsed=0,playing=true,speed=1,last=performance.now(),state={};
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function render(){const c=clips[stance],duration=c.durations.reduce((a,b)=>a+b,0),p=Math.min(1,elapsed/duration);let frame=0,t=Math.min(elapsed,duration-.001);while(frame<c.frames.length-1&&t>=c.durations[frame])t-=c.durations[frame++];
const finished=elapsed>=duration;
const advance=ease((p-c.advanceStart)/(c.advanceEnd-c.advanceStart)),retreat=ease((p-c.returnStart)/(1-c.returnStart));const x=finished?startX:startX+c.reach*advance*(1-retreat);
const contact=c.contactFrames.includes(frame)&&!finished;const hits=c.contactFrames.filter(f=>f<=frame).length;
const phase=finished?'Back at start':p<c.advanceStart?'Wind-up':p<c.advanceEnd?'Advance':p<c.returnStart?(contact?'Contact':'Strike / follow-through'):'Return';
ctx.fillStyle='#192537';ctx.fillRect(0,0,800,320);ctx.fillStyle='#213349';ctx.fillRect(0,ground,800,35);ctx.strokeStyle='#536b7f';ctx.beginPath();ctx.moveTo(0,ground+.5);ctx.lineTo(800,ground+.5);ctx.stroke();
ctx.setLineDash([4,5]);ctx.strokeStyle='#69cbbb';ctx.beginPath();ctx.moveTo(startX,80);ctx.lineTo(startX,ground);ctx.stroke();ctx.setLineDash([]);
ctx.font='13px system-ui';ctx.fillStyle='#81e6d9';ctx.fillText('START / RETURN',startX-55,309);ctx.fillStyle='#b9cad9';ctx.fillText('PRACTICE ENEMY',targetX-48,57);
const recoil=contact?8:0;ctx.save();ctx.translate(targetX+recoil,0);ctx.fillStyle=contact?'#ffe4a2':'#876c59';ctx.fillRect(-9,111,29,118);ctx.beginPath();ctx.arc(5,94,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#546681';ctx.fillRect(-5,229,9,ground-229);ctx.fillRect(14,229,9,ground-229);ctx.fillStyle='#d4b780';ctx.fillRect(-14,127,43,4);ctx.fillRect(-14,189,43,4);ctx.restore();
ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,ground,31,5,0,0,Math.PI*2);ctx.fill();
let image=c.frames[frame],ax=c.anchorX,ay=c.anchorY,scale=c.scale;
if(finished){image=c.idle[Math.floor((elapsed-duration)/100)%c.idle.length];if(stance==='swords'){ax=60;ay=124;scale=1.65;}}
ctx.drawImage(image,Math.round(x-ax*scale),Math.round(ground-ay*scale),image.width*scale,image.height*scale);
if(contact){const cy=stance==='fist'?124:155;ctx.strokeStyle='#ffe59b';ctx.lineWidth=3;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(targetX+Math.cos(a)*9,cy+Math.sin(a)*9);ctx.lineTo(targetX+Math.cos(a)*22,cy+Math.sin(a)*22);ctx.stroke();}ctx.fillStyle='#ffe59b';ctx.font='bold 14px system-ui';ctx.fillText('CONTACT',targetX+35,cy-10);}
document.querySelector('#status').textContent=`${stance==='swords'?'Four Sword':'Fistblade'} · ${phase} · ${finished?'Idle':`Frame ${frame+1}/${c.frames.length}`} · Forward ${Math.round(x-startX)} px${finished?' · Returned exactly to start':''}`;
document.querySelector('#scrub').value=String(Math.round(p*1000));
state={stance,phase,frame:frame+1,playing,speed,elapsedMs:Math.round(elapsed),attackDurationMs:Math.round(duration),rileyX:Math.round(x*100)/100,startX,offset:Math.round((x-startX)*100)/100,targetX,contact,hitCount:hits,returned:finished&&x===startX,loaded:c.frames.length,liveGameChanged:false};}
function reset(s=stance){stance=s;elapsed=0;document.querySelector('#swords').setAttribute('aria-pressed',String(s==='swords'));document.querySelector('#fist').setAttribute('aria-pressed',String(s==='fist'));render();}
document.querySelector('#swords').onclick=()=>reset('swords');document.querySelector('#fist').onclick=()=>reset('fist');document.querySelector('#replay').onclick=()=>{reset();playing=true;document.querySelector('#play').textContent='Pause';};document.querySelector('#play').onclick=e=>{playing=!playing;e.target.textContent=playing?'Pause':'Play';};document.querySelector('#speed').onchange=e=>speed=Number(e.target.value);document.querySelector('#scrub').oninput=e=>{playing=false;document.querySelector('#play').textContent='Play';elapsed=Number(e.target.value)/1000*clips[stance].durations.reduce((a,b)=>a+b,0);render();};
window.playtest=()=>state;window.setMovementDemo=(s,progress)=>{reset(s);playing=false;document.querySelector('#play').textContent='Play';elapsed=Math.max(0,Math.min(1,progress))*clips[stance].durations.reduce((a,b)=>a+b,0);render();return state;};
function loop(now){const dt=Math.min(100,now-last);last=now;if(playing){elapsed+=dt*speed;const duration=clips[stance].durations.reduce((a,b)=>a+b,0);if(elapsed>duration+900&&document.querySelector('#repeat').checked)elapsed=0;}render();requestAnimationFrame(loop);}render();requestAnimationFrame(loop);
