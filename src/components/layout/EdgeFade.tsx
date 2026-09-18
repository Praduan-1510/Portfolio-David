"use client";

import { useEffect, useState } from "react";
import { useChromeYield } from "@/hooks/useChromeYield";
import "./chrome.css";

/*
 * Edge fades: the viewport's top and bottom edges dissolve the page instead of
 * cutting it. CSS only (the recipe, bands and fallbacks are in chrome.css);
 * the component just renders the layers and hands over two booleans.
 *
 *   <EdgeFade edge="top" />     under the header's capsule. Content passing
 *                               up under the glass melts into the ground, and
 *                               anything pinned at top-16 (the reel's film,
 *                               the home portrait) loses its hard top edge.
 *                               Lighter at the very top of a page, so the
 *                               first paint is never dimmed; full strength
 *                               once scrolled.
 *   <EdgeFade edge="bottom" />  under the dock: a four-step progressive blur
 *                               (two on touch) plus a tint. It leaves with
 *                               the dock (useChromeYield), so the footer and
 *                               the home reel's board are never blurred.
 *
 * Decorative: aria-hidden, pointer-events none, never printed; forced colours
 * and landscape phones drop it; no backdrop-filter, reduced transparency or a
 * struggling GPU (html[data-glass="flat"]) keep the tint alone. The layers
 * each carry their own mask, and the wrappers are only ever TRANSFORMED: a
 * mask or opacity on a wrapper would make it a Backdrop Root and blank every
 * blur inside it.
 */

// Scroll (px) past which the top edge deepens, and under which it relaxes.
const DEEPEN_AT = 24;
const RELAX_AT = 8;

function BottomEdge() {
  const yielded = useChromeYield();
  return (
    <div
      aria-hidden="true"
      data-yield={yielded ? "" : undefined}
      className="edge-fade edge-fade--bottom print:hidden"
    >
      <span className="ef-blur ef-1" />
      <span className="ef-blur ef-2" />
      <span className="ef-blur ef-3" />
      <span className="ef-blur ef-4" />
      <span className="ef-tint" />
    </div>
  );
}

function TopEdge() {
  const [scrolled, setScrolled] = useState(false);

  // One boolean flip per crossing from a passive listener (Lenis drives native
  // scroll, so it fires for both), never per-frame work.
  useEffect(() => {
    let current = false;
    const update = () => {
      const y = window.scrollY;
      const next = current ? y > RELAX_AT : y > DEEPEN_AT;
      if (next === current) return;
      current = next;
      setScrolled(next);
    };
    // A reload mid-page restores scroll before any scroll event: read once.
    const first = window.setTimeout(update, 0);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-scrolled={scrolled ? "" : undefined}
      className="edge-fade edge-fade--top print:hidden"
    >
      <span className="ef-blur ef-1" />
      <span className="ef-blur ef-2" />
      <span className="ef-tint" />
    </div>
  );
}

export function EdgeFade({ edge }: { edge: "top" | "bottom" }) {
  return edge === "top" ? <TopEdge /> : <BottomEdge />;
}
