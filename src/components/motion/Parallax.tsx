"use client";

import { createElement, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Scroll-linked parallax (DESIGN_GUIDELINES.md §7.5). The child translates as it
 * passes through the viewport, scrubbed LINEARLY to the scroll position — easing
 * scroll-linked motion makes it feel broken (§7.1). Keep `speed` subtle (<0.15).
 * Degrades to static under reduced motion.
 */
interface ParallaxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** Differential as a fraction of element height. Keep subtle (<0.15 per §7.5). */
  speed?: number;
}

export function Parallax({
  as: Tag = "div",
  className,
  speed = 0.12,
  children,
  ...rest
}: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !ref.current) return; // static
      gsap.fromTo(
        ref.current,
        { yPercent: -speed * 50 },
        {
          yPercent: speed * 50,
          ease: "none", // linear — tracks scroll exactly (§7.1)
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [reduced, speed], revertOnUpdate: true },
  );

  return createElement(Tag, { ref, className, ...rest }, children);
}
