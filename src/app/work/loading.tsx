import { Container } from "@/components/primitives";

/*
 * Work index loading skeleton — mirrors src/app/work/page.tsx (header) and the
 * ProjectCard grid: an aspect-[4/3] media stage + title bar + summary bar per
 * card. Reserves the real grid rhythm to avoid pop-in (DESIGN_GUIDELINES §11).
 */
export default function Loading() {
  return (
    <>
      <span role="status" className="sr-only">
        Loading work
      </span>

      {/* Header skeleton (matches the page's Container header rhythm). */}
      <Container as="header" className="py-space-10" aria-hidden="true">
        <div className="animate-pulse">
          <span className="inline-block font-mono text-caption uppercase tracking-[0.18em] text-muted">
            Work
          </span>
          <div className="mt-space-3 h-[2.5rem] w-[55%] max-w-[20ch] rounded-[2px] bg-surface" />
          <div className="mt-space-5 h-[1rem] w-[85%] max-w-[var(--measure)] rounded-[2px] bg-surface" />
          <div className="mt-space-3 h-[1rem] w-[60%] max-w-[var(--measure)] rounded-[2px] bg-surface" />
        </div>
      </Container>

      {/* Card grid skeleton (matches the home/work card columns). */}
      <Container as="section" className="py-space-9" aria-hidden="true">
        <div className="grid animate-pulse grid-cols-1 gap-space-8 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              {/* Media stage — aspect-[4/3], same frame as ProjectCard. */}
              <div className="aspect-[4/3] rounded-[3px] border border-line bg-surface" />
              {/* Title bar. */}
              <div className="mt-space-4 h-[1.5rem] w-[55%] rounded-[2px] bg-surface" />
              {/* Summary bar. */}
              <div className="mt-space-3 h-[1rem] w-[80%] rounded-[2px] bg-surface" />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
