"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Animated divider (DESIGN_GUIDELINES.md §9 / §7.5) — a hairline that draws across
 * as it enters view, to break up dense text without decoration that means nothing.
 * Pure transform: scaleX 0→1 from the left, on the linear/expo entrance curve.
 *
 * Reduced motion / no-JS: a static full-width hairline (the resting state), so the
 * structural rule is always present (§10). Decorative → aria-hidden.
 */
interface AnimatedDividerProps {
  className?: string;
  /** Draw origin. */
  from?: "left" | "right" | "center";
  /** Tween duration (seconds). */
  duration?: number;
  /** Paint the rule with the site spectrum (faded ends) instead of the flat
   *  hairline — the structural "signal" thread between sections. */
  spectrum?: boolean;
}

export function AnimatedDivider({
  className,
  from = "left",
  duration = durations.slow,
  spectrum = false,
}: AnimatedDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (prefersReducedMotion() || !el) return; // static full-width rule
      const origin =
        from === "right" ? "right center" : from === "center" ? "center" : "left center";
      gsap.fromTo(
        el,
        { scaleX: 0, transformOrigin: origin },
        {
          scaleX: 1,
          transformOrigin: origin,
          duration,
          ease: gsapEase.outExpo,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    },
    { scope: ref, dependencies: [reduced, from, duration], revertOnUpdate: true },
  );

  // Spectrum rule: the gradient as the rule itself, masked to fade in/out at both
  // ends so it reads as a thread caught mid-run rather than a hard rainbow bar.
  const spectrumStyle: React.CSSProperties | undefined = spectrum
    ? {
        background: "var(--spectrum-gradient)",
        opacity: 0.7,
        maskImage:
          "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
      }
    : undefined;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("h-px w-full", spectrum ? "" : "bg-line", className)}
      style={spectrumStyle}
    />
  );
}
