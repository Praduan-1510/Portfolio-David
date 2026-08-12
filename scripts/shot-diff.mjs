/*
 * Pixel diff between two screenshot directories.
 *
 * The repaint needs a real answer to "did this commit change anything on
 * screen?", and PNG byte size is not one: a flat gradient re-dithers on a
 * sub-perceptual value change and the file can move several percent while the
 * page looks identical. This decodes both PNGs and compares actual pixels.
 *
 *   node scripts/shot-diff.mjs /tmp/audit-before /tmp/audit
 *   node scripts/shot-diff.mjs /tmp/audit-before /tmp/audit --threshold 2
 *
 * --threshold is the per-channel delta (0-255) below which a pixel counts as
 * unchanged; 2 absorbs PNG quantisation without hiding a real shift.
 *
 * Reports, per image: the share of pixels that moved, the worst single-channel
 * delta, and the mean delta over the pixels that did move. A commit that is
 * meant to be a no-op should read ~0% moved, or a small share at maxDelta <= 3
 * where an intentionally-restated colour lands a rounding step away.
 *
 * ALWAYS RUN A CONTROL BEFORE BELIEVING A RESULT. Parts of this site are not
 * deterministic between runs, so a diff against a baseline is only meaningful
 * next to a diff of identical code against itself:
 *
 *   cp -r /tmp/audit /tmp/audit-ctl && node scripts/audit-shots.mjs
 *   node scripts/shot-diff.mjs /tmp/audit-ctl /tmp/audit
 *
 * Measured noise floor with NO code change (2026-08-12):
 *   home-d 18.8% moved / home-m 8.6% / home-hero-live 4.1%
 *     AnimatedNoise builds a fresh Math.random() tile on every mount and
 *     composites it over the whole page, so most pixels move by ~4. Home is
 *     the only route carrying it (via HomeAtmosphere).
 *   about-d maxDelta 234 at 0.001% moved, case2-d maxDelta 100 at 0.13%
 *     the live IST clock digits and split-flap glyph state: a tiny area
 *     swinging the full range.
 * So on home, judge meanMoved and the SHARE against the control, never the
 * raw number. Outside home, anything above ~0.02% moved is real.
 *
 * No image dependency: the decode happens in a blank Chrome page via
 * createImageBitmap + getImageData, the same trick reel-mobile-contrast.mjs uses.
 */
import puppeteer from "puppeteer-core";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [dirA, dirB] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const tIdx = process.argv.indexOf("--threshold");
const THRESHOLD = tIdx > -1 ? Number(process.argv[tIdx + 1]) : 2;

if (!dirA || !dirB) {
  console.error("usage: node scripts/shot-diff.mjs <beforeDir> <afterDir> [--threshold N]");
  process.exit(1);
}
for (const d of [dirA, dirB]) {
  if (!existsSync(d)) {
    console.error(`missing directory: ${d}`);
    process.exit(1);
  }
}

const names = readdirSync(dirA)
  .filter((f) => f.endsWith(".png"))
  .filter((f) => existsSync(join(dirB, f)))
  .sort();

if (names.length === 0) {
  console.error("no PNGs present in both directories");
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.goto("about:blank");

const asDataUri = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

const results = [];
for (const name of names) {
  const res = await page.evaluate(
    async (aUri, bUri, threshold) => {
      const decode = async (uri) => {
        const blob = await (await fetch(uri)).blob();
        const bmp = await createImageBitmap(blob);
        const c = new OffscreenCanvas(bmp.width, bmp.height);
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bmp, 0, 0);
        return { data: ctx.getImageData(0, 0, bmp.width, bmp.height).data, w: bmp.width, h: bmp.height };
      };
      const a = await decode(aUri);
      const b = await decode(bUri);
      if (a.w !== b.w || a.h !== b.h) {
        return { sizeMismatch: true, a: `${a.w}x${a.h}`, b: `${b.w}x${b.h}` };
      }
      let moved = 0;
      let maxDelta = 0;
      let sumDelta = 0;
      const total = a.w * a.h;
      for (let i = 0; i < a.data.length; i += 4) {
        const d = Math.max(
          Math.abs(a.data[i] - b.data[i]),
          Math.abs(a.data[i + 1] - b.data[i + 1]),
          Math.abs(a.data[i + 2] - b.data[i + 2]),
        );
        if (d > maxDelta) maxDelta = d;
        if (d > threshold) {
          moved++;
          sumDelta += d;
        }
      }
      return { total, moved, maxDelta, meanMovedDelta: moved ? sumDelta / moved : 0, w: a.w, h: a.h };
    },
    asDataUri(join(dirA, name)),
    asDataUri(join(dirB, name)),
    THRESHOLD,
  );
  results.push({ name, ...res });
}

await browser.close();

console.log(`\nthreshold: per-channel delta > ${THRESHOLD} counts as moved\n`);
console.log(`${"image".padEnd(20)} ${"moved".padStart(9)} ${"maxDelta".padStart(9)} ${"meanMoved".padStart(10)}`);
console.log("-".repeat(52));

let worstShare = 0;
let worstMax = 0;
for (const r of results) {
  if (r.sizeMismatch) {
    console.log(`${r.name.padEnd(20)}   SIZE MISMATCH ${r.a} vs ${r.b}`);
    worstShare = 100;
    continue;
  }
  const share = (r.moved / r.total) * 100;
  worstShare = Math.max(worstShare, share);
  worstMax = Math.max(worstMax, r.maxDelta);
  console.log(
    `${r.name.padEnd(20)} ${share.toFixed(3).padStart(8)}% ${String(r.maxDelta).padStart(9)} ${r.meanMovedDelta.toFixed(1).padStart(10)}`,
  );
}

console.log("-".repeat(52));
console.log(`worst moved share: ${worstShare.toFixed(3)}%   worst channel delta: ${worstMax}`);
if (worstShare < 0.5 && worstMax <= 6) {
  console.log("\nVERDICT: visually unchanged (within quantisation + noise).\n");
} else if (worstShare < 5) {
  console.log("\nVERDICT: localised change. Inspect the named images.\n");
} else {
  console.log("\nVERDICT: broad change. This commit repainted something.\n");
}
