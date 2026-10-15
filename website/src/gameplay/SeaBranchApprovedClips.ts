import Phaser from "phaser";
import { publicAssetUrl } from "../pixellab/templateAssetPaths";

const sequences = {
  idle: Array.from({ length: 8 }, (_, i) => `branch-combat/idle-${i}.png`),
  jab: [2, 1, 0, 1, 2].map(i => `branch-redraw-attacks/jab-${i}.png`),
  heavy: Array.from({ length: 6 }, (_, i) => `branch-redraw-attacks/heavy-${i}.png`),
  fire: Array.from({ length: 17 }, (_, i) => `branch-redraw-attacks/fire-${i}.png`),
};
export type BranchClip = keyof typeof sequences;
const key = (clip: BranchClip, i: number): string => `branch-approved-${clip}-${i}`;

export function preloadApprovedBranchClips(scene: Phaser.Scene): void {
  scene.load.image("branch-approved-redraw", publicAssetUrl("art", "branch-approved-redraw.png"));
  for (const clip of Object.keys(sequences) as BranchClip[]) sequences[clip].forEach((path, i) => {
    scene.load.image(key(clip, i), new URL(`previews/${path}`, document.baseURI).href);
  });
}

/** A single fixed canvas anchor per sequence preserves drawn footwork, not frame-by-frame snapping. */
export function prepareApprovedBranchClip(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, clip: BranchClip): void {
  // Return to the approved guard between the approved redraw attack sequences.
  if (clip === "idle" && scene.textures.exists("branch-approved-redraw")) {
    sprite.anims.stop();
    const frame = scene.textures.get("branch-approved-redraw").get();
    sprite.setTexture("branch-approved-redraw").setOrigin(0.5, 1)
      .setScale(Number(sprite.getData("visibleModelHeight") || 176) / frame.realHeight);
    sprite.setData("approvedClip", "idle");
    sprite.setData("redrawArt", "approved-christmas-v5");
    return;
  }
  const first = scene.textures.get(key(clip, 0)).get();
  const canvas = document.createElement("canvas");
  canvas.width = first.cutWidth; canvas.height = first.cutHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let left = canvas.width, right = 0, top = canvas.height, bottom = 0;
  if (context) {
    context.drawImage(first.source.image as CanvasImageSource, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 100) {
        left = Math.min(left, x); right = Math.max(right, x + 1);
        top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
      }
    }
  }
  sprite.setTexture(key(clip, 0)).setOrigin((left + right) / 2 / canvas.width, bottom / canvas.height)
    .setScale(Number(sprite.getData("visibleModelHeight") || 176) / Math.max(1, bottom - top));
  const animation = `branch-approved-${clip}`;
  if (!scene.anims.exists(animation)) scene.anims.create({ key: animation, frameRate: 1000,
    frames: sequences[clip].map((_, i) => ({ key: key(clip, i), duration: (clip === "fire" ? 100 : clip === "idle" ? 140 : 90) - 1 })),
    repeat: clip === "idle" ? -1 : 0,
  });
  sprite.setData("approvedClip", clip);
  sprite.play(animation);
}

export function launchApprovedBranchBlast(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): void {
  const direction = sprite.flipX ? -1 : 1;
  const scale = Math.abs(sprite.scaleX);
  // Match the hand location in the saved Fire preview (55% of its canvas).
  const x = sprite.x + direction * (sprite.frame.realWidth * 0.55 - sprite.displayOriginX) * scale;
  const y = sprite.y + (sprite.frame.realHeight * 0.55 - sprite.displayOriginY) * scale;
  const burst = scene.add.container(x, y).setDepth(sprite.depth + 2).setScale(direction * scale, scale);
  sprite.parentContainer?.add(burst);
  const flash = scene.add.graphics().fillStyle(0xfff4ce, 1);
  flash.fillPoints([new Phaser.Math.Vector2(-10, 0), new Phaser.Math.Vector2(-3, -3), new Phaser.Math.Vector2(0, -10), new Phaser.Math.Vector2(3, -3), new Phaser.Math.Vector2(10, 0), new Phaser.Math.Vector2(3, 3), new Phaser.Math.Vector2(0, 10), new Phaser.Math.Vector2(-3, 3)], true);
  burst.add(flash);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 0.25, duration: 65 });
  const flame = scene.add.graphics();
  flame.fillStyle(0xe84a19).fillTriangle(-24, -10, 18, 0, -24, 10);
  flame.fillStyle(0xffad32).fillEllipse(-2, 0, 30, 14);
  flame.fillStyle(0xfff2ba).fillEllipse(4, 0, 15, 7);
  flame.x = 20; burst.add(flame);
  scene.tweens.add({ targets: flame, x: 78, alpha: 0, duration: 230 });
  for (let i = 0; i < 10; i++) {
    const ember = scene.add.rectangle(14, 0, 2, 2, i % 3 ? 0xff9d2e : 0xffe391);
    burst.add(ember);
    scene.tweens.add({ targets: ember, x: 72 + i * 4, y: (i % 2 ? 1 : -1) * (10 + i % 4 * 4) + 8, alpha: 0, scale: 0.5, duration: 300, delay: i * 11 });
  }
  sprite.setData("branchBurnEffectCount", Number(sprite.getData("branchBurnEffectCount") || 0) + 1);
  scene.time.delayedCall(420, () => burst.destroy());
}
