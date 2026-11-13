// Preview-only pixel-space slash: broad tapered smear, hot rim and flying shards.
export function drawSlash(c,progress,fade=1){
 const cx=146,cy=97,start=-2.5,end=-2.5+progress*3.85;
 c.save();c.globalAlpha=fade;
 function ribbon(outer,inner,color){c.fillStyle=color;c.beginPath();const steps=32;for(let i=0;i<=steps;i++){const t=i/steps,a=start+(end-start)*t,r=outer*(.80+.20*Math.sin(t*Math.PI));const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.58;if(i===0)c.moveTo(x,y);else c.lineTo(x,y)}for(let i=steps;i>=0;i--){const t=i/steps,a=start+(end-start)*t,r=outer-(outer-inner)*Math.sin(t*Math.PI);c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.58)}c.closePath();c.fill()}
 ribbon(87,43,'#b76517');ribbon(83,54,'#f6ad22');ribbon(80,64,'#ffe275');ribbon(78,73,'#fff9d5');
 c.strokeStyle='#fff3ae';c.lineWidth=2;c.beginPath();for(let i=0;i<=16;i++){const a=start+(end-start)*i/16,r=86+(i%2?4:-3);const x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r*.58);if(i===0)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke();
 for(let i=0;i<9;i++){const a=start+(end-start)*(i/10),r=91+(i%3)*5;c.fillStyle=i%2?'#ffd34c':'#fff5c0';c.fillRect(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*.58),i%2?3:2,2)}c.restore();
}
export function drawImpact(c,age){const fade=Math.max(0,1-age/7);c.save();c.globalAlpha=fade;c.translate(211,101);c.fillStyle='#fffbe7';c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?4:19+age*2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.strokeStyle='#ffca38';c.lineWidth=2;for(let i=0;i<9;i++){const a=i*2.4,r=14+age*5;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+7),Math.sin(a)*(r+7));c.stroke()}c.restore()}
export function giantDuration(f){return f<10?40:f<16?45:f<19?28:f===19?75:f<24?30:40}
