import Phaser from "phaser";

/** Source-art coordinates, transformed with the 680×381 Kindleroot backdrop. */
export function addKindlerootLights(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  g.setScale(1000 / 680, 494 / 384);
  const colors = [0xff414c, 0x42ef8c, 0x49b5ff, 0xffe56b];
  let count = 0;
  // Only the tiny light/glow layers breathe; cables and sockets stay solid.
  const twinkles = Array.from({ length: 5 }, () =>
    scene.add.graphics().setScale(1000 / 680, 494 / 384));
  const bulb = (x: number, y: number): void => {
    const color = colors[count++ % colors.length];
    g.fillStyle(color, 0.12); g.fillCircle(x, y + 4, 8);
    g.fillStyle(color, 0.25); g.fillCircle(x, y + 4, 5);
    g.fillStyle(0x15382a); g.fillRect(x - 1.8, y - 1, 3.6, 3);
    g.lineStyle(0.8, 0x143025); g.strokeEllipse(x, y + 4, 4.8, 7);
    g.fillStyle(color); g.fillEllipse(x, y + 4, 4.8, 7);
    g.fillStyle(0xfffff0); g.fillRect(x - 1, y + 2, 1, 2.5);
    const shimmer = twinkles[(count - 1) % twinkles.length];
    shimmer.fillStyle(color, 0.14); shimmer.fillCircle(x, y + 4, 7);
    shimmer.fillStyle(0xffffed, 0.45); shimmer.fillEllipse(x, y + 3, 2, 3);
  };
  const strand = (points: number[][]): void => {
    // An opaque evergreen cable covers the former gold strand, not a new
    // unrelated garland. Bulbs sit on its actual segments.
    g.lineStyle(2.5, 0x173c2d);
    g.beginPath();
    points.forEach(([x, y], i) => { if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
    g.strokePath();
    g.lineStyle(0.65, 0x739778);
    g.beginPath();
    points.forEach(([x, y], i) => { if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
    g.strokePath();
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1], [bx, by] = points[i];
      const n = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / 13));
      for (let j = 0; j < n; j++) {
        const t = (j + 0.5) / n;
        bulb(ax + (bx - ax) * t, ay + (by - ay) * t);
      }
    }
  };
  // Measured source-art positions: replace the pendants themselves, rather
  // than drawing unrelated swags on top of still-gold source pixels.
  const strands = [
    [[207,78],[208,108],[211,139]], [[222,79],[220,112],[222,144]],
    [[237,78],[239,106],[237,138]], [[251,76],[253,105],[254,141]],
    [[264,75],[262,104],[262,134]],
    [[353,87],[356,120],[355,158]], [[371,85],[374,121],[378,162]],
    [[395,65],[397,88],[397,108]],
    [[503,30],[508,64],[516,103]], [[529,29],[534,63],[538,111]],
    [[553,27],[557,58],[566,112]], [[581,26],[584,60],[590,115]],
    [[607,26],[610,60],[617,116]], [[634,27],[635,54],[635,102]],
    [[653,25],[655,49],[660,70]], [[674,25],[674,50],[677,65]],
    [[273,180],[291,188],[313,190],[339,186],[357,180]],
    [[268,211],[289,222],[313,224],[336,217],[351,208]],
    [[270,225],[290,234],[314,236],[338,228],[353,220]],
    [[613,126],[633,136],[654,138],[676,130]],
    [[613,148],[636,159],[658,160],[677,149]],
    [[660,303],[675,315],[660,329],[676,341],[660,354]],
  ];
  strands.forEach(strand);
  root.add([g, ...twinkles]);
  const tweens = twinkles.map((light, index) => scene.tweens.add({
    targets: light, alpha: { from: 0.1, to: 0.8 },
    duration: 1900 + index * 310, delay: index * 430,
    ease: "Sine.easeInOut", yoyo: true, repeat: -1,
  }));
  root.once("destroy", () => tweens.forEach((tween) => tween.remove()));
  root.setData("christmasLights", { visible: true, bulbs: count, strands: strands.length,
    twinkling: true, renderer: "kindleroot-backdrop-overlay" });
}
