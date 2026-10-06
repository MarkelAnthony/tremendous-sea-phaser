import Phaser from "phaser";
import { nauticalIllustration } from "./SeaNauticalArt";
import { drawCaptainShip } from "./SeaShipBackdrop";

/** Decorative scenery only; game rules and hit targets remain unchanged. */
function decorateSeaScreen(scene: Phaser.Scene, root: Phaser.GameObjects.Container, captain?: string): void {
  if (captain) {
    drawCaptainShip(scene, root, captain);
    const trim = scene.add.graphics();
    trim.fillGradientStyle(0x302016, 0x3d291b, 0x100e0c, 0x211a15, 1);
    trim.fillRect(0, 494, 1000, 206);
    for (let y = 520; y < 700; y += 35) {
      trim.lineStyle(1, 0xb18043, 0.18); trim.lineBetween(0, y, 1000, y);
    }
    for (let i = 0; i < 144; i++) {
      trim.lineStyle(3, i % 2 ? 0x907044 : 0xc4a372, 0.9);
      trim.lineBetween(i * 7, 494, i * 7 + 6, 501);
    }
    root.add(trim);
    return;
  }
  const g = scene.add.graphics();
  // A captain's chart table: dark timber outside a sea-green engraved atlas.
  g.fillGradientStyle(0x39271c, 0x211a15, 0x100e0c, 0x302016, 1);
  g.fillRect(0, 0, 1000, 700);
  for (let plank = 0; plank < 12; plank++) {
    g.lineStyle(2, 0x090908, 0.7); g.lineBetween(0, plank * 64, 1000, plank * 64);
    g.lineStyle(1, 0xb18043, 0.12);
    for (let grain = 0; grain < 4; grain++) g.lineBetween(0, plank * 64 + 9 + grain * 10, 1000, plank * 64 + 13 + grain * 10);
  }
  g.fillStyle(0x000000, 0.5); g.fillRoundedRect(24, 24, 958, 478, 8);
  g.fillGradientStyle(0x24535a, 0x173c47, 0x0c2634, 0x1c444a, 1);
  g.fillRoundedRect(18, 18, 964, 476, 8);
  g.lineStyle(2, 0xc8ac70, 0.5); g.strokeRoundedRect(27, 27, 946, 457, 4);
  // Coastlines, sounding marks and dotted trade routes are inked into the chart.
  for (const [ix, iy, r] of [[85, 205, 65], [925, 345, 78], [710, 95, 48]]) {
    g.lineStyle(1, 0xc5c08d, 0.23); g.beginPath();
    for (let i = 0; i <= 48; i++) { const a = i * Math.PI / 24; const rr = r * (0.78 + Math.sin(i * 1.7) * 0.12 + Math.cos(i * 0.6) * 0.14); const x = ix + Math.cos(a) * rr; const y = iy + Math.sin(a) * rr * 0.7; if (!i) g.moveTo(x,y); else g.lineTo(x,y); }
    g.closePath(); g.strokePath();
  }
  g.lineStyle(1, 0xd8bb77, 0.16);
  for (let x = 50; x < 970; x += 90) g.lineBetween(x, 28, x, 480);
  for (let y = 55; y < 480; y += 70) g.lineBetween(28, y, 970, y);
  for (let i = 0; i < 42; i++) g.fillStyle(0xd8bb77, 0.3).fillCircle(150 + i * 17, 380 - Math.sin(i / 8) * 100, 1.4);
  nauticalIllustration(g, 105, 360, 1.35, "ship", 0xd8bb77, 0.22);
  nauticalIllustration(g, 890, 420, 1.25, "kraken", 0xd8bb77, 0.18);
  nauticalIllustration(g, 880, 170, 2.1, "compass", 0xd8bb77, 0.3);
  g.lineStyle(1, 0x67d9cc, 0.08);
  for (let row = 0; row < 15; row++) {
    g.beginPath();
    for (let x = 0; x <= 1000; x += 8) {
      const y = 110 + row * 43 + Math.sin(x / 85 + row * 0.7) * 9;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokePath();
  }
  // Chart compass and chart grid give empty space a deliberate identity.
  g.lineStyle(1, 0xd8bb77, 0.13);
  g.strokeCircle(880, 170, 82); g.strokeCircle(880, 170, 65);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.lineBetween(880 + Math.cos(a) * 48, 170 + Math.sin(a) * 48, 880 + Math.cos(a) * 91, 170 + Math.sin(a) * 91);
  }
  g.fillStyle(0xd8bb77, 0.14);
  g.fillTriangle(880, 98, 868, 170, 892, 170);
  g.fillTriangle(880, 242, 868, 170, 892, 170);
  g.fillStyle(0x100d09, 0.45); g.fillRect(0, 503, 1000, 197);
  // Twisted rope separates the battle chart from the physical deck of cards.
  for (let i = 0; i < 160; i++) {
    g.lineStyle(3, i % 2 ? 0x907044 : 0xc4a372, 0.8);
    g.lineBetween(i * 7, 499, i * 7 + 6, 505);
  }
  g.lineStyle(1, 0xd8bb77, 0.4); g.lineBetween(24, 503, 976, 503);
  g.lineStyle(1, 0xd8bb77, 0.35); g.strokeRoundedRect(9, 9, 982, 682, 12);
  for (const x of [22, 978]) for (const y of [22, 678]) {
    g.fillStyle(0xe8c477, 0.8); g.fillCircle(x, y, 3);
  }
  root.add(g);
}
(window as unknown as Record<string, unknown>).decorateSeaScreen = decorateSeaScreen;

export function seaButtonStyle(button: HTMLButtonElement, scale: number): void {
  button.classList.add("sea-themed-button");
  button.style.fontSize = `${Math.max(9, 14 * scale)}px`;
}
