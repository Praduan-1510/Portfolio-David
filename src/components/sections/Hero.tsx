"use client";

import { Container, Button } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedNoise, Signature } from "@/components/motion";
import { HeroWordmark } from "@/components/sections/HeroWordmark";
import { HeroFlow } from "@/components/sections/HeroFlow";

/*
 * Home hero: the INSTRUMENT hero. No shader wallpaper, no centered template:
 * a type-led composition in the site's own departure-board / instrument
 * language (DESIGN_GUIDELINES §3 dark base, §7 motion).
 *
 *   - Split-screen cut at lg+: ALL content lives in the LEFT half of the
 *     frame; the cinematic reel's film owns the RIGHT half (the reel's sticky
 *     stage confines its film layer to the right of the 50vw seam). Below lg
 *     the content runs full width over the full-bleed film, as before.
 *   - The split-flap wordmark is the one big moment, left-aligned at display
 *     scale, settling into kerned type.
 *   - HUD readouts carry the instrument voice (the About hero's language),
 *     and the eyebrow speaks mono-caps like every other label.
 *   - Backdrop (left half at lg+): near-black, a faint blueprint dot grid,
 *     ONE quiet ember, film grain. Quiet, composed, unmistakably this site.
 *
 * Load choreography cascades top-to-bottom (eyebrow → boards → tagline →
 * subhead → CTAs), transform/opacity only (plus the tagline's heading blur,
 * cleared as it lands), tokens only, and fully reduced-motion safe (every
 * primitive renders settled/static).
 */

const SEQ = {
  tagline: 0.75,
  sub: 1.0,
  cta: 1.2,
} as const;

/** The tagline's split words and their stagger step. The gradient phrase that
 *  closes the line enters whole, as the step after the last of these. */
const TAGLINE = "Design that's clear, usable, and";
const TAGLINE_STEP = 0.05;

