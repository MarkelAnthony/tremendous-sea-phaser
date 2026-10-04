import Phaser from "phaser";
import { animationMapFromManifest, characterAtlasKey, characterManifest, SpriteAnimator, type AnimationMap } from "../shared/animation";
import { createPlatformerWorld, stepPlatformerBody, type PlatformerBody, type PlatformerWorld } from "../pixellab/platformer";
import type { LoadedMap } from "../pixellab/types";
import type { PlayerController } from "../player/PlayerController";
import { GAME_CONFIG } from "../config";
import { ENEMY_COMBAT, ENEMY_PROFILES, PLAYER_COMBAT, type EnemyProfile } from "../gameplay/combatConfig";
import { PHYSICS } from "../player/physicsConfig";

/** A terrain-aware patrol with timed strikes, reactions and complete death clips. */
export class ForestEnemy {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly animator: SpriteAnimator;
  private readonly animations: AnimationMap;
  private readonly body: PlatformerBody;
  private readonly world: PlatformerWorld;
  private facing: "east" | "west" = "west";
  private health: number;
  private action: string | null = null;
  private actionMs = 0;
  private cooldownMs: number = ENEMY_COMBAT.initialWaitMs;
  private dealtDamage = false;
  private attackIndex = 0;
  private patrolDirection = 1;
  private readonly profile: EnemyProfile;

  constructor(
    scene: Phaser.Scene,
    map: LoadedMap,
    readonly characterId: string,
    x: number,
    y: number,
    private readonly patrolMin: number,
    private readonly patrolMax: number,
  ) {
    const manifest = characterManifest(scene, characterId);
    this.animations = animationMapFromManifest(manifest);
    this.profile = ENEMY_PROFILES[characterId];
    this.health = this.profile.health;
    this.body = { x, y, vx: 0, vy: 0, grounded: false };
    this.world = createPlatformerWorld(map);
    this.sprite = scene.add.sprite(x, y, characterAtlasKey(characterId)).setOrigin(0.5, 1).setDepth(9);
    this.animator = new SpriteAnimator(this.sprite, characterAtlasKey(characterId), this.animations, manifest.states[0].folder);
  }

  get defeated(): boolean { return this.health === 0; }
  get state(): Record<string, unknown> {
    return { character: this.characterId, x: this.body.x, y: this.body.y, health: this.health, action: this.action, frame: this.sprite.frame.name };
  }

  hit(origin: { x: number; y: number }, facing: string, heavy: boolean, damage: number): void {
    if (this.defeated) return;
    const dx = this.body.x - origin.x;
    const range = heavy ? PLAYER_COMBAT.heavyRange : PLAYER_COMBAT.lightRange;
    const behind = facing === "east" ? dx < -PLAYER_COMBAT.backReach : dx > PLAYER_COMBAT.backReach;
    if (Math.abs(dx) > range || Math.abs(this.body.y - origin.y) > PLAYER_COMBAT.verticalReach || behind) return;
    this.health = Math.max(0, this.health - damage);
    this.begin(this.defeated ? "death" : this.profile.reaction);
    this.cooldownMs = ENEMY_COMBAT.recoveryMs;
  }

  update(deltaMs: number, player: PlayerController): void {
    this.cooldownMs -= deltaMs;
    const dx = player.worldPosition.x - this.body.x;
    const near = Math.abs(dx) < ENEMY_COMBAT.noticeRange && Math.abs(player.worldPosition.y - this.body.y) < ENEMY_COMBAT.noticeHeight;
    if (near && !this.defeated) player.continueCombat();
    if (!this.action) {
      if (near) this.facing = dx < 0 ? "west" : "east";
      if (near && Math.abs(dx) < ENEMY_COMBAT.attackRange && this.cooldownMs <= 0 && player.hitPoints > 0) {
        const attacks = this.profile.attacks;
        this.begin(attacks[this.attackIndex++ % attacks.length]);
      } else if (near && Math.abs(dx) > ENEMY_COMBAT.approachRange) {
        this.body.vx = Math.sign(dx) * this.profile.chaseSpeed;
        this.animator.setClip(this.profile.chaseClip, this.facing);
      } else if (!near && this.cooldownMs < -ENEMY_COMBAT.patrolPauseMs) {
        if (this.body.x >= this.patrolMax) this.patrolDirection = -1;
        if (this.body.x <= this.patrolMin) this.patrolDirection = 1;
        this.facing = this.patrolDirection > 0 ? "east" : "west";
        this.body.vx = this.patrolDirection * ENEMY_COMBAT.patrolSpeed;
        this.animator.setClip("walk", this.facing);
        if (this.cooldownMs < -ENEMY_COMBAT.patrolEndMs) this.cooldownMs = ENEMY_COMBAT.patrolRestMs;
      } else {
        this.body.vx = 0;
        this.animator.setClip("breathe", this.facing);
      }
    }
    if (this.action) {
      this.body.vx = this.action === "dodge" ? (this.facing === "east" ? -ENEMY_COMBAT.dodgeSpeed : ENEMY_COMBAT.dodgeSpeed) : 0;
      this.actionMs += deltaMs;
      const clip = this.animations[this.action];
      const duration = clip.frameCount * 1000 / (clip.fps ?? GAME_CONFIG.animation.fps);
      const attacking = this.profile.attacks.includes(this.action);
      if (attacking && !this.dealtDamage && this.actionMs >= duration * ENEMY_COMBAT.hitMoment) {
        this.dealtDamage = true;
        const behind = this.facing === "east" ? dx < -ENEMY_COMBAT.backReach : dx > ENEMY_COMBAT.backReach;
        if (!behind && Math.abs(dx) < ENEMY_COMBAT.hitRange && Math.abs(player.worldPosition.y - this.body.y) < ENEMY_COMBAT.hitHeight) player.takeDamage();
      }
      if (this.actionMs >= duration && this.action !== "death") {
        this.action = null;
        if (attacking) this.cooldownMs = ENEMY_COMBAT.recoveryMs;
      }
    }
    // Patrol bounds keep enemies on their own clearing rather than walking into ravines.
    this.body.x = Phaser.Math.Clamp(this.body.x, this.patrolMin, this.patrolMax);
    stepPlatformerBody(
      this.world, this.body,
      ENEMY_COMBAT.colliderWidth, ENEMY_COMBAT.colliderHeight,
      deltaMs / 1000, PHYSICS.gravityY, PHYSICS.maxFallSpeed, PHYSICS.surfaceInsetPx,
    );
    this.sprite.setPosition(this.body.x, this.body.y + this.profile.footPadding);
    this.sprite.setFlipX(this.profile.mirrorWest && this.facing === "west");
    this.animator.update(deltaMs);
  }

  private begin(action: string): void {
    this.action = action;
    this.actionMs = 0;
    this.dealtDamage = false;
    this.animator.setClip(action, this.facing);
    this.animator.restartClip();
  }
}
