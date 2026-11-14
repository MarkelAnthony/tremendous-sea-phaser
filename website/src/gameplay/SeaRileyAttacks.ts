import Phaser from "phaser";

type Stance = "FourSword" | "FistBlade";
type Battle = Phaser.Scene & { enemySprites?: Record<number, { container: Phaser.GameObjects.Container }> };
type Clip = { frames: string[]; durations: number[] };
const key = (stance: Stance, idle: boolean, i: number): string => `riley-approved-${stance}-${idle ? "idle" : "attack"}-${i}`;
const duration = { FourSword: 33 * 100 / 1.5, FistBlade: 17 * 65 };

export function preloadRileyAttacks(scene: Phaser.Scene): void {
  for (const stance of ["FourSword", "FistBlade"] as Stance[]) {
    const url = new URL(`art/riley-${stance === "FourSword" ? "four-sword-attack-cleaned" : "fistblade-attack"}.json`, document.baseURI).href;
    // Queue dynamic images during the existing loader, before its completion event.
    scene.load.json(`riley-${stance}-manifest`, url);
    scene.load.once(`filecomplete-json-riley-${stance}-manifest`, (_key: string, _type: string, clip: Clip) => {
      clip.frames.forEach((path, i) => scene.load.image(key(stance, false, i), new URL(path, document.baseURI).href));
    });
    const count = stance === "FourSword" ? 33 : 17;
    for (let i = 0; i < count; i++) scene.load.image(key(stance, true, i), new URL(stance === "FourSword" ? `art/riley-smooth-idle/${i}.png` : `assets/images/9084b021-f2cd-5215-a73f-8e4c66f2e445/frames/${i}.png`, document.baseURI).href);
  }
  // Entropy floating-sword idle: the same frame sequence as the Entropy review preview.
  ENTROPY_IDLE_FRAMES.forEach((frame, i) => scene.load.image(`riley-approved-Entropy-idle-${i}`, new URL(`assets/images/31ed9ac0-dce1-5d80-bebd-68aec8d58ddb/frames/${frame}.png`, document.baseURI).href));
}
const ENTROPY_IDLE_FRAMES = [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

export function rileyIdle(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, stance: string): boolean {
  if (stance !== "FourSword" && stance !== "FistBlade" && stance !== "Entropy") return false;
  if (stance === "Entropy" && !scene.textures.exists("riley-approved-Entropy-idle-0")) return false;
  const anim = `riley-approved-idle-${stance}`;
  const count = stance === "FourSword" ? 33 : stance === "Entropy" ? ENTROPY_IDLE_FRAMES.length : 17;
  if (!scene.anims.exists(anim)) scene.anims.create({ key: anim, frames: Array.from({ length: count }, (_, i) => ({ key: `riley-approved-${stance}-idle-${i}` })), frameRate: 10, repeat: -1 });
  sprite.setOrigin(60 / 128, 124 / 128).setScale(1.35).play(anim);
  sprite.setData("stance", stance).setData("approvedRileyArt", true);
  return true;
}

export function playRileyAttack(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, stance: Stance, targetIndex = 0, restore?: (stance: string) => void): boolean {
  if (sprite.getData("clarityAttackPlaying") || !scene.textures.exists(key(stance, false, 0))) return false;
  const entries = (scene as Battle).enemySprites || {};
  const target = entries[targetIndex] || Object.values(entries).find(e => e.container.active && e.container.alpha > 0.5);
  if (!target) return false;
  const home = { x: sprite.x, y: sprite.y, flip: sprite.flipX, depth: sprite.depth };
  const world = target.container.getWorldTransformMatrix().transformPoint(45, 0);
  const local = sprite.parentContainer ? sprite.parentContainer.getWorldTransformMatrix().applyInverse(world.x, world.y) : world;
  const sign = local.x >= home.x ? 1 : -1;
  const scale = 1.35;
  const strikeX = local.x - sign * (stance === "FourSword" ? 82 : 60) * scale;
  const contacts = stance === "FourSword" ? [8, 12, 16, 20] : [7];
  const start = scene.time.now;
  const total = duration[stance];
  let hits = 0, ended = false;
  sprite.anims.stop();
  sprite.setFlipX(sign < 0).setDepth(100).setData("clarityAttackPlaying", true).setData("afterAttackStance", stance);
  const counter = stance === "FourSword" ? "clarityAttackCount" : "fistAttackCount";
  sprite.setData(counter, Number(sprite.getData(counter) || 0) + 1);
  const smooth = (t: number): number => { const v = Phaser.Math.Clamp(t, 0, 1); return v * v * (3 - 2 * v); };
  const cleanup = (): void => {
    if (ended) return;
    ended = true;
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    sprite.off(Phaser.GameObjects.Events.DESTROY, cleanup);
    if (!sprite.active) return;
    sprite.setPosition(home.x, home.y).setFlipX(home.flip).setDepth(home.depth).setData("clarityAttackPlaying", false);
    sprite.setData("rileyAttack", { active: false, stance, hits, returnedHome: true, home, x: sprite.x });
    const next = String(sprite.getData("afterAttackStance") || stance);
    sprite.setData("stance", undefined);
    if (restore) restore(next); else rileyIdle(scene, sprite, next);
    sprite.emit(Phaser.Animations.Events.ANIMATION_COMPLETE);
  };
  const update = (): void => {
    const elapsed = scene.time.now - start;
    if (!sprite.active || elapsed >= total) { cleanup(); return; }
    const p = elapsed / total;
    const frame = Math.min(stance === "FourSword" ? 32 : 16, Math.floor(elapsed / (stance === "FourSword" ? 100 / 1.5 : 65)));
    const advanceStart = stance === "FourSword" ? .10 : .27;
    const advanceEnd = stance === "FourSword" ? .24 : .41;
    const returnStart = stance === "FourSword" ? .77 : .69;
    const amount = smooth((p - advanceStart) / (advanceEnd - advanceStart)) * (1 - smooth((p - returnStart) / (1 - returnStart)));
    sprite.setX(Phaser.Math.Linear(home.x, strikeX, amount));
    const ax = stance === "FourSword" ? 100 : 60, ay = stance === "FourSword" ? 172 : 124;
    sprite.setTexture(key(stance, false, frame)).setOrigin(ax / sprite.width, ay / sprite.height).setScale(scale);
    const reached = contacts.filter(f => f <= frame).length;
    if (reached > hits) {
      hits = reached;
      const burst = scene.add.graphics().setDepth(150).lineStyle(3, 0xffe59b);
      const hitWorld = target.container.getWorldTransformMatrix().transformPoint(45, -45);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; burst.lineBetween(hitWorld.x + Math.cos(a) * 7, hitWorld.y + Math.sin(a) * 7, hitWorld.x + Math.cos(a) * 22, hitWorld.y + Math.sin(a) * 22); }
      scene.tweens.add({ targets: burst, alpha: 0, duration: 180, onComplete: () => burst.destroy() });
    }
    sprite.setData("rileyAttack", { active: true, stance, frame: frame + 1, hits, home, x: sprite.x, targetX: local.x, scale, returnedHome: false });
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  sprite.once(Phaser.GameObjects.Events.DESTROY, cleanup);
  update();
  return true;
}
