"use client";

import NextLink from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";
import blurMap from "@/lib/content/blur-map.json";
import type { ProjectMeta } from "@/types/project";

/*
 * The board drum: the site's departure board rolled onto the drum it was
 * always printed on, now carrying the work the flat board withholds.
 *
 * HOW THE MIXED SHAPES RIDE ONE DRUM. Ten covers disagree about width: six are
 * 1.83 browser captures and four are phone screens between 0.30 and 0.46.
 * Every face is therefore given the same HEIGHT and its own honest WIDTH, so a
 * 647px browser plate and a 180px phone slat sit on the drum at true
 * proportion with nothing cropped, letterboxed or scaled to match the other.
 * The facet pitch is set by the widest face, so a phone simply carries air on
 * both sides of its facet rather than being stretched to fill one.
 *
 * The drum turns about a VERTICAL axis and the work travels left to right,
 * which is the direction the page is read.
 *
 * GEOMETRY. Faces sit on a regular decagonal prism, so the radius is the
 * APOTHEM (axis to face plane), not the circumscribed radius: A = (facet +
 * gap) / (2 tan 18deg), where the facet is the widest face. Get that wrong and
 * the faces are ten plates floating on a ring instead of one solid drum. The
 * drum is pushed back by exactly A so the front face lands at z = 0 and
 * renders at scale 1 rather than magnified.
 *
 * CADENCE. Hold, then index one face in 350ms. It is a board, not a ticker:
 * something that drifts continuously can never be read, and this site's motion
 * is meant to feel computational rather than decorative. The flip carries a
 * slight overshoot (outBack, the one place on the site that earns it) because
 * a real flap overshoots and settles. One property, on one element, for 350ms
 * out of every three seconds: the compositor is idle about 88% of the loop.
 *
 * FALLBACK. Below 1024px, on a coarse pointer, under reduced motion and with
 * no JS at all, the drum flattens into <WorkShelf>: the same ten screens on
 * one swipeable shelf, pure CSS. That is the SSR output, so every cover and
 * name ships in the HTML whatever happens after.
 */

/** Degrees between stations. Ten faces, so ten times this is a clean identity. */
const STEP = 36;
/** 2 tan(180/10 deg): converts face pitch to the prism's apothem. */
const APOTHEM_K = 2 * Math.tan(Math.PI / 10);
/** Gap between facets, in px, measured across the drum's face. */
const FACE_GAP = 40;
/** Seconds a face holds square-on before the drum indexes. */
const DWELL = 2.6;
/** Camera distance. Large enough that a 36deg neighbour foreshortens without
 *  the front face reading as a fisheye. */
const PERSPECTIVE = 1500;

/** Browser flap chrome height and the padding around its screen well, in px. */
const CHROME_H = 30;
const WELL_PAD = 6;
/** The house browser well ratio, and the phone well ratio (9 / 19.5). */
const WEB_WELL_RATIO = 64 / 35;
const APP_WELL_RATIO = 9 / 19.5;
/** Height of the name plate under the housing, in px. Fixed, so the section
 *  never reflows as names of different lengths come round. */
const NAMEPLATE_H = 56;

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * The app's name, without the descriptive tail two studies carry ("InsightsTap:
 * Website", "Decathlon: App Redesign"). The drum shows the work and its name
 * and nothing else, so the tail is metadata this surface deliberately drops;
 * the full title still leads the case study and the work index.
 */
const appName = (title: string): string => title.split(":")[0].trim();

/** Device height, from the stage's width AND the viewport's height. Width
 *  alone would size the drum correctly on a 1440x900 desktop and then run it
 *  straight past the fold on a 1366x768 laptop, where the section has the same
 *  width and 180px less room. */
function deviceHeight(stageWidth: number, viewportHeight: number): number {
  const byWidth = stageWidth * 0.3;
  const byHeight = viewportHeight * 0.42;
  return Math.round(Math.max(240, Math.min(392, byWidth, byHeight)));
}

/** The device's rendered width at a given flap height. Height drives width
 *  here, the reverse of every other frame on the site, because the spindle
 *  fixes the height and the medium is then free to be whatever width it is. */
