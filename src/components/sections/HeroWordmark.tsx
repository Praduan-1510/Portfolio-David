import { SplitFlapText } from "@/components/motion";
import { SignalTrace } from "@/components/sections/SignalTrace";

/*
 * Instrument-hero wordmark: the name as a stacked two-line departure board —
 * PRADUAN over SAHA, left-aligned at display scale. Both boards flip in with
 * the multicolor entrance, then settle="kern" crossfades each into real kerned
 * type anchored to the LEFT edge (kernAlign="start" — the composition is
 * asymmetric now, not centered).
 *
 * The signal trace — the spectrum built from the four project accents — rides
 * SAHA's baseline row and fills the remaining width (sm+); on phones it wraps
 * to a full-width line under the block. Reduced motion renders kerned type +
 * a static trace from frame one.
 */

// PRADUAN is 7 tiles (~4.6em incl. gaps); 15vw keeps it huge on wide screens
// while the 3.2rem floor holds the block inside a 320px gutter.
const FONT = "clamp(3rem, 13vw, 9.75rem)";

export function HeroWordmark() {
  return (
    // No aria-hidden here: the trace inside carries REAL links. The flap
    // boards handle their own semantics (announce=false + aria-hidden tiles).
    <div>
      <SplitFlapText
        announce={false}
        text="PRADUAN"
        fontSize={FONT}
        className="font-semibold text-fg"
        kernClassName="font-semibold tracking-[-0.02em]"
        settle="kern"
        kernAlign="start"
        multicolor
      />
      <div className="flex items-center gap-x-space-6 sm:gap-x-space-7">
        <SplitFlapText
          announce={false}
          text="SAHA"
          fontSize={FONT}
          className="font-semibold text-fg"
          kernClassName="font-semibold tracking-[-0.02em]"
          settle="kern"
          kernAlign="start"
          multicolor
        />
        {/* The trace fills SAHA's remaining baseline width on sm+. */}
        <SignalTrace delay={1.35} className="hidden sm:block" />
      </div>
      {/* Phones: the trace becomes a full-width line under the block. */}
      <SignalTrace delay={1.35} className="mt-space-5 sm:hidden" />
    </div>
  );
}
