import type Phaser from "phaser";
import type { CharacterAgent } from "./CharacterAgent";

/**
 * The sidescroller starter map ships without NPCs — new characters are added
 * via the Characters tool and spawned with `CharacterAgent` (see AGENTS.md).
 * These helpers keep the NPC lifecycle API available for game code.
 */
export function preloadNpcs(_scene: Phaser.Scene): void {}

export function spawnNpcs(_scene: Phaser.Scene, _mapData: unknown): CharacterAgent[] {
  return [];
}

export function destroyNpcs(agents: CharacterAgent[]): void {
  for (const agent of agents) {
    agent.destroy();
  }
  agents.length = 0;
}

export function replaceNpcs(
  currentAgents: CharacterAgent[],
  nextAgents: CharacterAgent[],
): CharacterAgent[] {
  destroyNpcs(currentAgents);
  return nextAgents;
}
