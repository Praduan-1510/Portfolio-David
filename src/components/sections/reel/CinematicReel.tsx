"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { distance } from "@/lib/motion/tokens";
import {
  useReducedMotion,
  prefersReducedMotion,
} from "@/hooks/useReducedMotion";
import { Container } from "@/components/primitives";
import { AnimatedNoise, FlapText } from "@/components/motion";
import { ROWS, BoardRow, StatusValue } from "../CurrentlyBoard";
import { FRAME_COUNT, framePath, createFrameLoader } from "./frames";
import { drawImageCover } from "@/lib/canvas/drawCover";

/*
 * The cinematic reel — the home page's second beat. A tall track directly after
 * the 100svh hero holds a sticky full-viewport stage; a scrubbed ScrollTrigger
 * maps scroll progress onto a 36-frame clip (Praduan turns from the camera and
 * walks away down the path) drawn cover-fit on a <canvas>, so the film starts
 * playing with the FIRST scroll tick of the hero, continues while the board is
 * on screen, then dims back into the page before the work grid.
 *
 * Choreography (one timeline, duration normalized to 1 == scroll progress):
 *   0.00–0.10  --bg veil fades out — the clip emerges from the hero's darkness
 *   0.00–0.87  frames 1→36 scrub (Math.round mapping; draw only on index change)
 *   0.34/0.47/0.60/0.73  board rows rise in (scrubbed → reverse cleanly);
 *                        FlapText flutter fires ONCE per row via a monotonic
 *                        threshold gate (trigger="manual"), never re-fires
 *   0.88–1.00  veil returns to 0.85 — the imagery recedes, sticky releases,
 *              and #work scrolls in over the dimmed final frame
 *
 * Engineering notes:
 *   - CSS sticky, NOT ScrollTrigger pin: Lenis runs syncTouch:false (native
 *     touch), where fixed-position pinning jitters on iOS and normalizeScroll
 *     would fight Lenis. Sticky is compositor-driven and React-DOM-safe.
 *   - Canvas (not <img>) keeps the full-bleed imagery off the LCP path, same
 *     rationale as AboutHeroMap. The one real <img> (frame 1) is the no-JS
 *     poster and the whole reduced-motion visual.
 *   - Track height is static CSS → section positions below never shift, no
 *     ScrollTrigger.refresh() choreography needed.
 *   - Reduced motion is handled by motion-safe:/motion-reduce: CSS variants
 *     (SSR-correct, no hydration mismatch) + the usual JS guards: static
 *     poster + settled board in normal flow, no tall track, no scrub.
 */

// Row reveal window starts (== scroll progress). Entry phase (stage sliding
// into view under the hero) ends ≈0.29 desktop / 0.36 mobile — rows begin
// right as the stage locks.
const ROW_AT = [0.34, 0.47, 0.6, 0.73] as const;
const ROW_LEN = 0.07; // scrub length of each row's rise
const FRAME_SPAN = 0.87; // frames map over [0, 0.87]; the last frame holds
const DIM_AT = 0.88; // where the imagery starts receding into --bg

