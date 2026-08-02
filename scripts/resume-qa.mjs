/*
 * Résumé QA — captures /resume at three viewports (reduced-motion, full page),
 * a live desktop hero shot, and — the point of this route — the actual PRINT
 * output, both as a screenshot with print media emulated and as a real PDF
 * rendered through the @media print block in globals.css.
 *
 * Run against `next dev` on :3000 (see the QA memo: a prod build's static assets
 * get wiped by a respawning dev server, so `next start` is not a valid target).
 *   node scripts/resume-qa.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/resume-qa";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const problems = [];

async function cap(name, path, vp, { reduced = true, full = true, wait = 700 } = {}) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(`[console] ${m.text()}`);
  });
  page.on("pageerror", (e) => pageErrors.push(`[pageerror] ${e.message}`));
  await page.setViewport(vp);
  if (reduced) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(wait);
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    return de.scrollWidth - de.clientWidth;
  });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  if (pageErrors.length) problems.push({ name, errors: pageErrors });
  if (overflow > 1) problems.push({ name, errors: [`H-OVERFLOW ${overflow}px`] });
  await page.close();
  console.log(name, "done", `overflow=${overflow}px`);
}

const D = { width: 1440, height: 900, deviceScaleFactor: 1 };
const T = { width: 768, height: 1024, deviceScaleFactor: 1 };
const M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

await cap("resume-d", "/resume", D);
await cap("resume-t", "/resume", T);
await cap("resume-m", "/resume", M);
await cap("resume-hero-live", "/resume", D, { reduced: false, full: false, wait: 2200 });
// Nav gained a 4th item — re-check the routes whose chrome it shares.
await cap("about-d", "/about", D, { full: false });
await cap("home-m", "/", M, { full: false });

// ---- Print path ------------------------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport(D);
  await page.goto(`${BASE}/resume`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(800);
  await page.emulateMediaType("print");
  await sleep(200);
  await page.screenshot({ path: `${OUT}/resume-print-screen.png`, fullPage: true });
  await page.pdf({
    path: `${OUT}/resume-print.pdf`,
    format: "a4",
    printBackground: false,
  });
  // Sanity: the site chrome must be gone on paper.
  const printState = await page.evaluate(() => {
    const vis = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return "absent";
      return getComputedStyle(el).display === "none" ? "hidden" : "VISIBLE";
    };
    return {
      nav: vis("body > header"),
      footer: vis("body > footer"),
      actions: vis("[data-noprint]"),
      bodyColor: getComputedStyle(document.body).color,
      fg: getComputedStyle(document.documentElement).getPropertyValue("--fg").trim(),
    };
  });
  console.log("print state:", printState);
  if (printState.nav === "VISIBLE" || printState.footer === "VISIBLE" || printState.actions === "VISIBLE") {
    problems.push({ name: "print", errors: [`chrome not hidden: ${JSON.stringify(printState)}`] });
  }
  await page.close();
}

await browser.close();
console.log("\n=== PROBLEMS ===");
console.log(problems.length ? JSON.stringify(problems, null, 2) : "NONE");
console.log(`shots + pdf in ${OUT}`);
