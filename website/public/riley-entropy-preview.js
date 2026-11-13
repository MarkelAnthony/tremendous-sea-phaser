const loadImage=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Could not load '+src));im.src=src});
const meta=await fetch('./art/riley-entropy-preview.json').then(r=>{if(!r.ok)throw Error('Missing Entropy preview manifest');return r.json()});
const [activation,idle,canonical]=await Promise.all([Promise.all(meta.activation.map(loadImage)),Promise.all(meta.idle.map(loadImage)),Promise.all(Array.from({length:33},(_,i)=>loadImage(`./art/riley-smooth-idle/${i}.png`)))]);
const ctx=document.querySelector('#entropy').getContext('2d'),ref=document.querySelector('#canonical').getContext('2d'),scrub=document.querySelector('#scrub');ctx.imageSmoothingEnabled=false;ref.imageSmoothingEnabled=false;
let phase='activation',frame=0,playing=true,speed=1,elapsed=0,last=performance.now(),refElapsed=0,refFrame=0,activationCompleted=0;
function frames(){return phase==='activation'?activation:idle}
function drawImage(c,im){c.clearRect(0,0,128,128);c.drawImage(im,0,0)}
function draw(){drawImage(ctx,frames()[frame]);drawImage(ref,canonical[refFrame]);scrub.max=frames().length-1;scrub.value=frame;document.querySelector('#phase').textContent=phase==='activation'?'Entropy activation':'Entropy floating-sword idle';document.querySelector('#frame').textContent=`${phase} · frame ${frame+1} / ${frames().length} · identical native pixel scale`;}
function setPhase(p){phase=p;frame=0;elapsed=0;draw()}
function pause(){playing=false;document.querySelector('#pause').textContent='Play'}
document.querySelector('#replay').onclick=()=>{setPhase('activation');playing=true;document.querySelector('#pause').textContent='Pause'};
document.querySelector('#idle').onclick=()=>{setPhase('idle');playing=true;document.querySelector('#pause').textContent='Pause'};
document.querySelector('#pause').onclick=e=>{playing=!playing;e.target.textContent=playing?'Pause':'Play'};
document.querySelector('#step').onclick=()=>{pause();frame=(frame+1)%frames().length;draw()};
document.querySelector('#speed').onchange=e=>{speed=Number(e.target.value)};scrub.oninput=()=>{pause();frame=Number(scrub.value);draw()};
function loop(now){const dt=Math.min(100,now-last);last=now;if(playing){elapsed+=dt*speed;const duration=phase==='activation'?80:100;while(elapsed>=duration){elapsed-=duration;frame++;if(frame>=frames().length){if(phase==='activation'){activationCompleted++;phase='idle'}frame=0}}refElapsed+=dt*speed;while(refElapsed>=100){refElapsed-=100;refFrame=(refFrame+1)%canonical.length}}draw();requestAnimationFrame(loop)}
document.querySelector('#status').textContent=meta.assessment;
window.playtest=()=>({phase,frame,playing,speed,activationCompleted,activationFrames:activation.length,idleFrames:idle.length,nativeSize:[128,128],renderScale:'identical; no frame rescaling',gameIntegration:false,assessment:meta.assessment});
window.entropyFrame=(p,i)=>{pause();phase=p==='idle'?'idle':'activation';frame=Math.max(0,Math.min(frames().length-1,i));elapsed=0;draw();return window.playtest()};draw();requestAnimationFrame(loop);
