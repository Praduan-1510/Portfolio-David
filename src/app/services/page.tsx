import type { Metadata } from "next";
import NextLink from "next/link";
import { Container, Text, Button } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider, StaggerGroup, Magnetic } from "@/components/motion";
import { getProjectBySlug } from "@/lib/content/work";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Product design and production front-end for operational B2B software: working prototypes, shipped interfaces, and design systems. How an engagement runs, and what I don't take on.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services: Praduan Saha",
    description:
      "Product design and production front-end for operational B2B software. How an engagement runs, and what I don't take on.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Services: Praduan Saha",
    description:
      "Product design and production front-end for operational B2B software. How an engagement runs, and what I don't take on.",
    images: ["/twitter-image"],
  },
};

/*
 * /services: the one page on this site written for a CLIENT rather than an
 * employer.
 *
 * Everything else here — the work index, the timeline, the résumé — answers
 * "should we hire this person". None of it answers "can I engage you, how does
 * that run, and what will it cost me", which is the question someone with a
 * budget actually arrives with.
 *
 * Two rules shape it. Every offer names the case study that proves it, because
 * an unevidenced service list is the single most generic artefact in this
 * industry and the rest of the site earns the right not to be that. And the
 * page says what it declines, which is a stronger filter than anything it
 * claims — the enquiries it turns away are the ones worth not having.
 */

/** Each offer points at work that already demonstrates it. */
const OFFERS = [
  {
    id: "prototype",
    title: "Prototype the risky part",
    lede:
      "Before a team commits engineering time to the flow that decides the product, build that flow for real and use it.",
    body:
      "Not a clickable mockup: a working build that enforces its own rules, so the question stops being whether the model reads well and becomes whether it survives contact. Permissions that actually gate, ledgers that actually refuse to be edited, states you can drive rather than describe. Cheapest possible way to find out a model is incoherent, while it still costs a fortnight instead of a quarter.",
    proof: "omnistock",
    good: "A model nobody can agree on, a spec that keeps growing, or a decision that keeps getting deferred because no artefact settles it.",
  },
  {
    id: "ship",
    title: "Design it and ship the front-end",
    lede:
      "Interface design through to the production front-end, on one component system, by one person.",
    body:
      "The handoff is where most of the design goes missing — not through bad faith, but because a static file cannot specify motion, empty states, focus order, or what happens at 320px. When the same person designs and builds, none of that needs specifying. What ships is what was designed, and it is accountable to real numbers: performance, accessibility, and layout stability, measured rather than asserted.",
    proof: "insightstap",
    good: "A marketing site or product surface where the gap between the comp and the live page keeps costing you time.",
  },
  {
    id: "system",
    title: "Build the design system",
    lede:
      "Tokens, components, and the accessibility and contrast rules built into the system rather than checked at the end.",
    body:
      "A component library is the easy half. The hard half is the decisions underneath it: how many status colours the product is allowed, what contrast every state has to clear, which figures are derived and can never be typed. Systems that hold up are the ones where those rules live in the tokens, so the wrong thing is difficult to build rather than merely discouraged in a doc.",
    proof: "meridian",
    good: "A product where every new screen restarts the same arguments, or where accessibility keeps arriving as a late fix.",
  },
] as const;

/** The engagement, stated plainly enough to be checked against. */
const PROCESS = [
  {
    step: "Scoping call",
    detail:
      "Free, 30 minutes. You describe the problem and where it stands. If I am not the right person, I say so on that call.",
  },
  {
    step: "Written proposal",
    detail:
      "Scope, deliverables, timeline, and a fixed price, in writing, before anything starts. No hourly billing and no open-ended scope.",
  },
  {
    step: "The work, in the open",
    detail:
      "Progress is visible as it happens rather than revealed at a milestone. You see the thing running, early and often, and can change direction while changing direction is still cheap.",
  },
  {
    step: "Handover",
    detail:
      "Source files, the running build, and the reasoning: what was decided, what was rejected, and which parts are still hypotheses. You should not need me afterwards to understand it.",
  },
] as const;

/** What I need from you, said up front because it is the usual failure mode. */
const NEEDS = [
  "One person who can decide. Design by committee is where timelines go, and it is not a scheduling problem.",
  "Access to whoever knows the domain — the operations lead, the accountant, the person who actually files the returns.",
  "Real data, or a real description of it. Products like these fail on the edge cases, and lorem ipsum has no edge cases.",
] as const;

/** The declines. This filters harder than any claim above it. */
const DECLINES = [
  {
    what: "Design-only handoff on a system I cannot see running",
    why: "For state-heavy products, a comp of one role at one moment is not enough to know whether the model is coherent. I would be selling you confidence I do not have.",
  },
  {
    what: "Pitch decks, social creative, and marketing collateral as standalone work",
    why: "I have done a lot of it and can, but it is not what this practice is for, and you can get it better and cheaper elsewhere.",
  },
  {
    what: "Rescue work with a fixed launch date already announced",
    why: "The first thing a rescue needs is permission to change scope. If the date cannot move, what you need is more engineers, not a designer.",
  },
  {
    what: "Anything requiring me to claim results I did not produce",
    why: "Everything on this site is labelled for what it is, including the concepts and the untested hypotheses. That does not have an exception.",
  },
] as const;

