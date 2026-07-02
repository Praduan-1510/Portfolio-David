"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { SPECTRUM } from "@/lib/spectrum";

/*
 * Inline split-flap character flutter — the signature motif scaled down to the
 * mono-caps metadata voice (eyebrows, board rows, chips). JetBrains Mono is
 * monospace, so cycling glyphs causes ZERO layout shift; that's why this is
 * safe exactly where the mono voice already lives, and nowhere else.
 *
 * No tiles, no 3D — just characters ticking through the charset at the `tick`
 * cadence (one gsap.ticker per instance, removed when settled) with a tight
 * left-to-right cascade, an optional transient colour pass, then settling to
 * inherit. Reduced motion renders the settled text immediately.
 *
 * DOSAGE: one flutter per viewport; hover-flutter only on nav chip / work rows
 * / next-project handoff (see SplitFlapText.tsx for the full design law).
 */

interface FlapTextProps {
  text: string;
  /** "inView" (default) flutters once when scrolled into view; "load" on mount;
   *  "hover" re-flutters on pointer-enter of the wrapping element. */
  trigger?: "inView" | "load" | "hover";
  /** Flutter steps per character before it locks (small = restrained). */
  flips?: number;
  /** Transient colour while fluttering: the 5-hue spectrum sweep, the current
   *  --accent, or none (inherit throughout). */
  colorMode?: "spectrum" | "accent" | "mono";
  className?: string;
  as?: "span" | "div";
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—+%↗".split("");

const flutterChar = (step: number, index: number, target: string) => {
  // Preserve spaces/punctuation rhythm: only alphanumerics flutter.
  if (!/[A-Z0-9]/i.test(target)) return target;
  return CHARSET[(step * 29 + index * 13) % 36];
};

export function FlapText({
  text,
  trigger = "inView",
  flips = 4,
  colorMode = "spectrum",
  className = "",
  as: Tag = "span",
}: FlapTextProps) {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLElement>(null);
  const [run, setRun] = useState(0); // increments to (re)start a flutter
  const [step, setStep] = useState(Infinity); // Infinity = settled
  const chars = text.split("");
  const totalSteps = flips + chars.length; // cascade: char i settles at flips + i

  // Trigger wiring.
  useEffect(() => {
    if (reduced) return;
    const el = hostRef.current;
    if (!el) return;
    if (trigger === "load") {
      setRun(1);
      return;
    }
    if (trigger === "inView") {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRun(1);
            io.disconnect();
          }
        },
        { threshold: 0.6 },
      );
      io.observe(el);
      return () => io.disconnect();
    }
    // hover: listen on the nearest positioned/interactive parent group.
    const target = el.closest("a, button, [data-flap-hover]") ?? el;
    const onEnter = () => setRun((r) => r + 1);
    target.addEventListener("pointerenter", onEnter);
    return () => target.removeEventListener("pointerenter", onEnter);
  }, [trigger, reduced]);

  // One ticker per active flutter.
  useEffect(() => {
    if (reduced || run === 0) return;
    registerGsap();
    setStep(0);
    let elapsed = 0;
    let current = 0;
    const cb = () => {
      elapsed += gsap.ticker.deltaRatio(60) / 60;
      const target = Math.floor(elapsed / durations.tick);
      if (target > current) {
        current = Math.min(target, totalSteps);
        setStep(current);
        if (current >= totalSteps) gsap.ticker.remove(cb);
      }
    };
    gsap.ticker.add(cb);
    return () => gsap.ticker.remove(cb);
  }, [run, reduced, totalSteps]);

  const settledAll = reduced || run === 0 || step >= totalSteps;

  return (
    <Tag ref={hostRef as React.Ref<never>} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((c, i) => {
          const settled = settledAll || step >= flips + i;
          const color = settled
            ? undefined
            : colorMode === "spectrum"
              ? SPECTRUM[i % SPECTRUM.length]
              : colorMode === "accent"
                ? "var(--accent)"
                : undefined;
          return (
            <span key={i} style={color ? { color } : undefined}>
              {settled ? c : flutterChar(step, i, c)}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
