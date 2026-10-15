const fs = require('fs');
const { PNG } = require('../website/node_modules/pngjs');
const read = p => PNG.sync.read(fs.readFileSync(p));
const root='website/public/previews';
fs.mkdirSync(root,{recursive:true});
const oldChar=read('assets/images/a0a63217-752b-5178-b8fb-719193036490/image.png');
const oldBg=read('assets/images/3fd01aa3-ba6b-5567-a564-5b0cb564bfe6/image.png');
const newBg=read('assets/images/11a7ff03-d012-5e62-89a0-1bbbc87b5630/image.png');
const candidate=i=>read(`assets/images/3f51ff0b-920e-56e5-bad7-71b015b56042/frames/${i}.png`);
function canvas(w,h){const p=new PNG({width:w,height:h});for(let i=0;i<p.data.length;i+=4){p.data[i]=30;p.data[i+1]=36;p.data[i+2]=44;p.data[i+3]=255;}return p;}
function paste(dst,src,x,y,w=src.width,h=src.height){for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=x+i,dy=y+j;if(dx<0||dy<0||dx>=dst.width||dy>=dst.height)continue;const s=(Math.floor(j*src.height/h)*src.width+Math.floor(i*src.width/w))*4,d=(dy*dst.width+dx)*4,a=src.data[s+3]/255;for(let c=0;c<3;c++)dst.data[d+c]=Math.round(src.data[s+c]*a+dst.data[d+c]*(1-a));}}
function save(n,p){fs.writeFileSync(root+'/'+n,PNG.sync.write(p));}
const pair=canvas(1372,384);paste(pair,oldBg,0,0);paste(pair,oldChar,100,155,192,192);paste(pair,newBg,692,0);paste(pair,candidate(2),792,155,192,192);save('branch-redraw-stage-v3.png',pair);
const details=canvas(1188,396);paste(details,oldChar,6,6,384,384);paste(details,candidate(2),402,6,384,384);paste(details,candidate(3),798,6,384,384);save('branch-redraw-options-v3.png',details);
fs.copyFileSync('assets/images/11a7ff03-d012-5e62-89a0-1bbbc87b5630/image.png',root+'/kindleroot-redraw-v3.png');
console.log('Preview sheets written; no live art changed.');
