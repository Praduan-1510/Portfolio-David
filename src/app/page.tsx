import { Container, Eyebrow, Button, Link } from "@/components/primitives";
import { ProjectCard } from "@/components/work/ProjectCard";
import { Hero } from "@/components/sections/Hero";
import { HomeAtmosphere } from "@/components/sections/HomeAtmosphere";
import { SideNav } from "@/components/layout/SideNav";
import {
  LogoMarquee,
  Reveal,
  StaggerGroup,
  TextReveal,
  CountUp,
  AnimatedDivider,
  Magnetic,
} from "@/components/motion";
import { getFeaturedProjectsMeta, getAllProjectsMeta } from "@/lib/content/work";

/*
 * Home (ARCHITECTURE.md §6): orchestrated signature <Hero/> + a content-derived
 * stats strip, curated work teaser, about teaser, and contact CTA. Below the hero,
 * every section is choreographed with the shared motion primitives — kinetic
 * section headings (TextReveal), figures that tick up (CountUp), work cards that
 * enter in concert (StaggerGroup), magnetic CTA, and hairlines that draw between
 * sections — all reduced-motion-safe and transform/opacity only.
 */
export default function Home() {
  const featured = getFeaturedProjectsMeta();
  const all = getAllProjectsMeta();

  // Real, content-derived figures — nothing fabricated.
  const screenCount = all.reduce((n, p) => n + p.gallery.length, 0);
  const disciplineCount = new Set(all.flatMap((p) => p.services)).size;
  const stats = [
    { value: all.length, label: "case studies" },
    { value: screenCount, label: "screens designed" },
    { value: disciplineCount, label: "core disciplines" },
  ];

  return (
    <>
      {/* Desktop-only section rail — complements the top <Nav>; scrolls to the
          in-page section ids below (#top is on the Hero). Hidden on mobile. */}
      <SideNav />

      {/* Hero — primary signature, orchestrated load sequence. id="top". */}
      <Hero />

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

      {/* Tools — logo marquee (dark band, self-contained theme). */}
      <LogoMarquee />

      {/* Stats strip — figures tick up as they enter view. Three figures read as
          one instrument panel: a hairline frame top + bottom, a short vertical
          rule between each cell, and a small mono index tick (01/02/03) over each
          figure so the row scans like a gauge cluster rather than three floating
          numbers. */}
      <Container as="section" className="py-space-8">
        <StaggerGroup
          as="dl"
          stagger={0.08}
          className="grid grid-cols-3 border-y border-line"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="group flex flex-col gap-space-3 py-space-7 pl-space-5 pr-space-4 first:pl-0 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-line"
            >
              <span
                aria-hidden="true"
                className="font-mono text-caption tabular-nums text-muted opacity-60"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <dt className="font-display text-display-l leading-none tabular-nums transition-colors duration-base ease-out-quad group-hover:text-neon">
                <CountUp value={s.value} />
              </dt>
              <dd className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                {s.label}
              </dd>
            </div>
          ))}
        </StaggerGroup>
      </Container>

      {/* Selected work */}
      <Container as="section" id="work" className="scroll-mt-16 py-space-9">
        <div className="mb-space-7 flex items-end justify-between gap-space-4">
          <div>
            <Reveal>
              <Eyebrow>Selected work</Eyebrow>
            </Reveal>
            <TextReveal
              as="h2"
              by="words"
              delay={0.08}
              className="mt-space-3 font-display text-display-l"
            >
              Recent projects
            </TextReveal>
          </div>
          <Reveal delay={0.1} className="shrink-0">
            <Link href="/work">All work</Link>
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
        <AnimatedDivider />
      </Container>

      {/* About teaser */}
      <Container as="section" id="about" className="scroll-mt-16 py-space-9">
        <div className="max-w-[var(--measure)]">
          <Reveal>
            <Eyebrow>About</Eyebrow>
          </Reveal>
          <TextReveal
            as="h2"
            by="words"
            delay={0.08}
            className="mt-space-3 font-display text-display-l"
          >
            Creating digital experiences through systematic design thinking and precise execution.
          </TextReveal>
          <Reveal delay={0.12}>
            <Link href="/about" className="mt-space-5 inline-block">
              More about me
            </Link>
          </Reveal>
        </div>
      </Container>

      <Container>
        <AnimatedDivider />
      </Container>

      {/* Contact CTA — a framed panel with real depth: a layered radial glow from
          the top-left, a faint hairline grid, a top accent edge, and an eyebrow +
          oversized headline so the closing beat has presence instead of reading as
          a flat surface. The Magnetic "Get in touch" button is preserved. */}
      <Container as="section" id="contact" className="scroll-mt-16 py-space-9">
        <Reveal>
          <div className="card-neon relative isolate overflow-hidden rounded-[3px] border border-line bg-surface p-space-8 md:p-space-9">
            {/* Top accent hairline — a thin lit edge across the crown of the panel. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fg to-transparent opacity-40"
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
            <Eyebrow>Let&rsquo;s talk</Eyebrow>
            <TextReveal
              as="h2"
              by="words"
              className="mt-space-4 max-w-[18ch] font-display text-display-xl"
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
