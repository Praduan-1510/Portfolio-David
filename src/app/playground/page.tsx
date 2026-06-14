import type { Metadata } from "next";
import { Container, Text, Eyebrow, Button } from "@/components/primitives";
import {
  Reveal,
  Parallax,
  SplitText,
  MagneticButton,
  ScrollProgress,
} from "@/components/motion";

/*
 * TEMPORARY — Phase 2 motion-primitive proving ground (ARCHITECTURE.md §18).
 * Each primitive is demonstrated in isolation. Remove (or move under a dev-only
 * flag) once the primitives are used in real sections. noindex so it never ships
 * to search.
 */
export const metadata: Metadata = {
  title: "Playground",
  robots: { index: false, follow: false },
};

function SectionLabel({ n, name, note }: { n: string; name: string; note: string }) {
  return (
    <div className="mb-space-7">
      <Eyebrow>
        {n} · {name}
      </Eyebrow>
      <Text variant="body" className="mt-space-2 text-muted">
        {note}
      </Text>
    </div>
  );
}

export default function Playground() {
  return (
    <>
      <ScrollProgress />

      {/* Intro */}
      <Container as="section" className="py-space-11">
        <Eyebrow>Playground · temporary</Eyebrow>
        <SplitText
          as="h1"
          className="mt-space-4 max-w-[14ch] font-display text-display-xl"
        >
          Motion primitives, in isolation.
        </SplitText>
        <Text variant="body-l" className="mt-space-6 max-w-[var(--measure)] text-muted">
          Scroll to exercise each primitive. Toggle your OS &ldquo;reduce
          motion&rdquo; setting — every effect should degrade to instant/static
          and all content should stay fully visible.
        </Text>
      </Container>

      {/* 1 — SplitText (already shown in the hero above) */}
      <Container as="section" className="border-t border-line py-space-10">
        <SectionLabel
          n="01"
          name="SplitText"
          note="GSAP SplitText, mask-clipped per-line reveal on scroll-in. Falls back to plain text under reduced motion."
        />
        <SplitText className="max-w-[18ch] font-display text-display-l">
          Type that resolves line by line as it enters the viewport.
        </SplitText>
      </Container>

      {/* 2 — Reveal (with stagger via delay) */}
      <Container as="section" className="border-t border-line py-space-10">
        <SectionLabel
          n="02"
          name="Reveal"
          note="In-view fade + translate, once. Staggered here via increasing delay."
        />
        <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="card-neon rounded-[2px] border border-line bg-surface p-space-7">
                <Text variant="heading" className="font-display">
                  0{i + 1}
                </Text>
                <Text variant="body" className="mt-space-2 text-muted">
                  Reveals on enter, with a {i * 80}ms stagger delay.
                </Text>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* 3 — Parallax */}
      <Container as="section" className="border-t border-line py-space-11">
        <SectionLabel
          n="03"
          name="Parallax"
          note="Scroll-linked translate, scrubbed linearly. Subtle differential between layers."
        />
        <div className="relative grid min-h-[70vh] grid-cols-1 items-center gap-space-8 sm:grid-cols-2">
          <Parallax speed={0.12}>
            <div className="card-neon flex aspect-[4/3] items-center justify-center rounded-[2px] border border-line bg-surface">
              <span className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
                speed 0.12
              </span>
            </div>
          </Parallax>
          <Parallax speed={-0.08}>
            <div className="card-neon flex aspect-[4/3] items-center justify-center rounded-[2px] border border-line bg-surface">
              <span className="font-mono text-caption uppercase tracking-[0.18em] text-muted">
                speed −0.08
              </span>
            </div>
          </Parallax>
        </div>
      </Container>

      {/* 4 — MagneticButton */}
      <Container as="section" className="border-t border-line py-space-11">
        <SectionLabel
          n="04"
          name="MagneticButton"
          note="Drifts toward the cursor (fine pointers only). Disabled on touch and under reduced motion."
        />
        <div className="flex min-h-[40vh] items-center justify-center">
          <MagneticButton strength={0.4}>
            <Button href="/playground" variant="primary">
              Hover me
            </Button>
          </MagneticButton>
        </div>
      </Container>

      {/* 5 — ScrollProgress (the bar pinned at the very top of this page) */}
      <Container as="section" className="border-t border-line py-space-11">
        <SectionLabel
          n="05"
          name="ScrollProgress"
          note="The thin accent bar pinned at the top of the viewport tracks page scroll. Look up ↑"
        />
        <div className="flex min-h-[50vh] flex-col justify-end">
          <Text variant="body" className="text-muted">
            You&apos;ve nearly reached the end — the bar at the top should be close
            to full.
          </Text>
          <Reveal className="mt-space-6">
            <Text variant="display-l" className="font-display">
              Foundation ready.
            </Text>
          </Reveal>
        </div>
      </Container>
    </>
  );
}
