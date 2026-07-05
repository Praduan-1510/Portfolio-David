"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { easings, cssEasings } from "@/lib/motion/easings";
import { SPECTRUM } from "@/lib/spectrum";

/*
 * Split-flap (departure board) text — the site's signature motif. A SHORT,
 * UPPERCASE wordmark whose letters flip through the charset before settling.
 * Built for A–Z / 0–9; any other glyph renders as a gap.
 *
 * Fully on-system: ONE gsap.ticker per board drives a shared step counter at
 * the `tick` cadence (durations.tick — the sanctioned split-flap token); every
 * per-tile duration/ease reads from lib/motion tokens. The flutter glyphs are
 * a deterministic hash of (step, index), so renders are stable and the board
 * needs no per-tile timers.
 *
 * DOSAGE RULES (design law, not preference):
 *   - Board mode (these tiles, big): the hero wordmark and the 404 ONLY.
 *   - Inline character flutter for mono-caps metadata → <FlapText/>.
 *   - Odometer digits → <FlapDigits/>. The flap never touches body text or
 *     proportional display type (except via settle="kern" below).
 *
 * settle="kern": once every tile has settled, the tile board crossfades into a
 * REAL kerned span (natural glyph advances, font-display) absolutely centered
 * over it — so the resting wordmark reads as set type, not monospaced caps,
 * while the entrance still flips against solid cards. Reduced motion renders
 * the kerned span from frame one.
 */

