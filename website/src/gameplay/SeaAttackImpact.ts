import Phaser from "phaser";

/** Short-lived world-space bursts, synchronized with the approved attack clips. */
export function queueSeaAttackImpact(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, kind: "fist" | "swords", frameCount: number): void {
  const strikeDelay = Math.max(100, Math.floor(frameCount * 0.45) * 100);
  scene.time.delayedCall(strikeDelay, () => {
    if (!sprite.active || !sprite.getData("clarityAttackPlaying")) return;
    const parent = sprite.parentContainer;
    const direction = sprite.flipX ? -1 : 1;
    const x = sprite.x + direction * 47 * Math.abs(sprite.scaleX);
    const y = sprite.y - 38 * Math.abs(sprite.scaleY);
    const burst = scene.add.container(x, y).setDepth(sprite.depth + 2);
    if (parent) parent.add(burst);
    const colors = kind === "fist" ? [0xffd36b, 0xfff1bd, 0xffffff] : [0xff526b, 0x5dff9c, 0x639aff];
    const flash = scene.add.graphics();
    flash.fillStyle(0xffffff, 0.95);
    flash.fillPoints([
      new Phaser.Geom.Point(0, -17), new Phaser.Geom.Point(4, -5), new Phaser.Geom.Point(17, 0),
      new Phaser.Geom.Point(4, 5), new Phaser.Geom.Point(0, 17), new Phaser.Geom.Point(-4, 5),
      new Phaser.Geom.Point(-17, 0), new Phaser.Geom.Point(-4, -5),
    ], true);
    burst.add(flash);
    scene.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 160 });
    const ring = scene.add.graphics().lineStyle(2, colors[0], 0.9).strokeCircle(0, 0, 9);
    burst.add(ring);
    scene.tweens.add({ targets: ring, scale: kind === "fist" ? 3 : 2.4, alpha: 0, duration: 230, ease: "Cubic.easeOut" });
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      const spark = scene.add.rectangle(Math.cos(angle) * 8, Math.sin(angle) * 8, kind === "fist" ? 9 : 16, 3, colors[i % colors.length]).setRotation(angle);
      burst.add(spark);
      const distance = kind === "fist" ? 34 : 42;
      scene.tweens.add({ targets: spark, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, alpha: 0, scaleX: 0.35, duration: 280, ease: "Cubic.easeOut" });
    }
    if (kind === "swords") {
      colors.forEach((color, i) => {
        const slash = scene.add.rectangle((i - 1) * 7, 0, 3, 45, color).setRotation(0.65 + i * 0.18);
        burst.add(slash);
        scene.tweens.add({ targets: slash, alpha: 0, scaleY: 1.4, duration: 210 });
      });
    }
    sprite.setData(`${kind}ImpactCount`, (Number(sprite.getData(`${kind}ImpactCount`)) || 0) + 1);
    sprite.setData("lastImpact", { kind, x, y, time: scene.time.now });
    scene.time.delayedCall(320, () => burst.destroy());
  });
}