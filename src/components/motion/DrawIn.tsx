"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { stagger as staggerTokens } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Stroke draw-on for diagram line work.
 *
 * Same contract as <Reveal>: strokes are FULLY DRAWN in the markup and only
 * dashed inside the layout effect, so no-JS, reduced motion and the print
 * sheet all get a finished plate rather than an empty box.
 *
 * Paths carry pathLength="1", so the dash is normalised and we never call
 * getTotalLength(): that returns USER units while vector-effect:
 * non-scaling-stroke computes the dash in SCREEN space, and the draw would
 * over- or under-shoot by the scale factor.
 *
 * `start` defaults to "top 82%" to MATCH StaggerGroup, not Reveal's "top 85%".
 * On a downward scroll 85% is reached FIRST, so borrowing Reveal's value here
 * would fire the edges before the nodes they connect and invert the
 * choreography: a stage should land, and THEN its outgoing edge should leave it.
 */
interface DrawInProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which strokes to draw. Only elements opted in with [data-draw]. */
  select?: string;
  /** ScrollTrigger start. Matches StaggerGroup by default; see note above. */
  start?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
}

export function DrawIn({
  select = "[data-draw]",
  start = "top 82%",
  delay = 0,
  stagger = staggerTokens.tight,
  duration = durations.slow,
  className,
  children,
  ...rest
}: DrawInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (prefersReducedMotion() || !el) return; // fully drawn, no animation
      const paths = Array.from(el.querySelectorAll<SVGGeometryElement>(select));
      if (paths.length === 0) return;
      // Dash NOW, in the layout effect, never in the server output.
      gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.to(paths, {
        strokeDashoffset: 0,
        duration,
        ease: gsapEase.outExpo,
        stagger,
        delay,
        scrollTrigger: { trigger: el, start, once: true },
        // Clear the props once drawn so a later reflow can't reintroduce a
        // partial dash on a stroke whose screen length has changed.
        onComplete: () =>
          gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" }),
      });
    },
    {
      scope: ref,
      dependencies: [reduced, select, start, delay, stagger, duration],
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
