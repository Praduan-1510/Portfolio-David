"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { stagger } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Animated divider (DESIGN_GUIDELINES.md §9 / §7.5): the site's one seam object.
 * A hairline draws across as it enters view (scaleX from its origin, outExpo)
 * and, with `ticks`, two register marks drop from its ends at the container
 * gutters 60% of the way into the draw: the plate vocabulary of the case-study
 * diagrams (a rule plus two registration marks) applied to the page's own
 * structure. Pure transform, one ScrollTrigger per seam.
 *
 * Ink: "line" is the flat hairline. "rule" is the --rule-ink ramp, a printed
 * rule that runs out of ink: heaviest where the draw starts and fading toward
 * the far end. A centre draw mirrors the ramp so the ink is heaviest in the
 * middle and fades toward both gutters.
 *
 * The rule, the ticks and the draw are separate elements on purpose: the
 * scaleX draw and the faded-ends mask sit on the rule alone, so the ticks are
 * neither dragged along by the transform nor erased by the mask at the ends
 * where they live. The root is a 1px wrapper, so layout is unchanged.
 *
 * Reduced motion / no-JS: markup renders the full-width rule and full-height
 * ticks (the resting state); only the layout effect hides them, so the
 * structural rule is always present (§10). Decorative, so aria-hidden.
 */
interface AnimatedDividerProps {
  className?: string;
  /** Draw origin. */
  from?: "left" | "right" | "center";
  /** Tween duration (seconds). */
  duration?: number;
  /** Rule ink: the flat hairline, or the --rule-ink ramp that runs out of ink. */
  ink?: "line" | "rule";
  /** Register ticks: 1px by 6px marks that drop from both ends of the rule. */
  ticks?: boolean;
  /** Legacy alias of ink="rule", kept so existing call sites keep working. */
  spectrum?: boolean;
}

// Faded ends: the ink fades where the rule runs out, never where it starts,
// so a directional rule fades only at its far end and a centre rule at both.
const FADE = {
  left: "linear-gradient(90deg, #000, #000 88%, transparent)",
  right: "linear-gradient(90deg, transparent, #000 12%, #000)",
  center: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
} as const;

export function AnimatedDivider({
  className,
  from = "left",
  duration = durations.slow,
  ink = "line",
  ticks = false,
  spectrum = false,
}: AnimatedDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isRule = ink === "rule" || spectrum;

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (prefersReducedMotion() || !el) return; // static full-width rule + ticks
      const rule = el.querySelector<HTMLElement>("[data-seam-rule]");
      const tickEls = Array.from(el.querySelectorAll<HTMLElement>("[data-seam-tick]"));
      if (!rule) return;
      const origin =
        from === "right" ? "right center" : from === "center" ? "center" : "left center";

      // Two tweens sharing one trigger position, NOT a gsap.timeline with a
      // scrollTrigger: a tween initialises its ScrollTrigger lazily on the next
      // tick, after PageTransition has reset the scroll position of the new
      // route, whereas a timeline creates the trigger synchronously here, while
      // the page may still be scrolled deep into the previous route. A once:true
      // trigger created past its own end kills itself during another trigger's
      // init loop, the trigger array shrinks mid-iteration, and the route errors.
      const trigger = { trigger: el, start: "top 90%", once: true } as const;
      gsap.fromTo(
        rule,
        { scaleX: 0, transformOrigin: origin },
        {
          scaleX: 1,
          transformOrigin: origin,
          duration,
          ease: gsapEase.outExpo,
          scrollTrigger: { ...trigger },
        },
      );
      if (tickEls.length > 0) {
        // The ticks drop at 60% of the draw, left then right.
        gsap.fromTo(
          tickEls,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: durations.fast,
            ease: gsapEase.outQuad,
            stagger: stagger.tight,
            delay: duration * 0.6,
            scrollTrigger: { ...trigger },
          },
        );
      }
    },
    {
      scope: ref,
      dependencies: [reduced, from, duration, ink, ticks, spectrum],
      revertOnUpdate: true,
    },
  );

  // The ink ramp is heaviest at its 0% end. A right-hand draw mirrors it so
  // the weight sits where the draw starts; a centre draw is two mirrored
  // halves meeting heavy-end to heavy-end in the middle.
  const inkSegments = !isRule
    ? []
    : from === "center"
      ? [
          { key: "l", className: "left-0 w-1/2", mirror: true },
          { key: "r", className: "left-1/2 w-1/2", mirror: false },
        ]
      : [{ key: "full", className: "left-0 w-full", mirror: from === "right" }];

  return (
    <div
      ref={ref}
      data-seam=""
      aria-hidden="true"
      className={cn("relative h-px w-full", className)}
    >
      {/* The rule keeps bg-line beneath the ink so it still prints where
          --rule-ink flattens to none. */}
      <span
        data-seam-rule=""
        className="absolute inset-0 bg-line"
        style={
          isRule
            ? { maskImage: FADE[from], WebkitMaskImage: FADE[from] }
            : undefined
        }
      >
        {inkSegments.map((seg) => (
          <span
            key={seg.key}
            className={cn("absolute inset-y-0", seg.className)}
            style={{
              background: "var(--rule-ink)",
              transform: seg.mirror ? "scaleX(-1)" : undefined,
            }}
          />
        ))}
      </span>
      {ticks && (
        <>
          <span
            data-seam-tick=""
            className="absolute left-0 top-0 h-1.5 w-px origin-top bg-line-strong"
          />
          <span
            data-seam-tick=""
            className="absolute right-0 top-0 h-1.5 w-px origin-top bg-line-strong"
          />
        </>
      )}
    </div>
  );
}
