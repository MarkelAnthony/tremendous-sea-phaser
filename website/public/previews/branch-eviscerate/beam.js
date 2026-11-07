// Draw at Branch's native pixel resolution, then enlarge with nearest-neighbour.
// A stable fire core with two travelling helical ribbons, not a soft particle cloud.
const beamLayer=document.createElement('canvas');beamLayer.width=700;beamLayer.height=430;
const fire=beamLayer.getContext('2d');
function paintFireBeam(ctx,start,end,frame,amount,scale){
 if(amount<=0)return null;
 fire.clearRect(0,0,700,430);
 const dx=(end.x-start.x)/scale,dy=(end.y-start.y)/scale,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
 const travel=Math.min(1,amount*1.7),length=len*travel;
 const ox=28,oy=32;
 function dot(t,n,r,color){const x=Math.round(ox+ux*t+nx*n),y=Math.round(oy+uy*t+ny*n);fire.fillStyle=color;fire.fillRect(x-r,y-r,r*2+1,r*2+1);}
 const phase=frame*.72;
 // Dark red silhouette, orange mantle, gold flame and warm ivory heart.
 for(let t=0;t<length;t+=1){const taper=Math.min(1,t/10,(length-t)/12);const w=Math.max(1,Math.round((6+Math.sin(t*.19-phase)*1.3)*taper*amount));dot(t,0,w+2,'#8d2926');dot(t,0,w,'#e95520');dot(t,0,Math.max(1,w-2),'#ffad32');dot(t,0,Math.max(0,w-4),'#ffe589');}
 // The paired spirals advance toward the target; no whole-beam rotation.
 for(let strand=0;strand<2;strand++)for(let t=5;t<length-5;t+=1){const angle=t*.13-phase+strand*Math.PI;const n=Math.sin(angle)*9*amount;const front=Math.cos(angle)>0;dot(t,n,2,front?'#f47b24':'#a53b25');if(front)dot(t,n-1,1,'#ffd05b');}
 // Small tongues trail along the same axis, keeping a coherent narrow outline.
 for(let i=0;i<13;i++){const t=(i*23+frame*6)%Math.max(1,length);const n=Math.sin(i*2.7+phase)*12*amount;dot(t,n,1,i%3?'#f47b24':'#ffcb52');}
 ctx.drawImage(beamLayer,start.x-ox*scale,start.y-oy*scale,700*scale,430*scale);
 return {start,end,length:length*scale,width:28*scale*amount};
}
