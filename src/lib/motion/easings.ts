/**
 * Easing curves — the TS mirror of the CSS custom properties in
 * src/app/globals.css (DESIGN_GUIDELINES.md §7.2). JS-driven animations
 * (Motion / GSAP) MUST use these so they match the CSS exactly.
 *
 * - `easings`     → bezier control-point tuples for Motion (`motion/react`).
 * - `cssEasings`  → `cubic-bezier(...)` strings for GSAP `CustomEase` / inline CSS.
 *
 * Use the named curves only; never hand-author ad-hoc beziers.
 */

/** Bezier control points [x1, y1, x2, y2] — Motion's `ease` / `transition.ease`. */
export const easings = {
  /** Workhorse for reveals & entrances. */
  outExpo: [0.16, 1, 0.3, 1],
  /** Transforms, page / section transitions. */
  inOutQuart: [0.76, 0, 0.24, 1],
  /** Default UI / hover settles. */
  outQuad: [0.25, 1, 0.5, 1],
  /** Slight overshoot — for playful accents only, sparingly. */
  outBack: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** `cubic-bezier(...)` strings, identical values — for GSAP / inline styles. */
export const cssEasings = {
  outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
  inOutQuart: "cubic-bezier(0.76, 0, 0.24, 1)",
  outQuad: "cubic-bezier(0.25, 1, 0.5, 1)",
  outBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Scroll-linked / scrubbed motion only. */
  linear: "linear",
} as const satisfies Record<string, string>;

export type EasingName = keyof typeof easings;