interface SplitFlapTextProps {
  text: string;
  className?: string;
  /** CSS font-size for the flaps; defaults to the v0 giant clamp. */
  fontSize?: string;
  /** Cycle tiles through the multi-colour "counter" palette while flipping (each
   *  tile a fixed colour by index, settling to --fg regardless). Off → the flip
   *  uses the single --accent. Used by the hero wordmark. */
  multicolor?: boolean;
  /** Announce the settled text via an sr-only span (default). Pass false when a
   *  sibling heading already announces the same words — the hero and the 404
   *  both carry their own sr-only h1, and a duplicate reads twice back-to-back. */
  announce?: boolean;
  /** "tiles" (default) keeps the settled board as tiles; "kern" crossfades the
   *  settled board into a real kerned span (hero wordmark). */
  settle?: "tiles" | "kern";
  /** Horizontal alignment of the kerned settle twin within the board's width —
   *  "start" for left-aligned compositions (the twin is narrower than the
   *  monospaced tile row, so centering would shift the left edge). */
  kernAlign?: "center" | "start";
  /** Extra classes for the kerned settle span (letter-spacing, weight). */
  kernClassName?: string;
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const DEFAULT_FONT_SIZE = "clamp(4rem, 15vw, 14rem)";
const FLAP_PALETTE = SPECTRUM;

/** Deterministic flutter glyph — stable across renders, chaotic to the eye. */
const flutterChar = (step: number, index: number) =>
  CHARSET[(step * 31 + index * 17 + ((index * 7) % 5)) % CHARSET.length];

/** Steps before tile `index` starts fluttering (tight left-to-right cascade). */
const startStep = (index: number) => Math.round(index * 0.8);
/** Flutter steps after start before tile `index` locks. */
const settleSpan = (index: number) => 6 + index;
/** Step at which tile `index` is settled. */
const settleStep = (index: number) => startStep(index) + settleSpan(index);

export function SplitFlapText({
  text,
  className = "",
  fontSize = DEFAULT_FONT_SIZE,
  multicolor = false,
  announce = true,
  settle = "tiles",
  kernAlign = "center",
  kernClassName = "",
}: SplitFlapTextProps) {
  const chars = useMemo(() => text.split(""), [text]);
  const reduced = useReducedMotion();
  const totalSteps = useMemo(
    () => Math.max(...chars.map((_, i) => settleStep(i))) + 1,
    [chars],
  );

  // One ticker per board: accumulate elapsed time, advance the shared step at
  // the `tick` cadence, and remove itself once every tile has locked.
  const [step, setStep] = useState(() => 0);
  const doneRef = useRef(false);
  useEffect(() => {
    if (reduced) {
      setStep(totalSteps);
      doneRef.current = true;
      return;
    }
    registerGsap();
    let elapsed = 0;
    let current = 0;
    const cb = () => {
      elapsed += gsap.ticker.deltaRatio(60) / 60; // seconds, frame-rate independent
      const target = Math.floor(elapsed / durations.tick);
      if (target > current) {
        current = Math.min(target, totalSteps);
        setStep(current);
        if (current >= totalSteps) {
          doneRef.current = true;
          gsap.ticker.remove(cb);
        }
      }
    };
    gsap.ticker.add(cb);
    return () => gsap.ticker.remove(cb);
  }, [reduced, totalSteps]);

  const allSettled = step >= totalSteps;
  const kern = settle === "kern";

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Flaps are decorative; the word is announced once for assistive tech. */}
      {announce && <span className="sr-only">{text}</span>}
      {/* Tile board — fades out under the kerned twin once settled (kern mode).
          It stays in flow either way, so the composition's width never shifts. */}
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-[0.08em]"
        style={
          kern
            ? {
                opacity: allSettled ? 0 : 1,
                transition: `opacity ${durations.slow}s ${cssEasings.outExpo}`,
              }
            : undefined
        }
      >
        {chars.map((char, index) => (
          <SplitFlapChar
            key={index}
            char={char.toUpperCase()}
            index={index}
            step={step}
            fontSize={fontSize}
            reduced={reduced}
            multicolor={multicolor}
          />
        ))}
      </span>
      {/* Kerned settle twin — real glyph advances, centered over the board. */}
      {kern && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 flex items-center whitespace-nowrap font-display leading-none ${kernAlign === "start" ? "justify-start" : "justify-center"} ${kernClassName}`}
          style={{
            fontSize,
            opacity: allSettled ? 1 : 0,
            // Settle beat: as the board resolves, the kerned twin rises a hair
            // and crisps from a near-imperceptible under-scale into exact type —
            // the wordmark "lands" rather than merely crossfading in. Reduced
            // motion is settled from frame one (allSettled) and the global rule
            // zeroes the transition, so it appears instantly.
            transform: allSettled
              ? "translateY(0) scale(1)"
              : "translateY(0.06em) scale(0.994)",
            transition: `opacity ${durations.slow}s ${cssEasings.outExpo}, transform ${durations.slow}s ${cssEasings.outExpo}`,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}

interface SplitFlapCharProps {
  char: string;
  index: number;
  step: number;
  fontSize: string;
  reduced: boolean;
  multicolor: boolean;
}

function SplitFlapChar({
  char,
  index,
  step,
  fontSize,
  reduced,
  multicolor,
}: SplitFlapCharProps) {
  const displayChar = CHARSET.includes(char) ? char : " ";
  const isSpace = char === " ";

  if (isSpace) {
    return <div style={{ width: "0.3em", fontSize }} />;
  }

  const started = step >= startStep(index);
  const isSettled = reduced || step >= settleStep(index);
  const currentChar = isSettled
    ? displayChar
    : started
      ? flutterChar(step, index)
      : flutterChar(0, index);

  // Transient colour while flipping, settling to the foreground on near-black.
  const flipColor = multicolor
    ? FLAP_PALETTE[index % FLAP_PALETTE.length]
    : "var(--accent)";
  const bgColor = isSettled
    ? "var(--bg)"
    : `color-mix(in srgb, ${flipColor} 20%, transparent)`;
  const textColor = isSettled ? "var(--fg)" : flipColor;
  const tileDelay = durations.tick * index;
  const colorTransition = `color ${durations.fast}s ${cssEasings.outQuad}`;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduced ? 0 : tileDelay,
        duration: reduced ? 0 : durations.base,
        ease: easings.outQuad,
      }}
      className="relative flex items-center justify-center overflow-hidden font-display"
      style={{
        fontSize,
        width: "0.65em",
        height: "1.05em",
        backgroundColor: bgColor,
        transformStyle: "preserve-3d",
        transition: `background-color ${durations.fast}s ${cssEasings.outQuad}`,
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[1px] bg-black/20" />

      <div className="absolute inset-x-0 top-0 bottom-1/2 flex items-end justify-center overflow-hidden">
        <span
          className="block translate-y-[0.52em] leading-none"
          style={{ color: textColor, transition: colorTransition }}
        >
          {currentChar}
        </span>
      </div>

      <div className="absolute inset-x-0 top-1/2 bottom-0 flex items-start justify-center overflow-hidden">
        <span
          className="-translate-y-[0.52em] leading-none"
          style={{ color: textColor, transition: colorTransition }}
        >
          {currentChar}
        </span>
      </div>

      <motion.div
        key={isSettled ? "settled" : "flipping"}
        initial={reduced ? false : { rotateX: -90 }}
        animate={{ rotateX: 0 }}
        transition={{
          delay: reduced ? 0 : isSettled ? 0 : tileDelay + 0.15,
          duration: reduced ? 0 : durations.fast,
          ease: easings.outQuad,
        }}
        className="absolute inset-x-0 top-0 bottom-1/2 origin-bottom overflow-hidden"
        style={{
          backgroundColor: bgColor,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          transition: `background-color ${durations.fast}s ${cssEasings.outQuad}`,
        }}
      >
        <div className="flex h-full items-end justify-center">
          <span
            className="translate-y-[0.52em] leading-none"
            style={{ color: textColor, transition: colorTransition }}
          >
            {currentChar}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
