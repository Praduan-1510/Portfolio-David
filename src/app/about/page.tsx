import type { Metadata } from "next";
import Image from "next/image";
import { Container, Text, Eyebrow, Button } from "@/components/primitives";
import {
  Reveal,
  StaggerGroup,
  AnimatedDivider,
  Marquee,
  CountUp,
  Magnetic,
  PortraitFrame,
} from "@/components/motion";
import { spectrumAt } from "@/lib/spectrum";
import { TimelineRail } from "./TimelineRail";
import { ProfileHero } from "./ProfileHero";

export const metadata: Metadata = {
  title: "About",
  description:
    "Graphic and UI/UX designer based in Kolkata — creating digital experiences through systematic design thinking and precise execution.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Praduan Saha",
    description:
      "Graphic and UI/UX designer based in Kolkata — creating digital experiences through systematic design thinking and precise execution.",
  },
  twitter: {
    title: "About — Praduan Saha",
    description:
      "Graphic and UI/UX designer based in Kolkata — creating digital experiences through systematic design thinking and precise execution.",
  },
};

const BIO = [
  "I'm Praduan Saha, a graphic and UI/UX designer born and raised in Asansol, West Bengal, and now based in Kolkata. Since 2019 I've worked across content development, learning design, and visual and product design — happiest at the point where a messy, complex idea turns into something clear, usable, and good-looking, whether that's a mobile flow, a landing page, or a full brand system.",
  "My path ran from content and instructional design into graphic and UI/UX design, so I think as much about structure and information as I do about how something looks. I work primarily in Figma — wireframing, prototyping, and building reusable components — and I care about hierarchy, accessibility, and shipping work that actually supports the goal behind it.",
  "I studied English (Honours) at Amity University, Kolkata, which still shapes how I approach design: reading closely, structuring information, and communicating clearly. A creative mindset, a positive outlook, and strong communication are what I lean on to lead work and collaborate well across a team.",
];

// Kinetic band — the disciplines, set as a marquee.
const DISCIPLINES = [
  "UI/UX Design",
  "Brand & Identity",
  "Design Systems",
  "Prototyping",
  "Visual Design",
  "Instructional Design",
  "Front-end",
  "Motion",
];

const APPROACH = [
  {
    title: "Clarity first.",
    body: "Make the complex easy to understand and use — structure and hierarchy before decoration.",
  },
  {
    title: "Systems, not one-offs.",
    body: "Reusable components and a consistent visual language, so the work scales and stays coherent.",
  },
  {
    title: "Design with a purpose.",
    body: "Every screen serves a real user need and a real goal, not just an aesthetic.",
  },
];

const CAPABILITIES = [
  {
    title: "UI/UX design (web & mobile)",
    body: "Wireframing, user flows, information architecture, high-fidelity UI, interactive prototyping.",
  },
  {
    title: "Visual design & branding",
    body: "Identity and brand work, visual systems, marketing and campaign creative, pitch decks.",
  },
  {
    title: "Design systems & accessibility",
    body: "Reusable component libraries, consistent tokens, usability and accessibility.",
  },
  {
    title: "Content & multimedia",
    body: "Instructional/learning design, infographics, and interactive content that makes complex topics easy to absorb.",
  },
];

const TOOLS =
  "Figma, Adobe Creative Suite, Canva, WordPress, HubSpot, Microsoft Office, plus audio/multimedia editing tools.";

// Each entry is a company that holds one or more roles. Single-role companies
// have a one-item `roles` array; multi-role companies (e.g. InsightsTap) group
// their positions under one company header.
const EXPERIENCE = [
  {
    company: "InsightsTap",
    meta: "Kolkata, India",
    roles: [
      {
        title: "Graphic Designer · Full-time",
        period: "On-site · Feb 2026 – Present",
        body: "Crafting visually impactful, brand-aligned designs that turn ideas into engaging digital experiences, working closely with cross-functional teams. Also led the front-end development and visual overhaul of the InsightsTap marketing site, translating complex go-to-market (GTM) data concepts into a clean, usable interface.",
      },
      {
        title: "Graphic Designer · Internship",
        period: "Remote · Sep 2025 – Feb 2026",
        body: "Brought visual ideas to life through impactful design and branding, blending artistic vision with strategic thinking. Built on-brand creatives and UI concepts in Figma — carousels, ad visuals, banners, and pitch decks.",
      },
    ],
  },
  {
    company: "Creative Designer",
    roles: [
      {
        title: "Freelance",
        period: "Remote · Jan 2022 – Oct 2025",
        body: "Freelance work across content writing, photo and video editing, and instructional design, delivering creative assets for a range of clients.",
      },
    ],
  },
  {
    company: "Simplilearn",
    meta: "Bengaluru, India",
    roles: [
      {
        title: "Learning Designer · Full-time",
        period: "Nov 2021 – Oct 2022",
        body: "Designed end-to-end digital learning flows for professional certification courses — modular content, clear navigation, and multimedia — alongside subject-matter experts. Restructured course layouts to improve usability and completion.",
      },
    ],
  },
  {
    company: "LeadsArk",
    roles: [
      {
        title: "Content Developer · Full-time",
        period: "Remote · Mar 2019 – Sep 2021",
        body: "Built presentations and content on social-media marketing topics — Facebook, Instagram, and email marketing — and reviewed video content. Standardized layouts and typography across content series for a consistent look.",
      },
    ],
  },
];

