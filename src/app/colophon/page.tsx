import type { Metadata } from "next";
import { Container, Text, Link, Button } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider, StaggerGroup, Magnetic } from "@/components/motion";
import { getColophonNumbers } from "@/lib/content/colophon";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How this site is built: Next.js, GSAP and Lenis, one motion language, content validated at build time, a palette sampled from the logo, and a résumé that prints for real.",
  alternates: { canonical: "/colophon" },
  openGraph: {
    title: "Colophon: Praduan Saha",
    description:
      "How this site is built, and the decisions worth defending: one motion language, content validated at build time, and a résumé that prints for real.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Colophon: Praduan Saha",
    description: "How this site is built, and the decisions worth defending.",
    images: ["/twitter-image"],
  },
};

/*
 * /colophon: the site as the artefact.
 *
 * This page exists because the portfolio's strongest evidence for "designs and
 * ships front-end" was the thing the reader was already standing inside, and
 * nothing anywhere said so. Every case study argues for the claim; this is the
 * only page where the claim is the page.
 *
 * NOT a case study, deliberately. The work schema requires a `kind: "web"`
 * study to carry a video or a playable prototype, and faking one for a site the
 * reader is currently using would be silly. It would also put the portfolio in
 * the work index competing with client work, which is the wrong hierarchy: the
 * site is the frame, not an exhibit.
 */

const STACK = [
  { label: "Framework", value: "Next.js 16 · React 19 · TypeScript" },
  { label: "Styling", value: "Tailwind 3 over CSS custom properties" },
  { label: "Scroll & motion", value: "GSAP 3 · Lenis 1 · Motion 12" },
  { label: "Content", value: "MDX via next-mdx-remote, validated at build" },
  { label: "Type", value: "Bricolage Grotesque · JetBrains Mono" },
  { label: "Hosting", value: "Vercel, static-rendered" },
] as const;

const DECISIONS = [
  {
    title: "One motion language, not a pile of animations",
    body:
      "Durations, easings and distances are tokens; the reveals, staggers and text effects are a handful of shared primitives composed from them. GSAP drives scroll, Motion drives route transitions, and nothing gets animated ad hoc. It means the whole site accelerates and settles the same way — which is what makes motion read as a voice rather than as decoration.",
  },
  {
    title: "Reduced motion is a designed variant, not a fallback",
    body:
      "Every signature moment has an explicit still version: the work index becomes a static editorial stack, the hero settles rather than assembling, scrub-driven sections render at their resting state. The global CSS reset that neutralises animation is the floor, not the plan. If the only thing you can say about your reduced-motion experience is that the animation is switched off, you designed one experience and shipped two.",
  },
  {
    title: "Content is validated at build time",
    body:
      "A case study with a missing field, a non-numeric year, or a web study with neither video nor prototype fails the build with the filename and the field in the message. The same guard covers notes, including a check that dates are zero-padded ISO — the format the sort actually depends on. Authoring mistakes should be loud and early, not a page that renders wrong at 2am.",
  },
  {
    title: "The palette is sampled, not picked",
    body:
      "Every colour derives from the logo mark, and an audit script re-measures the whole set after any change: contrast against both surfaces, and perceptual distance between each project's accent so two case-study cards can never sit side by side looking like the same colour. Contrast ratios and ΔE figures quoted in the studies are outputs of that script, re-measured rather than remembered.",
  },
  {
    title: "The résumé prints for real",
    body:
      "Not a screenshot of a dark website: a print stylesheet remaps the tokens to ink on paper, strips the chrome, and leaves a clean document. It is the sort of surface nobody tests and everybody eventually uses, and getting it wrong is invisible until it is embarrassing.",
  },
  {
    title: "The résumé PDF is edited at the byte level",
    body:
      "The source document lives outside this repo, so when a fact changes, the published PDF is patched directly: content streams rewritten, marked content renumbered, structure tree repaired, cross-reference table regenerated. Three scripts do it and a fourth verifies the result four independent ways — including one check that caught a real bug, a text run left stranded at its old baseline. It is not the sane way to edit a PDF. It is the honest way to keep the download telling the same story as the site.",
  },
] as const;

