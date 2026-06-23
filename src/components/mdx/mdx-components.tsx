import { Text, Link, BrowserMockup } from "@/components/primitives";
import { slugify } from "@/lib/utils/slugify";
import { cn } from "@/lib/utils/cn";
import {
  ScreenBeat,
  FindingStack,
  Finding,
  DecisionCards,
  DecisionCard,
  Aside,
  StatusColourSystem,
  Stats,
  Stat,
  Lede,
  Goals,
  Goal,
} from "./CaseStudyBlocks";

// Flatten MDX children to plain text so an h2's id matches the slug the contents
// rail derives from the raw MDX (handles plain strings, arrays, and inline nodes).
function toText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return toText((node as { props?: { children?: React.ReactNode } }).props?.children);
  }
  return "";
}

/*
 * Maps MDX elements in case-study bodies to token-styled primitives. Passed to
 * <MDXRemote components={mdxComponents} />. The h1 is intentionally omitted —
 * the page renders the title from frontmatter, so bodies start at h2.
 *
 * Editorial treatment (this is the case-study reading experience, so it leads
 * with type, not chrome):
 *   - The body is wrapped in `.prose-cs` (set on the MDX container in the page);
 *     a `:first-of-type` rule there opens each study with a larger, lighter LEAD
 *     paragraph. We can't reliably tag "the first paragraph" per-element in MDX,
 *     so the lead is expressed as a scoped CSS variant on the wrapper.
 *   - h2/h3 carry an accent MARKER (a short --accent tick before the heading) so
 *     sections scan and the project colour threads through the column.
 *   - Blockquotes are a confident pull-quote with an accent edge, to break density.
 *   - Links are accent + underline affordance; strong/em, lists and the hr rule
 *     are refined so the column reads as set type, not a slab.
 */
type Props = Record<string, unknown>;

