"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Continuous auto-scrolling marquee (DESIGN_GUIDELINES.md §7.8 ambient motion).
 * The item set is repeated an EVEN number of times; the track translates a
 * constant -50% and loops, so the seam is invisible (the back half is an exact
 * duplicate of the front). Each cell carries its gap as trailing padding (not
 * flex `gap`) so every cell is uniform-width and the halves match exactly.
 *
 * Robust on any viewport: `copies` is measured up on mount / resize / font-load
 * so that HALF the track always spans the visible width — otherwise a wide
 * screen shows an empty gap rotate through mid-cycle. Drift is a constant px/sec
 * (duration derived from track width) so speed reads the same at every size.
 *
 * Motion discipline: transform-only (xPercent) at a *linear* rate — easing a
 * continuous loop reads as broken (§7.1). Paused when off-screen for the perf
 * budget (ARCHITECTURE.md §12). Under reduced motion it renders a static, fully
 * legible row (no tween); the duplicate cells are hidden from assistive tech.
 */
interface MarqueeProps {
  items: React.ReactNode[];
  /** Drift speed in pixels per second — constant regardless of track width. */
  speed?: number;
  /** Trailing-gap utility applied to every cell (the inter-item spacing). */
  gapClassName?: string;
  className?: string;
}

// useLayoutEffect would warn during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Marquee({
  items,
  speed = 40,
  gapClassName = "pr-space-8 sm:pr-space-9",
  className,
}: MarqueeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Even count of identical copies → -50% loops seamlessly. 2 is the SSR/no-JS
  // baseline; measured up on the client so half the track ≥ the viewport.
  const [copies, setCopies] = useState(2);

  useIsoLayoutEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track || items.length === 0) return;
    // groupWidth is independent of `copies` (the track scales linearly), so this
    // converges to a stable fixed point — no render loop.
    const measure = () => {
      const groupWidth = track.scrollWidth / copies;
      if (groupWidth <= 0) return;
      const needed = 2 * Math.max(1, Math.ceil(wrap.clientWidth / groupWidth));
      setCopies((c) => (c === needed ? c : needed));
    };
    measure();
    window.addEventListener("resize", measure);
    // Re-measure once webfonts settle (they can change cell widths vs. fallback).
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [copies, items.length]);

  useGSAP(
    () => {
      registerGsap();
      const wrap = wrapRef.current;
      const track = trackRef.current;
      if (!wrap || !track || prefersReducedMotion()) return; // static, fully visible

      const distance = track.scrollWidth / 2; // px travelled per -50% loop
      const tween = gsap.to(track, {
        xPercent: -50,
        duration: distance / speed,
        ease: "none",
        repeat: -1,
      });

      // Pause off-screen so the loop never burns frames once scrolled past
      // (§7.5 / §12). GSAP already throttles on tab-hidden.
      const io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? tween.play() : tween.pause()),
        { threshold: 0 },
      );
      io.observe(wrap);

      return () => {
        io.disconnect();
        tween.kill();
      };
    },
    { scope: wrapRef, dependencies: [reduced, speed, copies], revertOnUpdate: true },
  );

  // `copies` repetitions of the set; only the first set is read by assistive
  // tech, the rest are decorative duplicates.
  const cells = Array.from({ length: copies }).flatMap(() => items);

  return (
    <div
      ref={wrapRef}
      className={cn("relative overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
      }}
    >
      <div ref={trackRef} className="flex w-max flex-nowrap items-center">
        {cells.map((item, i) => (
          <div
            key={i}
            aria-hidden={i >= items.length ? "true" : undefined}
            className={cn("shrink-0", gapClassName)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
