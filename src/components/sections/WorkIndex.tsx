import { Container } from "@/components/primitives";
import { ProjectGrid } from "@/components/work/ProjectGrid";
import { ContactSheet } from "./ContactSheet";
import type { ProjectMeta } from "@/types/project";

/*
 * Work index. Two beats, one layout at every breakpoint:
 *   1. every screen study as the project-card grid (the same cards as the home
 *      page, so a card means one thing wherever it appears), in content order:
 *      the featured studies first, the two concept studies (Voyager,
 *      Decathlon) last;
 *   2. the graphics as a contact sheet.
 *
 * The concept work used to sit apart in a compact, imageless list below the
 * graphics. It now shares the grid, and the card's status pill ("Concept")
 * carries the honesty the separate shelf used to: named, dated and labelled
 * for what it is, at the same weight as the rest.
 */
export function WorkIndex({ projects }: { projects: ProjectMeta[] }) {
  const studies = projects.filter((p) => p.kind !== "graphic");
  const graphics = projects.find((p) => p.kind === "graphic");

  return (
    <>
      <Container as="section" aria-label="Selected projects" className="pb-space-9 pt-space-4">
        {/* h2 titles: the cards sit directly under the page's h1. */}
        <ProjectGrid projects={studies} titleAs="h2" />
      </Container>
      {graphics && <ContactSheet project={graphics} />}
    </>
  );
}
