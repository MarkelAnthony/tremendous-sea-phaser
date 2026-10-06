import Phaser from "phaser";
import { characterManifest, characterAtlasKey, resolveCharacterAnimation } from "../shared/animation";

const BRANCH = "76af08a0-4d26-40fc-b346-558313f02bcb";
interface BurnCard {
  name: string;
  enflame?: number;
  selfEnflame?: number;
  secondTargetEnflame?: number;
  detonateSpreadHalf?: boolean;
  reapplyOriginalEnflame?: boolean;
  enflameSpreadHalfIfPresent?: boolean;
  detonateReapplyAndAgain?: number;
}

/** Enflame applications use casting; physical attack keywords retain priority. */
export function playSeaBranchBurn(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, card: BurnCard): boolean {
  if (sprite.getData("captain") !== "Branch" || sprite.getData("clarityAttackPlaying")) return false;
  if (/\b(punch(?:es|ing)?|jabs?|fists?|cross|crosses|uppercuts?|haymakers?|hooks?|straights?|kicks?|kicking)\b/i.test(card.name)) return false;
  if (!(card.enflame || card.selfEnflame || card.secondTargetEnflame || card.detonateSpreadHalf || card.reapplyOriginalEnflame || card.enflameSpreadHalfIfPresent || card.detonateReapplyAndAgain)) return false;
  const clip = resolveCharacterAnimation(characterManifest(scene, BRANCH), ["Branch burn"], { state: BRANCH, direction: "east" });
  if (!clip) return false;
  const key = characterAtlasKey(BRANCH);
  const pattern = (clip.animation as typeof clip.animation & { atlas_frame_pattern: string }).atlas_frame_pattern;
  const frames = Array.from({ length: clip.animation.frame_count }, (_, index) => ({
    key, frame: pattern.replace("{direction}", "east").replace("{frame}", String(index).padStart(3, "0")),
  }));
  if (frames.some(({ frame }) => !scene.textures.get(key).has(frame))) return false;
  const animationKey = `${key}-sea-branch-burn`;
  if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames, frameRate: 10, repeat: 0 });
  sprite.setData("clarityAttackPlaying", true);
  sprite.setData("branchBurnCount", (Number(sprite.getData("branchBurnCount")) || 0) + 1);
  sprite.setData("branchBurnCard", card.name);
  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (!sprite.active) return;
    sprite.setData("clarityAttackPlaying", false);
    sprite.play(`${key}-sea-branch-idle`);
  });
  sprite.play(animationKey);
  return true;
}
const globals = window as unknown as Record<string, unknown>;
globals.playSeaBranchBurn = playSeaBranchBurn;
globals.previewBranchBurn = (card: BurnCard = { name: "Slow Burn", enflame: 3 }) => {
  const game = globals.game as Phaser.Game | undefined;
  const scene = game?.scene.getScenes(true)[0] as (Phaser.Scene & { playerBody?: Phaser.GameObjects.Sprite }) | undefined;
  return !!scene?.playerBody && playSeaBranchBurn(scene, scene.playerBody, card);
};
