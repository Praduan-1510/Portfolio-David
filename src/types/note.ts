/*
 * Notes: short written breakdowns, the distribution surface for the case
 * studies. A note makes ONE argument and links back to the study that proves
 * it, so the writing feeds the work rather than competing with it.
 *
 * Deliberately a much smaller schema than Project (src/types/project.ts): a
 * note has no media pipeline, no accent theming and no prototype. If a note
 * needs all that, it wants to be a case study instead.
 */

export interface NoteMeta {
  /** URL segment, derived from the filename. */
  slug: string;
  title: string;
  /** One line for the index and the social card. */
  summary: string;
  /** ISO date (YYYY-MM-DD). Sorted newest first. */
  date: string;
  /**
   * Slug of the case study this note draws on, if any. Renders as a "the work
   * behind this" link, which is the whole point of the section: a note that
   * cannot point at evidence is an opinion.
   */
  related?: string;
  /** Short topical labels, shown as a mono-caps row. */
  tags?: string[];
  /**
   * Unpublished. Drafts render in `next dev` so they can be reviewed in place,
   * and are excluded from production builds, the index, and the sitemap.
   */
  draft?: boolean;
}

/** A note: parsed frontmatter plus its raw MDX body. */
export interface Note {
  meta: NoteMeta;
  /** Raw MDX source for the body (rendered with MDXRemote). */
  content: string;
}
