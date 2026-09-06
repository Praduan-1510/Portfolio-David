import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Project, ProjectMeta } from "@/types/project";

/*
 * Thin content layer (ARCHITECTURE.md §8). Case studies are MDX files in
 * src/content/work/. All filesystem access is isolated here so that swapping
 * to a CMS later means changing this file only: components keep the same
 * Project / ProjectMeta shapes. Runs at build time (Server Components +
 * generateStaticParams), so synchronous fs is fine.
 */

const WORK_DIR = path.join(process.cwd(), "src", "content", "work");

/**
 * Fail the build (not silently at runtime) when a case study's frontmatter is
 * missing required fields or has the wrong type. No dependency: a small guard
 * over the §8 schema is enough to catch authoring mistakes early.
 */
function assertProjectMeta(
  slug: string,
  data: Record<string, unknown>,
): asserts data is Omit<ProjectMeta, "slug"> {
  const required = [
    "title",
    "client",
    "role",
    "year",
    "services",
    "summary",
    "cover",
    "featured",
    "order",
  ] as const;

  for (const key of required) {
    if (data[key] === undefined || data[key] === null) {
      throw new Error(
        `[content] ${slug}.mdx: missing required frontmatter field "${key}"`,
      );
    }
  }
  if (typeof data.year !== "number")
    throw new Error(`[content] ${slug}.mdx: "year" must be a number`);
  if (typeof data.order !== "number")
    throw new Error(`[content] ${slug}.mdx: "order" must be a number`);
  if (typeof data.featured !== "boolean")
    throw new Error(`[content] ${slug}.mdx: "featured" must be a boolean`);
  if (!Array.isArray(data.services))
    throw new Error(`[content] ${slug}.mdx: "services" must be an array`);

  // Medium: "app" (default) tells the story in portrait phone flows; "web" tells
  // it through a landscape browser mockup driven by a video.
  const kind = (data.kind as string | undefined) ?? "app";
  if (kind !== "app" && kind !== "web")
    throw new Error(`[content] ${slug}.mdx: "kind" must be "app" or "web"`);

  if (kind === "web") {
    // A web study's centerpiece is either a recording of a shipped site
    // (`video`) or a playable prototype (`prototype`): one or the other.
    const v = data.video as Record<string, unknown> | undefined;
    const p = data.prototype as Record<string, unknown> | undefined;
    const hasVideo = !!v && typeof v.src === "string" && typeof v.poster === "string";
    if (!hasVideo && !p)
      throw new Error(
        `[content] ${slug}.mdx: web projects need a "video" with string "src" and "poster", or a "prototype"`,
      );
    if (v && !hasVideo)
      throw new Error(
        `[content] ${slug}.mdx: "video" needs string "src" and "poster"`,
      );
    if (p) assertPrototype(slug, p);
    if (data.liveUrl !== undefined && typeof data.liveUrl !== "string")
      throw new Error(`[content] ${slug}.mdx: "liveUrl" must be a string`);
  }

  // An app study may also ship a playable HTML prototype; it takes the
  // signature-showcase slot under the hero, as a Figma prototype does, and is
  // validated exactly like a web study's.
  if (kind === "app" && data.prototype !== undefined)
    assertPrototype(slug, data.prototype as Record<string, unknown>);

  // App projects require a non-empty `flows`. Any flows present (either kind) are
  // validated: each flow needs a title and a non-empty list of { src, caption }
  // screens. Authoring mistakes fail the build, not render blank.
  if (kind === "app" && (!Array.isArray(data.flows) || data.flows.length === 0))
    throw new Error(`[content] ${slug}.mdx: app projects need a non-empty "flows" array`);
  if (data.flows !== undefined) {
    if (!Array.isArray(data.flows))
      throw new Error(`[content] ${slug}.mdx: "flows" must be an array`);
    for (const [fi, flow] of (data.flows as unknown[]).entries()) {
      const f = flow as Record<string, unknown>;
      if (typeof f?.title !== "string" || !Array.isArray(f?.screens) || f.screens.length === 0)
        throw new Error(
          `[content] ${slug}.mdx: flows[${fi}] needs a "title" and a non-empty "screens" array`,
        );
      for (const [si, screen] of (f.screens as unknown[]).entries()) {
        const s = screen as Record<string, unknown>;
        if (typeof s?.src !== "string" || typeof s?.caption !== "string")
          throw new Error(
            `[content] ${slug}.mdx: flows[${fi}].screens[${si}] needs string "src" and "caption"`,
          );
      }
    }
  }
  // Optional Figma prototype: takes over the signature-showcase slot, so a
  // typo here would silently blank the strongest beat on the page.
  if (data.figma !== undefined) {
    const f = data.figma as Record<string, unknown>;
    if (typeof f?.embedUrl !== "string" || typeof f?.poster !== "string")
      throw new Error(
        `[content] ${slug}.mdx: "figma" needs string "embedUrl" and "poster"`,
      );
  }

  // Optional accent themes the route: if present it must be a usable hex.
  if (
    data.accent !== undefined &&
    (typeof data.accent !== "string" || !data.accent.startsWith("#"))
  )
    throw new Error(
      `[content] ${slug}.mdx: "accent" must be a hex string starting with "#"`,
    );
}

