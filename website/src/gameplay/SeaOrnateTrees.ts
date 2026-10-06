import Phaser from "phaser";

/** Ornamental living trees grown through the aft rail, leaving the battle floor open. */
export function drawOrnateTrees(g: Phaser.GameObjects.Graphics): void {
  const trees = [
    { x: 84, y: 228, scale: 1.05, dark: 0x642c62, mid: 0xb84d89, light: 0xf5a2c5 },
    { x: 325, y: 228, scale: 0.86, dark: 0x453374, mid: 0x9370ca, light: 0xd7bcfa },
    { x: 745, y: 228, scale: 0.96, dark: 0x8b3f39, mid: 0xe48451, light: 0xffd68a },
    { x: 928, y: 228, scale: 1.12, dark: 0x20515e, mid: 0x489e94, light: 0xa8e4bc },
  ];
  for (const tree of trees) {
    const { x, y, scale: s } = tree;
    const curve = (points: number[], width: number, color: number, alpha = 1): void => {
      const p = points;
      g.lineStyle(width * s, color, alpha);
      g.beginPath();
      for (let i = 0; i <= 32; i++) {
        const t = i / 32, u = 1 - t;
        const px = x + s * (u*u*u*p[0] + 3*u*u*t*p[2] + 3*u*t*t*p[4] + t*t*t*p[6]);
        const py = y + s * (u*u*u*p[1] + 3*u*u*t*p[3] + 3*u*t*t*p[5] + t*t*t*p[7]);
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokePath();
    };
    // Sculpted root sockets and brass filigree join each tree to the ship.
    g.fillStyle(0x33251e); g.fillEllipse(x, y + 5, 88*s, 20*s);
    g.lineStyle(2, 0xf1ce82); g.strokeEllipse(x, y + 3, 80*s, 16*s);
    const limbs = [
      [0, 0, -27, -42, 25, -73, -2, -139],
      [-5, -49, -41, -61, -40, -90, -65, -108],
      [1, -69, 31, -70, 22, -108, 60, -123],
      [-6, -91, -30, -109, -16, -138, -39, -151],
      [0, -4, -23, -2, -23, 12, -43, 8],
      [0, -4, 27, -10, 23, 12, 46, 8],
    ];
    limbs.forEach((p, i) => {
      const w = i === 0 ? 22 : i < 4 ? 10 : 8;
      curve(p, w + 4, 0x35251f);
      curve(p, w, 0x805237);
      curve(p.map((n, k) => k % 2 === 0 ? n - 3 : n), Math.max(2, w * 0.22), 0xe0af64);
    });
    // Gold spirals wound around the sinuous bark, rather than straight poles.
    curve([-3, -15, 21, -35, -26, -39, -9, -61], 2, 0xffde94);
    curve([-9, -61, 21, -80, -17, -90, 1, -115], 2, 0xffde94);
    // Distinct sweeping crowns built out of leafy sprays, with dark undersides.
    const sprays = [[-59,-109,29],[-38,-139,32],[-4,-154,35],[32,-144,33],[60,-122,28],[-22,-112,29],[20,-116,32]];
    for (const [dx, dy, radius] of sprays) {
      g.fillStyle(tree.dark); g.fillEllipse(x + dx*s, y + (dy+9)*s, radius*2.2*s, radius*1.35*s);
      g.fillStyle(tree.mid); g.fillEllipse(x + dx*s, y + dy*s, radius*2.1*s, radius*1.25*s);
      for (let j = 0; j < 12; j++) {
        const a = j * 2.399 + dx;
        const r = radius * Math.sqrt((j+1)/13);
        const lx = x + (dx + Math.cos(a)*r)*s;
        const ly = y + (dy + Math.sin(a)*r*0.5)*s;
        g.fillStyle(j % 3 === 0 ? tree.light : tree.mid);
        g.fillEllipse(lx, ly - 3*s, (10 + j%4)*s, 6*s);
        if (j % 3 === 0) { g.lineStyle(1, 0xffe6ad, 0.6); g.lineBetween(lx-3*s, ly, lx+3*s, ly-3*s); }
      }
      g.lineStyle(1, 0xffdd91, 0.4);
      g.lineBetween(x+dx*s, y+(dy+10)*s, x+(dx+14)*s, y+(dy-4)*s);
    }
    // Hanging pearl blossoms and tiny carved brass charms.
    for (const [dx, dy] of [[-52,-96],[42,-104],[13,-94]]) {
      const px = x+dx*s, py = y+dy*s;
      g.lineStyle(1, 0xe3bc73, 0.85); g.lineBetween(px, py, px-3*s, py+23*s);
      g.fillStyle(0x62442e); g.fillCircle(px-3*s, py+24*s, 5*s);
      g.fillStyle(0xffdf91); g.fillEllipse(px-3*s, py+23*s, 5*s, 8*s);
      g.fillStyle(0xfff5cf); g.fillCircle(px-4*s, py+21*s, 1.5*s);
    }
  }
}
