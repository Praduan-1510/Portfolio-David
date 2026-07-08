import { Container } from "@/components/primitives";

/*
 * Root loading fallback (DESIGN_GUIDELINES.md §11 "loading is designed"). Quiet
 * by design: a mono "Loading" label + a few skeleton bars on the page's
 * vertical rhythm — never a spinner. Shown during navigation / Suspense.
 */
export default function Loading() {
  return (
    <Container as="section" className="py-space-10">
      <span role="status" className="sr-only">
        Loading
      </span>

      <div aria-hidden="true" className="animate-pulse">
        {/* Mono "Loading" label in the site's small-caps label voice. */}
        <span className="inline-block font-mono text-caption uppercase tracking-[0.18em] text-muted">
          Loading
        </span>

        {/* 2–3 skeleton bars on the page rhythm. */}
        <div className="mt-space-5 h-[2.25rem] w-[60%] max-w-[28rem] rounded-[2px] bg-surface" />
        <div className="mt-space-5 h-[1rem] w-[80%] max-w-[var(--measure)] rounded-[2px] bg-surface" />
        <div className="mt-space-3 h-[1rem] w-[55%] max-w-[var(--measure)] rounded-[2px] bg-surface" />
      </div>
    </Container>
  );
}
