const fs = require('fs');
const { PNG } = require('../website/node_modules/pngjs');
const root = 'website/public/previews/branch-redraw-movement';
fs.mkdirSync(root, { recursive: true });
const definitions = {
  idle: { asset: 'assets/images/e7c79c5d-5345-5eaf-a8b4-36276753ee27', count: 17, label: 'Boxing-sway idle', ms: 85 },
  shuffle: { asset: 'assets/images/d3d2d7f8-1e78-5bad-b90e-037c5bb4ed52', count: 9, label: 'Guarded shuffle', ms: 110 },
};
const clips = {};
for (const [key, def] of Object.entries(definitions)) {
  const files = [];
  for (let i = 0; i < def.count; i++) {
    const file = `${key}-${i}.png`;
    fs.copyFileSync(`${def.asset}/frames/${i}.png`, `${root}/${file}`);
    files.push(file);
  }
  const p = PNG.sync.read(fs.readFileSync(`${root}/${files[0]}`));
  let left = p.width, right = 0, top = p.height, bottom = 0;
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    if (p.data[(y * p.width + x) * 4 + 3] > 100) {
      left = Math.min(left, x); right = Math.max(right, x + 1);
      top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
    }
  }
  const scale = 176 / (bottom - top);
  clips[key] = { label: def.label, files, order: files.map((_, i) => i), ms: def.ms, scale, x: 384 - (left + right) / 2 * scale, y: 280 - bottom * scale };
}
fs.writeFileSync(`${root}/clips.json`, JSON.stringify(clips, null, 2));
let html = fs.readFileSync('website/public/previews/branch-redraw-attacks/index.html', 'utf8');
html = html.replaceAll('redraw attack', 'redraw movement')
  .replace('Jab and Heavy restyled toward the approved redraw. Fire is a newly generated charge → thrust → flame wave → recovery study inspired by your reference, using a warm fire palette.', 'Two movement studies using Branch’s approved redraw: a planted boxing-sway idle and a guarded shuffle. The boxing reference informs the knee bend, weight shift, shoulder roll and protective guard; Branch keeps his own design.')
  .replace('These are animation studies, not approved replacements. Check hand attachment, foot stability, flame shape and how closely each frame matches the guard.', 'Preview only — no live character animation changes. Check foot stability, guard shape, rhythmic sway, fire on both hands and feet, and the transition back to the starting pose. The original guard is included as frame 1 for comparison.')
  .replace('<button data-clip="jab">Jab</button><button data-clip="heavy">Heavy</button><button data-clip="fire">New Fire blast</button>', '<button data-clip="idle">Boxing-sway idle</button><button data-clip="shuffle">Guarded shuffle</button>')
  .replaceAll("clip='jab'", "clip='idle'")
  .replace("select('jab')", "select('idle')")
  .replace('Branch attack preview', 'Branch boxing movement preview');
fs.writeFileSync(`${root}/index.html`, html);
console.log('Created standalone movement preview. No gameplay files modified.');
