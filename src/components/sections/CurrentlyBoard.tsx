"use client";

import { StaggerGroup, FlapText } from "@/components/motion";
import { useKolkataClock } from "@/hooks/useKolkataClock";
import { spectrumAt } from "@/lib/spectrum";

/*
 * "Currently" board — the departure-board answer to a stats strip. Four
 * instrument rows of REAL positioning data (what's being designed, what
 * shipped and how it measures, what's hand-coded, availability + live IST
 * clock), each value fluttering in via FlapText as the board scrolls into
 * view. Replaces the old self-referential gauge cluster: proof and presence
 * instead of inventory. All mono-caps (the flap-safe voice), hairline-framed.
 */

const ROWS: { label: string; value: string }[] = [
  { label: "Currently", value: "Designing InsightsTap · B2B AI GTM" },
  { label: "Shipped", value: "insightstap.com · Lighthouse a11y 95" },
  { label: "Screens", value: "41 hand-coded for the case studies" },
  // The STATUS row is rendered separately — it carries the live clock.
];

export function CurrentlyBoard() {
  const clock = useKolkataClock();

  return (
    <StaggerGroup as="dl" stagger={0.08} className="border-y border-line">
      {ROWS.map((row, i) => (
        <BoardRow key={row.label} index={i} label={row.label}>
          <FlapText text={row.value.toUpperCase()} trigger="inView" flips={3} />
        </BoardRow>
      ))}
      <BoardRow index={ROWS.length} label="Status">
        <span className="inline-flex flex-wrap items-baseline gap-x-space-3">
          <span className="inline-flex items-center gap-space-2">
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] rounded-full bg-neon motion-safe:animate-status-pulse"
            />
            <FlapText text="AVAILABLE · KOLKATA" trigger="inView" flips={3} />
          </span>
          <span className="tabular-nums text-muted" suppressHydrationWarning>
            IST {clock ?? "––:––:––"}
          </span>
        </span>
      </BoardRow>
    </StaggerGroup>
  );
}

function BoardRow({
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
