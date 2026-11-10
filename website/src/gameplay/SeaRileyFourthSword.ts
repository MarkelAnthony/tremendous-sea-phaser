import Phaser from "phaser";

/** The original Riley artwork is untouched; only the missing weapon is added. */
export function attachRileyFourthSword(scene: Phaser.Scene, riley: Phaser.GameObjects.Sprite): void {
  const sword = scene.add.image(0, 0, "riley-fourth-sword");
  sword.setName("riley-fourth-sword");
  const sync = (): void => {
    if (!riley.active) return;
    const parent = riley.parentContainer;
    if (parent && sword.parentContainer !== parent) parent.add(sword);
    if (parent) parent.moveBelow(sword, riley);
    else sword.setDepth(riley.depth - 0.01);
    // Original 128px frame: clear space behind the shoulder, opposite the blue blade.
    const x = (100 - riley.originX * 128) * riley.scaleX;
    const y = (35 - riley.originY * 128) * riley.scaleY;
    const cos = Math.cos(riley.rotation), sin = Math.sin(riley.rotation);
    sword.setPosition(riley.x + x * cos - y * sin, riley.y + x * sin + y * cos);
    sword.setScale(riley.scaleX, riley.scaleY).setRotation(riley.rotation);
    sword.setAlpha(riley.alpha).setVisible(riley.visible && !riley.getData("clarityAttackPlaying"));
    riley.setData("fourthSwordVisible", sword.visible);
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, sync);
  riley.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, sync);
    sword.destroy();
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, sync));
  sync();
}
