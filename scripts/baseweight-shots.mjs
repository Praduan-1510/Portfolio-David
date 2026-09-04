// Captures stills of the Baseweight prototype for the case study.
// Usage: node scripts/baseweight-shots.mjs      (needs `next dev` on :3000)
//
// Four things about this prototype make it different from the others here, and
// each one is a bug if ignored:
//
// 1. STATE LEAKS BETWEEN SHOTS. Baseweight persists to localStorage under
//    bw-state-v1 / bw-core-v1. Opening #/k/<id> writes state.activeKit, and
//    submitting on #/weight moves the published median. The other shot scripts
//    reuse one browser and so share one origin's storage; this one opens a
//    FRESH BROWSER CONTEXT per shot so no still can contaminate the next.
//
// 2. networkidle0 PROVES NOTHING. The 71 photographs are base64 data URIs
//    assigned by the last script in the document, and carry loading="lazy". We
//    wait on document.fonts plus decode() of the images actually in view.
//
// 3. ROUTES THAT MOVE UNDER YOU. #/gear and #/pdp are aliases that
//    location.replace() themselves, and #/checkout redirects to #/cart when the
//    cart is empty. Never aim a shot at those: use the resolved route.
//
// 4. show() SCROLLS TO TOP ON EVERY ROUTE. Any scrollIntoView has to happen
//    after the hashchange has settled, never before.
//
// Landing is asserted on .screen.is-active dataset.screen, which is this file's
// convention (OmniStock used data-active="true"). A shot that lands on the wrong
// screen fails loudly rather than quietly capturing the wrong thing.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000/prototype/baseweight/baseweight-app.html";
const OUT = "public/images/work/baseweight";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const errs = [];

/**
 * @param route   hash route, e.g. "#/kit"
 * @param name    output basename
 * @param opts    { w, h, screen, scrollTo, assert }
 *                screen   - expected .screen.is-active dataset.screen
 *                scrollTo - selector brought into view AFTER the route settles
 *                assert   - extra in-page predicate; must return true
 */
async function shoot(route, name, opts = {}) {
  const { w = 1280, h = 800, screen, scrollTo, assert } = opts;
  // Fresh context: its own localStorage, so shots cannot contaminate each other.
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errs.push(`${name}: ${m.text()}`));
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
    // The prototype's dark theme is OS-driven and unpinned; the documented
    // contrast figures are for light, so every still is shot light.
    { name: "prefers-color-scheme", value: "light" },
  ]);

  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
  await sleep(2500);

  if (screen) {
    const landed = await page.evaluate(
      () => document.querySelector(".screen.is-active")?.dataset.screen ?? null,
    );
    if (landed !== screen) {
      errs.push(`${name}: expected screen "${screen}", landed on "${landed}"`);
      console.log(`✗ ${name} — landed on ${landed}, wanted ${screen}`);
      await ctx.close();
      return;
    }
  }
  if (scrollTo) {
    // After the route, never before: show() resets scroll on every navigation.
    const ok = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.scrollIntoView({ block: "center" });
      return true;
    }, scrollTo);
    if (!ok) {
      errs.push(`${name}: scroll target ${scrollTo} not found`);
      console.log(`✗ ${name} — no ${scrollTo}`);
      await ctx.close();
      return;
    }
    await sleep(700);
  }
  if (assert) {
    const ok = await page.evaluate(assert);
    if (!ok) {
      errs.push(`${name}: assertion failed`);
      console.log(`✗ ${name} — assertion failed`);
      await ctx.close();
      return;
    }
  }

  // Fonts, then decode every image currently in the viewport. Lazy offscreen
  // ones stay blank on purpose: they are not in the frame.
  await page.evaluate(async () => {
    await document.fonts.ready;
    const vh = innerHeight;
    await Promise.all(
      [...document.images]
        .filter((i) => {
          const r = i.getBoundingClientRect();
          return r.bottom > 0 && r.top < vh;
        })
        .map((i) => i.decode().catch(() => {})),
    );
  });
  await sleep(400);

  await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(`✓ ${name} ${w}x${h}  ${route}`);
  await ctx.close();
}

// ── The storefront ─────────────────────────────────────────────────────────
// Cover at BrowserMockup's 64/35 well so ProjectCover crops nothing.
await shoot("#/", "cover", { w: 1280, h: 700, screen: "/" });
await shoot("#/", "home", { screen: "/" });

// ── The argument: a defined headline number ────────────────────────────────
await shoot("#/kit", "app-kit", { screen: "/kit" });
await shoot("#/plan-kit", "plan-kit", { w: 1280, h: 900 });

// ── The argument: both figures kept when they disagree ─────────────────────
// Resolved route, never the #/pdp alias, which location.replace()s itself.
await shoot("#/p/x-mid", "pdp-recon", { screen: "/pdp" });
await shoot("#/weight", "weight-record", {});

// ── The operator's half: the rule is enforced, not asserted ────────────────
await shoot("#/admin/product", "publish-gate", { scrollTo: ".bo-gate" });
await shoot("#/admin/promotion", "promotion-absences", {});
await shoot("#/index", "every-screen", {});

await browser.close();
if (errs.length) {
  console.log("\nPROBLEMS:\n" + [...new Set(errs)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nALL DONE ->", OUT);
}
