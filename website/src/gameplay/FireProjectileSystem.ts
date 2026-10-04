import Phaser from "phaser";
import { assetUrl } from "../pixellab/templateAssetPaths";
import { setYDepth } from "../shared/depth";
import { DIRECTIONS, type Direction, vectorFromDirection } from "../shared/direction";

const FIREBALL_FOLDER = "fireball";
const FIREBALL_KEY_PREFIX = "projectile-fireball";
const FIREBALL_SPEED = 280;
const FIREBALL_LIFETIME_MS = 650;
const FIREBALL_SPAWN_DISTANCE = 22;
const FIREBALL_VISUAL_OFFSET_Y = -18;
const FIREBALL_DEPTH_OFFSET = 6;
const FIREBALL_FADE_START = 0.72;

interface ActiveProjectile {
  sprite: Phaser.GameObjects.Image;
  direction: Direction;
  elapsedMs: number;
}

export class FireProjectileSystem {
  private readonly projectiles: ActiveProjectile[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  static preload(scene: Phaser.Scene): void {
    for (const direction of DIRECTIONS) {
      scene.load.image(fireballKey(direction), assetUrl("projectiles", FIREBALL_FOLDER, `${direction}.png`));
    }
  }

  cast(origin: { x: number; y: number }, direction: Direction): void {
    const vector = vectorFromDirection(direction);
    const x = origin.x + vector.x * FIREBALL_SPAWN_DISTANCE;
    const y = origin.y + vector.y * FIREBALL_SPAWN_DISTANCE + FIREBALL_VISUAL_OFFSET_Y;
    const sprite = this.scene.add.image(x, y, fireballKey(direction));
    setYDepth(sprite, origin.y, FIREBALL_DEPTH_OFFSET);
    this.projectiles.push({ sprite, direction, elapsedMs: 0 });
  }

  update(deltaMs: number): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.elapsedMs += deltaMs;
      if (projectile.elapsedMs >= FIREBALL_LIFETIME_MS) {
        projectile.sprite.destroy();
        this.projectiles.splice(index, 1);
        continue;
      }

      const vector = vectorFromDirection(projectile.direction);
      const distance = FIREBALL_SPEED * (deltaMs / 1000);
      projectile.sprite.x += vector.x * distance;
      projectile.sprite.y += vector.y * distance;
      setYDepth(projectile.sprite, projectile.sprite.y - FIREBALL_VISUAL_OFFSET_Y, FIREBALL_DEPTH_OFFSET);

      const lifetimeProgress = projectile.elapsedMs / FIREBALL_LIFETIME_MS;
      if (lifetimeProgress > FIREBALL_FADE_START) {
        projectile.sprite.setAlpha(1 - (lifetimeProgress - FIREBALL_FADE_START) / (1 - FIREBALL_FADE_START));
      }
    }
  }
}

function fireballKey(direction: Direction): string {
  return `${FIREBALL_KEY_PREFIX}-${direction}`;
}
