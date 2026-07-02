"use client";

import { motion } from "motion/react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SPECTRUM } from "@/lib/spectrum";

/*
 * Split-flap (departure board) text — a SHORT, UPPERCASE wordmark whose letters
 * flip through the charset before settling. Built for A–Z / 0–9; any other glyph
 * renders as a gap. Ported from the v0 export and adapted to our system:
 *   - framer-motion → motion/react (the package we already ship);
 *   - flipping state recolored from hardcoded orange to our --accent, settling to
 *     --fg on the --bg near-black (DESIGN_GUIDELINES.md §4 monochrome + a single
 *     accent used as a transient "computational" highlight, not a base);
 *   - an opt-in `multicolor` board (the hero) cycles each tile through a 5-colour
 *     "counter" palette WHILE flipping — per-tile, keyed by index — then settles to
 *     the same monochrome --fg, so the resting wordmark stays on-brand;
 *   - typeface points at --font-display (Bricolage Grotesque) instead of --font-bebas;
 *   - reduced motion renders the settled text instantly — no flipping;
 *   - an optional `fontSize` so it can sit at headline scale in the hero.
 *
 * Designed to live on a dark surface (e.g. the data-theme="dark" hero), where the
 * tokens resolve to near-black flaps / off-white type / a raised accent.
 */

