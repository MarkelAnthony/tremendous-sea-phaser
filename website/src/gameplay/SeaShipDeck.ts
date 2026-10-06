import Phaser from "phaser";

/** The fighting floor fills the arena; scenery sits beyond its back railing. */
export function drawShipDeck(scene: Phaser.Scene, root: Phaser.GameObjects.Container, captain: string): void {
  const branch = captain === "Branch";
  const riley = captain === "Riley";
  const wood = branch ? 0x92613b : riley ? 0x586977 : 0x795136;
  const trim = branch ? 0xe9bf68 : riley ? 0xb1d9df : 0xdba64f;
  const g = scene.add.graphics();
  g.fillGradientStyle(0x91c9cb, 0xc8e0d1, 0x277a8b, 0x28596d, 1);
  g.fillRect(0, 0, 1000, 494);
  g.fillStyle(0x2b788d); g.fillRect(0, 146, 1000, 120);
  for (let y = 160; y < 240; y += 18) {
    g.lineStyle(2, 0xc0e8dc, 0.35);
    for (let x = 0; x < 1000; x += 96) g.lineBetween(x, y, x + 53, y - 3);
  }
  // Deck boards run toward a vanishing point, directly underneath every fighter.
  g.fillGradientStyle(wood, wood, 0x38271d, 0x4f3523, 1);
  g.fillRect(0, 240, 1000, 254);
  for (let i = -10; i <= 10; i++) {
    const backX = 500 + i * 45, frontX = 500 + i * 95;
    g.lineStyle(2, 0x251a13, 0.7); g.lineBetween(backX, 240, frontX, 494);
    g.lineStyle(1, 0xe0b17b, 0.3); g.lineBetween(backX + 3, 240, frontX + 3, 494);
    for (let y = 275 + (Math.abs(i) % 3) * 23; y < 494; y += 83) {
      const t = (y - 240) / 254, x = backX + (frontX - backX) * t;
      g.lineStyle(1, 0x281c14, 0.6); g.lineBetween(x, y, x + 45 + t * 50, y);
      g.fillStyle(0x211810, 0.7); g.fillCircle(x + 7, y + 5, 1.5);
    }
  }
  // Back rail remains behind the characters, never across their feet.
  g.fillStyle(0x3c2a20); g.fillRect(0, 223, 1000, 19);
  for (let x = 20; x < 1000; x += 58) {
    g.fillStyle(wood); g.fillRoundedRect(x, 174, 10, 66, 3);
    g.fillStyle(trim); g.fillCircle(x + 5, 174, 5);
  }
  g.fillStyle(wood); g.fillRoundedRect(0, 176, 1000, 12, 3);
  g.lineStyle(3, trim); g.lineBetween(0, 177, 1000, 177);
  // Masts and sail edges frame the arena rather than depicting a distant hull.
  for (const x of [48, 949]) {
    g.fillStyle(0x39271c); g.fillRect(x - 11, 0, 22, 256);
    g.lineStyle(3, trim, 0.65); g.lineBetween(x + 4, 0, x + 4, 250);
    g.fillStyle(0xf0dfb6, 0.92);
    g.fillTriangle(x + (x < 500 ? 15 : -15), 0, x + (x < 500 ? 170 : -170), 0, x + (x < 500 ? 15 : -15), 143);
    g.lineStyle(2, 0x544331, 0.8); g.lineBetween(x, 12, x < 500 ? 265 : 735, 235);
    g.lineBetween(x, 75, x < 500 ? 0 : 1000, 245);
  }
  if (branch) {
    // Root-grown balustrades and ornamental tree crowns retain Branch's identity.
    for (const [x, color] of [[84, 0xd976a9], [325, 0xc393df], [745, 0xf2a65d], [928, 0x77bfb1]]) {
      g.lineStyle(9, 0x68402a); g.lineBetween(x, 229, x, 126);
      g.lineStyle(5, 0xa27340); g.lineBetween(x, 168, x - 23, 137); g.lineBetween(x, 158, x + 26, 127);
      g.fillStyle(color, 0.94);
      for (const [dx, dy, r] of [[-23, 0, 22], [19, -8, 26], [0, -24, 27], [0, 6, 26]]) g.fillCircle(x + dx, 125 + dy, r);
      g.fillStyle(0xffd998, 0.35); g.fillCircle(x - 9, 97, 12);
      g.lineStyle(4, trim, 0.65); g.lineBetween(x, 224, x - 28, 237); g.lineBetween(x, 224, x + 32, 237);
    }
    // Tree engraving embedded in the open deck, not a floating UI ornament.
    g.lineStyle(3, trim, 0.24); g.strokeEllipse(420, 371, 150, 62);
    g.lineBetween(420, 387, 420, 343);
    for (const sign of [-1, 1]) { g.lineBetween(420, 369, 420 + sign * 28, 347); g.lineBetween(420, 382, 420 + sign * 37, 391); }
  }
  // Contact shadows share the actual feet line (combatY 280 + body bottom 75).
  for (const x of [150, 470, 650, 830]) { g.fillStyle(0x21170f, 0.25); g.fillEllipse(x, 355, 108, 17); }
  root.add(g);
  root.setData("shipCaptain", captain);
  root.setData("shipTheme", branch ? "Living-tree ship · on-deck combat" : riley ? "Silver sabre frigate · on-deck combat" : "Brass gunship · on-deck combat");
  root.setData("combatSurface", "Timber deck under fighters at y=355; aft railing y=177");
}
