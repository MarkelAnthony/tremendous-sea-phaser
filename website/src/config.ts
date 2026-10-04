export const GAME_CONFIG = {
  player: {
    // Movement/jump tuning lives in player/physicsConfig.ts (PHYSICS).
    // These are the platformer collision-box dimensions (feet-anchored).
    colliderWidth: 10,
    colliderHeight: 22,
    footOffsetY: 0,
  },
  npc: {
    walkSpeed: 80,
    footOffsetY: 8,
    idleMinMs: 1500,
    idleMaxMs: 3000,
    walkMinMs: 2000,
    walkMaxMs: 4000,
    attackChance: 0.2,
  },
  camera: {
    // Initial zoom; maps with a background fit its height using a shared zoom.
    zoom: 3,
    followLerp: 0.12,
    playerScreenX: 0.35,
    groundScreenY: 0.9,
    groundWorldY: 288,
  },
  animation: {
    fps: 10,
  },
} as const;

export const TEMPLATE_SPAWNS = {
  // Fallback for the bootstrapped starter map only (world pixels, feet position).
  // Real spawns come from the map's "player spawn" annotation.
  player: { x: 64, y: 280 },
} as const;
