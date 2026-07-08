"use client";

import { FlapText } from "@/components/motion";
import { useKolkataClock } from "@/hooks/useKolkataClock";
import { spectrumAt } from "@/lib/spectrum";

/*
 * "Currently" board primitives — the departure-board answer to a stats strip.
 * Four instrument rows of REAL positioning data (what's being designed, what
 * shipped and how it measures, what's hand-coded, availability + live IST
 * clock). All mono-caps (the flap-safe voice), hairline-framed.
 *
 * The board now lives inside the home cinematic reel (reel/CinematicReel.tsx),
 * which choreographs each row against the scroll-scrubbed frame sequence — so
 * this file exports the pieces (ROWS, BoardRow, StatusValue) rather than a
 * self-triggering section. Semantics are unchanged: dl > sr-only dt + dd.
 */

export const ROWS: { label: string; value: string }[] = [
  { label: "Currently", value: "Designing InsightsTap · B2B AI GTM" },
  { label: "Shipped", value: "insightstap.com · Lighthouse a11y 95" },
  { label: "Screens", value: "41 hand-coded for the case studies" },
  // The STATUS row is rendered separately — it carries the live clock.
];

/* Status value — pulse dot + availability flap + live IST clock. A leaf
 * component so the 1s clock tick re-renders nothing but this span. */
export function StatusValue({
  flapTrigger = "inView",
  active,
}: {
  flapTrigger?: "inView" | "manual";
  active?: boolean;
}) {
  const clock = useKolkataClock();

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-space-3">
      <span className="inline-flex items-center gap-space-2">
        <span
          aria-hidden="true"
          className="h-[6px] w-[6px] rounded-full bg-neon motion-safe:animate-status-pulse"
        />
        <FlapText
          text="AVAILABLE · KOLKATA"
          trigger={flapTrigger}
          active={active}
          flips={3}
        />
      </span>
      <span className="tabular-nums text-muted" suppressHydrationWarning>
        IST {clock ?? "––:––:––"}
      </span>
    </span>
  );
}

export function BoardRow({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[2rem_1fr] items-baseline gap-x-space-4 gap-y-space-2 border-t border-line py-space-5 first:border-t-0 sm:grid-cols-[2rem_minmax(6rem,10rem)_1fr] sm:gap-x-space-6">
      <dt className="sr-only">{label}</dt>
      <span
        aria-hidden="true"
        className="font-mono text-caption tabular-nums"
        style={{ color: spectrumAt(index) }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span
        aria-hidden="true"
        className="font-mono text-caption uppercase tracking-[0.18em] text-muted"
      >
        {label}
      </span>
      <dd className="col-start-2 min-w-0 break-words font-mono text-caption uppercase tracking-[0.1em] text-fg sm:col-start-3 sm:tracking-[0.14em]">
        {children}
      </dd>
    </div>
  );
}
