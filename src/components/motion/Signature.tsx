"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/*
 * Signature: the hand-signed counter-mark to the machine-set split-flap
 * wordmark. A drawn mark, not type.
 *
 * This replaced Mrs Saint Delafield, and the earlier note here argued the
 * opposite ("hand-authored bezier signatures read as scribble, a designed
 * script face reads as a pen"). Half of that is right and worth keeping in
 * mind: a first attempt at connected cursive here did collapse into scribble,
 * because a/u/n all degrade into the same wave once you join them. The fix was
 * not to go back to type, it was to stop writing cursive. These letterforms
 * stay printed so each keeps its identity, and only five joins survive, placed
 * where a hand genuinely carries through (after a, d, u, a and h).
 *
 * The reason type had to go: Mrs Saint Delafield is formal English roundhand,
 * the language of wedding stationery and diplomas. It has extreme thick/thin
 * from a pointed nib, flourished capitals and a perfectly even rhythm, none of
 * which happens when a person signs their name in two seconds. It also meant
 * the underline had to be a separate centred swash applied beneath the name,
 * which is the giveaway: on a real signature the underline is the exit stroke
 * of the last letter. Here it is, leaving the final "a" and sweeping back.
 *
 * Geometry: skeleton on a 118 baseline with the x-height top at 76 and
 * ascenders at 34, sheared 8.5deg. Downstrokes are 6.2 and joins 4.8, since a
 * real pen leaves more ink coming down than going across; the exit thins to
 * 3.4 as the hand lifts.
 *
 * Sized in em so the caller still controls it with a font-size class, exactly
 * as the type version did. Colour inherits (currentColor).
 *
 * Reduced motion renders it fully signed and static from frame one.
 */

const WRITE_EASE = [0.65, 0, 0.35, 1] as const;

/* In writing order, left to right. `w` overrides the default join weight. */
const STROKES: { d: string; w?: number }[] = [
  { d: "M86 38 C 74 70, 62 104, 54 140", w: 6.2 },
  { d: "M86 38 C 117 26, 138 46, 125 65 C 115 79, 90 82, 66 79" },
  { d: "M122 80 C 119 93, 116 105, 114 116" },
  { d: "M117 89 C 127 75, 141 72, 150 82" },
  { d: "M178 80 C 164 73, 151 84, 154 98 C 157 110, 171 112, 178 99 C 183 89, 181 82, 184 75 C 181 92, 181 104, 188 114" },
  { d: "M188 114 C 196 118, 204 117, 210 111" },
  { d: "M224 34 C 219 66, 214 98, 211 118", w: 6.2 },
  { d: "M213 92 C 200 81, 185 88, 186 101 C 187 113, 201 117, 211 106" },
  { d: "M211 118 C 220 120, 228 116, 234 108" },
  { d: "M242 79 C 237 94, 235 107, 242 114 C 251 120, 260 107, 263 93" },
  { d: "M263 79 C 260 96, 259 108, 266 117" },
  { d: "M266 117 C 276 120, 286 113, 292 104" },
  { d: "M298 81 C 284 74, 271 85, 274 99 C 277 111, 291 113, 298 100 C 303 90, 301 83, 304 76 C 301 93, 301 106, 308 117" },
  { d: "M308 117 C 314 120, 318 119, 321 115" },
  { d: "M320 117 C 317 102, 320 87, 325 81 C 334 77, 342 86, 341 96 C 340 107, 338 113, 338 119" },
  { d: "M452 46 C 437 28, 399 32, 395 55 C 391 77, 430 80, 434 101 C 438 124, 403 132, 389 115" },
  { d: "M474 81 C 460 74, 447 85, 450 99 C 453 111, 467 113, 474 100 C 479 90, 477 83, 480 76 C 477 93, 477 106, 484 117" },
  { d: "M484 117 C 490 120, 494 119, 497 114" },
  { d: "M508 34 C 503 66, 498 97, 495 118", w: 6.2 },
  { d: "M496 96 C 505 83, 519 81, 525 90 C 529 97, 526 108, 526 118" },
  { d: "M526 118 C 536 121, 545 115, 551 107" },
  { d: "M558 81 C 544 74, 531 85, 534 99 C 537 111, 551 113, 558 100 C 563 90, 561 83, 564 76 C 561 93, 561 106, 570 117" },
];

/* The terminal: leaves the final "a" and sweeps back under the whole name. */
const EXIT = "M570 117 C 599 130, 585 152, 524 154 C 404 158, 190 153, 66 141";

/* The name writes over this long; the exit stroke follows it. */
const WRITE = 1.05;

export function Signature({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const step = WRITE / STROKES.length;

  return (
    <span
      role="img"
      aria-label="Praduan Saha: signature"
      className={cn("inline-block", className)}
    >
      <svg
        aria-hidden="true"
        viewBox="118 22 566 146"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block h-auto w-[5em] overflow-visible"
      >
        {/* Sheared here rather than in the path data, so the skeleton stays
            readable and the slant is one number to tune. */}
        <g transform="matrix(1,0,-0.15,1,92,0)">
          {STROKES.map((s, i) => (
            <motion.path
              key={i}
              d={s.d}
              strokeWidth={s.w ?? 4.8}
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                delay: delay + i * step,
                duration: step * 2.2,
                ease: "easeOut",
              }}
            />
          ))}
          <motion.path
            d={EXIT}
            strokeWidth={3.4}
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              delay: delay + WRITE,
              duration: 0.55,
              ease: WRITE_EASE,
            }}
          />
        </g>
      </svg>
    </span>
  );
}
