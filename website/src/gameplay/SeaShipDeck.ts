import Phaser from "phaser";
import { drawOrnateTrees } from "./SeaOrnateTrees";

/** The fighting floor fills the arena; scenery sits beyond its back railing. */
export function drawShipDeck(scene: Phaser.Scene, root: Phaser.GameObjects.Container, captain: string): void {
  const branch = captain === "Branch";
  if (branch && scene.textures.exists("kindleroot-deck")) {
    // Approved scenery only: fighters remain separate, movable combat objects.
    // Bulbs, sockets and cables are already painted into this corrected art.
    const stage = scene.add.image(0, 0, "kindleroot-deck").setOrigin(0).setDisplaySize(1000, 494);
    root.add(stage);
    // Contact shadows belong to the fighters so targeting/lunges carry them
    // along the same plane, rather than leaving empty shadows on the deck.
    root.setData("shipCaptain", captain);
    root.setData("shipTheme", "Kindleroot · living tree mast, leafy sails, emberwood deck");
    root.setData("combatSurface", "Kindleroot timber deck beneath fighters at y=355");
    root.setData("deckArt", "approved-christmas-v5");
    return;
  }
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
  if (branch) {
    // Recessed wooden frieze: repeated trees carved into the solid aft rail.
    g.fillStyle(0x513521); g.fillRect(0, 219, 1000, 23);
    g.lineStyle(1, trim, 0.8); g.lineBetween(0, 220, 1000, 220);
    g.lineBetween(0, 241, 1000, 241);
    for (let x = 25; x < 1000; x += 58) {
      const carving = (offset: number, color: number): void => {
        g.lineStyle(1.5, color);
        g.lineBetween(x+offset, 238, x+offset, 224);
        for (const sign of [-1, 1]) {
          g.lineBetween(x+offset, 230, x+sign*7+offset, 225);
          g.lineBetween(x+offset, 233, x+sign*10+offset, 228);
          g.lineBetween(x+offset, 236, x+sign*8+offset, 239);
          g.lineBetween(x+sign*7+offset, 225, x+sign*9+offset, 223);
        }
      };
      carving(1, 0x261b13); carving(0, 0xd9a85c);
      // Leaf-shaped cut-outs decorate the balusters as well as the rail band.
      g.fillStyle(0x3d291c); g.fillEllipse(x, 202, 5, 16);
      g.lineStyle(1, trim, 0.7); g.lineBetween(x-1, 208, x-1, 196);
      g.lineBetween(x-1, 202, x+2, 198);
      g.lineStyle(1, trim, 0.65);
      g.lineBetween(x+12, 182, x+25, 179); g.lineBetween(x+25, 179, x+38, 183);
    }
  }
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
    drawOrnateTrees(g);
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