export function CinematicReel() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dlRef = useRef<HTMLDListElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  // Bridge from the ScrollTrigger (below) into the canvas effect's closure.
  const drawRef = useRef<(i: number) => void>(() => {});
  const activeRef = useRef(0); // ref mirror of activeRows — no setState per tick
  const [activeRows, setActiveRows] = useState(0);
  const reduced = useReducedMotion();

  // Frame loading + drawing. Lives in its own effect (not useGSAP) because it
  // owns network/decode lifecycle, not tweens.
  useEffect(() => {
    if (reduced) return; // CSS hides the canvas; skip the 488KB fetch entirely
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const loader = createFrameLoader();
    let lastDrawn = -1;
    let current = 0;
    let shown = false;

    const draw = (target: number) => {
      const i = loader.nearestReady(target); // closest decoded frame, never blank
      const img = i >= 0 ? loader.img(i) : undefined;
      if (!img || i === lastDrawn) return;
      lastDrawn = i;
      // Anchor slightly above centre — keeps the face in frame as crops change.
      drawImageCover(ctx, img, canvas.clientWidth, canvas.clientHeight, 0.5, 0.42);
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1"; // fade in on first draw (AboutHeroMap pattern)
      }
    };

    const size = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawn = -1; // force redraw at the new size
      draw(current);
    };

    drawRef.current = (i) => {
      current = i;
      if (counterRef.current) {
        counterRef.current.textContent = `FR ${String(i + 1).padStart(3, "0")} / ${String(FRAME_COUNT).padStart(3, "0")}`;
      }
      draw(i);
    };

    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();
    loader.start(() => draw(current));
    return () => {
      ro.disconnect();
      loader.dispose();
      drawRef.current = () => {};
    };
  }, [reduced]);

  // The scrubbed choreography.
  useGSAP(
    () => {
      registerGsap();
      const section = sectionRef.current;
      const veil = veilRef.current;
      const dl = dlRef.current;
      if (prefersReducedMotion() || !section || !veil || !dl) return;

      const rows = Array.from(dl.children) as HTMLElement[];
      // Hidden ONLY here (never in markup) — SSR/no-JS keeps everything readable.
      gsap.set(dl, { autoAlpha: 0 }); // board rails ride in with the first row
      gsap.set(rows, { autoAlpha: 0, y: distance.md });
      gsap.set(veil, { opacity: 1 }); // stage enters dark — hand-off from the hero scrim

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top bottom", // track top meets viewport bottom == scroll 0
          end: "bottom bottom",
          scrub: true, // Lenis lerp 0.1 already smooths — don't double-lag
          onUpdate(self) {
            drawRef.current(
              Math.round(
                Math.min(self.progress / FRAME_SPAN, 1) * (FRAME_COUNT - 1),
              ),
            );
            // Monotonic flutter gate: activates each row's one-shot flap the
            // first time its window is crossed; reversing never resets it.
            const next = ROW_AT.filter((t) => self.progress >= t).length;
            if (next > activeRef.current) {
              activeRef.current = next;
              setActiveRows(next);
            }
          },
        },
      });

      tl.to(veil, { opacity: 0, duration: 0.1, ease: "power1.out" }, 0);
      tl.to(dl, { autoAlpha: 1, duration: ROW_LEN }, ROW_AT[0]);
      rows.forEach((row, i) => {
        tl.to(row, { autoAlpha: 1, y: 0, duration: ROW_LEN, ease: "expo.out" }, ROW_AT[i]);
      });
      tl.to(veil, { opacity: 0.85, duration: 1 - DIM_AT, ease: "power1.in" }, DIM_AT);
    },
    { scope: sectionRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section
      ref={sectionRef}
      id="currently"
      aria-label="Currently — status board"
      className="relative scroll-mt-16 bg-bg motion-safe:h-[280vh] md:motion-safe:h-[350vh]"
    >
      {/* Sticky stage — one viewport (minus the h-16 nav), held while the track
          scrolls. Under reduced motion it's a normal-flow block. */}
      <div className="relative overflow-hidden motion-safe:sticky motion-safe:top-16 motion-safe:h-[calc(100svh-4rem)]">
        {/* Base frame — no-JS poster and the whole reduced-motion visual. A raw
            <img> (not next/image): below the fold, and the moving imagery is
            deliberately canvas so it never becomes the LCP (AboutHeroMap). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={framePath(0)}
          width={854}
          height={480}
          alt="Praduan turning from the camera and walking away down a tree-lined path"
          loading="lazy"
          decoding="async"
          className="block w-full object-cover motion-safe:absolute motion-safe:inset-0 motion-safe:h-full"
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-slower ease-out-expo motion-reduce:hidden"
        />
        {/* Reading scrim — pools --bg over the lower band where the board sits. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] motion-reduce:hidden"
          style={{
            background:
              "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 62%, transparent) 45%, transparent 100%)",
          }}
        />
        {/* Veil/dim — opaque at entry (hero hand-off), scrubbed out, then back
            to 0.85 at the end so the clip recedes into the page. Sits BELOW the
            board so the rows stay crisp through the dim. Opacity 0 in markup;
            the effect owns its life (visible-by-default rule). */}
        <div
          ref={veilRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-bg opacity-0 motion-reduce:hidden"
        />
        <AnimatedNoise opacity={0.05} className="motion-reduce:hidden" />
        {/* Frame counter — instrument voice, updated via ref (no re-renders). */}
        <span
          ref={counterRef}
          aria-hidden="true"
          className="absolute right-space-5 top-space-5 font-mono text-caption tabular-nums tracking-[0.18em] text-muted motion-reduce:hidden"
        >
          FR 001 / 036
        </span>

        {/* The board — dl/dt/dd semantics preserved (BoardRow unchanged). */}
        <Container className="relative py-space-7 motion-safe:absolute motion-safe:inset-x-0 motion-safe:bottom-0 motion-safe:py-0 motion-safe:pb-space-7 short-land:pb-space-4">
          <dl ref={dlRef} className="border-y border-line">
            {ROWS.map((row, i) => (
              <BoardRow key={row.label} index={i} label={row.label}>
                <FlapText
                  text={row.value.toUpperCase()}
                  trigger="manual"
                  active={activeRows > i}
                  flips={3}
                />
              </BoardRow>
            ))}
            <BoardRow index={ROWS.length} label="Status">
              <StatusValue flapTrigger="manual" active={activeRows > ROWS.length} />
            </BoardRow>
          </dl>
        </Container>
      </div>
    </section>
  );
}
