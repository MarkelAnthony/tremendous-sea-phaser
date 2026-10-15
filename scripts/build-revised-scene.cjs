const fs = require('fs');
const { PNG } = require('../website/node_modules/pngjs');
const dir = 'website/public/previews';
const read = p => PNG.sync.read(fs.readFileSync(p));
function blank(w,h){const p=new PNG({width:w,height:h});p.data.fill(255);return p;}
function paste(dst,src,x,y,w,h){for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=x+i,dy=y+j;if(dx<0||dy<0||dx>=dst.width||dy>=dst.height)continue;const s=(Math.floor(j*src.height/h)*src.width+Math.floor(i*src.width/w))*4,d=(dy*dst.width+dx)*4,a=src.data[s+3]/255;for(let c=0;c<3;c++)dst.data[d+c]=Math.round(src.data[s+c]*a+dst.data[d+c]*(1-a));}}
function trim(src){let x0=src.width,y0=src.height,x1=0,y1=0;for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++)if(src.data[(y*src.width+x)*4+3]>100){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}const out=new PNG({width:x1-x0,height:y1-y0});PNG.bitblt(src,out,x0,y0,out.width,out.height,0,0);return out;}
function rect(dst,x,y,w,h,color){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const d=(j*dst.width+i)*4;dst.data[d]=color[0];dst.data[d+1]=color[1];dst.data[d+2]=color[2];dst.data[d+3]=255;}}
const paths={currentBg:'assets/images/3fd01aa3-ba6b-5567-a564-5b0cb564bfe6/image.png',revisedBg:'assets/images/a5b1f481-08be-5f2d-a4a3-d472ce8e1799/image.png',currentBranch:'assets/images/a0a63217-752b-5178-b8fb-719193036490/image.png',revisedBranch:'assets/images/3f51ff0b-920e-56e5-bad7-71b015b56042/frames/2.png'};
for(const variant of ['current','revised']){const p=blank(1000,494);paste(p,read(paths[variant+'Bg']),0,0,1000,494);const sprite=trim(read(paths[variant+'Branch']));const h=176,w=Math.round(sprite.width*h/sprite.height);paste(p,sprite,300-Math.round(w/2),355-h,w,h);rect(p,658,203,114,154,[238,243,247]);rect(p,660,205,110,150,[217,83,79]);fs.writeFileSync(`${dir}/fight-layout-${variant}-v4.png`,PNG.sync.write(p));}
fs.writeFileSync(`${dir}/fight-layout-v4.json`,JSON.stringify({previewOnly:true,branch:{x:300,feetY:355,visibleHeight:176},enemy:{x:715,feetY:355,width:110,height:150,art:'Existing live placeholder; unchanged'},background:paths.revisedBg},null,2));
console.log('Wrote preview only; live combat unchanged.');
