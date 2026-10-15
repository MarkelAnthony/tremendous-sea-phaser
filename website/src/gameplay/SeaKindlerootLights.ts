import Phaser from "phaser";

/** Source-art coordinates, transformed with the 680×381 Kindleroot backdrop. */
export function addKindlerootLights(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  g.setScale(1000 / 680, 494 / 381);
  const colors = [0xff414c, 0x42ef8c, 0x49b5ff, 0xffe56b];
  let count = 0;
  // Only the tiny light/glow layers breathe; cables and sockets stay solid.
  const twinkles = Array.from({ length: 5 }, () =>
    scene.add.graphics().setScale(1000 / 680, 494 / 381));
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
    // Previously missed canopy pendants, circular ornaments and lower wraps.
    [[355,55],[352,72],[348,90],[348,105]],
    [[430,60],[435,74],[442,88],[445,100]],
    [[455,45],[460,56],[469,68],[475,75]],
    [[545,45],[549,61],[554,74],[555,85]],
    [[575,55],[579,70],[587,85],[590,95]],
    [[625,50],[629,65],[633,79],[635,90]],
    [[345,73],[339,76],[339,84],[345,88],[351,84],[351,76],[345,73]],
    [[415,78],[409,82],[409,89],[415,93],[421,89],[421,82],[415,78]],
    [[605,53],[599,57],[599,64],[605,68],[611,64],[611,57],[605,53]],
    [[650,68],[644,72],[644,79],[650,83],[656,79],[656,72],[650,68]],
    [[300,155],[316,164],[333,169],[351,168],[370,160]],
    [[320,144],[324,154],[331,157],[339,153],[340,145]],
    [[580,150],[597,158],[616,164],[638,165],[660,157]],
    [[590,175],[606,181],[626,185],[641,183],[650,176]],
    [[630,154],[637,151],[645,156],[641,164],[633,160],[630,154]],
    [[300,96],[312,106],[325,112],[338,108],[351,100],[364,96]],
    [[306,118],[320,124],[334,120]],
    [[628,196],[652,204],[630,214],[650,222],[632,232]],
    [[190,52],[204,60],[216,52]],
    [[232,64],[246,72],[258,64]],
  ].forEach(strand);
  root.add([g, ...twinkles]);
  const tweens = twinkles.map((light, index) => scene.tweens.add({
    targets: light, alpha: { from: 0.1, to: 0.8 },
    duration: 1900 + index * 310, delay: index * 430,
    ease: "Sine.easeInOut", yoyo: true, repeat: -1,
  }));
  root.once("destroy", () => tweens.forEach((tween) => tween.remove()));
  root.setData("christmasLights", { visible: true, bulbs: count, strands: 34,
    twinkling: true, renderer: "kindleroot-backdrop-overlay" });
}
