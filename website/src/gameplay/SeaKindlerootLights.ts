import Phaser from "phaser";

/** Source-art coordinates, transformed with the 680×381 Kindleroot backdrop. */
export function addKindlerootLights(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  g.setScale(1000 / 680, 494 / 381);
  const colors = [0xff414c, 0x42ef8c, 0x49b5ff, 0xffe56b];
  let count = 0;
  const bulb = (x: number, y: number): void => {
    const color = colors[count++ % colors.length];
    g.fillStyle(color, 0.12); g.fillCircle(x, y + 4, 8);
    g.fillStyle(color, 0.25); g.fillCircle(x, y + 4, 5);
    g.fillStyle(0x15382a); g.fillRect(x - 1.8, y - 1, 3.6, 3);
    g.lineStyle(0.8, 0x143025); g.strokeEllipse(x, y + 4, 4.8, 7);
    g.fillStyle(color); g.fillEllipse(x, y + 4, 4.8, 7);
    g.fillStyle(0xfffff0); g.fillRect(x - 1, y + 2, 1, 2.5);
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
  // Hanging decorations beneath the two crowns (not the ship's rigging).
  [
    [[292,60],[288,90],[292,122]], [[330,55],[335,100],[332,140]],
    [[370,60],[372,95],[370,130]], [[408,65],[412,100],[410,140]],
    [[450,70],[448,110],[452,150]], [[520,40],[518,75],[522,105]],
    [[555,35],[553,70],[556,100]], [[590,30],[592,60],[590,95]],
    [[625,35],[627,70],[624,105]], [[660,30],[662,65]],
    // Continue the strings across the exposed trunk wraps.
    [[338,146],[348,149],[358,150],[370,149],[380,146],[388,142]],
    [[326,166],[340,170],[352,171],[366,170],[378,167],[390,162]],
    [[626,128],[638,131],[650,132],[662,131],[672,127]],
    [[618,142],[630,145],[643,146],[656,144],[668,140]],
  ].forEach(strand);
  root.add(g);
  root.setData("christmasLights", { visible: true, bulbs: count, renderer: "kindleroot-backdrop-overlay" });
}
