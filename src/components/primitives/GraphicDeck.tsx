import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import blurMap from "@/lib/content/blur-map.json";

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * GraphicDeck — the hero for work whose medium is a square.
 *
 * The case-study template offers two heroes: a PhoneFrame and a BrowserMockup.
 * Both are wrong here, and one of them was actively destroying the work: a 1:1
 * graphic cropped into a 9:19.5 phone loses its outer thirds, so the cover's
 * headline rendered as "s AI didn't / designers. / omething / smarter." — the
 * masthead, the Figma mark and the badge all cut away. A device frame is a
 * promise about the medium, and this medium has no device.
 *
 * So: a fanned deck. Three squares, the cover square-on and sharp with one piece
 * behind it on each side, rotated and dropped back. It reads instantly as a SET
 * rather than a single image, which is what a ten-part carousel is, and it does
 * it with no chrome at all.
 *
 * The two behind are chosen to carry the argument the study makes: one from the
 * light editorial register, one from the dark festive campaign. The hero is
 * therefore the thesis — same designer, two voices, held apart on purpose —
 * before a word of the case study has been read.
 *
 * Static by construction: no transform tween, no scroll coupling, nothing to
 * disable under reduced motion. The template's own <Reveal> handles the entrance
 * and already respects the preference.
 */

interface DeckCardProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: string;
  dim?: boolean;
}

function DeckCard({ src, alt, className, priority, sizes, dim }: DeckCardProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[14px] border border-line bg-surface",
        "shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95),0_8px_24px_-12px_rgba(0,0,0,0.7)]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={blurFor(src) ? "blur" : "empty"}
        blurDataURL={blurFor(src)}
        className="object-cover"
      />
      {/* The set runs from near-white editorial to near-black festive, so one
          inset hairline is the only edge that reads on both. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[14px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--fg)_10%,transparent)]"
      />
      {/* The flanks are context, not content: dropped back with a scrim rather
          than opacity, so they darken toward the page instead of going milky.
          color-mix, NOT `bg-bg/40` — Tailwind's alpha modifier silently no-ops
          on this project's var() token colours, and the first version of this
          computed to rgba(0,0,0,0): a scrim that was not there at all. */}
      {dim && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[14px] bg-[color:color-mix(in_srgb,var(--bg)_42%,transparent)]"
        />
      )}
    </div>
  );
}

export function GraphicDeck({
  cover,
  coverAlt,
  left,
  leftAlt,
  right,
  rightAlt,
  className,
}: {
  cover: string;
  coverAlt: string;
  left: string;
  leftAlt: string;
  right: string;
  rightAlt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // The stage is square and sized off the viewport so the fan never
        // outgrows the column; the flanks live inside it via transforms, so
        // nothing here can widen the page.
        "relative mx-auto aspect-square w-[min(30rem,74vw)]",
        className,
      )}
    >
      {/* Flanks first in the DOM so the cover paints over them without z-index. */}
      <DeckCard
        src={left}
        alt={leftAlt}
        sizes="(min-width: 768px) 26rem, 64vw"
        dim
        className="origin-bottom-right -translate-x-[15%] translate-y-[1%] -rotate-[5deg] scale-[0.9]"
      />
      <DeckCard
        src={right}
        alt={rightAlt}
        sizes="(min-width: 768px) 26rem, 64vw"
        dim
        className="origin-bottom-left translate-x-[15%] translate-y-[1%] rotate-[5deg] scale-[0.9]"
      />
      <DeckCard
        src={cover}
        alt={coverAlt}
        sizes="(min-width: 768px) 30rem, 74vw"
        priority
        className="shadow-[0_60px_120px_-45px_rgba(0,0,0,1),0_10px_30px_-14px_rgba(0,0,0,0.8)]"
      />
    </div>
  );
}
