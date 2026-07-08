import { Container, Button, Link } from "@/components/primitives";
import { ProjectCard } from "@/components/work/ProjectCard";
import { Hero } from "@/components/sections/Hero";
import { HomeAtmosphere } from "@/components/sections/HomeAtmosphere";
import { CinematicReel } from "@/components/sections/reel/CinematicReel";
import { SideNav } from "@/components/layout/SideNav";
import {
  Reveal,
  StaggerGroup,
  TextReveal,
  AnimatedDivider,
  Magnetic,
  FlapText,
} from "@/components/motion";
import { getFeaturedProjectsMeta } from "@/lib/content/work";

/*
 * Home (ARCHITECTURE.md §6): the scroll BUILDS instead of decaying — hero, then
 * the cinematic reel (a scroll-scrubbed film clip that starts with the first
 * scroll tick and carries the "Currently" departure board, its rows synced to
 * the frames), then the proof (work grid), the about teaser, and the closing
 * CTA. The tools marquee moved to /about (a junior-portfolio trope this close
 * to an "extremely high-end" hero); every section stays choreographed with the
 * shared motion primitives, reduced-motion-safe, transform/opacity only.
 */
export default function Home() {
  // Three features on home — /work carries the full inventory, so "All work"
  // genuinely adds something instead of duplicating this grid.
  const featured = getFeaturedProjectsMeta().slice(0, 3);

  return (
    <>
      {/* Desktop-only section rail — complements the top <Nav>; scrolls to the
          in-page section ids below (#top is on the Hero). Hidden on mobile. */}
      <SideNav />

      {/* Hero — primary signature, orchestrated load sequence. id="top". */}
      <Hero />

      {/* Cinematic reel + "Currently" board — the second beat. The section
          overlaps the hero (negative top margin), so the clip crossfades in
          OVER the departing hero type from the very first scroll tick, holds
          while the board rows flutter in (synced to the frames), then dims
          back into the page. Sits OUTSIDE the atmosphere wrapper so the
          wrapper's decorative pools never paint over the hero. */}
      <CinematicReel />

      {/* Below-hero atmosphere wrapper. The home base is near-black; left flat it
          reads as empty voids between sections. This `relative isolate` shell
          carries restrained depth behind ALL the content below the hero — faint,
          widely-spaced radial pools that lift the dark near each beat, plus a
          whisper of film grain — so the dark feels composed and intentional, not
          unlit. Decorative layers are aria-hidden, pointer-events none, and sit
          at -z so they never intercept the content above. */}
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 36% at 82% 12%, color-mix(in srgb, var(--fg) 5%, transparent) 0%, transparent 70%), radial-gradient(54% 32% at 12% 52%, color-mix(in srgb, var(--fg) 4%, transparent) 0%, transparent 72%), radial-gradient(70% 40% at 70% 92%, color-mix(in srgb, var(--fg) 5%, transparent) 0%, transparent 70%)",
          }}
        />
        <HomeAtmosphere />

      {/* Selected work — proof right after the reel. */}
      <Container as="section" id="work" className="scroll-mt-16 py-space-9">
        <div className="mb-space-7 flex items-end justify-between gap-space-4">
          <div>
            <TextReveal
              as="h2"
              by="words"
              className="font-display text-display-l"
            >
              Recent projects
            </TextReveal>
          </div>
          <Reveal delay={0.1} className="shrink-0">
            <Link href="/work" className="inline-flex min-h-[44px] items-center">All work</Link>
          </Reveal>
        </div>
        {/* 2-up grid; if the count is odd, the trailing project becomes a
            full-width feature row (spanning both columns) so the grid never
            leaves an empty cell. StaggerGroup animates its direct children —
            the <article>s — so the entrance choreography is unchanged. */}
        <StaggerGroup
          as="div"
          stagger={0.1}
          className="grid grid-cols-1 gap-space-8 md:grid-cols-2"
        >
          {featured.map((project, i) => {
            const isTrailingOdd =
              i === featured.length - 1 && featured.length % 2 === 1;
            return (
              <div key={project.slug} className={isTrailingOdd ? "md:col-span-2" : undefined}>
                <ProjectCard
                  project={project}
                  layout={isTrailingOdd ? "wide" : "default"}
                />
              </div>
            );
          })}
        </StaggerGroup>
      </Container>

      <Container>
        <AnimatedDivider spectrum />
      </Container>

      {/* About teaser — a quiet, type-led editorial beat. The portrait that
          used to hold the right column moved on: the hero now opens the page
          with a full-viewport film of the same face, and a second portrait
          here read as a repeated note. The statement carries the beat alone at
          display scale; one mono-caps instrument line + the link sign it off.
          (The portrait + PortraitFrame still live on /about.) */}
      <Container as="section" id="about" className="scroll-mt-16 py-space-9">
        <TextReveal
          as="h2"
          by="words"
          className="max-w-[24ch] font-display text-display-l sm:text-display-xl"
        >
          I design the interface, then write the front-end that ships it.
        </TextReveal>
        <div className="mt-space-7 flex flex-wrap items-baseline justify-between gap-x-space-6 gap-y-space-4">
          <Reveal delay={0.1} as="p" className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
            <FlapText text="DESIGN → BUILD · ONE PAIR OF HANDS" trigger="inView" flips={3} />
          </Reveal>
          <Reveal delay={0.18}>
            <Link href="/about" className="inline-flex min-h-[44px] items-center">
              More about me
            </Link>
          </Reveal>
        </div>
      </Container>

      {/* Contact CTA — a framed panel with real depth: a layered radial glow from
          the top-left, a faint hairline grid, a top accent edge, and an eyebrow +
          oversized headline so the closing beat has presence instead of reading as
          a flat surface. The Magnetic "Get in touch" button is preserved. */}
      <Container as="section" id="contact" className="scroll-mt-16 py-space-9">
        <Reveal>
          <div className="card-neon relative isolate overflow-hidden rounded-[3px] border border-line bg-surface p-space-6 sm:p-space-8 md:p-space-9">
            {/* Top accent hairline — the spectrum lit across the crown of the
                panel (faded ends), so the closing CTA carries the same signal as
                the hero and footer. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: "var(--spectrum-gradient)",
                opacity: 0.6,
                maskImage:
                  "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)",
              }}
            />
            {/* Layered radial glow — a soft pool of light in the upper-left so the
                panel reads as lit, not flat. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(90% 120% at 8% 0%, color-mix(in srgb, var(--fg) 8%, transparent) 0%, transparent 55%)",
              }}
            />
            {/* Faint hairline grid — instrument texture, barely-there. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 opacity-[0.5]"
              style={{
                backgroundImage:
                  "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                backgroundSize: "3.5rem 3.5rem",
                maskImage:
                  "radial-gradient(120% 120% at 100% 100%, #000 0%, transparent 70%)",
                WebkitMaskImage:
                  "radial-gradient(120% 120% at 100% 100%, #000 0%, transparent 70%)",
              }}
            />
            <TextReveal
              as="h2"
              by="words"
              className="max-w-[18ch] font-display text-display-l sm:text-display-xl"
            >
              {"Let's build something worth remembering."}
            </TextReveal>
            <Magnetic className="mt-space-7">
              <Button href="/contact" variant="primary" size="lg">
                Get in touch
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </Container>
      </div>
    </>
  );
}
