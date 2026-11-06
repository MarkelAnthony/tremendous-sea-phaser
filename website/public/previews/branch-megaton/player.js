const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),seek=document.querySelector('#seek'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
const fps=12,impactFrame=23;let frames=[],enemies=[],time=0,last=0,playing=true;
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Unable to load '+src));im.src=src;});
const solar=new Image();solar.src='./sun.png';
function draw(){if(!frames.length||!enemies.length)return;const layout=arenaLayout();if(!layout)return;const frame=Math.min(32,Math.floor(time*fps/1000)),age=frame-impactFrame;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,1000,700);
const reaction=age<0?0:Math.min(7,1+age),recoil=age<0?0:Math.min(45,Math.max(0,age)*7),s=layout.scale;
const target=Object.values(battle.enemySprites)[0]?.container;if(target){target.x=layout.enemyX+recoil;const body=target.list.find(o=>o.type==='Rectangle');if(body)body.setFillStyle(age===0?0xffefba:0xd9534f);}
const im=frames[frame],x=layout.x-105*s,y=layout.feet-183*s;
// Split at the top of the glove: keep the approved arm/throw, give the sun its own room.
if(frame>=3&&frame<=18){ctx.drawImage(im,0,76,256,116,x,y+76*s,256*s,116*s);}
else ctx.drawImage(im,x,y,256*s,192*s);
let diameter=0,sunX=0,sunY=0;
if(frame>=3&&frame<=21){const p=Math.min(1,(frame-3)/13);diameter=18+166*Math.pow(p,1.8);if(frame>16)diameter*=1+0.015*Math.sin(frame*2);const palmX=layout.x+22*s,palmY=y+79*s;sunX=palmX;sunY=palmY-diameter/2+7;
// From the wind-up onward the generated sun is behind Branch's throwing arm.
if(frame>=19){sunX-= (frame-18)*10;sunY+= (frame-18)*8;}
}else if(frame===22){diameter=232;sunX=layout.x+170;sunY=layout.enemyY-48;}
else if(frame>=23&&frame<=28){diameter=240+(frame-23)*12;sunX=layout.enemyX+recoil;sunY=layout.enemyY-25;ctx.globalAlpha=1-(frame-23)/6;}
if(diameter&&solar.complete){ctx.drawImage(solar,sunX-diameter/2,sunY-diameter/2,diameter,diameter);ctx.globalAlpha=1;}
window.sunReview={diameter:Math.round(diameter),center:{x:sunX,y:sunY},bounds:{top:sunY-diameter/2,bottom:sunY+diameter/2},branchHeight:176,layout,actualBattleRenderer:true};
seek.value=String(frame);status.textContent=`Frame ${frame+1} / 33 · ${playing?'Playing':'Paused'}`;document.querySelector('#phase').textContent=frame<5?'One hand rises · sun gathers':frame<18?'One-handed overhead sun charge':frame<22?'Wind-up and throw':frame<23?'Sun released':frame<30?'Solar impact and enemy recoil':'Recovery to guard';window.previewState={ready:true,frame,frames:33,playing,enemyReady:true,enemyHit:age>=0,enemyReaction:reaction,recoil,impactFrame,combatChanged:false,source:'branch-approved-redraw.png',generatedMotion:true,attack:'Fireball Candy – Megaton'};}
window.seekPreview=n=>{playing=false;time=Math.max(0,Math.min(32,Number(n)))*1000/fps;pause.textContent='Play';draw();};window.playtest=()=>window.previewState||{ready:false};pause.onclick=()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';};document.querySelector('#replay').onclick=()=>{time=0;playing=true;pause.textContent='Pause';};seek.oninput=()=>window.seekPreview(seek.value);document.querySelector('#previous').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)-1);document.querySelector('#next').onclick=()=>window.seekPreview(Math.floor(time*fps/1000)+1);
Promise.all([Promise.all(Array.from({length:33},(_,i)=>load(`./drawn/${i}.png`))),Promise.all(Array.from({length:8},(_,i)=>load(`../branch-haymaker/opponent/${i}.png`)))]).then(([a,b])=>{frames=a;enemies=b;draw();}).catch(e=>{status.textContent=e.message;window.previewState={ready:false,error:e.message};});
function tick(now){if(last&&playing&&frames.length)time=(time+Math.min(80,now-last)*Number(document.querySelector('#speed').value))%(33*1000/fps+750);last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
