import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  Container,
  Text,
  Eyebrow,
  Link,
  Button,
  PhoneFrame,
  BrowserMockup,
  ProjectCover,
} from "@/components/primitives";
import {
  Reveal,
  StaggerGroup,
  TextReveal,
  Parallax,
  Magnetic,
  RouteProgressAccent,
  AuroraEmber,
  FlapText,
} from "@/components/motion";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { displayTitle } from "@/lib/utils/typography";
import {
  getProjectBySlug,
  getProjectSlugs,
  getAllProjectsMeta,
} from "@/lib/content/work";
import { slugify } from "@/lib/utils/slugify";
import { SITE_URL, site } from "@/lib/site";
import { CaseStudyNav } from "./CaseStudyNav";

type Params = { slug: string };

// Fully static: prerender every case study, 404 anything else.
export function generateStaticParams(): Params[] {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.meta.title,
    description: project.meta.summary,
    alternates: { canonical: `/work/${slug}` },
    openGraph: { title: project.meta.title, description: project.meta.summary },
    twitter: { title: project.meta.title, description: project.meta.summary },
  };
}

export default async function CaseStudy({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { meta, content } = project;
  const isWeb = meta.kind === "web";
  const liveHost = meta.liveUrl
    ? meta.liveUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    : undefined;

  // Next project: the following entry by order, wrapping around.
  const all = getAllProjectsMeta();
  const idx = all.findIndex((p) => p.slug === slug);
  const next = idx >= 0 ? all[(idx + 1) % all.length] : null;

  // Three key screens for the signature showcase — the cover centred, flanked by
  // the next two distinct screens (a confident "big reveal" of the actual work).
  const heroScreens = Array.from(new Set([meta.cover, ...meta.gallery])).slice(0, 3);

  // Narrative sections (the MDX h2s) for the sticky "Contents" rail — extracted
  // from the raw MDX so the ids match the slugs the heading renderer sets.
  const sections = content.split("\n").flatMap((line) => {
    const m = line.match(/^##\s+(.+?)\s*$/);
    return m ? [{ id: slugify(m[1]), label: m[1].replace(/\*\*/g, "").trim() }] : [];
  });
  const hasContents = sections.length >= 2;

  // Theme the route to the project accent (semantic remap, §4/§8) and run it on
  // the dark surface so any accent (lime/orange/blue) stays high-contrast (§3).
  const themeStyle = meta.accent
    ? ({ "--accent": meta.accent } as React.CSSProperties)
    : undefined;

  // CreativeWork structured data for the case study — describes the project and
  // credits it to the Person declared in the layout (referenced by name + url).
  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: meta.title,
    description: meta.summary,
    url: `${SITE_URL}/work/${slug}`,
    creator: {
      "@type": "Person",
      name: site.name,
      url: SITE_URL,
    },
    dateCreated: String(meta.year),
    about: meta.services,
  };

  return (
    <article data-theme="dark" data-motif={meta.motif ?? "blueprint"} style={themeStyle} className="overflow-x-clip bg-bg text-fg">
      {/* Case-study structured data (rendered as plain JSON, not user input). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }}
      />
      {/* Theme the global scroll-progress bar to this project's accent. */}
      {meta.accent && <RouteProgressAccent accent={meta.accent} />}
      {/* Cover hero — accent field + faint blueprint grid, a big title, an
          instrument spec strip, the cover screen lifted on an accent glow, and a
          hairline scroll cue that frames the reveal below. */}
      <header className="relative isolate overflow-hidden border-b border-line">
        {/* The aurora, tuned to this project: the route accent blended with its
            violet spectrum neighbour instead of a flat single-hue radial. */}
        <AuroraEmber hues={["accent", "violet"]} position="top-right" intensity={0.24} />
        {/* Per-study decorative motif (data-motif on the article): blueprint
            dots / ledger ruling / route dashes / athletic grid — so each study
            screenshots differently beyond its accent. Recipes in globals.css. */}
        <div aria-hidden="true" className="cs-motif" />
        {isWeb ? (
          <>
            {/* Compact web header — eyebrow + a title row that carries the live CTA,
                then a short summary. Kept deliberately tight so the full-width
                capture below dominates the intro instead of being pushed off-screen. */}
            <Container className="pt-space-10 pb-space-6">
              <Reveal trigger="load">
                <Eyebrow>
                  <span
                    aria-hidden="true"
                    className="mr-space-2 inline-block h-[8px] w-[8px] rounded-full bg-accent align-middle"
                  />
                  {meta.client} · {meta.year}
                </Eyebrow>
              </Reveal>
              <div className="mt-space-4 flex flex-col gap-space-5 md:flex-row md:items-end md:justify-between md:gap-space-9">
                <TextReveal
                  as="h1"
                  by="lines"
                  trigger="load"
                  delay={0.1}
                  className="max-w-[16ch] font-display text-display-l"
                >
                  {displayTitle(meta.title)}
                </TextReveal>
                {meta.liveUrl && (
                  <Reveal
                    trigger="load"
                    delay={0.3}
                    className="flex shrink-0 flex-wrap items-center gap-x-space-5 gap-y-space-3 md:pb-space-2"
                  >
                    <Magnetic>
                      <Button href={meta.liveUrl} target="_blank" variant="primary">
                        Visit site ↗
                      </Button>
                    </Magnetic>
                    <span className="inline-flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                      <span
                        aria-hidden="true"
                        className="h-[7px] w-[7px] rounded-full bg-neon motion-safe:animate-status-pulse"
                      />
                      Live · {liveHost}
                    </span>
                  </Reveal>
                )}
              </div>
              <Reveal trigger="load" delay={0.24} className="mt-space-5">
                <Text variant="body-l" className="max-w-[62ch] text-muted">
                  {meta.summary}
                </Text>
              </Reveal>
              {meta.disclaimer && (
                <Reveal trigger="load" delay={0.34} className="mt-space-4">
                  <p
                    role="note"
                    className="inline-flex items-center gap-space-2 rounded-[2px] border border-line px-space-3 py-space-2 font-mono text-caption uppercase tracking-[0.1em] text-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-muted"
                    />
                    {meta.disclaimer}
                  </p>
                </Reveal>
              )}
            </Container>

            {/* Full-width capture stage — the showpiece. Runs the orchestrated `boot`
                intro (chrome lights up → screen scans in → live badge) on a gentler
                `big` resting tilt; entrance/tilt/glow are CSS + reduced-motion-safe,
                and the <video> is IO-gated + preload="none" so it never blocks LCP. */}
            <Container className="relative pb-space-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 inset-y-[-8%] -z-10"
                style={{
                  background:
                    "radial-gradient(58% 64% at 50% 46%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 76%)",
                }}
              />
              <BrowserMockup
                tilt="hero"
                boot
                big
                priority
                mp4={meta.video?.src}
                webm={meta.video?.webm}
                poster={meta.video?.poster ?? meta.cover}
                liveUrl={meta.liveUrl}
                domain={liveHost}
                alt={`${meta.title} — homepage, looping screen recording`}
                sizes="(min-width: 768px) 78rem, 92vw"
              />
            </Container>

            {/* Spec strip below the capture — instrument fact sheet. */}
            <Container className="pb-space-9">
              <StaggerGroup
                as="dl"
                className="grid grid-cols-2 gap-x-space-6 gap-y-space-6 border-t border-line pt-space-6 sm:grid-cols-4"
              >
                <div>
                  <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    Role
                  </dt>
                  <dd className="mt-space-2 text-body">{meta.role}</dd>
                </div>
                <div>
                  <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    Year
                  </dt>
                  <dd className="mt-space-2 text-body">{meta.year}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    Services
                  </dt>
                  <dd className="mt-space-2 text-body">{meta.services.join(", ")}</dd>
                </div>
              </StaggerGroup>
            </Container>
          </>
        ) : (
          <Container className="grid items-center gap-space-9 pt-space-11 pb-space-9 md:grid-cols-[1.12fr_0.88fr]">
            <div>
              <Reveal trigger="load">
                <Eyebrow>
                  <span
                    aria-hidden="true"
                    className="mr-space-2 inline-block h-[8px] w-[8px] rounded-full bg-accent align-middle"
                  />
                  {meta.client} · {meta.year}
                </Eyebrow>
              </Reveal>
              <TextReveal
                as="h1"
                by="lines"
                trigger="load"
                delay={0.1}
                className="mt-space-4 max-w-[14ch] font-display text-display-xl"
              >
                {displayTitle(meta.title)}
              </TextReveal>
              <Reveal trigger="load" delay={0.28} className="mt-space-5">
                <Text variant="body-l" className="max-w-[46ch] text-muted">
                  {meta.summary}
                </Text>
              </Reveal>

              {meta.disclaimer && (
                <Reveal trigger="load" delay={0.36} className="mt-space-5">
                  <p
                    role="note"
                    className="inline-flex items-center gap-space-2 rounded-[2px] border border-line px-space-3 py-space-2 font-mono text-caption uppercase tracking-[0.1em] text-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-muted"
                    />
                    {meta.disclaimer}
                  </p>
                </Reveal>
              )}

              {/* Spec strip — instrument fact sheet (Role · Year · Services). */}
              <StaggerGroup
                as="dl"
                trigger="load"
                delay={0.42}
                className="mt-space-8 grid grid-cols-2 gap-x-space-6 gap-y-space-6 border-t border-line pt-space-6 sm:grid-cols-4"
              >
                <div>
                  <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    Role
                  </dt>
                  <dd className="mt-space-2 text-body">{meta.role}</dd>
                </div>
                <div>
                  <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    Year
                  </dt>
                  <dd className="mt-space-2 text-body">{meta.year}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    Services
                  </dt>
                  <dd className="mt-space-2 text-body">{meta.services.join(", ")}</dd>
                </div>
              </StaggerGroup>
            </div>

            <Reveal trigger="load" delay={0.2} className="relative mx-auto w-full max-w-[17rem]">
              <div
                aria-hidden="true"
                className="absolute -inset-10 -z-10"
                style={{
                  background:
                    "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 20%, transparent), transparent)",
                }}
              />
              <PhoneFrame
                src={meta.cover}
                alt={`${meta.title} — cover screen`}
                priority
                sizes="17rem"
                imgClassName="object-top"
              />
            </Reveal>
          </Container>
        )}

        {/* Scroll cue — instrument hairline framing the reveal below. */}
        <Container className="relative z-10 pb-space-7">
          <div className="flex items-center gap-space-4 font-mono text-caption uppercase tracking-[0.18em] text-muted">
            <span className="shrink-0">Case study</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <span className="shrink-0">
              {meta.services.length} services ·{" "}
              {isWeb ? "live site" : `${meta.gallery.length} screens`}
            </span>
          </div>
        </Container>
      </header>

      {/* Signature showcase — a confident "big reveal" of the work. On sm+ the
          cover is centred and lifted, flanked by two more screens (the designed
          trio). On phones the cover is already the centrepiece of the hero just
          above, so re-showing it here reads as a duplicate — instead mobile drops
          the cover and reveals the two OTHER screens as a balanced pair, so the
          beat shows fresh work at every size. Woven parallax; reduced-motion-safe. */}
      {meta.kind !== "web" && heroScreens.length === 3 && (
        <section className="relative isolate overflow-hidden border-b border-line py-space-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(54% 68% at 50% 28%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)",
            }}
          />
          <Container>
            <Reveal>
              <div className="mx-auto flex max-w-[42rem] items-end justify-center gap-space-5 sm:gap-space-7">
                {/* Left — a flank on desktop; a full member of the mobile pair. */}
                <div className="w-[45%] -translate-y-2 sm:w-[28%]">
                  <Parallax speed={0.05}>
                    <PhoneFrame
                      src={heroScreens[1]}
                      alt={`${meta.title} — second key screen`}
                      sizes="(min-width: 640px) 14rem, 45vw"
                      imgClassName="object-top"
                      className="opacity-100 sm:opacity-80"
                    />
                  </Parallax>
                </div>
                {/* Centre — the cover. Hidden on phones (it leads the hero above);
                    the lifted centrepiece from sm up. */}
                <div className="relative z-10 hidden w-[40%] -translate-y-6 sm:block">
                  <Parallax speed={0.09}>
                    <PhoneFrame
                      src={heroScreens[0]}
                      alt={`${meta.title} — cover screen`}
                      sizes="18rem"
                      imgClassName="object-top"
                      className="shadow-[0_44px_100px_-32px_rgba(0,0,0,0.92)]"
                    />
                  </Parallax>
                </div>
                {/* Right — a flank on desktop; the other half of the mobile pair. */}
                <div className="w-[45%] -translate-y-2 sm:w-[28%]">
                  <Parallax speed={0.07}>
                    <PhoneFrame
                      src={heroScreens[2]}
                      alt={`${meta.title} — third key screen`}
                      sizes="(min-width: 640px) 14rem, 45vw"
                      imgClassName="object-top"
                      className="opacity-100 sm:opacity-80"
                    />
                  </Parallax>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      {/* Metrics (only if the case study defines them). */}
      {meta.metrics && meta.metrics.length > 0 && (
        <Container as="section" className="py-space-9">
          <dl className="grid grid-cols-1 gap-space-6 border-b border-line pb-space-8 sm:grid-cols-3">
            {meta.metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col-reverse gap-space-2">
                <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                  {metric.label}
                </dt>
                <dd className="font-display text-display-l text-accent">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      )}

      {/* Body (MDX). The first paragraph opens the study as a larger, lighter
          LEAD (scoped :first-of-type variant — MDX is a flat element list, so the
          lead is keyed off document position rather than a per-element tag). The
          measure keeps the column at a readable line length (§5). */}
      <Container as="section" className="py-space-10">
        {hasContents ? (
          <>
            {/* Phones/small tablets get a sticky horizontal chip rail; md+ gets the
                vertical sidebar — so the very tall page is navigable at every size. */}
            <CaseStudyNav variant="mobile" sections={sections} />
            <div className="grid gap-space-7 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-space-9">
              <CaseStudyNav variant="desktop" sections={sections} className="hidden md:block" />
              {/* Full-cell column: text self-clamps to --measure (in mdx-components)
                  while media (<Shot>) uses the full width and can alternate sides. */}
              <Reveal className="prose-cs-grid min-w-0 [&>p:first-of-type]:mb-space-7 [&>p:first-of-type]:font-display [&>p:first-of-type]:text-body-l [&>p:first-of-type]:leading-[1.5] [&>p:first-of-type]:text-fg">
                <MDXRemote source={content} components={mdxComponents} />
              </Reveal>
            </div>
          </>
        ) : (
          <Reveal className="max-w-[var(--measure)] [&>p:first-of-type]:mb-space-7 [&>p:first-of-type]:font-display [&>p:first-of-type]:text-body-l [&>p:first-of-type]:leading-[1.5] [&>p:first-of-type]:text-fg">
            <MDXRemote source={content} components={mdxComponents} />
          </Reveal>
        )}
      </Container>

      {/* Screens — grouped by product flow and captioned, so the gallery reads
          as a walkthrough of the experience rather than a flat wall of phones.
          Each flow carries a mono index (§3 instrument-grade), a hairline, and
          a count; tall screens anchor to the top so their header stays visible. */}
      {meta.flows && meta.flows.length > 0 && (
        <Container as="section" data-screens className="relative isolate border-t border-line py-space-10">
          {/* Faint accent wash anchoring the gallery header — gives the long
              screens section atmosphere/depth without competing with the phones
              (very low mix; restrained, §3). Decorative. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40%]"
            style={{
              background:
                "radial-gradient(60% 100% at 28% 0%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 72%)",
            }}
          />
          <Reveal>
            <Eyebrow flap>Screens</Eyebrow>
          </Reveal>
          <div className="mt-space-3 flex flex-wrap items-baseline justify-between gap-x-space-6 gap-y-space-2">
            <TextReveal as="h2" by="words" className="font-display text-heading">
              A walk through the experience
            </TextReveal>
            <span className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
              {meta.gallery.length} screens · {meta.flows.length} flows
            </span>
          </div>

          <div className="mt-space-9 flex flex-col gap-space-10">
            {meta.flows.map((flow, fi) => (
              // content-visibility:auto lets the browser skip layout/paint for
              // flows that are off-screen — the fix for case-study scroll jank,
              // which is paint-bound (many large box-shadowed PhoneFrames), not JS.
              // contain-intrinsic-size reserves a plausible height so the scrollbar
              // and ScrollTrigger geometry stay stable; `auto` remembers the real
              // size once a flow has rendered.
              <section
                key={flow.title}
                aria-labelledby={`flow-${fi}`}
                className="[content-visibility:auto] [contain-intrinsic-size:auto_1000px]"
              >
                {/* Flow header — index · title · count, over a hairline with a
                    leading accent tick so each flow reads as a marked chapter and
                    the gallery gains cadence as it scrolls (DESIGN brief #3). */}
                <Reveal>
                  <div className="flex items-baseline gap-space-4 border-t-2 border-[color:color-mix(in_srgb,var(--accent)_28%,var(--line))] pt-space-5">
                    <span className="font-mono text-caption text-accent">
                      <FlapText text={String(fi + 1).padStart(2, "0")} trigger="inView" flips={4} colorMode="mono" />
                    </span>
                    <Text as="h3" id={`flow-${fi}`} variant="heading-s" className="font-medium">
                      {flow.title}
                    </Text>
                    <span className="ml-auto shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                      {String(flow.screens.length).padStart(2, "0")} {flow.screens.length === 1 ? "screen" : "screens"}
                    </span>
                  </div>
                </Reveal>

                {flow.note && (
                  <Reveal delay={0.06}>
                    <Text variant="body" className="mt-space-4 max-w-[var(--measure)] text-muted">
                      {flow.note}
                    </Text>
                  </Reveal>
                )}

                {/* Captioned phone grid — screens enter in a staggered sequence,
                    with a subtle woven parallax (alternating column speeds) for
                    depth as the flow scrolls. Two-up on phones, four-up from lg. */}
                <StaggerGroup
                  as="ul"
                  stagger={0.07}
                  className="mt-space-6 grid grid-cols-2 gap-x-space-5 gap-y-space-7 lg:grid-cols-4"
                >
                  {flow.screens.map((screen) => (
                    <li key={screen.src} className="group/sc">
                      {/* No per-phone scroll Parallax here: a long flow renders many
                          shadowed PhoneFrames, and scrubbing a transform on each one
                          re-rasterises its big box-shadow every scroll frame — the
                          measured cause of case-study scroll jank. The hover lift
                          (transform/box-shadow on interaction) stays. */}
                      <PhoneFrame
                        src={screen.src}
                        alt={`${meta.title} — ${screen.caption}`}
                        sizes="(min-width: 1024px) 22vw, 45vw"
                        imgClassName="object-top"
                        className="transition-[transform,box-shadow] duration-base ease-out-quad group-hover/sc:-translate-y-1 group-hover/sc:shadow-neon"
                      />
                      <p className="mt-space-3 font-mono text-caption uppercase tracking-[0.14em] text-muted transition-colors duration-base ease-out-quad group-hover/sc:text-neon">
                        {screen.caption}
                      </p>
                    </li>
                  ))}
                </StaggerGroup>
              </section>
            ))}
          </div>
        </Container>
      )}

      {/* Next project — a bold full-bleed CTA: oversized title, an arrow cue, and
          the next cover lifting on hover (neon affordance). */}
      {next && (
        <section className="relative isolate overflow-hidden border-t border-line">
          <NextLink href={`/work/${next.slug}`} className="group block">
            <Container className="flex items-center justify-between gap-space-7 py-space-10">
              <Reveal className="min-w-0">
                <Eyebrow flap>Next departure</Eyebrow>
                <Text
                  as="span"
                  variant="display-xl"
                  className="mt-space-3 block font-display transition-colors duration-base ease-out-quad group-hover:text-neon"
                >
                  {displayTitle(next.title)}
                </Text>
                <span className="mt-space-5 inline-flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.18em] text-muted transition-colors duration-base ease-out-quad group-hover:text-neon">
                  View case study
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-base ease-out-quad group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Reveal>
              <div
                className={`hidden shrink-0 sm:block ${
                  next.kind === "web" ? "w-[14rem] lg:w-[19rem]" : "w-[8rem] lg:w-[10rem]"
                }`}
              >
                <ProjectCover
                  project={next}
                  sizes={next.kind === "web" ? "19rem" : "10rem"}
                  imgClassName="object-top transition-[transform,box-shadow] duration-base ease-out-quad group-hover:-translate-y-1.5"
                  className="transition-[transform,box-shadow] duration-base ease-out-quad group-hover:-translate-y-1.5 group-hover:shadow-neon"
                />
              </div>
            </Container>
          </NextLink>
        </section>
      )}

      <Container className="pt-0 pb-space-8">
        <Link href="/work" className="inline-flex min-h-[44px] items-center">← Back to all work</Link>
      </Container>
    </article>
  );
}
