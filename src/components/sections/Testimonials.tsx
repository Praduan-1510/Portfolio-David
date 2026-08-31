import { Container, Text } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider } from "@/components/motion";
import {
  getVerifiedTestimonials,
  summariseProvenance,
} from "@/lib/content/testimonials";
import { TestimonialRegister } from "./TestimonialRegister";

/*
 * "On the record": testimonials in this site's own instrument voice.
 *
 * The section is a masthead plus a REGISTER (TestimonialRegister). This file
 * owns the framing — the claim the section makes about itself — and the
 * register owns the records; the split also keeps the interactive reading desk
 * a client island under an otherwise server-rendered home page.
 *
 * The ledger strip is the part worth defending. It is COMPUTED from the data,
 * so the count of statements a reader can independently check can never drift
 * from the truth and flatter the page: with nothing publicly linked it prints
 * "00 PUBLICLY LINKED" in the same type as everything else. That is the whole
 * argument of the section. A testimonial block that hides its own weakest
 * number is the block nobody believes, and everyone has already met it.
 *
 * Renders NOTHING when there is nothing to show. A testimonial section holding
 * placeholder praise is worse than no section: it is the one element a visitor
 * already suspects, and confirming the suspicion costs more than empty space.
 */

/** One cell of the instrument readout: a big tabular count over its label. */
function LedgerCell({
  value,
  label,
  emphasis,
}: {
  value: number;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex-1 border-l border-line pl-space-4 first:border-l-0 first:pl-0">
      <div
        className={`font-mono text-heading-s tabular-nums ${emphasis ? "text-fg" : "text-muted"}`}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-space-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
        {label}
      </div>
    </div>
  );
}

export function Testimonials() {
  const items = getVerifiedTestimonials();
  if (items.length === 0) return null;
  const { total, publiclyLinked, onFile } = summariseProvenance(items);

  return (
    <Container as="section" id="testimonials" className="scroll-mt-16 py-space-9">
      <Reveal>
        <p className="flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.18em] text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-[7px] w-[7px]"
            style={{ background: "var(--spectrum-gradient)" }}
          />
          On the record
        </p>
      </Reveal>

      <div className="mt-space-5 grid gap-space-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-space-9">
        <div>
          <TextReveal
            as="h2"
            by="words"
            className="max-w-[18ch] font-display text-display-l"
          >
            {`${total === 5 ? "Five" : String(total)} people, named, in their own words.`}
          </TextReveal>

          <Reveal delay={0.1}>
            <Text variant="body" className="mt-space-5 max-w-[var(--measure)] text-muted">
              Quoted verbatim, with permission, and attributed to real people at
              named companies — no initials, no &ldquo;a fintech client&rdquo;.
              Each record says what backs it: a link where you can go and read
              it yourself, or, honestly, a private one you are taking on trust.
            </Text>
          </Reveal>
        </div>

        {/* The ledger. Deliberately placed level with the headline rather than
            tucked underneath: the count of checkable statements is a headline
            fact about this section, including when it is zero. */}
        <Reveal delay={0.16} as="div" className="lg:shrink-0">
          <div className="flex max-w-[24rem] gap-space-4 border-t border-line-strong pt-space-4 lg:min-w-[20rem]">
            <LedgerCell value={total} label="Statements" emphasis />
            <LedgerCell value={publiclyLinked} label="Public links" emphasis={publiclyLinked > 0} />
            <LedgerCell value={onFile} label="On file" />
          </div>
        </Reveal>
      </div>

      <AnimatedDivider className="mt-space-7" />

      <TestimonialRegister items={items} />
    </Container>
  );
}
