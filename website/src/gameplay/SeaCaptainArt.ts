import Phaser from "phaser";
import { preloadCharacterAtlas, characterManifest, characterAtlasKey, selectCharacterState } from "../shared/animation";

const RILEY = "b872b214-8d45-4f34-b202-a5ca77f2e210";
export function preloadSeaCaptain(scene: Phaser.Scene): void {
  preloadCharacterAtlas(scene, RILEY);
}
export function createSeaCaptain(scene: Phaser.Scene, captain: string): Phaser.GameObjects.Sprite | null {
  if (captain !== "Riley") return null;
  const manifest = characterManifest(scene, RILEY);
  const selection = selectCharacterState(manifest, { preferredClips: ["Riley idle", "breathing-idle"] });
  const clip = selection.state.animations.find((animation) => animation.directions.includes("east"));
  if (!clip) return null; // Never replace a missing idle animation with a static rotation.
  const key = characterAtlasKey(RILEY);
  // Riley's four-frame idle retains both held swords and her floating blue blade.
  const pattern = (clip as typeof clip & { atlas_frame_pattern: string }).atlas_frame_pattern;
  const frames = Array.from({ length: clip.frame_count }, (_, index) => ({ key, frame: pattern.replace("{direction}", "east").replace("{frame}", String(index).padStart(3, "0")) }));
  const animationKey = `${key}-sea-idle`;
  if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames, frameRate: 6, repeat: -1 });
  const sprite = scene.add.sprite(0, 75, key, frames[0].frame);
  sprite.setOrigin(0.5, 1).setScale(1.35).play(animationKey);
  sprite.setData("swords", { held: ["red", "green"], floating: "blue" });
  return sprite;
}
const globals = window as unknown as Record<string, unknown>;
globals.preloadSeaCaptain = preloadSeaCaptain;
globals.createSeaCaptain = createSeaCaptain;
