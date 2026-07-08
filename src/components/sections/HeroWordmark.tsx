import { SplitFlapText } from "@/components/motion";
import { SignalTrace } from "@/components/sections/SignalTrace";

/*
 * Instrument-hero wordmark, title-card cut: the name as a departure board that
 * sets "PRADUAN SAHA" on ONE baseline on wide screens and wraps naturally back
 * to the stacked two-line signature on phones. Both boards flip in with the
 * multicolor entrance, then settle="kern" crossfades each into real kerned
 * type anchored LEFT (kernAlign="start").
 *
 * Why one line: the hero now sits over the cinematic reel's live film, whose
 * subject (face, eyes at ~1/3 height) is locked to frame centre — a 16:9 clip
 * on a 16:9 viewport has no crop slack, so the TYPE yields. The single line
 * rides the lower third over the dark jacket + reel scrim; the stacked variant
 * at 13vw used to run the second line straight through the subject's eyes.
 *
 * The signal trace — the spectrum built from the four project accents — fills
 * the remaining baseline width beside SAHA (lg+); below lg it becomes a
 * full-width line under the block. Reduced motion renders kerned type + a
 * static trace from frame one.
 */

// Two scales, one markup: below lg the old 13vw signature size forces the pair
// to wrap into the stacked two-line block (PRADUAN over SAHA); at lg+ the 7vw
// title-card size fits both words + trace on ONE baseline (~72% of a 1440
// viewport). The `--hw` hop lets Tailwind switch the clamp per breakpoint; the
// outer var() still lets the short-landscape rule in globals.css
// (.hero-wordmark → --hero-wordmark-size) cap it by viewport HEIGHT.
const FONT = "var(--hero-wordmark-size, var(--hw))";

export function HeroWordmark() {
  return (
    // No aria-hidden here: the trace inside carries REAL links. The flap
    // boards handle their own semantics (announce=false + aria-hidden tiles).
    <div className="hero-wordmark [--hw:clamp(3rem,13vw,9.75rem)] md:[--hw:clamp(3rem,11vw,7.5rem)] lg:[--hw:clamp(3rem,7vw,7.25rem)]">
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
        {/* The trace completes the name's baseline on lg+ — over the jacket,
            never across the face. Portrait viewports drop it entirely: the
            face fills the frame there, and a spectrum stroke over the film
            read as clutter, not instrumentation (the four case-study links it
            carries sit one scroll away in the work grid). */}
        <SignalTrace delay={1.35} className="hidden min-w-[16rem] flex-1 lg:block" />
      </div>
    </div>
  );
}
