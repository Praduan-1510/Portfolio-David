import type React from "react";
import { PhoneFrame } from "@/components/primitives";
import { Reveal, StaggerGroup, Parallax, FlapDigits } from "@/components/motion";
import { cn } from "@/lib/utils/cn";

/*
 * Editorial blocks for case-study MDX bodies — the devices that turn a wall of
 * prose into something a reader scans and enjoys, all built from the existing
 * system (PhoneFrame + the motion primitives + tokens; per-project accent, mono
 * labels, hairline borders, radius-0). Each is reduced-motion-safe because the
 * primitives it composes are. Registered in mdx-components.tsx and used from MDX.
 *
 * One device per major section gives the body cadence:
 *   Research  → <FindingStack>/<Finding>  + <Aside>
 *   Strategy  → <DecisionCards>/<DecisionCard>
 *   Design    → <ScreenBeat>   (real screens woven into the narrative)
 *   Craft     → <StatusColourSystem>
 *   Outcome   → <Stats>/<Stat>
 */

/* ── ScreenBeat ─ an inline phone screen beside a decision caption. Alternates
   side for rhythm; the phone gets a subtle parallax. The app counterpart to the
   web <Shot>. ─────────────────────────────────────────────────────────────── */
export function ScreenBeat({
  src,
  label,
  caption,
  alt,
  side = "left",
}: {
  src: string;
  label?: string;
  caption?: string;
  alt?: string;
  side?: "left" | "right";
}) {
  return (
    <figure className="cs-wide my-space-9 grid items-center gap-space-6 lg:grid-cols-[14rem_1fr] lg:gap-space-8">
      <Reveal className={cn("mx-auto w-full max-w-[14rem]", side === "right" && "lg:order-2")}>
        <Parallax speed={0.05}>
          <PhoneFrame src={src} alt={alt ?? caption ?? "App screen"} sizes="14rem" imgClassName="object-top" />
        </Parallax>
      </Reveal>
      {(label || caption) && (
        <Reveal delay={0.08} className={cn(side === "right" && "lg:order-1")}>
          <figcaption>
            {label && (
              <span className="mb-space-2 block font-mono text-caption uppercase tracking-[0.18em] text-accent">
                {label}
              </span>
            )}
            {caption && (
              <span className="block max-w-[40ch] text-body-l text-fg">
                {caption}
              </span>
            )}
          </figcaption>
        </Reveal>
      )}
    </figure>
  );
}

/* ── FindingStack / Finding ─ numbered research findings (mono index + lead). ── */
export function FindingStack({ children }: { children?: React.ReactNode }) {
  return (
    <StaggerGroup as="ol" stagger={0.08} className="my-space-8 grid gap-space-6 [counter-reset:finding]">
      {children}
    </StaggerGroup>
  );
}

export function Finding({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[1.5rem_1fr] gap-x-space-4 gap-y-space-2 border-t border-line pt-space-5 [counter-increment:finding]">
      <span
        aria-hidden="true"
        className="font-mono text-caption tabular-nums text-accent before:content-[counter(finding,decimal-leading-zero)]"
      />
      {title && <p className="font-display text-body-l font-medium text-fg">{title}</p>}
      <div className="col-start-2 text-body text-muted [&>p:last-child]:mb-0">{children}</div>
    </li>
  );
}

/* ── DecisionCards / DecisionCard ─ the strategy pillars as a numbered card grid. */
export function DecisionCards({ children }: { children?: React.ReactNode }) {
  return (
    <StaggerGroup
      as="ol"
      stagger={0.07}
      className="cs-wide my-space-8 grid list-none grid-cols-1 gap-space-5 [counter-reset:decision] lg:grid-cols-2 lg:[&>li:last-child:nth-child(odd)]:col-span-2"
    >
      {children}
    </StaggerGroup>
  );
}

export function DecisionCard({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <li className="group/dc relative overflow-hidden rounded-none border-t-2 border-[color:color-mix(in_srgb,var(--accent)_30%,var(--line))] bg-[color:color-mix(in_srgb,var(--surface)_55%,transparent)] p-space-5 [counter-increment:decision]">
      <span
        aria-hidden="true"
        className="font-mono text-caption tabular-nums text-accent before:content-[counter(decision,decimal-leading-zero)]"
      />
      {title && <p className="mt-space-3 font-display text-body-l font-medium text-fg">{title}</p>}
      <div className="mt-space-2 max-w-[52ch] text-body text-muted [&>p:last-child]:mb-0">{children}</div>
    </li>
  );
}

