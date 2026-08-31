"use client";

import Image from "next/image";
import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Text } from "@/components/primitives";
import { FlapText, StaggerGroup, TextReveal } from "@/components/motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Testimonial } from "@/lib/content/testimonials";

/*
 * The register: statements presented as records rather than as praise.
 *
 * The default testimonial component — round avatars, centred pull-quotes, five
 * gold stars — is the most forged pattern on the web, which is why it reads as
 * decoration instead of evidence. This is built as a READING DESK: an index of
 * the people down the left, a spine with a lit reading head marking whoever you
 * are on, and one statement open at a time at the scale it deserves.
 *
 * Two variants, the same data (DESIGN_GUIDELINES §13 — a signature moment gets
 * an explicit simpler mobile form, and reduced motion degrades to static):
 *
 *   StatementStack (SSR baseline, mobile, reduced motion, no-JS)
 *     All of them open, stacked on hairlines. Nothing is behind an interaction,
 *     so crawlers, printers and screen readers get the whole set for free.
 *
 *   ReadingDesk (lg + fine pointer + motion allowed)
 *     Index / statement split, held at a constant height by a sizing ghost.
 *
 * The provenance stamp is the component's argument and is never decorative: an
 * entry a reader can go and check says so in the interaction colour; one that
 * rests on a private record says THAT, in the same size type, in grey.
 *
 * Portraits are the one piece of ornament, and they are load-bearing: a face
 * with a name under it is the difference between a quote and a person. They are
 * optional per entry and every layout here reads correctly without them.
 */

/* ── Provenance ─────────────────────────────────────────────────────────── */

/** Deterministic (locale- and timezone-independent) so SSR and client agree. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
function formatReceived(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/*
 * The stamp. Two states, both stated plainly:
 *
 *   public   → the interaction colour and an outbound arrow, because there is
 *              somewhere to go and the reader should feel that.
 *   on-file  → grey, a hollow ring instead of a filled dot, and the literal
 *              record held. Deliberately NOT dressed up to look clickable: the
 *              gap between "you can check this" and "you are taking my word"
 *              is the whole point, so it is rendered, not hidden.
 */
function ProvenanceStamp({ t, className }: { t: Testimonial; className?: string }) {
  const p = t.provenance;
  const base =
    "inline-flex items-center gap-space-2 font-mono text-[0.625rem] uppercase tracking-[0.16em]";

  if (p.kind === "public") {
    return (
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Read ${t.name}'s ${p.source ?? "recommendation"} in full (opens in a new tab)`}
        className={cn(
          base,
          "group/stamp text-signal transition-opacity duration-fast ease-out-quad hover:opacity-80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-bg",
          className,
        )}
      >
        <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-signal" />
        {p.source ?? "Public record"}
        <span
          aria-hidden="true"
          className="transition-transform duration-base ease-out-quad group-hover/stamp:translate-x-[3px]"
        >
          ↗
        </span>
      </a>
    );
  }

  return (
    <span className={cn(base, "text-muted", className)}>
      <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full border border-current" />
      {p.medium}
      {p.received && (
        <>
          <span aria-hidden="true">·</span>
          <time dateTime={p.received}>{formatReceived(p.received)}</time>
        </>
      )}
    </span>
  );
}

/* ── Shared pieces ──────────────────────────────────────────────────────── */

/*
 * The portrait. Greyscale at rest and full colour when the record is live: on a
 * near-black page five colour photographs at once pull harder than anything
 * else in the section, and the one that matters stops being obvious. Desaturating
 * the rest turns that into the selection cue.
 *
 * `alt=""` throughout: the person's name is right beside the image in text, so
 * announcing it again would only make a screen reader say it twice.
 */
function Portrait({
  t,
  size,
  live = true,
  className,
}: {
  t: Testimonial;
  size: number;
  live?: boolean;
  className?: string;
}) {
  if (!t.portrait) return null;
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-[2px] border transition-[filter,border-color] duration-slow ease-out-quad",
        live ? "border-line-strong grayscale-0" : "border-line grayscale",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={t.portrait}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}

