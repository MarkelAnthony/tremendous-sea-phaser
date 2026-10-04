import { GAME_CONFIG } from "../config";
import type { LoadedMap } from "../pixellab/types";
import {
  SpriteAnimator,
  characterRotationFrameName,
  selectCharacterState,
  type AnimationMap,
  type CharacterManifest,
} from "../shared/animation";
import { moveWithCollision, type Collider } from "../shared/collision";
import { setYDepth } from "../shared/depth";
import { type Direction } from "../shared/direction";
import { findPath, nearestWalkable, type Point } from "../shared/navigation";

type AgentMode = "idle" | "walk" | "attack";

const WANDER_RADIUS_TILES = 5;
const WANDER_TARGET_ATTEMPTS = 8;
const ARRIVE_THRESHOLD_TILES = 0.35;
const BLOCKED_REPATH_MS = 180;

interface CharacterAgentConfigBase {
  atlasKey: string;
  id?: string;
  role?: string;
  x: number;
  y: number;
  speed?: number;
  footOffsetY?: number;
  roaming?: boolean;
  direction?: Direction;
}

interface CharacterAgentManifestConfig extends CharacterAgentConfigBase {
  manifest: CharacterManifest;
  state?: string;
  preferredClips?: string[];
  stateFolder?: never;
  animations?: never;
}

interface CharacterAgentAnimationConfig extends CharacterAgentConfigBase {
  manifest?: never;
  state?: never;
  preferredClips?: never;
  stateFolder: string;
  animations: AnimationMap;
}

export type CharacterAgentConfig = CharacterAgentManifestConfig | CharacterAgentAnimationConfig;

export class CharacterAgent {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly id?: string;
  readonly role?: string;

  private readonly animator: SpriteAnimator;
  private readonly collider: Collider;
  private readonly speed: number;
  private readonly hasAttack: boolean;
  private mode: AgentMode = "idle";
  private direction: Direction = "south";
  private stateElapsedMs = 0;
  private stateDurationMs = 1200;
  private path: Point[] = [];
  private pathIndex = 0;
  private blockedElapsedMs = 0;
  private readonly arriveThreshold: number;
  private talking = false;
  private roaming: boolean;

  constructor(
    scene: Phaser.Scene,
    private readonly mapData: LoadedMap,
    config: CharacterAgentConfig,
  ) {
    const selected = config.manifest
      ? selectCharacterState(config.manifest, {
          state: config.state,
          preferredClips: config.preferredClips,
        })
      : {
          stateFolder: config.stateFolder,
          animations: config.animations,
        };
    this.sprite = scene.add.sprite(
      config.x,
      config.y,
      config.atlasKey,
      characterRotationFrameName(selected.stateFolder, config.direction ?? "south"),
    );
    setYDepth(this.sprite, config.y);
    this.id = config.id;
    this.role = config.role;
    this.animator = new SpriteAnimator(this.sprite, config.atlasKey, selected.animations, selected.stateFolder);
    this.speed = config.speed ?? GAME_CONFIG.npc.walkSpeed;
    this.roaming = config.roaming ?? true;
    this.direction = config.direction ?? "south";
    this.hasAttack = this.animator.hasClip("attack");
    this.collider = {
      width: 8,
      height: 4,
      footOffsetY: config.footOffsetY ?? GAME_CONFIG.npc.footOffsetY,
    };
    this.arriveThreshold = ARRIVE_THRESHOLD_TILES * mapData.map.mapConfig.tileSize;
    if (this.roaming) {
      this.chooseNextState();
    }
  }

  update(deltaMs: number): void {
    if (this.talking || !this.roaming) {
      this.animator.setClip("idle", this.direction);
      this.animator.update(deltaMs);
      setYDepth(this.sprite, this.sprite.y);
      return;
    }

    this.stateElapsedMs += deltaMs;
    if (this.stateElapsedMs >= this.stateDurationMs) {
      this.chooseNextState();
    }

    if (this.mode === "walk") {
      this.followPath(deltaMs);
    }

    if (this.mode === "attack") {
      this.animator.setClip(this.animator.chooseClip(["attack", "idle"]), this.direction);
    } else {
      this.animator.setClip(
        this.mode === "walk" ? this.animator.chooseClip(["walk", "idle"]) : "idle",
        this.direction,
      );
    }
    setYDepth(this.sprite, this.sprite.y);
    this.animator.update(deltaMs);
  }

  destroy(): void {
    this.clearPath();
    this.sprite.destroy();
  }

  setDirection(direction: Direction): void {
    this.direction = direction;
    this.animator.setClip(
      this.mode === "walk" ? this.animator.chooseClip(["walk", "idle"]) : "idle",
      this.direction,
    );
  }

