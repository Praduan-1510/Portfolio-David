import { Container } from "@/components/primitives";

/*
 * Case-study loading skeleton — mirrors src/app/work/[slug]/page.tsx: a
 * full-bleed header (left title block + right phone-frame cover) and the
 * "Screens" grid of phone placeholders. Reserves the same space as the real
 * page to avoid layout shift (DESIGN_GUIDELINES §11).
 */
export default function Loading() {
  return (
    <article className="bg-bg text-fg">
      <span role="status" className="sr-only">
        Loading case study
      </span>

      {/* Header — title block (left) + phone cover (right). */}
      <header className="border-b border-line" aria-hidden="true">
        <Container className="grid animate-pulse items-center gap-space-9 py-space-11 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            {/* Eyebrow bar. */}
            <div className="h-[0.875rem] w-[10rem] rounded-[2px] bg-surface" />
            {/* Big title bars. */}
            <div className="mt-space-4 h-[3rem] w-[90%] max-w-[18ch] rounded-[2px] bg-surface" />
            <div className="mt-space-3 h-[3rem] w-[60%] max-w-[18ch] rounded-[2px] bg-surface" />
            {/* Summary bars. */}
            <div className="mt-space-5 h-[1rem] w-[85%] max-w-[46ch] rounded-[2px] bg-surface" />
            <div className="mt-space-3 h-[1rem] w-[65%] max-w-[46ch] rounded-[2px] bg-surface" />
            {/* Meta row (Role · Services). */}
            <div className="mt-space-8 grid grid-cols-2 gap-space-6 border-t border-line pt-space-6">
              <div>
                <div className="h-[0.875rem] w-[4rem] rounded-[2px] bg-surface" />
                <div className="mt-space-2 h-[1rem] w-[70%] rounded-[2px] bg-surface" />
              </div>
              <div>
                <div className="h-[0.875rem] w-[5rem] rounded-[2px] bg-surface" />
                <div className="mt-space-2 h-[1rem] w-[85%] rounded-[2px] bg-surface" />
              </div>
            </div>
          </div>

          {/* Phone-frame cover placeholder. */}
          <div className="mx-auto w-full max-w-[16rem]">
            <div className="aspect-[9/19.5] rounded-[2rem] border border-line bg-surface" />
          </div>
        </Container>
      </header>

      {/* Screens — grid of phone placeholders. */}
      <Container as="section" className="border-t border-line py-space-10" aria-hidden="true">
        <div className="animate-pulse">
          {/* "Screens" eyebrow + heading. */}
          <div className="h-[0.875rem] w-[6rem] rounded-[2px] bg-surface" />
          <div className="mt-space-3 h-[2rem] w-[60%] max-w-[24ch] rounded-[2px] bg-surface" />

          <ul className="mt-space-9 grid grid-cols-2 gap-x-space-5 gap-y-space-7 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <div className="aspect-[9/19.5] rounded-[2rem] border border-line bg-surface" />
                <div className="mt-space-3 h-[0.875rem] w-[70%] rounded-[2px] bg-surface" />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </article>
  );
}
