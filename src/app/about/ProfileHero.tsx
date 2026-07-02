"use client";

import { Container, Text, Eyebrow, Button } from "@/components/primitives";
import { Reveal, TextReveal, Magnetic, AuroraEmber } from "@/components/motion";
import { useKolkataClock } from "@/hooks/useKolkataClock";
import { AboutHeroMap } from "./AboutHeroMap";

/*
 * About hero — the whole section is the instrument now: a full-bleed bespoke
 * "motion map" (HeroMap) under a reading scrim, with the profile statement on the
 * left and a HUD of mono readouts framing the corners (STATUS / BASED / LOCAL·IST
 * clock / DESIGNING SINCE) plus a quiet PS station mark. Dark-monochrome, hairline
 * borders, sharp corners (radius 0). The map is decorative (aria-hidden inside
 * HeroMap); every fact here is readable text. Reduced-motion + perf are handled in
 * HeroMap; the clock is plain text either way.
 */

const HEADLINE = "Turning complex problems into clean, usable products.";
const SUPPORT =
  "Product designer & front-end developer based in Kolkata — from systems thinking through to precise execution.";


function Readout({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-[2px] ${className}`}>
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">{label}</span>
      <span className="font-mono text-caption uppercase tracking-[0.1em] text-fg">{children}</span>
    </div>
  );
}

export function ProfileHero() {
  const clock = useKolkataClock();

  return (
    <section
      data-theme="dark"
      aria-label="About — profile"
      className="relative isolate overflow-hidden bg-bg text-fg"
      // Floor at 26rem (not 34rem) so the clamp can actually shrink on short
      // landscape phones (82svh < 34rem there) instead of forcing a tall band;
      // taller screens are unaffected (82svh wins).
      style={{ minHeight: "clamp(26rem, 82svh, 50rem)" }}
    >
      {/* Layer 0 — full-bleed styled map texture: a static map screenshot inverted
          to a dark near-black schematic (see AboutHeroMap). Lazy, aria-hidden +
          pointer-events-none, dimmed + left-scrimmed so the headline/HUD stay
          legible, with the shared drift; reduced-motion-safe. No API key needed. */}
      <AboutHeroMap />

      {/* Spectrum ember on the map horizon — the home aurora's coal carried to
          this route, so the grayscale HUD map stops reading as a different site. */}
      <AuroraEmber hues={["violet", "blue"]} position="top-right" intensity={0.14} className="z-[1]" />

      {/* Layer 10 — content. */}
      <Container className="relative z-10 flex min-h-[inherit] items-center py-space-9">
        <div className="max-w-[40rem]">
          <Reveal as="div" trigger="load" y={12}>
            <Eyebrow>
              <span className="mr-space-2 font-mono text-muted">00</span>
              About — Profile
            </Eyebrow>
          </Reveal>
          <TextReveal
            as="h1"
            by="lines"
            trigger="inView"
            className="mt-space-4 max-w-[18ch] font-display text-display-l"
          >
            {HEADLINE}
          </TextReveal>
          <Reveal trigger="inView" delay={0.3} className="mt-space-5">
            <Text variant="body-l" className="max-w-[44ch] text-muted">
              {SUPPORT}
            </Text>
          </Reveal>
          {/* The corner instrument-HUD is md+ only, so surface the live status +
              location inline on phones (where it would otherwise be lost). */}
          <Reveal trigger="inView" delay={0.36}>
            <p className="mt-space-5 inline-flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.14em] text-muted md:hidden">
              <span
                aria-hidden="true"
                className="inline-block h-[7px] w-[7px] rounded-full bg-neon motion-safe:animate-status-pulse"
              />
              Available · Kolkata, IN
            </p>
          </Reveal>
          <Reveal
            as="div"
            trigger="inView"
            delay={0.42}
            className="mt-space-7 flex flex-wrap items-center gap-space-4"
          >
            <Magnetic className="inline-block">
              <Button href="/contact" variant="primary">
                Get in touch
              </Button>
            </Magnetic>
            <Magnetic className="inline-block">
              <Button href="/work" variant="secondary">
                View work
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </Container>

      {/* HUD readouts — frame the hero like an instrument (md+ to avoid mobile clutter). */}
      <div className="absolute right-space-6 top-space-6 z-10 hidden flex-col items-end gap-space-4 text-right md:flex">
        <Readout label="Status" className="items-end">
          <span className="inline-flex items-center gap-space-2">
            <span aria-hidden="true" className="inline-block h-[7px] w-[7px] rounded-full bg-neon motion-safe:animate-status-pulse" />
            Available
          </span>
        </Readout>
        <Readout label="Based" className="items-end">
          <span>Kolkata, IN</span>
        </Readout>
      </div>

      <Readout label="Local · IST" className="absolute bottom-space-6 left-space-6 z-10 hidden md:flex">
        <span suppressHydrationWarning className="tabular-nums">
          {clock ?? "––:––:––"}
        </span>
      </Readout>

      <Readout label="Designing since" className="absolute bottom-space-6 right-space-6 z-10 hidden items-end text-right md:flex">
        <span>2019</span>
      </Readout>

      {/* Quiet station mark. */}
      <div className="pointer-events-none absolute bottom-space-6 left-1/2 z-10 hidden -translate-x-1/2 text-center leading-none md:block">
        <span className="font-display text-[1.1rem] font-semibold tracking-[-0.03em] text-fg opacity-60">PS</span>
        <span className="mt-[3px] block font-mono text-[0.5rem] uppercase tracking-[0.34em] text-muted">
          Praduan&nbsp;Saha
        </span>
      </div>

      {/* Corner crosshair ticks — instrument frame. */}
      {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`pointer-events-none absolute z-10 ${pos} m-space-4 h-space-3 w-space-3`}
          style={{
            borderTop: pos.includes("top") ? "1px solid var(--line)" : undefined,
            borderBottom: pos.includes("bottom") ? "1px solid var(--line)" : undefined,
            borderLeft: pos.includes("left") ? "1px solid var(--line)" : undefined,
            borderRight: pos.includes("right") ? "1px solid var(--line)" : undefined,
          }}
        />
      ))}
    </section>
  );
}