/** The playable-prototype block, shared by web and app studies. */
function assertPrototype(slug: string, p: Record<string, unknown>): void {
  if (typeof p.poster !== "string")
    throw new Error(`[content] ${slug}.mdx: "prototype.poster" must be a string`);
  // Optional, but it renders as a factual claim on the case-study hero, so a
  // wrong type here should fail the build rather than print quietly.
  if (p.launchNote !== undefined && typeof p.launchNote !== "string")
    throw new Error(`[content] ${slug}.mdx: "prototype.launchNote" must be a string`);
  if (
    p.devices !== undefined &&
    (!Array.isArray(p.devices) ||
      p.devices.some((d) => !["desktop", "tablet", "phone"].includes(String(d))))
  )
    throw new Error(
      `[content] ${slug}.mdx: "prototype.devices" may only list "desktop", "tablet" and "phone"`,
    );
  if (!Array.isArray(p.surfaces) || p.surfaces.length === 0)
    throw new Error(
      `[content] ${slug}.mdx: "prototype" needs a non-empty "surfaces" array`,
    );
  for (const [si, surface] of (p.surfaces as unknown[]).entries()) {
    const s = surface as Record<string, unknown>;
    if (
      typeof s?.id !== "string" ||
      typeof s?.label !== "string" ||
      typeof s?.src !== "string" ||
      typeof s?.domain !== "string"
    )
      throw new Error(
        `[content] ${slug}.mdx: prototype.surfaces[${si}] needs string "id", "label", "src" and "domain"`,
      );
  }
}

/** All case-study slugs (filenames without the .mdx extension). */
export function getProjectSlugs(): string[] {
  if (!fs.existsSync(WORK_DIR)) return [];
  return fs
    .readdirSync(WORK_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/** One case study (frontmatter + body), or null if the slug doesn't exist. */
export function getProjectBySlug(slug: string): Project | null {
  const fullPath = path.join(WORK_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  // Validate the §8 schema, then attach the slug (filename is the source of
  // truth) and derive the flat gallery list from the grouped flows.
  assertProjectMeta(slug, data);
  const gallery = (data.flows ?? []).flatMap((flow) => flow.screens.map((s) => s.src));
  const meta: ProjectMeta = { ...data, slug, gallery };
  return { meta, content };
}

/**
 * All case studies, sorted by `order` ascending, ties broken by slug.
 *
 * The slug tiebreaker is not cosmetic: two studies can be authored with the same
 * `order` (nothing in the schema forbids it), and without it the tie falls
 * through to `fs.readdirSync` order: so which project leads the work index, and
 * which one falls off the end of the home grid, would be decided by the
 * filesystem and could differ between machines or builds.
 */
export function getAllProjects(): Project[] {
  return getProjectSlugs()
    .map(getProjectBySlug)
    .filter((project): project is Project => project !== null)
    .sort((a, b) => a.meta.order - b.meta.order || a.meta.slug.localeCompare(b.meta.slug));
}

/** Just the frontmatter for every project, for index/listing views. */
export function getAllProjectsMeta(): ProjectMeta[] {
  return getAllProjects().map((project) => project.meta);
}

/** Featured projects only, sorted by `order`, for the home teaser. */
export function getFeaturedProjectsMeta(): ProjectMeta[] {
  return getAllProjectsMeta().filter((meta) => meta.featured);
}
