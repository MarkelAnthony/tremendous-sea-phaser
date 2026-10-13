import Phaser from "phaser";

import { launchApprovedBranchBlast, prepareApprovedBranchClip } from "./SeaBranchApprovedClips";

/** Approved Jab, Heavy and polished Fire playback; combat rules stay untouched. */
export function playApprovedBranchAttack(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, kind: string, card: string): boolean {
  if (!sprite.getData("approvedBranchArt")) return false;
  if (sprite.getData("clarityAttackPlaying")) return false;
  sprite.setData("clarityAttackPlaying", true);
  const counter = kind === "punch" ? "branchPunchCount" : kind === "burn" ? "branchBurnCount" : "branchSpecialCount";
  sprite.setData(counter, Number(sprite.getData(counter) || 0) + 1);
  sprite.setData(kind === "punch" ? "branchPunchCard" : kind === "burn" ? "branchBurnCard" : "branchSpecialCard", card);
  if (kind !== "punch" && kind !== "burn") sprite.setData("branchSpecialKind", kind);
  const clip = kind === "punch" ? "jab" : kind === "burn" || kind === "blast" || kind === "eruption" ? "fire" : "heavy";
  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (!sprite.active) return;
    sprite.setData("clarityAttackPlaying", false);
    prepareApprovedBranchClip(scene, sprite, "idle");
  });
  prepareApprovedBranchClip(scene, sprite, clip);
  if (clip === "fire") {
    const release = (): void => {
      if (sprite.texture.key !== "branch-approved-fire-8") return;
      sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, release);
      launchApprovedBranchBlast(scene, sprite);
    };
    sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, release);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, release));
  }
  return true;
}
