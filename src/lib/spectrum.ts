/*
 * The site spectrum — five signature hues, defined as CSS variables in
 * globals.css (`--spectrum-violet … --spectrum-rose`) and exposed here as the
 * single ordered list components consume.
 *
 * This is the SIGNAL layer (wayfinding / structure / progress) — deliberately
 * distinct from the site's other two colour roles: the neon-green INTERACTION
 * signal (hover / live) and the per-project IDENTITY accents (blue / lime /
 * amber). The spectrum only ever paints thin structural marks — the scroll
 * progress bar, the section-rail dots, numbered indices, hairline seams — never a
 * fill behind content, so "colour still belongs to the work" (Design.md §4).
 *
 * Order is a warm→cool sweep so a run of indices/dots reads as one gradient and
 * adjacent items never share a hue. Built from the site's own palette (the three
 * project accents) plus a violet and a rose to close the spectrum.
 */
export const SPECTRUM = [
  "var(--spectrum-violet)",
  "var(--spectrum-blue)",
  "var(--spectrum-lime)",
  "var(--spectrum-amber)",
  "var(--spectrum-rose)",
] as const;

/** The CSS var for position `i`, wrapping the palette (handles negative i too). */
export function spectrumAt(i: number): string {
  const n = SPECTRUM.length;
  return SPECTRUM[((i % n) + n) % n];
}
