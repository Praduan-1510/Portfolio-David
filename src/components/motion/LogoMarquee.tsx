"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Container, Eyebrow } from "@/components/primitives";
import { cn } from "@/lib/utils/cn";
import { spectrumAt } from "@/lib/spectrum";

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
 * id and no network dependency.
 *
 * Each logo is painted by using its SVG as a CSS mask over a solid fill, so the
 * silhouette takes an EXACT design token rather than an approximated filter tint:
 * it rests at `--muted` (matching the old .55 white silhouette on this dark band)
 * and, on hover, lifts to the site's `--neon` interaction signal — the same
 * affordance as every card and button. The mask is height-normalized (auto width)
 * inside a fixed slot so mixed source aspect ratios still line up on one baseline.
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
  index,
}: {
  tool: Tool;
  gapClassName?: string;
  decorative?: boolean;
  index: number;
}) {
  return (
    <li
      aria-hidden={decorative || undefined}
      className={cn("flex shrink-0 items-center", gapClassName)}
    >
      {/* The self-hosted SVG is used as a CSS mask over a solid token fill, so the
          silhouette is an EXACT colour: it rests at --muted and, on hover, lifts to
          its OWN hue from the site spectrum (violet→blue→lime→amber→rose, cycled by
          index via --tool-fill) — so adjacent icons never share a colour and the
          whole strip reads in the site's signature palette. transition-colors on
          the `fast`/ease-out-quad tokens; auto-neutralised under reduced motion by
          the global rule. Height-normalised + centred in a fixed slot so the mixed
          source aspect ratios share one baseline. */}
      <span
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : `${tool.name} logo`}
        title={decorative ? undefined : tool.name}
        className="block h-7 w-9 select-none bg-muted transition-colors duration-fast ease-out-quad hover:bg-[var(--tool-fill)]"
        style={
          {
            "--tool-fill": spectrumAt(index),
            maskImage: `url(${tool.src})`,
            WebkitMaskImage: `url(${tool.src})`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskSize: "contain",
            WebkitMaskSize: "contain",
          } as React.CSSProperties
        }
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
            {TOOLS.map((tool, i) => (
              <ToolLogo key={tool.src} tool={tool} index={i} />
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
            {TOOLS.map((tool, i) => (
              <ToolLogo key={`a-${tool.src}`} tool={tool} gapClassName={GAP} index={i} />
            ))}
            {/* Duplicate half — hidden from assistive tech, completes the loop. */}
            {TOOLS.map((tool, i) => (
              <ToolLogo
                key={`b-${tool.src}`}
                tool={tool}
                gapClassName={GAP}
                decorative
                index={i}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
