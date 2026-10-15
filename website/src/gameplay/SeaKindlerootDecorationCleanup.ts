import Phaser from "phaser";

/** Replace baked-in brass ornaments, leaving the immutable source art intact. */
export function kindlerootChristmasTexture(scene: Phaser.Scene): string {
  const key = "kindleroot-christmas-deck-v1";
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get("kindleroot-deck").getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Source-pixel windows around hanging charms and living-trunk bands only.
  // Deck cracks, rail ropes, mast fittings and structural rigging are excluded.
  const regions = [
    [198, 73, 70, 77], [348, 82, 39, 87], [389, 61, 20, 55],
    [499, 24, 76, 96], [575, 22, 65, 100], [640, 22, 40, 57],
    [269, 175, 93, 23], [264, 205, 93, 36], [610, 120, 70, 46],
    [655, 300, 25, 61],
  ];
  let replaced = 0;
  for (const [x, y, width, height] of regions) {
    for (let py = y; py < y + height; py++) for (let px = x; px < x + width; px++) {
      const i = (py * canvas.width + px) * 4;
      const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
      // Brass/yellow highlights and ochre ornament shadows, not red foliage.
      if (r < 87 || g < 64 || r < g * 0.94 || r > g * 1.62 || g < b * 1.28 || r - b < 35) continue;
      const shade = (r + g) / 2;
      image.data[i] = Math.round(13 + shade * 0.09);
      image.data[i + 1] = Math.round(28 + shade * 0.17);
      image.data[i + 2] = Math.round(22 + shade * 0.10);
      replaced++;
    }
  }
  ctx.putImageData(image, 0, 0);
  scene.textures.addCanvas(key, canvas);
  scene.registry.set("kindlerootDecorationCleanup", { replacedPixels: replaced, regions: regions.length, sourceUnchanged: true });
  return key;
}
