"use client";

import { durations } from "@/lib/motion/durations";
import { Container, Button } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedNoise } from "@/components/motion";
import { HeroBackground } from "@/components/sections/hero-canvas/HeroBackground";
import { HeroWordmark } from "@/components/sections/HeroWordmark";

/*
 * Home hero — the orchestrated load sequence (DESIGN_GUIDELINES.md §3 dark base,
 * §7 motion). Dark, monochrome, near-black; the dark-instrument flavor is scoped
 * here via data-theme="dark" (a semantic-token remap) so it doesn't darken the
 * rest of the site. Layer 0 is a lazy, isolated WebGL smoke/liquid backdrop
 * (ARCHITECTURE.md §7.6) with a static grayscale fallback; layer 1 is a faint
 * animated film grain (AnimatedNoise) over it, beneath the content.
 *
 * The load is choreographed top-to-bottom — badge → split-flap wordmark → tagline
 * → subhead → buttons → scroll row. The wordmark (SplitFlapText) is the focal
 * moment and runs its own staggered flip entrance; the supporting beats use Reveal
 * on ease-out-expo, staggered ~80ms. Transform/opacity only → 60fps. Fully
 * reduced-motion safe: every primitive renders its content static, the split-flap
 * settles instantly with no audio, and the ambient loops below are gated off.
 */

// Choreography delays (seconds). The split-flap wordmark is the focal moment and
// runs its own staggered entrance (no SEQ delay); the supporting beats now reveal
// KINETICALLY too — the tagline rises word-by-word, the subhead line-by-line, and
// the CTAs enter in sequence — so the whole stack animates in like the wordmark
// rather than just fading. The delays cascade top-to-bottom (badge → tagline →
// subhead → CTAs → scroll) while the wordmark keeps flipping underneath.
const SEQ = {
  badge: 0.1,
  tagline: 0.45,
  sub: 0.72,
  cta: 0.98,
  scroll: 1.18,
} as const;

