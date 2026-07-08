"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Signature — the hand-signed counter-mark to the machine-set split-flap
 * wordmark. Real script letterforms (Mrs Saint Delafield via --font-signature —
 * hand-authored bezier "signatures" read as scribble, a designed script face
 * reads as a pen), revealed with a left-to-right writing wipe as if being
 * signed, then finished by ONE drawn underline swash that inks in beneath.
 *
 * Reduced motion → fully signed and static from frame one. Colour inherits
 * (currentColor); scale via font-size classes on the wrapper.
 */

const WRITE_EASE = [0.65, 0, 0.35, 1] as const;

export function Signature({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <span
      role="img"
      aria-label="Praduan Saha — signature"
      className={cn("inline-block", className)}
    >
      {/* The autograph — clip-path insets are negative on top/bottom/left so
          the script's tall ascenders and lead-in stroke never get shaved. */}
      <motion.span
        aria-hidden="true"
        className="block whitespace-nowrap font-signature leading-none"
        initial={
          reduced ? false : { clipPath: "inset(-30% 100% -25% -6%)", opacity: 0.4 }
        }
        animate={{ clipPath: "inset(-30% -6% -25% -6%)", opacity: 1 }}
        transition={{
          clipPath: { delay, duration: 1.15, ease: WRITE_EASE },
          opacity: { delay, duration: 0.2 },
        }}
      >
        Praduan Saha
      </motion.span>
      {/* Underline swash — a single confident sweep, drawn after the name. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 300 22"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className="-mt-[0.18em] block h-[0.32em] w-[86%]"
      >
        <motion.path
          d="M4 15 C 70 21.5, 176 19, 236 10.5 S 290 4.5, 296 6.5"
          strokeWidth={2.4}
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { delay: delay + 1.0, duration: 0.5, ease: WRITE_EASE },
            opacity: { delay: delay + 1.0, duration: 0.12 },
          }}
        />
      </svg>
    </span>
  );
}
