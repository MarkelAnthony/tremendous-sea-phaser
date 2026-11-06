const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const seek=document.querySelector('#seek'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
let images=[],opponents=[],time=0,playing=true,last=0;const fps=12;
const impactFrame=11,contact={x:364,y:205};
function drawOpponent(index){
 if(!opponents.length)return;
 const age=index-impactFrame,hit=age>=0;
 const reaction=hit?Math.min(7,1+Math.floor(age/2)):0;
 const image=opponents[reaction],scale=7.5;
 const recoil=hit?Math.min(104,Math.max(0,age-1)*10):0;
 const x=360+recoil,y=365;
 ctx.save();ctx.translate(x,y);
 if(age===0)ctx.filter='brightness(2.5)';
 ctx.drawImage(image,0,-image.height*scale,image.width*scale,image.height*scale);ctx.restore();
}
function drawImpact(index){
 const age=index-impactFrame;if(age<0||age>3)return;
 ctx.save();ctx.translate(contact.x,contact.y);ctx.strokeStyle=age<2?'#fff3b0':'#ffb34e';ctx.lineWidth=age<2?4:2;
 for(let n=0;n<9;n++){const a=n*Math.PI*2/9,r=9+age*5;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+14),Math.sin(a)*(r+14));ctx.stroke();}ctx.restore();
}
Promise.all(Array.from({length:8},(_,n)=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=`./opponent/${n}.png`;}))).then(loaded=>{opponents=loaded;draw();}).catch(error=>{status.textContent='Opponent failed to load: '+error.message;});
function draw(){if(!images.length)return;const index=Math.min(images.length-1,Math.floor(time/1000*fps));ctx.imageSmoothingEnabled=false;ctx.fillStyle='#202634';ctx.fillRect(0,0,640,384);ctx.fillStyle='#657080';ctx.fillRect(0,365,640,1);drawOpponent(index);ctx.drawImage(images[index],64,0,512,384);drawImpact(index);seek.value=String(index);status.textContent=`Frame ${index+1} / ${images.length} · ${playing?'Playing':'Paused'}`;window.previewState={ready:true,frame:index,frames:images.length,playing,combatChanged:false,enemyReady:opponents.length===8,enemyHit:index>=impactFrame,impactFrame,enemyReaction:index>=impactFrame?Math.min(7,1+Math.floor((index-impactFrame)/2)):0,contact,generatedMotion:true,source:'branch-approved-redraw.png',referenceMovement:'Falcon Punch: plant, coil, drive, extension, firebird, recovery'};}
window.seekPreview=frame=>{playing=false;time=Math.max(0,Math.min(images.length-1,Number(frame)))*1000/fps;pause.textContent='Play';draw();};window.playtest=()=>window.previewState||{ready:false};
seek.oninput=()=>window.seekPreview(seek.value);pause.onclick=()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';};document.querySelector('#replay').onclick=()=>{time=0;playing=true;pause.textContent='Pause';};
document.querySelector('#previous').onclick=()=>window.seekPreview(Math.floor(time/1000*fps)-1);document.querySelector('#next').onclick=()=>window.seekPreview(Math.floor(time/1000*fps)+1);
fetch('./generated-frames.json').then(r=>{if(!r.ok)throw Error('Frames unavailable');return r.json();}).then(files=>Promise.all(files.map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=file;})))).then(loaded=>{images=loaded;seek.max=String(images.length-1);draw();}).catch(error=>{status.textContent='Preview could not load: '+error.message;window.previewState={ready:false,error:error.message};});
function tick(now){if(last&&playing&&images.length){const speed=Number(document.querySelector('#speed').value);time=(time+Math.min(now-last,80)*speed)%(images.length*1000/fps+650);}last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
