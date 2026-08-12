/*
 * Shared types for the case-study PLATES: the inline-SVG diagrams that replace
 * prose the page was previously asking a reader to hold in their head.
 *
 * The whole system is two archetypes:
 *   <Flow>       a sequence, a comparison of sequences, or a convergence
 *   <Landscape>  a positioning: two camps with a gap between them
 *
 * Everything else that looked like a third archetype turned out to be one of
 * these two wearing a different label.
 */

/** Shared by every plate. */
export interface PlateProps {
  /** Plate title. Becomes the figure's accessible name via the figcaption. */
  title: string;
  /**
   * The text alternative: what the SHAPE says, in one or two sentences.
   * Rendered sr-only, ahead of the visual layer, and REQUIRED. A diagram whose
   * relationships exist only in line work is not shippable, and the honest
   * test is whether this sentence carries the argument on its own.
   */
  alt: string;
  /** Visible caption: the sentence the plate is evidence for. */
  note?: string;
  /**
   * The `file.mdx:line` this plate REPLACES. Authoring discipline, not markup:
   * a plate that replaces nothing is a plate that makes the page longer, which
   * is the opposite of why this system exists.
   */
  replaces: string;
}

/** A dashed edge means NOT VERIFIED: the same distinction the studies already
 *  draw between a measured result and an untested hypothesis. */
export type EdgeStyle = "solid" | "soft";

/** "gate" draws the accountant's double rule on the node's leading edge. */
export type NodeKind = "node" | "gate";
