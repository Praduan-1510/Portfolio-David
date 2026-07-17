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

/*
 * Board title card — the human voice above the instrument rows. It frames the
 * status board as a live readout and fills the split's upper-left band (which
 * otherwise sat empty on lg). Each child animates in on its own (the reel's
 * timeline staggers `.children`), so keep them as three direct children.
 * Purely the lg+ split's framing — the reel renders it only there.
 */
export function BoardTitle() {
  return (
    <>
      <span className="inline-flex items-center gap-space-3 font-mono text-caption uppercase tracking-[0.2em] text-muted">
        <span
          aria-hidden="true"
          className="h-[6px] w-[6px] rounded-full bg-neon motion-safe:animate-status-pulse"
        />
        Status · Live
      </span>
      <h2 className="mt-space-4 font-display text-[clamp(1.9rem,3.1vw,3rem)] leading-[1.06] text-fg">
        A live snapshot of the work{" "}
        <span className="text-spectrum">in motion.</span>
      </h2>
      <p className="mt-space-4 max-w-[36ch] font-sans text-body text-muted [@media(max-height:820px)]:hidden">
        {"What I'm building, what shipped, and where to reach me — read straight off the board."}
      </p>
    </>
  );
}

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
