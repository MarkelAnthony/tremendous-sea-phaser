import Phaser from "phaser";
import { GAME_CONFIG } from "../config";
import { PLAYER_CHARACTER_ID } from "../pixellab/templateAssetPaths";
import {
  createPlatformerWorld,
  overlapsAny,
  stepPlatformerBody,
  type PlatformerBody,
  type PlatformerWorld,
} from "../pixellab/platformer";
import type { LoadedMap } from "../pixellab/types";
import {
  SpriteAnimator,
  type AnimationMap,
  type CharacterStateSelection,
  characterAtlasKey,
  characterManifest,
  characterRotationFrameName,
  preloadCharacterAtlas,
  selectCharacterState,
} from "../shared/animation";
import type { Direction } from "../shared/direction";
import { PLAYER_COMBAT } from "../gameplay/combatConfig";
import { PHYSICS } from "./physicsConfig";

const ATTACK_KEYS = [["J", "attack"], ["K", "heavy"], ["L", "flourish"]] as const;

type PlayerActionName = "attack" | "heavy" | "flourish" | "hurt" | "death";

interface ActivePlayerAction {
  name: PlayerActionName;
  durationMs: number;
  hits: readonly { atMs: number; damage: number }[];
  nextHit: number;
}

interface PlayerControllerCallbacks {
  onAttack?: (origin: { x: number; y: number }, direction: Direction, heavy: boolean, damage: number) => void;
  /** Player touched a hazard rect (spikes, lava, the pit). */
  onHazard?: () => void;
  /** Player reached a goal rect. */
  onGoal?: () => void;
}

/**
 * Sidescroller player: gravity, coyote time, jump buffering, variable jump
 * height, double jump, one-way platforms. Facing is east/west only. Tuning lives in
 * `physicsConfig.ts` — edit constants there instead of this controller.
 */
export class PlayerController {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly animator: SpriteAnimator;
  private movementStateFolder: string;
  private movementAnimations: AnimationMap;
  private readonly stances: { normal: CharacterStateSelection; armed: CharacterStateSelection };
  private armed = false;
  private combatUntilMs = 0;
  private readonly runningAnimations: AnimationMap;
  private health: number = PLAYER_COMBAT.maxHealth;
  private invulnerableMs = 0;
  private world: PlatformerWorld;
  private readonly body: PlatformerBody;
  private direction: Direction = "east";
  private lastGroundedAtMs = 0;
  private jumpPressedAtMs = -Infinity;
  private prevJumpDown = false;
  private airJumpsUsed = 0;
  private elapsedMs = 0;
  private activeAction: ActivePlayerAction | null = null;
  private actionElapsedMs = 0;
  // Character canvases are padded for animation room, so the drawn feet sit
  // above the canvas bottom. Each stance has its own measured padding; added to the
  // sprite position so the visual feet touch the physics floor.
  private footPadding = 0;

  readonly sprite: Phaser.GameObjects.Sprite;

  static preload(scene: Phaser.Scene): void {
    preloadCharacterAtlas(scene, PLAYER_CHARACTER_ID);
  }

  constructor(
    scene: Phaser.Scene,
    mapData: LoadedMap,
    x: number,
    y: number,
    private readonly callbacks: PlayerControllerCallbacks = {},
  ) {
    this.world = createPlatformerWorld(mapData);
    this.body = { x, y, vx: 0, vy: 0, grounded: false };
    const atlasKey = characterAtlasKey(PLAYER_CHARACTER_ID);
    const manifest = characterManifest(scene, PLAYER_CHARACTER_ID);
    this.stances = {
      normal: selectCharacterState(manifest, { state: PLAYER_COMBAT.normal.state }),
      armed: selectCharacterState(manifest, { state: PLAYER_COMBAT.armed.state }),
    };
    this.runningAnimations = this.stances.normal.animations;
    const selected = this.stances.normal;
    this.movementStateFolder = selected.stateFolder;
    this.movementAnimations = selected.animations;
    const idleFrameName = characterRotationFrameName(this.movementStateFolder, "east");
    this.sprite = scene.add.sprite(x, y, atlasKey, idleFrameName);
    this.sprite.setOrigin(0.5, 1);
    this.footPadding = PLAYER_COMBAT.normal.footPadding;
    this.animator = new SpriteAnimator(this.sprite, atlasKey, this.movementAnimations, this.movementStateFolder);

    this.keys = scene.input.keyboard!.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,SPACE,J,K,L,R") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
  }

  setMapData(mapData: LoadedMap): void {
    this.world = createPlatformerWorld(mapData);
  }

  get worldPosition(): Readonly<{ x: number; y: number }> {
    return this.body;
  }

