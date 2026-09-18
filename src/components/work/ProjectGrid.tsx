"use client";

import { useEffect, useRef } from "react";
import { StaggerGroup } from "@/components/motion";
import { cn } from "@/lib/utils/cn";
import type { ProjectMeta } from "@/types/project";
import { ProjectCard } from "./ProjectCard";

/*
 * The grid of project cards, on the home page (every screen study) and on
 * /work (the featured tier).
 *
 * LAYOUT. One column below 640px, two to 1279px, three from 1280px. The grid
 * underneath is 4 tracks at sm and 6 at xl with every card spanning 2, which
 * is what lets a ragged last row sit centred instead of hanging off the left:
 * ten cards read 3 + 3 + 3 + 1 with the one in the middle, eight read
 * 3 + 3 + 2 with the pair in the middle, and an odd count in two columns
 * centres its last card the same way.
 *
 * ENTRANCE. The cards rise in as one staggered group (StaggerGroup), the same
 * choreography as every other list on the site.
 *
 * LOOPS. Each card's screenshot drifts or scrolls (project-card.css) while the
 * reader is looking at THAT card: hovered, or holding keyboard focus. Nothing
 * moves on its own, which is what lets the site go without a Motion switch
 * (WCAG 2.2.2 only asks for one when motion starts by itself and runs past
 * five seconds). One IntersectionObserver still marks cards in view with
 * [data-playing] so a card scrolled away never keeps a loop alive, and every
 * loop sits under prefers-reduced-motion: no-preference. With no JavaScript
 * nothing is marked, so every card is simply a still.
 */

/** Grid placement that centres a ragged last row (see the header). */
function placement(i: number, n: number): string {
  const last = i === n - 1;
  // Two columns (4 tracks): an odd count leaves one card, start it on track 2.
  const centreSm = n % 2 === 1 && last;
  // Three columns (6 tracks): one left over starts on track 3; two left over
  // start on track 2 and the second follows it.
  const centreXl =
    n % 3 === 1 && last ? "xl:col-start-3" : n % 3 === 2 && i === n - 2 ? "xl:col-start-2" : null;
  return cn(centreSm && "sm:col-start-2", centreXl ?? (centreSm && "xl:col-start-auto"));
}

export function ProjectGrid({
  projects,
  titleAs = "h3",
  className,
}: {
  projects: ProjectMeta[];
  /** Heading level for each card title (see ProjectCard). */
  titleAs?: "h2" | "h3";
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  // One observer for the whole grid. The attribute is written imperatively so
  // a card entering or leaving the viewport never re-renders anything.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute("data-playing", entry.isIntersecting);
        }
      },
      { threshold: 0.15 },
    );
    root.querySelectorAll<HTMLElement>("[data-card]").forEach((card) => io.observe(card));
    return () => io.disconnect();
  }, [projects]);

  const n = projects.length;
  return (
    <div
      ref={rootRef}
      className={cn("pc-grid", className)}
    >
      <StaggerGroup
        as="ul"
        className="grid grid-cols-1 gap-x-space-5 gap-y-space-7 sm:grid-cols-4 xl:grid-cols-6"
      >
        {projects.map((project, i) => (
          <li
            key={project.slug}
            data-card
            className={cn("pc-card min-w-0 sm:col-span-2", placement(i, n))}
          >
            <ProjectCard project={project} titleAs={titleAs} />
          </li>
        ))}
      </StaggerGroup>
    </div>
  );
}
