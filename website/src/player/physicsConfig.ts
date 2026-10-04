/**
 * Platformer physics tuning. To change how movement or jumping FEELS, edit
 * these constants — do not reimplement the controller.
 *
 * Units: pixels and seconds (velocities in px/s, accelerations in px/s²).
 */
export const PHYSICS = {
  /** Downward acceleration applied while airborne. */
  gravityY: 1400,
  /** Cap on falling speed. */
  maxFallSpeed: 420,
  /** Horizontal speed while walking. */
  walkSpeed: 110,
  /** Horizontal speed while holding Shift. */
  runSpeed: 180,
  /** Upward velocity applied on jump (negative = up). */
  jumpVelocity: -360,
  /** Releasing jump early clamps upward velocity to this (variable jump height). */
  jumpCutVelocity: -120,
  /** Extra mid-air jumps before landing (1 = double jump, 0 = disable). */
  maxAirJumps: 1,
  /** Grace period after walking off a ledge during which jump still works. */
  coyoteTimeMs: 90,
  /** Pressing jump this long before landing still triggers the jump. */
  jumpBufferMs: 120,
  /** How deep (px) the walkable surface sits inside a terrain boundary tile.
   *  The top of the tile is grass-lip art; feet land this far into it. */
  surfaceInsetPx: 8,
} as const;
