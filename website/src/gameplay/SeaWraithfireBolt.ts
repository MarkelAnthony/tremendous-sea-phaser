import Phaser from "phaser";
import { prepareApprovedBranchClip } from "./SeaBranchApprovedClips";

type Anchor = { footX: number; footY: number; gloveX: number; gloveY: number };
type Clip = { files: string[]; anchors: Anchor[] };
const base = (): string => new URL("previews/wraithfire-bolt/", document.baseURI).href;
export function preloadWraithfireBolt(scene: Phaser.Scene): void {
  scene.load.json("wraithfire-clip", `${base()}clip.json`);
  for (let i = 0; i < 17; i++) scene.load.image(`wraithfire-body-${i}`, `${base()}body-${i}.png`);
}

/** The approved study's exact poses, anchors, sun and helical beam; visual only. */
export function playWraithfireBolt(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, targetIndex: number = 0): boolean {
  const clip = scene.cache.json.get("wraithfire-clip") as Clip | undefined;
  if (!clip || sprite.getData("clarityAttackPlaying")) return false;
  const battle = scene as Phaser.Scene & { enemySprites?: Record<number, { container: Phaser.GameObjects.Container }> };
  const target = battle.enemySprites?.[targetIndex]?.container;
  const end = target ? { x: target.x, y: target.y - 55 } : { x: sprite.x + (sprite.parentContainer?.x || 0) + 400, y: 220 };
  const textureKey = `wraithfire-effect-${sprite.name}-${scene.time.now}`;
  const texture = scene.textures.createCanvas(textureKey, 1000, 700);
  if (!texture) return false;
  const ctx = texture.context;
  ctx.imageSmoothingEnabled = false;
  const effect = scene.add.image(0, 0, textureKey).setOrigin(0).setDepth(100);
  const colors = ["#913224", "#e04a20", "#ff8525", "#ffbe45", "#fff0a3"];
  const pix = (x: number, y: number, w: number, h: number, c: string): void => {
    ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const sun = (x: number, y: number, t: number): void => {
    const growth = Math.min(1, t / 150), r = 8 + growth * 10, p = 2;
    ctx.globalAlpha = .18 * growth;
    for (let ring = 3; ring > 0; ring--) { ctx.fillStyle = ring === 1 ? "#ffbf36" : "#ff7624"; ctx.beginPath(); ctx.arc(x, y, r + ring * 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 14; i++) { const angle = i * Math.PI * 2 / 14 + t * .0018, length = 4 + 3 * Math.sin(t * .014 + i * 2); for (let d = r - 2; d < r + length; d += 2) pix(x + Math.cos(angle) * d - 1, y + Math.sin(angle) * d - 1, 3, 3, d > r + 2 ? "#ff8b24" : "#ffca43"); }
    for (let py = -Math.ceil(r); py <= r; py += p) for (let px = -Math.ceil(r); px <= r; px += p) {
      const dist = Math.hypot(px, py); if (dist > r) continue;
      const noise = Math.sin(px * .7 + t * .012) * Math.cos(py * .6 - t * .009) + Math.sin((px + py) * .9 + t * .015) * .4;
      pix(x + px, y + py, p, p, dist > r - 2 ? "#ff9d28" : noise > .65 ? "#fff8bc" : noise < -.65 ? "#ffb737" : "#ffdf68");
    }
    for (let i = 0; i < 3; i++) { const angle = t * .003 + i * 2.1; pix(x + Math.cos(angle) * (r + 1) - 2, y + Math.sin(angle) * (r + 1) - 2, 4, 4, "#fff0a0"); }
  };
  const beam = (length: number, progress: number, t: number): void => {
    const tip = length * progress; ctx.globalAlpha = Math.min(1, progress * 5);
    for (let i = 0; i < tip; i += 3) {
      const taper = Math.min(1, (tip - i + 10) / 30), r = (6 + Math.sin(i * .13 + t * .019) * 2) * taper;
      pix(i, -r, 4, r * 2, colors[1]); pix(i, -r * .55, 4, r * 1.1, colors[3]); pix(i, -2, 4, 4, colors[4]);
    }
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < tip; i += 3) {
      const a = i * .075 - t * .025 + layer * Math.PI, dy = Math.sin(a) * 14;
      pix(i, dy - 2, 5, Math.cos(a) > 0 ? 5 : 3, Math.cos(a) > 0 ? colors[3] : colors[1]); if (Math.cos(a) > .6) pix(i, dy - 2, 3, 2, colors[4]);
    }
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; pix(tip + Math.cos(a) * 10, Math.sin(a) * 12, 5, 5, colors[2]); }
    pix(tip - 8, -9, 16, 18, colors[3]); pix(tip - 5, -5, 10, 10, colors[4]); ctx.globalAlpha = 1;
  };
  sprite.anims.stop();
  sprite.setData("clarityAttackPlaying", true);
  sprite.setData("approvedClip", "wraithfire");
  sprite.setData("branchSpecialCount", Number(sprite.getData("branchSpecialCount") || 0) + 1);
  sprite.setData("branchSpecialCard", "Wraithfire Bolt");
  sprite.setData("branchSpecialKind", "wraithfire");
  const started = scene.time.now;
  let seek: number | undefined;
  let finished = false;
  const globals = window as unknown as Record<string, unknown>;
  const cleanup = (): void => {
    if (finished) return; finished = true;
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    sprite.off(Phaser.GameObjects.Events.DESTROY, cleanup);
    effect.destroy(); scene.textures.remove(textureKey);
    sprite.setData("clarityAttackPlaying", false);
    sprite.setData("wraithfireState", { phase: "ready", active: false, target: end });
    if (sprite.active) prepareApprovedBranchClip(scene, sprite, "idle");
  };
  const update = (): void => {
    const t = seek ?? scene.time.now - started;
    if (t >= 1450 || !sprite.active) { cleanup(); return; }
    const index = Math.min(clip.files.length - 1, Math.floor(t / 1450 * clip.files.length));
    const anchor = clip.anchors[index];
    const scale = Number(sprite.getData("visibleModelHeight") || 176) / 107;
    sprite.setTexture(`wraithfire-body-${index}`).setOrigin(anchor.footX / sprite.frame.realWidth, anchor.footY / sprite.frame.realHeight).setScale(scale);
    const point = sprite.getWorldTransformMatrix().transformPoint(anchor.gloveX - anchor.footX, anchor.gloveY - anchor.footY);
    if (sprite.flipX) point.x -= 2 * (anchor.gloveX - anchor.footX) * scale;
    ctx.clearRect(0, 0, 1000, 700);
    // Keep effect pixels and glow proportional to the approved preview's 1.7x pose.
    const s = scale / 1.7;
    ctx.save(); ctx.translate(point.x, point.y); ctx.scale(s, s);
    if (t < 490) sun(0, 0, t);
    if (t >= 490 && t < 1080) {
      ctx.save(); ctx.rotate(Math.atan2(end.y - point.y, end.x - point.x));
      beam(Math.hypot(end.x - point.x, end.y - point.y) / s, Math.min(1, (t - 490) / 170), t); ctx.restore();
    }
    ctx.restore();
    if (t >= 1040 && t < 1220) {
      ctx.globalAlpha = 1 - (t - 1040) / 180;
      for (let i = 0; i < 14; i++) { const a = i * 2.4, r = (8 + (t - 1040) * .23) * s; pix(end.x + Math.cos(a) * r, end.y + Math.sin(a) * r, 4 * s, 4 * s, colors[i % 5]); } ctx.globalAlpha = 1;
    }
    texture.refresh();
    sprite.setData("wraithfireState", { active: true, phase: t < 380 ? "charge" : t < 490 ? "thrust" : t < 1080 ? "beam" : "recover", frame: index, sunVisible: t < 490, glove: { x: point.x, y: point.y }, target: end });
  };
  globals.seekWraithfire = (ms: number | null) => { seek = ms === null ? undefined : Math.max(0, ms); update(); };
  globals.wraithfireState = () => sprite.getData("wraithfireState");
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  sprite.once(Phaser.GameObjects.Events.DESTROY, cleanup);
  update();
  return true;
}
