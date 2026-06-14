import type { Metadata } from "next";
import { Container, Text, Eyebrow, Link, Button } from "@/components/primitives";
import { Reveal, StaggerGroup, TextReveal, AnimatedNoise } from "@/components/motion";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Have a project in mind, or just want to say hello? Email is the fastest way to reach Praduan Saha.",
};

// Email + LinkedIn + location (phone intentionally left off — Content/Site.md).
const CHANNELS = [
  {
    label: "Email",
    value: "spraduan@gmail.com",
    href: "mailto:spraduan@gmail.com",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/praduan-saha-9a8965172",
    href: "https://www.linkedin.com/in/praduan-saha-9a8965172",
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
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-bg text-fg"
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

      <Container className="relative z-10 flex flex-1 items-center py-space-10">
        <div className="grid w-full grid-cols-1 items-center gap-space-9 md:grid-cols-12 md:gap-space-8">
          {/* Left — the focal statement. Oversized headline as the moment. */}
          <div className="md:col-span-7 lg:col-span-7">
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
          <div className="md:col-span-5 lg:col-start-9 lg:col-span-4">
            <Reveal as="div" trigger="load" delay={0.3}>
              {/* bg-surface (a var() token) can't take a /opacity modifier — it
                  silently no-ops — so the panel uses the solid raised surface. */}
              <div className="card-neon rounded-[3px] border border-line bg-surface p-space-7">
                <Eyebrow>Channels</Eyebrow>
                <StaggerGroup as="dl" className="mt-space-5" trigger="load" delay={0.5} stagger={0.08}>
                  {CHANNELS.map((channel) => (
                    <div
                      key={channel.label}
                      className="card-neon-row flex flex-col gap-space-1 border-t border-line py-space-4 first:border-t-0 first:pt-0"
                    >
                      <dt className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
                        {channel.label}
                      </dt>
                      <dd>
                        {channel.href ? (
                          <Link href={channel.href} className="text-body">
                            {channel.value}
                          </Link>
                        ) : (
                          <span className="text-body">{channel.value}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </StaggerGroup>

                <Reveal
                  as="div"
                  trigger="load"
                  delay={0.7}
                  className="mt-space-7 flex flex-col gap-space-3"
                >
                  <Button
                    href="mailto:spraduan@gmail.com"
                    variant="primary"
                    className="w-full"
                  >
                    Email me
                  </Button>
                  <Button
                    href="https://www.linkedin.com/in/praduan-saha-9a8965172"
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