  lookAt(target: { x: number; y: number } | Direction): void {
    if (typeof target === "string") {
      this.setDirection(target);
      return;
    }

    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    this.setDirection(
      Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "east" : "west")
        : (dy > 0 ? "south" : "north"),
    );
  }

  startTalking(): void {
    this.talking = true;
    this.animator.setClip("idle", this.direction);
  }

  stopTalking(): void {
    this.talking = false;
  }

  releaseDirectionControl(): void {
    this.stateElapsedMs = 0;
    if (this.roaming && !this.talking) {
      this.mode = "walk";
      this.stateDurationMs = this.range(GAME_CONFIG.npc.walkMinMs, GAME_CONFIG.npc.walkMaxMs);
      this.pickWanderPath();
      this.animator.setClip(this.animator.chooseClip(["walk", "idle"]), this.direction);
    }
  }

  startRoaming(immediate = true): void {
    this.talking = false;
    this.roaming = true;
    if (immediate) {
      this.mode = "walk";
      this.stateElapsedMs = 0;
      this.stateDurationMs = this.range(GAME_CONFIG.npc.walkMinMs, GAME_CONFIG.npc.walkMaxMs);
      this.pickWanderPath();
      this.animator.setClip(this.animator.chooseClip(["walk", "idle"]), this.direction);
    }
  }

  stopRoaming(): void {
    this.roaming = false;
    this.mode = "idle";
    this.stateElapsedMs = 0;
    this.stateDurationMs = this.range(GAME_CONFIG.npc.idleMinMs, GAME_CONFIG.npc.idleMaxMs);
    this.clearPath();
    this.animator.setClip("idle", this.direction);
  }

  private chooseNextState(): void {
    this.stateElapsedMs = 0;
    this.blockedElapsedMs = 0;
    const roll = Math.random();
    this.direction = Math.random() < 0.5 ? "east" : "west";

    if (this.hasAttack && roll < GAME_CONFIG.npc.attackChance) {
      this.mode = "attack";
      this.stateDurationMs = 900;
      this.clearPath();
      return;
    }

    if (roll < 0.5) {
      this.mode = "idle";
      this.stateDurationMs = this.range(GAME_CONFIG.npc.idleMinMs, GAME_CONFIG.npc.idleMaxMs);
      this.clearPath();
    } else {
      this.mode = "walk";
      this.stateDurationMs = this.range(GAME_CONFIG.npc.walkMinMs, GAME_CONFIG.npc.walkMaxMs);
      this.pickWanderPath();
    }
  }

  private followPath(deltaMs: number): void {
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      if (!this.pickWanderPath()) {
        this.chooseNextState();
        return;
      }
    }

    const target = this.path[this.pathIndex];
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= this.arriveThreshold) {
      this.pathIndex += 1;
      if (this.pathIndex >= this.path.length) {
        this.chooseNextState();
      }
      return;
    }

    const step = this.speed * (deltaMs / 1000);
    const scale = Math.min(step / distance, 1);
    const nextX = dx * scale;
    const nextY = dy * scale;

    const moved = moveWithCollision(
      this.mapData,
      this.sprite.x,
      this.sprite.y,
      nextX,
      nextY,
      this.collider,
    );
    if (moved.x === this.sprite.x && moved.y === this.sprite.y) {
      this.blockedElapsedMs += deltaMs;
      if (this.blockedElapsedMs >= BLOCKED_REPATH_MS) {
        this.chooseNextState();
      }
      return;
    }

    this.blockedElapsedMs = 0;
    this.direction = this.directionFromDelta(
      moved.x - this.sprite.x,
      moved.y - this.sprite.y,
    );
    this.sprite.setPosition(moved.x, moved.y);
  }

  private pickWanderPath(): boolean {
    const tileSize = this.mapData.map.mapConfig.tileSize;
    for (let attempt = 0; attempt < WANDER_TARGET_ATTEMPTS; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = tileSize * this.range(2, WANDER_RADIUS_TILES);
      const target = nearestWalkable(
        this.mapData,
        {
          x: this.sprite.x + Math.cos(angle) * distance,
          y: this.sprite.y + Math.sin(angle) * distance,
        },
        this.collider,
        2,
      );
      if (target === null) {
        continue;
      }

      const path = findPath(this.mapData, this.sprite, target, this.collider);
      if (path !== null && path.length > 0) {
        this.path = path;
        this.pathIndex = 0;
        this.blockedElapsedMs = 0;
        return true;
      }
    }

    this.clearPath();
    return false;
  }

  private clearPath(): void {
    this.path = [];
    this.pathIndex = 0;
    this.blockedElapsedMs = 0;
  }

  private directionFromDelta(dx: number, dy: number): Direction {
    const horizontal = Math.abs(dx) > 0.35;
    const vertical = Math.abs(dy) > 0.35;
    if (horizontal && vertical) {
      if (dx > 0 && dy > 0) return "south-east";
      if (dx > 0 && dy < 0) return "north-east";
      if (dx < 0 && dy > 0) return "south-west";
      return "north-west";
    }
    if (horizontal) return dx > 0 ? "east" : "west";
    if (vertical) return dy > 0 ? "south" : "north";
    return this.direction;
  }

  private range(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
