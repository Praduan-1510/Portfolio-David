/**
 * Duration scale — the TS mirror of the CSS custom properties in
 * src/app/globals.css (DESIGN_GUIDELINES.md §7.3). Keep these in lockstep
 * with the `--dur-*` variables.
 *
 * - `durations`    → seconds, for Motion / GSAP (which expect seconds).
 * - `durationsMs`  → milliseconds, matching the CSS values exactly.
 */

/** Seconds — for Motion (`motion/react`) and GSAP. */
export const durations = {
  /** Split-flap character cadence — the departure-board tick. */
  tick: 0.05,
  /** Micro hover feedback. */
  instant: 0.1,
  /** Buttons, small state changes. */
  fast: 0.2,
  /** Most enter / exit, default. */
  base: 0.35,
  /** Larger reveals, section transitions. */
  slow: 0.6,
  /** Hero load, page transitions (800–1000ms). */
  slower: 0.9,
  /** Looping / atmospheric motion. */
  ambient: 1.2,
} as const satisfies Record<string, number>;

/** Milliseconds — identical values, matching the `--dur-*` CSS variables. */
export const durationsMs = {
  tick: 50,
  instant: 100,
  fast: 200,
  base: 350,
  slow: 600,
  slower: 900,
  ambient: 1200,
} as const satisfies Record<string, number>;

export type DurationName = keyof typeof durations;
