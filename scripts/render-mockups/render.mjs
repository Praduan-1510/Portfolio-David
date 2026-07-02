import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { MANIFEST } from "./manifest.mjs";

/*
 * Renders every coded mockup screen (scripts/render-mockups/<app>/<name>.html)
 * at its exact device dimensions, DPR 2, transparent background — overwriting
 * the PNG under public/images/work/<app>/<name>.png that the site consumes.
 *
 *   node scripts/render-mockups/render.mjs                    render everything
 *   node scripts/render-mockups/render.mjs --only spendee/dashboard [more…]
 *   node scripts/render-mockups/render.mjs --diff              also save the old
 *        PNG next to the new one in the scratch dir for side-by-side review
 *
 * After rendering, clear .next/cache/images so next/image doesn't serve stale
 * optimized copies (done automatically here), and re-run
 * scripts/generate-blur-map.mjs so placeholders match the new art.
 */

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ROOT = resolve(import.meta.dirname, "../..");
const SRC = resolve(import.meta.dirname);
const DIFF_DIR = "/private/tmp/claude-501/-Users-praduansaha-Downloads-David-portfolio/4b6f126f-366f-4fb3-968b-56f69971bd90/scratchpad/mockup-diff";

const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv.slice(onlyIdx + 1).filter((a) => !a.startsWith("--")) : null;
const diff = process.argv.includes("--diff");

const targets = MANIFEST.filter((m) => {
  if (only && !only.includes(`${m.app}/${m.name}`)) return false;
  return existsSync(join(SRC, m.app, `${m.name}.html`));
});

if (targets.length === 0) {
  console.error("No targets with HTML sources found.");
  process.exit(1);
}

if (diff) mkdirSync(DIFF_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
});

for (const m of targets) {
  const html = join(SRC, m.app, `${m.name}.html`);
  const out = join(ROOT, "public/images/work", m.app, `${m.name}.png`);
  if (diff && existsSync(out)) {
    copyFileSync(out, join(DIFF_DIR, `${m.app}-${m.name}-OLD.png`));
  }
  const page = await browser.newPage();
  await page.setViewport({ width: m.w, height: m.h, deviceScaleFactor: 2 });
  await page.goto(`file://${html}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: out, omitBackground: true });
  if (diff) copyFileSync(out, join(DIFF_DIR, `${m.app}-${m.name}-NEW.png`));
  await page.close();
  console.log(`rendered ${m.app}/${m.name} → ${m.w}x${m.h}@2x`);
}

await browser.close();

// Stale image-optimizer entries would keep serving the old art in dev.
rmSync(join(ROOT, ".next/cache/images"), { recursive: true, force: true });
console.log(`\n${targets.length} screen(s) rendered. .next/cache/images cleared.`);
console.log("Re-run scripts/generate-blur-map.mjs to refresh placeholders.");
