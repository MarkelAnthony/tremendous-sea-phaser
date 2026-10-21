import Phaser from "phaser";
import { prepareApprovedBranchClip, type BranchClip } from "./SeaBranchApprovedClips";
import { playApprovedBranchAttack } from "./SeaApprovedBranch";

type FighterScene = Phaser.Scene & { playerBody?: Phaser.GameObjects.Sprite };
const globals = window as unknown as Record<string, unknown>;
let current: { scene: FighterScene; sprite: Phaser.GameObjects.Sprite; block: boolean; heal: boolean; card: string } | undefined;
const history: { clip: string; card: string; time: number }[] = [];
globals.playSeaBranchFallback = (scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, card: string) => playApprovedBranchAttack(scene, sprite, "punch", card);
function record(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, clip: string, card: string): void {
  history.push({ clip, card, time: scene.time.now });
  if (history.length > 80) history.shift();
  sprite.setData("branchSupportCard", card);
}
function support(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, clips: BranchClip[], card: string): void {
  if (!sprite.active) return;
  const next = (): void => {
    if (!sprite.active) return;
    const clip = clips.shift();
    if (!clip) {
      sprite.setData("clarityAttackPlaying", false);
      prepareApprovedBranchClip(scene, sprite, "idle");
      return;
    }
    sprite.setData("clarityAttackPlaying", true);
    record(scene, sprite, clip, card);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, next);
    prepareApprovedBranchClip(scene, sprite, clip);
  };
  if (sprite.getData("clarityAttackPlaying")) {
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, next);
  } else next();
}
globals.beginBranchCardAnimation = (card: { name: string; dmg?: number }, branch: boolean): void => {
  const scene = (globals.game as Phaser.Game | undefined)?.scene.getScenes(true)[0] as FighterScene | undefined;
  const sprite = scene?.playerBody;
  if (!branch || !scene || !sprite?.active || !sprite.getData("approvedBranchArt")) return;
  current = { scene, sprite, card: card.name, block: false, heal: false };
  if (/kick/i.test(card.name)) playApprovedBranchAttack(scene, sprite, "kick", card.name);
};
globals.noteBranchCardEffect = (kind: "block" | "heal"): void => {
  if (current) current[kind] = true;
};
globals.endBranchCardAnimation = (): void => {
  const action = current;
  current = undefined;
  if (!action) return;
  const { scene, sprite, card } = action;
  if (sprite.getData("clarityAttackPlaying")) record(scene, sprite, String(sprite.getData("approvedClip")), card);
  const clips: BranchClip[] = [];
  if (action.block) clips.push("block");
  if (action.heal) clips.push("heal");
  if (clips.length) support(scene, sprite, clips, card);
};
globals.branchAnimationState = () => {
  const scene = (globals.game as Phaser.Game | undefined)?.scene.getScenes(true)[0] as FighterScene | undefined;
  return { clip: scene?.playerBody?.getData("approvedClip"), busy: !!scene?.playerBody?.getData("clarityAttackPlaying"), history: [...history] };
};
