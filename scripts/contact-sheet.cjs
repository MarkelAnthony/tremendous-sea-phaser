const {PNG}=require('../website/node_modules/pngjs');const fs=require('fs');
const [dir,count,out]=process.argv.slice(2);const n=+count;const cols=6;
const f0=PNG.sync.read(fs.readFileSync(`${dir}/frames/0.png`));const W=f0.width,H=f0.height;
const rows=Math.ceil(n/cols);const o=new PNG({width:W*cols,height:H*rows});
for(let i=0;i<o.data.length;i+=4){o.data[i]=40;o.data[i+1]=48;o.data[i+2]=64;o.data[i+3]=255;}
for(let k=0;k<n;k++){const p=PNG.sync.read(fs.readFileSync(`${dir}/frames/${k}.png`));const ox=(k%cols)*W,oy=Math.floor(k/cols)*H;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,a=p.data[i+3]/255;const j=((oy+y)*o.width+ox+x)*4;for(let c=0;c<3;c++)o.data[j+c]=o.data[j+c]*(1-a)+p.data[i+c]*a;}
for(let x=0;x<W;x++){const j=((oy)*o.width+ox+x)*4;o.data[j]=90;}}
fs.writeFileSync(out,PNG.sync.write(o));
