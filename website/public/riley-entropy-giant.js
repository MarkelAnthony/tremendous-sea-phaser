// Review-only choreography. Original Riley pixels remain at native scale.
import {drawSlash,drawImpact} from './riley-entropy-slash.js';
import {drawPowerBody,powerState} from './riley-entropy-power.js';
const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
const root='./art/riley-entropy-parts/';
const swords=await Promise.all(['sword1.png','sword2.png','sword3.png','sword4.png'].map(n=>image(root+n)));
const origins=[[30,8],[93,15],[12,29],[108,36]];
export const giantFrames=36;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
export function giantState(f){return {stage:f<10?'Four blades converge':f<16?'Giant sword winds back':f<19?'Explosive golden crescent':f<24?'Impact and follow-through':'Four blades reform',contact:f>=19,formation:f<10?4:f<24?1:4};}
export const performanceFrames=giantFrames;
const powerFrame=f=>f<5?f:f<24?5+(f-5)%12:17+(f-24);
export function performanceState(f){return {...giantState(f),...powerState(powerFrame(f)),screaming:false,expression:'controlled focused anger; closed mouth',simultaneousPowerAndSlash:f>=17&&f<=23};}
export function drawPerformance(c,f){drawGiant(c,f);}
export function drawGiant(c,f){
 c.clearRect(0,0,256,160);
 // A visible practice enemy, with a shield and recoil, not a gameplay actor.
 const hit=f>=19&&f<29;const recoil=hit?Math.sin((f-19)/10*Math.PI)*11:0;
 c.save();c.translate(215+recoil,149);c.fillStyle='#192134';c.fillRect(-14,2,28,3);c.fillStyle=hit?'#ffe1a1':'#63758e';c.fillRect(-9,-47,18,16);c.fillRect(-13,-30,26,27);c.fillRect(-10,-4,7,7);c.fillRect(4,-4,7,7);c.fillStyle='#29364e';c.fillRect(-6,-42,13,4);c.fillStyle=hit?'#fff5ca':'#c38756';c.fillRect(-19,-27,15,22);c.fillStyle='#ecbc69';c.fillRect(-13,-24,3,16);c.restore();
 // Keep the newly refined focused face through the strike AND recovery.
 drawPowerBody(c,f<31?powerFrame(f):24);
 if(f<10||f>=24){
  const t=f<10?ease(f/9):1-ease((f-24)/11);
  swords.forEach((im,i)=>{const [x,y]=origins[i];c.save();c.globalAlpha=1-t*.5;c.translate(lerp(x+im.width/2,146,t),lerp(y+28+im.height*.88,97,t));c.rotate(t*(i-1.5)*.14);c.drawImage(im,-im.width/2,-im.height*.88);c.restore()});
  if(f>6&&f<10||f>=24&&f<28){c.save();c.globalAlpha=f<10?(f-6)/3:1-(f-24)/4;blade(c,f<10?-.3:2.05,1.8);c.restore()}
 }else{
  const swing=clamp((f-16)/3);
  const angle=f<16?lerp(-.3,-.95,ease((f-10)/5)):lerp(-.95,2.05,1-Math.pow(1-swing,2));
  if(f>=17&&f<=23)drawSlash(c,Math.max(.15,1-Math.pow(1-swing,2)),f<=19?1:1-(f-19)/5);
  if(f>=17&&f<=19){c.save();c.globalAlpha=.22;blade(c,angle-.48,1.8);c.globalAlpha=.12;blade(c,angle-.9,1.8);c.restore()}
  blade(c,angle,1.8);
 }
 if(f>=19&&f<26)drawImpact(c,f-19);
 c.fillStyle='#bdc9db';c.font='5px monospace';c.fillText('PRACTICE ENEMY',185,158);
}
function blade(c,angle,scale){c.save();c.translate(146,97);c.rotate(angle);c.scale(scale,scale);c.drawImage(swords[0],-swords[0].width/2,-swords[0].height*.88);c.restore()}
