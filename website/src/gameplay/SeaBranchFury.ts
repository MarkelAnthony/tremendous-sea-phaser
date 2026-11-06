import Phaser from "phaser";
import { prepareApprovedBranchClip } from "./SeaBranchApprovedClips";
import { paintFury } from "./SeaBranchFuryPainter";

const url = (folder: string, file: string): string => new URL(`previews/${folder}/${file}`, document.baseURI).href;
export function preloadBranchFury(scene: Phaser.Scene): void {
  for (let i = 0; i < 17; i++) {
    scene.load.image(`fury-charge-${i}`, url("branch-fury", `body-${i}.png`));
    scene.load.image(`fury-release-${i}`, url("branch-fury-release", `release-${i}.png`));
  }
}
function frameImage(scene: Phaser.Scene, release: boolean, index: number): CanvasImageSource {
  return scene.textures.get(`fury-${release ? "release" : "charge"}-${index}`).getSourceImage() as CanvasImageSource;
}
export function playBranchFury(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): boolean {
  if (sprite.getData("clarityAttackPlaying")) return false;
  const key = `fury-effect-${scene.time.now}`;
  const texture = scene.textures.createCanvas(key, 1000, 400);
  if (!texture) return false;
  const scale = Number(sprite.getData("visibleModelHeight") || 176) / 212;
  const feetX = sprite.x + (sprite.parentContainer?.x || 0);
  const feetY = (sprite.parentContainer?.y || 0) + 75;
  const image = scene.add.image(feetX - 250 * scale, feetY - 342 * scale, key).setOrigin(0).setScale(scale).setDepth(100);
  sprite.anims.stop(); sprite.setVisible(false).setData("clarityAttackPlaying", true);
  sprite.setData("branchSpecialCount", Number(sprite.getData("branchSpecialCount") || 0) + 1);
  sprite.setData("branchSpecialCard", "Branch's Fury").setData("branchSpecialKind", "fury");
  const start = scene.time.now;
  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true; scene.events.off("update", tick); image.destroy(); scene.textures.remove(key);
    if (sprite.active) {
      sprite.setVisible(true).setData("clarityAttackPlaying", false);
      prepareApprovedBranchClip(scene, sprite, "idle");
      sprite.emit(Phaser.Animations.Events.ANIMATION_COMPLETE);
    }
  };
  const tick = (): void => {
    const t = scene.time.now - start;
    if (!sprite.active || t >= 4800) { cleanup(); return; }
    const release = t >= 2400;
    const index = release ? Math.min(16, Math.floor((t - 2400) / 2400 * 17)) : Math.min(12, Math.floor(t / 2400 * 13));
    paintFury(texture.context, frameImage(scene, release, index), t, false);
    texture.refresh();
  };
  scene.events.on("update", tick);
  scene.events.once("shutdown", cleanup);
  tick();
  return true;
}

type Victory = { earned: number; total: number; branch: boolean };
let overlay: HTMLDivElement | undefined;
let animation: number = 0;
export function hideSeaVictory(): void {
  cancelAnimationFrame(animation); overlay?.remove(); overlay = undefined;
}
export function showSeaVictory(scene: Phaser.Scene, reward: Victory, next: () => void): void {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.id = "sea-victory";
  overlay.style.cssText = "position:absolute;inset:0;z-index:900;background:rgba(9,18,27,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#ffe4ad;text-align:center;gap:10px;padding:18px;box-sizing:border-box;";
  const title = document.createElement("h1"); title.textContent = "VICTORY!"; title.style.cssText = "margin:0;font:700 clamp(28px,5vw,48px) Georgia;letter-spacing:5px;color:#ffc46b";
  const subtitle = document.createElement("div"); subtitle.textContent = reward.branch ? "Branch’s fire burns victorious." : "The spoils are yours.";
  const canvas = document.createElement("canvas"); canvas.width = 500; canvas.height = 370;
  canvas.style.cssText = "width:min(500px,90vw);height:auto;max-height:45vh;object-fit:contain;image-rendering:pixelated";
  const amount = document.createElement("div"); amount.textContent = `+${reward.earned} Rubees earned`; amount.style.cssText = "font:bold clamp(24px,4vw,34px) Georgia;color:#ffcb62";
  const total = document.createElement("div"); total.textContent = `Purse: ${reward.total} Rubees · Rewards already added`;
  const button = document.createElement("button"); button.id = "sea-victory-continue"; button.textContent = "Continue to rewards →";
  button.style.cssText = "pointer-events:auto;cursor:pointer;padding:14px 25px;border:1px solid #edb85e;border-radius:8px;background:#713419;color:#fff0cc;font:bold 17px Georgia;margin-top:12px";
  button.onclick = () => { hideSeaVictory(); next(); };
  overlay.append(title, subtitle); if (reward.branch) overlay.append(canvas);
  overlay.append(amount, total, button); document.getElementById("hud-root")!.append(overlay);
  const start = performance.now(); const ctx = canvas.getContext("2d")!;
  const draw = (): void => {
    if (!overlay) return;
    const t = (performance.now() - start) % 3200;
    const index = t >= 2800 ? 0 : Math.min(16, Math.floor(t / 2800 * 17));
    ctx.clearRect(0, 0, 500, 370); ctx.save(); ctx.translate(0, 15);
    paintFury(ctx, frameImage(scene, false, index), t, true); ctx.restore();
    animation = requestAnimationFrame(draw);
  };
  if (reward.branch) draw();
}
Object.assign(window, { showSeaVictory, hideSeaVictory });
