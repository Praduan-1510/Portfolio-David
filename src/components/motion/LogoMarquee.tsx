"use client";

import { useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Container, Eyebrow } from "@/components/primitives";
import { cn } from "@/lib/utils/cn";

/*
 * "Tools I work with" — an infinite horizontal logo marquee. The track is
 * duplicated and translated -50% via a CSS keyframe (tailwind `animate-marquee-x`)
 * so the seam is invisible (each cell carries its gap as trailing padding, so the
 * two halves are exactly equal width). Pauses on hover (group-hover toggles
 * animation-play-state). Under prefers-reduced-motion it renders a STATIC wrapped
 * row instead — no animation, no duplicate (§10 inclusive motion).
 *
 * Logos are self-hosted monochrome SVGs in /public/logos (Simple Icons, CC0; the
 * two it lacks — Midjourney, Runway — from svgl). Self-hosting means no CDN client
 * id, no network dependency, and crucially no third-party placeholder marks: the
 * Brandfetch CDN we used before answered 200 with a generic "B" glyph for any
 * brand it couldn't resolve, so onError never fired and the strip filled with "B".
 * Now a missing file is the only failure mode, and onError drops just that cell.
 * Each logo is forced to a white silhouette (grayscale→black→invert) to match the
 * monochrome dark band, faded to .55 and lifting to full opacity on hover.
 *
 * NOTE: this section is hard-pinned to data-theme="dark" because the white-silhouette
 * filter only reads on a dark background — so it works dropped anywhere on the site.
 */

type Tool = { src: string; name: string };

// Edit freely — order is render order. To add a tool, drop a monochrome SVG into
// /public/logos and add a line here. (Spline is intentionally omitted: it ships
// only low-res PNG favicons, no clean open-license SVG — add one here if you have it.)
const TOOLS: Tool[] = [
  // Design
  { src: "/logos/figma.svg", name: "Figma" },
  { src: "/logos/canva.svg", name: "Canva" },
  { src: "/logos/adobe.svg", name: "Adobe" },
  { src: "/logos/framer.svg", name: "Framer" },
  { src: "/logos/sketch.svg", name: "Sketch" },
  { src: "/logos/webflow.svg", name: "Webflow" },
  { src: "/logos/notion.svg", name: "Notion" },
  { src: "/logos/wordpress.svg", name: "WordPress" },
  // AI
  { src: "/logos/openai.svg", name: "ChatGPT" },
  { src: "/logos/claude.svg", name: "Claude" },
  { src: "/logos/midjourney.svg", name: "Midjourney" },
  { src: "/logos/runway.svg", name: "Runway" },
  { src: "/logos/perplexity.svg", name: "Perplexity" },
  { src: "/logos/gemini.svg", name: "Gemini" },
];

const GAP = "pr-space-8 sm:pr-space-9";
const EDGE_MASK =
  "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)";

function ToolLogo({
  tool,
  gapClassName,
  decorative,
}: {
  tool: Tool;
  gapClassName?: string;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null; // missing file → drop this logo entirely (no placeholder)
  return (
    <li
      aria-hidden={decorative || undefined}
      className={cn("flex shrink-0 items-center", gapClassName)}
    >
      {/* Plain <img> of a self-hosted SVG; no next/image needed for tiny vectors. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tool.src}
        alt={decorative ? "" : `${tool.name} logo`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        style={{ filter: "grayscale(1) brightness(0) invert(1)" }}
        className="h-7 w-auto max-w-[140px] select-none object-contain opacity-[0.55] transition-opacity duration-fast ease-out-quad hover:opacity-100"
      />
    </li>
  );
}

export function LogoMarquee({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <section
      data-theme="dark"
      aria-label="Tools I work with"
      className={cn(
        "relative isolate overflow-hidden border-t border-line bg-bg py-space-9 text-fg",
        className,
      )}
    >
      <Container className="mb-space-6 text-center">
        <Eyebrow>Tools I work with</Eyebrow>
      </Container>

      {reduced ? (
        // Static, fully legible wrapped row — no animation, no duplicate.
        <Container>
          <ul className="flex flex-wrap items-center justify-center gap-x-space-8 gap-y-space-5">
            {TOOLS.map((tool) => (
              <ToolLogo key={tool.src} tool={tool} />
            ))}
          </ul>
        </Container>
      ) : (
        // Full-bleed seamless loop, paused on hover, edges faded.
        <div
          className="group relative w-full overflow-hidden"
          style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
        >
          <ul className="flex w-max flex-nowrap items-center motion-safe:animate-marquee-x group-hover:[animation-play-state:paused]">
            {TOOLS.map((tool) => (
              <ToolLogo key={`a-${tool.src}`} tool={tool} gapClassName={GAP} />
            ))}
            {/* Duplicate half — hidden from assistive tech, completes the loop. */}
            {TOOLS.map((tool) => (
              <ToolLogo key={`b-${tool.src}`} tool={tool} gapClassName={GAP} decorative />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
