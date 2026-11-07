import Phaser from "phaser";
import { prepareApprovedBranchClip } from "./SeaBranchApprovedClips";

type Battle = Phaser.Scene & { enemySprites?: Record<number, { container: Phaser.GameObjects.Container }> };
const launches = [
  { f: 9, hand: "left", target: 0 }, { f: 15, hand: "right", target: 1 },
  { f: 21, hand: "left", target: 2 }, { f: 27, hand: "right", target: 0 },
  { f: 33, hand: "left", target: 1 }, { f: 39, hand: "right", target: 2 },
  { f: 47, hand: "left", target: 0, finish: true },
  { f: 47, hand: "right", target: 1, finish: true },
  { f: 48, hand: "left", target: 2, finish: true },
];

/** The approved v8b canvas choreography, using the already-loaded original glove pixels. */
export function playBranchEviscerate(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): boolean {
  const targets = Object.entries((scene as Battle).enemySprites || {})
    .filter(([, entry]) => entry.container.active && entry.container.visible && entry.container.alpha > 0.5)
    .map(([index, entry]) => ({ index: Number(index), container: entry.container, x: entry.container.x, alpha: entry.container.alpha }));
  if (!targets.length || !sprite.parentContainer || sprite.getData("clarityAttackPlaying")) return false;
  const source = (pose: string): CanvasImageSource => {
    const heavy = pose.startsWith("heavy");
    const index = Number(pose.replace(/\D/g, ""));
    return scene.textures.get(`branch-approved-${heavy ? "heavy" : "jab"}-${heavy ? index : 2 - index}`).getSourceImage() as CanvasImageSource;
  };
  if (!scene.textures.exists("branch-approved-jab-2")) return false;
  const glove = document.createElement("canvas"); glove.width = 16; glove.height = 13;
  glove.getContext("2d")!.drawImage(source("jab0"), 86, 49, 16, 13, 0, 0, 16, 13);
  const buffer = document.createElement("canvas"); buffer.width = 112; buffer.height = 40;
  const pc = buffer.getContext("2d")!;
  const key = `branch-eviscerate-${Phaser.Utils.String.UUID()}`;
  const texture = scene.textures.createCanvas(key, 1000, 700);
  if (!texture) return false;
  const ctx = texture.context;
  const layer = scene.add.image(0, 0, key).setOrigin(0).setDepth(150);
  const foot = sprite.getWorldTransformMatrix().transformPoint(0, 0);
  const scale = Number(sprite.getData("visibleModelHeight") || 176) / 66;
  const started = scene.time.now;
  let finished = false;
  const hitTargets = new Set<number>();
  const impactTimes: Record<number, number> = {};
  targets.forEach((target, i) => {
    const final = launches.filter(launch => launch.target % targets.length === i).reduce((last, launch) => Math.max(last, launch.f + 6), 0);
    impactTimes[target.index] = started + final * 50;
  });
  sprite.anims.stop();
  sprite.setVisible(false).setData("clarityAttackPlaying", true).setData("approvedClip", "eviscerate");
  sprite.setData("branchSpecialCount", Number(sprite.getData("branchSpecialCount") || 0) + 1);
  sprite.setData("branchSpecialCard", "Fireball Candy - Eviscerate").setData("branchSpecialKind", "eviscerate");
  sprite.setData("eviscerateImpactTimes", impactTimes);
  const cleanup = (): void => {
    if (finished) return;
    finished = true;
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    sprite.off(Phaser.GameObjects.Events.DESTROY, cleanup);
    targets.forEach(target => { if (target.container.active) target.container.x = target.x; });
    layer.destroy(); scene.textures.remove(key);
    if (!sprite.active) return;
    sprite.setVisible(true).setData("clarityAttackPlaying", false).setData("eviscerateImpactTimes", null);
    sprite.setData("eviscerateState", { active: false, frame: 63, hitTargets: [...hitTargets], returnedHome: true, approvedVersion: "8b" });
    prepareApprovedBranchClip(scene, sprite, "idle");
    sprite.emit(Phaser.Animations.Events.ANIMATION_COMPLETE);
  };
  const fist = (x: number, y: number, size: number, age: number, reach: number): void => {
    pc.clearRect(0, 0, 112, 40); pc.imageSmoothingEnabled = false;
    const tail = Math.min(88, Math.max(24, reach / size));
    const colors = ["#a82e22", "#df4622", "#f77921", "#ffb83e", "#ffd66b"];
    for (let row = 0; row < 10; row++) {
      const notch = (row * 7 + Math.floor(age * 35) * 3) % 13;
      const length = tail - (row % 3) * 6 - notch;
      pc.fillStyle = colors[row === 0 || row === 9 ? 0 : row === 1 || row === 8 ? 1 : row % 3 + 2];
      pc.globalAlpha = 0.45; pc.fillRect(Math.round(58 - length), 10 + row * 2, Math.round(length), 2); pc.globalAlpha = 1;
    }
    pc.fillStyle = "#df4622"; pc.fillRect(44, 9, 12, 3); pc.fillRect(40, 28, 16, 2);
    pc.fillStyle = "#ffb83e"; pc.fillRect(48, 12, 10, 2); pc.fillRect(46, 26, 12, 2);
    pc.drawImage(glove, 0, 0, 16, 13, 62, 0, 48, 39);
    const pixelScale = Math.max(1, Math.round(size));
    ctx.drawImage(buffer, Math.round(x) - 104 * pixelScale, Math.round(y) - 20 * pixelScale, 112 * pixelScale, 40 * pixelScale);
  };
  const update = (): void => {
    const elapsed = scene.time.now - started;
    if (!sprite.active || elapsed >= 3200) { cleanup(); return; }
    const frame = Math.min(63, Math.floor(elapsed / 50));
    ctx.clearRect(0, 0, 1000, 700); ctx.imageSmoothingEnabled = false;
    let pose = "jab2";
    let active: typeof launches[number] | undefined;
    for (const launch of launches) { const d = frame - launch.f; if (d >= -3 && d <= 2) active = launch; }
    if (frame < 7) pose = frame < 4 ? "jab2" : "heavy4";
    else if (active) {
      const d = frame - active.f;
      pose = active.hand === "left" ? (d < 0 ? "jab1" : d < 2 ? "jab0" : "jab1") : (d < 0 ? "heavy4" : d < 2 ? "heavy5" : "heavy2");
    }
    const recoil = active ? (frame < active.f ? -5 : frame === active.f ? 5 : -3) : 0;
    const heavy = pose.startsWith("heavy");
    ctx.drawImage(source(pose), Math.round(foot.x - (heavy ? 79 : 76) * scale + recoil), Math.round(foot.y - (heavy ? 110 : 112) * scale), 144 * scale, 144 * scale);
    const reactions = new Map<number, number>();
    let visibleFists = 0;
    for (const launch of launches) {
      const d = frame - launch.f; if (d < 0 || d > 14) continue;
      const index = launch.target % targets.length;
      const target = targets[index];
      const point = target.container.parentContainer
        ? target.container.parentContainer.getWorldTransformMatrix().transformPoint(target.x, target.container.y - 8)
        : { x: target.x, y: target.container.y - 8 };
      const start = { x: foot.x + 47, y: foot.y - 109 + (launch.hand === "right" ? 13 : -4) };
      const size = launch.finish ? 2.7 : 2.2, hold = launch.finish ? 3 : 1;
      const end = { x: point.x - 7 * size, y: point.y };
      if (d <= 6 + hold) {
        const progress = d < 1 ? 0 : Math.pow(Math.min(1, (d - 1) / 5), 2.6);
        const x = start.x + (end.x - start.x) * progress, y = start.y + (end.y - start.y) * progress;
        fist(x, y, size * (d < 1 ? 0.7 : 1), d / 14, Math.hypot(x - start.x, y - start.y)); visibleFists++;
      }
      if (d >= 6) {
        hitTargets.add(target.index);
        const age = d - 6;
        reactions.set(index, (launch.finish ? 22 : 13) * (age < hold ? 1 : Math.max(0, 1 - (age - hold) / 5)));
        ctx.save(); ctx.translate(point.x, point.y); ctx.globalAlpha = Math.max(0, 1 - age / 7);
        for (let k = 0; k < 7; k++) {
          ctx.fillStyle = k % 2 ? "#f77921" : "#ffd66b";
          ctx.fillRect(Math.round(4 + age * 6 + (k % 3) * 5), -27 + k * 8, Math.max(3, 16 - age * 2), 3);
        }
        ctx.restore();
      }
    }
    targets.forEach((target, i) => { if (target.container.active) target.container.x = target.x + (reactions.get(i) || 0); });
    texture.refresh();
    sprite.setData("eviscerateState", { active: true, frame, pose, visibleFists, hitTargets: [...hitTargets], targetCount: targets.length, approvedVersion: "8b" });
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  sprite.once(Phaser.GameObjects.Events.DESTROY, cleanup);
  update();
  return true;
}
