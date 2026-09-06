// Captures stills of the Nukkad prototype for the case study.
// Usage: node scripts/nukkad-shots.mjs      (needs `next dev` on :3000)
//
// Nukkad is a phone app, so the study is an "app" kind: bare 2x screen captures
// that the house PhoneFrame wraps (it supplies the bezel and the notch), the
// same convention as the Spendee and Voyager galleries. The prototype's own
// embed.html draws a device at its real 402x874 size and takes deep-link
// parameters for every route, so each still is a real state of the running app
// rather than a composed mock:
//   ?screen=cart&seed=1   a signed-in account with a basket, on the bill
//   ?screen=track&seed=1  an order placed and the rider on the way
//   &theme=dark &lang=hi &glass=off   the three appearance switches
//
// Three things the capture does to the embed, all cosmetic:
//   - the device's own pill cut-out is hidden (the house frame draws the notch,
//     and two islands stacked read as a rendering bug);
//   - the 54px corner radius and the bezel shadow are removed so the capture is
//     a clean rectangle the frame can crop with its own corners;
//   - the status bar stays: it is part of the screen the prototype designed.
//
// Every shot runs in a FRESH browser context. The app persists its state
// (cart, theme, language, orders) in localStorage, so a dark-mode shot would
// otherwise leak into the next one.
//
// Two landscape captures at 1280x800 use index.html (the desktop stage with the
// demo panel beside the phone) and design.html (the living design system); they
// are browser stills for <Shot> blocks in the body.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000/prototype/nukkad/prototype";
const OUT = "public/images/work/nukkad";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  protocolTimeout: 60000,
});

const errs = [];

// The device is 402x874; at this viewport the embed's fit() lands on scale 1
// (32px padding each side), so the capture is pixel-exact at 2x = 804x1748.
const PHONE_VIEWPORT = { width: 466, height: 938 };

const PHONE_CSS = `
  .embed .device { border-radius: 0 !important; box-shadow: none !important; }
  .embed .device::after { display: none !important; }
`;

/*
 * "In the picture" means inside the capture rectangle on BOTH axes. The shelf
 * carousels scroll horizontally, so their lazy packshots sit hundreds of pixels
 * off to the right: they never load, they are never photographed, and a
 * vertical-only test reports them as broken every run.
 */
const IN_FRAME = `(img, w, h) => {
  const r = img.getBoundingClientRect();
  return r.top < h && r.bottom > 0 && r.left < w && r.right > 0 && r.width > 0;
}`;

async function settle(page, clipW, clipH) {
  // Wait for fonts and for the images that are actually in the capture frame,
  // with a cap: off-screen packshots are lazy and never load, so an uncapped
  // wait hangs.
  await page.evaluate(async ([inFrameSrc, w, h]) => {
    await document.fonts.ready;
    const inFrame = eval(inFrameSrc);
    const inView = (img) => inFrame(img, w, h);
    const wait = (img) =>
      img.complete
        ? img.decode().catch(() => {})
        : new Promise((res) => {
            img.addEventListener("load", () => img.decode().then(res, res), { once: true });
            img.addEventListener("error", res, { once: true });
          });
    const timeout = new Promise((res) => setTimeout(res, 2500));
    await Promise.race([Promise.all(Array.from(document.images).filter(inView).map(wait)), timeout]);
  }, [IN_FRAME, clipW, clipH]);
  await sleep(700);
}

/**
 * Names any image inside the capture frame that did not decode. A still with a
 * broken-image glyph baked into it looks like a bug in the work rather than a
 * bug in the capture, and nothing downstream would ever catch it.
 */
async function brokenImages(page, clipW, clipH) {
  return page.evaluate(
    ([inFrameSrc, w, h]) => {
      const inFrame = eval(inFrameSrc);
      return Array.from(document.images)
        .filter((img) => inFrame(img, w, h))
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute("src"));
    },
    [IN_FRAME, clipW, clipH],
  );
}

/**
 * One phone still.
 * @param query   deep-link query string for embed.html (without the "?")
 * @param name    output basename
 * @param expect  a selector or text that must be present, so a renamed route
 *                fails loudly instead of silently shooting the home screen
 * @param before  optional interaction to run after load (typing a search, etc.)
 * @param fast    shoot inside a screen's own timeout instead of settling. The
 *                splash routes itself onward after 1.4s (onboarding.js), so the
 *                full settle pass outruns it and photographs the screen after
 *                it has already left.
 */
