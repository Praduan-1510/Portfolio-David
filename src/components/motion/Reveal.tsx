"use client";

import { createElement, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * In-view reveal — fades/translates in once when scrolled into view
 * (DESIGN_GUIDELINES.md §7.5). Transform + opacity only. Content is visible by
 * default and only hidden in a layout effect (useGSAP), so no-JS / reduced-motion
 * never traps content behind the animation (§10).
 */
interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** Translate distance in px (16–40 per §7.3). */
  y?: number;
  /** Delay in seconds — stagger siblings 0.04–0.08 (§7.4). */
  delay?: number;
  /** Tween duration in seconds (defaults to the `slow` token). */
  duration?: number;
  /** "inView" plays on scroll-in (default); "load" plays on mount, for
   *  orchestrated above-the-fold sequences like the hero. */
  trigger?: "inView" | "load";
}

export function Reveal({
  as: Tag = "div",
  className,
  y = 24,
  delay = 0,
  duration = durations.slow,
  trigger = "inView",
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !ref.current) return; // visible, no animation
      const vars: gsap.TweenVars = {
        opacity: 0,
        y,
        duration,
        ease: gsapEase.outExpo,
        delay,
      };
      if (trigger === "inView") {
        vars.scrollTrigger = { trigger: ref.current, start: "top 85%", once: true };
      }
      gsap.from(ref.current, vars);
    },
    {
      scope: ref,
      dependencies: [reduced, y, delay, duration, trigger],
      revertOnUpdate: true,
    },
  );

  // createElement (not <Tag/>) so the polymorphic `as` doesn't trip the JSX
  // intrinsic-element union once R3F augments the global JSX namespace.
  return createElement(Tag, { ref, className, ...rest }, children);
}
