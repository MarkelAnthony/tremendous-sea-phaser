import Phaser from "phaser";
import { prepareApprovedBranchClip } from "./SeaBranchApprovedClips";

const FRAME_MS = 1000 / 12;
const IMPACT_FRAME = 24;
const key = (i: number): string => `branch-megaton-${i}`;
type Battle = Phaser.Scene & { enemySprites?: Record<number, { container: Phaser.GameObjects.Container }> };

/** Exact approved v5 preview pixels, scale, fixed deck anchor and flight path. */
export function preloadBranchMegaton(scene: Phaser.Scene): void {
  for (let i = 0; i < 25; i++) {
    scene.load.image(key(i), new URL(`previews/branch-megaton/v4/${i >= 21 ? "b" : "h"}${i}.png`, document.baseURI).href);
  }
  scene.load.image("branch-megaton-sun", new URL("previews/branch-megaton/v4/sun-flight-fit.png", document.baseURI).href);
}

export function playBranchMegaton(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, targetIndex: number): boolean {
  const target = (scene as Battle).enemySprites?.[targetIndex]?.container;
  if (!target || !sprite.parentContainer || sprite.getData("clarityAttackPlaying") || !scene.textures.exists(key(24))) return false;
  const home = { x: sprite.x, y: sprite.y, flip: sprite.flipX };
  const scale = Number(sprite.getData("visibleModelHeight") || 176) / 107;
  const targetPoint = target.getWorldTransformMatrix().transformPoint(0, -30);
  const sun = scene.add.image(0, 0, "branch-megaton-sun").setDepth(150).setScale(scale).setVisible(false);
  const started = scene.time.now;
  let finished = false;
  let connected = false;
  sprite.anims.stop();
  sprite.setFlipX(false).setData("clarityAttackPlaying", true).setData("approvedClip", "megaton");
  sprite.setData("branchSpecialCount", Number(sprite.getData("branchSpecialCount") || 0) + 1);
  sprite.setData("branchSpecialCard", "Fireball Candy - Megaton").setData("branchSpecialKind", "megaton");
  sprite.setData("megatonImpactAt", started + IMPACT_FRAME * FRAME_MS);
  const cleanup = (): void => {
    if (finished) return;
    finished = true;
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    sprite.off(Phaser.GameObjects.Events.DESTROY, cleanup);
    sun.destroy();
    if (!sprite.active) return;
    sprite.setPosition(home.x, home.y).setFlipX(home.flip).setData("clarityAttackPlaying", false).setData("megatonImpactAt", 0);
    sprite.setData("megatonState", { active: false, frame: 31, connected, returnedHome: true, exactApprovedFrames: true });
    prepareApprovedBranchClip(scene, sprite, "idle");
    sprite.emit(Phaser.Animations.Events.ANIMATION_COMPLETE);
  };
  const update = (): void => {
    const elapsed = scene.time.now - started;
    if (!sprite.active || elapsed >= 32 * FRAME_MS) { cleanup(); return; }
    const frame = Math.min(31, Math.floor(elapsed / FRAME_MS));
    const age = frame - IMPACT_FRAME;
    sprite.setTexture(key(Math.min(24, frame))).setOrigin(65 / 256, 251 / 256).setScale(scale);
    sun.setVisible(frame >= 21 && frame <= 27);
    if (sun.visible) {
      const start = sprite.getWorldTransformMatrix().transformPoint((170 - 65), (105 - 251));
      const p = Math.min(1, (frame - 21) / (IMPACT_FRAME - 21));
      sun.setPosition(Math.round(Phaser.Math.Linear(start.x, targetPoint.x, p)), Math.round(Phaser.Math.Linear(start.y, targetPoint.y, p)));
      sun.setAlpha(age <= 0 ? 1 : age === 1 ? 0.85 : age === 2 ? 0.5 : 0.25);
    }
    if (!connected && frame >= IMPACT_FRAME) {
      connected = true;
      scene.cameras.main.shake(100, 0.002);
    }
    const foot = sprite.getWorldTransformMatrix().transformPoint(0, 0);
    sprite.setData("megatonState", { active: true, frame, connected, exactApprovedFrames: true,
      sunVisible: sun.visible, sun: { x: sun.x, y: sun.y }, target: { x: targetPoint.x, y: targetPoint.y },
      sunTop: foot.y - 249 * scale, scale });
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  sprite.once(Phaser.GameObjects.Events.DESTROY, cleanup);
  update();
  return true;
}
