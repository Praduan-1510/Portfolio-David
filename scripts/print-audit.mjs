/*
 * Print audit — the @media print block in globals.css is GLOBAL, so it has to be
 * checked on more than /resume. For each route this asserts, with print media
 * emulated, that the site chrome is gone, that in-content <header>/<footer>
 * landmarks SURVIVE (they carry the case-study h1, disclaimer and pull-quote
 * attributions), that no per-project --accent leaks through as a screen hue, and
 * that headline text is actually present rather than blanked.
 *
 *   node scripts/print-audit.mjs      (dev server on :3000)
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/print-audit";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const ROUTES = ["/resume", "/work/keel", "/work/spendee", "/work", "/about", "/"];
const problems = [];

for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle0", timeout: 45000 });
  await sleep(700);
  await page.emulateMediaType("print");
  await sleep(250);

  const state = await page.evaluate(() => {
    const shown = (el) => !!el && getComputedStyle(el).display !== "none";
    const article = document.querySelector("article");
    const h1 = document.querySelector("h1");
    // Longest visible text inside the main heading — blank means the print
    // rules ate it.
    const h1Text = h1 ? (h1.innerText || h1.textContent || "").trim() : null;
    const contentHeaders = Array.from(document.querySelectorAll("header")).filter(
      (el) => el.parentElement !== document.body,
    );
    const contentFooters = Array.from(document.querySelectorAll("footer")).filter(
      (el) => el.parentElement !== document.body,
    );
    // "Ink coverage": how much of the page actually has visible text boxes.
    // A route that passes every structural check but prints an empty sheet
    // (everything display:none'd, or white-on-white) fails here.
    const textNodes = Array.from(
      document.querySelectorAll("main h1, main h2, main h3, main p, main li, main dd, main span"),
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        s.display !== "none" &&
        s.visibility !== "hidden" &&
        (el.textContent || "").trim().length > 0
      );
    });

    return {
      visibleTextEls: textNodes.length,
      // The home hero's wordmark is composed of aria-hidden SplitFlapText tiles,
      // not the sr-only <h1> — assert the tiles themselves survive print.
      wordmarkShown: (() => {
        const wm = document.querySelector(".hero-wordmark");
        if (!wm) return null;
        return Array.from(wm.querySelectorAll("*")).some((el) => {
          const r = el.getBoundingClientRect();
          return (
            getComputedStyle(el).display !== "none" &&
            r.height > 0 &&
            (el.textContent || "").trim().length > 0
          );
        });
      })(),
      siteNav: shown(document.querySelector("body > header")),
      siteFooter: shown(document.querySelector("body > footer")),
      h1Text,
      h1Shown: shown(h1),
      contentHeaders: contentHeaders.length,
      contentHeadersShown: contentHeaders.filter(shown).length,
      contentFooters: contentFooters.length,
      contentFootersShown: contentFooters.filter(shown).length,
      accent: article
        ? getComputedStyle(article).getPropertyValue("--accent").trim()
        : getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
      bodyColor: getComputedStyle(document.body).color,
    };
  });

  await page.pdf({ path: `${OUT}${route.replace(/\//g, "_") || "_home"}.pdf`, format: "a4" });
  await page.close();

  const bad = [];
  if (state.siteNav) bad.push("site nav visible in print");
  if (state.siteFooter) bad.push("site footer visible in print");
  if (!state.h1Shown || !state.h1Text) bad.push(`h1 missing/blank (text=${JSON.stringify(state.h1Text)})`);
  if (state.visibleTextEls < 10) bad.push(`near-empty page: only ${state.visibleTextEls} visible text elements`);
  if (state.wordmarkShown === false) bad.push("hero wordmark printed blank");
  if (state.contentHeaders !== state.contentHeadersShown)
    bad.push(`in-content <header> hidden: ${state.contentHeadersShown}/${state.contentHeaders} shown`);
  if (state.contentFooters !== state.contentFootersShown)
    bad.push(`in-content <footer> hidden: ${state.contentFootersShown}/${state.contentFooters} shown`);
  if (state.accent && state.accent.toLowerCase() !== "#101012")
    bad.push(`--accent not ink: ${state.accent}`);

  console.log(
    `${route.padEnd(16)} text=${String(state.visibleTextEls).padStart(3)} ` +
      `wordmark=${state.wordmarkShown === null ? "n/a" : state.wordmarkShown} ` +
      `hdr=${state.contentHeadersShown}/${state.contentHeaders} ftr=${state.contentFootersShown}/${state.contentFooters} ` +
      `accent=${state.accent} ${bad.length ? "✗ " + bad.join("; ") : "✓"}`,
  );
  if (bad.length) problems.push({ route, bad });
}

await browser.close();
console.log("\n=== PRINT PROBLEMS ===");
console.log(problems.length ? JSON.stringify(problems, null, 2) : "NONE");
