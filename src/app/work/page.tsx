import type { Metadata } from "next";
import { Container, Text, Eyebrow } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider } from "@/components/motion";
import { WorkIndex } from "@/components/sections/WorkIndex";
import { getAllProjectsMeta } from "@/lib/content/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies in product design and engineering.",
};

/*
 * Work index (ARCHITECTURE.md §6). Header in a Container; the index itself is a
 * scroll-driven sequence (full-bleed) that reads from the content layer and
 * degrades to a static stack on mobile / reduced motion (DESIGN_GUIDELINES §7.5,
 * §13). Data is fetched at build time and passed to the client component.
 */
export default function WorkPage() {
  const projects = getAllProjectsMeta();

  return (
    <>
      <Container as="header" className="py-space-10">
        {/* Quiet eyebrow on load — supporting beat. The count makes the index
            read as a curated set rather than an open-ended list. */}
        <Reveal trigger="load" y={12} as="div">
          <Eyebrow className="flex items-center gap-space-3">
            <span>Work</span>
            <span aria-hidden="true" className="h-px w-space-6 bg-line" />
            <span>{String(projects.length).padStart(2, "0")} projects</span>
          </Eyebrow>
        </Reveal>

        {/* Signature header beat — the page title reveals word by word. */}
        <TextReveal
          as="h1"
          by="words"
          trigger="load"
          delay={0.08}
          className="font-display text-display-l mt-space-3 max-w-[20ch]"
        >
          Selected projects
        </TextReveal>

        {/* Supporting copy — quiet rise, no kinetic split. */}
        <Reveal trigger="load" delay={0.18} y={16}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            A few projects that show how I work across strategy, interface, and
            motion. Scroll through them.
          </Text>
        </Reveal>

        {/* Hairline draws across to separate the header from the sequence. */}
        <AnimatedDivider from="left" className="mt-space-8" />
      </Container>

      <WorkIndex projects={projects} />
    </>
  );
}
