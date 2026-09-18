// Captures stills of the Spendee prototype for the case study.
// Usage: node scripts/spendee-shots.mjs      (needs `next dev` on :3000)
//        node scripts/generate-blur-map.mjs  (afterwards: the gallery's blur placeholders)
//
// Spendee is an "app" study: bare screen captures that the house PhoneFrame
// wraps with its own bezel and corners, one still per screen of the running
// prototype in public/prototype/spendee/screens, so every image in the gallery
// is a real state of the thing a visitor can click through above it.
//
// The prototype has a capture mode built in (`?capture=1`, see app.js): entrance
// animations off, the tab bar and CTA bar pinned to the bottom of the screen
// instead of the viewport, sheets positioned inside the frame. On top of that
// the capture strips the screen's own rounded corners (PhoneFrame draws them),
// and clips to the screen element, so the white page behind a capture-mode
// screen never ends up in the image.
//
// Every shot runs in a FRESH browser context: screens persist profile, team
// count and flash messages in localStorage, and a signup run would otherwise
// leak its values into every screen captured after it.
//
// The poster for the live prototype frame is the prototype's own landing page
// (phone stage + flow chips) at 1280x800, the frame's desktop viewport.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000/prototype/spendee";
const OUT = "public/images/work/spendee";
mkdirSync(OUT, { recursive: true });

// The prototype's own screen list, in its own order (index.html SCREENS).
export const SCREENS = [
  "splash", "welcome", "onboarding-1", "onboarding-2", "onboarding-3",
  "login", "signup", "otp", "create-pin", "forgot-pin", "permissions", "setup-complete",
  "dashboard", "notifications", "contact", "add-contact", "customer-details",
  "transaction-detail", "add-entry", "receipt-scan",
  "invoices", "create-invoice", "invoice-preview", "invoice-detail", "invoice-discount",
  "bank", "send-money", "scan-pay", "beneficiaries", "payment-success", "payment-failed",
  "statement", "card-controls",
  "credit-growth", "loan-apply", "loan-success", "gst-center", "gst-file", "reports", "inventory",
  "more", "settings", "edit-profile", "team", "help",
];

// Words that must not survive into a still: the uncorrected Figma data this
// study says was caught and fixed. A capture that still shows one fails loudly
// instead of quietly putting a contradiction on the page.
const STALE = [
  /\$\s?\d/, /Joseph Alfred/, /Alex Johnson/, /Arnold Fisher/, /John Jacobs/,
  /Roger Shaw/, /Joshua Aaron/, /Ron Potter/, /Chris Mathew/, /Philip Andrews/,
  /Alpinestar/, /Phoenix/, /Arizona/, /Ohio/, /27AABCR1234K1Z3/, /joseph@spendee/,
];

const FRAME_CSS = `
  body.capture { background: #000 !important; }
  body.capture .screen, body.capture .page { border-radius: 0 !important; }
`;

const browser = await chromium.launch();
const errs = [];

async function shot(id) {
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`${id}: ${e.message}`));
  await page.goto(`${BASE}/screens/${id}.html?capture=1`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: FRAME_CSS });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // The rupee sign comes from Poppins' devanagari subset, loaded on demand.
    await document.fonts.load("500 20px Poppins", "₹").catch(() => {});
    await Promise.all(
      [...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))),
    );
  });
  await page.waitForTimeout(500);

  const text = await page.evaluate(() => {
    const el = document.querySelector(".screen, .page");
    return el ? el.innerText : document.body.innerText;
  });
  const stale = STALE.filter((re) => re.test(text)).map(String);
  if (stale.length) errs.push(`${id}: stale data still visible ${stale.join(" ")}`);

  const el = await page.$(".screen, .page");
  if (!el) {
    errs.push(`${id}: no .screen/.page element`);
    await ctx.close();
    return;
  }
  const box = await el.boundingBox();
  // fullPage is load-bearing: without it Playwright clips the clip to the
  // 874px viewport, and every screen taller than one phone height (the
  // dashboard is 1320) silently loses its bottom half.
  await page.screenshot({
    path: `${OUT}/${id}.png`,
    fullPage: true,
    clip: { x: box.x, y: box.y, width: Math.round(box.width), height: Math.round(box.height) },
  });
  console.log(`✓ ${id.padEnd(20)} ${Math.round(box.width)}x${Math.round(box.height)}`);
  await ctx.close();
}

for (const id of SCREENS) await shot(id);

// Poster for the live frame: the demo stage (app.html) at the frame's desktop
// viewport, on the splash, which is the first thing the launched frame shows,
// so the poster-to-live wipe lands pixel-aligned. The splash routes itself on
// to welcome at 1.8s, so this is shot fast, inside that window, after the
// stage's own entrance (~0.9s) has settled.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`stage: ${e.message}`));
  // ?case-link=0 keeps the portfolio's "Back to the case study" link out of the poster.
  await page.goto(`${BASE}/app.html?case-link=0`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
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
