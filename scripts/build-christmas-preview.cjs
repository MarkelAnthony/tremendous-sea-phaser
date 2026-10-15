const fs=require('fs');
const {PNG}=require('../website/node_modules/pngjs');
const read=p=>PNG.sync.read(fs.readFileSync(p));
const corrected=read(process.argv[2]);
if(corrected.width!==488||corrected.height!==256)throw new Error('Unexpected correction size');
const scene=read('website/public/previews/fight-layout-revised-v4.png');
// Only replace background pixels in the tree crop; preserve the approved fighter and enemy byte-for-byte.
for(let y=0;y<scene.height;y++)for(let x=0;x<scene.width;x++){
 const sx=Math.floor(x*688/1000),sy=Math.floor(y*384/494);
 if(sx<200||sy>=256)continue;
 if(x>=220&&x<=380&&y>=175&&y<=355)continue;
 if(x>=658&&x<772&&y>=203&&y<357)continue;
 const s=(sy*488+sx-200)*4,d=(y*scene.width+x)*4;
 corrected.data.copy(scene.data,d,s,s+4);
}
fs.writeFileSync('website/public/previews/fight-christmas-v5.png',PNG.sync.write(scene));
console.log('Wrote preview only. No runtime assets changed.');
