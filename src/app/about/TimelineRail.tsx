"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Timeline rail (About → Experience signature). Wraps a group of role entries and
 * draws a vertical hairline down the left edge as the group scrolls into view —
 * the "timeline that draws on scroll" beat.
 *
 * The line is a transform: scaleY 0→1 from the top (origin top), so it animates on
 * the GPU only — never width/height/top. Reduced motion / no-JS: the line rests at
 * full height (static rail), so the structure is always present (§10). Decorative →
 * aria-hidden; the static `border-l` fallback is kept off so the two never overlap.
 */
interface TimelineRailProps {
  className?: string;
  children: React.ReactNode;
}

export function TimelineRail({ className, children }: TimelineRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      const line = lineRef.current;
      if (prefersReducedMotion() || !el || !line) return; // static full-height rail

      gsap.fromTo(
        line,
        { scaleY: 0, transformOrigin: "top center" },
        {
          scaleY: 1,
          transformOrigin: "top center",
          duration: durations.slower,
          ease: gsapEase.outExpo,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      );
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn("relative pl-space-4", className)}>
      <span
        ref={lineRef}
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-px bg-line"
      />
      {children}
    </div>
  );
}