/* ── Aside ─ a bordered editorial note (caveat / context) set apart from the column. */
export function Aside({ label = "Note", children }: { label?: string; children?: React.ReactNode }) {
  return (
    <aside
      className="my-space-7 rounded-none border-l-2 border-accent py-space-4 pl-space-5"
      style={{ backgroundColor: "color-mix(in srgb, var(--surface) 55%, transparent)" }}
    >
      <span className="mb-space-2 block font-mono text-caption uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <div className="text-body text-muted [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}

/* ── StatusColourSystem ─ makes Spendee's "colour is information" claim tangible:
   the green / red / amber status palette as real swatches with their meaning. The
   one place colour beyond the route accent is intentional — it's the subject app's
   own system, shown as content (like a screenshot would carry it), not site chrome. */
const STATUS = [
  { color: "#5BD08A", name: "Green", label: "Settled / In", meaning: "Money received, paid, reconciled" },
  { color: "#F06B6B", name: "Red", label: "Overdue / Out", meaning: "Past due, money owed, action needed" },
  { color: "#E8B23E", name: "Amber", label: "Pending", meaning: "Awaiting payment, approaching deadlines" },
] as const;

export function StatusColourSystem() {
  return (
    <Reveal
      as="ul"
      className="cs-wide my-space-8 grid grid-cols-1 gap-space-5 lg:grid-cols-3"
      aria-label="Spendee status colour system"
    >
      {STATUS.map((s) => (
        <li key={s.label} className="border-t border-line pt-space-4">
          <span
            aria-hidden="true"
            className="block h-space-6 w-full rounded-none"
            style={{ backgroundColor: s.color }}
          />
          <span className="mt-space-3 block font-mono text-caption uppercase tracking-[0.14em] text-fg">
            {s.name} — {s.label}
          </span>
          <span className="mt-space-1 block text-caption text-muted">{s.meaning}</span>
        </li>
      ))}
    </Reveal>
  );
}

/* ── Stats / Stat ─ a by-the-numbers band (author-supplied figures). ─────────── */
export function Stats({ children }: { children?: React.ReactNode }) {
  return (
    <StaggerGroup
      as="dl"
      stagger={0.08}
      className="cs-wide my-space-8 grid grid-cols-2 gap-x-space-6 gap-y-space-6 lg:grid-cols-4"
    >
      {children}
    </StaggerGroup>
  );
}

export function Stat({ value, label }: { value?: string; label?: string }) {
  return (
    // justify-end packs the value row to the bottom of the cell (flex-col-reverse
    // main axis), so every dd shares one baseline no matter how the label wraps.
    <div className="flex flex-col-reverse justify-end gap-space-2 border-t border-line pt-space-4">
      <dt className="min-w-0 break-words font-mono text-caption uppercase tracking-[0.14em] text-muted">
        {label}
      </dt>
      <dd className="whitespace-nowrap font-display text-display-l leading-none text-accent">
        {/* Odometer flutter on scroll-in — the payoff band speaks the site's
            departure-board language (digits only; word values render static). */}
        <FlapDigits value={value ?? ""} />
      </dd>
    </div>
  );
}

/* ── Lede ─ the executive deck. A short, confident thesis statement set at the
   very top of a study (before the first section), under an accent rule. It frames
   the whole case study in one line for a skimming reader — the "lead with the
   punchline" move. Rendered as a <div> so it never steals the body's lead-paragraph
   (:first-of-type) treatment from the Overview that follows. **bold** inside lifts
   to the accent. ───────────────────────────────────────────────────────────── */
export function Lede({ children }: { children?: React.ReactNode }) {
  return (
    <Reveal as="div" className="mb-space-9 border-l-2 border-accent pl-space-6">
      <span className="mb-space-3 block font-mono text-caption uppercase tracking-[0.18em] text-accent">
        In one line
      </span>
      <div className="max-w-[46ch] font-display text-[clamp(1.4rem,2.6vw,2rem)] font-medium leading-[1.18] tracking-[-0.01em] text-fg [&>p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-accent">
        {children}
      </div>
    </Reveal>
  );
}

/* ── Goals / Goal ─ a "goals & signals" instrument table. Each row pairs a design
   GOAL with the SUCCESS SIGNAL it would be judged by — framed as a target/hypothesis,
   never a claimed result — plus an optional honest status chip ("untested hypothesis",
   "measured on the live site", "design intent"). This is how a concept earns a
   credible goals→outcome arc without fabricating metrics. Same counter/accent/surface
   language as <Finding> and <DecisionCard>. ──────────────────────────────────── */
export function Goals({ children }: { children?: React.ReactNode }) {
  return (
    <StaggerGroup
      as="ol"
      stagger={0.08}
      className="cs-wide my-space-8 grid list-none gap-space-5 [counter-reset:goal]"
    >
      {children}
    </StaggerGroup>
  );
}

export function Goal({
  goal,
  signal,
  status,
}: {
  goal?: string;
  signal?: string;
  status?: string;
}) {
  return (
    <li className="grid gap-space-4 rounded-none border-t-2 border-[color:color-mix(in_srgb,var(--accent)_30%,var(--line))] bg-[color:color-mix(in_srgb,var(--surface)_55%,transparent)] p-space-5 [counter-increment:goal] lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-space-6">
      <div>
        <span
          aria-hidden="true"
          className="font-mono text-caption tabular-nums text-accent before:content-[counter(goal,decimal-leading-zero)]"
        />
        {goal && (
          <p className="mt-space-2 font-display text-body-l font-medium leading-snug text-fg">
            {goal}
          </p>
        )}
      </div>
      {(signal || status) && (
        <div className="border-t border-line pt-space-4 lg:border-l lg:border-t-0 lg:pl-space-6 lg:pt-0">
          <span className="block font-mono text-caption uppercase tracking-[0.16em] text-accent">
            Success signal
          </span>
          {signal && <p className="mt-space-2 text-body text-muted">{signal}</p>}
          {status && (
            <span className="mt-space-3 inline-flex items-start gap-space-2 rounded-full border border-line px-space-3 py-space-1 font-mono text-caption uppercase tracking-[0.1em] text-muted">
              {/* items-start + a small nudge keeps the dot on the FIRST line when
                  the chip text wraps (centered, it floats between the lines). */}
              <span aria-hidden="true" className="mt-[0.4em] h-[5px] w-[5px] shrink-0 rounded-full bg-muted" />
              {status}
            </span>
          )}
        </div>
      )}
    </li>
  );
}


/* ── Margin ─ a marginalia note for the case-study right rail (lg+). Place it
   directly BEFORE the paragraph it annotates: the reading grid's dense flow
   sets it beside that paragraph in the rail. Below lg it renders as a quiet
   inline aside. The "research notebook" voice — mono label, caption text. ── */
export function Margin({ label = "Why", children }: { label?: string; children?: React.ReactNode }) {
  return (
    <aside className="cs-margin my-space-5 border-l border-line pl-space-4 lg:my-0 lg:border-l-0 lg:border-t lg:border-line lg:pl-0 lg:pt-space-3">
      <span className="block font-mono text-[0.625rem] uppercase tracking-[0.2em] text-accent">
        {label}
      </span>
      <div className="mt-space-2 text-caption leading-relaxed text-muted [&>p]:mb-0">
        {children}
      </div>
    </aside>
  );
}

/* ── Wide ─ spans the full reading grid (measure column + rail) for media or
   blocks that should break the measure deliberately. ───────────────────── */
export function Wide({ children }: { children?: React.ReactNode }) {
  return <div className="cs-wide">{children}</div>;
}

/* ── Bleed ─ the set-piece: a full-viewport colour-field band in the project
   accent, holding a display pull-quote or an oversized artifact. One or two
   per study — the moment the page stops being a column. ────────────────── */
export function Bleed({
  quote,
  attribution,
  children,
}: {
  /** Display pull-quote (the common case). */
  quote?: string;
  attribution?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="cs-wide">
      <Reveal
        as="div"
        className="cs-bleed relative isolate my-space-10 overflow-hidden py-space-10"
      >
        {/* Accent colour-field + hairline frame. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(90% 120% at 18% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 64%), radial-gradient(80% 100% at 88% 100%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 66%), color-mix(in srgb, var(--surface) 45%, transparent)",
          }}
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[color:color-mix(in_srgb,var(--accent)_35%,var(--line))]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[color:color-mix(in_srgb,var(--accent)_35%,var(--line))]" />
        <div className="mx-auto w-full max-w-[90rem] px-[clamp(1.25rem,5vw,6rem)]">
          {quote ? (
            <blockquote className="max-w-[24ch] font-display text-display-l leading-[1.1] tracking-[-0.01em] text-fg">
              {quote}
              {attribution && (
                <footer className="mt-space-5 font-mono text-caption uppercase tracking-[0.16em] text-muted">
                  {attribution}
                </footer>
              )}
            </blockquote>
          ) : (
            children
          )}
        </div>
      </Reveal>
    </div>
  );
}
