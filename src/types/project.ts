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

/** A looping site / screen-recording video shown in a landscape browser mockup
 *  (the centerpiece for a `kind: "web"` case study). */
export interface ProjectVideo {
  /** MP4 source under /public (H.264 — broad support). */
  src: string;
  /** Optional WebM source (smaller; offered first via <source>). */
  webm?: string;
  /** Poster frame — the static still for reduced-motion + pre-decode. */
  poster: string;
  /** Intrinsic aspect ratio, e.g. "40/26", reserving the box to avoid CLS. */
  aspect?: string;
}

/** One surface of a self-contained HTML prototype, shown as a tab in the
 *  live-prototype frame. */
export interface PrototypeSurface {
  /** Stable id, also the tab id. */
  id: string;
  /** Tab label. */
  label: string;
  /** Shorter label used when the chrome is narrow. */
  shortLabel?: string;
  /** Same-origin path under /public, e.g. /prototype/meridian/app.html. */
  src: string;
  /** Text for the address pill — a fiction of the product's own domain, since
   *  the prototype has no live host. */
  domain: string;
}

/** A playable prototype embedded in the case study — the alternative
 *  centerpiece to `video` for a `kind: "web"` study, used when the work IS a
 *  working artefact rather than a shipped site to record. */
export interface ProjectPrototype {
  /** Screenshot shown before the visitor launches the demo. */
  poster: string;
  /** Alt text for that screenshot. */
  alt?: string;
  /** Frame aspect (w/h) for the desktop viewport. Default 1.6. */
  aspect?: number;
  /** One line under the frame: how to actually use the demo. */
  hint?: string;
  surfaces: PrototypeSurface[];
}

/** A clickable Figma prototype for an app study. Present in frontmatter rather
 *  than the MDX body because it takes over the signature-showcase slot directly
 *  under the hero — the strongest position on the page — instead of waiting at
 *  the bottom of the read. */
export interface ProjectFigma {
  /** Figma embed URL (embed.figma.com/proto/…&embed-host=share). */
  embedUrl: string;
  /** Still of the prototype's FIRST screen — a bare screen render, no device
   *  art, since it sits inside a PhoneFrame while dormant. Also excluded from
   *  the flanking stills so nothing is shown twice. */
  poster: string;
  /** Alt text for that still. */
  alt?: string;
  /** CSS aspect-ratio string for the live frame. Default "390 / 844". */
  aspect?: string;
  /** Caption under the composition. */
  caption?: string;
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
  /** /work-specific framing line — a different angle from `summary`, so the
   *  index adds information the home cards don't already carry. Optional. */
  indexNote?: string;
  /** Case-hero decorative texture: blueprint | ledger | route | grid — so each
   *  study screenshots differently beyond its accent (recipes in globals.css). */
  motif?: "blueprint" | "ledger" | "route" | "grid";
  /** Hero image path (a phone cover for apps; the video poster for web). */
  cover: string;
  /** Medium. "app" (default) → portrait phone frames; "web" → landscape browser
   *  mockup driven by `video` (a shipped site) or `prototype` (a playable one). */
  kind?: "app" | "web";
  /** Looping site video shown in the browser mockup. A web project needs this
   *  OR `prototype`. */
  video?: ProjectVideo;
  /** A real, playable HTML prototype embedded in the browser mockup — the
   *  centerpiece when the deliverable is a working artefact, not a live site. */
  prototype?: ProjectPrototype;
  /** A clickable Figma prototype. When present it leads the signature-showcase
   *  slot under the hero, flanked by two key screens, instead of the static trio. */
  figma?: ProjectFigma;
  /** Live site URL — surfaced prominently for shipped/real work. */
  liveUrl?: string;
  /** Screens grouped by product flow — the source of truth for the gallery.
   *  Required for app projects; optional for web (the video carries the story). */
  flows?: ScreenFlow[];
  /** Flat list of every screen `src`, derived from `flows` in the content layer. */
  gallery: string[];
  /** Optional per-project accent hex — themes the case-study route. */
  accent?: string;
  /** Optional disclaimer shown on the case-study page (e.g. an unofficial
   *  concept redesign not affiliated with the named brand). */
  disclaimer?: string;
  /** Headline outcomes. */
  metrics?: Metric[];
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
