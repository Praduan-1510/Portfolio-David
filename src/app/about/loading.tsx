import { Container } from "@/components/primitives";

/*
 * About loading skeleton — mirrors src/app/about/page.tsx: a large lead
 * heading (a few wide bars) + several body bars, on the page's section rhythm
 * (DESIGN_GUIDELINES §11).
 */
export default function Loading() {
  return (
    <Container as="section" className="py-space-10">
      <span role="status" className="sr-only">
        Loading
      </span>

      <div aria-hidden="true" className="animate-pulse">
        {/* Large lead heading — a few wide bars. */}
        <div className="max-w-[24ch] space-y-space-3">
          <div className="h-[2.5rem] w-[95%] rounded-[2px] bg-surface" />
          <div className="h-[2.5rem] w-[85%] rounded-[2px] bg-surface" />
          <div className="h-[2.5rem] w-[60%] rounded-[2px] bg-surface" />
        </div>

        {/* Body paragraphs. */}
        <div className="mt-space-8 max-w-[var(--measure)] space-y-space-3">
          <div className="h-[1rem] w-full rounded-[2px] bg-surface" />
          <div className="h-[1rem] w-[92%] rounded-[2px] bg-surface" />
          <div className="h-[1rem] w-[96%] rounded-[2px] bg-surface" />
          <div className="h-[1rem] w-[70%] rounded-[2px] bg-surface" />
        </div>
      </div>
    </Container>
  );
}