const CERTIFICATIONS = [
  { title: "Graphic Design", issuer: "Adobe", year: "2026" },
  { title: "SEO", issuer: "HubSpot Academy", year: "2026" },
  {
    title: "WordPress 2026: The Complete WordPress Website Course",
    issuer: "Udemy",
    year: "2026",
  },
  { title: "Figma UX/UI Design Essentials", issuer: "Udemy", year: "2025" },
  {
    title: "Complete Web & Mobile Designer: UI/UX, Figma & more",
    issuer: "Udemy",
    year: "2025",
  },
];

const EDUCATION = [
  {
    label: "Education",
    value: "B.A. English (Honours), Amity University, Kolkata · 2018 – 2021",
  },
];

const LANGUAGES =
  "English (fluent) · Bengali (fluent) · Hindi (fluent) · French (beginner)";

// Real, content-derived figures — nothing fabricated.
const STATS = [
  { value: new Date().getFullYear() - 2019, suffix: "", label: "years in design" },
  { value: CAPABILITIES.length, suffix: "", label: "core disciplines" },
  { value: CERTIFICATIONS.length, suffix: "", label: "certifications" },
  { value: LANGUAGES.split(" · ").length, suffix: "", label: "languages" },
];

// Minimal monochrome line glyphs for the four capabilities (decorative).
function CapabilityGlyph({ i }: { i: number }) {
  const p = {
    width: 30,
    height: 30,
    viewBox: "0 0 28 28",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (i) {
    case 0: // UI/UX — a screen with a cursor
      return (
        <svg {...p}>
          <rect x="5" y="3.5" width="18" height="21" rx="2.5" />
          <line x1="5" y1="9" x2="23" y2="9" />
          <path d="M9 13.5h6M9 17h9" />
          <path d="M17.5 16.8l4 4-2 .3 1 1.9" />
        </svg>
      );
    case 1: // Visual & branding — overlapping circle + square
      return (
        <svg {...p}>
          <circle cx="11" cy="15" r="6.5" />
          <rect x="12.5" y="6.5" width="9.5" height="9.5" rx="1.5" />
        </svg>
      );
    case 2: // Systems & a11y — connected nodes
      return (
        <svg {...p}>
          <path d="M8 9.5l11-1.6M19 9l-1.6 9.6M16.5 19.4l-7-1M8.5 16.5l.7-5.6" />
          <circle cx="7.5" cy="9.5" r="2.3" />
          <circle cx="20.5" cy="7.5" r="2.3" />
          <circle cx="17" cy="20" r="2.3" />
          <circle cx="8.5" cy="18" r="2.3" />
        </svg>
      );
    default: // Content & multimedia — a play frame + baseline
      return (
        <svg {...p}>
          <rect x="3.5" y="5.5" width="21" height="13.5" rx="2" />
          <path d="M11.5 9.5l5 3.2-5 3.2z" />
          <path d="M6.5 23h15" />
        </svg>
      );
  }
}

export default function About() {
  return (
    <>
      {/* ── Hero ─ the whole section is the instrument: a full-bleed motion map
          under the profile statement (see ProfileHero / HeroMap). ───────────── */}
      <ProfileHero />

      {/* ── Disciplines marquee ─ kinetic band ──────────────────────────── */}
      <section
        aria-label="Disciplines"
        className="overflow-hidden border-y border-line py-space-6"
      >
        <Marquee
          speed={32}
          items={DISCIPLINES.map((d, i) => (
            <span key={d} className="inline-flex items-center gap-space-5">
              {/* Diamond separators step through the spectrum so the band carries a
                  quiet moving sweep of colour; the words stay monochrome. */}
              <span
                aria-hidden="true"
                className="inline-block h-[6px] w-[6px] rotate-45"
                style={{ backgroundColor: spectrumAt(i) }}
              />
              <span className="font-display text-[clamp(1.5rem,3.6vw,2.5rem)] font-medium tracking-[-0.01em] text-muted">
                {d}
              </span>
            </span>
          ))}
        />
      </section>

      {/* ── Stat gauges ─ content-derived figures that tick up ──────────── */}
      <Container as="section" className="py-space-9">
        <StaggerGroup
          as="dl"
          className="grid grid-cols-2 gap-x-space-6 gap-y-space-7 sm:grid-cols-4"
          stagger={0.08}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="card-neon-row group flex flex-col-reverse gap-space-2 border-t border-line pt-space-4"
            >
              <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                {s.label}
              </dt>
              <dd className="font-display text-display-l leading-none text-fg transition-colors duration-base ease-out-quad group-hover:text-neon">
                <CountUp value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </StaggerGroup>
      </Container>

      {/* ── Bio ─────────────────────────────────────────────────────────── */}
      <Container as="section" className="pb-space-9">
        <div className="grid gap-space-6 md:grid-cols-[auto_1fr] md:gap-space-9">
          <Reveal as="div" y={12} className="md:pt-space-2">
            <Eyebrow>Bio</Eyebrow>
          </Reveal>
          <div className="grid items-start gap-space-8 lg:grid-cols-[1fr_auto] lg:gap-space-9">
            <StaggerGroup className="max-w-[var(--measure)] space-y-space-4" stagger={0.08}>
              {BIO.map((para, i) => (
                <Text key={i} variant={i === 0 ? "body-l" : "body"} className="text-muted">
                  {para}
                </Text>
              ))}
            </StaggerGroup>
            {/* Portrait — same four-side feather + PortraitFrame dynamics as the
                home teaser (clip-wipe entrance + scroll breath + desktop pointer
                tilt), floating beside the bio with no hard border. */}
            <PortraitFrame
              delay={0.1}
              className="portrait-frame group relative mx-auto aspect-[4/5] w-full max-w-[20rem] overflow-hidden lg:w-[19rem] lg:max-w-none"
            >
              <Image
                src="/images/about/portrait.webp"
                alt="Praduan Saha on a tree-lined path in Kolkata"
                fill
                sizes="(min-width: 1024px) 19rem, (min-width: 768px) 40vw, 80vw"
                placeholder="blur"
                blurDataURL="data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADwAQCdASoMAA8AA4BaJaQAArL079cHM0AA/oOGxqwDGhDz99VmzWx2x3nwOyeIDoqLoPgyN/J98JGfhrAyTXTP+UUuYx/qbFBrUg6wY9LOJ/yQAAA="
                className="about-portrait object-cover object-center transition-transform duration-slow ease-out-quad motion-safe:group-hover:scale-[1.03]"
              />
            </PortraitFrame>
          </div>
        </div>
      </Container>

      <Container>
        <AnimatedDivider spectrum />
      </Container>

      {/* ── Approach ─ numbered principles ──────────────────────────────── */}
      <Container as="section" className="py-space-10">
        <Reveal as="div" y={12}>
          <Eyebrow>Approach</Eyebrow>
        </Reveal>
        <StaggerGroup className="mt-space-6 grid grid-cols-1 gap-space-6 md:grid-cols-3">
          {APPROACH.map((item, i) => (
            <div
              key={item.title}
              className="group/appr relative border-t border-line pt-space-5"
            >
              {/* draw-in neon accent over the hairline on hover */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-full origin-left scale-x-0 bg-neon transition-transform duration-base ease-out-quad group-hover/appr:scale-x-100"
              />
              {/* Index in its spectrum hue at rest; the neon interaction signal
                  still takes over on hover. */}
              <span
                className="font-mono text-caption text-[var(--idx)] transition-colors duration-base ease-out-quad group-hover/appr:text-neon"
                style={{ "--idx": spectrumAt(i) } as React.CSSProperties}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <Text
                as="h2"
                variant="body-l"
                className="mt-space-3 font-display font-medium transition-colors duration-base ease-out-quad group-hover/appr:text-neon"
              >
                {item.title}
              </Text>
              <Text variant="body" className="mt-space-2 text-muted">
                {item.body}
              </Text>
            </div>
          ))}
        </StaggerGroup>
      </Container>

      {/* ── Capabilities ─ glyph cards ──────────────────────────────────── */}
      <Container as="section" className="pb-space-10">
        <Reveal as="div" y={12}>
          <Eyebrow>Capabilities</Eyebrow>
        </Reveal>
        <StaggerGroup className="mt-space-6 grid grid-cols-1 gap-space-5 sm:grid-cols-2">
          {CAPABILITIES.map((item, i) => (
            <div
              key={item.title}
              className="card-neon group/cap relative overflow-hidden rounded-[3px] border border-line p-space-6"
            >
              <div className="flex items-start gap-space-5">
                <span className="shrink-0 text-fg transition-[transform,color] duration-base ease-out-quad group-hover/cap:-translate-y-1 group-hover/cap:text-neon">
                  <CapabilityGlyph i={i} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-space-3">
                    <span
                      className="font-mono text-caption"
                      style={{ color: spectrumAt(i) }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Text
                      as="h2"
                      variant="body-l"
                      className="font-display font-medium transition-colors duration-base ease-out-quad group-hover/cap:text-neon"
                    >
                      {item.title}
                    </Text>
                  </div>
                  <Text variant="body" className="mt-space-2 text-muted">
                    {item.body}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </StaggerGroup>
        <Reveal>
          <Text
            variant="caption"
            className="mt-space-6 font-mono uppercase tracking-[0.12em] text-muted"
          >
            Tools: {TOOLS}
          </Text>
        </Reveal>
      </Container>

      <Container>
        <AnimatedDivider spectrum />
      </Container>

      {/* ── Experience ─ the timeline draws on scroll ───────────────────── */}
      <Container as="section" className="py-space-10">
        <Reveal as="div" y={12}>
          <Eyebrow>Experience</Eyebrow>
        </Reveal>
        <StaggerGroup as="ul" className="mt-space-6" stagger={0.08} y={32}>
          {EXPERIENCE.map((job) => (
            <li key={job.company} className="card-neon-row group border-t border-line py-space-6">
              <div className="flex flex-wrap items-baseline justify-between gap-space-3">
                <Text
                  as="h2"
                  variant="heading"
                  className="font-display transition-colors duration-base ease-out-quad group-hover:text-neon"
                >
                  {job.company}
                </Text>
                {job.meta && (
                  <span className="shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                    {job.meta}
                  </span>
                )}
              </div>
              <TimelineRail className="mt-space-4 space-y-space-5">
                {job.roles.map((role) => (
                  <div key={role.title}>
                    <div className="flex flex-wrap items-baseline justify-between gap-space-3">
                      <Text variant="body-l" className="font-display font-medium">
                        {role.title}
                      </Text>
                      <span className="shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                        {role.period}
                      </span>
                    </div>
                    <Text variant="body" className="mt-space-2 max-w-[var(--measure)] text-muted">
                      {role.body}
                    </Text>
                  </div>
                ))}
              </TimelineRail>
            </li>
          ))}
          {EDUCATION.map((item) => (
            <li
              key={item.label}
              className="card-neon-row flex flex-wrap items-baseline justify-between gap-space-3 border-t border-line py-space-5"
            >
              <span className="shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                {item.label}
              </span>
              <span className="text-body">{item.value}</span>
            </li>
          ))}
        </StaggerGroup>
      </Container>

      <Container>
        <AnimatedDivider spectrum />
      </Container>

      {/* ── Certifications ──────────────────────────────────────────────── */}
      <Container as="section" className="py-space-10">
        <Reveal as="div" y={12}>
          <Eyebrow>Certifications</Eyebrow>
        </Reveal>
        <StaggerGroup as="ul" className="mt-space-6" stagger={0.06}>
          {CERTIFICATIONS.map((cert) => (
            <li
              key={cert.title}
              className="card-neon-row group flex flex-wrap items-baseline justify-between gap-space-3 border-t border-line py-space-5"
            >
              <span className="text-body transition-colors duration-base ease-out-quad group-hover:text-neon">
                {cert.title}
              </span>
              <span className="shrink-0 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                {cert.issuer} · {cert.year}
              </span>
            </li>
          ))}
        </StaggerGroup>
      </Container>

      {/* ── Languages ───────────────────────────────────────────────────── */}
      <Container as="section" className="pb-space-10">
        <Reveal as="div" y={12}>
          <Eyebrow>Languages</Eyebrow>
        </Reveal>
        <Reveal>
          <Text variant="body-l" className="mt-space-4">
            {LANGUAGES}
          </Text>
        </Reveal>
      </Container>

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      <Container as="section" className="pb-space-11">
        <Reveal
          as="div"
          className="card-neon relative isolate overflow-hidden rounded-[3px] border border-line p-space-8 sm:p-space-9"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 0.5px, transparent 0.5px)",
              backgroundSize: "18px 18px",
              color: "rgba(255,255,255,0.045)",
            }}
          />
          <Text as="h2" variant="display-l" className="max-w-[18ch] font-display">
            Have something worth building?
          </Text>
          <div className="mt-space-6 flex flex-wrap gap-space-4">
            <Magnetic className="inline-block">
              <Button href="/contact" variant="primary">
                Get in touch
              </Button>
            </Magnetic>
            <Magnetic className="inline-block">
              <Button href="/work" variant="secondary">
                View work
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </Container>
    </>
  );
}
