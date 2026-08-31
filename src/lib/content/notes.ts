import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Note, NoteMeta } from "@/types/note";

/*
 * Notes content layer, mirroring src/lib/content/work.ts: all filesystem access
 * lives here, validation throws at BUILD time rather than failing silently at
 * runtime, and components only ever see Note / NoteMeta shapes.
 *
 * Draft handling is the one thing this does that work.ts does not. A note with
 * `draft: true` renders under `next dev` (so it can be reviewed on the real
 * page, in the real type) but is excluded from production entirely: not
 * prerendered, not in the index, not in the sitemap. That makes "written but
 * not yet approved" a state the repo can hold, instead of a promise to
 * remember to delete something before shipping.
 */

const NOTES_DIR = path.join(process.cwd(), "src", "content", "notes");

/** Drafts are visible in development only. */
const SHOW_DRAFTS = process.env.NODE_ENV === "development";

function assertNoteMeta(
  slug: string,
  data: Record<string, unknown>,
): asserts data is Omit<NoteMeta, "slug"> {
  for (const key of ["title", "summary", "date"] as const) {
    if (data[key] === undefined || data[key] === null) {
      throw new Error(
        `[content] notes/${slug}.mdx: missing required frontmatter field "${key}"`,
      );
    }
    if (typeof data[key] !== "string") {
      throw new Error(`[content] notes/${slug}.mdx: "${key}" must be a string`);
    }
  }
  // Sorting is a plain string compare, which is only correct for zero-padded
  // ISO dates. Check the shape rather than trusting the author to remember.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date as string)) {
    throw new Error(
      `[content] notes/${slug}.mdx: "date" must be ISO YYYY-MM-DD, got "${data.date}"`,
    );
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    throw new Error(`[content] notes/${slug}.mdx: "tags" must be an array`);
  }
  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    throw new Error(`[content] notes/${slug}.mdx: "draft" must be a boolean`);
  }
  if (data.related !== undefined && typeof data.related !== "string") {
    throw new Error(`[content] notes/${slug}.mdx: "related" must be a string`);
  }
}

function readNote(slug: string): Note | null {
  const file = path.join(NOTES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  assertNoteMeta(slug, data);
  return { meta: { ...(data as Omit<NoteMeta, "slug">), slug }, content };
}

/** Every note file on disk, drafts included. Internal: callers get the filtered views. */
function allNotes(): Note[] {
  if (!fs.existsSync(NOTES_DIR)) return [];
  return fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => readNote(f.replace(/\.mdx$/, "")))
    .filter((n): n is Note => n !== null)
    .filter((n) => SHOW_DRAFTS || !n.meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.meta.slug.localeCompare(b.meta.slug));
}

/** Slugs to prerender. Drafts are excluded from production builds. */
export function getNoteSlugs(): string[] {
  return allNotes().map((n) => n.meta.slug);
}

/** Frontmatter only, newest first, for the index. */
export function getAllNotesMeta(): NoteMeta[] {
  return allNotes().map((n) => n.meta);
}

/**
 * One note. Returns null for a draft in production so a direct URL 404s rather
 * than serving unapproved writing to anyone who guesses the slug.
 */
export function getNoteBySlug(slug: string): Note | null {
  const note = readNote(slug);
  if (!note) return null;
  if (note.meta.draft && !SHOW_DRAFTS) return null;
  return note;
}

/** True when anything is publishable: gates the nav link and the sitemap. */
export function hasPublishedNotes(): boolean {
  return getAllNotesMeta().some((n) => !n.draft);
}
