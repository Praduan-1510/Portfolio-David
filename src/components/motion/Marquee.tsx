"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
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
 * so that HALF the track always spans the visible width: otherwise a wide
 * screen shows an empty gap rotate through mid-cycle. Drift is a constant px/sec
 * (duration derived from track width) so speed reads the same at every size.
 *
 * Motion discipline: transform-only (xPercent) at a *linear* rate, easing a
 * continuous loop reads as broken (§7.1). Paused when off-screen for the perf
 * budget (ARCHITECTURE.md §12). Under reduced motion it renders a static, fully
 * legible row (no tween); the duplicate cells are hidden from assistive tech.
 *
 * STOPPING IT. Three mechanisms, and only one of them is ever visible:
 *
 *   1. Hover. Putting a pointer over the band glides it to a stop and lets it
 *      pick back up on the way out (timeScale to 0 and back over `base`, not a
 *      hard pause: a continuous drift stopping dead reads as a dropped frame).
 *      This is what a reader who wants to look at something actually does, so
 *      it is the mechanism that needs no explaining and no chrome.
 *   2. Focus. Tabbing into the band holds it for the same reason.
 *   3. An explicit Pause control, which is CLIPPED TO A POINT until it takes
 *      keyboard focus, then appears (`.marquee-stop` in globals.css). WCAG
 *      2.2.2 wants a mechanism for auto-motion over five seconds and hover is
 *      not one for a keyboard user; a pill parked on top of the artwork is not
 *      a design. Revealing it on focus satisfies both, the way the skip link at
 *      the top of every page already does.
 *
 * A pointer that is not a hovering one (`pointerType: "touch"`) is ignored, so
 * a tap does not leave the band stopped with no way back.
 */
interface MarqueeProps {
  items: React.ReactNode[];
  /** Drift speed in pixels per second: constant regardless of track width. */
  speed?: number;
  /** Which way the track drifts. Two marquees pointed at each other read as one
   *  moving field rather than two separate strips, which is the whole point of
   *  stacking them. Left is the original behaviour and stays the default, so no
   *  existing caller changes. */
  direction?: "left" | "right";
  /** Trailing-gap utility applied to every cell (the inter-item spacing). */
  gapClassName?: string;
  /** Render the keyboard-reachable pause/play control (WCAG 2.2.2: auto-motion
   *  over 5s needs a user mechanism; prefers-reduced-motion only covers users
   *  who found the OS setting). It is invisible until focused. Default on; the
   *  control never renders in the static branch. */
  pausable?: boolean;
  className?: string;
}

