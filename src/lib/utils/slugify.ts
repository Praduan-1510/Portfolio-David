/**
 * Slug from heading text — shared by the MDX heading renderer (which sets the id)
 * and the case-study contents rail (which extracts the same ids from the raw MDX),
 * so the two always agree. Strips markdown punctuation, lowercases, dashes spaces.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // drop punctuation / markdown (*, ", etc.)
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
