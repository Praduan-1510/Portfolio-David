"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { useGSAP } from "@gsap/react";
import { Container, Text } from "@/components/primitives";
import "@/components/primitives/button.css";
import { Reveal, TextReveal } from "@/components/motion";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { GRAPHIC_FRAMES } from "@/lib/content/graphics";
import type { ProjectMeta } from "@/types/project";

/*
 * The contact sheet: the work index's beat for the graphics.
 *
 * WHY THIS EXISTS AT ALL. Every other project on /work is a product, so the
 * page shows each one inside a device: a phone in the stack, a browser in the
 * board's preview stage, a split-flap tile. The graphics study is the one body
 * of work with no interface in it, and it was landing in the concept tier, the
 * one list on this site that is deliberately imageless. The single piece of
 * work that is nothing but image was the single piece shown with none. It also
 * sat there labelled "APP", because the tier's kind switch only knew two kinds.
 *
 * WHY A CONTACT SHEET. The work's own thesis is that a graphic gets about a
 * second in a feed and has to survive at roughly 200 pixels. A drifting strip
 * (which is what the home page gives this set) can never show that: you only
 * ever see three or four squares, large. A contact sheet shows all seventeen at
 * review size and one at full size at the same moment, so the section IS the
 * test the work sets itself. It is also the structural opposite of the home
 * page's wall, which is the rule this page already follows: /work adds a view
 * rather than repeating home (see FlightBoard).
 *
 * THE GREASE PENCIL. A picture editor rings the chosen frame on a contact sheet
 * in chinagraph. That mark is the selection state here, drawn in the project's
 * own accent, and it draws itself in when the selection lands. It is the one
 * hand-made gesture on a site otherwise built of hairlines and grids, which is
 * the correct place for it: this is the one body of work made by hand rather
 * than out of a component library. Under reduced motion the ring is simply
 * already drawn.
 *
 * COST. One transform tween on the shared gsap.ticker drives the dwell timer
 * and the progress hairline together, so the countdown and the bar cannot
 * disagree. It pauses on pointer, on focus, off-screen, and on the explicit
 * control (WCAG 2.2.2: this auto-advances, so it must be stoppable). Plates are
 * mounted only once they have been reached, and the section never warms an
 * image while it is off-screen.
 */

/** Seconds a frame holds before the sheet moves on. */
const DWELL = 3.6;

/*
 * A chinagraph ring: an ellipse drawn slightly off-round that overshoots its
 * own start rather than closing cleanly, because a hand does. pathLength=1
 * normalises the dash animation so the CSS needs no measured perimeter.
 */
const RING_PATH =
  "M 52 7 C 78 6 95 25 94 50 C 93 75 76 94 50 94 C 25 95 6 77 7 51 C 8 26 26 8 50 7 C 67 6 81 12 89 25";

