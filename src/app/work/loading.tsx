import { Container } from "@/components/primitives";

/*
 * Work index loading skeleton: mirrors src/app/work/page.tsx (the header: title,
 * two lines of copy, the divider) and the project-card grid below it (one
 * column, two from 640px, three from 1280px). Each card is its 4:3 media box at
 * the card's 16px radius, then the status pill and kind · year row, the title
 * and two lines of outcome, so the real grid lands in the same rhythm instead
 * of popping in (DESIGN_GUIDELINES §11).
 */
export default function Loading() {
  return (
    <>
      <span role="status" className="sr-only">
        Loading work
      </span>

      {/* Header skeleton (matches the page's Container header rhythm). */}
      <Container as="header" className="pt-space-10 pb-space-6" aria-hidden="true">
        <div className="animate-pulse">
          <div className="h-[clamp(2.25rem,5vw,4.5rem)] w-[55%] max-w-[20ch] rounded-[2px] bg-surface" />
          <div className="mt-space-5 h-[1rem] w-[85%] max-w-[var(--measure)] rounded-[2px] bg-surface" />
          <div className="mt-space-3 h-[1rem] w-[60%] max-w-[var(--measure)] rounded-[2px] bg-surface" />
          <div className="mt-space-7 h-px w-full bg-line" />
        </div>
      </Container>

      {/* Card grid skeleton (matches ProjectGrid's columns and gaps). */}
      <Container as="section" className="pb-space-9 pt-space-4" aria-hidden="true">
        <div className="grid animate-pulse grid-cols-1 gap-x-space-5 gap-y-space-7 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              {/* Media box: aspect-[4/3], same frame as ProjectCard. */}
              <div className="aspect-[4/3] rounded-[16px] border border-line bg-surface" />
              {/* Status pill + kind · year. */}
              <div className="mt-space-4 flex items-center gap-space-3">
                <div className="h-[1.5rem] w-[7rem] rounded-full border border-line" />
                <div className="h-[0.75rem] w-[5rem] rounded-[2px] bg-surface" />
              </div>
              {/* Title. */}
              <div className="mt-space-3 h-[1.5rem] w-[45%] rounded-[2px] bg-surface" />
              {/* Outcome, two lines. */}
              <div className="mt-space-3 h-[1rem] w-[92%] rounded-[2px] bg-surface" />
              <div className="mt-space-2 h-[1rem] w-[64%] rounded-[2px] bg-surface" />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
