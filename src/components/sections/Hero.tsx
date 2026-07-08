"use client";

import { durations } from "@/lib/motion/durations";
import { Container, Button } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedNoise } from "@/components/motion";
import { HeroWordmark } from "@/components/sections/HeroWordmark";
import { HeroFlow } from "@/components/sections/HeroFlow";

/*
 * Home hero — the INSTRUMENT hero. No shader wallpaper, no centered template:
 * a type-led, asymmetric composition in the site's own departure-board /
 * instrument language (DESIGN_GUIDELINES §3 dark base, §7 motion).
 *
 *   - The stacked split-flap wordmark (PRADUAN / SAHA) is the one big moment,
 *     left-aligned at display scale, settling into kerned type.
 *   - The signal trace on SAHA's baseline is the one living element: a thin
 *     line whose gradient IS the four project accents, ticked 01–04 — the
 *     spectrum literally built from the work, foreshadowing the grid below.
 *   - HUD readouts carry the instrument voice (the About hero's language),
 *     and the eyebrow finally speaks mono-caps like every other label.
 *   - Backdrop: near-black, a faint blueprint dot grid, ONE quiet ember, film
 *     grain. Quiet, composed, and unmistakably this site.
 *
 * Load choreography cascades top-to-bottom (eyebrow → boards → trace →
 * tagline → subhead → CTAs → scroll row), transform/opacity only, tokens only,
 * and fully reduced-motion safe (every primitive renders settled/static).
 */

const SEQ = {
  badge: 0.1,
  tagline: 0.75,
  sub: 1.0,
  cta: 1.2,
} as const;

export function Hero() {
  return (
    <section
      id="top"
      data-theme="dark"
      aria-label="Introduction"
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-bg text-fg [@media(max-height:600px)]:min-h-0"
    >
      {/* Backdrop — blueprint dot grid (the case-hero motif language) under one
          quiet ember. Both -z, both decorative; no WebGL on the LCP path. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: "radial-gradient(currentColor 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
          color: "rgba(255,255,255,0.045)",
          maskImage:
            "radial-gradient(120% 100% at 30% 40%, #000 0%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(120% 100% at 30% 40%, #000 0%, transparent 78%)",
        }}
      />
      <HeroFlow />

      {/* Film grain — above the ember, below the content. */}
      <AnimatedNoise opacity={0.04} className="z-[1]" />

      {/* Bottom hand-off scrim into the near-black section below. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[2] h-24"
        style={{
          background:
            "linear-gradient(to top, var(--bg) 0%, transparent 100%)",
        }}
      />

      <Container className="relative z-10 flex flex-1 flex-col justify-center py-space-7 [@media(max-height:600px)]:py-space-5 short-land:justify-start">
        {/* Top row — mono-caps eyebrow left (the one label that used to break
            the site's label voice), HUD status readout right. */}
        <Reveal
          as="div"
          trigger="load"
          delay={SEQ.badge}
          duration={durations.base}
          className="flex items-start justify-between gap-space-6"
        >
          <span className="inline-flex items-center gap-space-3 font-mono text-caption uppercase tracking-[0.18em] text-muted">
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] rounded-full bg-neon motion-safe:animate-status-pulse"
            />
            {/* One wrapping label (not sibling flex items) so at 320 it breaks
                cleanly to "Product Designer ·" / "Front-End" instead of orphaning
                "End" or floating the second word to the right. */}
            <span>
              Product Designer ·{" "}
              <span className="whitespace-nowrap">Front-End</span>
            </span>
          </span>
          <span className="hidden flex-col items-end gap-[2px] md:flex">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
              Status
            </span>
            <span className="font-mono text-caption uppercase tracking-[0.1em] text-fg">
              Available
            </span>
          </span>
        </Reveal>

        {/* The wordmark — stacked boards + the signal trace. */}
        <div className="mt-space-6 short-land:mt-space-4">
          <h1 className="sr-only">
            Praduan Saha — product designer and front-end developer
          </h1>
          <HeroWordmark />
        </div>

        {/* Supporting row — statement + subhead left, CTAs anchored right. */}
        <div className="mt-space-7 grid items-end gap-x-space-9 gap-y-space-6 short-land:mt-space-5 short-land:grid-cols-[minmax(0,1fr)_auto] short-land:items-start short-land:gap-x-space-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            {/* Tagline — word-by-word rise; the closing phrase carries the one
                sanctioned colour moment (.text-spectrum) and lands last. */}
            <p className="max-w-[26ch] font-display text-heading text-fg">
              <TextReveal
                as="span"
                by="words"
                trigger="load"
                delay={SEQ.tagline}
                stagger={0.05}
              >
                {"Design that's clear, usable, and"}
              </TextReveal>{" "}
              <Reveal
                as="span"
                trigger="load"
                delay={SEQ.tagline + 0.18}
                y={16}
                className="text-spectrum inline-block"
              >
                {"unmistakably yours."}
              </Reveal>
            </p>
            {/* Subhead — the dash is bound to "front-end" so it can never open
                a line (the rag foul the review caught). */}
            <TextReveal
              as="p"
              by="lines"
              trigger="load"
              delay={SEQ.sub}
              className="mt-space-4 max-w-[58ch] font-sans text-body-l text-muted"
            >
              {"I'm Praduan Saha, a product designer who also ships front-end — working since 2019, now inside a B2B AI go-to-market product. I turn complex, data-heavy ideas into clean interfaces and the systems that hold them together."}
            </TextReveal>
          </div>

          <div className="flex w-full flex-col items-stretch gap-space-3 sm:w-auto sm:flex-row sm:items-center sm:gap-space-4">
            <Reveal as="div" trigger="load" delay={SEQ.cta} className="w-full sm:w-auto">
              <Button
                href="/work"
                variant="invert"
                size="lg"
                className="w-full shadow-[0_14px_40px_-16px_rgba(0,0,0,0.7)] sm:w-auto"
              >
                View work
              </Button>
            </Reveal>
            <Reveal
              as="div"
              trigger="load"
              delay={SEQ.cta + 0.12}
              className="w-full sm:w-auto"
            >
              <Button
                href="/contact"
                variant="secondary"
                size="lg"
                className="w-full bg-white/[0.04] hover:bg-white/[0.07] sm:w-auto"
              >
                Get in touch
              </Button>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
