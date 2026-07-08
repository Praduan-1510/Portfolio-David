import { Container } from "@/components/primitives";

/*
 * Contact loading skeleton — mirrors src/app/contact/page.tsx: heading + the
 * bordered channel rows (Email / LinkedIn / Location), on the page's section
 * rhythm (DESIGN_GUIDELINES §11).
 */
export default function Loading() {
  return (
    <Container as="section" className="py-space-10">
      <span role="status" className="sr-only">
        Loading
      </span>

      <div aria-hidden="true" className="animate-pulse">
        {/* Heading bar. */}
        <div className="h-[2.5rem] w-[55%] max-w-[18ch] rounded-[2px] bg-surface" />
        {/* Lead bar. */}
        <div className="mt-space-5 h-[1rem] w-[80%] max-w-[var(--measure)] rounded-[2px] bg-surface" />

        {/* Channel rows — bordered, like the real contact list. */}
        <dl className="mt-space-9 max-w-[var(--measure)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-baseline justify-between gap-space-4 border-t border-line py-space-5"
            >
              <div className="h-[0.875rem] w-[5rem] rounded-[2px] bg-surface" />
              <div className="h-[1rem] w-[40%] rounded-[2px] bg-surface" />
            </div>
          ))}
        </dl>
      </div>
    </Container>
  );
}
