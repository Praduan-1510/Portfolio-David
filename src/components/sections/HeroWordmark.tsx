import { SplitFlapText } from "@/components/motion";

/*
 * Instrument-hero wordmark, split-screen cut: the name as a departure board
 * that sets "PRADUAN SAHA" on ONE baseline inside the hero's LEFT column
 * (lg+, where the cinematic reel owns the right half of the frame) and wraps
 * naturally back to the stacked two-line signature on phones. Both boards flip
 * in with the multicolor entrance, then settle="kern" crossfades each into
 * real kerned type anchored LEFT (kernAlign="start").
 */

// Two scales, one markup: below lg the old 13vw signature size forces the pair
// to wrap into the stacked two-line block (PRADUAN over SAHA); at lg+ the
// clamp shrinks so both words fit ONE baseline inside the split's left column
// (~43vw of usable width — 12 glyphs ≈ 8.7em). The `--hw` hop lets Tailwind
// switch the clamp per breakpoint; the outer var() still lets the
// short-landscape rule in globals.css (.hero-wordmark → --hero-wordmark-size)
// cap it by viewport HEIGHT.
const FONT = "var(--hero-wordmark-size, var(--hw))";

export function HeroWordmark() {
  return (
    // The flap boards handle their own semantics (announce=false +
    // aria-hidden tiles); the sr-only h1 in Hero.tsx carries the name.
    <div className="hero-wordmark [--hw:clamp(3rem,13vw,9.75rem)] md:[--hw:clamp(3rem,11vw,7.5rem)] lg:[--hw:clamp(2.5rem,4.9vw,4.5rem)]">
      {/* fontSize on the row makes the word gap track the display size (em). */}
      <div
        className="flex flex-wrap items-baseline gap-x-[0.28em] gap-y-space-2"
        style={{ fontSize: FONT }}
      >
        <SplitFlapText
          announce={false}
          text="PRADUAN"
          fontSize={FONT}
          className="font-semibold text-fg"
          kernClassName="font-semibold tracking-[-0.02em]"
          settle="kern"
          kernAlign="start"
          fitKern
          multicolor
        />
        <SplitFlapText
          announce={false}
          text="SAHA"
          fontSize={FONT}
          className="font-semibold text-fg"
          kernClassName="font-semibold tracking-[-0.02em]"
          settle="kern"
          kernAlign="start"
          fitKern
          multicolor
        />
      </div>
    </div>
  );
}