interface SplitFlapTextProps {
  text: string;
  className?: string;
  /** ms between flips. */
  speed?: number;
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
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const DEFAULT_FONT_SIZE = "clamp(4rem, 15vw, 14rem)";

// The shared site spectrum (lib/spectrum.ts). A `multicolor` board gives each tile
// a fixed colour from this list (by index) while it flips, then every tile settles
// to --fg — a warm→cool sweep across the wordmark so adjacent letters never share a
// hue. The hero counter was this palette's first use; the same five now run the
// site's structural signals (progress bar, section dots, indices, seams).
const FLAP_PALETTE = SPECTRUM;

function SplitFlapTextInner({
  text,
  className = "",
  speed = 50,
  fontSize = DEFAULT_FONT_SIZE,
  multicolor = false,
  announce = true,
}: SplitFlapTextProps) {
  const chars = useMemo(() => text.split(""), [text]);
  // The wordmark flips ONCE per mount — i.e. on page load/refresh and on
  // navigating back to the home route (each remounts this component). It
  // deliberately does NOT re-flip on hover: that re-ran the whole ~2.5s flip on
  // every pointer-enter and read as a constant flicker. animationKey is fixed, so
  // the flip is a one-time entrance, never an interaction.
  const [animationKey] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setHasInitialized(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative inline-flex items-center ${className}`} style={{ perspective: "1000px" }}>
      {/* Flaps are decorative; the word is announced once for assistive tech. */}
      {announce && <span className="sr-only">{text}</span>}
      <span aria-hidden="true" className="inline-flex items-center gap-[0.08em]">
        {chars.map((char, index) => (
          <SplitFlapChar
            key={index}
            char={char.toUpperCase()}
            index={index}
            animationKey={animationKey}
            skipEntrance={hasInitialized}
            speed={speed}
            fontSize={fontSize}
            reduced={reduced}
            multicolor={multicolor}
          />
        ))}
      </span>
    </div>
  );
}

export function SplitFlapText(props: SplitFlapTextProps) {
  return <SplitFlapTextInner {...props} />;
}

interface SplitFlapCharProps {
  char: string;
  index: number;
  animationKey: number;
  skipEntrance: boolean;
  speed: number;
  fontSize: string;
  reduced: boolean;
  multicolor: boolean;
}

function SplitFlapChar({
  char,
  index,
  animationKey,
  skipEntrance,
  speed,
  fontSize,
  reduced,
  multicolor,
}: SplitFlapCharProps) {
  const displayChar = CHARSET.includes(char) ? char : " ";
  const isSpace = char === " ";
  const settledFromStart = skipEntrance || reduced;
  const [currentChar, setCurrentChar] = useState(settledFromStart ? displayChar : " ");
  const [isSettled, setIsSettled] = useState(settledFromStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cascade step per tile. Kept tight (0.05s) so a 12-tile wordmark like the hero
  // name "sets" left-to-right in ~0.5s of start-times rather than stretching the
  // last letters ~1.6s out — the difference between a crisp departure-board set and
  // a name that churns as gibberish for seconds. Drives both the motion entrance
  // (fade/flap delay) and the character-flutter start delay below.
  const tileDelay = 0.05 * index;

  // Transient colour while flipping, settling to our foreground on the near-black
  // bg. A `multicolor` board draws a fixed per-tile hue from the counter palette
  // (keyed by index); otherwise it's the single --accent. Either way the tile and
  // its faint card tint settle to --fg / --bg, so the resting wordmark is mono.
  const flipColor = multicolor ? FLAP_PALETTE[index % FLAP_PALETTE.length] : "var(--accent)";
  const bgColor = isSettled ? "var(--bg)" : `color-mix(in srgb, ${flipColor} 20%, transparent)`;
  const textColor = isSettled ? "var(--fg)" : flipColor;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (isSpace) {
      setCurrentChar(" ");
      setIsSettled(true);
      return;
    }

    // Reduced motion: show the final glyph immediately — no flipping, no audio.
    if (reduced) {
      setCurrentChar(displayChar);
      setIsSettled(true);
      return;
    }

    setIsSettled(false);
    setCurrentChar(CHARSET[Math.floor(Math.random() * CHARSET.length)]);

    const baseFlips = 6;
    const startDelay = skipEntrance ? tileDelay * 400 : tileDelay * 800;
    let flipIndex = 0;
    let hasStartedSettling = false;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        // Flutter count grows only +1 per tile (was +3): later letters flip a touch
        // longer for an organic cascade, but the whole word still locks in ~1.3s.
        // The previous +index*3 made the last tile flip ~41× (≈2s of gibberish).
        const settleThreshold = baseFlips + index;

        if (flipIndex >= settleThreshold && !hasStartedSettling) {
          hasStartedSettling = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
          setCurrentChar(displayChar);
          setIsSettled(true);
          return;
        }
        setCurrentChar(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
        flipIndex++;
      }, speed);
    }, startDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // `skipEntrance` is read inside but intentionally NOT a dependency: it flips
    // true 1s after mount and must not re-trigger the flip — only the initial
    // mount drives it. (animationKey is now fixed; the hover re-flip was removed
    // because re-running the flip on every pointer-enter read as a flicker.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayChar, isSpace, tileDelay, animationKey, index, speed, reduced]);

  if (isSpace) {
    return <div style={{ width: "0.3em", fontSize }} />;
  }

  return (
    <motion.div
      initial={settledFromStart ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : tileDelay, duration: reduced ? 0 : 0.3, ease: "easeOut" }}
      className="relative flex items-center justify-center overflow-hidden font-display"
      style={{
        fontSize,
        width: "0.65em",
        height: "1.05em",
        backgroundColor: bgColor,
        transformStyle: "preserve-3d",
        transition: "background-color 0.15s ease",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[1px] bg-black/20" />

      <div className="absolute inset-x-0 top-0 bottom-1/2 flex items-end justify-center overflow-hidden">
        <span className="block translate-y-[0.52em] leading-none transition-colors duration-150" style={{ color: textColor }}>
          {currentChar}
        </span>
      </div>

      <div className="absolute inset-x-0 top-1/2 bottom-0 flex items-start justify-center overflow-hidden">
        <span className="-translate-y-[0.52em] leading-none transition-colors duration-150" style={{ color: textColor }}>
          {currentChar}
        </span>
      </div>

      <motion.div
        key={`${animationKey}-${isSettled}`}
        initial={reduced ? false : { rotateX: -90 }}
        animate={{ rotateX: 0 }}
        transition={{
          delay: reduced ? 0 : skipEntrance ? tileDelay * 0.5 : tileDelay + 0.15,
          duration: reduced ? 0 : 0.25,
          ease: [0.22, 0.61, 0.36, 1],
        }}
        className="absolute inset-x-0 top-0 bottom-1/2 origin-bottom overflow-hidden"
        style={{
          backgroundColor: bgColor,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          transition: "background-color 0.15s ease",
        }}
      >
        <div className="flex h-full items-end justify-center">
          <span className="translate-y-[0.52em] leading-none transition-colors duration-150" style={{ color: textColor }}>
            {currentChar}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
