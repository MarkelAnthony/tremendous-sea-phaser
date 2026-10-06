import Phaser from "phaser";

/** Decorative scenery only; game rules and hit targets remain unchanged. */
function decorateSeaScreen(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(0x12384a, 0x0d293a, 0x071722, 0x0a2431, 1);
  g.fillRect(0, 0, 1000, 700);
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
  g.fillStyle(0x030e18, 0.72); g.fillRect(0, 503, 1000, 197);
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
