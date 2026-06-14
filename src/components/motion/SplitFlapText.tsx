"use client";

import type React from "react";
import { motion } from "motion/react";
import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Split-flap (departure board) text — a SHORT, UPPERCASE wordmark whose letters
 * flip through the charset before settling. Built for A–Z / 0–9; any other glyph
 * renders as a gap. Ported from the v0 export and adapted to our system:
 *   - framer-motion → motion/react (the package we already ship);
 *   - flipping state recolored from hardcoded orange to our --accent, settling to
 *     --fg on the --bg near-black (DESIGN_GUIDELINES.md §4 monochrome + a single
 *     accent used as a transient "computational" highlight, not a base);
 *   - typeface points at --font-display (Bricolage Grotesque) instead of --font-bebas;
 *   - sound is MUTED by default with an accessible toggle (no autoplaying audio, §13);
 *   - reduced motion renders the settled text instantly — no flipping, no audio;
 *   - an optional `fontSize` so it can sit at headline scale in the hero.
 *
 * Designed to live on a dark surface (e.g. the data-theme="dark" hero), where the
 * tokens resolve to near-black flaps / off-white type / a raised accent.
 */

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playClick: () => void;
}

const SplitFlapAudioContext = createContext<AudioContextType | null>(null);

function useSplitFlapAudio() {
  return useContext(SplitFlapAudioContext);
}

export function SplitFlapAudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true); // muted by default — no autoplay
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    return audioContextRef.current;
  }, []);

  const triggerHaptic = useCallback(() => {
    if (isMuted) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, [isMuted]);

  const playClick = useCallback(() => {
    if (isMuted) return;

    triggerHaptic();

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const lowpass = ctx.createBiquadFilter();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.015);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      lowpass.type = "lowpass";
      lowpass.frequency.value = 2500;
      lowpass.Q.value = 0.5;

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(lowpass);
      lowpass.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.02);
    } catch {
      // Audio not supported
    }
  }, [isMuted, getAudioContext, triggerHaptic]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    if (isMuted) {
      try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === "suspended") {
          ctx.resume();
        }
      } catch {
        // Audio not supported
      }
    }
  }, [isMuted, getAudioContext]);

  const value = useMemo(() => ({ isMuted, toggleMute, playClick }), [isMuted, toggleMute, playClick]);

  return <SplitFlapAudioContext.Provider value={value}>{children}</SplitFlapAudioContext.Provider>;
}

export function SplitFlapMuteToggle({ className = "" }: { className?: string }) {
  const audio = useSplitFlapAudio();
  if (!audio) return null;

  return (
    <button
      type="button"
      onClick={audio.toggleMute}
      className={cnToggle(className)}
      aria-label={audio.isMuted ? "Unmute sound effects" : "Mute sound effects"}
      aria-pressed={!audio.isMuted}
    >
      {audio.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span>{audio.isMuted ? "Sound Off" : "Sound On"}</span>
    </button>
  );
}

// Toggle styling, on our tokens (font-mono label, muted → fg on hover).
function cnToggle(className: string) {
  return [
    "inline-flex items-center gap-space-2 font-mono text-[10px] uppercase tracking-[0.18em]",
    "text-muted transition-colors duration-fast ease-out-quad hover:text-fg",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

interface SplitFlapTextProps {
  text: string;
  className?: string;
  /** ms between flips. */
  speed?: number;
  /** CSS font-size for the flaps; defaults to the v0 giant clamp. */
  fontSize?: string;
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const DEFAULT_FONT_SIZE = "clamp(4rem, 15vw, 14rem)";

function SplitFlapTextInner({
  text,
  className = "",
  speed = 50,
  fontSize = DEFAULT_FONT_SIZE,
}: SplitFlapTextProps) {
  const chars = useMemo(() => text.split(""), [text]);
  const [animationKey, setAnimationKey] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const reduced = useReducedMotion();
  const audio = useSplitFlapAudio();

  const handleMouseEnter = useCallback(() => {
    if (reduced) return; // no re-flip under reduced motion
    setAnimationKey((prev) => prev + 1);
  }, [reduced]);

  useEffect(() => {
    const timer = setTimeout(() => setHasInitialized(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative inline-flex items-center ${className}`} style={{ perspective: "1000px" }}>
      {/* Flaps are decorative; the word is announced once for assistive tech. */}
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-[0.08em] ${reduced ? "" : "cursor-pointer"}`}
        onMouseEnter={handleMouseEnter}
      >
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
            playClick={audio?.playClick}
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
  playClick?: () => void;
}

function SplitFlapChar({
  char,
  index,
  animationKey,
  skipEntrance,
  speed,
  fontSize,
  reduced,
  playClick,
}: SplitFlapCharProps) {
  const displayChar = CHARSET.includes(char) ? char : " ";
  const isSpace = char === " ";
  const settledFromStart = skipEntrance || reduced;
  const [currentChar, setCurrentChar] = useState(settledFromStart ? displayChar : " ");
  const [isSettled, setIsSettled] = useState(settledFromStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tileDelay = 0.15 * index;

  // Recolored from the v0 orange: a transient accent while flipping, settling to
  // our foreground on the near-black bg.
  const bgColor = isSettled ? "var(--bg)" : "color-mix(in srgb, var(--accent) 20%, transparent)";
  const textColor = isSettled ? "var(--fg)" : "var(--accent)";

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

    const baseFlips = 8;
    const startDelay = skipEntrance ? tileDelay * 400 : tileDelay * 800;
    let flipIndex = 0;
    let hasStartedSettling = false;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const settleThreshold = baseFlips + index * 3;

        if (flipIndex >= settleThreshold && !hasStartedSettling) {
          hasStartedSettling = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
          setCurrentChar(displayChar);
          setIsSettled(true);
          if (playClick) playClick();
          return;
        }
        setCurrentChar(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
        if (flipIndex % 2 === 0 && playClick) playClick();
        flipIndex++;
      }, speed);
    }, startDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // `skipEntrance` is read inside but intentionally NOT a dependency: it flips
    // true 1s after mount and must not re-trigger the flip — only the initial
    // mount and hover (animationKey) should. Its latest value is still read when
    // animationKey changes, since that re-runs the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayChar, isSpace, tileDelay, animationKey, index, speed, reduced, playClick]);

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