/** The hanging spectrum quote mark. Absolute, never a float: a float shortens
 *  the line boxes GSAP's SplitText has already measured, which wraps the first
 *  lines wrong on re-split. */
function QuoteMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("absolute left-0 select-none font-display leading-none text-spectrum", className)}
    >
      &ldquo;
    </span>
  );
}

/** Who is speaking. The company flutters on hover — the departure-board tell,
 *  reused where the claim is about a real organisation. */
function Byline({ t, className }: { t: Testimonial; className?: string }) {
  return (
    <span
      className={cn(
        "flex flex-wrap items-baseline gap-x-space-5 gap-y-space-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted",
        className,
      )}
    >
      <span className="text-fg">{t.name}</span>
      <span>{t.role}</span>
      <span className="text-fg" data-flap-hover>
        <FlapText text={t.company.toUpperCase()} trigger="hover" flips={2} colorMode="mono" />
      </span>
      {t.context && <span>{t.context}</span>}
    </span>
  );
}

/* ── Variant A: the stack (SSR baseline / mobile / reduced motion) ──────── */

function StatementStack({ items }: { items: Testimonial[] }) {
  return (
    <StaggerGroup as="ol" from="below" className="mt-space-6">
      {items.map((t) => (
        <li key={t.name} className="border-b border-line py-space-7">
          {/* The face and the name lead, then the words. Reversing that —
              quote first, attribution after — is how an unattributed pull-quote
              reads, and this section is about the attribution. */}
          <div className="mb-space-5 flex items-center gap-space-4">
            <Portrait t={t} size={52} />
            <span className="min-w-0">
              <Text as="span" variant="heading-s" className="block font-display text-fg">
                {t.name}
              </Text>
              <span className="mt-space-1 block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                {t.role} · {t.company}
              </span>
            </span>
          </div>
          <blockquote className="relative pl-space-7">
            <QuoteMark className="top-[-0.06em] text-[2.75rem]" />
            <Text variant="body-l" className="font-display leading-[1.38] text-fg [text-wrap:pretty]">
              {t.quote}
            </Text>
          </blockquote>
          <ProvenanceStamp t={t} className="mt-space-5 border-t border-line pt-space-4" />
        </li>
      ))}
    </StaggerGroup>
  );
}

/* ── Variant B: the reading desk (lg + fine pointer + motion) ───────────── */

/*
 * The statement itself. Rendered twice in the same grid cell: once live, and
 * once as an invisible GHOST holding the longest quote.
 *
 * The ghost is what keeps the desk still. Without it the panel is as tall as
 * whichever record is open, so switching from a four-line quote to a nine-line
 * one shoves the contact CTA down the page mid-click. A fixed min-height would
 * fix that only at the width it was measured at — the type is clamp()-fluid, so
 * the tallest record is a different number of pixels at 1024 than at 1920. The
 * ghost measures it at every width for free.
 *
 * `invisible` (visibility: hidden), not `hidden`: it must still occupy space,
 * and visibility also takes it out of the accessibility tree and tab order, so
 * a screen reader hears one statement rather than two.
 */
function StatementBody({ t, ghost = false }: { t: Testimonial; ghost?: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="block h-px w-space-9"
        style={{ background: "var(--spectrum-gradient)" }}
      />
      <blockquote className="relative mt-space-6 pl-space-8">
        <QuoteMark className="top-[-0.08em] text-[4rem]" />
        {ghost ? (
          <p className="max-w-[24ch] font-display text-heading-l leading-[1.28]">{t.quote}</p>
        ) : (
          /* Keyed on the person: GSAP's SplitText replaces this element's
             children with its own word wrappers, so React's text update on a
             plain re-render lands on a node that is no longer in the document
             and the previous quote stays on screen. Remounting hands GSAP a
             fresh element — and re-runs the word rise, which is the transition
             between records. */
          <TextReveal
            key={t.name}
            as="p"
            by="words"
            trigger="load"
            duration={0.55}
            className="max-w-[24ch] font-display text-heading-l leading-[1.28] text-fg [text-wrap:pretty]"
          >
            {t.quote}
          </TextReveal>
        )}
      </blockquote>
      <footer className="mt-space-7 flex flex-wrap items-center justify-between gap-x-space-6 gap-y-space-3 border-t border-line pt-space-4">
        <Byline t={t} />
        <ProvenanceStamp t={t} />
      </footer>
    </>
  );
}