function deviceWidth(h: number, isWeb: boolean): number {
  if (!isWeb) return Math.round(h * APP_WELL_RATIO);
  const wellH = h - CHROME_H - WELL_PAD * 2;
  return Math.round(wellH * WEB_WELL_RATIO + WELL_PAD * 2);
}

/* ── One flap face ──────────────────────────────────────────────────────── */

function Flap({
  project,
  deviceH,
  sizes,
}: {
  project: ProjectMeta;
  deviceH: number;
  sizes: string;
}) {
  const isWeb = project.kind === "web";
  const w = deviceWidth(deviceH, isWeb);
  const accent = project.accent ?? "var(--signal)";

  return (
    <div className="flex flex-col items-center" style={{ "--accent": accent } as React.CSSProperties}>
      {/* The device. A lean frame, not PhoneFrame or BrowserMockup: those
          carry layered drop shadows that would re-rasterise while the drum
          turns, and they are width-driven where this has to be height-driven.
          The vocabulary is theirs, the weight is not. */}
      <div
        className="relative shrink-0 overflow-hidden rounded-[10px] bg-device shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-[color:color-mix(in_srgb,var(--fg)_12%,transparent)]"
        style={{ width: w, height: deviceH }}
      >
        {isWeb ? (
          <>
            <div
              aria-hidden="true"
              className="flex items-center gap-space-2 border-b border-line bg-bezel px-space-3"
              style={{ height: CHROME_H }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: accent }} />
              <span className="h-[7px] w-[7px] rounded-full bg-[color:color-mix(in_srgb,var(--fg)_16%,transparent)]" />
              <span className="h-[7px] w-[7px] rounded-full bg-[color:color-mix(in_srgb,var(--fg)_16%,transparent)]" />
            </div>
            <div
              className="relative overflow-hidden bg-bezel"
              style={{ margin: WELL_PAD, height: deviceH - CHROME_H - WELL_PAD * 2 }}
            >
              <Image
                src={project.cover}
                alt=""
                fill
                sizes={sizes}
                placeholder={blurFor(project.cover) ? "blur" : "empty"}
                blurDataURL={blurFor(project.cover)}
                className="object-cover object-top"
              />
            </div>
          </>
        ) : (
          <>
            <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-bezel">
              <Image
                src={project.cover}
                alt=""
                fill
                sizes={sizes}
                placeholder={blurFor(project.cover) ? "blur" : "empty"}
                blurDataURL={blurFor(project.cover)}
                className="object-cover object-top"
              />
            </div>
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-[10px] w-[32%] -translate-x-1/2 rounded-b-[7px] bg-bezel"
            />
          </>
        )}
      </div>

    </div>
  );
}

/* ── The drum ───────────────────────────────────────────────────────────── */

