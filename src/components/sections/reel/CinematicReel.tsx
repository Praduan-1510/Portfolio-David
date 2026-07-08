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
 * The cinematic reel — the film that IS the hero's backdrop and carries it
 * into the second beat.
 *
 * The section OVERLAPS the hero (motion-safe negative top margin = the hero's
 * height) and the hero paints ABOVE it (Hero.tsx is z-10 with a transparent
 * background), so the film is alive behind the type from first paint: frame 1
 * fades up under a resting --bg veil the moment it decodes. Scrolling scrubs
 * the frames from the very first tick while the veil lifts — the film
 * brightens to full as the type departs — then the "Currently" board rows
 * flutter in (synced to the frames) and the veil returns before the work grid.
 *
 * Choreography (one timeline, duration normalized to 1 == scroll progress):
 *   at rest    film visible behind the hero, dimmed by the veil (VEIL_REST)
 *   0.00–0.87  frames 1→36 scrub (Math.round mapping; draw only on index change)
 *   0.06–0.24  veil lifts VEIL_REST→0 — the film owns the frame as type leaves
 *   0.24       frame counter fades in (instrument voice, film now foreground)
 *   0.36/0.49/0.62/0.75  board rows rise in (scrubbed → reverse cleanly);
 *                        FlapText flutter fires ONCE per row via a monotonic
 *                        threshold gate (trigger="manual"), never re-fires
 *   0.88–1.00  the veil rises to 0.85 — the imagery recedes, sticky releases,
 *              and #work scrolls in over the dimmed final frame
 *
 * Engineering notes:
 *   - CSS sticky, NOT ScrollTrigger pin: Lenis runs syncTouch:false (native
 *     touch), where fixed-position pinning jitters on iOS and normalizeScroll
 *     would fight Lenis. Sticky is compositor-driven and React-DOM-safe.
 *   - The whole section is pointer-events-none so the hero's CTAs/trace links
 *     stay clickable over the stage; the board is text-only.
 *   - Canvas (not <img>) keeps the full-bleed imagery off the LCP path, same
 *     rationale as AboutHeroMap — the hero headline stays the LCP even though
 *     the film shows from load. The one real <img> (frame 1) stays hidden in
 *     motion-safe mode and becomes the whole reduced-motion visual.
 *   - Track height is static CSS → section positions below never shift, no
 *     ScrollTrigger.refresh() choreography needed.
 *   - Reduced motion: motion-safe:/motion-reduce: CSS variants (SSR-correct,
 *     no hydration mismatch) + the usual JS guards: no overlap, no tall track,
 *     no scrub — static poster + settled board in normal flow.
 */

