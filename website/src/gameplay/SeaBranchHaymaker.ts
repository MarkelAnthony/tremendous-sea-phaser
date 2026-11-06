import Phaser from "phaser";
import { prepareApprovedBranchClip } from "./SeaBranchApprovedClips";

const FRAME_MS = 1000 / 12;
export const HAYMAKER_IMPACT_MS = 11 * FRAME_MS;
const key = (index: number): string => `branch-haymaker-${index}`;
type Battle = Phaser.Scene & { enemySprites?: Record<number, { container: Phaser.GameObjects.Container }> };

/** Load the exact 33 approved frames, including their drawn fire-falcon. */
export function preloadBranchHaymaker(scene: Phaser.Scene): void {
  for (let i = 0; i < 33; i++) scene.load.image(key(i), new URL(`previews/branch-haymaker/drawn/${i}.png`, document.baseURI).href);
}

export function playBranchHaymaker(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, targetIndex: number): boolean {
  if (sprite.getData("clarityAttackPlaying")) return false;
  const battle = scene as Battle;
  const targets = Object.values(battle.enemySprites || {}).filter(entry => entry.container.active && entry.container.alpha > 0.5);
  const target = battle.enemySprites?.[targetIndex] || targets[0];
  const parent = sprite.parentContainer;
  if (!parent || !target || !scene.textures.exists(key(32))) return false;
  const home = { x: sprite.x, y: sprite.y, flip: sprite.flipX };
  const scale = Number(sprite.getData("visibleModelHeight") || 176) / 107;
  // Preview contact is (150,102.5) on its native 256x192 canvas.
  // Keep the guard's fixed (105,183) anchor throughout, including recovery.
  const anchor = { x: 105, y: 183 };
  const contactX = target.container.x - 48;
  const strikeX = contactX - parent.x - (150 - anchor.x) * scale;
  const started = scene.time.now;
  let finished = false;
  let hit = false;
  sprite.anims.stop();
  sprite.setFlipX(false).setData("clarityAttackPlaying", true).setData("approvedClip", "haymaker");
  sprite.setData("branchSpecialCount", Number(sprite.getData("branchSpecialCount") || 0) + 1);
  sprite.setData("branchSpecialCard", "Wildfire Haymaker").setData("branchSpecialKind", "haymaker");
  sprite.setData("haymakerImpactAt", started + HAYMAKER_IMPACT_MS);
  const cleanup = (): void => {
    if (finished) return;
    finished = true;
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    sprite.off(Phaser.GameObjects.Events.DESTROY, cleanup);
    if (!sprite.active) return;
    sprite.setPosition(home.x, home.y).setFlipX(home.flip).setData("clarityAttackPlaying", false).setData("haymakerImpactAt", 0);
    sprite.setData("haymakerState", { active: false, frame: 32, connected: hit, returnedHome: true });
    prepareApprovedBranchClip(scene, sprite, "idle");
    sprite.emit(Phaser.Animations.Events.ANIMATION_COMPLETE);
  };
  const update = (): void => {
    const elapsed = scene.time.now - started;
    if (!sprite.active || elapsed >= 33 * FRAME_MS) { cleanup(); return; }
    const index = Math.min(32, Math.floor(elapsed / FRAME_MS));
    const advance = Phaser.Math.Easing.Cubic.Out(Math.min(1, elapsed / (9 * FRAME_MS)));
    const retreat = elapsed > 26 * FRAME_MS ? Math.min(1, (elapsed - 26 * FRAME_MS) / (7 * FRAME_MS)) : 0;
    sprite.x = Phaser.Math.Linear(home.x, strikeX, advance * (1 - retreat));
    sprite.setTexture(key(index)).setOrigin(anchor.x / 256, anchor.y / 192).setScale(scale);
    const glove = { x: parent.x + sprite.x + (150 - anchor.x) * scale, y: parent.y + sprite.y + (102.5 - anchor.y) * scale };
    if (!hit && index >= 11) {
      hit = true;
      scene.cameras.main.shake(100, 0.002);
      const burst = scene.add.graphics().setDepth(150);
      burst.lineStyle(3, 0xffefac);
      for (let n = 0; n < 9; n++) {
        const angle = n * Math.PI * 2 / 9;
        burst.lineBetween(glove.x + Math.cos(angle) * 8, glove.y + Math.sin(angle) * 8, glove.x + Math.cos(angle) * 23, glove.y + Math.sin(angle) * 23);
      }
      scene.tweens.add({ targets: burst, alpha: 0, duration: 230, onComplete: () => burst.destroy() });
    }
    sprite.setData("haymakerState", { active: true, frame: index, connected: hit, glove, targetX: contactX, exactApprovedFrames: true });
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  sprite.once(Phaser.GameObjects.Events.DESTROY, cleanup);
  update();
  return true;
}
