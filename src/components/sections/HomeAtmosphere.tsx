"use client";

import { AnimatedNoise } from "@/components/motion";

/*
 * Below-hero ambient grain. A whisper of the same film grain the hero uses
 * (AnimatedNoise — half-res, mix-blend-overlay, reduced-motion-safe: one static
 * frame and no rAF loop under prefers-reduced-motion), pulled across the whole
 * below-hero column so the near-black base carries a consistent, intentional
 * texture instead of reading as flat voids between sections.
 *
 * Kept very low (0.025) so it stays atmosphere, never a visible layer; the
 * radial pools that sit alongside it (in page.tsx) do the depth, the grain just
 * keeps the dark from looking like dead pixels. Decorative + pointer-events none
 * (AnimatedNoise), pinned behind the content at -z.
 */
export function HomeAtmosphere() {
  return (
    <AnimatedNoise opacity={0.025} className="pointer-events-none -z-10" />
  );
}
