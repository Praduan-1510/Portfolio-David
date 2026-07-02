import { SplitFlapText } from "@/components/motion";

/*
 * Hero wordmark. The split-flap board flips the name in against solid tile
 * cards, then SplitFlapText's settle="kern" crossfades the board into a real
 * kerned span — so the entrance reads as a departure board and the resting
 * wordmark reads as set display type floating on the aurora (no tile fills, no
 * monospaced caps, no style-override hacks). Reduced motion renders the kerned
 * span from frame one.
 */
export function HeroWordmark() {
  return (
    <div aria-hidden="true">
      {/* "PRADUAN SAHA" is 12 tiles wide (~8.3em incl. the inter-word gap), so the
          clamp floor is lowered from 2.75rem to 1.85rem: below ~330px viewport the
          flaps shrink to fit the gutter instead of overflowing. Desktop max (7rem)
          is unchanged, so the settled wordmark reads the same on wide screens. */}
      <SplitFlapText
        announce={false}
        text="PRADUAN SAHA"
        fontSize="clamp(1.85rem, 9vw, 7rem)"
        className="font-semibold text-fg"
        kernClassName="font-semibold tracking-[-0.02em]"
        settle="kern"
        multicolor
      />
    </div>
  );
}