function Drum({ projects }: { projects: ProjectMeta[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const [deviceH, setDeviceH] = useState(280);
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);

  const n = projects.length;
  // A face is exactly its device. The name is not on the drum at all: printed
  // on a face it ends up sitting against the NEIGHBOUR's screen as well as its
  // own, which is the one thing that made this section hard to read. Screens
  // turn; one nameplate under the housing says which one is up.
  const h = deviceH;
  // The facet is set by the WIDEST face, so nothing ever collides with its
  // neighbour and a narrow phone just carries air either side of its facet.
  const facet = deviceWidth(deviceH, true);
  const apothem = (facet + FACE_GAP) / APOTHEM_K;

  // Free-running rotation and the station it belongs to. Refs, not state: the
  // drum settles ten times a revolution and nothing in the markup depends on
  // which station is up, so re-rendering on each would be pure waste.
  const rot = useRef(0);
  const idx = useRef(0);
  const spin = useRef<gsap.core.Tween | null>(null);
  const dwell = useRef<gsap.core.Tween | null>(null);
  // Reasons the drum is currently held. It runs only when all are clear, so a
  // pointer leaving cannot restart a drum the user paused or scrolled past.
  const holds = useRef({ user: false, pointer: false, offscreen: false });

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (stage) setDeviceH(deviceHeight(stage.clientWidth, window.innerHeight));
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    // The stage's WIDTH does not change when a window only gets shorter, so the
    // observer alone would never re-run and the drum would keep a height the
    // viewport no longer has.
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useGSAP(
    () => {
      registerGsap();
      const drum = drumRef.current;
      const stage = stageRef.current;
      if (!drum || !stage || prefersReducedMotion()) return;

      // Push the axis back by the apothem so the front face sits at z = 0 and
      // renders at scale 1. GSAP composes translate before rotate, so this
      // survives every rotationY write.
      gsap.set(drum, { z: -apothem, rotationY: rot.current });

      const running = () =>
        !holds.current.user && !holds.current.pointer && !holds.current.offscreen;

      const schedule = () => {
        dwell.current?.kill();
        dwell.current = gsap.delayedCall(DWELL, advance) as unknown as gsap.core.Tween;
        if (!running()) dwell.current.pause();
      };

      const settle = () => {
        gsap.set(drum, { willChange: "auto" });
        schedule();
      };

      function advance() {
        idx.current += 1;
        rot.current += STEP;
        // The nameplate turns WITH the drum rather than 350ms behind it: set
        // on the rising edge of the move, not on its completion, or the name
        // is visibly still announcing the screen that just left.
        setActive(((idx.current % n) + n) % n);
        spin.current?.kill();
        // Keep the number small forever: ten stations is a clean identity, so
        // rewinding by a whole revolution is invisible.
        if (rot.current >= 3600) {
          rot.current -= 3600;
          gsap.set(drum, { rotationY: rot.current - STEP });
        }
        gsap.set(drum, { willChange: "transform" });
        spin.current = gsap.to(drum, {
          rotationY: rot.current,
          duration: durations.base,
          // A real flap overshoots its stop and settles back. Used here and
          // essentially nowhere else on the site, which is the dosage the
          // token asks for.
          ease: gsapEase.outBack,
          onComplete: settle,
        });
      }

      schedule();

      // Off-screen costs nothing: neither the dwell nor the flip runs when the
      // drum is not being looked at.
      const io = new IntersectionObserver(
        ([entry]) => {
          holds.current.offscreen = !entry.isIntersecting;
          if (running()) {
            dwell.current?.play();
            spin.current?.play();
          } else {
            dwell.current?.pause();
            spin.current?.pause();
          }
        },
        { threshold: 0.15 },
      );
      io.observe(stage);

      return () => {
        io.disconnect();
        spin.current?.kill();
        dwell.current?.kill();
      };
    },
    { scope: stageRef, dependencies: [apothem, n], revertOnUpdate: true },
  );

  // Hold and release from the pointer, focus and the on-page control. Kept out
  // of the GSAP effect so toggling never rebuilds the drum.
  const setHold = useCallback((key: "user" | "pointer", value: boolean) => {
    holds.current[key] = value;
    const go =
      !holds.current.user && !holds.current.pointer && !holds.current.offscreen;
    if (go) {
      dwell.current?.play();
      spin.current?.play();
    } else {
      dwell.current?.pause();
      spin.current?.pause();
    }
  }, []);

  // Tabbing rolls the drum to the focused flap by the shortest path, so a
  // focused link is always square-on and upright rather than edge-on behind
  // the housing.
  const focusStation = useCallback(
    (target: number) => {
      const drum = drumRef.current;
      if (!drum || prefersReducedMotion()) return;
      const current = ((idx.current % n) + n) % n;
      let delta = target - current;
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      if (delta === 0) return;
      idx.current += delta;
      rot.current += delta * STEP;
      setActive(((idx.current % n) + n) % n);
      spin.current?.kill();
      spin.current = gsap.to(drum, {
        rotationY: rot.current,
        duration: durations.base,
        ease: gsapEase.outQuad,
      });
    },
    [n],
  );

  const webSizes = `${deviceWidth(deviceH, true)}px`;
  const appSizes = `${deviceWidth(deviceH, false)}px`;
  // The live flap whole, plus a hint of the one above and the one below. Tight
  // on purpose: three competing screens is a puzzle, one screen with the next
  // arriving is a board.
  const stageH = h;
  // Faces are centred, so the widest one sets the box every flap is centred in.
  const faceW = Math.max(deviceWidth(deviceH, true), 260);

  return (
    <div
      ref={stageRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="Selected work"
      className="relative"
      onPointerEnter={() => setHold("pointer", true)}
      onPointerLeave={() => setHold("pointer", false)}
      onFocusCapture={() => setHold("pointer", true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHold("pointer", false);
        }
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          height: stageH,
          perspective: `${PERSPECTIVE}px`,
          // Centred, so the recession above and below is symmetric and the
          // drum reads as one object turning rather than a list skewing away.
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div
          ref={drumRef}
          className="absolute left-1/2 top-1/2"
          style={{ transformStyle: "preserve-3d" }}
        >
          {projects.map((project, i) => (
            <NextLink
              key={project.slug}
              href={`/work/${project.slug}`}
              aria-label={`View case study: ${project.title}`}
              onFocus={() => focusStation(i)}
              className="group absolute left-0 top-0 block rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
              style={{
                width: faceW,
                marginLeft: -faceW / 2,
                // Centred on the spindle by LAYOUT, not by a translate inside
                // the transform: a translateY(-50%) there is applied in the
                // parent frame after the rotation, which lifts the whole drum
                // by half a flap instead of centring each face on the axis.
                marginTop: -h / 2,
                // Negative step plus a positive drum rotation sends the work
                // LEFT TO RIGHT: the live face exits right while the next one
                // arrives from the left. backface-visibility culls the far
                // half from paint without taking those five links out of the
                // tab order, which visibility:hidden would.
                transform: `rotateY(${-i * STEP}deg) translateZ(${apothem}px)`,
                backfaceVisibility: "hidden",
              }}
            >
              <Flap
                project={project}
                deviceH={deviceH}
                sizes={project.kind === "web" ? webSizes : appSizes}
              />
            </NextLink>
          ))}
        </div>

        {/* Housing lips. Static sibling gradients, never a mask on the
            preserve-3d ancestor: a mask there can flatten the subtree and
            force it to re-rasterise on every frame of the turn. They sit at
            the left and right edges now, where the drum runs off. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[24%]"
          style={{ background: "linear-gradient(to right, var(--bg) 12%, transparent)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[24%]"
          style={{ background: "linear-gradient(to left, var(--bg) 12%, transparent)" }}
        />
      </div>

      {/* The nameplate. One name, in one place, changing as the drum lands:
          the thing a departure board actually does. It is the only text in the
          section, so there is never a question of which screen it belongs to. */}
      <div
        className="relative mt-space-5 flex items-center justify-center"
        style={{ minHeight: NAMEPLATE_H }}
      >
        <span key={active} className="nameplate-in flex min-w-0 items-center gap-space-4">
          <span
            aria-hidden="true"
            className="h-[2px] w-space-7 shrink-0 rounded-full"
            style={{ background: projects[active]?.accent ?? "var(--signal)" }}
          />
          <span className="truncate font-display text-heading-l leading-none tracking-[-0.02em] text-fg">
            {appName(projects[active]?.title ?? "")}
          </span>
        </span>

        {/* One control, and only because it is required: the drum moves on its
            own for well past five seconds, so WCAG 2.2.2 asks for a way to
            stop it. Deliberately the quietest thing in the section. */}
        <button
          type="button"
          onClick={() => {
            const next = !userPaused;
            setUserPaused(next);
            setHold("user", next);
          }}
          aria-pressed={userPaused}
          className="absolute right-0 top-1/2 inline-flex -translate-y-1/2 shrink-0 items-center gap-space-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted opacity-70 before:absolute before:-inset-x-3 before:-inset-y-4 before:content-[''] transition-opacity duration-fast ease-out-quad hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-[6px] w-[6px] rounded-full",
              userPaused ? "bg-[color:color-mix(in_srgb,var(--fg)_45%,transparent)]" : "bg-neon",
            )}
          />
          {userPaused ? "Play" : "Pause"}
        </button>
      </div>
    </div>
  );
}

/* ── The drum, unrolled ─────────────────────────────────────────────────── */

/*
 * What touch, narrow screens, reduced motion and no-JS get: the same ten
 * screens on one swipeable shelf.
 *
 * This replaced a stacked list of ten full-width rows, which measured close to
 * 3,900px on a phone: nearly five screenfuls of one section, which is not a
 * carousel by any reading. A snap strip is one screenful, keeps every cover at
 * a size worth looking at, and is the touch-native form of the same idea the
 * drum expresses on a desktop. It is pure CSS, so it is also the SSR and no-JS
 * output and it never auto-advances, which is the correct behaviour on a
 * surface where moving content would fight the thumb.
 *
 * Devices sit on ONE BASELINE rather than being boxed to a common height. A
 * website screenshot at a legible width is short and a phone screenshot is
 * tall; forcing them to match would mean cropping one of them. Standing them
 * on a shelf lets each keep its true proportion and lines the names up anyway.
 */
function WorkShelf({ projects }: { projects: ProjectMeta[] }) {
  return (
    <ul
      // Full-bleed, with the gutter carried as scroll padding so the first card
      // starts on the page's own left rule and the next one peeks past the
      // right edge: the affordance that says this moves.
      className="-mx-[clamp(1.25rem,5vw,6rem)] flex snap-x snap-mandatory gap-space-5 overflow-x-auto overscroll-x-contain px-[clamp(1.25rem,5vw,6rem)] pb-space-3 scroll-px-[clamp(1.25rem,5vw,6rem)]"
    >
      {projects.map((project) => {
        const isWeb = project.kind === "web";
        const accent = project.accent ?? "var(--signal)";
        return (
          <li key={project.slug} className="shrink-0 snap-start">
            <NextLink
              href={`/work/${project.slug}`}
              aria-label={`View case study: ${project.title}`}
              className="group flex h-full flex-col rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
              style={{ "--accent": accent } as React.CSSProperties}
            >
              {/* The shelf: every device stands on the same line. */}
              <span className="flex h-[clamp(17rem,44vh,23rem)] items-end short-land:h-[clamp(10rem,60vh,14rem)]">
                <span
                  className={cn(
                    "relative block overflow-hidden rounded-[10px] bg-device ring-1 ring-[color:color-mix(in_srgb,var(--fg)_12%,transparent)]",
                    isWeb
                      ? "w-[clamp(17rem,82vw,30rem)]"
                      : "aspect-[9/19.5] h-full",
                  )}
                >
                  {isWeb ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="flex h-[26px] items-center gap-space-2 border-b border-line bg-bezel px-space-3"
                      >
                        <span className="h-[6px] w-[6px] rounded-full" style={{ background: accent }} />
                        <span className="h-[6px] w-[6px] rounded-full bg-[color:color-mix(in_srgb,var(--fg)_16%,transparent)]" />
                        <span className="h-[6px] w-[6px] rounded-full bg-[color:color-mix(in_srgb,var(--fg)_16%,transparent)]" />
                      </span>
                      <span className="relative block aspect-[64/35] overflow-hidden bg-bezel m-[5px]">
                        <Image
                          src={project.cover}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 30rem, 82vw"
                          placeholder={blurFor(project.cover) ? "blur" : "empty"}
                          blurDataURL={blurFor(project.cover)}
                          className="object-cover object-top"
                        />
                      </span>
                    </>
                  ) : (
                    <>
                      <Image
                        src={project.cover}
                        alt=""
                        fill
                        sizes="12rem"
                        placeholder={blurFor(project.cover) ? "blur" : "empty"}
                        blurDataURL={blurFor(project.cover)}
                        className="object-cover object-top"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 top-0 h-[9px] w-[32%] -translate-x-1/2 rounded-b-[7px] bg-bezel"
                      />
                    </>
                  )}
                </span>
              </span>

              <span className="mt-space-4 flex items-center gap-space-3">
                <span
                  aria-hidden="true"
                  className="h-[2px] w-space-5 shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                <span className="font-display text-heading-s leading-none text-fg transition-colors duration-fast ease-out-quad group-hover:text-neon">
                  {appName(project.title)}
                </span>
              </span>
            </NextLink>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Entry ──────────────────────────────────────────────────────────────── */

export function WorkDrum({ projects }: { projects: ProjectMeta[] }) {
  const reduced = useReducedMotion();
  // The drum is a pointer-and-keyboard object on a wide screen. Touch and
  // narrow viewports get the unrolled board, which is also the SSR baseline,
  // so all ten covers ship in the HTML either way.
  const canDrum = useMediaQuery("(min-width: 1024px) and (pointer: fine)");

  if (!canDrum || reduced) return <WorkShelf projects={projects} />;
  return <Drum projects={projects} />;
}