  /** Direction the player is currently facing ("east" or "west"). */
  get facing(): Direction {
    return this.direction;
  }

  get isGrounded(): boolean {
    return this.body.grounded;
  }

  /** Debug/playtest introspection. */
  get debugInfo(): Record<string, unknown> {
    return {
      body: { ...this.body },
      health: this.health, armed: this.armed, combatUntilMs: this.combatUntilMs, action: this.activeAction?.name,
      frame: this.sprite.frame.name,
      solidCells: this.world.mapData.terrainMap.cellIndex.size,
      oneWayCells: this.world.oneWayCellKeys.size,
      oneWayRects: this.world.oneWayRects.length,
      hazards: this.world.hazardRects.length,
      goals: this.world.goalRects.length,
      footPadding: this.footPadding,
      elapsedMs: this.elapsedMs,
      jumpPressedAtMs: this.jumpPressedAtMs,
      lastGroundedAtMs: this.lastGroundedAtMs,
      airJumpsUsed: this.airJumpsUsed,
      spaceIsDown: this.keys.SPACE.isDown,
    };
  }

  /** Queue a jump as if the jump key was just pressed (touch/gamepad hooks). */
  queueJump(): void {
    this.jumpPressedAtMs = this.elapsedMs;
  }

  teleportTo(x: number, y: number): void {
    this.health = PLAYER_COMBAT.maxHealth;
    this.activeAction = null;
    this.invulnerableMs = PLAYER_COMBAT.respawnGraceMs;
    this.combatUntilMs = 0;
    this.setStance(false);
    this.body.x = x;
    this.body.y = y;
    this.body.vx = 0;
    this.body.vy = 0;
    this.sprite.setPosition(x, y + this.footPadding);
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const dt = deltaMs / 1000;
    const isRunning = this.keys.SHIFT.isDown;
    this.invulnerableMs = Math.max(0, this.invulnerableMs - deltaMs);
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.callbacks.onHazard?.();
    if (!this.activeAction) {
      const fighting = this.elapsedMs < this.combatUntilMs;
      if (fighting !== this.armed) this.setStance(fighting);
    }

    if (this.body.grounded && !this.activeAction) {
      for (const [key, action] of ATTACK_KEYS) {
        if (Phaser.Input.Keyboard.JustDown(this.keys[key])) {
          this.engageCombat();
          this.startAction(action);
          break;
        }
      }
    }
    const actionLocked = this.activeAction !== null;
    if (actionLocked) this.updateAction(deltaMs);

    // Horizontal input
    let axisX = 0;
    if (this.keys.A.isDown || this.keys.LEFT.isDown) axisX -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) axisX += 1;
    if (actionLocked) axisX = 0;
    const speed = isRunning ? PHYSICS.runSpeed : PHYSICS.walkSpeed;
    this.body.vx = axisX * speed;
    if (axisX > 0) this.direction = "east";
    if (axisX < 0) this.direction = "west";

    // Jump: buffered press + coyote time + variable height. Edge-detect on
    // isDown (rather than JustDown) so even very short taps register.
    const jumpDown = this.keys.SPACE.isDown || this.keys.W.isDown || this.keys.UP.isDown;
    const jumpPressed = jumpDown && !this.prevJumpDown;
    this.prevJumpDown = jumpDown;
    if (jumpPressed) {
      this.jumpPressedAtMs = this.elapsedMs;
    }
    if (this.body.grounded) {
      this.lastGroundedAtMs = this.elapsedMs;
      this.airJumpsUsed = 0;
    }
    const canCoyoteJump = this.elapsedMs - this.lastGroundedAtMs <= PHYSICS.coyoteTimeMs;
    const hasBufferedJump = this.elapsedMs - this.jumpPressedAtMs <= PHYSICS.jumpBufferMs;
    if (hasBufferedJump && !actionLocked) {
      const groundJump = canCoyoteJump && this.body.vy >= 0;
      const airJump = !groundJump && this.airJumpsUsed < PHYSICS.maxAirJumps;
      if (groundJump || airJump) {
        if (airJump) this.airJumpsUsed += 1;
        this.body.vy = PHYSICS.jumpVelocity;
        this.body.grounded = false;
        this.jumpPressedAtMs = -Infinity;
        this.lastGroundedAtMs = -Infinity;
        this.animator.setClip(this.animator.chooseClip(["jump", "walk", "idle"]), this.direction);
        // Already on the jump clip when double jumping — replay it from frame 0.
        if (airJump) this.animator.restartClip();
      }
    }
    if (!jumpDown && this.body.vy < PHYSICS.jumpCutVelocity) {
      this.body.vy = PHYSICS.jumpCutVelocity;
    }

