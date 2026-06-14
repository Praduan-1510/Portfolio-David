import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Project, ProjectMeta } from "@/types/project";

/*
 * Thin content layer (ARCHITECTURE.md §8). Case studies are MDX files in
 * src/content/work/. All filesystem access is isolated here so that swapping
 * to a CMS later means changing this file only — components keep the same
 * Project / ProjectMeta shapes. Runs at build time (Server Components +
 * generateStaticParams), so synchronous fs is fine.
 */

const WORK_DIR = path.join(process.cwd(), "src", "content", "work");

/**
 * Fail the build (not silently at runtime) when a case study's frontmatter is
 * missing required fields or has the wrong type. No dependency — a small guard
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
    "flows",
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

  // Validate the grouped screen flows: each flow needs a title and a non-empty
  // list of { src, caption } screens. Authoring mistakes fail the build, not
  // render blank.
  if (!Array.isArray(data.flows) || data.flows.length === 0)
    throw new Error(`[content] ${slug}.mdx: "flows" must be a non-empty array`);
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
  // Optional accent themes the route — if present it must be a usable hex.
  if (
    data.accent !== undefined &&
    (typeof data.accent !== "string" || !data.accent.startsWith("#"))
  )
    throw new Error(
      `[content] ${slug}.mdx: "accent" must be a hex string starting with "#"`,
    );
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
  const gallery = data.flows.flatMap((flow) => flow.screens.map((s) => s.src));
  const meta: ProjectMeta = { ...data, slug, gallery };
  return { meta, content };
}

/** All case studies, sorted by `order` ascending. */
export function getAllProjects(): Project[] {
  return getProjectSlugs()
    .map(getProjectBySlug)
    .filter((project): project is Project => project !== null)
    .sort((a, b) => a.meta.order - b.meta.order);
}

/** Just the frontmatter for every project — for index/listing views. */
export function getAllProjectsMeta(): ProjectMeta[] {
  return getAllProjects().map((project) => project.meta);
}

/** Featured projects only, sorted by `order` — for the home teaser. */
export function getFeaturedProjectsMeta(): ProjectMeta[] {
  return getAllProjectsMeta().filter((meta) => meta.featured);
}