function ReadingDesk({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = items[active];
  const longest = items.reduce((a, b) => (b.quote.length > a.quote.length ? b : a), items[0]);

  // Roving tabindex: one tab stop for the whole list, arrows move within it —
  // the WAI-ARIA vertical tabs pattern, so a keyboard reader passes the index
  // in one Tab rather than five.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const last = items.length - 1;
      let next: number | null = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = active === last ? 0 : active + 1;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = last;
      if (next === null) return;
      e.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    },
    [active, items.length],
  );

  return (
    <div className="mt-space-7 grid grid-cols-[minmax(0,19rem)_minmax(0,1fr)] items-stretch gap-space-9">
      {/* ── The index, hung on a spine ──
          The column STRETCHES to the row height rather than sitting at its own,
          so the spine runs the full depth of the desk and the space below the
          last record reads as a ruled margin instead of a gap. */}
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Statements on the record"
        onKeyDown={onKeyDown}
        className="relative"
      >
        {/* The spine: one continuous hairline the reading head runs down. */}
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-line" />

        {items.map((item, i) => {
          const isActive = i === active;
          return (
            <button
              key={item.name}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              aria-controls={`${uid}-panel`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(i)}
              className="group relative isolate flex w-full items-center gap-space-4 py-space-4 pl-space-5 pr-space-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {/* The reading head: a lit segment of spine that grows down the
                  selected record. transform-only, so it stays on the compositor. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-0 left-0 w-px origin-top transition-transform duration-slow ease-out-expo",
                  isActive ? "scale-y-100" : "scale-y-0",
                )}
                style={{ background: "var(--signal-gradient)" }}
              />
              {/* A wash of light off the spine, so the live row reads as lit
                  rather than merely brighter. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 -z-10 transition-opacity duration-base ease-out-quad",
                  isActive ? "opacity-100" : "opacity-0",
                )}
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--fg) 8%, transparent) 0%, transparent 76%)",
                }}
              />
              <Portrait t={item} size={44} live={isActive} />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate font-display text-heading-s transition-colors duration-base ease-out-quad",
                    isActive ? "text-fg" : "text-muted group-hover:text-fg",
                  )}
                >
                  {item.name}
                </span>
                {/* Company only. The role rides along in the panel's byline;
                    carrying both here wrapped every second row onto two lines
                    and cost the index its rhythm. */}
                <span className="mt-space-1 block truncate font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                  {item.company}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── The statement, at reading scale ──
          One panel for all tabs (every tab's aria-controls points here and the
          panel names its current tab back), stacked in one grid cell with the
          sizing ghost so the desk never changes height. */}
      <div className="grid grid-cols-1 grid-rows-1">
        <div aria-hidden="true" className="pointer-events-none invisible col-start-1 row-start-1">
          <StatementBody t={longest} ghost />
        </div>
        <div
          role="tabpanel"
          id={`${uid}-panel`}
          aria-labelledby={`${uid}-tab-${active}`}
          tabIndex={0}
          /* Centred in the ghost's cell rather than pinned to its top: the
             ghost is sized to the LONGEST statement, so a top-aligned short one
             leaves a two-line hole under the byline. Centring splits that slack
             above and below, which reads as composition instead of a stop. */
          className="col-start-1 row-start-1 self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-8 focus-visible:ring-offset-bg"
        >
          <StatementBody t={t} />
        </div>
      </div>
    </div>
  );
}

/* ── The switch ─────────────────────────────────────────────────────────── */

export function TestimonialRegister({ items }: { items: Testimonial[] }) {
  const reduced = useReducedMotion();
  // A fine pointer as well as the width: the desk's whole affordance is
  // pointing at a row, and on a touch tablet at 1024 the stack reads better.
  const isDesk = useMediaQuery("(min-width: 1024px) and (pointer: fine)");

  if (!isDesk || reduced) return <StatementStack items={items} />;
  return <ReadingDesk items={items} />;
}