// Row reveal window starts (== scroll progress). The hero fully exits at
// ≈0.31 desktop / ≈0.37 mobile — rows begin just after the film owns the frame.
const ROW_AT = [0.36, 0.49, 0.62, 0.75] as const;
const ROW_LEN = 0.07; // scrub length of each row's rise
const FRAME_SPAN = 0.87; // frames map over [0, 0.87]; the last frame holds
const VEIL_REST = 0.62; // film dim while the hero type sits over it (lg+)
// Below lg the 16:9 clip cover-crops to a portrait viewport and the face fills
// the frame. The film stays BRIGHT (poster-style — it should read as a
// portrait, not murk); legibility comes from the taller bottom scrim under the
// type block instead of a global dim.
const VEIL_REST_PORTRAIT = 0.5;
const LIFT: [number, number] = [0.06, 0.18]; // veil lift [start, duration] — spans the hero's exit
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
    if (reduced) return; // CSS hides the canvas; skip the ~0.9MB fetch entirely
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high"; // 720p → full-bleed upscale
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
      const counter = counterRef.current;
      const dl = dlRef.current;
      if (prefersReducedMotion() || !section || !veil || !counter || !dl) return;

      const rows = Array.from(dl.children) as HTMLElement[];
      const rest = window.matchMedia("(min-width: 1024px)").matches
        ? VEIL_REST
        : VEIL_REST_PORTRAIT;
      // Hidden ONLY here (never in markup) — SSR/no-JS keeps everything readable.
      gsap.set(veil, { opacity: rest }); // film rests dimmed under the hero type
      gsap.set(counter, { autoAlpha: 0 }); // instrument readout waits for the film
      gsap.set(dl, { autoAlpha: 0 }); // board rails ride in with the first row
      gsap.set(rows, { autoAlpha: 0, y: distance.md });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top 64px", // track top sits at the nav's bottom at scroll 0
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

      // Lift: the veil clears as the hero type departs — the film brightens
      // from backdrop to foreground.
      tl.to(veil, { opacity: 0, duration: LIFT[1], ease: "power1.out" }, LIFT[0]);
      tl.to(counter, { autoAlpha: 1, duration: 0.06 }, LIFT[0] + LIFT[1]);
      tl.to(dl, { autoAlpha: 1, duration: ROW_LEN }, ROW_AT[0]);
      rows.forEach((row, i) => {
        tl.to(row, { autoAlpha: 1, y: 0, duration: ROW_LEN, ease: "expo.out" }, ROW_AT[i]);
      });
      // Recede: the imagery dims toward --bg before the sticky releases.
      tl.to(veil, { opacity: 0.85, duration: 1 - DIM_AT, ease: "power1.in" }, DIM_AT);
    },
    { scope: sectionRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section
      ref={sectionRef}
      id="currently"
      aria-label="Currently — status board"
      className="pointer-events-none relative scroll-mt-16 motion-reduce:pointer-events-auto motion-reduce:bg-bg motion-safe:-mt-[calc(100svh-4rem)] motion-safe:h-[360vh] md:motion-safe:h-[420vh]"
    >
      {/* Sticky stage — one viewport (minus the h-16 nav), covering the hero
          from scroll 0 (transparent until the film fades in). Under reduced
          motion it's a normal-flow block with no overlap. */}
      <div className="relative overflow-hidden motion-safe:sticky motion-safe:top-16 motion-safe:h-[calc(100svh-4rem)]">
        {/* Base frame — no-JS poster and the whole reduced-motion visual. Hidden
            in motion-safe mode: the stage overlaps the hero, so only the
            scrub-driven film layer may ever paint there. A raw <img> (not
            next/image): below the fold in the layout that shows it, and the
            moving imagery is deliberately canvas so it never becomes the LCP
            (AboutHeroMap). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={framePath(0)}
          width={1280}
          height={720}
          alt="Praduan turning from the camera and walking away down a tree-lined path"
          loading="lazy"
          decoding="async"
          className="block w-full object-cover motion-safe:invisible motion-safe:absolute motion-safe:inset-0 motion-safe:h-full"
        />
        {/* Film layer — canvas frames, reading scrim, grain, frame counter.
            Visible from load (the hero paints above it); the veil below owns
            the dimming. */}
        <div aria-hidden="true" className="absolute inset-0 motion-reduce:hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-slower ease-out-expo"
          />
          {/* Reading scrim — pools --bg over the lower band where the board
              (and, on portrait, the hero's title block) sits. Taller below lg:
              portrait keeps the film bright and leans on this gradient alone. */}
          <div
            className="absolute inset-x-0 bottom-0 h-[78%] lg:h-[62%]"
            style={{
              background:
                "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 62%, transparent) 45%, transparent 100%)",
            }}
          />
          <AnimatedNoise opacity={0.05} />
          {/* Frame counter — instrument voice, updated via ref (no re-renders). */}
          <span
            ref={counterRef}
            className="absolute right-space-5 top-space-5 font-mono text-caption tabular-nums tracking-[0.18em] text-muted"
          >
            FR 001 / 036
          </span>
        </div>
        {/* Veil — rests at VEIL_REST while the hero type sits over the film,
            lifts to 0 as the type departs, then rises to 0.85 over the last
            beat so the clip recedes into the page. Sits BELOW the board so the
            rows stay crisp. Markup opacity 0 (decorative) — the effect owns it. */}
        <div
          ref={veilRef}
          aria-hidden="true"
          className="absolute inset-0 bg-bg opacity-0 motion-reduce:hidden"
        />

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