// useLayoutEffect would warn during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Marquee({
  items,
  speed = 40,
  direction = "left",
  gapClassName = "pr-space-8 sm:pr-space-9",
  pausable = true,
  className,
}: MarqueeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [userPaused, setUserPaused] = useState(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const speedRef = useRef<gsap.core.Tween | null>(null);
  /* Four independent reasons to stop, kept apart so releasing one cannot
     restart a band another still holds: a pointer leaving must not resume a
     marquee the reader explicitly paused, or one that has scrolled away. Refs
     rather than state because the IntersectionObserver and the pointer handlers
     both read them without re-running the GSAP setup. */
  const holds = useRef({ user: false, offscreen: true, hover: false, focus: false });

  /* The two kinds of stop are deliberately different. `user` and `offscreen`
     are hard: nobody is looking, or has asked it to stop, so the tween pauses
     outright and costs nothing. `hover` and `focus` are soft: someone IS
     looking, so the band decelerates into a stop under the cursor and gets back
     up to speed on the way out. */
  const applyHold = useCallback(() => {
    const tween = tweenRef.current;
    if (!tween) return;
    const h = holds.current;
    speedRef.current?.kill();
    if (h.user || h.offscreen) {
      tween.pause();
      return;
    }
    tween.play();
    speedRef.current = gsap.to(tween, {
      timeScale: h.hover || h.focus ? 0 : 1,
      duration: durations.base,
      ease: "power2.out",
    });
  }, []);

  const hold = useCallback(
    (key: "user" | "offscreen" | "hover" | "focus", on: boolean) => {
      holds.current[key] = on;
      applyHold();
    },
    [applyHold],
  );
  // Even count of identical copies → -50% loops seamlessly. 2 is the SSR/no-JS
  // baseline; measured up on the client so half the track ≥ the viewport.
  const [copies, setCopies] = useState(2);

  useIsoLayoutEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track || items.length === 0) return;
    // groupWidth is independent of `copies` (the track scales linearly), so this
    // converges to a stable fixed point, no render loop.
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

      const distance = track.scrollWidth / 2; // px travelled per 50% loop
      /* Rightward is the same loop run from the other end: park the track at
         -50% and tween back to 0. Both directions therefore travel exactly one
         group width, so the seam stays invisible and `speed` still means the
         same number of pixels per second either way. */
      const from = direction === "right" ? -50 : 0;
      const to = direction === "right" ? 0 : -50;
      gsap.set(track, { xPercent: from });
      const tween = gsap.to(track, {
        xPercent: to,
        duration: distance / speed,
        ease: "none",
        repeat: -1,
        paused: true,
      });
      tweenRef.current = tween;
      // A resize rebuilds the tween at timeScale 1; re-apply whatever is
      // currently holding it so a band under the cursor does not jump back to
      // full speed mid-hover.
      applyHold();

      // Off-screen is a hold like any other, so the loop never burns frames
      // once scrolled past (§7.5 / §12) and scrolling back cannot restart a
      // band the reader paused. GSAP already throttles on tab-hidden.
      const io = new IntersectionObserver(
        ([entry]) => hold("offscreen", !entry.isIntersecting),
        { threshold: 0 },
      );
      io.observe(wrap);

      return () => {
        io.disconnect();
        speedRef.current?.kill();
        speedRef.current = null;
        tween.kill();
        tweenRef.current = null;
      };
    },
    {
      scope: wrapRef,
      dependencies: [reduced, speed, direction, copies, applyHold, hold],
      revertOnUpdate: true,
    },
  );

  // `copies` repetitions of the set; only the first set is read by assistive
  // tech, the rest are decorative duplicates.
  const cells = Array.from({ length: copies }).flatMap(() => items);

  const togglePause = () => {
    const next = !holds.current.user;
    setUserPaused(next);
    hold("user", next);
  };

  return (
    // The control sits OUTSIDE the masked container: the edge fade would
    // otherwise wash it out at exactly the corner it occupies.
    <div
      className={cn("relative", className)}
      // A hovering pointer holds the band; a touch pointer does not, because
      // there is no matching leave and the reader would be left looking at a
      // stopped strip with nothing to restart it.
      onPointerEnter={(e) => e.pointerType !== "touch" && hold("hover", true)}
      onPointerLeave={(e) => e.pointerType !== "touch" && hold("hover", false)}
      // A pointer lifted or cancelled over the band (a stylus leaving range, a
      // gesture taken over by the browser) never fires leave.
      onPointerCancel={() => hold("hover", false)}
      onFocusCapture={() => hold("focus", true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) hold("focus", false);
      }}
    >
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
          // `.marquee-stop` clips this to a point until it takes keyboard focus,
          // at which point it becomes the pill below. Nothing is drawn over the
          // artwork at rest, and the ::before hit-area overhang (44px past a
          // small pill) only exists while it is visible.
          className="marquee-stop absolute right-space-2 top-space-2 z-10 inline-flex items-center gap-[5px] rounded-full border border-line bg-[color:color-mix(in_srgb,var(--bg)_88%,transparent)] px-space-2 py-[2px] font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[color:color-mix(in_srgb,var(--fg)_85%,transparent)] backdrop-blur-sm before:absolute before:-inset-3 before:content-['']"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-[5px] w-[5px] rounded-full",
              userPaused ? "bg-[color:color-mix(in_srgb,var(--fg)_60%,transparent)]" : "bg-neon",
            )}
          />
          {userPaused ? "Play" : "Pause"}
        </button>
      )}
    </div>
  );
}
