/** Starter-game tuning; animation names stay in the character manifests. */
export const PLAYER_COMBAT = {
  maxHealth: 5,
  hitGraceMs: 1800,
  respawnGraceMs: 1500,
  quietMs: 2200,
  hitMoment: 0.45,
  lightRange: 60,
  heavyRange: 86,
  verticalReach: 42,
  backReach: 12,
  lightDamage: 1,
  heavyDamage: 2,
  fireAxeHits: [
    { frame: 5, damage: 0.5 },
    { frame: 10, damage: 0.5 },
    { frame: 17, damage: 1 },
  ],
  normal: { state: "Idle", footPadding: 18 },
  armed: { state: "Axe out, combat stance", footPadding: 50 },
} as const;

export interface EnemyProfile {
  health: number;
  chaseSpeed: number;
  chaseClip: string;
  footPadding: number;
  mirrorWest: boolean;
  reaction: "hurt" | "dodge";
  attacks: readonly string[];
}

export const ENEMY_PROFILES: Record<string, EnemyProfile> = {
  "36e5db22-bb07-5f4f-9eb6-75b915d82f4c": {
    health: 3, chaseSpeed: 64, chaseClip: "walk", footPadding: 17,
    mirrorWest: true, reaction: "hurt", attacks: ["attack"],
  },
  "113f91a5-29f0-5c08-9981-5c5b3b5a8718": {
    health: 5, chaseSpeed: 78, chaseClip: "run", footPadding: 18,
    mirrorWest: false, reaction: "dodge", attacks: ["attack", "heavy", "flourish"],
  },
};

export const ENEMY_COMBAT = {
  noticeRange: 150,
  noticeHeight: 48,
  attackRange: 48,
  approachRange: 38,
  hitRange: 58,
  hitHeight: 38,
  backReach: 12,
  hitMoment: 0.55,
  recoveryMs: 900,
  initialWaitMs: 800,
  patrolPauseMs: 1200,
  patrolEndMs: 4000,
  patrolRestMs: 1000,
  patrolSpeed: 28,
  dodgeSpeed: 45,
  colliderWidth: 16,
  colliderHeight: 24,
} as const;
