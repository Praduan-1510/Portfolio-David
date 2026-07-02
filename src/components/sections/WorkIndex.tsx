"use client";

import NextLink from "next/link";
import { Container, Text, ProjectCover } from "@/components/primitives";
import { StaggerGroup } from "@/components/motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { WorkScrollTrack } from "./WorkScrollTrack";
import { displayTitle } from "@/lib/utils/typography";
import type { ProjectMeta } from "@/types/project";

/*
 * Work index. On desktop with motion enabled it renders the pinned horizontal
 * scroll (WorkScrollTrack); otherwise — mobile, reduced motion, or SSR/no-JS —
 * it renders a rich static vertical sequence with the same data
 * (DESIGN_GUIDELINES §13: signature scroll moments get an explicit simpler
 * mobile variant, and reduced motion degrades to a static list).
 *
 * Mobile-first: the stack is the SSR baseline; the scroll version is a
 * progressive enhancement that mounts after hydration on capable viewports.
 */
export function WorkIndex({ projects }: { projects: ProjectMeta[] }) {
  const reduced = useReducedMotion();
  // Require a fine pointer too: the pinned horizontal scroll driven by vertical
  // scroll is awkward on touchscreens (incl. large tablets at ≥1024), so those
  // get the static WorkStack instead.
  const isDesktop = useMediaQuery("(min-width: 1024px) and (pointer: fine)");

  if (isDesktop && !reduced) {
    return <WorkScrollTrack projects={projects} />;
  }
  return <WorkStack projects={projects} />;
}

/*
 * Static editorial sequence (reduced-motion / mobile). Each project is a
 * full-width ROW — not a narrow phone + text column with a dead gutter, but a
 * composed two-part layout: a big oversized index numeral + an accent-washed
 * media stage on the left, and a meta column (title, client/year/role, summary,
 * services, and a "View case study →" affordance) that fills the right. The rows
 * alternate the media to the opposite side so the page reads as a rhythm rather
 * than a list. Each row carries its own project accent — the index numeral, the
 * stage wash, the top hairline, and the hover state — so the page is monochrome
 * at rest and lights up per project. Reduced-motion safe: the StaggerGroup
 * degrades to its resting state and every transition is transform/opacity/colour.
 */
function WorkStack({ projects }: { projects: ProjectMeta[] }) {
  return (
    <Container as="section" aria-label="Selected projects" data-work-stack>
      {/* The rows enter in concert — each project rises in on scroll-in,
          directional stagger. Reduced-motion renders the static list (the
          StaggerGroup degrades to its resting state). */}
      <StaggerGroup as="ul" from="below">
        {projects.map((project, i) => (
          <WorkStackRow
            key={project.slug}
            project={project}
            index={i}
            total={projects.length}
          />
        ))}
      </StaggerGroup>
    </Container>
  );
}