export function ContactSheet({ project }: { project: ProjectMeta }) {
  const frames = GRAPHIC_FRAMES;
  const n = frames.length;
  const reduced = useReducedMotion();

  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  // Plates mount as they are reached rather than all seventeen up front: the
  // sheet's thumbnails already carry the whole set at thumbnail cost, and a
  // visitor who never scrolls this far should pay for none of the large ones.
  const [warm, setWarm] = useState<ReadonlySet<number>>(() => new Set([0, 1]));

  const rootRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  // Three independent reasons to hold, recorded separately so releasing one
  // (the pointer leaving) cannot resume a sheet another still holds (the
  // explicit Pause, or the section having scrolled away).
  const holds = useRef({ pointer: false, user: false, offscreen: false });

  const sync = useCallback(() => {
    const tw = tweenRef.current;
    if (!tw) return;
    const h = holds.current;
    if (h.pointer || h.user || h.offscreen) tw.pause();
    else tw.resume();
  }, []);

  const select = useCallback(
    (i: number, restart = true) => {
      const next = (i + 1) % n;
      activeRef.current = i;
      setActive(i);
      setWarm((w) => {
        if (w.has(i) && w.has(next)) return w;
        const out = new Set(w);
        out.add(i);
        out.add(next);
        return out;
      });
      if (!restart) return;
      const tw = tweenRef.current;
      if (!tw) return;
      // restart() resumes as well as rewinds, so re-apply whatever is holding.
      tw.restart();
      sync();
    },
    [n, sync],
  );

  const hold = useCallback(
    (key: "pointer" | "user" | "offscreen", on: boolean) => {
      holds.current[key] = on;
      sync();
    },
    [sync],
  );

  // One tween is both the countdown and the bar: it drives the hairline from
  // empty to full over DWELL and hands the sheet on at each repeat, so the bar
  // can never promise a beat the sheet does not take.
  useGSAP(
    () => {
      if (reduced) return;
      registerGsap();
      const bar = barRef.current;
      if (!bar) return;
      const tw = gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: DWELL,
          ease: "none",
          repeat: -1,
          onRepeat: () => select((activeRef.current + 1) % n, false),
        },
      );
      tweenRef.current = tw;
      // Nothing has been on screen yet at mount; the observer below releases it.
      holds.current.offscreen = true;
      tw.pause();
      return () => {
        tweenRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [reduced, n, select] },
  );

  // Off-screen is a hold, not a stop: scrolling back finds the same frame.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([entry]) => hold("offscreen", !entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, hold]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const to =
      e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (activeRef.current + delta + n) % n;
    select(to);
    // Arrow keys move the focus with the selection, the way a picker should.
    const cells = rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-frame]");
    cells?.[to]?.focus();
  };

  const current = frames[active];
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <section
      ref={rootRef}
      id="graphics"
      aria-labelledby="graphics-sheet-h"
      style={{ "--accent": project.accent } as React.CSSProperties}
      className="contact-sheet relative isolate border-y border-line py-space-8 sm:py-space-9"
      onPointerEnter={() => hold("pointer", true)}
      onPointerLeave={() => hold("pointer", false)}
      onFocusCapture={() => hold("pointer", true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) hold("pointer", false);
      }}
    >
      <Container>
        {/* The strip a lab prints along the edge of a sheet: what is on the
            roll, when it was shot, and at what ratio. */}
        <Reveal>
          <p className="flex flex-wrap items-center gap-x-space-3 gap-y-space-1 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-muted">
            <span aria-hidden="true" className="text-accent">
              ■
            </span>
            <span className="text-fg">Graphics</span>
            <span aria-hidden="true" className="text-[color:var(--line-strong)]">
              /
            </span>
            <span>A square at a time</span>
            <span aria-hidden="true" className="text-[color:var(--line-strong)]">
              /
            </span>
            <span>2025&ndash;2026</span>
            <span aria-hidden="true" className="text-[color:var(--line-strong)]">
              /
            </span>
            <span>{n} frames</span>
            <span aria-hidden="true" className="text-[color:var(--line-strong)]">
              /
            </span>
            <span>1:1</span>
          </p>
        </Reveal>

        <div className="mt-space-5 gap-x-space-8 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
          <TextReveal
            as="h2"
            id="graphics-sheet-h"
            by="words"
            className="max-w-[15ch] font-display text-display-l"
          >
            Pick the one that stops the scroll.
          </TextReveal>
          <Reveal delay={0.12}>
            <Text variant="body" className="mt-space-4 max-w-[46ch] text-muted md:mt-0">
              Every other project on this page lives inside a device. This one lives
              in a feed, where a square gets about a second to earn the second one.
              Seventeen of them, three strands:{" "}
              <span className="text-fg">
                a ten-part carousel on studio against corporate design, two field
                notes, and a bilingual Pujo campaign for a Kolkata salon.
              </span>
            </Text>
          </Reveal>
        </div>

        <div className="mt-space-7 grid gap-space-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-space-8">
          {/* ── The plate: the ringed frame, off the sheet and at size ───── */}
          <div>
            <div className="relative isolate mx-auto w-full max-w-[30rem] overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_30px_70px_-40px_rgba(0,0,0,0.95)] lg:mx-0 lg:max-w-none">
              <div className="relative aspect-square">
                {frames.map((f, i) =>
                  warm.has(i) ? (
                    <Image
                      key={f.src}
                      src={f.src}
                      alt={i === active ? f.alt : ""}
                      aria-hidden={i === active ? undefined : true}
                      fill
                      // Pinned to the rendered plate so next/image serves a
                      // ~640px variant of a 2160px original.
                      sizes="(min-width: 1024px) 30rem, (min-width: 640px) 60vw, 92vw"
                      // The incoming plate settles from 1.03 as it fades, so
                      // the frame reads as having been lifted off the sheet
                      // rather than cross-dissolved in place. Transform and
                      // opacity only, and reduced motion never triggers it
                      // because the sheet does not advance on its own there.
                      className={`object-cover transition-[opacity,transform] duration-slow ease-out-quad ${
                        i === active ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
                      }`}
                    />
                  ) : null,
                )}
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--fg)_10%,transparent)]"
              />
            </div>

            {/* Transport: where we are, how long is left, and how to stop it.
                The bar and the dwell are the same tween. */}
            <div className="mx-auto mt-space-4 flex max-w-[30rem] items-center gap-space-4 lg:mx-0 lg:max-w-none">
              <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted tabular-nums">
                <span className="text-accent">{num(active)}</span> / {num(n - 1)}
              </span>
              {!reduced && (
                <>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-[color:var(--line-strong)]"
                  >
                    <span
                      ref={barRef}
                      className="block h-full w-full origin-left scale-x-0 bg-accent"
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !userPaused;
                      setUserPaused(next);
                      hold("user", next);
                    }}
                    aria-pressed={userPaused}
                    // A glass chip, the site's button family at transport
                    // scale (.btn-chip, primitives/button.css), with the same
                    // LED as the marquee's stop. ::before overhangs the pill
                    // to a 44px hit area.
                    className="btn-chip relative inline-flex shrink-0 items-center gap-[5px] rounded-full px-space-2 py-[3px] font-mono text-[0.6875rem] uppercase tracking-[0.16em] before:absolute before:-inset-x-2 before:-inset-y-3 before:content-['']"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-[5px] w-[5px] rounded-full ${
                        userPaused
                          ? "bg-[color:color-mix(in_srgb,var(--fg)_60%,transparent)]"
                          : "bg-accent"
                      }`}
                    />
                    {userPaused ? "Play" : "Pause"}
                    <span className="sr-only"> the contact sheet</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── The sheet: all seventeen at review size ──────────────────── */}
          <div>
            <div
              role="group"
              aria-label={`Contact sheet, ${n} frames`}
              onKeyDown={onKeyDown}
              className="grid grid-cols-3 gap-x-space-2 gap-y-space-4 sm:grid-cols-6 sm:gap-x-space-3"
            >
              {frames.map((f, i) => {
                const on = i === active;
                return (
                  <button
                    key={f.src}
                    data-frame={i}
                    type="button"
                    aria-pressed={on}
                    onClick={() => select(i)}
                    onPointerEnter={() => select(i)}
                    onFocus={() => select(i)}
                    className="group/cell block text-left focus-visible:outline-none"
                  >
                    <span
                      className={`relative block aspect-square overflow-hidden rounded-[4px] border bg-surface transition-[opacity,transform,border-color] duration-base ease-out-quad group-focus-visible/cell:ring-2 group-focus-visible/cell:ring-accent group-focus-visible/cell:ring-offset-2 group-focus-visible/cell:ring-offset-bg ${
                        on
                          ? "border-line-strong opacity-100"
                          : "border-line opacity-45 group-hover/cell:opacity-90"
                      }`}
                    >
                      <Image
                        src={f.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 120px, (min-width: 640px) 15vw, 30vw"
                        className="object-cover"
                      />
                      {on && (
                        <svg
                          // Keyed by index so the ring re-draws on every landing
                          // rather than sitting already-drawn from the last one.
                          key={i}
                          aria-hidden="true"
                          viewBox="0 0 100 100"
                          className="pointer-events-none absolute inset-0 h-full w-full"
                        >
                          <path
                            d={RING_PATH}
                            pathLength={1}
                            fill="none"
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={4.5}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            className="grease-ring"
                          />
                          <path
                            d={RING_PATH}
                            pathLength={1}
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth={2.25}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            className="grease-ring"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`mt-space-1 block font-mono text-[0.625rem] tracking-[0.14em] tabular-nums transition-colors duration-fast ease-out-quad ${
                        on ? "text-accent" : "text-muted group-hover/cell:text-fg"
                      }`}
                    >
                      {num(i)}
                      <span className="sr-only">
                        , {f.label}, {f.strand}
                      </span>
                    </span>
                  </button>
                );
              })}

              {/* Eighteenth cell. Seventeen frames leave one slot open on a
                  six- or three-column sheet, so the gap at the end of the roll
                  is where the way in goes rather than a hole. */}
              <NextLink
                href={`/work/${project.slug}`}
                className="group/end block text-left focus-visible:outline-none"
              >
                <span className="relative flex aspect-square items-center justify-center rounded-[4px] border border-dashed border-[color:var(--line-strong)] px-space-1 text-center transition-colors duration-base ease-out-quad group-hover/end:border-accent group-focus-visible/end:ring-2 group-focus-visible/end:ring-accent group-focus-visible/end:ring-offset-2 group-focus-visible/end:ring-offset-bg">
                  <span className="font-mono text-[0.625rem] uppercase leading-[1.5] tracking-[0.12em] text-muted transition-colors duration-fast ease-out-quad group-hover/end:text-accent">
                    Read
                    <br />
                    the
                    <br />
                    study
                    <span aria-hidden="true" className="ml-[2px] inline-block transition-transform duration-base ease-out-quad group-hover/end:translate-x-[3px]">
                      &rarr;
                    </span>
                  </span>
                </span>
                <span className="mt-space-1 block font-mono text-[0.625rem] tracking-[0.14em] text-muted">
                  END
                </span>
              </NextLink>
            </div>

            {/* The read-out: what is ringed, and the decision inside it. Under
                the SHEET rather than the plate, because picking and being told
                what you picked is one gesture, and because it is what squares
                the two columns off at the same depth. */}
            <div className="mt-space-5 border-t border-line pt-space-4">
              <p className="flex flex-wrap items-baseline gap-x-space-3 gap-y-space-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em]">
                <span className="text-accent tabular-nums">{num(active)}</span>
                <span className="text-fg">{current.label}</span>
                <span className="text-muted">{current.strand}</span>
              </p>
              <Text variant="body" className="mt-space-2 max-w-[52ch] text-muted">
                {current.note}
              </Text>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
