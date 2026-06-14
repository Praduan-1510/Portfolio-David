/**
 * Motion tokens — the SINGLE motion language for the whole site.
 *
 * Everything that moves draws from this file: the same handful of durations,
 * two signature eases, one standard stagger, and a small set of travel
 * distances. GSAP scroll/scrub work and Motion (motion/react) route/element
 * transitions both consume these, so nothing is ad-hoc (DESIGN_GUIDELINES.md §7).
 *
 * Re-exports `durations`/`easings` so callers have one import surface.
 */
export { durations, durationsMs } from "./durations";
export { easings, cssEasings } from "./easings";

import { durations } from "./durations";
import { easings } from "./easings";

/**
 * Standard stagger steps (seconds) — siblings enter 40–80ms apart (§7.4).
 * `base` is the default; `tight` for dense lists, `loose` for a few large beats.
 */
export const stagger = {
  tight: 0.04,
  base: 0.06,
  loose: 0.08,
} as const;

/** Reveal travel distances (px) — translate 12–40px on entrance (§7.3). */
export const distance = {
  sm: 12,
  md: 24,
  lg: 40,
} as const;

/**
 * The two signature curves, named by role:
 *   entrance → ease-out-expo, the expressive reveal curve (reveals, headlines).
 *   ui       → ease-out-quad, the snappy curve (hovers, toggles, small states).
 * (`cinematic` = ease-in-out-quart for full-bleed wipes / route transitions.)
 */
export const curve = {
  entrance: easings.outExpo,
  ui: easings.outQuad,
  cinematic: easings.inOutQuart,
} as const;

/**
 * Motion (`motion/react`) Transition presets — spread straight into `transition`.
 * These are the eased "feel"; springs below are for physical element motion.
 */
export const transitions = {
  /** Section / element reveal. */
  entrance: { duration: durations.slow, ease: easings.outExpo },
  /** Hero / large cinematic reveal. */
  entranceSlow: { duration: durations.slower, ease: easings.outExpo },
  /** Snappy UI feedback. */
  ui: { duration: durations.fast, ease: easings.outQuad },
  /** Route / full-bleed transitions. */
  cinematic: { duration: durations.slow, ease: easings.inOutQuart },
} as const;

/** Motion spring presets — physics, never robotic. */
export const springs = {
  /** Soft settle — content entrances, magnetic returns. */
  soft: { type: "spring", stiffness: 140, damping: 22, mass: 1 },
  /** Snappy — interactive feedback, small UI. */
  snappy: { type: "spring", stiffness: 380, damping: 32, mass: 0.7 },
} as const;

/**
 * Shared Motion variant set for staggered entrances (fade + rise). Pair a parent
 * `staggerContainer` with child `fadeRise` items. Distances/eases come from the
 * tokens above so Motion-driven groups match the GSAP ones exactly.
 */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: stagger.base, delayChildren: 0.05 },
  },
} as const;

export const fadeRise = {
  hidden: { opacity: 0, y: distance.md },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easings.outExpo },
  },
} as const;
