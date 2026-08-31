import type { Metadata } from "next";
import NextLink from "next/link";
import { Container, Text } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider, StaggerGroup } from "@/components/motion";
import { getAllNotesMeta } from "@/lib/content/notes";
import { formatNoteDate } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "Notes",
  description:
    "Short written breakdowns from the work: constraints, trust, state and permissions in operational B2B software.",
  alternates: { canonical: "/notes" },
  openGraph: {
    title: "Notes: Praduan Saha",
    description:
      "Short written breakdowns from the work: constraints, trust, state and permissions in operational B2B software.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notes: Praduan Saha",
    description:
      "Short written breakdowns from the work: constraints, trust, state and permissions in operational B2B software.",
    images: ["/twitter-image"],
  },
};

/*
 * /notes: the writing surface.
 *
 * Deliberately the plainest index on the site — no media, no board, no scroll
 * choreography. The work index earns its signature treatment because the work
 * is visual; a list of arguments does not, and dressing it up would be the
 * portfolio talking over the writing.
 *
 * Each note points back at the case study it draws on, which is the section's
 * whole job: the writing is a route INTO the work, not a parallel body of it.
 */
export default function NotesPage() {
  const notes = getAllNotesMeta();

  return (
    <>
      <Container as="header" className="pt-space-10 pb-space-6">
        <TextReveal
          as="h1"
          by="words"
          trigger="load"
          delay={0.08}
          className="font-display text-display-l max-w-[20ch]"
        >
          Notes
        </TextReveal>
        <Reveal trigger="load" delay={0.18} y={16}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            One argument at a time, drawn from work on this site. Mostly about
            the same thing: what happens to an interface when a rule is actually
            enforced instead of drawn.
          </Text>
        </Reveal>
        <AnimatedDivider className="mt-space-8" />
      </Container>

      <Container as="section" aria-label="All notes" className="pb-space-10">
        {/* The list carries no border-t: the AnimatedDivider closing the header
            above IS that rule, and the two together read as a mis-set double
            hairline. Each row draws its own border-b instead. */}
        {notes.length === 0 ? (
          <Text variant="body" className="text-muted">
            Nothing published yet.
          </Text>
        ) : (
          <StaggerGroup as="ul" from="below">
            {notes.map((note) => (
              <li key={note.slug} className="border-b border-line">
                <NextLink
                  href={`/notes/${note.slug}`}
                  className="group block py-space-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
                >
                  <div className="flex flex-wrap items-baseline gap-x-space-4 gap-y-space-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                    <time dateTime={note.date}>{formatNoteDate(note.date)}</time>
                    {note.tags?.length ? <span>{note.tags.join(" · ")}</span> : null}
                    {note.draft && (
                      <span className="rounded-full border border-line px-space-3 py-[2px] text-fg">
                        Draft
                      </span>
                    )}
                  </div>
                  <Text
                    variant="heading"
                    as="h2"
                    className="mt-space-3 max-w-[24ch] font-display transition-colors duration-fast ease-out-quad group-hover:text-neon"
                  >
                    {note.title}
                  </Text>
                  <Text variant="body" className="mt-space-3 max-w-[var(--measure)] text-muted">
                    {note.summary}
                  </Text>
                  <span
                    aria-hidden="true"
                    className="mt-space-4 inline-flex items-center gap-space-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-fg transition-colors duration-fast ease-out-quad group-hover:text-neon"
                  >
                    Read
                    <span className="transition-transform duration-base ease-out-quad group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </NextLink>
              </li>
            ))}
          </StaggerGroup>
        )}
      </Container>
    </>
  );
}
