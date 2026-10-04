import { GAME_CONFIG } from "../config";
import { assetUrl, publicAssetUrl } from "../pixellab/templateAssetPaths";
import { DIRECTIONS, type Direction } from "./direction";

// ---------------------------------------------------------------------------
// Manifest types (must match manifest.json written by asset_sync.py)
// ---------------------------------------------------------------------------

export interface ManifestAnimation {
  name: string;
  source_name?: string;
  description?: string | null;
  generation_model?: string | null;
  frame_count: number;
  directions: string[];
  loop: boolean;
  aliases?: string[];
  fps?: number;
}

export interface CharacterPortraitAsset {
  path: string;
  size: number;
  generated_at: string;
}

export interface CharacterVocalAnimationAsset {
  path: string;
  moods: string[];
  viseme_count: number;
  width: number;
  height: number;
  generated_at: string;
  layout: "grid";
  columns: "visemes";
  rows: "moods";
}

export interface CharacterState {
  id: string;
  name: string;
  folder: string;
  directions: string[];
  animations: ManifestAnimation[];
  portrait?: CharacterPortraitAsset;
  vocal_animation?: CharacterVocalAnimationAsset;
}

export interface CharacterManifest {
  id: string;
  name: string;
  group_id: string | null;
  atlas_key: string;
  states: CharacterState[];
}

// ---------------------------------------------------------------------------
// Animation clip types
// ---------------------------------------------------------------------------

export interface AnimationClip {
  name: string;
  frameCount: number;
  directions: Direction[];
  loop: boolean;
  fps?: number;
}

export type AnimationMap = Record<string, AnimationClip>;

export interface CharacterStateSelectionOptions {
  state?: string;
  preferredClips?: string[];
}

export interface CharacterStateSelection {
  state: CharacterState;
  stateIndex: number;
  stateFolder: string;
  animations: AnimationMap;
}

// ---------------------------------------------------------------------------
// Direction resolution
// ---------------------------------------------------------------------------

/** DIRECTIONS laid out as angles (0 = south, incrementing clockwise in 45° steps). */
const DIRECTION_ANGLE: Record<Direction, number> = {
  "south": 0,
  "south-west": 1,
  "west": 2,
  "north-west": 3,
  "north": 4,
  "north-east": 5,
  "east": 6,
  "south-east": 7,
};

