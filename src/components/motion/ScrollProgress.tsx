"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/motion/gsap";

/*
 * Page scroll-progress indicator (DESIGN_GUIDELINES.md §7.5) — a thin bar that
 * scales with scroll position, read from the single Lenis/ScrollTrigger RAF.
 *
 * Reduced motion: intentionally left active. scaleX is bound LINEARLY to scroll
 * progress (no easing, no self-running animation), so it's a functional position
 * indicator rather than vestibular motion — there is nothing to "ease away".
 */
type ScrollProgressProps = {
  className?: string;
};

export function ScrollProgress({ className }: ScrollProgressProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const bar = ref.current;
      if (!bar) return;

      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
      // quickSetter is the lean per-frame writer for hot scroll updates (§7.5).
      const setScaleX = gsap.quickSetter(bar, "scaleX") as (v: number) => void;
      const st = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => setScaleX(self.progress),
      });

      return () => st.kill();
    },
    { scope: ref },
  );

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* Colour reads --progress-accent (set per case-study route), falling back
          to the monochrome foreground so the base chrome stays colourless (§4). */}
      <div
        ref={ref}
        className="h-full w-full"
        style={{ backgroundColor: "var(--progress-accent, var(--fg))" }}
      />
    </div>
  );
}
