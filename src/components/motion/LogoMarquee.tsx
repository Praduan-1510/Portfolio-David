import { cn } from "@/lib/utils/cn";
import { spectrumAt } from "@/lib/spectrum";

/*
 * "Tools I work with" — a compact static tool grid mounted on /about ("Toolchain").
 *
 * Logos are self-hosted monochrome SVGs in /public/logos (Simple Icons, CC0; the
 * two it lacks — Midjourney, Runway — from svgl). Self-hosting means no CDN client
 * id and no network dependency.
 *
 * Each logo is painted by using its SVG as a CSS mask over a solid fill, so the
 * silhouette takes an EXACT design token rather than an approximated filter tint:
 * it rests at `--muted` and, on hover, lifts to its own hue from the site spectrum.
 * The mask is height-normalized (auto width) inside a fixed slot so mixed source
 * aspect ratios still line up on one baseline.
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

/* Compact static tool grid — the marquee's information without the trope.
   Mounted on /about ("Toolchain"); the home page no longer carries the band. */
export function ToolGrid({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "grid grid-cols-5 place-items-center gap-x-space-6 gap-y-space-5 sm:grid-cols-7",
        className,
      )}
    >
      {TOOLS.map((tool, i) => (
        <ToolLogo key={tool.src} tool={tool} index={i} />
      ))}
    </ul>
  );
}
