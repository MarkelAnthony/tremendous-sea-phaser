const fs = require('fs');
const { PNG } = require('../website/node_modules/pngjs');
const root = 'website/public/previews/branch-defense-healing';
fs.mkdirSync(root, { recursive: true });
const defs = {
  kick: { root: 'assets/images/f041bfc4-31cc-550b-b292-8e66a7ed93ac', count: 13, label: 'Scorch Kick', center: 80, ms: 85 },
  block: { root: 'assets/images/86149684-869b-53a2-8ebf-d75ad3d26299', count: 17, label: 'Fire-wall Block', center: 80, ms: 100 },
  heal: { root: 'assets/images/1c3cac86-717b-5d2f-aa68-cac3db4546ed', count: 17, label: 'Phoenix Healing', center: 128, ms: 110 },
};
const clips = {};
for (const [name, def] of Object.entries(defs)) {
  const files = Array.from({ length: def.count }, (_, i) => `${name}-${i}.png`);
  files.forEach((file, i) => fs.copyFileSync(`${def.root}/frames/${i}.png`, `${root}/${file}`));
  const p = PNG.sync.read(fs.readFileSync(`${root}/${files[0]}`));
  let top = p.height, bottom = 0;
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) if (p.data[(y*p.width+x)*4+3]>100) { top=Math.min(top,y); bottom=Math.max(bottom,y+1); }
  const scale=176/(bottom-top);
  clips[name] = { label: def.label, files, order: files.map((_,i)=>i), ms: def.ms, scale, x: 384-def.center*scale, y: 350-bottom*scale };
}
// Sequential review of the conditional heal-on-defeat behavior, not a combat change.
// Use normalized copies to retain a common planted-foot anchor across both clips.
const comboFiles=[];
for (const name of ['kick','heal']) {
  const c=clips[name];
  for (let i=0;i<c.files.length;i++) {
    const src=PNG.sync.read(fs.readFileSync(`${root}/${c.files[i]}`));
    const out=new PNG({width:384,height:224}); out.data.fill(0);
    const dx=192-defs[name].center, dy=0;
    for(let y=0;y<src.height;y++) for(let x=0;x<src.width;x++) {
      const X=x+dx,Y=y+dy;if(X<0||X>=out.width||Y<0||Y>=out.height)continue;
      src.data.copy(out.data,(Y*out.width+X)*4,(y*src.width+x)*4,(y*src.width+x)*4+4);
    }
    const file=`combo-${comboFiles.length}.png`; fs.writeFileSync(`${root}/${file}`,PNG.sync.write(out));comboFiles.push(file);
  }
}
clips.combo={label:'On defeat: Kick → Phoenix heal (sequence study)', files:comboFiles,order:comboFiles.map((_,i)=>i),ms:100,scale:clips.kick.scale,x:384-192*clips.kick.scale,y:clips.kick.y};
fs.writeFileSync(`${root}/clips.json`,JSON.stringify(clips,null,2));
let html=fs.readFileSync('website/public/previews/branch-redraw-attacks/index.html','utf8');
html=html.replace('Branch · redraw attack studies','Branch · kick, block & phoenix heal')
.replace('Branch · redraw attack preview','Branch · kick, block & phoenix heal')
.replace('Jab and Heavy restyled toward the approved redraw. Fire is a newly generated charge → thrust → flame wave → recovery study inspired by your reference, using a warm fire palette.','New redraw-style studies: a flaming side kick, a defensive fire wall in front of Branch, and blue-and-gold phoenix healing. The fourth preview demonstrates attack first, healing second when a defeat earns healing.')
.replace('These are animation studies, not approved replacements. Check hand attachment, foot stability, flame shape and how closely each frame matches the guard.','Preview only. Planned routing: any attack with “kick” in its name → Kick; Block-granting cards → fire wall; healing cards → phoenix fire. Conditional healing plays only after the attack defeats an enemy. Inspect the silhouette, guard recovery, fire-wall height and phoenix wings before approval.')
.replace('<button data-clip="jab">Jab</button><button data-clip="heavy">Heavy</button><button data-clip="fire">New Fire blast</button>','<button data-clip="kick">Kick</button><button data-clip="block">Fire-wall block</button><button data-clip="heal">Phoenix heal</button><button data-clip="combo">Attack → heal on defeat</button>')
.replaceAll("clip='jab'","clip='kick'").replace("select('jab')","select('kick')")
.replace('height="320"','height="400"').replaceAll('768,320','768,400').replaceAll('0,280,768','0,350,768');
fs.writeFileSync(`${root}/index.html`,html);
console.log('Preview-only files built; live combat unchanged.');
