"use client";

import { useRef, useState } from "react";
import NextLink from "next/link";
import { useGSAP } from "@gsap/react";
import { Container, ProjectCover } from "@/components/primitives";
import { StaggerGroup, FlapText, AuroraEmber } from "@/components/motion";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { displayTitle } from "@/lib/utils/typography";
import type { ProjectMeta } from "@/types/project";

/*
 * /work as a departure board: the split-flap signature writ large, and the
 * deliberate OPPOSITE of the home page's showcase cards (dense information
 * table vs. big media), so the index adds a view instead of duplicating home.
 *
 * Each project is one full-width board row: spectrum ordinal · mono-caps title
 * that flutters on row hover (FlapText, restrained flips) · kind · year · a
 * LIVE/CONCEPT status chip, and a "remarks" line (the frontmatter indexNote,
 * a different framing from the home summary). Hovering or focusing a row
 * flips its cover into the sticky preview stage on the right the way a board
 * tile changes: the lower half swaps at once, the upper half falls in over the
 * outgoing cover, and the ordinal readout under the stage flutters to match.
 *
 * Desktop + fine pointer + motion only (WorkIndex gates it); phones, touch and
 * reduced motion get the static WorkStack rows instead.
 */

/**
 * One flip of the stage tile: which cover is falling over which. `id` keys the
 * flap element, so an interrupting flip mounts a fresh flap at rotateX(-90)
 * instead of continuing a half-fallen one, and lets a stale onComplete tell it
 * is stale.
 */
interface Flip {
  from: number;
  to: number;
  id: number;
}

const COVER_SIZES = "(min-width: 1024px) 26rem, 0px";