export default function ServicesPage() {
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
            Working together
          </p>
        </Reveal>

        <TextReveal
          as="h1"
          by="words"
          trigger="load"
          delay={0.12}
          className="mt-space-4 max-w-[18ch] font-display text-display-l"
        >
          Operational software, designed and shipped.
        </TextReveal>

        <Reveal trigger="load" delay={0.3}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            I work on the tools businesses run on: ledgers, consoles, and
            multi-tenant products where trust, state, and permissions are the
            hard part. Three ways that usually starts, each one pointing at work
            on this site that already did it.
          </Text>
        </Reveal>

        <AnimatedDivider className="mt-space-8" />
      </Container>

      {/* ── The offers ── */}
      <Container as="section" aria-labelledby="offers" className="pb-space-9">
        <h2 id="offers" className="sr-only">
          What I do
        </h2>
        <StaggerGroup as="ol" from="below">
          {OFFERS.map((offer, i) => {
            const project = getProjectBySlug(offer.proof);
            return (
              <li
                key={offer.id}
                className="border-t border-line py-space-8 first:border-t-0 first:pt-0"
              >
                <div className="grid gap-space-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-space-9">
                  <div className="min-w-0">
                    <span
                      aria-hidden="true"
                      className="font-mono text-caption tabular-nums text-muted"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Text
                      variant="heading"
                      as="h3"
                      className="mt-space-3 max-w-[20ch] font-display"
                    >
                      {offer.title}
                    </Text>
                    <Text
                      variant="body-l"
                      className="mt-space-4 max-w-[var(--measure)] text-fg"
                    >
                      {offer.lede}
                    </Text>
                    <Text variant="body" className="mt-space-4 max-w-[var(--measure)] text-muted">
                      {offer.body}
                    </Text>
                  </div>

                  <aside className="min-w-0 border-t border-line pt-space-5 lg:border-l lg:border-t-0 lg:pl-space-7 lg:pt-0">
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                      Right when
                    </p>
                    <Text variant="body" className="mt-space-3 text-muted">
                      {offer.good}
                    </Text>
                    {project && (
                      <>
                        <p className="mt-space-6 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                          Proof
                        </p>
                        <NextLink
                          href={`/work/${project.meta.slug}`}
                          className="group mt-space-3 inline-flex items-baseline gap-space-2 font-mono text-[0.8125rem] uppercase tracking-[0.1em] text-fg transition-colors duration-fast ease-out-quad hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
                        >
                          {project.meta.title}
                          <span
                            aria-hidden="true"
                            className="transition-transform duration-base ease-out-quad group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </NextLink>
                      </>
                    )}
                  </aside>
                </div>
              </li>
            );
          })}
        </StaggerGroup>
      </Container>

      {/* ── How it runs ── */}
      <Container as="section" aria-labelledby="process" className="pb-space-9">
        <div className="border-t border-line pt-space-8">
          <h2
            id="process"
            className="font-mono text-caption uppercase tracking-[0.18em] text-muted"
          >
            How an engagement runs
          </h2>
          <StaggerGroup as="ol" from="below" className="mt-space-6 grid gap-space-6 sm:grid-cols-2">
            {PROCESS.map((phase, i) => (
              <li key={phase.step} className="border-t border-line pt-space-5">
                <span
                  aria-hidden="true"
                  className="font-mono text-caption tabular-nums text-muted"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Text variant="heading-s" as="h3" className="mt-space-2 font-display">
                  {phase.step}
                </Text>
                <Text variant="body" className="mt-space-3 text-muted">
                  {phase.detail}
                </Text>
              </li>
            ))}
          </StaggerGroup>

          <div className="mt-space-8 grid gap-space-8 lg:grid-cols-2">
            <div>
              <h3 className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
                What I need from you
              </h3>
              <ul className="mt-space-4 space-y-space-4">
                {NEEDS.map((need) => (
                  <li key={need} className="flex gap-space-3">
                    <span aria-hidden="true" className="shrink-0 text-muted">
                      —
                    </span>
                    <Text variant="body" className="text-muted">
                      {need}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
                Scope and cost
              </h3>
              <Text variant="body" className="mt-space-4 max-w-[var(--measure)] text-muted">
                Fixed price per phase, agreed in writing before work starts, so
                the number does not move while the work is happening. Tell me
                the problem and where it stands and you get a written proposal —
                scope, deliverables, timeline, price. If the shape does not fit
                a fixed price, I will say that too.
              </Text>
            </div>
          </div>
        </div>
      </Container>

      {/* ── The declines ── */}
      <Container as="section" aria-labelledby="declines" className="pb-space-9">
        <div className="border-t border-line pt-space-8">
          <h2
            id="declines"
            className="font-mono text-caption uppercase tracking-[0.18em] text-muted"
          >
            What I turn down
          </h2>
          <Text variant="body" className="mt-space-4 max-w-[var(--measure)] text-muted">
            Worth knowing before a call, and honest about where this practice
            stops.
          </Text>
          <StaggerGroup as="ul" from="below" className="mt-space-6 border-t border-line">
            {DECLINES.map((item) => (
              <li key={item.what} className="border-b border-line py-space-5">
                <div className="grid gap-space-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-space-7">
                  <Text variant="body" className="font-medium text-fg">
                    {item.what}
                  </Text>
                  <Text variant="body" className="text-muted">
                    {item.why}
                  </Text>
                </div>
              </li>
            ))}
          </StaggerGroup>
        </div>
      </Container>

      {/* ── CTA ── */}
      <Container as="section" className="pb-space-10">
        <div className="border-t border-line pt-space-8">
          <Text variant="heading" as="p" className="max-w-[24ch] font-display">
            If one of those is your problem, tell me where it stands.
          </Text>
          <div className="mt-space-6 flex flex-wrap items-center gap-space-4">
            <Magnetic className="inline-block">
              <Button href="/contact" variant="invert">
                Start a conversation
              </Button>
            </Magnetic>
            <Magnetic className="inline-block">
              <Button href="/work" variant="secondary">
                See the work first
              </Button>
            </Magnetic>
          </div>
        </div>
      </Container>
    </>
  );
}
