import { Container, Text } from "@/components/primitives";
import { Reveal, StaggerGroup } from "@/components/motion";
import { Byline, Portrait, ProvenanceStamp, QuoteMark } from "@/components/testimonials/parts";
import { getVerifiedTestimonials } from "@/lib/content/testimonials";

/*
 * Client statements on /services, set as COUNTER-SIGNATURES.
 *
 * The whole page is written in the first person: I work on, I turn down, what I
 * need from you. Every claim on it is mine. A client statement is the one piece
 * of evidence the page cannot manufacture — somebody else's hand on the same
 * document — so it is set the way a signature is set, and not as a card.
 *
 * Each statement is the words at reading scale, a rule drawn under them, and
 * the name sitting beneath the rule with the provenance stamp at the far end
 * like a notary mark. There is deliberately no framed panel: this page carries
 * none anywhere, so a box here would be the one element that arrived from a
 * different site. Hierarchy is done with type scale and position instead, which
 * is how the rest of the page does it.
 *
 * Placement is the argument. It sits immediately after "What I turn down" and
 * immediately before the CTA: the section above states a principle, this
 * corroborates it from outside, and the ask follows while both are on screen.
 *
 * FEATURED CHOICE. Greg Foster's is lifted out, not because it is the warmest —
 * Claire Bennett's quarter-beating-the-year-forecast is the better business
 * result — but because it is the one a reader can check against the paragraph
 * they just finished. The page claims it turns work down; he says it turned HIS
 * work down, twice, and was right. A stated principle and an outside account of
 * the same behaviour, adjacent, is worth more here than a superlative.
 *
 * Server component: no hooks, no handlers, so /services pays no JavaScript for
 * its social proof. Every quote renders through the shared parts, so none of
 * them can reach the page without its provenance stamp.
 */

/** Whose statement is lifted out. Falls back to the first verified entry, so
 *  removing this person degrades the section rather than breaking it. */
const FEATURED = "Greg Foster";

export function ServicesTestimonials() {
  const all = getVerifiedTestimonials();
  if (all.length === 0) return null;

  const lead = all.find((t) => t.name === FEATURED) ?? all[0];
  const rest = all.filter((t) => t !== lead);

  return (
    <Container as="section" aria-labelledby="clients" className="pb-space-9">
      <div className="relative isolate border-t border-line pt-space-8">
        {/* A single pool of light behind the lead statement. The page is flat
            near-black everywhere else, so this is the only place it lifts —
            which is precisely why the eye goes there first. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem]"
          style={{
            background:
              "radial-gradient(58% 70% at 22% 30%, color-mix(in srgb, var(--fg) 6%, transparent) 0%, transparent 72%)",
          }}
        />

        <h2
          id="clients"
          className="font-mono text-caption uppercase tracking-[0.18em] text-muted"
        >
          What clients said
        </h2>
        <Text variant="body" className="mt-space-4 max-w-[var(--measure)] text-muted">
          Named people at named companies, quoted verbatim with their permission.
          Each one carries what backs it, so you can weigh it rather than take it.
        </Text>

        {/* ── The lead statement ──
            Largest type in the section and the only spectrum rule on the page:
            the counter-signature that answers the paragraph directly above. */}
        <Reveal className="mt-space-8">
          <figure>
            {/* Hanging indent scales with the viewport: at 390px a fixed 96px
                gutter left the quote reading in a 22-character column. */}
            <blockquote className="relative pl-space-6 sm:pl-space-8 lg:pl-space-9">
              <QuoteMark className="top-[-0.06em] text-[3rem] sm:text-[3.75rem] lg:text-[4.5rem]" />
              <Text
                variant="heading"
                className="max-w-[24ch] font-display leading-[1.28] text-fg [text-wrap:pretty]"
              >
                {lead.quote}
              </Text>
            </blockquote>
            <figcaption className="mt-space-6">
              <span
                aria-hidden="true"
                className="block h-px w-full"
                style={{ background: "var(--spectrum-gradient)", opacity: 0.75 }}
              />
              <span className="mt-space-4 flex flex-wrap items-center justify-between gap-x-space-6 gap-y-space-4">
                <span className="flex items-center gap-space-4">
                  <Portrait t={lead} size={52} />
                  <Byline t={lead} className="min-w-0" />
                </span>
                <ProvenanceStamp t={lead} />
              </span>
            </figcaption>
          </figure>
        </Reveal>

        {/* ── The rest, countersigned the same way at a quieter scale ──
            Two columns, with the right-hand one dropped half a beat so four
            statements read as a drift down the page rather than a block of
            four. Same trick, same reason, as the alternating offer rows above. */}
        {rest.length > 0 && (
          <StaggerGroup
            as="ul"
            from="below"
            className="mt-space-9 grid items-start gap-x-space-8 gap-y-space-8 lg:grid-cols-2"
          >
            {rest.map((t, i) => (
              <li key={t.name} className={i % 2 === 1 ? "lg:mt-space-7" : undefined}>
                <figure>
                  <blockquote className="relative pl-space-5 sm:pl-space-7">
                    <QuoteMark className="top-[-0.04em] text-[2.25rem] sm:text-[2.75rem]" />
                    <Text
                      variant="body-l"
                      className="max-w-[38ch] font-display leading-[1.45] text-fg [text-wrap:pretty]"
                    >
                      {t.quote}
                    </Text>
                  </blockquote>
                  <figcaption className="mt-space-5 border-t border-line pt-space-4">
                    <span className="flex items-center gap-space-4">
                      <Portrait t={t} size={40} />
                      <Byline t={t} className="min-w-0" />
                    </span>
                    <ProvenanceStamp t={t} className="mt-space-3" />
                  </figcaption>
                </figure>
              </li>
            ))}
          </StaggerGroup>
        )}
      </div>
    </Container>
  );
}
