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
import { HeroFlow } from "@/components/sections/HeroFlow";
import { ROWS, BoardRow, StatusValue, BoardTitle } from "../CurrentlyBoard";
import { FRAME_COUNT, framePath, createFrameLoader } from "./frames";
import { drawImageCover } from "@/lib/canvas/drawCover";

/*
 * The cinematic reel — the film that IS the hero's backdrop and carries it
 * into the second beat.
 *
 * The section OVERLAPS the hero (motion-safe negative top margin = the hero's
 * height) and the hero paints ABOVE it (Hero.tsx is z-10 with a transparent
 * background), so the film is alive from first paint: frame 1 fades up under
 * a resting --bg veil the moment it decodes. Scrolling scrubs the frames from
 * the very first tick while the veil lifts — the film brightens to full as
 * the type departs — then the "Currently" board rows flutter in (synced to
 * the frames) and the veil returns before the work grid.
 *
 * Geometry — the 50/50 split (lg+): the film layer (canvas + scrim + grain +
 * veil) is confined to the RIGHT half of the sticky stage and
 * FEATHERS into the dark via a seam-blend gradient (no hard edge); the LEFT
 * half is the content panel, carrying the hero's atmosphere set (dot grid +
 * blooms + grain) so the backdrop never scrolls with the hero. The hero's
 * content column (Hero.tsx, w-1/2 of the same centered Container) and the
 * board ride that panel. Below lg everything is full-bleed exactly as before
 * — the film behind the type, dimmed by the portrait veil.
 *
 * Choreography (one timeline, duration normalized to 1 == scroll progress):
 *   at rest    film visible behind the hero, dimmed by the veil (VEIL_REST)
 *   0.00–0.87  frames 1→40 scrub (nearest-frame mapping; crisp, draw only on
 *              index change — Lenis lerp carries the smoothness)
 *   0.06–0.24  veil lifts VEIL_REST→0 — the film owns the frame as type leaves
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
// lg+ runs the 50/50 split — the film sits BESIDE the type, not under it, so
// the rest dim is a light cinematic grade (brightens to full on scroll), not
// a legibility veil.
const VEIL_REST = 0.35;
// Below lg the 16:9 clip cover-crops to a portrait viewport and the face fills
// the frame. The film stays BRIGHT (poster-style — it should read as a
// portrait, not murk); legibility comes from the taller bottom scrim under the
// type block instead of a global dim.
const VEIL_REST_PORTRAIT = 0.5;
const LIFT: [number, number] = [0.06, 0.18]; // veil lift [start, duration] — spans the hero's exit
const DIM_AT = 0.88; // where the imagery starts receding into --bg
const TITLE_AT = 0.31; // board title lands as the hero clears the stage (lg+ split)

export function CinematicReel() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dlRef = useRef<HTMLDListElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  // Bridge from the ScrollTrigger (below) into the canvas effect's closure.
  const drawRef = useRef<(i: number) => void>(() => {});
  const activeRef = useRef(0); // ref mirror of activeRows — no setState per tick
  const [activeRows, setActiveRows] = useState(0);
  const reduced = useReducedMotion();

  // Frame loading + drawing. Lives in its own effect (not useGSAP) because it
  // owns network/decode lifecycle, not tweens.
  useEffect(() => {
    if (reduced) return; // CSS hides the canvas; skip the ~1MB fetch entirely
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const loader = createFrameLoader();
    let lastDrawn = -1;
    let current = 0; // frame position (fractional in, drawn to nearest)
    let shown = false;

    // Crisp single-frame draw: snap to the nearest decoded frame and paint it
    // sharp. (An earlier alpha crossfade "tweened" between neighbours, but
    // blending two frames of a MOVING subject double-exposes them into visible
    // motion blur while scrolling — and doubled the per-tick canvas cost, which
    // itself stuttered the scroll. One sharp frame is clearer AND cheaper; the
    // Lenis lerp carries the smoothness.) Anchor slightly above centre keeps
    // the face in frame as crops change. Draws only on frame-index change.
    const draw = (target: number) => {
      const i = loader.nearestReady(Math.round(target)); // closest decoded, never blank
      const img = i >= 0 ? loader.img(i) : undefined;
      if (!img || i === lastDrawn) return;
      lastDrawn = i;
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

    drawRef.current = (t) => {
      current = t;
      draw(t);
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
      // Title parts (eyebrow / headline / subline) — the lg+ split's framing.
      // Empty below lg (the title is display:none there) — set/tween no-op.
      const titleParts = titleRef.current
        ? (Array.from(titleRef.current.children) as HTMLElement[])
        : [];
      const rest = window.matchMedia("(min-width: 1024px)").matches
        ? VEIL_REST
        : VEIL_REST_PORTRAIT;
      // Hidden ONLY here (never in markup) — SSR/no-JS keeps everything readable.
      gsap.set(veil, { opacity: rest }); // film rests dimmed under the hero type
      gsap.set(dl, { autoAlpha: 0 }); // board rails ride in with the first row
      gsap.set(rows, { autoAlpha: 0, y: distance.md });
      gsap.set(titleParts, { autoAlpha: 0, y: distance.md }); // title waits for the hero to clear

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top 64px", // track top sits at the nav's bottom at scroll 0
          end: "bottom bottom",
          scrub: true, // Lenis lerp 0.1 already smooths — don't double-lag
          onUpdate(self) {
            drawRef.current(
              Math.min(self.progress / FRAME_SPAN, 1) * (FRAME_COUNT - 1),
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
      // Title card rises in as the hero clears the stage, ahead of the rows —
      // it's the board's headline, so it lands first.
      tl.to(
        titleParts,
        { autoAlpha: 1, y: 0, duration: 0.09, stagger: 0.03, ease: "expo.out" },
        TITLE_AT,
      );
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
          alt="Praduan facing the camera, then turning away, in front of a dark gridded backdrop"
          loading="lazy"
          decoding="async"
          className="block w-full object-cover motion-safe:invisible motion-safe:absolute motion-safe:inset-0 motion-safe:h-full"
        />
        {/* Film layer — canvas frames, reading scrim, grain, veil. Visible
            from load (the hero paints above it). At lg+ it is
            confined to the RIGHT half of the stage (the 50/50 split):
            left-1/2 overrides inset-0's left edge, and the seam-blend
            gradient inside feathers the film into the dark panel — no hard
            cut. Below lg it stays full-bleed — the portrait design is
            untouched. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 motion-reduce:hidden lg:left-1/2"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-slower ease-out-expo"
          />
          {/* Reading scrim — below lg it pools --bg over the lower band where
              the type block sits (portrait keeps the film bright and leans on
              this gradient alone). At lg+ no text rides the film anymore, so
              it shrinks to a slim, faded floor that softens the stage's bottom
              edge for the #work handoff. */}
          <div
            className="absolute inset-x-0 bottom-0 h-[78%] lg:h-[26%] lg:opacity-60"
            style={{
              background:
                "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 62%, transparent) 45%, transparent 100%)",
            }}
          />
          {/* Seam blend (lg+) — the film DISSOLVES into the dark panel over a
              wide, eased band: --bg is fully opaque at the seam (matching the
              panel exactly) and rolls off through a long smootherstep ramp, so
              the eye can't find where the clip's grid/subject emerges. Nearly
              half the film width, but the subject sits centre-right and stays
              clear. */}
          <div
            className="absolute inset-y-0 left-0 hidden w-[52%] lg:block"
            style={{
              background:
                "linear-gradient(to right, var(--bg) 0%, color-mix(in srgb, var(--bg) 96%, transparent) 12%, color-mix(in srgb, var(--bg) 82%, transparent) 24%, color-mix(in srgb, var(--bg) 55%, transparent) 40%, color-mix(in srgb, var(--bg) 26%, transparent) 60%, color-mix(in srgb, var(--bg) 8%, transparent) 80%, transparent 100%)",
            }}
          />
          {/* Corner vignette (lg+) — the grid backdrop is brightest at the
              film's top-left, right where it hugs the seam; a soft --bg pool
              anchored to that corner keeps it from popping against the flat
              panel, so the clip reads as lit from within, not pasted on. */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                "radial-gradient(78% 62% at 0% 0%, var(--bg) 0%, color-mix(in srgb, var(--bg) 50%, transparent) 26%, transparent 58%)",
            }}
          />
          <AnimatedNoise opacity={0.05} />
          {/* Veil — rests at VEIL_REST, lifts to 0 as the hero type departs,
              then rises to 0.85 over the last beat so the clip recedes into
              the page. Lives INSIDE the film wrapper so at lg it can only ever
              dim the film half, never the left panel. Markup opacity 0
              (decorative) — the effect owns it. */}
          <div
            ref={veilRef}
            aria-hidden="true"
            className="absolute inset-0 bg-bg opacity-0 motion-reduce:hidden"
          />
        </div>
        {/* Left panel (lg+, motion-safe) — the content half of the split. It
            owns the hero's whole atmosphere set (blueprint dot grid +
            trace-flow blooms + film grain), which is hidden inside Hero.tsx
            at lg: the backdrop must belong to the STAGE, not the hero, so the
            hero's type departs over an unchanging surface (no shade-step
            dragging across the panel at its bottom edge) and the board later
            rides the very same panel. isolate keeps the -z atmosphere layers
            above this div's own bg. */}
        <div
          aria-hidden="true"
          className="isolate absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden bg-bg motion-safe:lg:block"
        >
          <div
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 0.5px, transparent 0.5px)",
              backgroundSize: "22px 22px",
              color: "rgba(255,255,255,0.045)",
              maskImage:
                "radial-gradient(120% 100% at 30% 40%, #000 0%, transparent 78%)",
              WebkitMaskImage:
                "radial-gradient(120% 100% at 30% 40%, #000 0%, transparent 78%)",
            }}
          />
          <HeroFlow />
          <AnimatedNoise opacity={0.04} />
        </div>

        {/* Board title card (lg+ split only) — fills the content half's upper
            band, framing the rows below as a live readout. Anchored to the top
            of the stage, aligned to the same left-half column + seam inset as
            the board. Its parts rise in on the timeline (titleRef.children).
            Hidden below lg and under reduced motion, where there is no empty
            panel to fill. */}
        <Container className="pointer-events-none absolute inset-x-0 top-0 hidden pt-[12vh] motion-safe:lg:block [@media(max-height:600px)]:!hidden">
          <div ref={titleRef} className="lg:w-1/2 lg:pr-space-7">
            <BoardTitle />
          </div>
        </Container>

        {/* The board — dl/dt/dd semantics preserved (BoardRow unchanged). At
            lg+ (motion-safe) it rides the LEFT half over the solid panel: the
            centered Container makes the w-1/2 wrapper end exactly at the seam,
            and pr-space-7 matches the hero column's inset off it. */}
        <Container className="relative py-space-7 motion-safe:absolute motion-safe:inset-x-0 motion-safe:bottom-0 motion-safe:py-0 motion-safe:pb-space-7 short-land:pb-space-4">
          <div className="motion-safe:lg:w-1/2 motion-safe:lg:pr-space-7">
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
          </div>
        </Container>
      </div>
    </section>
  );
}