export default function ColophonPage() {
  // Counted from the repo at build time, never typed in. See lib/content/colophon.ts.
  const NUMBERS = getColophonNumbers();

  return (
    <>
      <Container as="header" className="pt-space-10 pb-space-6">
        <Reveal trigger="load" delay={0.05}>
          <p className="flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.18em] text-muted">
            <span
              aria-hidden
              className="inline-block h-[7px] w-[7px]"
              style={{ background: "var(--spectrum-gradient)" }}
            />
            Colophon
          </p>
        </Reveal>

        <TextReveal
          as="h1"
          by="words"
          trigger="load"
          delay={0.12}
          className="mt-space-4 max-w-[16ch] font-display text-display-l"
        >
          You are standing in the portfolio piece.
        </TextReveal>

        <Reveal trigger="load" delay={0.3}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            Every case study on this site argues that I design and ship the
            front-end. This page is the one that does not have to: I designed
            this site and wrote all of it, and it is the piece of evidence you
            were already using.
          </Text>
        </Reveal>

        <AnimatedDivider className="mt-space-8" />
      </Container>

      {/* ── Stack ── */}
      <Container as="section" aria-labelledby="stack" className="pb-space-9">
        <h2 id="stack" className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
          Built with
        </h2>
        <dl className="mt-space-6 grid gap-x-space-9 gap-y-space-5 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((row) => (
            <div key={row.label} className="border-t border-line pt-space-4">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                {row.label}
              </dt>
              <dd className="mt-space-2 text-body text-fg">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {/* ── Numbers ── */}
      <Container as="section" aria-labelledby="numbers" className="pb-space-9">
        <h2 id="numbers" className="sr-only">
          By the numbers
        </h2>
        <StaggerGroup
          as="ul"
          from="below"
          className="grid gap-space-6 border-t border-line pt-space-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {NUMBERS.map((n) => (
            <li key={n.label}>
              <p className="font-display text-heading-l tabular-nums text-fg">{n.value}</p>
              <p className="mt-space-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                {n.label}
              </p>
            </li>
          ))}
        </StaggerGroup>
      </Container>

      {/* ── Decisions ── */}
      <Container as="section" aria-labelledby="decisions" className="pb-space-9">
        <h2
          id="decisions"
          className="border-t border-line pt-space-8 font-mono text-caption uppercase tracking-[0.18em] text-muted"
        >
          Decisions worth defending
        </h2>
        <StaggerGroup as="ol" from="below" className="mt-space-6">
          {DECISIONS.map((d, i) => (
            <li key={d.title} className="border-t border-line py-space-6 first:border-t-0 first:pt-0">
              <div className="grid gap-space-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-space-7">
                <div className="flex items-baseline gap-space-4">
                  <span
                    aria-hidden="true"
                    className="font-mono text-caption tabular-nums text-muted"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Text variant="heading-s" as="h3" className="font-display text-fg">
                    {d.title}
                  </Text>
                </div>
                <Text variant="body" className="text-muted">
                  {d.body}
                </Text>
              </div>
            </li>
          ))}
        </StaggerGroup>
      </Container>

      {/* ── The honest part ── */}
      <Container as="section" aria-labelledby="limits" className="pb-space-9">
        <div className="border-t border-line pt-space-8">
          <h2
            id="limits"
            className="font-mono text-caption uppercase tracking-[0.18em] text-muted"
          >
            What this page does not claim
          </h2>
          <div className="mt-space-5 grid gap-space-6 lg:grid-cols-2 lg:gap-space-9">
            <Text variant="body" className="max-w-[var(--measure)] text-muted">
              <strong className="font-medium text-fg">No performance numbers.</strong>{" "}
              The InsightsTap study publishes measured Lighthouse figures because
              that site is in production and was measured properly, including the
              number that is bad. I have not run the same measurement against
              this site under production conditions, so there is nothing here to
              quote. An unmeasured &ldquo;fast&rdquo; is a claim, and this site
              is the wrong place to start making those.
            </Text>
            <Text variant="body" className="max-w-[var(--measure)] text-muted">
              <strong className="font-medium text-fg">
                No usability testing.
              </strong>{" "}
              Nobody has been watched using this site. The navigation, the work
              index and the case-study reading order are all reasoned rather than
              tested, and reasoned is not the same thing. It is the same gap the
              Spendee study labels on its own goals, and it applies here too.
            </Text>
          </div>
        </div>
      </Container>

      {/* ── CTA ── */}
      <Container as="section" className="pb-space-10">
        <div className="border-t border-line pt-space-8">
          <Text variant="heading" as="p" className="max-w-[26ch] font-display">
            The same hands did the case studies.
          </Text>
          <Text variant="body" className="mt-space-4 max-w-[var(--measure)] text-muted">
            Source is on{" "}
            <Link href="https://github.com/Praduan-1510">GitHub</Link>. If you
            want this kind of attention on your product, that is what{" "}
            <Link href="/services">Services</Link> is for.
          </Text>
          <div className="mt-space-6 flex flex-wrap items-center gap-space-4">
            <Magnetic className="inline-block">
              <Button href="/work" variant="invert">
                See the work
              </Button>
            </Magnetic>
            <Magnetic className="inline-block">
              <Button href="/contact" variant="secondary">
                Get in touch
              </Button>
            </Magnetic>
          </div>
        </div>
      </Container>
    </>
  );
}
