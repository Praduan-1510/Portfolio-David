"use client";

import { useEffect, useRef } from "react";

/*
 * Ambient film grain (DESIGN_GUIDELINES.md §7.8 / §9 — faint, purposeful texture).
 * A small grayscale-noise tile generated ONCE on mount and repeated as a CSS
 * background, composited with `mix-blend-overlay` so it reads as subtle atmosphere
 * over a dark surface. Standalone — uses no design tokens.
 *
 * PERFORMANCE: this used to redraw a FULL-element noise canvas every other frame
 * via createImageData + a per-pixel loop + putImageData. On the page-tall
 * home-atmosphere instance (≈6000px) that was millions of Math.random() writes per
 * frame on the main thread, continuously — a measured ~14% of the main thread at
 * idle on its own, and a major scroll-jank source. At ≤5% opacity over near-black
 * the grain is texture, not motion, so the animation was imperceptible: we now
 * paint a single repeating tile (O(1), independent of layer size) and the cost is
 * gone. This is inherently reduced-motion-safe (it never animates).
 */
interface AnimatedNoiseProps {
  /** 0–1; keep low (~0.03–0.05) so it stays texture, not a layer. */
  opacity?: number;
  className?: string;
}

const TILE = 128; // px; repeated across the layer — fine grain at any element size.

export function AnimatedNoise({ opacity = 0.05, className }: AnimatedNoiseProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(TILE, TILE);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v; // R
      data[i + 1] = v; // G
      data[i + 2] = v; // B
      data[i + 3] = 255; // A
    }
    ctx.putImageData(img, 0, 0);
    el.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
    el.style.backgroundRepeat = "repeat";
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  );
}
