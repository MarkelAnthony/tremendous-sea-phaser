import Phaser from "phaser";

/** A reusable, deterministic ink-and-parchment face; no gameplay changes. */
export function drawParchmentCard(scene: Phaser.Scene, x: number, y: number, width: number, height: number, ink: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const left = x - width / 2, top = y - height / 2;
  g.fillStyle(0x000000, 0.35); g.fillRoundedRect(left + 3, top + 5, width, height, 7);
  g.fillGradientStyle(0xf2dfad, 0xe8ce92, 0xd6b579, 0xe5cd99, 1);
  g.fillRoundedRect(left, top, width, height, 7);
  // Faded fibres and foxing marks keep every face readable rather than noisy.
  for (let i = 0; i < 48; i++) {
    const px = left + 5 + ((i * 37 + 11) % Math.max(1, width - 10));
    const py = top + 5 + ((i * 53 + 7) % Math.max(1, height - 10));
    g.lineStyle(1, 0x79552e, 0.075); g.lineBetween(px, py, Math.min(left + width - 5, px + 3 + i % 5), py);
  }
  g.lineStyle(2, 0x79512f, 0.85); g.strokeRoundedRect(left + 1, top + 1, width - 2, height - 2, 6);
  g.lineStyle(1, ink, 0.7); g.strokeRoundedRect(left + 6, top + 6, width - 12, height - 12, 3);
  g.lineStyle(1, 0x79512f, 0.3); g.lineBetween(left + 11, top + 33, left + width - 11, top + 33);
  // Tiny compass points in the corners evoke antique playing-card engraving.
  for (const [cx, cy] of [[left + 12, top + 12], [left + width - 12, top + height - 12]]) {
    g.fillStyle(ink, 0.7);
    g.fillTriangle(cx, cy - 5, cx - 2, cy, cx + 2, cy);
    g.fillTriangle(cx, cy + 5, cx - 2, cy, cx + 2, cy);
    g.lineStyle(1, ink, 0.6); g.lineBetween(cx - 4, cy, cx + 4, cy);
  }
  return g;
}
(window as unknown as Record<string, unknown>).drawParchmentCard = drawParchmentCard;
