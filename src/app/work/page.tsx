import type { Metadata } from "next";
import { Container, Text } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider, AuroraEmber } from "@/components/motion";
import { WorkIndex } from "@/components/sections/WorkIndex";
import { getAllProjectsMeta } from "@/lib/content/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies in product design and front-end development.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work — Praduan Saha",
    description: "Selected case studies in product design and front-end development.",
    // This page has no co-located opengraph-image, and the root card isn't
    // inherited once this openGraph object is declared — so point at it explicitly.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Work — Praduan Saha",
    description: "Selected case studies in product design and front-end development.",
    images: ["/twitter-image"],
  },
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
      <Container as="header" className="relative isolate pt-space-10 pb-space-6">
        {/* Spectrum ember — the identity's warm temperature on the index. */}
        <AuroraEmber hues={["amber", "rose"]} position="top-right" intensity={0.12} />
        {/* Signature header beat — the page title reveals word by word. */}
        <TextReveal
          as="h1"
          by="words"
          trigger="load"
          delay={0.08}
          className="font-display text-display-l max-w-[20ch]"
        >
          Selected projects
        </TextReveal>

        {/* Supporting copy — quiet rise, no kinetic split. */}
        <Reveal trigger="load" delay={0.18} y={16}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            The full board — live work and labelled concepts, each with the
            argument it makes. One is in production; three are honest studies.
          </Text>
        </Reveal>

        {/* Hairline draws across to separate the header from the sequence. */}
        <AnimatedDivider from="left" spectrum className="mt-space-7" />
      </Container>

      <WorkIndex projects={projects} />
    </>
  );
}
