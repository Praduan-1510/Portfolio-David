/**
 * Content model for case studies (ARCHITECTURE.md §8).
 * Frontmatter lives in src/content/work/*.mdx and is parsed by the thin
 * content layer in src/lib/content/work.ts. Migrating to a CMS later means
 * swapping the data source, not these types.
 */

export interface Metric {
  label: string;
  value: string;
}

export interface Credit {
  role: string;
  name: string;
}

/** A single app screen in a case-study gallery. */
export interface Screen {
  /** Image path under /public. */
  src: string;
  /** Short label shown beneath the screen (e.g. "GST Center"). */
  caption: string;
}

/**
 * A named group of screens that mirrors one stage of the product flow
 * (e.g. "Onboarding", "Book", "Account"). Grouping turns the gallery from a
 * flat wall of phones into a legible walkthrough of the experience.
 */
export interface ScreenFlow {
  /** Flow name (echoes the walkthrough sections). */
  title: string;
  /** Optional one-line framing for the group. */
  note?: string;
  screens: Screen[];
}

/** Structured frontmatter for one case study. */
export interface ProjectMeta {
  /** Project name. */
  title: string;
  /** URL segment under /work/. Derived from the filename. */
  slug: string;
  /** Client name, or "Personal". */
  client: string;
  /** Your role on the project. */
  role: string;
  /** Year completed. */
  year: number;
  /** e.g. ["Strategy", "UX", "UI", "Motion"]. */
  services: string[];
  /** 1–2 sentence teaser for the index. */
  summary: string;
  /** Hero image path. */
  cover: string;
  /** Screens grouped by product flow — the source of truth for the gallery. */
  flows: ScreenFlow[];
  /** Flat list of every screen `src`, derived from `flows` in the content layer. */
  gallery: string[];
  /** Optional per-project accent hex — themes the case-study route. */
  accent?: string;
  /** Optional disclaimer shown on the case-study page (e.g. an unofficial
   *  concept redesign not affiliated with the named brand). */
  disclaimer?: string;
  /** Headline outcomes. */
  metrics?: Metric[];
  /** Slug of the next case study. */
  nextProject?: string;
  /** Production credits. */
  credits?: Credit[];
  /** Show on the home page. */
  featured: boolean;
  /** Sort index (ascending). */
  order: number;
}

/** A case study: parsed frontmatter plus its raw MDX body. */
export interface Project {
  meta: ProjectMeta;
  /** Raw MDX source for the body (rendered with MDXRemote). */
  content: string;
}
