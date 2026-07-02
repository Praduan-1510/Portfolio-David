"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";

/*
 * Odometer digits in the split-flap language — for stat values. Digits tick
 * through 0–9 at the `tick` cadence and settle RIGHT-TO-LEFT (an odometer
 * locking its smallest wheel last reads mechanical; locking left-to-right
 * reads like a slot machine). Non-digit glyphs (".", "%", "→", units) render
 * static so "0.00", "277→1" and "~70%" keep their shape while their digits
 * flutter. tabular-nums prevents any width wobble.
 *
 * Flutters once on scroll-in (IntersectionObserver), announced once sr-only.
 * Reduced motion renders the settled value immediately.
 */

interface FlapDigitsProps {
  value: string | number;
  /** Flutter steps before the rightmost digit locks. */
  flips?: number;
  className?: string;
}

export function FlapDigits({ value, flips = 8, className = "" }: FlapDigitsProps) {
  const text = String(value);
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(-1); // -1 = not started (shows settled SSR)
  const chars = text.split("");
  const digitPositions = chars
    .map((c, i) => (/[0-9]/.test(c) ? i : -1))
    .filter((i) => i >= 0);
  // Right-to-left settle: the LAST digit locks after `flips`, each digit to its
  // left locks 2 steps later... inverted: leftmost locks first? No — odometer:
  // leftmost (biggest wheel) locks first, rightmost keeps spinning longest.
  const settleAt = new Map(
    digitPositions.map((pos, orderFromLeft) => [pos, flips + orderFromLeft * 2]),
  );
  const totalSteps = flips + Math.max(0, digitPositions.length - 1) * 2 + 1;

  useEffect(() => {
    if (reduced) return;
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
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
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, totalSteps]);

  const running = !reduced && step >= 0 && step < totalSteps;

  return (
    <span ref={hostRef} className={`tabular-nums ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((c, i) => {
          if (!/[0-9]/.test(c)) return <span key={i}>{c}</span>;
          const lockAt = settleAt.get(i) ?? 0;
          const settled = !running || step >= lockAt;
          return (
            <span key={i}>{settled ? c : String((step * 7 + i * 3) % 10)}</span>
          );
        })}
      </span>
    </span>
  );
}
