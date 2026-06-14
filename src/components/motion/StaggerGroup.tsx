"use client";

import { createElement, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { stagger as staggerTokens, distance } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Staggered group reveal (DESIGN_GUIDELINES.md §7.4 choreography). The group's
 * DIRECT children enter in concert — fading and rising in sequence — when the
 * group scrolls into view (or on load, for above-the-fold beats). One ScrollTrigger
 * per group, transform/opacity only.
 *
 * Children are visible by default and only hidden inside the layout effect, so
 * reduced-motion / no-JS never traps content behind the animation (§10). Pairs
 * with the shared motion tokens so its rhythm matches <Reveal> everywhere.
 */
interface StaggerGroupProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** Seconds between siblings (default = tokens.stagger.base). */
  stagger?: number;
  /** Translate distance in px. */
  y?: number;
  /** Delay before the sequence starts (seconds). */
  delay?: number;
  /** Per-child duration (seconds). */
  duration?: number;
  /** "inView" (default) plays on scroll-in; "load" plays on mount. */
  trigger?: "inView" | "load";
  /** Direction of the rise: children below (default) or above their resting spot. */
  from?: "below" | "above";
}

export function StaggerGroup({
  as: Tag = "div",
  className,
  stagger = staggerTokens.base,
  y = distance.md,
  delay = 0,
  duration = durations.slow,
  trigger = "inView",
  from = "below",
  children,
  ...rest
}: StaggerGroupProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (prefersReducedMotion() || !el) return; // visible, no animation
      const items = Array.from(el.children) as HTMLElement[];
      if (items.length === 0) return;

      const vars: gsap.TweenVars = {
        opacity: 0,
        y: from === "below" ? y : -y,
        duration,
        ease: gsapEase.outExpo,
        stagger,
        delay,
      };
      if (trigger === "inView") {
        vars.scrollTrigger = { trigger: el, start: "top 82%", once: true };
      }
      gsap.from(items, vars);
    },
    {
      scope: ref,
      dependencies: [reduced, stagger, y, delay, duration, trigger, from],
      revertOnUpdate: true,
    },
  );

  return createElement(Tag, { ref, className, ...rest }, children);
}
