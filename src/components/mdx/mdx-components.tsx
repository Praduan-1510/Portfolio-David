import { Text, Link } from "@/components/primitives";

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
      className="mt-space-9 mb-space-4 flex items-baseline gap-space-3 scroll-mt-space-8 first:mt-0"
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
  p: (props: Props) => <Text as="p" variant="body" className="mb-space-5" {...props} />,
  // Lists — custom accent markers (the disc/decimal colour is the project accent
  // via the marker pseudo-element) so enumeration carries the thread too.
  ul: (props: Props) => (
    <ul
      className="mb-space-5 ml-space-1 list-none space-y-space-3 text-body [&>li]:relative [&>li]:pl-space-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.62em] [&>li]:before:h-[5px] [&>li]:before:w-[5px] [&>li]:before:rounded-full [&>li]:before:bg-accent [&>li]:before:content-['']"
      {...props}
    />
  ),
  ol: (props: Props) => (
    <ol
      className="mb-space-5 ml-space-1 list-none space-y-space-3 text-body [counter-reset:item] [&>li]:relative [&>li]:pl-space-6 [&>li]:[counter-increment:item] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-0 [&>li]:before:font-mono [&>li]:before:text-caption [&>li]:before:text-accent [&>li]:before:content-[counter(item,decimal-leading-zero)]"
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
      className="my-space-8 border-l-2 border-accent pl-space-6 font-display text-display-l leading-[1.15] tracking-[-0.01em] text-fg [&>p]:mb-0 [&>p]:text-inherit"
      {...props}
    />
  ),
  // Hairline rule — a centred short accent tick over a full hairline, so section
  // breaks read as a deliberate editorial mark rather than a plain border.
  hr: () => (
    <div aria-hidden="true" className="relative my-space-9 h-px w-full bg-line">
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
};
