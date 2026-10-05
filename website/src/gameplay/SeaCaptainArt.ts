import Phaser from "phaser";
import { preloadCharacterAtlas, characterManifest, characterAtlasKey, characterRotationFrameName, selectCharacterState } from "../shared/animation";

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
  sprite.setData("stance", "FourSword");
  return sprite;
}
/** Play each approved stance's own idle loop; Four Swords retains its original clip. */
export function updateSeaCaptainStance(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, stance: string): void {
  if (sprite.getData("stance") === stance) return;
  const manifest = characterManifest(scene, RILEY);
  const stateId = stance === "FistBlade" ? "b15bd612-59f4-4175-915d-0b777cfb835b" : stance === "Entropy" ? "86587070-efce-4ef8-b513-e5a10a41dc6c" : RILEY;
  const state = manifest.states.find((candidate) => candidate.id === stateId);
  if (!state) return;
  // Preserve Fist Blade's extended-arm, closed-fist pose throughout the gentle sway.
  const previousSway = sprite.getData("fistSway") as Phaser.Tweens.Tween | undefined;
  if (previousSway) {
    previousSway.stop();
    sprite.setX(sprite.getData("fistRestX") as number).setAngle(sprite.getData("fistRestAngle") as number);
    sprite.setData("fistSway", undefined);
  }
  if (stance === "FistBlade") {
    const pose = characterRotationFrameName(state.folder, "east");
    const key = characterAtlasKey(RILEY);
    if (!scene.textures.get(key).has(pose)) return;
    sprite.anims.stop();
    sprite.setTexture(key, pose);
    sprite.setData("fistRestX", sprite.x);
    sprite.setData("fistRestAngle", sprite.angle);
    sprite.setData("fistSway", scene.tweens.add({
      targets: sprite, x: sprite.x + 0.7, angle: sprite.angle + 0.45,
      duration: 1300, ease: "Sine.easeInOut", yoyo: true, repeat: -1,
    }));
  }
  else if (stateId === RILEY) sprite.play(`${characterAtlasKey(RILEY)}-sea-idle`);
  else {
    const clipName = "Entropy idle";
    const selection = selectCharacterState(manifest, { state: state.id, preferredClips: [clipName] });
    const clip = selection.state.animations.find((candidate) =>
      (candidate as typeof candidate & { display_name?: string }).display_name === clipName && candidate.directions.includes("east"));
    if (!clip) return;
    const key = characterAtlasKey(RILEY);
    const pattern = (clip as typeof clip & { atlas_frame_pattern: string }).atlas_frame_pattern;
    const frames = Array.from({ length: clip.frame_count }, (_, index) => ({
      key, frame: pattern.replace("{direction}", "east").replace("{frame}", String(index).padStart(3, "0")),
    }));
    if (frames.some(({ frame }) => !scene.textures.get(key).has(frame))) return;
    const animationKey = `${key}-sea-${stance}-idle`;
    if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames, frameRate: 6, repeat: -1 });
    sprite.play(animationKey);
  }
  sprite.setData("stance", stance);
  sprite.setData("swords", stance === "FourSword" ? { held: ["red", "green"], floating: ["blue"] } : { held: [], floating: stance === "Entropy" ? ["gold", "gold", "gold"] : ["red", "green", "blue"] });
}
const globals = window as unknown as Record<string, unknown>;
globals.preloadSeaCaptain = preloadSeaCaptain;
globals.createSeaCaptain = createSeaCaptain;
globals.updateSeaCaptainStance = updateSeaCaptainStance;
