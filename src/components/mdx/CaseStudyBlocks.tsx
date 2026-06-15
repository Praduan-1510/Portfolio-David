import type React from "react";
import { PhoneFrame } from "@/components/primitives";
import { Reveal, StaggerGroup, Parallax } from "@/components/motion";
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
    <figure className="my-space-9 grid items-center gap-space-6 sm:grid-cols-[14rem_1fr] sm:gap-space-8">
      <Reveal className={cn("mx-auto w-full max-w-[14rem]", side === "right" && "sm:order-2")}>
        <Parallax speed={0.05}>
          <PhoneFrame src={src} alt={alt ?? caption ?? "App screen"} sizes="14rem" imgClassName="object-top" />
        </Parallax>
      </Reveal>
      {(label || caption) && (
        <Reveal delay={0.08} className={cn(side === "right" && "sm:order-1 sm:text-right")}>
          <figcaption>
            {label && (
              <span className="mb-space-2 block font-mono text-caption uppercase tracking-[0.18em] text-accent">
                {label}
              </span>
            )}
            {caption && (
              <span className={cn("block max-w-[40ch] text-body-l text-fg", side === "right" && "sm:ml-auto")}>
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
      className="my-space-8 grid list-none grid-cols-1 gap-space-5 [counter-reset:decision] sm:grid-cols-2"
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
      <div className="mt-space-2 text-body text-muted [&>p:last-child]:mb-0">{children}</div>
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
      className="my-space-8 grid grid-cols-1 gap-space-5 sm:grid-cols-3"
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
      className="my-space-8 grid grid-cols-2 gap-x-space-6 gap-y-space-6 sm:grid-cols-4"
    >
      {children}
    </StaggerGroup>
  );
}

export function Stat({ value, label }: { value?: string; label?: string }) {
  return (
    <div className="flex flex-col-reverse gap-space-2 border-t border-line pt-space-4">
      <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="font-display text-display-l leading-none text-accent">{value}</dd>
    </div>
  );
}
