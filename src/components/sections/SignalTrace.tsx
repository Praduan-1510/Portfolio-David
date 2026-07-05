"use client";

import NextLink from "next/link";
import { motion } from "motion/react";
import { durations } from "@/lib/motion/durations";
import { easings } from "@/lib/motion/easings";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Signal trace — the hero's instrument, not an ornament. The line's gradient
 * is the four project accents in project order, and each tick IS a project:
 * a diamond seated on the line, its ordinal beneath, the project name
 * revealing on hover/focus — and the whole marker is a real link into that
 * case study. The hero ends with "SCROLL — TO SEE WORK"; this is the map of
 * exactly what's coming, plotted 01–04.
 *
 * Draw-in: the line scales in on the expo token after the wordmark settles,
 * the markers land in sequence (outBack), then the diamonds breathe on the
 * shared status-pulse. Layer discipline fixes the earlier transform clash:
 * OUTER span owns static position/centring (CSS), a MIDDLE motion.span owns
 * the entrance, the INNER diamond owns the pulse keyframe — nothing clobbers
 * anything. Reduced motion renders everything settled and still.
 */

// Must track src/content/work order + accents (same source of truth as the
// flight board's ordinals).
const PROJECTS = [
  { slug: "insightstap", name: "InsightsTap", accent: "#2DD4BF", pos: 0.08 },
  { slug: "spendee", name: "Spendee", accent: "#C9E94B", pos: 0.36 },
  { slug: "voyager", name: "Voyager", accent: "#F7A53B", pos: 0.64 },
  { slug: "decathlon", name: "Decathlon", accent: "#46B4F0", pos: 0.92 },
] as const;

const TRACE_GRADIENT = `linear-gradient(90deg, ${PROJECTS.map(
  (p, i) => `${p.accent} ${Math.round((i / (PROJECTS.length - 1)) * 100)}%`,
).join(", ")})`;

export function SignalTrace({
  delay = 0,
  className,
}: {
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <nav
      aria-label="Selected work"
      className={cn("relative h-[2px] min-w-0 flex-1", className)}
    >
      {/* The line — masked ends so it lands soft, drawn left-to-right. */}
      <motion.span
        aria-hidden="true"
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

      {/* Travelling highlight — a soft comet of light that runs the length of
          the trace and fades at each end, so the signal line reads as live. It
          sits UNDER the markers (declared before them) so it appears to pass
          beneath each station. Pure CSS + compositor transform; the base node is
          invisible, so reduced motion shows nothing. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 motion-safe:animate-trace-scan"
        style={{ opacity: 0, willChange: "transform, opacity" }}
      >
        {/* The comet: a soft point of light centred on the 2px line (it extends
            above/below it — no clipping ancestor), riding the track's translateX. */}
        <span
          className="absolute left-0 top-1/2 block h-[11px] w-[11px] -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.32) 52%, transparent 72%)",
            boxShadow: "0 0 13px 2px rgba(255,255,255,0.32)",
          }}
        />
      </span>

      {/* Project markers — each one a real link into its case study. */}
      {PROJECTS.map((p, i) => (
        <NextLink
          key={p.slug}
          href={`/work/${p.slug}`}
          aria-label={`${String(i + 1).padStart(2, "0")} — ${p.name} case study`}
          // OUTER: static centring + a 44px invisible hit area on the line.
          className="group absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          style={{ left: `${p.pos * 100}%` }}
        >
          {/* MIDDLE: entrance only. */}
          <motion.span
            className="relative flex items-center justify-center"
            initial={reduced ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: reduced ? 0 : delay + 0.25 + i * 0.1,
              duration: durations.base,
              ease: easings.outBack,
            }}
          >
            {/* INNER: the node — round, breathing. Hover/focus swells the
                wrapper; the pulse keyframe lives on the child so the two
                transforms never clobber each other. */}
            <span
              aria-hidden="true"
              className="block transition-transform duration-fast ease-out-quad group-hover:scale-150 group-focus-visible:scale-150"
            >
              <span
                className="block h-[9px] w-[9px] rounded-full motion-safe:animate-status-pulse"
                style={{
                  backgroundColor: p.accent,
                  boxShadow: `0 0 12px 1px color-mix(in srgb, ${p.accent} 60%, transparent)`,
                  animationDelay: `${i * 0.6}s`,
                }}
              />
            </span>
          </motion.span>
        </NextLink>
      ))}
    </nav>
  );
}
