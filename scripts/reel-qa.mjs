/*
 * QA harness for the home cinematic reel (CinematicReel.tsx) — screenshots the
 * scrubbed stage at fixed scroll-progress points (desktop/mobile/short-land),
 * checks a reversal pass (rows scrub back out, flutter must not re-fire), and
 * captures the reduced-motion static fallback. Run against `next dev` on :3000.
 *
 *   node scripts/reel-qa.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/reel-shots";
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function scrollToProgress(page, p) {
  await page.evaluate((p) => {
    const el = document.getElementById("currently");
    // Mirror the ScrollTrigger config: start "top 64px", end "bottom bottom".
    // (getBoundingClientRect, not offsetTop — the section may sit in a
    // positioned wrapper.)
    const top = el.getBoundingClientRect().top + window.scrollY;
    const startY = top - 64;
    const endY = top + el.offsetHeight - window.innerHeight;
    window.scrollTo(0, Math.max(0, startY + p * (endY - startY)));
  }, p);
  await sleep(700); // Lenis lerp + scrub settle + flutter
}

async function run(name, viewport, progressPoints, { reduced = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  if (reduced) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  await sleep(reduced ? 600 : 1500);

  for (const p of progressPoints) {
    await scrollToProgress(page, p);
    await page.screenshot({ path: `${OUT}/${name}-p${String(p).replace(".", "")}.png` });
  }

  // Reversal check: jump forward past all rows, then back to 0.35 — rows 3/4
  // containers must scrub back out while row 1/2 text stays settled (no re-flutter).
  if (!reduced) {
    await scrollToProgress(page, 0.85);
    await scrollToProgress(page, 0.35);
    await page.screenshot({ path: `${OUT}/${name}-reverse-p035.png` });
  }

  const state = await page.evaluate(() => {
    const el = document.getElementById("currently");
    const canvas = el.querySelector("canvas");
    const dl = el.querySelector("dl");
    const stage = el.querySelector(":scope > div");
    const cRect = canvas ? canvas.getBoundingClientRect() : null;
    return {
      trackH: el.offsetHeight,
      canvasOpacity: canvas ? getComputedStyle(canvas).opacity : null,
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : null,
      dlOpacity: dl ? getComputedStyle(dl).opacity : null,
      counter: el.querySelector("span[aria-hidden]")?.textContent ?? null,
      stageW: stage ? stage.clientWidth : null,
      canvasCssW: cRect ? Math.round(cRect.width) : null,
      canvasLeft: cRect ? Math.round(cRect.left) : null,
    };
  });
  console.log(name, JSON.stringify(state), errors.length ? `PAGE ERRORS: ${errors.join(" | ")}` : "no page errors");

  // Split geometry check: at lg+ the film canvas must occupy the right half of
  // the sticky stage (±2px for the seam border); below lg it must stay
  // full-bleed. Reduced motion hides the canvas entirely — skip.
  if (!reduced && state.stageW && state.canvasCssW != null) {
    const half = viewport.width >= 1024;
    const wantW = half ? state.stageW / 2 : state.stageW;
    const okW = Math.abs(state.canvasCssW - wantW) <= 2;
    const okL = half
      ? Math.abs(state.canvasLeft - state.stageW / 2) <= 2
      : state.canvasLeft <= 2;
    console.log(
      `${name} split-check: ${okW && okL ? "OK" : "FAIL"} (canvas ${state.canvasCssW}px @x=${state.canvasLeft}, stage ${state.stageW}px, expected ${half ? "right half" : "full-bleed"})`,
    );
  }
  await page.close();
}

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const TABLET = { width: 1024, height: 768, deviceScaleFactor: 1 };
const ULTRAWIDE = { width: 1920, height: 1080, deviceScaleFactor: 1 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const SHORTLAND = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

await run("desktop", DESKTOP, [0, 0.05, 0.2, 0.35, 0.55, 0.75, 0.95]);
await run("tablet", TABLET, [0, 0.35, 0.75]);
await run("ultrawide", ULTRAWIDE, [0, 0.5, 0.95]);
await run("mobile", MOBILE, [0.5, 0.8]);
await run("shortland", SHORTLAND, [0.6]);
await run("reduced", DESKTOP, [0.5], { reduced: true });

await browser.close();
console.log("done →", OUT);
