import { slugify } from "@/lib/utils/slugify";
import type { PlateProps } from "@/lib/diagram/types";

/*
 * The plate shell: the frame every diagram sits in. Internal, never registered
 * for MDX, because an author should always reach for <Flow> or <Landscape> and
 * never for a bare figure.
 *
 * Chrome is deliberately the SAME rule the editorial blocks already use: a
 * 2px accent-mixed top border over the caption, matching DecisionCard and Goal,
 * so a plate reads as another member of the case-study family rather than as an
 * imported widget. There is no interior fill: the ground shows through, which
 * is what keeps 1px line work legible.
 *
 * The plate never carries the study's .cs-motif texture. The motif is the
 * hero's device, and a texture under hairlines destroys them.
 *
 * Numbering is a CSS counter reset on the article, so it runs continuously
 * across BOTH MDXRemote bodies (the narrative and the post-gallery outcome).
 */
export function Plate({
  title,
  alt,
  note,
  children,
}: PlateProps & { children?: React.ReactNode }) {
  const id = `dgm-${slugify(title)}`;
  return (
    <div className="cs-wide">
      <figure className="dgm my-space-9" aria-labelledby={id}>
        {/*
          The text alternative, ahead of the visual layer. Every SVG below is
          aria-hidden, so this sentence IS the diagram for a screen reader: it
          states what the SHAPE says, which is the only thing DOM order cannot
          convey on its own.
        */}
        <p className="sr-only">{alt}</p>

        <div className="dgm-body">{children}</div>

        <figcaption className="dgm-caption mt-space-4 border-t-2 pt-space-3">
          <span className="dgm-plate font-mono text-caption uppercase tracking-[0.16em] text-muted" />
          <span
            id={id}
            className="ml-space-3 font-mono text-caption uppercase tracking-[0.16em] text-fg"
          >
            {title}
          </span>
          {note && (
            <span className="mt-space-2 block max-w-[var(--measure)] text-body text-muted">
              {note}
            </span>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
