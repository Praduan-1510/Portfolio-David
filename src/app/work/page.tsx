import type { Metadata } from "next";
import { Container, Text } from "@/components/primitives";
import { Reveal, TextReveal, AnimatedDivider, AuroraEmber } from "@/components/motion";
import { WorkIndex } from "@/components/sections/WorkIndex";
import { getAllProjectsMeta } from "@/lib/content/work";
import { GRAPHIC_FRAMES } from "@/lib/content/graphics";
import type { ProjectMeta } from "@/types/project";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies in operational B2B software: product design, design systems, and the front-end that ships them.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work: Praduan Saha",
    description: "Selected case studies in operational B2B software: product design, design systems, and the front-end that ships them.",
    // This page has no co-located opengraph-image, and the root card isn't
    // inherited once this openGraph object is declared, so point at it explicitly.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Work: Praduan Saha",
    description: "Selected case studies in operational B2B software: product design, design systems, and the front-end that ships them.",
    images: ["/twitter-image"],
  },
};

/** Small counts in words, the way the page's prose sets numbers. */
const WORDS = [
  "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty",
];
const inWords = (n: number): string => WORDS[n] ?? String(n);
const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/*
 * The header's claim about the index, counted from the data rather than typed.
 * It used to be typed, and it drifted: "Six studies at full weight" and "four
 * are working builds" long after there were eight and seven. The studies and
 * their statuses (live, prototype, concept) come from the content layer and
 * the graphics count from the contact sheet's own list, so adding a study or
 * shipping one updates the sentence with it.
 */
function headerCopy(projects: ProjectMeta[]): string {
  const studies = projects.filter((p) => p.kind !== "graphic");
  const live = studies.filter((p) => p.status === "live").length;
  const builds = studies.filter((p) => p.status === "prototype").length;
  const concepts = studies.filter((p) => p.status === "concept").length;
  const hasGraphics = projects.some((p) => p.kind === "graphic");

  const lead = [
    `${capitalise(inWords(studies.length))} ${studies.length === 1 ? "study" : "studies"}`,
    hasGraphics && `then a sheet of ${inWords(GRAPHIC_FRAMES.length)} graphics`,
  ].filter((c): c is string => Boolean(c));
  const clauses = [
    live > 0 && `${inWords(live)} ${live === 1 ? "is" : "are"} live in production`,
    builds > 0 &&
      `${inWords(builds)} ${builds === 1 ? "is a working build" : "are working builds"} you can open and use in the browser`,
    concepts > 0 &&
      `${inWords(concepts)} ${concepts === 1 ? "is an unshipped concept" : "are unshipped concepts"}`,
    "every one is labelled for what it is",
  ].filter((c): c is string => Boolean(c));
  const tail =
    clauses.length > 1
      ? `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}`
      : clauses[0];
  return `${lead.join(", ")}. ${capitalise(tail)}.`;
}

/*
 * Work index (ARCHITECTURE.md §6). Header in a Container, then the index: the
 * screen studies as the project-card grid, then the graphics contact sheet
 * (components/sections/WorkIndex.tsx). Data is read
 * at build time and handed down.
 */
export default function WorkPage() {
  const projects = getAllProjectsMeta();

  return (
    <>
      <Container as="header" className="relative isolate pt-space-10 pb-space-6">
        {/* Spectrum ember: the identity's warm temperature on the index. */}
        <AuroraEmber hue="signal" position="top-right" intensity={0.12} />
        {/* Signature header beat: the page title reveals word by word. */}
        <TextReveal
          as="h1"
          by="words"
          trigger="load"
          delay={0.08}
          className="font-display text-display-l max-w-[20ch]"
        >
          Selected projects
        </TextReveal>

        {/* Supporting copy: quiet rise, no kinetic split. */}
        <Reveal trigger="load" delay={0.18} y={16}>
          <Text variant="body-l" className="mt-space-5 max-w-[var(--measure)] text-muted">
            {headerCopy(projects)}
          </Text>
        </Reveal>

        {/* Hairline draws across to separate the header from the sequence. */}
        <AnimatedDivider from="left" spectrum className="mt-space-7" />
      </Container>

      <WorkIndex projects={projects} />
    </>
  );
}
