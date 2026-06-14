"use client";

import { createElement, useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  SplitText as GsapSplitText,
  registerGsap,
  gsapEase,
} from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Split-text headline reveal (DESIGN_GUIDELINES.md §5 / §7). Wraps GSAP SplitText
 * (now free) with mask-clipped per-line entrance, automatic re-split on font load
 * and resize (autoSplit), and full cleanup (split.revert). Under reduced motion —
 * or before JS — it renders plain, fully-readable text (no split). Reserve this
 * for the hero and maybe one section title.
 */
interface SplitTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  as?: React.ElementType;
  /** Delay in seconds before the line reveal starts (for hero choreography). */
  delay?: number;
  /** "inView" plays on scroll-in (default); "load" plays on mount. */
  trigger?: "inView" | "load";
}

export function SplitText({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  trigger = "inView",
  ...rest
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !ref.current) return; // plain text, fully visible

      const split = GsapSplitText.create(ref.current, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) => {
          const vars: gsap.TweenVars = {
            yPercent: 110,
            opacity: 0,
            duration: durations.slow,
            ease: gsapEase.outExpo,
            stagger: 0.06,
            delay,
          };
          if (trigger === "inView") {
            vars.scrollTrigger = { trigger: ref.current, start: "top 85%", once: true };
          }
          return gsap.from(self.lines, vars);
        },
      });

      return () => split.revert();
    },
    { scope: ref, dependencies: [reduced, children, delay, trigger], revertOnUpdate: true },
  );

  return createElement(Tag, { ref, className, ...rest }, children);
}
