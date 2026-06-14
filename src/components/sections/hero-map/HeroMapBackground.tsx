"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/*
 * Hero background — a styled, non-interactive Google Map read as quiet dark
 * TEXTURE. Isolation pattern mirrors the former WebGL HeroBackground
 * (ARCHITECTURE.md §7.6):
 *   - the map is lazy, dynamic(ssr:false) → never in SSR, never blocks the hero
 *     LCP (the headline/content paint immediately; the map fades in behind);
 *   - the whole layer is aria-hidden + pointer-events:none → decorative, never
 *     captures scroll/pointer or traps focus, page scroll passes through;
 *   - a base near-black fill + a scrim keep the headline high-contrast;
 *   - a barely-perceptible drift adds life, gated off under reduced motion;
 *   - fixed full-bleed box → no CLS.
 *
 * With no API key (HeroMap returns null) this is just the near-black base + scrim
 * — a clean static fallback, never a broken map.
 *
 * `scrim` picks where the legibility pool sits:
 *   - "center" — radial pool behind a centred headline (home hero).
 *   - "left"   — pools --bg on the left behind left-aligned copy and darkens the
 *                top/bottom edges so a corner HUD stays legible (About hero).
 */
const HeroMap = dynamic(() => import("./HeroMap").then((m) => m.HeroMap), {
  ssr: false,
  loading: () => null,
});

const SCRIMS = {
  center:
    "radial-gradient(118% 82% at 50% 46%, color-mix(in srgb, var(--bg) 82%, transparent) 0%, color-mix(in srgb, var(--bg) 42%, transparent) 42%, transparent 72%), linear-gradient(to bottom, var(--bg) 0%, transparent 20%, transparent 76%, var(--bg) 100%)",
  left: "linear-gradient(90deg, var(--bg) 2%, color-mix(in srgb, var(--bg) 82%, transparent) 32%, color-mix(in srgb, var(--bg) 24%, transparent) 62%, transparent 90%), linear-gradient(0deg, color-mix(in srgb, var(--bg) 80%, transparent) 0%, color-mix(in srgb, var(--bg) 32%, transparent) 14%, transparent 30%), linear-gradient(180deg, color-mix(in srgb, var(--bg) 72%, transparent) 0%, color-mix(in srgb, var(--bg) 28%, transparent) 12%, transparent 28%)",
} as const;

export function HeroMapBackground({
  scrim = "center",
}: {
  scrim?: keyof typeof SCRIMS;
}) {
  // Fade the map in once it has mounted client-side (post-LCP). Reduced motion
  // collapses the transition to instant via the global rule — no fade-thrash.
  const [shown, setShown] = useState(false);
  useEffect(() => setShown(true), []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-bg"
    >
      {/* Map texture — oversized so the slow drift never reveals an edge; dimmed
          to ~0.6 so it stays texture, not focal; fades in on mount. */}
      <div
        className="hero-map-drift absolute -inset-[8%]"
        style={{
          opacity: shown ? 0.6 : 0,
          transition: "opacity 1200ms var(--ease-out-expo)",
        }}
      >
        <HeroMap />
      </div>

      {/* Reading scrim — pools --bg where the copy sits so the headline stays
          high-contrast, and fades the map into the page at the edges. */}
      <div className="absolute inset-0" style={{ background: SCRIMS[scrim] }} />
    </div>
  );
}
