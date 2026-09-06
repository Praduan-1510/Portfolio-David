import type { Metadata } from "next";
import NextLink from "next/link";
import { Container, Text, Button, BrowserMockup, PhoneFrame } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider, StaggerGroup, Magnetic } from "@/components/motion";
import { distance } from "@/lib/motion/tokens";
import { getProjectBySlug } from "@/lib/content/work";
import { ServicesTestimonials } from "@/components/sections/ServicesTestimonials";

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
 * Everything else here (the work index, the timeline, the résumé) answers
 * "should we hire this person". None of it answers "can I engage you, how does
 * that run, and what will it cost me", which is the question someone with a
 * budget actually arrives with.
 *
 * Two rules shape it. Every offer names the case study that proves it, because
 * an unevidenced service list is the single most generic artefact in this
 * industry and the rest of the site earns the right not to be that. And the
 * page says what it declines, which is a stronger filter than anything it
 * claims: the enquiries it turns away are the ones worth not having.
 *
 * Every offer also SHOWS that proof rather than linking to it. The page used to
 * carry no image at all, which for a designer's services page is the whole
 * problem: it argued well and demonstrated nothing, and the strongest assets on
 * the site sat one 11px mono link away. Each offer now runs claim-left,
 * evidence-right, and the shot is chosen to prove the specific sentence above
 * it rather than to decorate the row. The sides alternate so three offers do
 * not read as three identical bands.
 *
 * The proof powers on as the claim is reached: each row is its own <Reveal>
 * (one group stagger fired at the list's top, so rows two and three used to
 * animate while still off-screen and the entrance was wasted), and the frame
 * beside it boots (boot="inView") once 40% of it is in the viewport, with the
 * caption rising as the shutter clears. Under reduced motion all of it renders
 * settled and complete.
 */

