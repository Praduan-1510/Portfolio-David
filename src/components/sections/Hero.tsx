"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { Container, Text, Button } from "@/components/primitives";
import {
  Reveal,
  AnimatedNoise,
  SplitFlapAudioProvider,
  SplitFlapMuteToggle,
} from "@/components/motion";
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
// runs its own staggered entrance (no SEQ delay); the supporting beats step ~80ms
// apart (within the §7.4 40–80ms band) and start once the wordmark is settling.
const SEQ = {
  badge: 0.1,
  tagline: 0.42,
  sub: 0.5,
  cta: 0.58,
  scroll: 0.66,
} as const;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const reduced = useReducedMotion();

  // Ambient loop: the mouse-scroll wheel dot drifts down and fades, on repeat —
  // a subtle "you can scroll" hint. Transform/opacity only; static under reduced
  // motion. Lives outside the load choreography (it's continuous, not a reveal).
  useGSAP(
    () => {
      registerGsap();
      const dot = dotRef.current;
      if (!dot || prefersReducedMotion()) return; // static dot
      gsap.to(dot, {
        y: 7,
        opacity: 0.2,
        duration: durations.slow,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: heroRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <SplitFlapAudioProvider>
    <section
      ref={heroRef}
      id="top"
      data-theme="dark"
      aria-label="Introduction"
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-bg text-fg"
    >
      {/* Layer 0 — WebGL smoke/liquid backdrop: lazy, isolated, reduced-motion
          safe (ARCHITECTURE.md §7.6). Never blocks first paint, pauses offscreen/
          tab-hidden, and degrades to a static grayscale gradient on reduced
          motion, low power, or no WebGL. bg-bg is the near-black base beneath. */}
      <div id="hero-canvas" aria-hidden="true" className="absolute inset-0 z-0 bg-bg">
        <HeroBackground />
      </div>

      {/* Layer 2 — reading scrim between the WebGL (z-0) and the content (z-10):
          pools the near-black base behind the centre stack and fades to transparent
          at the edges, so the marbled field reads as quiet atmosphere behind the
          type. Decorative; its own layer, so first paint is unaffected. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 44%, color-mix(in srgb, var(--bg) 88%, transparent) 0%, color-mix(in srgb, var(--bg) 62%, transparent) 34%, transparent 70%), radial-gradient(64% 52% at 50% 46%, var(--bg) 0%, color-mix(in srgb, var(--bg) 70%, transparent) 46%, transparent 78%)",
        }}
      />

      {/* Layer 1 — ambient film grain over the backdrop, beneath the content
          (z-[1] < content z-10). Low opacity, pointer-events none, and one static
          frame under reduced motion (see AnimatedNoise). */}
      <AnimatedNoise opacity={0.04} className="z-[1]" />

      {/* Centered stack — badge, headline, subhead, buttons. */}
      <Container className="relative z-10 flex flex-1 flex-col items-center justify-center py-space-9 text-center">
        <Reveal trigger="load" delay={SEQ.badge} duration={durations.base}>
          <span className="inline-flex items-center gap-space-2 rounded-full border border-line bg-surface px-space-4 py-space-2 font-sans text-caption text-muted">
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] rounded-full bg-neon motion-safe:animate-status-pulse"
            />
            UI/UX &amp; Graphic Designer
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
          <h1 className="sr-only">Praduan Saha — UI/UX and graphic designer</h1>
          <HeroWordmark />
        </div>

        <Reveal trigger="load" delay={SEQ.tagline} duration={durations.base}>
          <Text as="p" variant="heading" className="mt-space-6 max-w-[20ch] text-fg">
            {"Design that's clear, usable, and unmistakably yours."}
          </Text>
        </Reveal>

        <Reveal trigger="load" delay={SEQ.sub} duration={durations.base}>
          <Text variant="body-l" className="mt-space-5 max-w-[48ch] text-muted">
            {"I'm Praduan Saha, a UI/UX and graphic designer with 7+ years turning complex ideas into clean interfaces and cohesive visual systems — across web, mobile, and brand."}
          </Text>
        </Reveal>

        <Reveal
          trigger="load"
          delay={SEQ.cta}
          duration={durations.base}
          className="mt-space-7 flex flex-wrap items-center justify-center gap-space-4"
        >
          <Button
            href="/work"
            variant="invert"
            shape="pill"
            size="lg"
            className="hover:-translate-y-px"
          >
            View work
          </Button>
          <Button
            href="/contact"
            variant="secondary"
            shape="pill"
            size="lg"
            className="hover:-translate-y-px hover:bg-surface"
          >
            Get in touch
          </Button>
        </Reveal>
      </Container>

      {/* Scroll-indicator row + split-flap sound toggle (muted by default, with an
          accessible label). Labels flank a full-width hairline with a centered
          mouse-scroll icon. */}
      <Container className="relative z-10">
        <Reveal
          as="div"
          trigger="load"
          delay={SEQ.scroll}
          duration={durations.base}
          className="flex flex-col gap-space-3 pb-space-5 pt-space-3"
        >
          <div className="flex justify-end">
            <SplitFlapMuteToggle />
          </div>
          <div className="flex items-center gap-space-4 font-mono text-caption uppercase tracking-[0.18em] text-muted">
            <span className="shrink-0">Scroll</span>
            <span className="relative flex-1">
              <span aria-hidden="true" className="block h-px w-full bg-line" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg px-space-3">
                <svg
                  width="20"
                  height="32"
                  viewBox="0 0 20 32"
                  fill="none"
                  aria-hidden="true"
                  className="block text-muted"
                >
                  <rect
                    x="1"
                    y="1"
                    width="18"
                    height="30"
                    rx="9"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  />
                  <circle ref={dotRef} cx="10" cy="9" r="2" fill="currentColor" />
                </svg>
              </span>
            </span>
            <span className="shrink-0">to see work</span>
          </div>
        </Reveal>
      </Container>
    </section>
    </SplitFlapAudioProvider>
  );
}
