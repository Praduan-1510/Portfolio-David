// Captures stills of the Decathlon prototype for the case study.
// Usage: node scripts/decathlon-shots.mjs      (needs `next dev` on :3000)
//        node scripts/generate-blur-map.mjs    (afterwards: the gallery's blur placeholders)
//
// Decathlon is an "app" study: bare screen captures that the house PhoneFrame
// wraps with its own bezel and corners, one still per screen of the running
// prototype in public/prototype/decathlon/screens (plus checkout step 1, which
// is the saved-addresses screen in select mode), so every image in the gallery
// is a real state of the thing a visitor can click through above it.
//
// The prototype has a capture mode built in (`?capture=1`, see app.js): body
// gets .capture, which turns entrance motion off, opens deep-linked sheets
// instantly and gives the flow pages a fixed 852px minimum height. On top of
// that the capture adds .fullpage, which the stylesheet already honours by
// pinning the tab bar to the bottom of the page instead of the viewport; this
// script does the same for the CTA bar, and clips to the screen element so
// nothing outside the 393px frame ends up in the image.
//
// Every shot runs in a FRESH browser context: the prototype keeps its bag,
// orders, filters and vouchers in localStorage, and a run that placed an order
// would otherwise leak into every screen captured after it.
//
// The poster for the live prototype frame is the prototype's own landing page
// (phone stage + flow chips) at 1280x800, the frame's desktop viewport.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000/prototype/decathlon";
const OUT = "public/images/work/decathlon";
mkdirSync(OUT, { recursive: true });

// The prototype's own screen list, in its own order (index.html SCREENS).
export const SCREENS = [
  "splash", "welcome", "onboarding-1", "onboarding-2", "onboarding-3",
  "login", "otp", "signup", "forgot-password",
  "home", "category", "sport", "travel-store", "stores", "store-detail",
  "search", "search-results", "filters", "scanner", "notifications", "location",
  "product", "gallery", "reviews", "write-review", "wishlist",
  "bag", "coupons", "checkout", "payment", "payment-failed", "confirmation",
  "orders", "order-detail", "order-tracking", "return-request", "return-success",
  "account", "edit-profile", "addresses", "add-address", "payment-methods", "club", "settings", "help",
];
// Extra states that are screens in their own right: [file name, screen, query]
const EXTRA = [
  ["checkout-address", "addresses", "select=1"], // checkout step 1 of 3
];

// Words that must not survive into a still: the uncorrected Figma data this
// study says was caught and fixed (a US placeholder address and name in an
// Indian app, "Rs", a GST rate India doesn't have, a Club benefit that
// contradicted the 30-day returns everywhere else). A capture that still shows
// one fails loudly instead of quietly putting a contradiction on the page.
const STALE = [
  /\bRs\.?\s?\d/, /\$\s?\d/, /David/, /Fisher/, /Ash Dr/, /San Jose/, /Dakota/, /83475/,
  /\b8%/, /90-day/, /Kolkata ,/, /Badminton racket/, /Trekking backpack/,
  /Newtown/, /Saltlake/,
];

// Store status is computed from the clock (open / closed / opens at), so a
// run at 2 AM paints every store "Closed" into the stills. Pin the clock to
// 11:00 today in Kolkata: still today, so every date the seed data derives
// from "now" is unchanged, but inside opening hours. setFixedTime only fakes
// Date; timers keep running, so splash routing and loaders behave normally.
const CAPTURE_TZ = "Asia/Kolkata";
const CAPTURE_AT = (() => {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: CAPTURE_TZ }).format(new Date());
  return new Date(`${ymd}T11:00:00+05:30`);
})();

const FRAME_CSS = `
  body.capture .screen, body.capture .page, body.capture main { border-radius: 0 !important; }
  body.capture.fullpage .cta-bar { position: absolute; }
`;

const browser = await chromium.launch();
const errs = [];

async function shot(name, id, query = "") {
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    timezoneId: CAPTURE_TZ,
  });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(CAPTURE_AT);
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) errs.push(`${name}: HTTP ${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}/screens/${id}.html?capture=1${query ? "&" + query : ""}`, { waitUntil: "load" });
  await page.evaluate(() => document.body.classList.add("fullpage"));
  await page.addStyleTag({ content: FRAME_CSS });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // The rupee sign is in Poppins' devanagari subset, which only loads on demand.
    await document.fonts.load("600 16px Poppins", "₹").catch(() => {});
    // Lazy images below the fold would otherwise be blank tiles in a full-page still.
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = "eager"; });
    await Promise.all(
      [...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))),
    );
  });
  await page.waitForTimeout(500);

  const text = await page.evaluate(() => {
    const el = document.querySelector(".screen, .page, main");
    return el ? el.innerText : document.body.innerText;
  });
  const stale = STALE.filter((re) => re.test(text)).map(String);
  if (stale.length) errs.push(`${name}: stale data still visible ${stale.join(" ")}`);

  const el = await page.$(".screen, .page, main");
  if (!el) {
    errs.push(`${name}: no .screen/.page/main element`);
    await ctx.close();
    return;
  }
  const box = await el.boundingBox();
  // fullPage is load-bearing: without it Playwright clips the clip to the
  // 852px viewport, and every screen taller than one phone height (Home is
  // well over two) silently loses its bottom half.
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    fullPage: true,
    clip: { x: box.x, y: box.y, width: Math.round(box.width), height: Math.round(box.height) },
  });
  console.log(`✓ ${name.padEnd(20)} ${Math.round(box.width)}x${Math.round(box.height)}`);
  await ctx.close();
}

for (const id of SCREENS) await shot(id, id);
for (const [name, id, q] of EXTRA) await shot(name, id, q);

// Poster for the live frame: the demo stage (app.html) at the frame's desktop
// viewport, on the splash, which is the first thing the launched frame shows,
// so the poster-to-live wipe lands pixel-aligned. The splash routes itself on
// to welcome at 2.4s, so this is shot inside that window, after the stage's
// own entrance (~1.1s) has settled.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, timezoneId: CAPTURE_TZ });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(CAPTURE_AT);
  page.on("pageerror", (e) => errs.push(`stage: ${e.message}`));
  // ?case-link=0 keeps the portfolio's "Back to the case study" link out of the poster.
  await page.goto(`${BASE}/app.html?case-link=0`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${OUT}/stage.png` });
  console.log("✓ stage                1280x800");
  await ctx.close();
}

await browser.close();
if (errs.length) {
  console.log("\nPROBLEMS:\n" + [...new Set(errs)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`\nALL DONE -> ${OUT}`);
}
