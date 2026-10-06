import Phaser from "phaser";

/** A directional fire plume distinguishes casting from the physical punch clip. */
export function queueBranchBurnEffect(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): void {
  scene.time.delayedCall(280, () => {
    if (!sprite.active || !sprite.getData("clarityAttackPlaying")) return;
    const direction = sprite.flipX ? -1 : 1;
    const plume = scene.add.container(sprite.x + direction * 28 * Math.abs(sprite.scaleX), sprite.y - 36 * Math.abs(sprite.scaleY)).setDepth(sprite.depth + 2);
    sprite.parentContainer?.add(plume);
    for (let i = 0; i < 16; i++) {
      const spread = ((i % 5) - 2) * 5;
      const flame = scene.add.graphics();
      flame.fillStyle(0xff6429, 0.9).fillPoints([
        new Phaser.Math.Vector2(-10, -7), new Phaser.Math.Vector2(7, -5),
        new Phaser.Math.Vector2(22, 0), new Phaser.Math.Vector2(6, 6), new Phaser.Math.Vector2(-9, 7),
      ], true);
      flame.fillStyle(0xffd55c, 1).fillTriangle(-6, -3, 13, 0, -6, 4);
      flame.setPosition(direction * (i % 4) * 7, spread).setScale(direction * 0.7, 0.7);
      plume.add(flame);
      scene.tweens.add({ targets: flame, x: direction * (55 + (i % 4) * 13), y: spread * 1.6 - 10,
        alpha: 0, scaleY: 0.25, duration: 400, delay: Math.floor(i / 4) * 35, ease: "Cubic.easeOut" });
    }
    sprite.setData("branchBurnEffectCount", (Number(sprite.getData("branchBurnEffectCount")) || 0) + 1);
    scene.time.delayedCall(550, () => plume.destroy());
  });
}
