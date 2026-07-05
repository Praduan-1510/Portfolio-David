"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Container, ProjectCover } from "@/components/primitives";
import { StaggerGroup, FlapText, AuroraEmber } from "@/components/motion";
import { displayTitle } from "@/lib/utils/typography";
import type { ProjectMeta } from "@/types/project";

/*
 * /work as a departure board — the split-flap signature writ large, and the
 * deliberate OPPOSITE of the home page's showcase cards (dense information
 * table vs. big media), so the index adds a view instead of duplicating home.
 *
 * Each project is one full-width board row: spectrum ordinal · mono-caps title
 * that flutters on row hover (FlapText, restrained flips) · kind · year · a
 * LIVE/CONCEPT status chip — and a "remarks" line (the frontmatter indexNote,
 * a different framing from the home summary). Hovering or focusing a row
 * crossfades its cover into the sticky preview stage on the right, washed in
 * that project's accent ember.
 *
 * Desktop + fine pointer + motion only (WorkIndex gates it); phones, touch and
 * reduced motion get the static WorkStack rows instead.
 */

export function FlightBoard({ projects }: { projects: ProjectMeta[] }) {
  const [active, setActive] = useState(0);

  return (
    <Container as="section" aria-label="Selected projects" className="pb-space-9">
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] items-start gap-space-9">
        {/* ── Board rows ── */}
        <StaggerGroup as="ol" className="border-y border-line">
          {projects.map((project, i) => {
            const live = Boolean(project.liveUrl);
            const on = active === i;
            return (
              <li key={project.slug} className="border-t border-line first:border-t-0">
                <NextLink
                  href={`/work/${project.slug}`}
                  aria-label={`View case study: ${project.title}`}
                  data-flap-hover
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
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
                  {/* Remarks — the indexNote framing (NOT the home summary). */}
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
                      <span className="transition-transform duration-base ease-out-quad group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </NextLink>
              </li>
            );
          })}
        </StaggerGroup>

        {/* ── Preview stage — sticky, crossfades to the active row's cover ── */}
        <div className="sticky top-space-9">
          <div
            className="relative isolate aspect-[4/3.4] overflow-hidden rounded-[3px] border border-line bg-bg"
            data-theme="dark"
            style={{ "--accent": projects[active]?.accent } as React.CSSProperties}
            aria-hidden="true"
          >
            <AuroraEmber hues={["accent", "violet"]} position="top-right" intensity={0.28} />
            {projects.map((project, i) => {
              const isWeb = project.kind === "web";
              const on = active === i;
              return (
                <div
                  key={project.slug}
                  className="absolute inset-0 flex justify-center transition-opacity duration-base ease-out-quad"
                  style={{
                    opacity: on ? 1 : 0,
                    // The per-cover accent wash keys off ITS project, not the stage.
                    ["--accent" as string]: project.accent,
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10"
                    style={{
                      background:
                        "radial-gradient(78% 66% at 50% 100%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 72%)",
                    }}
                  />
                  <div
                    className={
                      isWeb
                        ? "flex w-[84%] items-center"
                        : "w-[44%] self-end translate-y-[6%]"
                    }
                  >
                    <ProjectCover
                      project={project}
                      sizes="(min-width: 1024px) 26rem, 0px"
                      imgClassName={isWeb ? undefined : "object-top"}
                    />
                  </div>
                </div>
              );
            })}
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
            {String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")} —{" "}
            {displayTitle(projects[active]?.title ?? "")}
          </p>
        </div>
      </div>
    </Container>
  );
}
