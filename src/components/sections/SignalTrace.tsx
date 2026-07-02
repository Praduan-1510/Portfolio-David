"use client";

import { motion } from "motion/react";
import { durations } from "@/lib/motion/durations";
import { easings } from "@/lib/motion/easings";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Signal trace — the hero's one living element. A thin line whose gradient is
 * built from the FOUR PROJECT ACCENTS in project order (InsightsTap teal →
 * Spendee lime → Voyager amber → Decathlon blue): the spectrum literally made
 * from the work, not a generic rainbow. Four ticks mark the projects along it
 * — a quiet route-map of the 01–04 grid one scroll below.
 *
 * Draws in with scaleX on the expo token after the wordmark settles; the ticks
 * land in sequence and then breathe on the shared status-pulse keyframe.
 * Reduced motion renders the full line + ticks static. Decorative (aria-hidden
 * by the parent).
 */

// Project order — must track src/content/work order (insightstap, spendee,
// voyager, decathlon) and their frontmatter accents.
const PROJECT_ACCENTS = ["#2DD4BF", "#C9E94B", "#F7A53B", "#46B4F0"] as const;
const TICKS = [0.08, 0.36, 0.64, 0.92] as const;

const TRACE_GRADIENT = `linear-gradient(90deg, ${PROJECT_ACCENTS[0]} 0%, ${PROJECT_ACCENTS[1]} 34%, ${PROJECT_ACCENTS[2]} 66%, ${PROJECT_ACCENTS[3]} 100%)`;

export function SignalTrace({
  delay = 0,
  className,
}: {
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={cn("relative h-[2px] min-w-0 flex-1", className)}>
      {/* The line — masked ends so it lands soft, drawn left-to-right. */}
      <motion.span
        className="absolute inset-0 origin-left"
        style={{
          background: TRACE_GRADIENT,
          opacity: 0.75,
          maskImage:
            "linear-gradient(90deg, #000 0%, #000 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, #000 0%, #000 92%, transparent 100%)",
        }}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          delay: reduced ? 0 : delay,
          duration: durations.slower,
          ease: easings.outExpo,
        }}
      />
      {/* Project ticks — land in sequence, then breathe. */}
      {TICKS.map((pos, i) => (
        <motion.span
          key={pos}
          className="absolute top-1/2 h-[7px] w-[7px] -translate-y-1/2 rotate-45 motion-safe:animate-status-pulse"
          style={{
            left: `${pos * 100}%`,
            backgroundColor: PROJECT_ACCENTS[i],
            boxShadow: `0 0 10px 0 color-mix(in srgb, ${PROJECT_ACCENTS[i]} 55%, transparent)`,
            animationDelay: `${i * 0.6}s`,
          }}
          initial={reduced ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: reduced ? 0 : delay + 0.25 + i * 0.1,
            duration: durations.base,
            ease: easings.outBack,
          }}
        />
      ))}
    </div>
  );
}
