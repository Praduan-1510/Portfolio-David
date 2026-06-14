"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Magnetic target (DESIGN_GUIDELINES.md §7.7) — the wrapped element drifts toward
 * the cursor. Pointer updates are batched onto GSAP's ticker via quickTo (one RAF,
 * not per-mousemove — §7.5). Disabled on touch / coarse pointers and under reduced
 * motion, where it renders static. Use on 1–3 elements max.
 */
interface MagneticButtonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Pull factor toward the cursor (0–1). */
  strength?: number;
  /** Max drift in px on each axis. The pull is `distance-from-centre × strength`,
   *  which grows with the element's width — so this cap keeps a magnetic button a
   *  subtle nudge instead of a wide slide (esp. on large/full-width buttons). */
  max?: number;
}

export function MagneticButton({
  className,
  strength = 0.35,
  max = 12,
  children,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;

      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (prefersReducedMotion() || !fine) return; // static on touch / reduced motion

      const xTo = gsap.quickTo(el, "x", { duration: durations.base, ease: gsapEase.outQuad });
      const yTo = gsap.quickTo(el, "y", { duration: durations.base, ease: gsapEase.outQuad });

      const clamp = (v: number) => (v < -max ? -max : v > max ? max : v);

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo(clamp((e.clientX - (r.left + r.width / 2)) * strength));
        yTo(clamp((e.clientY - (r.top + r.height / 2)) * strength));
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref, dependencies: [reduced, strength, max], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={cn("inline-block", className)} {...rest}>
      {children}
    </span>
  );
}
