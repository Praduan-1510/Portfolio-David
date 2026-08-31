"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";
import { SIGNATURE_PATH, SIGNATURE_VIEWBOX } from "./signature-path";

/*
 * Signature: the hand-signed counter-mark to the machine-set split-flap
 * wordmark. This is Praduan's actual signature, photographed from a signed
 * sheet and vectorised (see signature-path.ts for the trace pipeline).
 *
 * It replaced Mrs Saint Delafield, and the note here used to argue that a
 * designed script face reads as a pen where hand-authored beziers read as
 * scribble. That was right about drawn-by-guesswork beziers and wrong about
 * the conclusion. Roundhand is the language of wedding stationery: extreme
 * thick/thin from a pointed nib, flourished capitals, perfectly even rhythm,
 * none of which happens when someone signs their name in two seconds. No
 * typeface is anyone's signature. This one is his.
 *
 * It reads "Saha", the surname, because that is how he actually signs. The
 * accessible name still gives the full name, since that is what the mark
 * stands for on the page.
 *
 * Because the artwork is a filled outline rather than a set of centrelines, it
 * cannot be "drawn" by animating pathLength. The writing effect is therefore a
 * left-to-right clip wipe, which is the same technique the type version used
 * and the correct one for filled glyphs: ink appears as the hand travels.
 *
 * Sized in em so the caller still controls scale with a font-size class, as
 * before. Colour inherits (currentColor).
 *
 * Reduced motion renders it fully signed and static from frame one.
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
      aria-label="Praduan Saha: signature"
      className={cn("inline-block", className)}
    >
      <motion.svg
        aria-hidden="true"
        viewBox={SIGNATURE_VIEWBOX}
        className="block h-auto w-[4.2em] overflow-visible"
        /* Insets are negative so the wipe never shaves the ascender or the
           terminal, and only the left edge travels. */
        initial={reduced ? false : { clipPath: "inset(-8% 100% -8% -3%)" }}
        animate={{ clipPath: "inset(-8% -3% -8% -3%)" }}
        transition={{ delay, duration: 1.1, ease: WRITE_EASE }}
      >
        <path d={SIGNATURE_PATH} fill="currentColor" fillRule="evenodd" />
      </motion.svg>
    </span>
  );
}