/** Each offer points at work that already demonstrates it. */
const OFFERS = [
  {
    id: "prototype",
    title: "Prototype the risky part",
    lede:
      "Before a team commits engineering time to the flow that decides the product, build that flow for real and use it.",
    body:
      "Not a clickable mockup: a working build that enforces its own rules, so the question stops being whether the model reads well and becomes whether it survives contact. The cheapest way to find out a model is incoherent, while that still costs a fortnight instead of a quarter.",
    proof: "omnistock",
    // A claim this specific is worth backing twice. Baseweight's catalogue tool
    // refuses to publish a value with no source and cannot be overridden on five
    // of its six checks, which is the same argument from the operator's side.
    proof2: "baseweight",
    good: "A model nobody can agree on, a spec that keeps growing, or a decision that keeps getting deferred because no artefact settles it.",
    shot: {
      src: "/images/work/omnistock/variance.png",
      domain: "omnistock.app/variance",
      aspect: "16 / 10", // 2560x1600 natively: no crop
      alt: "OmniStock's variance triage: a ranked queue where each row carries a gate state and the exposure figure is derived, not typed",
      // The caption points at the part of the image that IS the argument.
      caption:
        "The GATE column is the claim: rows sit at second approval or controlled, and exposure is derived (£3,776 x 1.4) rather than typed.",
    },
  },
  {
    id: "ship",
    title: "Design it and ship the front-end",
    lede:
      "Interface design through to the production front-end, on one component system, by one person.",
    body:
      "The handoff is where most of the design goes missing, not through bad faith but because a static file cannot specify motion, empty states, focus order, or what happens at 320px. When the same person designs and builds, none of that needs specifying, and what ships is accountable to measured numbers rather than asserted ones.",
    proof: "insightstap",
    good: "A marketing site or product surface where the gap between the comp and the live page keeps costing you time.",
    shot: {
      src: "/videos/insightstap-poster.jpg",
      domain: "insightstap.com",
      // 1600x875 natively, which is BrowserMockup's own 64/35. At 16/10 the
      // well cropped the site's logo off the left edge.
      aspect: "64 / 35",
      alt: "The InsightsTap marketing site as it runs in production",
      caption: "In production, not a comp of it. Designed and built by the same person, so nothing needed specifying twice.",
    },
  },
  {
    id: "system",
    title: "Build the design system",
    lede:
      "Tokens, components, and the accessibility and contrast rules built into the system rather than checked at the end.",
    body:
      "A component library is the easy half. The hard half is the decisions underneath: how many status colours the product is allowed, what contrast every state has to clear, which figures are derived and can never be typed. Systems that hold up put those rules in the tokens, so the wrong thing is hard to build rather than discouraged in a doc.",
    // Nukkad, and only Nukkad: it is the offer's argument in one picture, because
    // the demo panel beside the handset IS the design system: theme, glass and
    // language are switches you throw on the running app, not screenshots of
    // states. Its tokens live in TypeScript and the CSS variables are generated
    // from them, so the system and the prototype cannot drift apart.
    proof: "nukkad",
    good: "A product where every new screen restarts the same arguments, or where accessibility keeps arriving as a late fix.",
    shot: {
      // A PHONE, not a browser. Nukkad is an app, and the other two offers'
      // evidence is a website and a console, so showing this one in desktop chrome
      // would have been the only shot on the page that lied about its medium.
      // `frame` is what the figure below branches on; it is absent on the other
      // two, so the const union needs an "in" guard before reading it.
      frame: "phone",
      src: "/images/work/nukkad/home.png",
      alt: "The Nukkad home screen: a 10 to 14 minute delivery estimate, the local store's own note, a basket of what the street buys with its price on the button, and the running cart total",
      caption:
        "One fee, and the amount on the button before you press it. The system's rules are visible on the screen rather than described beside it.",
    },
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
  "Access to whoever knows the domain: the operations lead, the accountant, the person who actually files the returns.",
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
        <ol>
          {OFFERS.map((offer, i) => {
            const project = getProjectBySlug(offer.proof);
            // Only offer 01 carries a second proof, so the const union needs an
            // "in" guard before reading it.
            const second = "proof2" in offer ? getProjectBySlug(offer.proof2) : null;
            return (
              <Reveal
                as="li"
                key={offer.id}
                className="border-t border-line py-space-8 first:border-t-0 first:pt-0"
              >
                {/* Claim left, evidence right, sides alternating. The shot is
                    the argument, so it gets real width rather than sitting in a
                    sidebar. */}
                <div
                  className={`grid gap-space-6 lg:grid-cols-2 lg:items-center lg:gap-space-9 ${
                    i % 2 === 1 ? "lg:[&>figure]:order-first" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <span
                      aria-hidden="true"
                      className="font-mono text-caption tabular-nums text-accent"
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

                    <p className="mt-space-6 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                      Right when
                    </p>
                    <Text variant="body" className="mt-space-2 max-w-[var(--measure)] text-muted">
                      {offer.good}
                    </Text>

                    {project && (
                      <NextLink
                        href={`/work/${project.meta.slug}`}
                        className="group mt-space-5 inline-flex items-baseline gap-space-2 font-mono text-[0.8125rem] uppercase tracking-[0.1em] text-fg transition-colors duration-fast ease-out-quad hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
                      >
                        <span className="text-muted">Proof:</span>
                        {project.meta.title}
                        <span
                          aria-hidden="true"
                          className="transition-transform duration-base ease-out-quad group-hover:translate-x-1"
                        >
                          &rarr;
                        </span>
                      </NextLink>
                    )}
                    {second && (
                      <NextLink
                        href={`/work/${second.meta.slug}`}
                        className="group mt-space-3 block font-mono text-[0.8125rem] uppercase tracking-[0.1em] text-muted transition-colors duration-fast ease-out-quad hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
                      >
                        <span className="text-muted">And:</span> {second.meta.title}
                        <span
                          aria-hidden="true"
                          className="ml-space-2 inline-block transition-transform duration-base ease-out-quad group-hover:translate-x-1"
                        >
                          &rarr;
                        </span>
                      </NextLink>
                    )}
                  </div>

                  <figure className="min-w-0">
                    {"frame" in offer.shot ? (
                      // PhoneFrame is aspect-[9/19.5] on a w-full box, so left
                      // to fill this column it would render about 600x1300 and
                      // tower over the copy beside it. Capped and centred: 15rem
                      // gives a ~520px tall device, close to the browser shots'
                      // own height, so the three offers still scan as one row of
                      // evidence rather than one of them being twice the size.
                      <PhoneFrame
                        src={offer.shot.src}
                        alt={offer.shot.alt}
                        sizes="(min-width: 1024px) 15rem, 60vw"
                        className="mx-auto max-w-[15rem]"
                      />
                    ) : (
                      <BrowserMockup
                        poster={offer.shot.src}
                        domain={offer.shot.domain}
                        alt={offer.shot.alt}
                        tilt="still"
                        boot="inView"
                        aspect={offer.shot.aspect}
                        sizes="(min-width: 1024px) 34rem, 92vw"
                      />
                    )}
                    {/* The caption says where to look, so it lands as the
                        shutter clears the lower third (0.3s + 0.85s scan). */}
                    <Reveal
                      as="figcaption"
                      y={distance.sm}
                      delay={0.9}
                      className="mt-space-4 max-w-[42ch] border-l-2 border-accent pl-space-4 text-caption leading-relaxed text-muted"
                    >
                      {offer.shot.caption}
                    </Reveal>
                  </figure>
                </div>
              </Reveal>
            );
          })}
        </ol>
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
                    <span
                      aria-hidden="true"
                      className="mt-[0.62em] h-[5px] w-[5px] shrink-0 rounded-full bg-accent"
                    />
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
                the problem and where it stands and you get a written proposal:
                scope, deliverables, timeline, price. If the shape does not fit
                a fixed price, I will say that too.
              </Text>
              {/* There is no rate card on this page on purpose: the same
                  deliverable is a different job at three different companies,
                  and a number without a scope attached is a number that gets
                  quoted back at me. What the page owes the reader instead is a
                  direct route to a real one, rather than leaving them to work
                  out that they are supposed to go and ask. */}
              <Text variant="body" className="mt-space-4 max-w-[var(--measure)] text-muted">
                No rate card here: the same deliverable is a different job at
                different companies, and a price only means something with a
                scope attached to it. Ask, and you get both.
              </Text>
              <Magnetic className="mt-space-5 inline-block">
                <Button href="/contact" variant="secondary">
                  Ask what yours would cost
                </Button>
              </Magnetic>
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

      {/* ── What clients said ──
          Third-party evidence, placed where it does the most work: right after
          the declines it corroborates, and right before the ask. */}
      <ServicesTestimonials />

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
