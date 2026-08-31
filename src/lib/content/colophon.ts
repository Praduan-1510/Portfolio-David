import fs from "node:fs";
import path from "node:path";

/*
 * Figures for /colophon, counted from the repo at build time.
 *
 * These were hard-coded for about ten minutes and were wrong by the end of the
 * same session, because adding two routes is exactly the kind of change nobody
 * remembers to mirror into a prose number. On a page whose whole argument is
 * that this site is built carefully, a stale count is not a typo — it is the
 * counter-argument.
 *
 * Runs at build time in a Server Component, so synchronous fs is fine.
 */

const ROOT = process.cwd();

function countFiles(dir: string, match: (name: string) => boolean): number {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      n += countFiles(path.join(dir, entry.name), match);
    } else if (match(entry.name)) {
      n += 1;
    }
  }
  return n;
}

export type ColophonNumber = { value: string; label: string };

export function getColophonNumbers(): ColophonNumber[] {
  const components = countFiles("src/components", (f) => f.endsWith(".tsx"));
  // One page.tsx == one route.
  const routes = countFiles("src/app", (f) => f === "page.tsx");
  const prototypes = countFiles("public/prototype", (f) => f.endsWith(".html"));
  const scripts = countFiles("scripts", (f) => /\.(mjs|js|py)$/.test(f));

  return [
    { value: String(components), label: "React components" },
    { value: String(routes), label: "routes" },
    { value: String(prototypes), label: "prototype HTML files, hand-built" },
    { value: String(scripts), label: "audit and QA scripts" },
  ];
}