/** Snap a requested direction to the nearest available one in the clip. */
function resolveDirection(requested: Direction, available: Direction[]): Direction {
  if (available.includes(requested)) return requested;
  let best = available[0];
  let bestDist = 8;
  const reqAngle = DIRECTION_ANGLE[requested];
  for (const dir of available) {
    const dist = Math.min(
      Math.abs(DIRECTION_ANGLE[dir] - reqAngle),
      8 - Math.abs(DIRECTION_ANGLE[dir] - reqAngle),
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Clip and state selection
// ---------------------------------------------------------------------------

const CLIP_ALIASES: Record<string, string[]> = {
  attack: ["attack", "attacks", "strike", "strikes", "hit", "hits", "slash"],
  idle: ["idle", "stand", "stands", "standing", "breath", "breathing"],
  jump: ["jump", "jumps", "jumping", "leap", "leaps"],
  run: ["run", "runs", "running", "sprint", "sprints", "sprinting"],
  walk: ["walk", "walks", "walking", "stride", "strides", "roam", "roaming"],
};

const LOOPING_ROLE_CLIPS = new Set(["run", "walk"]);

function normalizedLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clipMatchesCandidate(clipName: string, candidate: string): boolean {
  const normalizedClip = normalizedLabel(clipName);
  const normalizedCandidate = normalizedLabel(candidate);
  if (normalizedClip === normalizedCandidate) return true;

  const aliases = CLIP_ALIASES[normalizedCandidate];
  if (!aliases) return normalizedClip.includes(normalizedCandidate);

  return aliases.some((alias) => normalizedClip.includes(normalizedLabel(alias)));
}

function stateMatchesName(state: CharacterState, stateName: string): boolean {
  const normalizedState = normalizedLabel(stateName);
  return (
    normalizedLabel(state.name) === normalizedState ||
    normalizedLabel(state.folder) === normalizedState ||
    normalizedLabel(state.id) === normalizedState
  );
}

function stateHasPreferredClip(state: CharacterState, preferredClips: string[]): boolean {
  return state.animations.some((animation) => (
    preferredClips.some((candidate) => {
      const normalizedCandidate = normalizedLabel(candidate);
      if (LOOPING_ROLE_CLIPS.has(normalizedCandidate) && !animation.loop) return false;
      const aliases = animation.aliases ?? [];
      return (
        aliases.some((alias) => normalizedLabel(alias) === normalizedCandidate) ||
        clipMatchesCandidate(animation.name, candidate)
      );
    })
  ));
}

// ---------------------------------------------------------------------------
// Manifest loading helpers
// ---------------------------------------------------------------------------

export function characterAtlasKey(characterId: string): string {
  return `char-${characterId}`;
}

export function characterAssetUrl(characterId: string, path: string): string {
  return assetUrl("characters", characterId, ...path.split("/"));
}

export function characterStatePortraitUrl(
  characterId: string,
  state: CharacterState,
): string | undefined {
  return state.portrait ? characterAssetUrl(characterId, state.portrait.path) : undefined;
}

export function characterStateVocalAnimationUrl(
  characterId: string,
  state: CharacterState,
): string | undefined {
  return state.vocal_animation
    ? characterAssetUrl(characterId, state.vocal_animation.path)
    : undefined;
}

function characterManifestKey(characterId: string): string {
  return `char-manifest-${characterId}`;
}

export function preloadCharacterAtlas(scene: Phaser.Scene, characterId: string): void {
  const key = characterAtlasKey(characterId);
  // Guard like every map preload does: a scene restart re-runs preload, and re-adding a loaded
  // atlas throws "Texture key already in use".
  if (scene.textures.exists(key)) return;
  // publicAssetUrl appends the build id (?v=) — the atlas is the largest, most frequently
  // regenerated asset; without the version a cached stale JSON pairs with a fresh PNG (or vice
  // versa) after a character re-sync and frames go missing/wrong.
  scene.load.atlas(
    key,
    publicAssetUrl("atlases", `${key}.png`),
    publicAssetUrl("atlases", `${key}.json`),
  );
  scene.load.json(
    characterManifestKey(characterId),
    assetUrl("characters", characterId, "manifest.json"),
  );
}

/** Load and validate the character manifest from the Phaser cache. */
export function characterManifest(scene: Phaser.Scene, characterId: string): CharacterManifest {
  const manifest = scene.cache.json.get(
    characterManifestKey(characterId),
  ) as CharacterManifest | undefined;
  if (!manifest) {
    throw new Error(`Missing character manifest for ${characterId}. Re-sync assets.`);
  }
  if (!manifest.states || manifest.states.length === 0) {
    throw new Error(`Character ${characterId} has no states in manifest.json`);
  }
  return manifest;
}

/** Build an AnimationMap from a single character state. No hardcoded constants. */
export function animationMapFromState(state: CharacterState): AnimationMap {
  const rotationDirections = state.directions.filter(
    (d): d is Direction => DIRECTIONS.includes(d as Direction),
  );
  const anims: AnimationMap = {
    idle: { name: "idle", frameCount: 1, directions: rotationDirections, loop: true },
  };
  for (const anim of state.animations) {
    const dirs = anim.directions.filter(
      (d): d is Direction => DIRECTIONS.includes(d as Direction),
    );
    const clip = {
      name: anim.name,
      frameCount: anim.frame_count,
      directions: dirs,
      loop: anim.loop,
      fps: anim.fps,
    };
    anims[anim.name] = clip;
    for (const alias of anim.aliases ?? []) {
      if (!(alias in anims)) {
        anims[alias] = clip;
      }
    }
  }
  return anims;
}

/** Build an AnimationMap from a character manifest. No hardcoded constants. */
export function animationMapFromManifest(manifest: CharacterManifest, stateIndex = 0): AnimationMap {
  return animationMapFromState(manifest.states[stateIndex]);
}

export function selectCharacterState(
  manifest: CharacterManifest,
  options: CharacterStateSelectionOptions = {},
): CharacterStateSelection {
  let stateIndex = 0;
  const requestedState = options.state;
  const preferredClips = options.preferredClips;

  if (requestedState) {
    stateIndex = manifest.states.findIndex((state) => stateMatchesName(state, requestedState));
    if (stateIndex === -1) {
      throw new Error(
        `Character "${manifest.name}" has no state "${requestedState}". Available states: ${
          manifest.states.map((state) => `${state.name} (${state.folder})`).join(", ")
        }`,
      );
    }
  } else if (preferredClips && preferredClips.length > 0) {
    const preferredIndex = manifest.states.findIndex((state) => (
      stateHasPreferredClip(state, preferredClips)
    ));
    if (preferredIndex !== -1) {
      stateIndex = preferredIndex;
    }
  }

  const state = manifest.states[stateIndex];
  return {
    state,
    stateIndex,
    stateFolder: state.folder,
    animations: animationMapFromState(state),
  };
}

export function characterRotationFrameName(state: string, direction: Direction): string {
  return frameName(state, "idle", direction, 0);
}

/**
 * Build the atlas frame name for a given state, animation, direction, and frame.
 *
 * Matches the export format:
 *   {state}/rotations/{direction}       — idle/rotation pose
 *   {state}/animations/{anim}/{direction}/frame_NNN — animation frame
 */
function frameName(state: string, animation: string, direction: Direction, frame: number): string {
  if (animation === "idle") {
    return `${state}/rotations/${direction}`;
  }
  return `${state}/animations/${animation}/${direction}/frame_${frame.toString().padStart(3, "0")}`;
}

export class SpriteAnimator {
  private clipName = "idle";
  private direction: Direction = "south";
  private resolvedDirection: Direction = "south";
  private elapsedMs = 0;
  private frame = 0;
  private didComplete = false;
  private state: string;

  constructor(
    private readonly sprite: Phaser.GameObjects.Sprite,
    private readonly atlasKey: string,
    private animations: AnimationMap,
    state = "default",
  ) {
    this.state = state;
    const idle = this.animations["idle"];
    if (!idle) {
      throw new Error(
        `SpriteAnimator for atlas "${atlasKey}" needs an "idle" entry in its AnimationMap ` +
        `(got: ${Object.keys(this.animations).join(", ") || "none"}).`,
      );
    }
    this.resolvedDirection = resolveDirection(this.direction, idle.directions);
    this.applyTexture();
  }

  /** Check whether an exact or role-like clip name exists in this animator's animation map. */
  hasClip(clipName: string): boolean {
    return this.chooseClip([clipName]) !== "idle" || clipName === "idle";
  }

  /** Pick the first available exact or role-like clip from a priority list. Returns "idle" if none match. */
  chooseClip(candidates: string[]): string {
    for (const name of candidates) {
      const clip = this.animations[name];
      if (name !== "idle" && clip && this.canUseClipForCandidate(name, clip)) return name;
    }
    for (const name of candidates) {
      if (name === "idle") continue;
      const match = Object.keys(this.animations).find((clipName) => (
        clipName !== "idle" &&
        clipMatchesCandidate(clipName, name) &&
        this.canUseClipForCandidate(name, this.animations[clipName])
      ));
      if (match) return match;
    }
    if (candidates.includes("idle") && "idle" in this.animations) return "idle";
    return "idle";
  }

  setAnimationMap(animations: AnimationMap, state = "default"): void {
    if (this.animations === animations && this.state === state) return;
    this.animations = animations;
    this.state = state;
    this.clipName = "idle";
    this.elapsedMs = 0;
    this.frame = 0;
    this.didComplete = false;
    const idle = this.animations["idle"];
    this.resolvedDirection = resolveDirection(this.direction, idle.directions);
    this.applyTexture();
  }

  setState(state: string): void {
    if (this.state === state) return;
    this.state = state;
    this.applyTexture();
  }

  /** Replay the current clip from frame 0 (e.g. re-trigger "jump" on a double jump). */
  restartClip(): void {
    this.elapsedMs = 0;
    this.frame = 0;
    this.didComplete = false;
    this.applyTexture();
  }

  setClip(clipName: string, direction: Direction, state = this.state): void {
    if (this.clipName === clipName && this.direction === direction && this.state === state) {
      return;
    }
    const clip = this.animations[clipName];
    if (!clip) {
      throw new Error(`Animation clip "${clipName}" not found. Available: ${Object.keys(this.animations).join(", ")}`);
    }
    this.state = state;
    this.clipName = clipName;
    this.direction = direction;
    this.resolvedDirection = resolveDirection(direction, clip.directions);
    this.elapsedMs = 0;
    this.frame = 0;
    this.didComplete = false;
    this.applyTexture();
  }

  update(deltaMs: number): void {
    const clip = this.animations[this.clipName];
    if (clip.frameCount <= 1 || this.didComplete) {
      return;
    }

    const frameMs = 1000 / (clip.fps ?? GAME_CONFIG.animation.fps);
    this.elapsedMs += deltaMs;
    while (this.elapsedMs >= frameMs) {
      this.elapsedMs -= frameMs;
      this.frame += 1;
      if (this.frame >= clip.frameCount) {
        if (clip.loop) {
          this.frame = 0;
        } else {
          this.frame = clip.frameCount - 1;
          this.didComplete = true;
        }
      }
      this.applyTexture();
    }
  }

  private applyTexture(): void {
    const clip = this.animations[this.clipName];
    this.sprite.setTexture(this.atlasKey, frameName(this.state, clip.name, this.resolvedDirection, this.frame));
  }

  private canUseClipForCandidate(candidate: string, clip: AnimationClip): boolean {
    const normalizedCandidate = normalizedLabel(candidate);
    return !LOOPING_ROLE_CLIPS.has(normalizedCandidate) || clip.loop;
  }
}
