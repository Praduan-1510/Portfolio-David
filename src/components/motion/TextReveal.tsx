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
import { distance, stagger as staggerTokens } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Kinetic typography (DESIGN_GUIDELINES.md §5 "type as motion" / §7). Headlines
 * reveal by line, word, or character: the direct fix for "text-heavy". Wraps
 * GSAP SplitText (free) with autoSplit (re-splits on font load + resize) and
 * full cleanup.
 *
 * Two effects:
 *   blur (default, every heading): each unit resolves out of a soft blur while
 *     rising a short distance, on the symmetric standard curve.
 *   mask: each unit rises from behind a clip mask. Paragraphs keep this one,
 *     because blurring long text is GPU-heavy (docs/guide/Design.md §7.4).
 *
 * Before JS and under reduced motion it renders plain, fully-readable text, no
 * split, nothing hidden (§10). Reserve `chars` for short, high-impact lines;
 * prefer `lines`/`words` for paragraphs so reading is never harder.
 */
interface TextRevealProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  as?: React.ElementType;
  /** Split granularity. */
  by?: "lines" | "words" | "chars";
  /** "blur" (default) for headings; "mask" for paragraphs. */
  effect?: "blur" | "mask";
  /** Delay before the reveal starts (seconds). */
  delay?: number;
  /** Per-unit stagger (seconds). Defaults scale with granularity. */
  stagger?: number;
  /** "inView" (default) plays on scroll-in; "load" plays on mount. */
  trigger?: "inView" | "load";
  /** Per-unit duration (seconds). */
  duration?: number;
}

/**
 * The heading entrance, shared with `<Reveal blur>` so a phrase that cannot be
 * split (the hero's gradient-clipped close) resolves with the words beside it.
 *
 * Opacity starts at 0.001, not 0, so the text is still painted while it is
 * effectively invisible. No mask: a clip would cut off the blur's halo and the
 * rise. `filter` is expensive to leave on, so every property the tween touched
 * goes back to the stylesheet when it lands.
 */
export function blurIn(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
  rise: number = distance.sm,
): gsap.core.Tween {
  gsap.set(targets, { willChange: "transform, filter, opacity" });
  return gsap.fromTo(
    targets,
    { opacity: 0.001, filter: "blur(5px)", y: rise },
    {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      duration: durations.slow,
      ease: gsapEase.standard,
      ...vars,
      onComplete: () => {
        gsap.set(targets, { clearProps: "filter,transform,opacity,willChange" });
      },
    },
  );
}

export function TextReveal({
  children,
  as: Tag = "h2",
  className,
  by = "lines",
  effect = "blur",
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
      const host = ref.current;
      if (prefersReducedMotion() || !host) return; // plain, fully-visible text

      // Tighter stagger for finer granularity so words/chars never drag (§7.4).
      const step =
        stagger ??
        (by === "chars"
          ? staggerTokens.tight / 2
          : by === "words"
            ? staggerTokens.tight
            : staggerTokens.base);

      const pieces = (self: GsapSplitText) =>
        by === "chars" ? self.chars : by === "words" ? self.words : self.lines;
      // Fresh vars per split: autoSplit calls onSplit again on font load and
      // resize, and GSAP writes into the vars object it is handed.
      const timing = (): gsap.TweenVars => {
        const vars: gsap.TweenVars = { duration, stagger: step, delay };
        if (trigger === "inView") {
          vars.scrollTrigger = { trigger: host, start: "top 85%", once: true };
        }
        return vars;
      };

      const split = GsapSplitText.create(host, {
        type: by,
        autoSplit: true,
        // SplitText's default aria handling writes aria-label onto the host and
        // aria-hidden onto the pieces. On a <p> or <span> that is a SERIOUS axe
        // violation (aria-prohibited-attr): ARIA forbids aria-label on the
        // generic and paragraph roles, which is what those elements map to.
        // Turning it off is safe HERE specifically because this component only
        // ever splits by lines or words — never chars — so the pieces are still
        // whole words in document order and a screen reader reads them normally.
        // If a `chars` caller is ever added, it needs an sr-only twin instead.
        aria: "none",
        ...(effect === "mask"
          ? {
              mask: by,
              onSplit: (self: GsapSplitText) =>
                gsap.from(pieces(self), {
                  yPercent: 110,
                  opacity: 0,
                  ease: gsapEase.outExpo,
                  ...timing(),
                }),
            }
          : {
              // Keep non-breaking spaces. SplitText's default whitespace pass
              // rewrites every \s run to a plain space BEFORE it splits, and \s
              // matches U+00A0, so displayTitle()'s "App Redesign" glue was
              // being split apart and re-wrapped across lines. Off, the text
              // splits on plain spaces only, so a glued pair stays one word;
              // prepareText does the collapsing instead, minus the NBSP.
              reduceWhiteSpace: false,
              prepareText: (text: string) => text.replace(/[ \t\n\r\f\v]+/g, " "),
              onSplit: (self: GsapSplitText) => blurIn(pieces(self), timing()),
            }),
      });

      return () => split.revert();
    },
    {
      scope: ref,
      dependencies: [reduced, children, by, effect, delay, stagger, trigger, duration],
      revertOnUpdate: true,
    },
  );

  return createElement(Tag, { ref, className, ...rest }, children);
}
