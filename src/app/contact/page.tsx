import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Container, Text, Eyebrow, Button } from "@/components/primitives";
import { Reveal, StaggerGroup, TextReveal, AnimatedNoise } from "@/components/motion";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Have a project in mind, or just want to say hello? Email is the fastest way to reach Praduan Saha.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — Praduan Saha",
    description:
      "Have a project in mind, or just want to say hello? Email is the fastest way to reach Praduan Saha.",
  },
  twitter: {
    title: "Contact — Praduan Saha",
    description:
      "Have a project in mind, or just want to say hello? Email is the fastest way to reach Praduan Saha.",
  },
};

// Email + LinkedIn + location (phone intentionally left off — Content/Site.md).
// Values are the human-readable display; the raw URL lives in `href`. The old
// LinkedIn row printed the full URL (linkedin.com/in/praduan-saha-9a8965172),
// which wrapped to two broken lines — the display is a clean vanity handle instead.
const CHANNELS = [
  {
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
  },
  {
    label: "LinkedIn",
    value: "in/praduan-saha",
    href: site.linkedIn,
  },
  { label: "Location", value: "Kolkata, West Bengal, India" },
];

/*
 * Contact — a confident, full-height statement rather than a top-left cluster.
 *
 * Composition (DESIGN_GUIDELINES.md §3/§6): the viewport-tall section is split
 * into two balanced regions on a 12-col grid — an OVERSIZED display-xl headline
 * (the focal TextReveal) on the left, and a framed "contact panel" of channels +
 * CTAs on the right that anchors the empty half and reads as one composed layout.
 * Stacks to a single centered column below md.
 *
 * Atmosphere (§4/§7.8): a soft off-white radial vignette top-left behind the
 * headline + a fainter one bottom-right behind the panel give the near-black
 * depth instead of flat black; AnimatedNoise adds purposeful grain; corner
 * crosshair ticks echo the About InstrumentPanel's instrument language. All
 * decorative layers are aria-hidden and pointer-events:none. Colour stays
 * monochrome — data-theme="dark" only marks the dark surface (no accent remap),
 * so the chrome remains colourless (§4).
 *
 * Server Component: the static atmosphere is plain CSS; motion comes entirely
 * from the existing client islands (Reveal/TextReveal/StaggerGroup) and
 * AnimatedNoise. Reduced motion → every primitive renders its content static and
 * fully visible (§10); the layout never depends on the animation.
 */