export function FlightBoard({ projects }: { projects: ProjectMeta[] }) {
  const [active, setActive] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const reduced = useReducedMotion();
  // Mirrors `active` synchronously so a fast sweep down the rows reads the
  // real previous cover, not a stale render's.
  const activeRef = useRef(0);
  const flipCount = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLSpanElement>(null);

  const select = (i: number) => {
    const prev = activeRef.current;
    if (prev === i) return;
    activeRef.current = i;
    setActive(i);
    // Reduced motion: the layer swap is instant, no flap, no held half.
    if (prefersReducedMotion()) {
      setFlip(null);
      return;
    }
    flipCount.current += 1;
    setFlip({ from: prev, to: i, id: flipCount.current });
  };

  // The falling flap. A new flip while one runs replaces the flap element
  // (keyed by id) and reverts the old tween, so the board never shows two
  // half-flips at once: the interrupted cover is already the settled base.
  useGSAP(
    () => {
      registerGsap();
      const flap = flapRef.current;
      const shade = shadeRef.current;
      if (!flip) return;
      if (!flap || !shade || prefersReducedMotion()) {
        // A runtime reduce-motion toggle mid-flip: settle to the plain swap.
        setFlip(null);
        return;
      }
      const id = flip.id;
      // Promoted only while it falls; the flap unmounts as it lands.
      gsap.set(flap, { willChange: "transform" });
      const tl = gsap.timeline({
        onComplete: () => setFlip((f) => (f && f.id === id ? null : f)),
      });
      tl.fromTo(
        flap,
        { rotationX: -90 },
        { rotationX: 0, duration: durations.fast, ease: gsapEase.outQuad },
        0,
      );
      // The underside of a falling flap is in shadow until it lands.
      tl.fromTo(
        shade,
        { opacity: 0.35 },
        { opacity: 0, duration: durations.fast, ease: gsapEase.outQuad },
        0,
      );
    },
    { scope: stageRef, dependencies: [flip, reduced], revertOnUpdate: true },
  );

  const incoming = flip ? projects[flip.to] : undefined;

  return (
    <Container as="section" aria-label="Selected projects" className="pb-space-9">
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] items-start gap-space-9">
        {/* ── Board rows ── */}
        <StaggerGroup as="ol" className="border-y border-line">
          {projects.map((project, i) => {
            const live = Boolean(project.liveUrl);
            const on = active === i;
            return (
              <li
                key={project.slug}
                className="row-arm border-t border-line first:border-t-0"
                // The armed hairline reads the row's colour from the <li> itself:
                // the link's --accent below would not reach a pseudo-element on
                // its parent.
                style={{ "--arm": project.accent } as React.CSSProperties}
              >
                <NextLink
                  href={`/work/${project.slug}`}
                  aria-label={`View case study: ${project.title}`}
                  data-flap-hover
                  onPointerEnter={() => select(i)}
                  onFocus={() => select(i)}
                  className="group block py-space-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
                  style={{ "--accent": project.accent } as React.CSSProperties}
                >
                  {/* Row line: ordinal · title · kind · year · status */}
                  <div className="flex items-baseline gap-space-4 font-mono text-caption uppercase sm:gap-space-5">
                    <span
                      aria-hidden="true"
                      className="shrink-0 tabular-nums"
                      style={{ color: project.accent }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={
                        "min-w-0 flex-1 truncate text-[1rem] tracking-[0.12em] transition-colors duration-fast ease-out-quad " +
                        (on ? "text-neon" : "text-fg")
                      }
                    >
                      <FlapText
                        text={project.title.toUpperCase()}
                        trigger="hover"
                        flips={2}
                        colorMode="mono"
                      />
                    </span>
                    <span className="hidden shrink-0 tracking-[0.14em] text-muted md:inline">
                      {project.kind === "web" ? "Web" : "App"}
                    </span>
                    <span className="shrink-0 tracking-[0.14em] text-muted">
                      {project.year}
                    </span>
                    <span
                      className={
                        "inline-flex shrink-0 items-center gap-space-2 rounded-full border px-space-3 py-[2px] text-[0.625rem] tracking-[0.12em] " +
                        (live
                          ? "border-[color:color-mix(in_srgb,var(--neon)_40%,transparent)] text-neon"
                          : "border-line text-muted")
                      }
                    >
                      <span
                        aria-hidden="true"
                        className={
                          "h-[5px] w-[5px] rounded-full " +
                          (live ? "bg-neon motion-safe:animate-status-pulse" : "bg-muted")
                        }
                      />
                      {live ? "Live" : "Concept"}
                    </span>
                  </div>
                  {/* Remarks: the indexNote framing (NOT the home summary). */}
                  <p className="mt-space-3 max-w-[52ch] pl-[calc(2ch+1rem)] font-sans text-body normal-case text-muted sm:pl-[calc(2ch+1.5rem)]">
                    {project.indexNote ?? project.summary}
                  </p>
                  {/* Services + affordance line. */}
                  <div className="mt-space-3 flex flex-wrap items-baseline gap-x-space-4 gap-y-space-1 pl-[calc(2ch+1rem)] font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted sm:pl-[calc(2ch+1.5rem)]">
                    <span>{project.services.join(" · ")}</span>
                    <span
                      aria-hidden="true"
                      className="ml-auto inline-flex items-center gap-space-2 text-fg transition-[color,transform] duration-fast ease-out-quad group-hover:text-neon"
                    >
                      View case study
                      {/* `group-active` doubles the .row-arm press rule: the
                          utility layer outranks it while the row is hovered. */}
                      <span className="row-arrow transition-transform duration-base ease-out-quad group-hover:translate-x-1 group-active:translate-x-2">
                        →
                      </span>
                    </span>
                  </div>
                </NextLink>
              </li>
            );
          })}
        </StaggerGroup>

        {/* ── Preview stage: sticky, flips to the active row's cover ── */}
        <div className="sticky top-space-9">
          {/* No panel around the media, same call as the reel hero: this stage
              is aria-hidden and carries no hover, so its border was decorative
              only, and the covers inside it are PhoneFrames and BrowserMockups
              that already have their own edges. A frame around a frame reads as
              a mistake once you notice it. The card stages in WorkIndex and
              ProjectCard keep theirs deliberately: there the border is the
              hover affordance on a link (group-hover:border-neon), so it is
              doing a job this one was not. */}
          <div
            ref={stageRef}
            className="relative isolate aspect-[4/3.4] overflow-hidden bg-bg"
            data-theme="dark"
            style={
              {
                "--accent": projects[active]?.accent,
                // The wordmark tiles' depth, so the flap falls with the same
                // foreshortening as the split-flap type.
                perspective: "1000px",
              } as React.CSSProperties
            }
            aria-hidden="true"
          >
            <AuroraEmber hue="accent" position="top-right" intensity={0.28} />
            {/* Six stacked cover layers so every image stays decoded; the active
                one swaps in instantly (a tile's lower half changes at once). */}
            {projects.map((project, i) => {
              const on = active === i;
              // While a flip runs the outgoing cover keeps its TOP half on show
              // above the incoming one (a static clip, never tweened) until the
              // falling flap lands over it.
              const outgoing = flip !== null && flip.from === i;
              return (
                <div
                  key={project.slug}
                  className="absolute inset-0 flex justify-center"
                  style={{
                    opacity: on || outgoing ? 1 : 0,
                    clipPath: outgoing ? "inset(0 0 50% 0)" : undefined,
                    zIndex: outgoing ? 1 : undefined,
                    // The per-cover accent wash keys off ITS project, not the stage.
                    ["--accent" as string]: project.accent,
                  }}
                >
                  <CoverLayer project={project} handoff={on} />
                </div>
              );
            })}
            {/* The flap: the top half of the incoming cover, hinged at the
                seam, falling from edge-on. A copy of the layer clipped to its
                upper half, so the cover lands exactly where the layer sits. */}
            {flip !== null && incoming && !reduced && (
              <div
                key={flip.id}
                ref={flapRef}
                className="absolute inset-x-0 top-0 isolate z-[2] h-1/2 origin-bottom overflow-hidden [backface-visibility:hidden]"
                style={{ ["--accent" as string]: incoming.accent }}
              >
                <div className="absolute inset-x-0 top-0 flex h-[200%] justify-center">
                  <CoverLayer project={incoming} />
                </div>
                <span
                  ref={shadeRef}
                  className="pointer-events-none absolute inset-0 bg-black"
                  style={{ opacity: 0.35 }}
                />
              </div>
            )}
            {/* The hinge seam, the same ink the wordmark tiles carry. */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] h-px bg-[color:color-mix(in_srgb,var(--ink-900,#000)_20%,transparent)]" />
            {/* Bottom dissolve so phone bleeds read intentional. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-14"
              style={{
                background:
                  "linear-gradient(to top, color-mix(in srgb, var(--bg) 96%, #000) 10%, transparent 100%)",
              }}
            />
          </div>
          <p className="mt-space-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            {/* The key remounts the ordinal on every row change so trigger="load"
                re-flutters it, the pattern the nav readout uses. */}
            <FlapText
              key={active}
              text={String(active + 1).padStart(2, "0")}
              trigger="load"
              flips={3}
              colorMode="mono"
            />
            {" / "}
            {String(projects.length).padStart(2, "0")}:{" "}
            {displayTitle(projects[active]?.title ?? "")}
          </p>
        </div>
      </div>
    </Container>
  );
}

/*
 * One cover as it sits in the stage: the accent wash and the framed screen.
 * Shared by the stacked layers and the flap copy so both lay out identically.
 * `handoff` marks the ACTIVE layer's cover wrapper for the route handoff, which
 * queries [data-handoff-source="slug"] for the one visible screen; the flap
 * copy and the outgoing layer never carry it.
 */
function CoverLayer({
  project,
  handoff = false,
}: {
  project: ProjectMeta;
  handoff?: boolean;
}) {
  const isWeb = project.kind === "web";
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(78% 66% at 50% 100%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 72%)",
        }}
      />
      <div
        className={isWeb ? "flex w-[84%] items-center" : "w-[44%] self-end translate-y-[6%]"}
        data-handoff-source={handoff ? project.slug : undefined}
      >
        <ProjectCover
          project={project}
          sizes={COVER_SIZES}
          imgClassName={isWeb ? undefined : "object-top"}
        />
      </div>
    </>
  );
}
