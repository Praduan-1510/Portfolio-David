"use client";

import { createElement, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { distance } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { blurIn } from "./TextReveal";

/*
 * In-view reveal: fades/translates in once when scrolled into view
 * (DESIGN_GUIDELINES.md §7.5). Transform + opacity only, unless `blur` asks for
 * the heading blur-in. Content is visible by default and only hidden in a
 * layout effect (useGSAP), so no-JS / reduced-motion never traps content
 * behind the animation (§10).
 */
interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** Translate distance in px (16–40 per §7.3; `distance.sm` with `blur`). */
  y?: number;
  /** Resolve out of a blur like a <TextReveal> heading, for a heading phrase
   *  that cannot be split (e.g. one clipped to a gradient). Headings only:
   *  never on long text, where the blur is GPU-heavy. */
  blur?: boolean;
  /** Delay in seconds: stagger siblings 0.04–0.08 (§7.4). */
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
  y,
  blur = false,
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
      // A cover handoff is aiming its clone at a hero inside: leave it still.
      if (
        document.documentElement.dataset.handoff &&
        ref.current.querySelector("[data-handoff-target]")
      ) {
        return;
      }
      const timing: gsap.TweenVars = { duration, delay };
      if (trigger === "inView") {
        timing.scrollTrigger = { trigger: ref.current, start: "top 85%", once: true };
      }
      if (blur) {
        blurIn(ref.current, timing, y ?? distance.sm);
        return;
      }
      gsap.from(ref.current, {
        opacity: 0,
        y: y ?? 24,
        ease: gsapEase.outExpo,
        ...timing,
      });
    },
    {
      scope: ref,
      dependencies: [reduced, y, blur, delay, duration, trigger],
      revertOnUpdate: true,
    },
  );

  // createElement (not <Tag/>) so the polymorphic `as` doesn't trip the JSX
  // intrinsic-element union once R3F augments the global JSX namespace.
  return createElement(Tag, { ref, className, ...rest }, children);
}
