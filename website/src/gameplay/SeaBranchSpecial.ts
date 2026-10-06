import Phaser from "phaser";
import { characterManifest, characterAtlasKey, selectCharacterState } from "../shared/animation";

const BRANCH = "76af08a0-4d26-40fc-b346-558313f02bcb";
const specials: Record<string, string> = {
  "Wildfire Haymaker": "haymaker",
  "Branch's Fury": "haymaker",
  "Wraithfire Bolt": "blast",
  "Fireball Candy - Megaton": "blast",
  "Fireball Candy - Fafnir": "blast",
  "Phoenix Fire Storm": "eruption",
  "Fireball Candy - Wildfire": "eruption",
  "Fireball Candy - Eviscerate": "eruption",
  "Fireball Candy - Supernova": "eruption",
  "Branch Bomb": "eruption",
};

/** Explicit heavy-card routing takes priority over generic punch/burn keywords. */
export function playSeaBranchSpecial(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, card: { name: string }): boolean {
  const kind = specials[card.name];
  if (sprite.getData("captain") !== "Branch" || !kind || sprite.getData("clarityAttackPlaying")) return false;
  const name = `Branch special ${kind}`;
  const selection = selectCharacterState(characterManifest(scene, BRANCH), { state: BRANCH, preferredClips: [name] });
  const clip = selection.state.animations.find((candidate) =>
    (candidate as typeof candidate & { display_name?: string }).display_name === name && candidate.directions.includes("east"));
  if (!clip) return false;
  const key = characterAtlasKey(BRANCH);
  const pattern = (clip as typeof clip & { atlas_frame_pattern: string }).atlas_frame_pattern;
  const frames = Array.from({ length: clip.frame_count }, (_, index) => ({ key,
    frame: pattern.replace("{direction}", "east").replace("{frame}", String(index).padStart(3, "0")),
  }));
  if (frames.some(({ frame }) => !scene.textures.get(key).has(frame))) return false;
  const animationKey = `${key}-sea-branch-special-${kind}`;
  if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames, frameRate: 10, repeat: 0 });
  sprite.setData("clarityAttackPlaying", true);
  sprite.setData("branchSpecialCount", (Number(sprite.getData("branchSpecialCount")) || 0) + 1);
  sprite.setData("branchSpecialCard", card.name);
  sprite.setData("branchSpecialKind", kind);
  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (!sprite.active) return;
    sprite.setData("clarityAttackPlaying", false);
    sprite.play(`${key}-sea-branch-idle`);
  });
  sprite.play(animationKey);
  // A short impact shake emphasizes these finishers without changing damage or timing rules.
  scene.time.delayedCall(600, () => {
    if (sprite.active && sprite.getData("clarityAttackPlaying")) scene.cameras.main.shake(140, 0.003);
  });
  return true;
}
const globals = window as unknown as Record<string, unknown>;
globals.playSeaBranchSpecial = playSeaBranchSpecial;
globals.previewBranchSpecial = (name: string) => {
  const game = globals.game as Phaser.Game | undefined;
  const scene = game?.scene.getScenes(true)[0] as (Phaser.Scene & { playerBody?: Phaser.GameObjects.Sprite }) | undefined;
  return !!scene?.playerBody && playSeaBranchSpecial(scene, scene.playerBody, { name });
};