    stepPlatformerBody(
      this.world,
      this.body,
      GAME_CONFIG.player.colliderWidth,
      GAME_CONFIG.player.colliderHeight,
      dt,
      PHYSICS.gravityY,
      PHYSICS.maxFallSpeed,
      PHYSICS.surfaceInsetPx,
    );

    if (!actionLocked && this.body.grounded && axisX !== 0 && isRunning) {
      this.animator.setAnimationMap(this.runningAnimations, this.stances.normal.stateFolder);
      this.footPadding = PLAYER_COMBAT.normal.footPadding;
    } else if (!actionLocked) {
      this.animator.setAnimationMap(this.movementAnimations, this.movementStateFolder);
      this.footPadding = this.armed ? PLAYER_COMBAT.armed.footPadding : PLAYER_COMBAT.normal.footPadding;
    }

    // Actions keep playing while gravity and collision continue.
    if (!actionLocked) {
      if (!this.body.grounded) {
        this.animator.setClip("jump", this.direction);
      } else if (axisX !== 0) {
        this.animator.setClip(isRunning ? "run" : "walk", this.direction);
      } else {
        this.animator.setClip("breathe", this.direction);
      }
    }

    this.sprite.setPosition(this.body.x, this.body.y + this.footPadding);
    this.animator.update(deltaMs);

    // Gameplay triggers
    const width = GAME_CONFIG.player.colliderWidth;
    const height = GAME_CONFIG.player.colliderHeight;
    if (overlapsAny(this.body, width, height, this.world.hazardRects)) {
      this.callbacks.onHazard?.();
    } else if (overlapsAny(this.body, width, height, this.world.goalRects)) {
      this.callbacks.onGoal?.();
    }
  }

  get hitPoints(): number { return this.health; }

  takeDamage(): void {
    if (this.invulnerableMs > 0 || this.health === 0) return;
    this.health -= 1;
    this.invulnerableMs = PLAYER_COMBAT.hitGraceMs;
    this.combatUntilMs = this.elapsedMs + PLAYER_COMBAT.quietMs;
    if (this.health === 0) this.setStance(false);
    this.startAction(this.health === 0 ? "death" : "hurt");
  }

  /** Threats keep an existing fight active; peaceful proximity does not draw the axe. */
  continueCombat(): void {
    if (this.health > 0 && this.combatUntilMs > this.elapsedMs) {
      this.combatUntilMs = this.elapsedMs + PLAYER_COMBAT.quietMs;
    }
  }

  private engageCombat(): void {
    this.combatUntilMs = this.elapsedMs + PLAYER_COMBAT.quietMs;
    this.setStance(true);
  }

  private setStance(armed: boolean): void {
    this.armed = armed;
    const selected = armed ? this.stances.armed : this.stances.normal;
    this.movementStateFolder = selected.stateFolder;
    this.movementAnimations = selected.animations;
    this.footPadding = armed ? PLAYER_COMBAT.armed.footPadding : PLAYER_COMBAT.normal.footPadding;
    this.animator.setAnimationMap(this.movementAnimations, this.movementStateFolder);
  }

  private startAction(name: PlayerActionName): void {
    this.animator.setAnimationMap(this.movementAnimations, this.movementStateFolder);
    this.footPadding = this.armed ? PLAYER_COMBAT.armed.footPadding : PLAYER_COMBAT.normal.footPadding;
    const clip = this.movementAnimations[name];
    const frameMs = 1000 / (clip.fps ?? GAME_CONFIG.animation.fps);
    const durationMs = clip.frameCount * frameMs;
    const hits = name === "heavy"
      ? PLAYER_COMBAT.fireAxeHits.map(hit => ({ atMs: hit.frame * frameMs, damage: hit.damage }))
      : name === "attack" || name === "flourish"
        ? [{ atMs: durationMs * PLAYER_COMBAT.hitMoment, damage: name === "attack" ? PLAYER_COMBAT.lightDamage : PLAYER_COMBAT.heavyDamage }]
        : [];
    this.activeAction = { name, durationMs, hits, nextHit: 0 };
    this.actionElapsedMs = 0;
    this.animator.setClip(name, this.direction);
    this.animator.restartClip();
  }

  private updateAction(deltaMs: number): void {
    const action = this.activeAction!;
    this.actionElapsedMs += deltaMs;
    while (action.nextHit < action.hits.length && this.actionElapsedMs >= action.hits[action.nextHit].atMs) {
      const hit = action.hits[action.nextHit++];
      this.callbacks.onAttack?.(this.worldPosition, this.direction, action.name !== "attack", hit.damage);
    }
    if (this.actionElapsedMs >= action.durationMs) {
      this.activeAction = null;
      if (action.name === "death") this.callbacks.onHazard?.();
    }
  }

}