export default function Contact() {
  return (
    <section
      data-theme="dark"
      aria-labelledby="contact-heading"
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-bg text-fg [@media(max-height:600px)]:min-h-0"
    >
      {/* Layer 0 — atmosphere: two soft monochrome radial glows give the dark
          depth and a diagonal balance (headline ↘ panel), beneath the grain. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 18% 28%, rgba(255,255,255,0.06), transparent 70%), radial-gradient(48% 60% at 88% 82%, rgba(255,255,255,0.035), transparent 72%)",
        }}
      />
      {/* Layer 1 — faint film grain over the glows, beneath the content. */}
      <AnimatedNoise opacity={0.035} className="-z-10" />

      {/* Corner crosshair ticks — frame the whole section like an instrument. */}
      {[
        "left-0 top-0",
        "right-0 top-0",
        "left-0 bottom-0",
        "right-0 bottom-0",
      ].map((pos) => (
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
      ))}

      <Container className="relative z-10 flex flex-1 items-center py-space-10 [@media(max-height:600px)]:py-space-6">
        {/* The two-column split waits for lg — at 768px the panel column is so
            narrow the email address breaks mid-word. lg:items-start keeps the
            panel's top aligned with the eyebrow instead of floating mid-column. */}
        <div className="grid w-full grid-cols-1 gap-space-9 lg:grid-cols-12 lg:items-start lg:gap-space-8">
          {/* Left — the focal statement. Oversized headline as the moment. */}
          <div className="lg:col-span-7">
            <Reveal as="div" y={12} trigger="load">
              <Eyebrow>Contact</Eyebrow>
            </Reveal>
            <TextReveal
              id="contact-heading"
              as="h1"
              by="words"
              trigger="load"
              delay={0.1}
              className="font-display text-display-xl mt-space-4 max-w-[14ch]"
            >
              {"Let's work together"}
            </TextReveal>
            <Reveal trigger="load" delay={0.4}>
              <Text variant="body-l" className="mt-space-6 max-w-[46ch] text-muted">
                {"Have a project in mind, or just want to say hello? Email is the fastest way to reach me — I'll get back to you."}
              </Text>
            </Reveal>
          </div>

          {/* Right — the contact panel: channels + CTAs, framed so it balances
              the headline and fills the formerly-empty half. */}
          <div className="lg:col-start-9 lg:col-span-4">
            <Reveal as="div" trigger="load" delay={0.3}>
              {/* bg-surface (a var() token) can't take a /opacity modifier — it
                  silently no-ops — so the panel uses the solid raised surface. */}
              <div className="card-neon relative overflow-hidden rounded-[3px] border border-line bg-surface p-space-7">
                {/* Spectrum thread across the panel crown — the wayfinding signal,
                    consistent with the home CTA and footer (faded ends). */}
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
                <Eyebrow>Channels</Eyebrow>
                {/* Each channel is a full-width row: a mono label tag over a clean
                    value, with a trailing arrow on the links. The whole row is the
                    target (lights to neon + the arrow drifts on hover); the static
                    Location row carries no arrow, so interactive vs. info reads at a
                    glance. Replaces the old stacked dt/dd where the raw LinkedIn URL
                    wrapped into two broken lines. */}
                <StaggerGroup as="div" className="mt-space-5" trigger="load" delay={0.5} stagger={0.08}>
                  {CHANNELS.map((channel) => {
                    const rowClass =
                      "flex items-start justify-between gap-space-4 border-t border-line py-space-4 first:border-t-0 first:pt-0";
                    const body = (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-caption uppercase tracking-[0.16em] text-muted">
                            {channel.label}
                          </span>
                          <span
                            className={cn(
                              "mt-space-2 block text-body-l text-fg",
                              channel.href &&
                                "break-words transition-colors duration-fast ease-out-quad group-hover:text-neon",
                            )}
                          >
                            {channel.value}
                          </span>
                        </span>
                        {channel.href && (
                          <ArrowUpRight
                            aria-hidden="true"
                            className="mt-[2px] h-[18px] w-[18px] shrink-0 text-muted transition-[transform,color] duration-fast ease-out-quad group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neon"
                          />
                        )}
                      </>
                    );
                    return channel.href ? (
                      <a
                        key={channel.label}
                        href={channel.href}
                        target={/^https?:/.test(channel.href) ? "_blank" : undefined}
                        rel={/^https?:/.test(channel.href) ? "noreferrer noopener" : undefined}
                        aria-label={`${channel.label}: ${channel.value}${/^https?:/.test(channel.href) ? " (opens in a new tab)" : ""}`}
                        className={cn("card-neon-row group rounded-[2px]", rowClass)}
                      >
                        {body}
                      </a>
                    ) : (
                      <div key={channel.label} className={rowClass}>
                        {body}
                      </div>
                    );
                  })}
                </StaggerGroup>

                <Reveal
                  as="div"
                  trigger="load"
                  delay={0.7}
                  className="mt-space-7 flex flex-col gap-space-3"
                >
                  <Button
                    href={`mailto:${site.email}`}
                    variant="primary"
                    className="w-full"
                  >
                    Email me
                  </Button>
                  <Button
                    href={site.linkedIn}
                    target="_blank"
                    variant="secondary"
                    className="w-full"
                  >
                    Connect on LinkedIn
                  </Button>
                </Reveal>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
