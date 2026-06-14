"use client";

import { useEffect, useState } from "react";
import { SplitFlapText } from "@/components/motion";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Hero wordmark wrapper. The split-flap flaps (SplitFlapText) paint an opaque
 * per-tile background + a centre seam so the entrance reads as a real
 * departure-board flip. On the scrimmed WebGL field that solid slab fights the
 * atmosphere, so once the flips have SETTLED we dissolve the tile fill and seam
 * — the letters then float as glyphs on the calm backdrop while the entrance
 * still flips against solid cards.
 *
 * SplitFlapText sets those fills inline (and is outside this design pass, so we
 * don't edit it); we override them from this scope with a small scoped rule that
 * only bites once the `data-settled` marker is set. The marker is applied after
 * the entrance choreography finishes (PRADUAN's longest tile settles ~2s in) — or
 * immediately under reduced motion, where the flaps render settled from frame one.
 */
export function HeroWordmark() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    // Reduced motion settles instantly (no flip choreography to wait on).
    if (prefersReducedMotion()) {
      setSettled(true);
      return;
    }
    // The last tile of "PRADUAN" settles ~2s in (startDelay + flips·speed); add a
    // small cushion so the dissolve never clips a still-flipping tile.
    const t = setTimeout(() => setSettled(true), 2300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden="true"
      data-settled={settled ? "" : undefined}
      className="hero-wordmark"
    >
      {/* Scoped, settle-gated presentation override. Targets the flap tiles
          (`.font-display` divs inside the wordmark) + their centre seam
          (`.bg-black\/20`). Transparent fill once settled so the glyphs read on
          the scrimmed field; a faint baseline keeps a whisper of the flap edge.
          color/opacity only — no layout, no motion. */}
      <style>{`
        /* The flap tile and its rotating top-half overlay both paint an opaque
           inline fill; clear both so the whole glyph reads on the scrimmed field.
           The overlay is the only other inline-styled child of the tile. */
        .hero-wordmark[data-settled] .font-display,
        .hero-wordmark[data-settled] .font-display > .origin-bottom {
          background-color: transparent !important;
          transition: background-color 0.45s ease;
        }
        .hero-wordmark[data-settled] .font-display > .bg-black\\/20 {
          opacity: 0;
          transition: opacity 0.45s ease;
        }
      `}</style>
      <SplitFlapText
        text="PRADUAN"
        fontSize="clamp(2.75rem, 9vw, 7rem)"
        className="font-semibold text-fg"
      />
    </div>
  );
}
