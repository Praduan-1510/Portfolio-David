import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container, Text } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider } from "@/components/motion";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { getNoteBySlug, getNoteSlugs } from "@/lib/content/notes";
import { getProjectBySlug } from "@/lib/content/work";
import { formatNoteDate } from "@/lib/utils/date";
import { SITE_URL, site } from "@/lib/site";

type Params = { slug: string };

// Fully static, and 404 anything not in the list — same contract as the case
// studies. NOTE: like /work, adding a new .mdx needs a `next dev` restart,
// because dynamicParams=false freezes the slug list at build.
export function generateStaticParams(): Params[] {
  return getNoteSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) return {};

  const { title, summary, draft } = note.meta;
  return {
    title,
    description: summary,
    alternates: { canonical: `/notes/${slug}` },
    // A draft that somehow reaches a crawler should not be indexed.
    ...(draft ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: `${title} · ${site.name}`,
      description: summary,
      type: "article",
      url: `${SITE_URL}/notes/${slug}`,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${site.name}`,
      description: summary,
      images: ["/twitter-image"],
    },
  };
}

export default async function NotePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) notFound();

  const { meta, content } = note;
  // Resolve the related study here so a stale slug is visible as a missing
  // link in review rather than a 404 a reader finds first.
  const related = meta.related ? getProjectBySlug(meta.related) : null;

  return (
    <article>
      <Container as="header" className="pt-space-10 pb-space-6">
        <div className="flex flex-wrap items-baseline gap-x-space-4 gap-y-space-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          <NextLink href="/notes" className="text-fg transition-colors hover:text-neon">
            ← Notes
          </NextLink>
          <time dateTime={meta.date}>{formatNoteDate(meta.date)}</time>
          {meta.tags?.length ? <span>{meta.tags.join(" · ")}</span> : null}
          {meta.draft && (
            <span className="rounded-full border border-line px-space-3 py-[2px] text-fg">
              Draft · not published
            </span>
          )}
        </div>

        <TextReveal
          as="h1"
          by="words"
          trigger="load"
          delay={0.08}
          className="mt-space-5 max-w-[18ch] font-display text-display-l"
        >
          {meta.title}
        </TextReveal>

        <Reveal trigger="load" delay={0.18} y={16}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            {meta.summary}
          </Text>
        </Reveal>

        <AnimatedDivider className="mt-space-8" />
      </Container>

      {/* The body. Same lede treatment as a case study: the first paragraph is
          set in display type so the piece opens rather than starts. */}
      <Container className="pb-space-9">
        <Reveal className="max-w-[var(--measure)] [&>p:first-of-type]:mb-space-7 [&>p:first-of-type]:font-display [&>p:first-of-type]:text-body-l [&>p:first-of-type]:leading-[1.5] [&>p:first-of-type]:text-fg">
          <MDXRemote source={content} components={mdxComponents} />
        </Reveal>
      </Container>

      {/* The evidence. A note that cannot point at work is an opinion, so the
          link out is a structural part of the page, not a footer courtesy. */}
      {related && (
        <Container className="pb-space-10">
          <div className="border-t border-line pt-space-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-muted">
              The work behind this
            </p>
            <NextLink
              href={`/work/${related.meta.slug}`}
              className="group mt-space-4 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
              style={{ "--accent": related.meta.accent } as React.CSSProperties}
            >
              <Text
                variant="heading"
                as="h2"
                className="font-display transition-colors duration-fast ease-out-quad group-hover:text-neon"
              >
                {related.meta.title}
              </Text>
              <Text variant="body" className="mt-space-2 max-w-[var(--measure)] text-muted">
                {related.meta.indexNote ?? related.meta.summary}
              </Text>
              <span
                aria-hidden="true"
                className="mt-space-4 inline-flex items-center gap-space-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-fg transition-colors duration-fast ease-out-quad group-hover:text-neon"
              >
                Read the case study
                <span className="transition-transform duration-base ease-out-quad group-hover:translate-x-1">
                  →
                </span>
              </span>
            </NextLink>
          </div>
        </Container>
      )}
    </article>
  );
}
