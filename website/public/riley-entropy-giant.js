// Review-only choreography. Original Riley pixels remain at native scale.
const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
const root='./art/riley-entropy-parts/';
const [body,...swords]=await Promise.all(['body.png','sword1.png','sword2.png','sword3.png','sword4.png'].map(n=>image(root+n)));
const origins=[[30,8],[93,15],[12,29],[108,36]];
export const giantFrames=56;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
export function giantState(f){return {stage:f<16?'Four blades converge':f<24?'One giant golden sword':f<37?'Giant sword slashes enemy':f<44?'Impact and follow-through':'Four blades reform',contact:f>=32,formation:f<16?4:f<44?1:4};}
export function drawGiant(c,f){
 c.clearRect(0,0,256,160);const s=giantState(f);
 // A visible practice enemy, with a shield and recoil, not a gameplay actor.
 const hit=f>=32&&f<44;const recoil=hit?Math.sin((f-32)/12*Math.PI)*7:0;
 c.save();c.translate(215+recoil,149);c.fillStyle='#192134';c.fillRect(-14,2,28,3);c.fillStyle=hit?'#ffe1a1':'#63758e';c.fillRect(-9,-47,18,16);c.fillRect(-13,-30,26,27);c.fillRect(-10,-4,7,7);c.fillRect(4,-4,7,7);c.fillStyle='#29364e';c.fillRect(-6,-42,13,4);c.fillStyle=hit?'#fff5ca':'#c38756';c.fillRect(-19,-27,15,22);c.fillStyle='#ecbc69';c.fillRect(-13,-24,3,16);c.restore();
 c.drawImage(body,0,28);
 if(f<16||f>=44){
  const t=f<16?ease(f/15):1-ease((f-44)/11);
  swords.forEach((im,i)=>{const [x,y]=origins[i];c.save();c.globalAlpha=1-t*.5;c.translate(lerp(x+im.width/2,146,t),lerp(y+28+im.height*.88,97,t));c.rotate(t*(i-1.5)*.14);c.drawImage(im,-im.width/2,-im.height*.88);c.restore()});
  if(f>10&&f<16||f>=44&&f<49){c.save();c.globalAlpha=f<16?(f-10)/5:1-(f-44)/5;blade(c,.0,1.8);c.restore()}
 }else{
  const swing=ease((f-24)/13);blade(c,lerp(-.3,2.65,swing),1.8);
  if(f>=27&&f<=37){c.save();c.strokeStyle='#ffe49c';c.lineWidth=4;c.globalAlpha=.6;c.beginPath();c.arc(146,97,77,-1.7,-1.7+swing*2.9);c.stroke();c.restore()}
 }
 if(hit){c.save();c.translate(211,100);c.strokeStyle='#fff3bb';c.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*5,Math.sin(a)*5);c.lineTo(Math.cos(a)*(14+(f-32)),Math.sin(a)*(14+(f-32)));c.stroke()}c.restore()}
 c.fillStyle='#bdc9db';c.font='5px monospace';c.fillText('PRACTICE ENEMY',185,158);
}
function blade(c,angle,scale){c.save();c.translate(146,97);c.rotate(angle);c.scale(scale,scale);c.drawImage(swords[0],-swords[0].width/2,-swords[0].height*.88);c.restore()}