function WorkStackRow({
  project,
  index,
  total,
}: {
  project: ProjectMeta;
  index: number;
  total: number;
}) {
  // Per-project accent (lime / orange / blue). Scoped to this row only via an
  // inline --accent remap on a dark surface, so text-accent / bg-accent and the
  // color-mix washes below all resolve to the project's colour while the rest of
  // the page stays monochrome (§4/§8 — the same remap the case-study route uses).
  const accentStyle = project.accent
    ? ({ "--accent": project.accent } as React.CSSProperties)
    : undefined;
  // Alternate the media side so the sequence reads as a rhythm, not a column.
  const mediaLeft = index % 2 === 0;
  const ordinal = String(index + 1).padStart(2, "0");
  // Web projects use a wide landscape browser frame, centered in the stage
  // rather than the portrait phone rising from its base.
  const isWeb = project.kind === "web";

  return (
    <li
      data-theme="dark"
      style={accentStyle}
      className="border-t border-line first:border-t-0"
    >
      <NextLink
        href={`/work/${project.slug}`}
        aria-label={`View case study: ${project.title}`}
        className="group grid grid-cols-1 items-center gap-x-space-8 gap-y-space-6 rounded-[3px] py-space-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg sm:py-space-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        {/* Media stage — a large accent-washed panel with the cover screen rising
            from it, anchored to the row's accent. Order swaps each row so the
            media alternates sides on desktop (text always reads naturally). */}
        <div
          className={
            mediaLeft ? "md:order-1" : "md:order-2"
          }
        >
          <div
            className={`relative isolate flex aspect-[4/3] justify-center overflow-hidden rounded-[3px] border border-line bg-bg transition-[border-color,box-shadow] duration-base ease-out-quad group-hover:border-neon group-hover:shadow-neon ${
              isWeb ? "items-center" : "items-end"
            }`}
          >
            {/* Accent wash rising from the base of the stage. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 transition-opacity duration-slow ease-out-quad group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(78% 70% at 50% 100%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 72%)",
                opacity: 0.85,
              }}
            />
            {/* Oversized index numeral set into the stage as a quiet watermark. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[6%] top-[2%] font-display text-[clamp(4rem,16vw,9rem)] leading-none tracking-[-0.04em] text-fg opacity-[0.06] transition-opacity duration-slow ease-out-quad group-hover:opacity-[0.12]"
            >
              {ordinal}
            </span>
            {/* Cover frame — a portrait phone anchored low and bleeding off-edge
                (app), or a landscape browser window centered in the stage (web).
                Lifts on hover. */}
            <div
              className={`transition-transform duration-base ease-out-quad will-change-transform group-hover:-translate-y-1 ${
                isWeb ? "w-[82%]" : "w-[52%] translate-y-[8%] md:w-[44%]"
              }`}
            >
              <ProjectCover
                project={project}
                sizes={
                  isWeb
                    ? "(min-width: 768px) 30rem, 86vw"
                    : "(min-width: 768px) 14rem, 42vw"
                }
                imgClassName={
                  isWeb
                    ? "transition-transform duration-slow ease-out-quad group-hover:scale-[1.02]"
                    : "object-top transition-transform duration-slow ease-out-quad will-change-transform group-hover:scale-[1.04]"
                }
              />
            </div>
          </div>
        </div>

        {/* Meta column — fills the half the gutter used to waste. */}
        <div
          className={
            mediaLeft ? "md:order-2" : "md:order-1"
          }
        >
          {/* Ordinal + count, ticked with the project accent. */}
          <div className="flex items-baseline gap-space-3 font-mono text-caption uppercase tracking-[0.16em] text-muted">
            <span
              aria-hidden="true"
              className="h-[7px] w-[7px] rounded-full bg-accent"
            />
            <span>
              <span className="text-accent">{ordinal}</span> /{" "}
              {String(total).padStart(2, "0")}
            </span>
          </div>

          {/* Title with an accent underline that draws in on hover. */}
          <Text
            as="h2"
            variant="display-l"
            className="relative mt-space-4 inline-block group-hover:text-neon"
          >
            {displayTitle(project.title)}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-neon transition-transform duration-base ease-out-quad group-hover:scale-x-100"
            />
          </Text>

          {/* Client · year · role. */}
          <div className="mt-space-4 flex flex-wrap gap-x-space-5 gap-y-space-1 font-mono text-caption uppercase tracking-[0.14em] text-muted">
            <span>{project.client}</span>
            <span>{project.year}</span>
            <span>{project.role}</span>
          </div>

          <Text variant="body-l" className="mt-space-4 max-w-[46ch] text-muted">
            {project.indexNote ?? project.summary}
          </Text>

          {/* Services — turns the old dead gutter into substance. */}
          <ul className="mt-space-5 flex flex-wrap gap-x-space-2 gap-y-space-2 sm:gap-x-space-3">
            {project.services.map((service) => (
              <li
                key={service}
                className="rounded-full border border-line px-space-3 py-[2px] font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted transition-colors duration-fast ease-out-quad group-hover:border-neon group-hover:text-neon sm:px-space-4 sm:py-space-1 sm:text-caption sm:tracking-[0.12em]"
              >
                {service}
              </li>
            ))}
          </ul>

          {/* Explicit affordance — the arrow slides on hover (transform only). */}
          <span className="mt-space-6 inline-flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.16em] text-fg transition-colors duration-fast ease-out-quad group-hover:text-neon">
            View case study
            <span
              aria-hidden="true"
              className="transition-transform duration-base ease-out-quad group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </NextLink>
    </li>
  );
}
