import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Container, Text, Button } from "@/components/primitives";
import {
  Reveal,
  StaggerGroup,
  TextReveal,
  AnimatedNoise,
  AuroraEmber,
  Magnetic,
  TimelineRail,
} from "@/components/motion";
import { spectrumAt } from "@/lib/spectrum";
import { cn } from "@/lib/utils/cn";
import { site } from "@/lib/site";
import {
  SUMMARY,
  SPECS,
  SKILLS,
  EXPERIENCE,
  PROJECTS,
  EDUCATION,
  CERTIFICATIONS,
  STRENGTHS,
  LANGUAGES,
  RESUME_PDF,
  RESUME_UPDATED,
  RESUME_PAGES,
} from "@/lib/content/resume";
import { ResumeActions } from "./ResumeActions";

export const metadata: Metadata = {
  title: "Résumé",
  description:
    "The full résumé of Praduan Saha — product designer and front-end designer in Kolkata. Experience, projects, education, and certifications, readable on the page or downloadable as a PDF.",
  alternates: { canonical: "/resume" },
  openGraph: {
    title: "Résumé — Praduan Saha",
    description:
      "Experience, selected projects, education, and certifications — read it on the page or download the PDF.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Résumé — Praduan Saha",
    description:
      "Experience, selected projects, education, and certifications — read it on the page or download the PDF.",
    images: ["/twitter-image"],
  },
};

/*
 * Résumé — the site's one DOCUMENT.
 *
 * Every other route is a composition; this one is a record, so it's set like a
 * specification sheet rather than a page: a letterhead masthead over a ruled
 * ledger, where each section's mono index + label sits in a sticky left rail and
 * the content runs in a single measure on the right. Facts sit on hairlines,
 * dates hang right in mono, and the only colour is the spectrum on the section
 * indices — the site's structural signal layer, never a fill.
 *
 * It's also literally printable: `.resume-doc` hooks the @media print block in
 * globals.css, which remaps the semantic tokens to ink-on-paper, drops the site
 * chrome and every decorative layer, collapses this two-column ledger into
 * document flow, and stops entries splitting across a page break. The "Print"
 * button in ResumeActions is a real feature, not an afterthought.
 *
 * Content comes from src/lib/content/resume.ts (transcribed from the PDF the
 * download button serves) — nothing on this page is written here.
 */