export const mdxComponents = {
  // h2 — section head with an accent tick. Generous top space so sections
  // breathe; the tick is a short --accent rule that anchors the heading and
  // threads the project colour through the column (decorative → aria-hidden).
  h2: ({ children, ...props }: Props & { children?: React.ReactNode }) => (
    <Text
      as="h2"
      variant="heading"
      id={slugify(toText(children))}
      className="mt-space-9 mb-space-4 flex items-baseline gap-space-3 scroll-mt-space-9 first:mt-0"
      {...props}
    >
      <span
        aria-hidden="true"
        className="relative top-[-0.18em] h-[2px] w-space-5 shrink-0 rounded-full bg-accent"
      />
      <span>{children}</span>
    </Text>
  ),
  // h3 — subsection. Lighter than h2 but still display, with a small accent dot
  // so the hierarchy reads at a glance without competing with h2.
  h3: ({ children, ...props }: Props & { children?: React.ReactNode }) => (
    <Text
      as="h3"
      variant="body-l"
      className="mt-space-7 mb-space-3 flex items-baseline gap-space-3 scroll-mt-space-8 font-display font-medium"
      {...props}
    >
      <span
        aria-hidden="true"
        className="relative top-[-0.1em] h-[5px] w-[5px] shrink-0 rounded-full bg-accent"
      />
      <span>{children}</span>
    </Text>
  ),
  p: (props: Props) => (
    <Text as="p" variant="body" className="mb-space-5 max-w-[var(--measure)]" {...props} />
  ),
  // Lists — custom accent markers (the disc/decimal colour is the project accent
  // via the marker pseudo-element) so enumeration carries the thread too.
  ul: (props: Props) => (
    <ul
      className="mb-space-5 ml-space-1 max-w-[var(--measure)] list-none space-y-space-3 text-body [&>li]:relative [&>li]:pl-space-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.62em] [&>li]:before:h-[5px] [&>li]:before:w-[5px] [&>li]:before:rounded-full [&>li]:before:bg-accent [&>li]:before:content-['']"
      {...props}
    />
  ),
  ol: (props: Props) => (
    <ol
      className="mb-space-5 ml-space-1 max-w-[var(--measure)] list-none space-y-space-3 text-body [counter-reset:item] [&>li]:relative [&>li]:pl-space-6 [&>li]:[counter-increment:item] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-0 [&>li]:before:font-mono [&>li]:before:text-caption [&>li]:before:text-accent [&>li]:before:content-[counter(item,decimal-leading-zero)]"
      {...props}
    />
  ),
  li: (props: Props) => <li {...props} />,
  a: ({ href = "#", ...rest }: Props & { href?: string }) => (
    <Link href={href} {...rest} />
  ),
  // Pull-quote — large, confident, with an accent edge. The leading accent bar
  // and oversized display type break up the prose density (DESIGN brief #1).
  blockquote: (props: Props) => (
    <blockquote
      className="my-space-8 max-w-[var(--measure)] border-l-2 border-accent pl-space-6 font-display text-display-l leading-[1.15] tracking-[-0.01em] text-fg [&>p]:mb-0 [&>p]:max-w-none [&>p]:text-inherit"
      {...props}
    />
  ),
  // Hairline rule — a centred short accent tick over a full hairline, so section
  // breaks read as a deliberate editorial mark rather than a plain border.
  hr: () => (
    <div aria-hidden="true" className="relative my-space-9 h-px w-full max-w-[var(--measure)] bg-line">
      <span className="absolute left-1/2 top-1/2 h-px w-space-6 -translate-x-1/2 -translate-y-1/2 bg-accent" />
    </div>
  ),
  // strong — accent-tinted weight so emphasis carries the project colour without
  // shouting; em stays foreground but italic for a quieter second emphasis.
  strong: (props: Props) => (
    <strong className="font-medium text-fg" {...props} />
  ),
  em: (props: Props) => <em className="italic text-fg" {...props} />,
  code: (props: Props) => (
    <code
      className="rounded-[2px] border border-line bg-surface px-space-1 font-mono text-caption text-fg"
      {...props}
    />
  ),
  // Shot — an inline browser-framed screenshot for case-study bodies (the still
  // counterpart to the hero's looping capture). Reuses BrowserMockup's window
  // chrome so an embedded screen reads as a real browser window, then a caption
  // that explains the *decision*, not the obvious (DESIGN_GUIDELINES §5 — captions
  // are non-negotiable, and mirror the screen-gallery caption treatment).
  // `align` lets consecutive shots sit on opposite sides of the column for a
  // woven, editorial rhythm (lg+; below that they fill the single column). The
  // text stays at --measure, so media that exceeds it reads as a deliberate
  // break-out rather than a wider paragraph.
  Shot: ({
    src,
    caption,
    alt,
    domain,
    aspect = "198 / 100",
    align = "left",
  }: {
    src?: string;
    caption?: string;
    alt?: string;
    domain?: string;
    aspect?: string;
    align?: "left" | "right";
  }) => (
    <figure className="my-space-9 w-full">
      <div
        className={cn(
          "w-full lg:max-w-[42rem]",
          align === "right" ? "lg:ml-auto" : "lg:mr-auto",
        )}
      >
        <BrowserMockup
          tilt="still"
          poster={src ?? ""}
          alt={alt ?? caption ?? "Screenshot"}
          domain={domain}
          aspect={aspect}
          objectPosition="50% 50%"
          sizes="(min-width: 1024px) 42rem, 92vw"
        />
        {caption && (
          <figcaption className="mt-space-3 font-mono text-caption uppercase tracking-[0.14em] text-muted">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  ),
  // Editorial blocks for the reading column (see CaseStudyBlocks.tsx): inline
  // phone screens, numbered findings, decision cards, asides, the status-colour
  // system, and a by-the-numbers band — one device per major section for cadence.
  ScreenBeat,
  FindingStack,
  Finding,
  DecisionCards,
  DecisionCard,
  Aside,
  StatusColourSystem,
  Stats,
  Stat,
  Lede,
  Goals,
  Goal,
};
