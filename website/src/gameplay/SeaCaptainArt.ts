import Phaser from "phaser";
import { queueSeaAttackImpact } from "./SeaAttackImpact";
import { preloadCharacterAtlas, characterManifest, characterAtlasKey, selectCharacterState } from "../shared/animation";

const RILEY = "b872b214-8d45-4f34-b202-a5ca77f2e210";
export function preloadSeaCaptain(scene: Phaser.Scene): void {
  preloadCharacterAtlas(scene, RILEY);
  scene.load.image("riley-readable-fist", new URL("art/riley-readable-fist.png", document.baseURI).href);
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
  if (sprite.getData("clarityAttackPlaying")) {
    sprite.setData("afterAttackStance", stance);
    return;
  }
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
    // Hand-only pixel repair: squared knuckles and a tucked-thumb crease.
    if (!scene.textures.exists("riley-readable-fist")) return;
    sprite.anims.stop();
    sprite.setTexture("riley-readable-fist");
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
/** A damage-based Clarity gain is the shared trigger for every Four Sword attack. */
export function playSeaClarityAttack(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): void {
  const manifest = characterManifest(scene, RILEY);
  const selection = selectCharacterState(manifest, { state: RILEY, preferredClips: ["Four Sword Swipe"] });
  const clip = selection.state.animations.find((candidate) =>
    (candidate as typeof candidate & { display_name?: string }).display_name === "Four Sword Swipe" && candidate.directions.includes("east"));
  if (!clip) return;
  const key = characterAtlasKey(RILEY);
  const pattern = (clip as typeof clip & { atlas_frame_pattern: string }).atlas_frame_pattern;
  const frames = Array.from({ length: clip.frame_count }, (_, index) => ({
    key, frame: pattern.replace("{direction}", "east").replace("{frame}", String(index).padStart(3, "0")),
  }));
  if (frames.some(({ frame }) => !scene.textures.get(key).has(frame))) return;
  const animationKey = `${key}-sea-four-sword-attack`;
  if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames, frameRate: 10, repeat: 0 });
  // Area attacks and multi-hit cards can grant Clarity repeatedly in one resolution.
  if (sprite.getData("clarityAttackPlaying")) return;
  sprite.setData("clarityAttackPlaying", true);
  sprite.setData("clarityAttackCount", (Number(sprite.getData("clarityAttackCount")) || 0) + 1);
  sprite.setData("afterAttackStance", "FourSword");
  queueSeaAttackImpact(scene, sprite, "swords", clip.frame_count);
  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (!sprite.active) return;
    sprite.setData("clarityAttackPlaying", false);
    const stance = String(sprite.getData("afterAttackStance") || "FourSword");
    sprite.setData("stance", undefined);
    updateSeaCaptainStance(scene, sprite, stance);
  });
  sprite.play(animationKey);
}
const globals = window as unknown as Record<string, unknown>;
globals.preloadSeaCaptain = preloadSeaCaptain;
globals.createSeaCaptain = createSeaCaptain;
globals.updateSeaCaptainStance = updateSeaCaptainStance;

globals.playSeaClarityAttack = playSeaClarityAttack;

/** Play the approved punch when a Fist Blade attack receives its home-stance boost. */
export function playSeaFistBladeAttack(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): void {
  if (sprite.getData("clarityAttackPlaying")) return;
  const manifest = characterManifest(scene, RILEY);
  const selection = selectCharacterState(manifest, {
    state: "b15bd612-59f4-4175-915d-0b777cfb835b", preferredClips: ["Fist Blade Punch"],
  });
  const clip = selection.state.animations.find((candidate) =>
    (candidate as typeof candidate & { display_name?: string }).display_name === "Fist Blade Punch" && candidate.directions.includes("east"));
  if (!clip) return;
  const key = characterAtlasKey(RILEY);
  const pattern = (clip as typeof clip & { atlas_frame_pattern: string }).atlas_frame_pattern;
  const frames = Array.from({ length: clip.frame_count }, (_, index) => ({
    key, frame: pattern.replace("{direction}", "east").replace("{frame}", String(index).padStart(3, "0")),
  }));
  if (frames.some(({ frame }) => !scene.textures.get(key).has(frame))) return;
  const animationKey = `${key}-sea-fist-blade-attack`;
  if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames, frameRate: 10, repeat: 0 });
  const sway = sprite.getData("fistSway") as Phaser.Tweens.Tween | undefined;
  if (sway) {
    sway.stop();
    sprite.setX(sprite.getData("fistRestX") as number).setAngle(sprite.getData("fistRestAngle") as number);
    sprite.setData("fistSway", undefined);
  }
  sprite.setData("clarityAttackPlaying", true);
  sprite.setData("fistAttackCount", (Number(sprite.getData("fistAttackCount")) || 0) + 1);
  sprite.setData("afterAttackStance", "FistBlade");
  queueSeaAttackImpact(scene, sprite, "fist", clip.frame_count);
  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (!sprite.active) return;
    sprite.setData("clarityAttackPlaying", false);
    const stance = String(sprite.getData("afterAttackStance") || "FistBlade");
    sprite.setData("stance", undefined);
    updateSeaCaptainStance(scene, sprite, stance);
  });
  sprite.play(animationKey);
}
globals.playSeaFistBladeAttack = playSeaFistBladeAttack;
