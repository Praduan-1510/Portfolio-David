/*
 * Résumé mobile QA: full-page stitching is unreliable on this site (Lenis
 * drives scroll), so capture discrete viewport frames instead and report the
 * real document height.
 *   node scripts/resume-mobile.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/tmp/resume-qa";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await page.goto("http://localhost:3000/resume", { waitUntil: "networkidle0", timeout: 30000 });
await sleep(900);

const h = await page.evaluate(() => document.documentElement.scrollHeight);
console.log("document height:", h, "→", Math.ceil(h / 844), "frames");

for (let i = 0, y = 0; y < h; i++, y += 844) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await sleep(350);
  await page.screenshot({ path: `${OUT}/m-${String(i).padStart(2, "0")}.png` });
}

await browser.close();
console.log("frames in", OUT);
