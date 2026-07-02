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
  /** On-page pause/play control (WCAG 2.2.2 — auto-motion over 5s needs a user
   *  mechanism; prefers-reduced-motion only covers users who found the OS
   *  setting). Default on; the control never renders in the static branch. */
  pausable?: boolean;
  className?: string;
}

// useLayoutEffect would warn during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Marquee({
  items,
  speed = 40,
  gapClassName = "pr-space-8 sm:pr-space-9",
  pausable = true,
  className,
}: MarqueeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // User pause beats the IntersectionObserver auto-play; the ref mirrors the
  // state so the IO callback reads it without re-running the GSAP setup.
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
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
        paused: userPausedRef.current,
      });
      tweenRef.current = tween;

      // Pause off-screen so the loop never burns frames once scrolled past
      // (§7.5 / §12). GSAP already throttles on tab-hidden. A user pause always
      // wins — scrolling away and back must not restart a paused marquee.
      const io = new IntersectionObserver(
        ([entry]) =>
          entry.isIntersecting && !userPausedRef.current
            ? tween.play()
            : tween.pause(),
        { threshold: 0 },
      );
      io.observe(wrap);

      return () => {
        io.disconnect();
        tween.kill();
        tweenRef.current = null;
      };
    },
    { scope: wrapRef, dependencies: [reduced, speed, copies], revertOnUpdate: true },
  );

  // `copies` repetitions of the set; only the first set is read by assistive
  // tech, the rest are decorative duplicates.
  const cells = Array.from({ length: copies }).flatMap(() => items);

  const togglePause = () => {
    const next = !userPausedRef.current;
    userPausedRef.current = next;
    setUserPaused(next);
    if (next) tweenRef.current?.pause();
    else tweenRef.current?.play();
  };

  return (
    // The control sits OUTSIDE the masked container — the edge fade would
    // otherwise wash it out at exactly the corner it occupies.
    <div className={cn("relative", className)}>
      <div
        ref={wrapRef}
        className="relative overflow-hidden"
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
      {pausable && !reduced && (
        <button
          type="button"
          onClick={togglePause}
          // ::before extends the 44px hit area past the small visual pill.
          className="absolute right-space-2 top-1/2 z-10 inline-flex -translate-y-1/2 items-center gap-[5px] rounded-full border border-line bg-black/45 px-space-2 py-[2px] font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/85 opacity-60 backdrop-blur-sm transition-opacity duration-fast ease-out-quad before:absolute before:-inset-3 before:content-[''] hover:opacity-100 focus-visible:opacity-100"
        >
          <span
            aria-hidden="true"
            className={cn("h-[5px] w-[5px] rounded-full", userPaused ? "bg-white/60" : "bg-neon")}
          />
          {userPaused ? "Play" : "Pause"}
        </button>
      )}
    </div>
  );
}
