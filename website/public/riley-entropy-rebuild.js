// Rebuilt review-only Entropy: genuine body poses and a snappy overhead cut.
const load=async src=>{const im=new Image();im.src=src;await im.decode();return im;};
const bodyMeta=await fetch('./art/riley-entropy-rebuild.json').then(r=>r.json());
const bodies=await Promise.all(bodyMeta.frames.map(load));
const swords=await Promise.all([1,2,3,4].map(i=>load(`./art/riley-entropy-parts/sword${i}.png`)));
export const performanceFrames=32;
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const poses=[0,1,2,3,4,5,6,7,8,9,11,13,14,14,14,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,0,0];
export function performanceState(f){return {stage:f<7?'Focused power-up · blades converge':f<10?'Hair rising · coiled wind-up':f<13?'Explosive overhead crescent':f<18?'Impact · committed lunge':f<24?'Follow-through · four blades separate':'Controlled recovery',contact:f>=12,formation:f<7||f>=22?4:1,facing:'east',expression:'focused controlled anger, closed mouth',bodyFrame:poses[f],poweringUp:f<22,hair:'white, lifted upward',backgroundLines:false,simultaneousPowerAndSlash:f>=10&&f<18,gameIntegration:false};}
// A deliberate gather, near-instant cut, one heavy contact beat, then a clean settle.
export function giantDuration(f){return f<7?30:f<10?25:f<12?16:f===12?105:f<18?19:f<24?24:28;}
// Grip follows Riley's actual fist in each body frame (smoothed so it never drifts off her hand).
const hands=bodyMeta.hands||[];
function hand(f){const pts=[f-1,f,f+1].map(i=>hands[poses[Math.max(0,Math.min(performanceFrames-1,i))]]||[91,65]);return [pts.reduce((a,p)=>a+p[0],0)/3,pts.reduce((a,p)=>a+p[1],0)/3+28];}
function drawBody(c,f){const im=bodies[Math.min(poses[f],bodies.length-1)];c.drawImage(im,0,28);}
// Blade points up at angle zero; downward sweep travels clockwise into the target.
function blade(c,f,angle,alpha=1){const[hx,hy]=hand(f);c.save();c.globalAlpha=alpha;c.translate(Math.round(hx),Math.round(hy));c.rotate(angle);c.drawImage(swords[0],-swords[0].width*.9,-swords[0].height*1.66,swords[0].width*1.8,swords[0].height*1.8);c.restore();}
function crescent(c,f,progress,alpha){
 c.save();c.globalAlpha=alpha;
 const[hx,hy]=hand(f),cx=Math.round(hx),cy=Math.round(hy)-2,start=-1.86,end=mix(-1.2,1.05,progress);
 const ribbon=(outer,inner,color)=>{c.fillStyle=color;c.beginPath();for(let i=0;i<=36;i++){const t=i/36,a=mix(start,end,t),r=outer;c.lineTo(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*.76));}for(let i=36;i>=0;i--){const t=i/36,a=mix(start,end,t),r=outer-(outer-inner)*Math.sin(t*Math.PI*.92);c.lineTo(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*.76));}c.closePath();c.fill();};
 ribbon(103,47,'#b8661f');ribbon(100,57,'#f4a52b');ribbon(97,72,'#ffe27c');ribbon(95,88,'#fff9dc');c.restore();
}
function impact(c,f){
 if(f<12||f>18)return;const age=f-12;
 c.save();c.globalAlpha=(1-age/7)*.8;
 // A single compact contact core and expanding pressure ring, not scattered streaks.
 c.strokeStyle='#ffe5a2';c.lineWidth=f===12?4:2;c.beginPath();c.ellipse(208,110,8+age*3,13+age*2,0,0,Math.PI*2);c.stroke();
 if(age<2){c.fillStyle='#fff9e7';c.beginPath();c.ellipse(208,110,9-age*3,15-age*4,-.35,0,Math.PI*2);c.fill();}
 c.restore();
}
function enemy(c,f){const hit=f>=12&&f<19,recoil=f<12?0:f<16?1-Math.pow(1-clamp((f-11)/4),3):1-smooth((f-16)/15),x=215+recoil*19;c.save();c.translate(x,149);c.rotate(recoil*.13);c.fillStyle='#192134';c.fillRect(-14,2,28,3);c.fillStyle=hit?'#decaa1':'#63758e';c.fillRect(-9,-47,18,16);c.fillRect(-13,-30,26,27);c.fillRect(-10,-4,7,7);c.fillRect(4,-4,7,7);c.fillStyle='#29364e';c.fillRect(-6,-42,13,4);c.fillStyle='#c38756';c.fillRect(-19,-27,15,22);c.fillStyle='#ecbc69';c.fillRect(-13,-24,3,16);c.restore();}
export function drawPerformance(c,f){
 c.clearRect(0,-24,256,208);enemy(c,f);
 const origins=[[30,36],[93,43],[12,57],[108,64]];
 if(f<7||f>=22){const t=f<7?smooth(f/7):1-smooth((f-22)/9);swords.forEach((im,i)=>{c.save();c.globalAlpha=1-t*.8;{const[hx,hy]=hand(f);c.translate(mix(origins[i][0]+im.width/2,hx,t),mix(origins[i][1]+im.height*.88,hy,t));};c.drawImage(im,-im.width/2,-im.height*.88);c.restore();});}
 drawBody(c,f);
 if(f>=6&&f<24){const a=f<10?mix(-.1,-.8,smooth((f-6)/3)):f<13?mix(-.8,2.5,smooth((f-9)/3)):mix(2.5,2.65,smooth((f-13)/10));
 if(f>=10&&f<17)crescent(c,f,f<13?smooth((f-9)/3):1,f<13?1:1-smooth((f-12)/5));
 const alpha=f<7?(f-5)/2:f>16?1-smooth((f-16)/7):1;blade(c,f,a,alpha);
 }
 impact(c,f);
}
