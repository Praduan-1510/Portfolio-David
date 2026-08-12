/*
 * Plate geometry. Pure functions returning SVG path data: no imports, no DOM,
 * server-safe, so the diagrams render fully in the RSC pass.
 *
 * THE MECHANICAL INVARIANT, and the reason there is no text inside any SVG:
 *
 *   STRETCH pieces  preserveAspectRatio="none", sized by their grid cell.
 *                   Straight lines and horizontal-tangent curves ONLY, because
 *                   non-uniform scaling is meaningless for any other shape.
 *   GLYPH pieces    fixed width/height, never distorted: chevron heads and
 *                   registration marks.
 *
 * Every stroke in both carries vector-effect="non-scaling-stroke", so a
 * hairline stays a hairline at any container size. Labels are HTML, not SVG
 * <text>: scaled SVG text is where a designed diagram turns to mush, and
 * keeping the words in the DOM is also what lets every SVG be aria-hidden.
 */

/** Drafting unit: 2x the 4px spacing base. */
export const U = 8;

/**
 * Vertical position of the i-th source in a converging fan, as a percentage of
 * the fan's height. Exact only when the sources are a gapless, equal-height
 * stack, which is why <FlowGroup> is `grid-auto-rows: 1fr; gap: 0` with ruled
 * rows rather than spaced cards. That is not a workaround: a printed schedule
 * has equal, ruled, gapless rows.
 */
export const fanY = (i: number, n: number): number => ((i + 0.5) / n) * 100;

/**
 * One strand of a converging fan, in a 0..100 x 0..100 stretch box.
 *
 * Both endpoints have HORIZONTAL tangents. Under a non-uniform scale (sx, sy)
 * a tangent (dx, 0) maps to (sx*dx, 0), so the strand leaves its source and
 * arrives at the target cleanly at EVERY container aspect ratio; only the
 * curvature in between changes. This is the whole reason the fan can be a
 * stretch piece at all.
 */
export const fanPath = (y: number): string => `M0 ${y} C58 ${y} 42 50 100 50`;

/** Open chevron heads, drawn as fixed glyphs so they never fatten on reflow. */
export const CHEVRON_RIGHT = "M1 8 L9 12 L1 16"; // in a 10x24 box
export const CHEVRON_DOWN = "M8 1 L12 9 L16 1"; // in a 24x10 box
export const CHEVRON_LEFT = "M9 8 L1 12 L9 16"; // in a 10x24 box
