"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Count-up figure (DESIGN_GUIDELINES.md §7 — large figures tick up). The number
 * tweens from `from` to `value` when it scrolls into view, then stops. Uses
 * tabular-nums so the width never jiggles as digits change (no layout thrash).
 *
 * Reduced motion / no-JS: renders the final value immediately — the text content
 * is the resolved figure, so it's correct even before/without the tween (§10).
 */
interface CountUpProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Target number. */
  value: number;
  /** Start value (default 0). */
  from?: number;
  /** Decimal places. */
  decimals?: number;
  /** Text before / after the number (e.g. "+", "%"). */
  prefix?: string;
  suffix?: string;
  /** Tween duration (seconds). */
  duration?: number;
}

function format(n: number, decimals: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function CountUp({
  value,
  from = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = durations.slower,
  className,
  ...rest
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (prefersReducedMotion() || !el) return; // already shows final value

      const obj = { n: from };
      const numEl = el.querySelector<HTMLElement>("[data-count]");
      if (!numEl) return;
      numEl.textContent = format(from, decimals);

      gsap.to(obj, {
        n: value,
        duration,
        ease: gsapEase.outExpo,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: () => {
          numEl.textContent = format(obj.n, decimals);
        },
      });
    },
    { scope: ref, dependencies: [reduced, value, from, decimals, duration] },
  );

  return (
    <span ref={ref} className={className} {...rest}>
      {prefix}
      <span data-count className="tabular-nums">
        {format(value, decimals)}
      </span>
      {suffix}
    </span>
  );
}
