import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { FlapText } from "@/components/motion";
import type { Testimonial } from "@/lib/content/testimonials";

/*
 * Shared testimonial atoms, used by BOTH the homepage register and the
 * services-page wall.
 *
 * They live here rather than in either consumer for one reason: the provenance
 * stamp is the rule the whole feature exists to enforce, and a rule with two
 * implementations has one implementation and one place it will quietly drift.
 * Anything that renders a quote on this site renders it through these, so a
 * quote cannot appear anywhere without saying what backs it.
 *
 * No "use client" here on purpose. Nothing in this file takes a hook or a
 * handler, so it stays server-renderable — the services page pays no JS for its
 * testimonials — while the homepage's client register can import it unchanged.
 * (FlapText carries its own "use client", which is legal from either side.)
 */

/** Deterministic (locale- and timezone-independent) so SSR and client agree. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatReceived(iso: string): string {
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
export function ProvenanceStamp({
  t,
  className,
}: {
  t: Testimonial;
  className?: string;
}) {
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

/*
 * The portrait. `live` controls colour: greyscale at rest, full colour when the
 * record is the one being read. On a near-black page several colour photographs
 * at once pull harder than anything else in view, and the one that matters
 * stops being obvious — desaturating the rest turns that into the selection cue.
 *
 * `alt=""` throughout: the person's name sits beside the image in text, so
 * announcing it again would only make a screen reader say it twice.
 */
export function Portrait({
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
      <Image src={t.portrait} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

/** The hanging spectrum quote mark. Absolute, never a float: a float shortens
 *  the line boxes GSAP's SplitText has already measured, which wraps the first
 *  lines wrong on re-split. */
export function QuoteMark({ className }: { className?: string }) {
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
export function Byline({ t, className }: { t: Testimonial; className?: string }) {
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
