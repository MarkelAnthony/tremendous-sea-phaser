import Phaser from "phaser";

/** Keep the approved single-pose artwork visible until matching clips are approved. */
export function playApprovedBranchAttack(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, kind: string, card: string): boolean {
  if (!sprite.getData("approvedBranchArt")) return false;
  if (sprite.getData("clarityAttackPlaying")) return false;
  sprite.setData("clarityAttackPlaying", true);
  const counter = kind === "punch" ? "branchPunchCount" : kind === "burn" ? "branchBurnCount" : "branchSpecialCount";
  sprite.setData(counter, Number(sprite.getData(counter) || 0) + 1);
  sprite.setData(kind === "punch" ? "branchPunchCard" : kind === "burn" ? "branchBurnCard" : "branchSpecialCard", card);
  if (kind !== "punch" && kind !== "burn") sprite.setData("branchSpecialKind", kind);
  const restX = sprite.x;
  scene.tweens.add({ targets: sprite, x: restX + (kind === "punch" ? 18 : 5), duration: 240, yoyo: true, ease: "Sine.easeInOut", onComplete: () => {
    if (!sprite.active) return;
    sprite.setX(restX);
    sprite.setData("clarityAttackPlaying", false);
  } });
  return true;
}