export function Hero() {
  return (
    <section
      id="top"
      data-theme="dark"
      aria-label="Introduction"
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-bg text-fg [@media(max-height:600px)]:min-h-0"
    >
      {/* Layer 0 — WebGL smoke/liquid backdrop: lazy, isolated, reduced-motion
          safe (ARCHITECTURE.md §7.6). Never blocks first paint, pauses offscreen/
          tab-hidden, and degrades to a static grayscale gradient on reduced
          motion, low power, or no WebGL. bg-bg is the near-black base beneath. */}
      <div id="hero-canvas" aria-hidden="true" className="absolute inset-0 z-0 bg-bg">
        <HeroBackground />
      </div>

      {/* Layer 2 — reading scrim between the WebGL (z-0) and the content (z-10):
          ONE gentle pass now — the shader's settled composition owns the focal
          void (uSettle carves it and lights its rim), so the CSS layer only adds
          a light reading assist behind the stack plus the outer corner vignette.
          A heavy CSS pool here would double-darken the shader's void. Decorative;
          its own layer, so first paint is unaffected. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(112% 84% at 50% 46%, color-mix(in srgb, var(--bg) 62%, transparent) 0%, color-mix(in srgb, var(--bg) 34%, transparent) 34%, transparent 64%), radial-gradient(125% 125% at 50% 42%, transparent 58%, color-mix(in srgb, var(--bg) 42%, transparent) 100%)",
        }}
      />

      {/* Layer 1 — ambient film grain over the backdrop, beneath the content
          (z-[1] < content z-10). Low opacity, pointer-events none, and one static
          frame under reduced motion (see AnimatedNoise). */}
      <AnimatedNoise opacity={0.04} className="z-[1]" />

      {/* Bottom scrim — the centre reading scrim (Layer 2) fades to transparent
          before it reaches the lower edge, so the scroll-cue row would otherwise
          sit on the brightest, unscrimmed part of the aurora and wash out. A short
          dark gradient anchored to the bottom gives the row a footing and reads as
          a clean hand-off into the near-black section below. Decorative; z-[2] so
          it's above the WebGL (z-0) and below the content (z-10). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[2] h-32"
        style={{
          background:
            "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 72%, transparent) 40%, transparent 100%)",
        }}
      />

      {/* Centered stack — badge, headline, subhead, buttons. */}
      <Container className="relative z-10 flex flex-1 flex-col items-center justify-center py-space-9 text-center [@media(max-height:600px)]:py-space-5">
        <Reveal trigger="load" delay={SEQ.badge} duration={durations.base}>
          <span className="inline-flex items-center gap-space-2 rounded-full border border-white/10 bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] px-space-4 py-space-2 font-sans text-caption text-muted shadow-[0_4px_20px_-10px_rgba(0,0,0,0.7)] backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] rounded-full bg-neon motion-safe:animate-status-pulse"
            />
            Product Designer · Front-End
          </span>
        </Reveal>

        {/* Hero wordmark — split-flap (departure-board) reveal: SHORT + uppercase,
            the load's focal moment with its own staggered entrance. The flaps are
            decorative; the real page heading is sr-only for semantics/SEO.

            The default flaps paint an opaque per-tile background (so they read as
            departure-board cards). On the scrimmed WebGL field that reads as one
            heavy black slab, so once the flips have SETTLED we dissolve the tile
            fill and the centre seam — the letters then read as glyphs floating on
            the (now calm) backdrop, while the entrance still flips against solid
            tiles. The override + its timing live in HeroWordmark (the flaps are
            settled instantly under reduced motion, so the dissolve is too). */}
        <div className="mt-space-6">
          <h1 className="sr-only">Praduan Saha — product designer and front-end developer</h1>
          <HeroWordmark />
        </div>

        {/* Tagline — rises word-by-word behind a clip mask (the site's kinetic
            type primitive), so it arrives with the same energy as the wordmark.
            Split into two inline reveals so the closing phrase can carry the one
            sanctioned colour moment: "unmistakably yours" rises a beat LAST and in
            the signature spectrum gradient (.text-spectrum), landing as the
            punchline. The wordmark stays monochrome; colour still belongs to the
            work, earned here only by the line that literally means "your mark". */}
        <p className="mt-space-6 max-w-[20ch] font-display text-heading text-fg">
          <TextReveal
            as="span"
            by="words"
            trigger="load"
            delay={SEQ.tagline}
            stagger={0.05}
          >
            {"Design that's clear, usable, and"}
          </TextReveal>{" "}
          {/* The punchline rises as a single unit via Reveal (not TextReveal):
              background-clip:text only fills the element that directly holds the
              text, so the gradient must sit on the same element that gets the
              transform — SplitText's per-word inline-block wrappers would leave it
              transparent. inline-block so the y-rise applies (transforms are
              ignored on display:inline); it fits within max-w-[20ch] so it can't
              overflow. */}
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

        {/* Subhead — masked line-by-line rise (lines, not words, so a paragraph
            stays comfortable to read while still entering dynamically). */}
        <TextReveal
          as="p"
          by="lines"
          trigger="load"
          delay={SEQ.sub}
          className="mt-space-5 max-w-[48ch] font-sans text-body-l text-muted"
        >
          {"I'm Praduan Saha, a product designer who also ships front-end — working since 2019, now inside a B2B AI go-to-market product. I turn complex, data-heavy ideas into clean interfaces and the systems that hold them together."}
        </TextReveal>

        {/* CTAs — each button rises in on its own Reveal (load-triggered), so they
            enter in sequence after the text. Per-button Reveal (animating each
            wrapper) is used rather than a child-staggered group, which left the
            anchors stuck at their start opacity here. The outer flex div is the
            unanimated layout container. */}
        <div className="mt-space-7 flex w-full flex-col items-stretch gap-space-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-space-4">
          <Reveal as="div" trigger="load" delay={SEQ.cta} className="w-full sm:w-auto">
            <Button
              href="/work"
              variant="invert"
              size="lg"
              className="w-full shadow-[0_14px_40px_-16px_rgba(0,0,0,0.7)] hover:-translate-y-px sm:w-auto"
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
              className="w-full bg-white/[0.04] backdrop-blur-md hover:-translate-y-px hover:bg-white/[0.07] sm:w-auto"
            >
              Get in touch
            </Button>
          </Reveal>
        </div>
      </Container>

      {/* Scroll-indicator row. Labels flank a full-width hairline. */}
      <Container className="relative z-10">
        <Reveal
          as="div"
          trigger="load"
          delay={SEQ.scroll}
          duration={durations.base}
          className="flex flex-col gap-space-3 pb-space-5 pt-space-3"
        >
          <div className="flex items-center gap-space-4 font-mono text-caption uppercase tracking-[0.14em] text-white/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
            <span className="shrink-0">Scroll</span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            <span className="shrink-0">to see work</span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
