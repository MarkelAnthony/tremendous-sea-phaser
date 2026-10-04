import Phaser from "phaser";
import { GAME_CONFIG } from "../config";
import { HudOverlay } from "../hud/HudOverlay";
import { createMapBackground } from "../pixellab/backgroundRenderer";
import { renderMap } from "../pixellab/renderMap";
import { findEnemySpawns, resolvePlayerSpawnPoint } from "../pixellab/spawns";
import type { LoadedMap } from "../pixellab/types";
import { PlayerController } from "../player/PlayerController";
import { ForestEnemy } from "../npc/ForestEnemy";
import { MAP_DATA_REGISTRY_KEY } from "./BootScene";
import { MultiplayerSystem } from "../net/MultiplayerSystem";

export class GameScene extends Phaser.Scene {
  private mapData!: LoadedMap;
  private player!: PlayerController;
  private enemies: ForestEnemy[] = [];
  private hud!: HudOverlay;
  private multiplayer!: MultiplayerSystem;
  private spawn!: { x: number; y: number };
  private goalReached = false;
  private cameraLeft = 0;
  private hudHealth = -1;
  private hudDefeated = -1;
  private hudGoal = false;

  constructor() { super("GameScene"); }

  create(): void {
    this.goalReached = false;
    this.cameraLeft = 0;
    this.hudHealth = -1;
    this.hudDefeated = -1;
    this.hudGoal = false;
    this.mapData = this.registry.get(MAP_DATA_REGISTRY_KEY) as LoadedMap;
    this.cameras.main.setZoom(GAME_CONFIG.camera.zoom);
    createMapBackground(this, this.mapData);
    renderMap(this, this.mapData);
    // Horizontal bounds are applied below; map bounds must not shift camera Y on resize.
    this.cameras.main.removeBounds();
    this.spawn = resolvePlayerSpawnPoint(this.mapData);
    this.player = new PlayerController(this, this.mapData, this.spawn.x, this.spawn.y, {
      onAttack: (origin, direction, heavy, damage) => {
        for (const enemy of this.enemies) enemy.hit(origin, direction, heavy, damage);
      },
      onHazard: () => this.player.teleportTo(this.spawn.x, this.spawn.y),
      onGoal: () => { this.goalReached = this.enemies.every((enemy) => enemy.defeated); },
    });
    this.player.sprite.setDepth(10);
    const spawns = findEnemySpawns(this.mapData);
    this.enemies = spawns.map((spawn) => {
      const properties = spawn.properties!;
      return new ForestEnemy(this, this.mapData, properties.characterId as string, spawn.x, spawn.y, properties.patrolMin as number, properties.patrolMax as number);
    });
    // The exit is visible in the world, with its trigger supplied by map annotations.
    this.add.rectangle(2512, 256, 3, 64, 0xd4b780).setDepth(1);
    this.add.triangle(2514, 223, 0, 0, 24, 8, 0, 16, 0xebad4c).setOrigin(0).setDepth(1);
    this.hud = new HudOverlay();
    this.multiplayer = new MultiplayerSystem(this, () => this.player.worldPosition, this.mapData.map.name);
    this.game.canvas.tabIndex = 1;
    this.game.canvas.style.outline = "none";
    this.game.canvas.focus();
    const debug = window as unknown as Record<string, unknown>;
    debug.gameReady = true;
    debug.debugState = () => ({
      player: this.player.worldPosition, grounded: this.player.isGrounded,
      cam: { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY },
      info: this.player.debugInfo, enemies: this.enemies.map((enemy) => enemy.state), goalReached: this.goalReached,
    });
    debug.debugTeleport = (x: number, y: number) => this.player.teleportTo(x, y);
    debug.debugJump = () => this.player.queueJump();
    this.events.once("shutdown", () => { this.hud.destroy(); this.multiplayer.destroy(); });
    this.updateCamera(1);
  }

  /** Follow horizontal travel only; jumps never change the camera's vertical position. */
  private updateCamera(deltaMs: number): void {
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    const visibleWidth = width / camera.zoom;
    const levelWidth = this.mapData.map.mapConfig.dimensions.pixelWidth;
    const target = Phaser.Math.Clamp(this.player.worldPosition.x - visibleWidth * GAME_CONFIG.camera.playerScreenX, 0, Math.max(0, levelWidth - visibleWidth));
    this.cameraLeft = Phaser.Math.Linear(this.cameraLeft, target, 1 - Math.pow(1 - GAME_CONFIG.camera.followLerp, deltaMs / 16.667));
    const groundY = GAME_CONFIG.camera.groundWorldY;
    // Keep the eased position continuous, but render translation on the screen grid.
    // Rounding world pixels would jump several screen pixels at this zoom.
    const screenScale = camera.zoom * this.game.canvas.width / width;
    const renderLeft = Math.round(this.cameraLeft * screenScale) / screenScale;
    camera.centerOn(renderLeft + visibleWidth / 2, groundY - height * (GAME_CONFIG.camera.groundScreenY - 0.5) / camera.zoom);
  }

  update(_time: number, deltaMs: number): void {
    if (deltaMs > 200) return;
    this.player.update(deltaMs);
    for (const enemy of this.enemies) enemy.update(deltaMs, this.player);
    this.updateCamera(deltaMs);
    this.multiplayer.update(deltaMs);
    let defeated = 0;
    for (const enemy of this.enemies) if (enemy.defeated) defeated += 1;
    const health = this.player.hitPoints;
    if (health === this.hudHealth && defeated === this.hudDefeated && this.goalReached === this.hudGoal) return;
    this.hudHealth = health;
    this.hudDefeated = defeated;
    this.hudGoal = this.goalReached;
    this.hud.setText([
      this.goalReached ? "THE VERDANT CROSSING · Cleared!" : "THE VERDANT CROSSING",
      `Health ${"♥".repeat(this.player.hitPoints)} · Enemies ${defeated}/${this.enemies.length}`,
      "A/D Move · Shift Sprint · Space Flip / Double jump",
      "J Axe strike · K Fire axe · L Axe flourish · R Return to start",
      defeated === this.enemies.length ? "The path is clear. Reach the golden banner →" : "Defeat the forest guardians and reach the golden banner →",
    ]);
  }
}