async function phone(query, name, expect, before, fast = false) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errs.push(`${name}: ${m.text()}`));
  await page.setViewport({ ...PHONE_VIEWPORT, deviceScaleFactor: 2 });
  // The app animates screen entrances and the dock; reduced motion gives a
  // settled frame rather than a half-slid one.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${BASE}/embed.html?${query}`, {
    waitUntil: fast ? "load" : "networkidle0",
    timeout: 30000,
  });
  await page.addStyleTag({ content: PHONE_CSS });
  if (fast) {
    await sleep(700);
  } else {
    await settle(page, 402, 874);
    if (before) {
      await before(page);
      await settle(page, 402, 874);
    }
  }

  const ok = await page.evaluate((needle) => {
    if (needle.startsWith("sel:")) return !!document.querySelector(needle.slice(4));
    return document.body.innerText.includes(needle);
  }, expect);
  if (!ok) {
    errs.push(`${name}: expected "${expect}" not found for ?${query}`);
    console.log(`✗ ${name}: "${expect}" missing`);
    await ctx.close();
    return;
  }

  const missing = await brokenImages(page, 402, 874);
  if (missing.length) errs.push(`${name}: broken image(s) ${missing.join(", ")}`);

  const device = await page.$("#device");
  const box = await device.boundingBox();
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: Math.round(box.x), y: Math.round(box.y), width: 402, height: 874 },
  });
  console.log(`✓ ${name}  (?${query})`);
  await ctx.close();
}

/** One landscape browser still at 1280x800 (16:10, the <Shot> block's frame). */
async function wide(file, query, name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${BASE}/${file}${query ? "?" + query : ""}`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  await settle(page, 1280, 800);
  const missing = await brokenImages(page, 1280, 800);
  if (missing.length) errs.push(`${name}: broken image(s) ${missing.join(", ")}`);
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log(`✓ ${name}  (${file}${query ? "?" + query : ""})`);
  await ctx.close();
}

// ── Arrive ─────────────────────────────────────────────────────────────────
// Shot live and early: the splash sends itself to onboarding at 1.4s.
await phone("screen=splash", "splash", "Made for India", undefined, true);
await phone("screen=onboarding", "onboarding", "sel:#screen");
await phone("screen=phone", "phone", "+91");
await phone("screen=otp", "otp", "sel:#screen");
await phone("screen=location", "location", "sel:#screen");

// ── Shop ───────────────────────────────────────────────────────────────────
await phone("screen=home&seed=1", "home", "sel:#screen");
await phone("screen=categories&seed=1", "categories", "sel:#screen");
await phone("screen=category&cat=dairy&seed=1", "shelf-dairy", "sel:#screen");
// Hinglish search: type the query people actually type and let the results
// say what they read it as.
await phone("screen=search&seed=1", "search-doodh", "milk", async (page) => {
  await page.type("#q", "doodh", { delay: 40 });
  await sleep(600);
});
await phone("screen=home&seed=1&open=maggi-70", "product-sheet", "Maggi");

// ── The bill ───────────────────────────────────────────────────────────────
await phone("screen=cart&seed=1", "cart", "sel:#screen");
await phone("screen=checkout&seed=1", "checkout", "sel:#screen");
await phone("screen=payment&seed=1", "payment", "sel:#screen");

// ── The clock ──────────────────────────────────────────────────────────────
await phone("screen=placed&seed=1", "placed", "sel:#screen");
await phone("screen=track&seed=1", "track", "Cancel free");
await phone("screen=orders&seed=1", "orders", "sel:#screen");

// ── Account and appearance ─────────────────────────────────────────────────
await phone("screen=account&seed=1", "account", "sel:#screen");
await phone("screen=circle&seed=1", "circle", "sel:#screen");
await phone("screen=wallet&seed=1", "wallet", "sel:#screen");
await phone("screen=settings&seed=1", "settings", "Reduce glass");
await phone("screen=home&seed=1&theme=dark", "home-dark", "sel:#screen");
await phone("screen=home&seed=1&lang=hi", "home-hindi", "sel:#screen");
await phone("screen=home&seed=1&glass=off", "home-glass-off", "sel:#screen");
await phone("screen=cart&seed=1&theme=dark", "cart-dark", "sel:#screen");

// ── Landscape stills for <Shot> ────────────────────────────────────────────
await wide("index.html", "screen=home&seed=1", "stage");
await wide("design.html", "", "design-system");

await browser.close();
if (errs.length) {
  console.log("\nPAGE ERRORS:\n" + [...new Set(errs)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nALL DONE ->", OUT);
}
