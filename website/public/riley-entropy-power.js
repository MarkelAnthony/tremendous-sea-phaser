// Preview-only power-up performance, composited at the existing native scale.
const pose=new Image();pose.src='./art/riley-entropy-focused-east.png';
await pose.decode();
export function powerState(f){return {screaming:false,facing:'east',backgroundLines:false,expression:'controlled anger, closed mouth, focused glare',poweringUp:f>=5&&f<23,hair:'white, lifted upward',bodyMotion:'brace, recoil, tremble, release'};}
export function drawPowerBody(c,f){
 const strength=f<5?f/5:f<17?1:Math.max(0,1-(f-17)/7);
 const shake=f>=5&&f<21?(f%2?1:-1):0;
 c.save();c.translate(shake,0);
 // Slight compression on the brace, then a rising chest/head while feet stay planted.
 for(let y=0;y<128;y++){
 const head=Math.max(0,1-y/65),rise=Math.round(strength*2*head);
 const flutter=y>65&&y<108?Math.round(Math.sin(f*1.9+y*.32)*strength):0;
 c.drawImage(pose,0,y,128,1,flutter,28+y-rise,128,1);
 }
 c.restore();
}
export function drawPowerAura(c,f){
 const k=Math.sin(Math.min(1,f/23)*Math.PI);if(k<=0)return;
 c.save();c.globalAlpha=.25+k*.35;c.strokeStyle=f%3?'#ffd34d':'#fff4b0';c.lineWidth=2;
 for(let side=-1;side<=1;side+=2){c.beginPath();for(let i=0;i<10;i++){const x=66+side*(24+Math.sin(i*2+f)*5),y=148-i*13;if(!i)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke()}
 c.globalAlpha=.9*k;c.strokeStyle='#fff3ad';c.lineWidth=1;
 for(let j=0;j<3;j++){const x=32+j*33+(f%3)*2,y=46+(j*37+f*7)%80;c.beginPath();c.moveTo(x,y+20);c.lineTo(x+7,y+7);c.lineTo(x+2,y+8);c.lineTo(x+10,y-8);c.stroke()}
 for(let j=0;j<9;j++){c.fillStyle=j%2?'#fff1af':'#eeb243';c.fillRect(30+(j*17)%79,145-(f*9+j*23)%119,1+j%2,3)}
 c.restore();
}
