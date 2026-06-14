"use client";

import { useEffect, useRef, useState } from "react";

/*
 * About-hero background — a static styled map screenshot read as quiet dark
 * TEXTURE (About page only). No API key / Maps JS — just a compressed image.
 *
 * The source webp is PRE-INVERTED to a near-black road schematic (light grid on
 * near-black), cohesive with the dark monochrome system (luminance not hue;
 * DESIGN_GUIDELINES.md §4). It's drawn into a <canvas>, dimmed, and left-scrimmed
 * so the left-aligned headline + corner HUD stay high-contrast.
 *
 * Why a canvas (not <img>/next/image): a full-bleed <img> becomes the LARGEST
 * contentful paint and steals LCP from the headline. A <canvas> is NOT an LCP
 * candidate (same reason the old WebGL/Maps tiles never regressed LCP,
 * ARCHITECTURE.md §7.6 / §12) — so the SSR headline stays the LCP, and this
 * decorative layer loads after, behind it.
 *
 * Guardrails: aria-hidden + pointer-events:none (scroll passes through); fades in
 * on first draw; cover-fit anchored right-of-centre so the network sits behind the
 * HUD, clear of the headline; dpr capped at 2; redraws on resize; the shared
 * drift adds life (gated off under reduced motion); fixed full-bleed box → no CLS.
 */

const SRC = "/maps/about-hero-map.webp";

// Left-pooling scrim: --bg behind the left-aligned copy, fading right; with gentle
// top/bottom fades so the map melts into the page and the HUD stays legible.
const LEFT_SCRIM =
  "linear-gradient(90deg, var(--bg) 3%, color-mix(in srgb, var(--bg) 84%, transparent) 30%, color-mix(in srgb, var(--bg) 30%, transparent) 60%, color-mix(in srgb, var(--bg) 6%, transparent) 88%), linear-gradient(0deg, color-mix(in srgb, var(--bg) 82%, transparent) 0%, color-mix(in srgb, var(--bg) 32%, transparent) 13%, transparent 30%), linear-gradient(180deg, color-mix(in srgb, var(--bg) 74%, transparent) 0%, color-mix(in srgb, var(--bg) 28%, transparent) 12%, transparent 28%)";

export function AboutHeroMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const img = new window.Image();
    img.decoding = "async";

    const draw = () => {
      if (cancelled || !img.complete || img.naturalWidth === 0) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // Cover-fit, anchored 72% horizontally / 50% vertically.
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = w / h;
      const dw = cr > ir ? w : h * ir;
      const dh = cr > ir ? w / ir : h;
      ctx.drawImage(img, (w - dw) * 0.72, (h - dh) * 0.5, dw, dh);
      setShown(true);
    };

    img.onload = draw;
    img.src = SRC;

    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      cancelled = true;
      img.onload = null;
      ro.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-bg"
    >
      {/* Map texture — oversized so the drift never reveals an edge; dimmed so it
          stays texture, not focal; fades in once drawn. */}
      <div
        className="hero-map-drift absolute -inset-[8%]"
        style={{
          opacity: shown ? 0.5 : 0,
          transition: "opacity 1200ms var(--ease-out-expo)",
        }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* Reading scrim (desktop composition: pools left, fades the edges). */}
      <div className="absolute inset-0" style={{ background: LEFT_SCRIM }} />

      {/* Mobile reinforcement — the headline spans full width here, so pool --bg
          from the top over the upper ~64% (where the copy sits); the map texture
          shows in the lower band. Desktop keeps the left/right composition above. */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 80%, transparent) 40%, color-mix(in srgb, var(--bg) 32%, transparent) 64%, transparent 84%)",
        }}
      />
    </div>
  );
}
