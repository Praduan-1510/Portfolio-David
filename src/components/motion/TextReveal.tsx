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
import { stagger as staggerTokens } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Kinetic typography (DESIGN_GUIDELINES.md §5 "type as motion" / §7). Headlines
 * reveal by line, word, or character behind a clip mask — the direct fix for
 * "text-heavy". Wraps GSAP SplitText (free) with autoSplit (re-splits on font
 * load + resize) and full cleanup.
 *
 * Before JS and under reduced motion it renders plain, fully-readable text — no
 * split, nothing hidden (§10). Reserve `chars` for short, high-impact lines;
 * prefer `lines`/`words` for paragraphs so reading is never harder.
 */
interface TextRevealProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  as?: React.ElementType;
  /** Split granularity. */
  by?: "lines" | "words" | "chars";
  /** Delay before the reveal starts (seconds). */
  delay?: number;
  /** Per-unit stagger (seconds). Defaults scale with granularity. */
  stagger?: number;
  /** "inView" (default) plays on scroll-in; "load" plays on mount. */
  trigger?: "inView" | "load";
  /** Per-unit duration (seconds). */
  duration?: number;
}

export function TextReveal({
  children,
  as: Tag = "h2",
  className,
  by = "lines",
  delay = 0,
  stagger,
  trigger = "inView",
  duration = durations.slow,
  ...rest
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !ref.current) return; // plain, fully-visible text

      // Tighter stagger for finer granularity so words/chars never drag (§7.4).
      const step =
        stagger ??
        (by === "chars"
          ? staggerTokens.tight / 2
          : by === "words"
            ? staggerTokens.tight
            : staggerTokens.base);

      const split = GsapSplitText.create(ref.current, {
        type: by,
        mask: by,
        autoSplit: true,
        onSplit: (self) => {
          const targets =
            by === "chars" ? self.chars : by === "words" ? self.words : self.lines;
          const vars: gsap.TweenVars = {
            yPercent: 110,
            opacity: 0,
            duration,
            ease: gsapEase.outExpo,
            stagger: step,
            delay,
          };
          if (trigger === "inView") {
            vars.scrollTrigger = { trigger: ref.current, start: "top 85%", once: true };
          }
          return gsap.from(targets, vars);
        },
      });

      return () => split.revert();
    },
    {
      scope: ref,
      dependencies: [reduced, children, by, delay, stagger, trigger, duration],
      revertOnUpdate: true,
    },
  );

  return createElement(Tag, { ref, className, ...rest }, children);
}
