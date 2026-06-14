import { Container, Text, Eyebrow, Button } from "@/components/primitives";
import {
  Reveal,
  StaggerGroup,
  AnimatedNoise,
  SplitFlapText,
  SplitFlapAudioProvider,
  SplitFlapMuteToggle,
} from "@/components/motion";

/*
 * Custom 404. Renders inside the root layout (Nav/Footer/main), so unknown URLs
 * — including unknown /work/[slug] (dynamicParams=false) — stay on-brand and
 * navigable rather than dropping to the framework's bare default.
 *
 * Composition (DESIGN_GUIDELINES.md §3/§6): a viewport-tall, centered statement
 * that FILLS the space instead of clustering top-left. The memorable beat is a
 * giant split-flap "404" — a departure-board destination that never arrived —
 * flipping through the charset on load before it settles, with the eyebrow above
 * and copy + balanced links beneath, all on one centered axis.
 *
 * Atmosphere (§4/§7.8): a soft off-white radial vignette behind the board plus
 * AnimatedNoise grain give the near-black depth, never flat. Colour stays
 * monochrome — data-theme="dark" only marks the dark surface (the split-flap's
 * transient flip-accent resolves to --accent = off-white here), so the chrome
 * stays colourless (§4).
 *
 * Reduced motion / no-JS (§10): the split-flap settles instantly with no audio,
 * the Reveal/StaggerGroup primitives render their content static and fully
 * visible, and nothing is trapped behind an animation — a clean, complete page.
 */
export default function NotFound() {
  return (
    <SplitFlapAudioProvider>
      <section
        data-theme="dark"
        aria-labelledby="notfound-heading"
        className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-bg text-fg"
      >
        {/* Layer 0 — atmosphere: a soft monochrome glow centered behind the board
            so the dark reads as depth, not a flat void. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 42%, rgba(255,255,255,0.06), transparent 70%)",
          }}
        />
        {/* Layer 1 — faint film grain over the glow, beneath the content. */}
        <AnimatedNoise opacity={0.035} className="-z-10" />

        {/* Centered stack — eyebrow → split-flap 404 → copy + links. */}
        <Container className="relative z-10 flex flex-1 flex-col items-center justify-center py-space-9 text-center">
          {/* Real heading for assistive tech / SEO; the board itself is decorative
              (SplitFlapText announces "404" sr-only and marks the flaps aria-hidden). */}
          <h1 id="notfound-heading" className="sr-only">
            404 — this page doesn&apos;t exist
          </h1>

          <Reveal as="div" y={12} trigger="load">
            <Eyebrow>Error 404</Eyebrow>
          </Reveal>

          {/* Signature beat — departure-board "404": flips through the charset on
              load, then settles. Reduced motion shows it settled instantly. */}
          <div className="mt-space-6">
            <SplitFlapText
              text="404"
              fontSize="clamp(4rem, 18vw, 12rem)"
              className="font-semibold text-fg"
            />
          </div>

          <StaggerGroup
            className="mt-space-7 flex flex-col items-center"
            trigger="load"
            delay={0.35}
            stagger={0.08}
          >
            <Text variant="body-l" className="max-w-[44ch] text-muted">
              {"This page may have moved or never existed. Let's get you back on course."}
            </Text>
            <div className="mt-space-7 flex flex-wrap items-center justify-center gap-space-4">
              <Button href="/" variant="invert" shape="pill" size="lg" className="hover:-translate-y-px">
                Back home
              </Button>
              <Button
                href="/work"
                variant="secondary"
                shape="pill"
                size="lg"
                className="hover:-translate-y-px hover:bg-surface"
              >
                View work
              </Button>
            </div>
          </StaggerGroup>
        </Container>

        {/* Split-flap sound toggle — muted by default with an accessible label
            (no autoplaying audio, §13). Tucked bottom-right, out of the axis. */}
        <Container className="relative z-10">
          <div className="flex justify-end pb-space-5">
            <SplitFlapMuteToggle />
          </div>
        </Container>
      </section>
    </SplitFlapAudioProvider>
  );
}
