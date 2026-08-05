import { Container } from "@/components/primitives";

/*
 * Résumé loading skeleton: mirrors src/app/resume/page.tsx: the letterhead
 * (name + title plate + statement + actions) over the first ledger rows
 * (DESIGN_GUIDELINES §11).
 */
export default function Loading() {
  return (
    <Container as="section" className="py-space-10">
      <span role="status" className="sr-only">
        Loading
      </span>

      <div aria-hidden="true" className="animate-pulse">
        {/* Document rule. */}
        <div className="flex items-center justify-between border-b border-line pb-space-4">
          <div className="h-[0.8rem] w-[9rem] rounded-[2px] bg-surface" />
          <div className="h-[0.8rem] w-[7rem] rounded-[2px] bg-surface" />
        </div>

        {/* Name + title plate. */}
        <div className="mt-space-7 space-y-space-4">
          <div className="h-[3.5rem] w-[min(22rem,80%)] rounded-[2px] bg-surface" />
          <div className="h-[0.9rem] w-[16rem] rounded-[2px] bg-surface" />
        </div>

        {/* Statement. */}
        <div className="mt-space-6 max-w-[52ch] space-y-space-3">
          <div className="h-[1rem] w-full rounded-[2px] bg-surface" />
          <div className="h-[1rem] w-[94%] rounded-[2px] bg-surface" />
          <div className="h-[1rem] w-[76%] rounded-[2px] bg-surface" />
        </div>

        {/* Actions. */}
        <div className="mt-space-7 flex gap-space-4">
          <div className="h-[2.75rem] w-[10rem] rounded-[2px] bg-surface" />
          <div className="h-[2.75rem] w-[7rem] rounded-[2px] bg-surface" />
        </div>

        {/* Ledger rows. */}
        <div className="mt-space-10 space-y-space-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-line pt-space-5">
              <div className="h-[1.4rem] w-[12rem] rounded-[2px] bg-surface" />
              <div className="mt-space-4 space-y-space-3">
                <div className="h-[0.9rem] w-full rounded-[2px] bg-surface" />
                <div className="h-[0.9rem] w-[88%] rounded-[2px] bg-surface" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