/** One ledger section: sticky mono index + label on the left, content right. */
function Section({
  index,
  label,
  id,
  children,
}: {
  index: number;
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-label`}
      className="resume-section grid gap-space-4 border-t border-line py-space-8 lg:grid-cols-12 lg:gap-space-8"
    >
      <div className="lg:col-span-3">
        <h2
          id={`${id}-label`}
          className="resume-section-label flex items-baseline gap-space-3 font-mono text-caption uppercase tracking-[0.18em] text-muted lg:sticky lg:top-[5.5rem]"
        >
          <span
            aria-hidden="true"
            className="tabular-nums"
            style={{ color: spectrumAt(index) }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {label}
        </h2>
      </div>
      <div className="lg:col-span-8 lg:col-start-5">{children}</div>
    </section>
  );
}

/** Result-led achievement lines. The dash marker keeps the document voice. */
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-space-4 space-y-space-3">
      {items.map((item) => (
        // .resume-bullet swaps the hairline dash for a real list marker in print
        // (see the @media print block) — a background dash wouldn't survive the
        // "background graphics off" default.
        <li key={item} className="resume-bullet flex gap-space-3">
          <span
            aria-hidden="true"
            className="mt-[0.7em] h-px w-space-3 shrink-0 bg-muted"
          />
          <Text variant="body" className="max-w-[var(--measure)] text-muted">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  );
}

/** Title left, mono dateline hanging right — the document's repeating rhythm. */
function EntryHead({
  title,
  meta,
  period,
  as = "h3",
}: {
  title: React.ReactNode;
  meta?: string;
  period: string;
  as?: "h3" | "h4" | "p";
}) {
  return (
    <div className="flex flex-col gap-space-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-space-4">
      <div className="min-w-0">
        <Text
          as={as}
          variant="heading-s"
          className="font-display transition-colors duration-base ease-out-quad group-hover:text-neon"
        >
          {title}
        </Text>
        {meta && (
          <Text variant="caption" className="mt-space-1 text-muted">
            {meta}
          </Text>
        )}
      </div>
      <span className="shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
        {period}
      </span>
    </div>
  );
}

export default function Resume() {
  return (
    <article className="resume-doc">
      {/* ── Masthead ─ the letterhead: identity, positioning, actions, specs ── */}
      <section
        data-theme="dark"
        data-motif="ledger"
        aria-labelledby="resume-name"
        className="resume-masthead relative isolate overflow-hidden border-b border-line bg-bg text-fg"
      >
        {/* Ruled-paper motif — the case-study "ledger" texture, reused because
            this route IS a ledger. Decorative, aria-hidden via .cs-motif usage. */}
        <span aria-hidden="true" className="cs-motif" />
        <AuroraEmber
          hues={["violet", "blue"]}
          position="top-right"
          intensity={0.12}
          className="print:hidden"
        />
        <AnimatedNoise opacity={0.03} className="-z-10 print:hidden" />

        {/* Corner crosshair ticks — the site's instrument frame. */}
        {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map(
          (pos) => (
            <span
              key={pos}
              aria-hidden="true"
              className={`pointer-events-none absolute z-10 ${pos} m-space-4 h-space-3 w-space-3`}
              style={{
                borderTop: pos.includes("top") ? "1px solid var(--line)" : undefined,
                borderBottom: pos.includes("bottom") ? "1px solid var(--line)" : undefined,
                borderLeft: pos.includes("left") ? "1px solid var(--line)" : undefined,
                borderRight: pos.includes("right") ? "1px solid var(--line)" : undefined,
              }}
            />
          ),
        )}

        <Container className="relative z-10 pb-space-8 pt-space-9">
          {/* Document rule — what this is, and which revision. */}
          <Reveal trigger="load" delay={0.04}>
            <div className="flex flex-wrap items-center justify-between gap-space-3 border-b border-line pb-space-4">
              <p className="flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.18em] text-muted">
                <span
                  aria-hidden="true"
                  className="inline-block h-[7px] w-[7px]"
                  style={{ background: "var(--spectrum-gradient)" }}
                />
                Curriculum Vitae
              </p>
              <p className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
                Rev · {RESUME_UPDATED}
              </p>
            </div>
          </Reveal>

          <div className="mt-space-7 grid gap-space-8 lg:grid-cols-12 lg:gap-space-8">
            {/* Left — identity + statement + actions. */}
            <div className="lg:col-span-7">
              <TextReveal
                as="h1"
                id="resume-name"
                by="words"
                trigger="load"
                delay={0.1}
                className="font-display text-display-xl"
              >
                Praduan Saha
              </TextReveal>

              <Reveal trigger="load" delay={0.28}>
                <p className="mt-space-5 font-mono text-caption uppercase tracking-[0.22em] text-fg">
                  {site.jobTitle}
                </p>
                {/* Spectrum thread under the title plate — the same bookend
                    device as the hero and footer, at document scale. */}
                <span
                  aria-hidden="true"
                  className="mt-space-3 block h-px w-full max-w-[26rem] print:hidden"
                  style={{
                    background: "var(--spectrum-gradient)",
                    opacity: 0.7,
                    maskImage: "linear-gradient(90deg, #000 60%, transparent)",
                    WebkitMaskImage: "linear-gradient(90deg, #000 60%, transparent)",
                  }}
                />
              </Reveal>

              <Reveal trigger="load" delay={0.36}>
                <Text variant="body-l" className="mt-space-6 max-w-[52ch] text-muted">
                  {SUMMARY}
                </Text>
              </Reveal>

              {/* data-noprint sits on the wrapper, not the buttons — otherwise
                  an empty but still-laid-out block leaves a hole on the page. */}
              <Reveal trigger="load" delay={0.44} className="mt-space-7" data-noprint>
                <ResumeActions />
                <p className="mt-space-4 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                  PDF · {RESUME_PAGES} pages · Updated {RESUME_UPDATED}
                </p>
              </Reveal>
            </div>

            {/* Right — the contact plate. A quiet bordered card so the reachable
                facts sit together where a recruiter looks for them. */}
            <div className="lg:col-span-4 lg:col-start-9">
              <Reveal trigger="load" delay={0.34}>
                <div className="card-neon resume-panel relative overflow-hidden rounded-[3px] border border-line p-space-6">
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px print:hidden"
                    style={{
                      background: "var(--spectrum-gradient)",
                      opacity: 0.5,
                      maskImage:
                        "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
                    }}
                  />
                  <p className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
                    Contact
                  </p>
                  <dl className="mt-space-5 space-y-space-4">
                    <div>
                      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
                        Email
                      </dt>
                      <dd className="mt-space-1">
                        <a
                          href={`mailto:${site.email}`}
                          className="text-body text-fg transition-colors duration-fast ease-out-quad hover:text-neon"
                        >
                          {site.email}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
                        LinkedIn
                      </dt>
                      <dd className="mt-space-1">
                        <a
                          href={site.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/li inline-flex items-center gap-space-2 text-body text-fg transition-colors duration-fast ease-out-quad hover:text-neon"
                        >
                          in/praduan-saha
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-[14px] w-[14px] shrink-0 transition-transform duration-fast ease-out-quad group-hover/li:-translate-y-0.5 group-hover/li:translate-x-0.5"
                          />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
                        Portfolio
                      </dt>
                      <dd className="mt-space-1 text-body text-fg">praduansaha.com</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
                        Based
                      </dt>
                      <dd className="mt-space-1 text-body text-fg">
                        Kolkata, West Bengal, India
                      </dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>

        {/* Spec strip — four readouts across the foot of the letterhead. */}
        <Container className="relative z-10 border-t border-line">
          <StaggerGroup
            as="dl"
            trigger="load"
            delay={0.5}
            stagger={0.06}
            className="grid grid-cols-2 gap-x-space-6 sm:grid-cols-4 sm:gap-x-0"
          >
            {SPECS.map((spec, i) => (
              <div
                key={spec.label}
                // Hairline dividers only once the strip is a single 4-up row;
                // in the stacked 2-col case the gap does the separating.
                className={cn(
                  "py-space-5",
                  i > 0 && "sm:border-l sm:border-line sm:pl-space-5",
                )}
              >
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
                  {spec.label}
                </dt>
                {/* Steps down a notch on phones — at 2-up, "Product · Front-end"
                    at the caption step + 0.1em tracking breaks across lines. */}
                <dd className="mt-space-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-fg sm:text-caption sm:tracking-[0.1em]">
                  {spec.value}
                </dd>
              </div>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* ── The ledger ──────────────────────────────────────────────────── */}
      <Container as="div" className="pb-space-10 pt-space-4">
        {/* 01 — Capabilities */}
        <Section index={0} label="Capabilities" id="capabilities">
          <StaggerGroup className="space-y-space-6" stagger={0.06}>
            {SKILLS.map((group) => (
              <div key={group.label} className="resume-entry">
                <h3 className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
                  {group.label}
                </h3>
                <ul className="mt-space-3 flex flex-wrap gap-space-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-[2px] border border-line px-space-3 py-space-2 text-caption text-fg"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </StaggerGroup>
        </Section>

        {/* 02 — Experience */}
        <Section index={1} label="Experience" id="experience">
          <StaggerGroup as="ul" stagger={0.08} y={28} className="space-y-space-8">
            {EXPERIENCE.map((job) => (
              <li key={job.company} className="resume-entry card-neon-row group">
                <EntryHead title={job.company} meta={job.meta} period={job.period} />
                <TimelineRail className="mt-space-5 space-y-space-6">
                  {job.roles.map((role) => (
                    <div key={`${role.title}-${role.period}`} className="resume-entry">
                      <div className="flex flex-col gap-space-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-space-3">
                        {/* Body face, not display — the role reads as a different
                            voice from the employer heading above it. */}
                        <Text variant="body-l" className="font-medium">
                          {role.title}
                          <span className="text-muted"> · {role.mode}</span>
                        </Text>
                        <span className="shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                          {role.period}
                        </span>
                      </div>
                      <Bullets items={role.bullets} />
                    </div>
                  ))}
                </TimelineRail>
              </li>
            ))}
          </StaggerGroup>
        </Section>

        {/* 03 — Selected projects */}
        <Section index={2} label="Selected projects" id="projects">
          <StaggerGroup as="ul" stagger={0.08} className="space-y-space-7">
            {PROJECTS.map((project) => (
              <li key={project.title} className="resume-entry card-neon-row group">
                <EntryHead
                  title={project.title}
                  meta={project.meta}
                  period={project.period}
                />
                <Bullets items={project.bullets} />
                {project.href && (
                  <Reveal className="mt-space-5" data-noprint>
                    <Button href={project.href} variant="secondary" className="group/cs">
                      Read the case study
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-[15px] w-[15px] shrink-0 transition-transform duration-fast ease-out-quad group-hover/cs:-translate-y-0.5 group-hover/cs:translate-x-0.5"
                      />
                    </Button>
                  </Reveal>
                )}
              </li>
            ))}
          </StaggerGroup>
        </Section>

        {/* 04 — Education */}
        <Section index={3} label="Education" id="education">
          <Reveal className="resume-entry card-neon-row group">
            <EntryHead
              title={EDUCATION.degree}
              meta={EDUCATION.school}
              period={EDUCATION.period}
            />
            <Bullets items={EDUCATION.notes} />
          </Reveal>
        </Section>

        {/* 05 — Certifications */}
        <Section index={4} label="Certifications" id="certifications">
          <StaggerGroup as="ul" stagger={0.05}>
            {CERTIFICATIONS.map((cert, i) => (
              <li
                key={cert.title}
                className={`resume-entry card-neon-row group py-space-5 ${
                  i === 0 ? "" : "border-t border-line"
                }`}
              >
                <div className="flex flex-col gap-space-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-space-4">
                  <Text
                    variant="body"
                    className="min-w-0 font-medium transition-colors duration-base ease-out-quad group-hover:text-neon"
                  >
                    {cert.title}
                  </Text>
                  {/* Issuer + date read as a plain dateline here, matching every
                      other row in the document. The verifiable-credential link
                      lives on About, where the certifications list is the
                      section rather than one line of a record. */}
                  <span className="shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    {cert.issuer} · {cert.date}
                  </span>
                </div>
                <Text variant="caption" className="mt-space-2 max-w-[var(--measure)] text-muted">
                  {cert.note}
                </Text>
              </li>
            ))}
          </StaggerGroup>
        </Section>

        {/* 06 — Languages & strengths */}
        <Section index={5} label="Languages & strengths" id="languages">
          <div className="grid gap-space-7 sm:grid-cols-2">
            <StaggerGroup as="dl" stagger={0.05} className="resume-entry">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.name}
                  className="flex items-baseline justify-between gap-space-4 border-b border-line py-space-3"
                >
                  <dt className="text-body text-fg">{lang.name}</dt>
                  <dd className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    {lang.level}
                  </dd>
                </div>
              ))}
            </StaggerGroup>
            <Reveal className="resume-entry">
              <ul className="flex flex-wrap gap-space-2">
                {STRENGTHS.map((strength) => (
                  <li
                    key={strength}
                    className="rounded-[2px] border border-line px-space-3 py-space-2 text-caption text-muted"
                  >
                    {strength}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Section>

        {/* Document colophon — closes the record, and prints. */}
        <div className="flex flex-wrap items-center justify-between gap-space-3 border-t border-line py-space-5">
          <span className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
            End of document
          </span>
          <span className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
            Praduan Saha · Rev {RESUME_UPDATED}
          </span>
        </div>
      </Container>

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      <Container as="section" className="pb-space-11" data-noprint>
        <Reveal
          as="div"
          className="card-neon relative isolate overflow-hidden rounded-[3px] border border-line p-space-8 sm:p-space-9"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              backgroundImage: "radial-gradient(currentColor 0.5px, transparent 0.5px)",
              backgroundSize: "18px 18px",
              color: "rgba(255,255,255,0.045)",
            }}
          />
          <Text as="h2" variant="display-l" className="max-w-[16ch] font-display">
            Take a copy with you.
          </Text>
          <Text variant="body-l" className="mt-space-4 max-w-[46ch] text-muted">
            The same document as a {RESUME_PAGES}-page PDF — or skip it and just
            tell me what you&apos;re building.
          </Text>
          <div className="mt-space-6 flex flex-wrap gap-space-4">
            <Magnetic className="inline-block">
              <Button href={RESUME_PDF} download variant="primary">
                Download PDF
              </Button>
            </Magnetic>
            <Magnetic className="inline-block">
              <Button href="/contact" variant="secondary">
                Get in touch
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </Container>
    </article>
  );
}
