import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container, Text, Eyebrow, Link, PhoneFrame } from "@/components/primitives";
import {
  Reveal,
  StaggerGroup,
  TextReveal,
  Parallax,
  RouteProgressAccent,
} from "@/components/motion";
import { mdxComponents } from "@/components/mdx/mdx-components";
import {
  getProjectBySlug,
  getProjectSlugs,
  getAllProjectsMeta,
} from "@/lib/content/work";
import { SITE_URL, site } from "@/lib/site";

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
    openGraph: { title: project.meta.title, description: project.meta.summary },
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

  // Next project: the following entry by order, wrapping around.
  const all = getAllProjectsMeta();
  const idx = all.findIndex((p) => p.slug === slug);
  const next = idx >= 0 ? all[(idx + 1) % all.length] : null;

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
    <article data-theme="dark" style={themeStyle} className="bg-bg text-fg">
      {/* Case-study structured data (rendered as plain JSON, not user input). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }}
      />
      {/* Theme the global scroll-progress bar to this project's accent. */}
      {meta.accent && <RouteProgressAccent accent={meta.accent} />}
      {/* Full-bleed cover hero — accent wash + title/meta + the cover screen. */}
      <header className="relative isolate overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70% 60% at 72% 18%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%)",
          }}
        />
        <Container className="grid items-center gap-space-9 py-space-11 md:grid-cols-[1.15fr_0.85fr]">
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
              className="mt-space-4 max-w-[18ch] font-display text-display-l"
            >
              {meta.title}
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

            <StaggerGroup
              as="dl"
              trigger="load"
              delay={0.42}
              className="mt-space-8 grid grid-cols-2 gap-space-6 border-t border-line pt-space-6"
            >
              <div>
                <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                  Role
                </dt>
                <dd className="mt-space-2 text-body">{meta.role}</dd>
              </div>
              <div>
                <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                  Services
                </dt>
                <dd className="mt-space-2 text-body">{meta.services.join(", ")}</dd>
              </div>
            </StaggerGroup>
          </div>

          <div className="mx-auto w-full max-w-[16rem]">
            <PhoneFrame
              src={meta.cover}
              alt={`${meta.title} — cover screen`}
              priority
              sizes="16rem"
              imgClassName="object-top"
            />
          </div>
        </Container>
      </header>

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
        <Reveal className="max-w-[var(--measure)] [&>p:first-of-type]:mb-space-7 [&>p:first-of-type]:font-display [&>p:first-of-type]:text-body-l [&>p:first-of-type]:leading-[1.5] [&>p:first-of-type]:text-fg">
          <MDXRemote source={content} components={mdxComponents} />
        </Reveal>
      </Container>

      {/* Screens — grouped by product flow and captioned, so the gallery reads
          as a walkthrough of the experience rather than a flat wall of phones.
          Each flow carries a mono index (§3 instrument-grade), a hairline, and
          a count; tall screens anchor to the top so their header stays visible. */}
      {meta.flows.length > 0 && (
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
            <Eyebrow>Screens</Eyebrow>
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
              <section key={flow.title} aria-labelledby={`flow-${fi}`}>
                {/* Flow header — index · title · count, over a hairline with a
                    leading accent tick so each flow reads as a marked chapter and
                    the gallery gains cadence as it scrolls (DESIGN brief #3). */}
                <Reveal>
                  <div className="flex items-baseline gap-space-4 border-t-2 border-[color:color-mix(in_srgb,var(--accent)_28%,var(--line))] pt-space-5">
                    <span className="font-mono text-caption text-accent">
                      {String(fi + 1).padStart(2, "0")}
                    </span>
                    <Text as="h3" id={`flow-${fi}`} variant="body-l" className="font-display font-medium">
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
                  {flow.screens.map((screen, si) => (
                    <li key={screen.src} className="group/sc">
                      <Parallax speed={0.04 + (si % 4) * 0.02}>
                        <PhoneFrame
                          src={screen.src}
                          alt={`${meta.title} — ${screen.caption}`}
                          sizes="(min-width: 1024px) 22vw, 45vw"
                          imgClassName="object-top"
                          className="transition-[transform,box-shadow] duration-base ease-out-quad group-hover/sc:-translate-y-1 group-hover/sc:shadow-neon"
                        />
                      </Parallax>
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

      {/* Next project. */}
      {next && (
        <Container as="section" className="border-t border-line py-space-10">
          <Reveal>
          <NextLink
            href={`/work/${next.slug}`}
            className="group flex items-center gap-space-6"
          >
            <div className="w-[5rem] shrink-0 sm:w-[6rem]">
              <PhoneFrame
                src={next.cover}
                alt={`${next.title} — cover`}
                sizes="6rem"
                imgClassName="object-top"
                className="transition-[transform,box-shadow] duration-base ease-out-quad group-hover:-translate-y-1 group-hover:shadow-neon"
              />
            </div>
            <div>
              <Eyebrow>Next project</Eyebrow>
              <Text
                as="span"
                variant="display-l"
                className="mt-space-2 block group-hover:text-neon"
              >
                {next.title}
              </Text>
            </div>
          </NextLink>
          </Reveal>
        </Container>
      )}

      <Container className="pb-space-10">
        <Link href="/work">← Back to all work</Link>
      </Container>
    </article>
  );
}
