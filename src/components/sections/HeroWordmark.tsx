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
 * the entrance choreography finishes ("PRADUAN SAHA"'s longest tile settles ~1.3s
 * in) — or immediately under reduced motion, where the flaps render settled from
 * frame one.
 */
export function HeroWordmark() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    // Reduced motion settles instantly (no flip choreography to wait on).
    if (prefersReducedMotion()) {
      setSettled(true);
      return;
    }
    // The last tile of "PRADUAN SAHA" settles ~1.3s in (startDelay 440ms + 17
    // flips·50ms for the index-11 tile); add a small cushion so the dissolve never
    // clips a still-flipping tile.
    const t = setTimeout(() => setSettled(true), 1600);
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
      {/* "PRADUAN SAHA" is 12 tiles wide (~8.3em incl. the inter-word gap), so the
          clamp floor is lowered from 2.75rem to 1.85rem: below ~330px viewport the
          flaps shrink to fit the gutter instead of overflowing. Desktop max (7rem)
          is unchanged, so the settled wordmark reads the same on wide screens. */}
      <SplitFlapText
        text="PRADUAN SAHA"
        fontSize="clamp(1.85rem, 9vw, 7rem)"
        className="font-semibold text-fg"
        multicolor
      />
    </div>
  );
}