export function Hero() {
  // z-10 + transparent bg (no bg-bg): the cinematic reel's sticky stage sits
  // BENEATH this section (CinematicReel overlaps it with a negative margin), so
  // the live film shows through as the hero's backdrop from first paint while
  // the type + HUD keep painting above it. Body carries bg-bg behind both.
  return (
    <section
      id="top"
      data-theme="dark"
      aria-label="Introduction"
      className="relative isolate z-10 flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden text-fg [@media(max-height:600px)]:min-h-0"
    >
      {/* Backdrop: blueprint dot grid (the case-hero motif language) under one
          quiet ember. Both -z, both decorative; no WebGL on the LCP path.
          At lg+ (motion-safe) the WHOLE atmosphere set (grid + flow + grain)
          is hidden here and lives on the reel's LEFT PANEL instead: it must
          not scroll away with the hero, or the hero's bottom edge drags a
          visible shade-step across the panel during the handoff. */}
      <div
        aria-hidden="true"
        className="blueprint-dots absolute inset-0 -z-10 opacity-60 motion-safe:lg:hidden"
        style={{
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(120% 100% at 30% 40%, #000 0%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(120% 100% at 30% 40%, #000 0%, transparent 78%)",
        }}
      />
      <HeroFlow className="motion-safe:lg:hidden" />

      {/* Film grain: above the ember, below the content. */}
      <AnimatedNoise opacity={0.04} className="z-[1] motion-safe:lg:hidden" />

      {/* (The old bottom hand-off scrim is gone: the cinematic reel's film now
          runs continuously beneath this section and past its bottom edge: a
          fade-to-bg band here would cut a visible seam across the frames.) */}

      {/* Title-card composition: the wordmark + supporting rows anchor to the
          lower third, over the subject's dark jacket and the reel's bottom
          scrim, where white type actually reads; the space above is the
          film's. */}
      <Container className="relative z-10 flex flex-1 py-space-7 [@media(max-height:600px)]:py-space-5">
        {/* Left column (lg+): everything the hero says lives left of the 50vw
            seam: the film owns the right half. Container is centered, so a
            w-1/2 child ends exactly at the seam; pr-space-7 is the shared
            inset off it (the reel's board uses the same). Below lg this is
            simply the old full-width column. */}
        <div className="flex w-full flex-col justify-end short-land:justify-start motion-safe:lg:w-1/2 motion-safe:lg:pr-space-7">

        {/* Lower-third block: wordmark + supporting row travel together so the
            justify-between spacer above them keeps the film's subject clear. */}
        <div className="mt-space-6 short-land:mt-space-4">
          <h1 className="sr-only">
            Praduan Saha: product designer and front-end designer
          </h1>
          <HeroWordmark />

        {/* Supporting row: statement + subhead, then CTAs. Single column at
            lg too: the split's ~half-width column can't seat a 26ch heading
            beside two lg buttons (short-land keeps its own two-col shape). */}
        <div className="mt-space-5 grid items-end gap-x-space-9 gap-y-space-5 short-land:mt-space-5 short-land:grid-cols-[minmax(0,1fr)_auto] short-land:items-start short-land:gap-x-space-5 lg:mt-space-6">
          <div className="min-w-0">
            {/* Tagline: one word-by-word blur-in. The closing phrase carries the
                one sanctioned colour moment (.text-spectrum), clipped to a
                gradient, so it blurs in whole as the stagger's last step and
                lands last. */}
            <p className="max-w-[26ch] font-display text-heading text-fg">
              <TextReveal
                as="span"
                by="words"
                trigger="load"
                delay={SEQ.tagline}
                stagger={TAGLINE_STEP}
              >
                {TAGLINE}
              </TextReveal>{" "}
              <Reveal
                as="span"
                blur
                trigger="load"
                delay={SEQ.tagline + TAGLINE.split(" ").length * TAGLINE_STEP}
                className="text-spectrum inline-block"
              >
                {"unmistakably yours."}
              </Reveal>
            </p>
            {/* Subhead. The old text closed up a comma ("front-end,working")
                to stop a spaced em-dash starting a line: SplitText tokenizes on
                \s+ (which matches U+00A0, so an NBSP is no defence) and a
                free-standing dash becomes its own token. A comma needs none of
                that — it binds to the word before it and can never open a line,
                so the space belongs back. Colons here for the same reason. */}
            <TextReveal
              as="p"
              by="lines"
              effect="mask"
              trigger="load"
              delay={SEQ.sub}
              className="mt-space-3 max-w-[48ch] font-sans text-body text-muted lg:mt-space-4 lg:max-w-[58ch] lg:text-body-l"
            >
              {"I'm Praduan Saha, a product designer who also ships front-end, working since 2019, now inside a B2B AI go-to-market product. I work on operational software: ledgers, consoles and multi-tenant tools, where trust, state and permissions are the hard part."}
            </TextReveal>
            {/* The signature: the hand-signed counter-mark to the machine-set
                split-flap wordmark; writes itself in after the subhead. Sized
                by font-size (it's real script type now, not a fixed-width SVG). */}
            <Signature
              delay={SEQ.sub + 0.45}
              className="mt-space-5 text-[2.75rem] text-fg opacity-90 [filter:drop-shadow(0_2px_10px_rgba(0,0,0,0.65))] sm:text-[3rem] [@media(max-height:600px)]:hidden"
            />
          </div>

          {/* data-chrome-yield: while these CTAs hold the bottom edge (a phone's
              first screen), the dock and the bottom fade stay out of the way
              (hooks/useChromeYield). */}
          <div
            data-chrome-yield
            className="flex w-full flex-col items-stretch gap-space-3 sm:w-auto sm:flex-row sm:items-center sm:gap-space-4"
          >
            <Reveal as="div" trigger="load" delay={SEQ.cta} className="w-full sm:w-auto">
              <Button
                href="/work"
                variant="invert"
                size="lg"
                arrow="right"
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
              >
                Get in touch
              </Button>
            </Reveal>
          </div>
        </div>
        </div>
        </div>
      </Container>
    </section>
  );
}
