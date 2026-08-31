import type { Metadata } from "next";
import { Container, Text } from "@/components/primitives";
import {
  Reveal,
  TextReveal,
  StaggerGroup,
  AnimatedNoise,
  AuroraEmber,
} from "@/components/motion";
import { site } from "@/lib/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a project or just say hello: send a message straight from the page, or reach Praduan Saha by email or LinkedIn.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact: Praduan Saha",
    description:
      "Start a project or just say hello: send a message straight from the page, or reach me by email or LinkedIn.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact: Praduan Saha",
    description:
      "Start a project or just say hello: send a message straight from the page, or reach me by email or LinkedIn.",
    images: ["/twitter-image"],
  },
};

// Left-column spec readout. Copy is DRAFT: each value is shown as an "e.g."
// example (a small mono tag, not a repeated "PLACEHOLDER" word). The owner
// replaces these with their own lines; nothing here is invented as fact.
// These are MY facts, stated plainly. They used to render behind an "e.g."
// prefix, which turned a response-time commitment into a vague suggestion and
// read as though the sender were being prompted to supply their own. How an
// engagement actually runs now lives on /services; this is just the readout.
const BLOCKS = [
  {
    label: "What I work on",
    value: "Operational B2B software: ledgers, consoles and multi-tenant tools",
  },
  {
    label: "Availability",
    value: "Open to freelance and contract projects",
  },
  {
    label: "Response time",
    value: "Within 1–2 working days (IST)",
  },
];

// The ink ramp as the spec indices: the site's structural signal layer, thin
// marks only. Weight carries position now, not hue.
const INDEX_HUES = [
  "var(--spectrum-violet)",
  "var(--spectrum-blue)",
  "var(--spectrum-amber)",
];

/*
 * Contact: the site's closing statement as an instrument "console": a spec
 * readout on the left (numbered, spectrum-indexed, hairline-ruled) and the
 * message form framed as an input panel on the right, with an email / LinkedIn
 * fallback beneath. Two columns at lg, stacks below.
 *
 * Atmosphere (§4/§7.8): soft monochrome radial glows + a spectrum aurora ember +
 * faint grain give the near-black depth; corner crosshair ticks frame the
 * section like an instrument. Decorative layers are aria-hidden / pointer-none;
 * the indices and panel crown are the tonal ink ramp, and the only real colour
 * is --error on the form's validation messages. Server Component; the form is a client
 * island (ContactForm).
 */
export default function Contact() {
  return (
    <section
      data-theme="dark"
      aria-labelledby="contact-heading"
      className="relative isolate flex min-h-[calc(80svh-4rem)] flex-col overflow-hidden bg-bg text-fg [@media(max-height:600px)]:min-h-0"
    >
      {/* Layer 0: atmosphere: two soft monochrome radial glows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 18% 24%, color-mix(in srgb, var(--fg) 6%, transparent), transparent 70%), radial-gradient(46% 58% at 86% 84%, color-mix(in srgb, var(--fg) 4%, transparent), transparent 72%)",
        }}
      />
      {/* The ember: the closing page still speaks in the site's voice. */}
      <AuroraEmber hue="signal" position="top-left" intensity={0.1} />

      {/* Layer 1: faint film grain over the glows, beneath the content. */}
      <AnimatedNoise opacity={0.035} className="-z-10" />

      {/* Corner crosshair ticks: frame the whole section like an instrument. */}
      {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map(
        (pos) => (
          <span
            key={pos}
            aria-hidden="true"
            className={`pointer-events-none absolute ${pos} m-space-5 h-space-4 w-space-4`}
            style={{
              borderTop: pos.includes("top") ? "1px solid var(--line)" : undefined,
              borderBottom: pos.includes("bottom") ? "1px solid var(--line)" : undefined,
              borderLeft: pos.includes("left") ? "1px solid var(--line)" : undefined,
              borderRight: pos.includes("right") ? "1px solid var(--line)" : undefined,
            }}
          />
        ),
      )}

      <Container className="relative z-10 flex flex-1 items-start py-space-10 [@media(max-height:600px)]:py-space-6">
        <div className="grid w-full grid-cols-1 gap-space-9 lg:grid-cols-12 lg:gap-space-9">
          {/* Left: the statement + the spec readout. */}
          <div className="lg:col-span-5">
            <Reveal trigger="load" delay={0.05}>
              <p className="flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.18em] text-muted">
                <span
                  aria-hidden
                  className="inline-block h-[7px] w-[7px]"
                  style={{ background: "var(--spectrum-gradient)" }}
                />
                Get in touch
              </p>
            </Reveal>

            <TextReveal
              id="contact-heading"
              as="h1"
              by="words"
              trigger="load"
              delay={0.12}
              className="mt-space-4 max-w-[13ch] font-display text-display-l"
            >
              {"Let's work together"}
            </TextReveal>

            <Reveal trigger="load" delay={0.36}>
              <Text variant="body-l" className="mt-space-5 max-w-[40ch] text-muted">
                {"Tell me what you're working on and where it stands: I read every message."}
              </Text>
            </Reveal>

            <StaggerGroup
              as="dl"
              trigger="load"
              delay={0.5}
              stagger={0.08}
              className="mt-space-9 border-t border-line"
            >
              {BLOCKS.map((block, i) => (
                <div
                  key={block.label}
                  className="flex items-baseline gap-space-5 border-b border-line py-space-5"
                >
                  <span
                    aria-hidden
                    className="font-mono text-caption tabular-nums"
                    style={{ color: INDEX_HUES[i] }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <dt className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
                      {block.label}
                    </dt>
                    <dd className="mt-space-2 max-w-[34ch] text-body text-muted">
                      {block.value}
                    </dd>
                  </div>
                </div>
              ))}
            </StaggerGroup>
          </div>

          {/* Right: the message form, framed as an input panel. */}
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal trigger="load" delay={0.3}>
              <div className="relative overflow-hidden rounded-[3px] border border-line bg-surface p-space-6 sm:p-space-7">
                {/* Spectrum crown: the wayfinding signal across the panel top. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background: "var(--spectrum-gradient)",
                    opacity: 0.55,
                    maskImage:
                      "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
                    WebkitMaskImage:
                      "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
                  }}
                />
                <p className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
                  Send a message
                </p>
                <div className="mt-space-6">
                  <ContactForm />
                </div>
              </div>
            </Reveal>

            <div className="mt-space-6 flex flex-wrap items-center gap-x-space-6 gap-y-space-2">
              <span className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                Prefer email?
              </span>
              <a
                href={`mailto:${site.email}`}
                className="text-body text-fg transition-colors duration-fast ease-out-quad hover:text-neon"
              >
                {site.email}
              </a>
              <a
                href={site.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body text-fg transition-colors duration-fast ease-out-quad hover:text-neon"
              >
                LinkedIn ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
