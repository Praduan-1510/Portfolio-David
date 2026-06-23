// Focused hero-fold capture for the option-B cinematic restyle review.
// Usage: node scripts/hero-shot.mjs <prefix>   (e.g. "before" / "after")
// Captures the home hero fold at desktop + mobile, reduced-motion ON (settled,
// clean for judging) and OFF (the live animated/gradient state). QA against the
// running `next dev` on :3000 (see memory: QA against dev, not next start).
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/hero-restyle";
const PREFIX = process.argv[2] || "shot";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function cap(name, vp, { reduced, wait }) {
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errs.push(`[console] ${m.text()}`));
  await page.setViewport(vp);
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(wait);
  await page.screenshot({ path: `${OUT}/${PREFIX}-${name}.png`, fullPage: false });
  await page.close();
  console.log(`${PREFIX}-${name}`, "done", errs.length ? `ERRORS: ${errs.join(" | ")}` : "");
}

const D = { width: 1440, height: 900, deviceScaleFactor: 1 };
const M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// reduced ON = fully settled (judge gradient/scrim/chrome); reduced OFF = live entrance settled after a longer wait
await cap("desktop-settled", D, { reduced: true, wait: 800 });
await cap("desktop-live", D, { reduced: false, wait: 2600 });
await cap("mobile-settled", M, { reduced: true, wait: 800 });

await browser.close();
console.log("ALL DONE ->", OUT);
