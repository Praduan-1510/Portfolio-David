import Image from "next/image";
import NextLink from "next/link";
import { Container, Text } from "@/components/primitives";
import { Marquee, Reveal, TextReveal } from "@/components/motion";
import { GRAPHICS_ROW_A, GRAPHICS_ROW_B, type GraphicFrame } from "@/lib/content/graphics";

/*
 * GraphicsShowcase — the wall of square work.
 *
 * Seventeen 1:1 graphics: a ten-part editorial carousel, two standalone field
 * notes, and a bilingual festive campaign for a Kolkata salon. They are the one
 * body of work on this site that is not a product, so they get the one
 * presentation that is not a device frame — no phone, no browser chrome, just
 * the artwork at the size it was drawn to be seen.
 *
 * WHY TWO ROWS DRIFTING AT EACH OTHER. One strip reads as a widget. Two,
 * counter-drifting at different speeds, read as a field that happens to be
 * passing through the page — which is what makes this a showcase rather than a
 * carousel. The speeds are deliberately close but not harmonic (31 and 23 px/s,
 * a prime-ish ratio) so the two rows never fall into step and repeat a pairing.
 *
 * WHAT IT COSTS, AND WHY THAT IS ALL. This composes the site's existing Marquee
 * rather than adding a second scroller: one transform tween per row on the
 * shared gsap.ticker, transform-only, linear (easing a continuous loop reads as
 * broken), paused by IntersectionObserver the moment the section leaves the
 * viewport, and paused again by GSAP when the tab is hidden. Marquee also ships
 * the WCAG 2.2.2 pause control and, under prefers-reduced-motion, renders a
 * static legible row with no tween at all — so this section inherits every
 * guard rather than re-arguing them.
 *
 * The source art is 1080-2160px square and 16MB in total, which is far more
 * than a drifting thumbnail needs. `sizes` is pinned to the rendered card width
 * so next/image serves roughly a 300-540px variant instead, and every cell is
 * lazy: nothing here is the LCP element, and the section sits well below the
 * fold. This component is a SERVER component — the only JavaScript it adds to
 * the page is Marquee's own.
 */

/*
 * Both rows come from the one catalogue in src/lib/content/graphics.ts, which
 * the work index's contact sheet reads too: two opposite presentations of the
 * same seventeen squares, and no second copy of the alt text to drift.
 */
type Graphic = GraphicFrame;

/* Row one: the carousel, in its own order. */
const ROW_A: Graphic[] = GRAPHICS_ROW_A;

/* Row two: the rest of the deck, the field notes and the campaign. */
const ROW_B: Graphic[] = GRAPHICS_ROW_B;

function Card({ g }: { g: Graphic }) {
  return (
    <figure
      className="
        group relative aspect-square w-[clamp(9.5rem,21vw,17rem)] shrink-0
        overflow-hidden rounded-[10px] border border-line bg-surface
        shadow-[0_18px_50px_-28px_rgba(0,0,0,0.9)]
        transition-[transform,border-color] duration-base ease-out-quad
        motion-safe:group-hover:-translate-y-1 hover:border-line-strong
      "
    >
      <Image
        src={g.src}
        alt={g.alt}
        fill
        // Pinned to the card's own clamp so next/image serves a thumbnail
        // rather than the 2160px original.
        sizes="(min-width: 1024px) 17rem, (min-width: 640px) 21vw, 9.5rem"
        className="object-cover"
      />
      {/* A hairline inset ring keeps the light editorial pieces from bleeding
          into the page and the dark festive ones from dissolving into it —
          the set runs from near-white to near-black and needs one edge that
          works for both. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--fg)_9%,transparent)]"
      />
    </figure>
  );
}

export function GraphicsShowcase() {
  const rowA = ROW_A.map((g) => <Card key={g.src} g={g} />);
  const rowB = ROW_B.map((g) => <Card key={g.src} g={g} />);

  return (
    <section
      id="graphics"
      aria-labelledby="graphics-h"
      className="py-space-9 sm:py-space-10"
    >
      <Container>
        <Reveal>
          <p className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
            <span aria-hidden="true" className="mr-space-2 text-accent">
              ■
            </span>
            Graphics · editorial and campaign
          </p>
        </Reveal>
        {/* The heading is the CONSTRAINT, not the inventory. "Seventeen squares
            that had to argue on their own" described the format and left the
            reader to work out why that was hard; this states the hostile thing
            about the medium first and lets the lede answer it. The count and the
            three strands moved into the sentence below, where they belong: a
            heading that opens with a number is a caption. */}
        <TextReveal
          as="h2"
          id="graphics-h"
          by="words"
          className="mt-space-4 max-w-[16ch] font-display text-display-l"
        >
          One second to earn the second one.
        </TextReveal>
        <Reveal delay={0.12}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            That is what a feed gives a graphic. Seventeen of them here: a ten-part
            carousel on studio against corporate design, two field notes, and a
            bilingual Pujo campaign for a Kolkata salon.{" "}
            <span className="text-fg">No interface to hide behind</span> — type,
            colour, and whether the point survives at thumbnail size.
          </Text>
        </Reveal>
      </Container>

      {/* Full-bleed on purpose: held inside the gutter these read as a widget,
          and running them past both edges is what makes the page feel like it
          opens onto the work rather than listing it.

          overflow-x-clip is load-bearing, not decoration. Marquee's pause
          control extends its 44px hit area with `before:-inset-3`, which reaches
          about 4px past the button. Every other marquee on this site sits inside
          the page gutter, so that overhang lands in the margin and nobody sees
          it. These two are full-bleed to the viewport edge, so it escaped and
          took the document to 1443px on a 1440px screen — measured against
          production, which is exactly 1440. Clipped rather than repositioned
          because the part being cut is off-screen and was never tappable, and
          `clip` over `hidden` so this does not become a scroll container. */}
      <div className="mt-space-8 space-y-space-4 overflow-x-clip sm:mt-space-9 sm:space-y-space-5">
        <Marquee items={rowA} speed={31} gapClassName="pr-space-4 sm:pr-space-5" />
        {/* Pointed the other way and slower, so the two rows never lock step. */}
        <Marquee
          items={rowB}
          speed={23}
          direction="right"
          gapClassName="pr-space-4 sm:pr-space-5"
        />
      </div>

      <Container>
        <Reveal>
          <p className="mt-space-8 max-w-[var(--measure)] font-mono text-caption leading-relaxed text-muted">
            17 pieces · three strands · 2025–2026.{" "}
            <NextLink
              href="/work/graphics"
              className="text-fg underline decoration-line underline-offset-4 transition-colors duration-fast ease-out-quad hover:decoration-accent"
            >
              Read how the system holds them together &rarr;
            </NextLink>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
