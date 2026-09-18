// Captures stills of the Voyager prototype for the case study.
// Usage: node scripts/voyager-shots.mjs      (needs `next dev` on :3000)
//        node scripts/generate-blur-map.mjs  (afterwards: the gallery's blur placeholders)
//
// Voyager is an "app" study: bare screen captures that the house PhoneFrame
// wraps with its own bezel and corners, one still per screen of the running
// prototype in public/prototype/voyager/screens, so every image in the gallery
// is a real state of the thing a visitor can click through above it.
//
// The prototype has a capture mode built in (`?capture=1`, see app.js): entrance
// animations off, waits clamped, the tab bar and CTA bar laid in flow at the foot
// of the screen instead of pinned to the viewport, sheets positioned inside the
// frame, and the splash's auto-advance disabled. On top of that the capture strips
// the screen's own 40px frame corners (PhoneFrame draws them) and clips to the
// screen element, so the white page behind a capture-mode screen never ends up in
// the image. (The photo gallery is the one full-bleed screen: its root is main.gv.)
//
// Every shot runs in a FRESH browser context: screens persist bookings, points,
// saved places and the chat in localStorage (keys prefixed "voyager:"), and one
// screen's state would otherwise leak into every screen captured after it.
//
// The poster for the live prototype frame is the prototype's own demo stage
// (app.html: phone + panel) at 1280x800, the frame's desktop viewport.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000/prototype/voyager";
const OUT = "public/images/work/voyager";
mkdirSync(OUT, { recursive: true });

// The prototype's own screen list, in its own order (index.html SCREENS).
export const SCREENS = [
  "splash", "onboarding-1", "onboarding-2", "onboarding-3", "signup", "otp", "permissions",
  "login", "forgot-password", "reset-password",
  "dashboard", "search", "search-results", "filters", "map", "saved", "destination",
  "gallery", "hotel", "reviews", "write-review",
  "book-dates", "book-extras", "book-payment", "add-card", "payment-failed", "book-confirmed",
  "trips", "itinerary", "e-ticket", "modify-booking", "cancel-trip",
  "profile", "rewards", "documents", "add-document", "payment-methods", "promo-codes",
  "settings", "edit-profile", "change-password", "language",
  "notifications", "support", "help",
];

// Words that must not survive into a still: the uncorrected Figma data and the
// contradictions this port fixed. A capture that still shows one fails loudly
// instead of quietly putting it on the page. [pattern, screens it may legitimately
// appear on]
const STALE = [
  [/David/], [/Alex Pope/], [/Get get/i], [/\$\s?1,?250\b/], [/\b2025\b/],
  [/₹/, ["language"]],                         // the currency picker lists the rupee
  [/\$1,885/],                                 // Prague total before it followed the pricing rules
  [/Deluxe Double/], [/6 Nights Hotel/], [/Brasserie/], [/4:15 PM/],
  [/Free cancellation window/], [/every \$2 you spend/], [/3868/],
  [/Customise Trip/, ["book-extras"]],         // step 2's title, once also on the payment step
  [/Musée d’Orsay/],                           // closed on Mondays, which is Day 6
];

const FRAME_CSS = `
  body.capture { background: #14213D !important; }
  body.capture .screen, body.capture .page, body.capture .gv { border-radius: 0 !important; }
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
  page.on("response", (r) => { if (r.status() >= 400) errs.push(`${id}: HTTP ${r.status()} ${r.url()}`); });
  // One retry: a cold `next dev` compiling another route can stall a first load past the timeout.
  for (let attempt = 1; ; attempt++) {
    try { await page.goto(`${BASE}/screens/${id}.html?capture=1`, { waitUntil: "networkidle", timeout: 45000 }); break; }
    catch (e) { if (attempt >= 2) throw e; }
  }
  await page.addStyleTag({ content: FRAME_CSS });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Lazy images below the fold would otherwise capture as their tinted placeholder.
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = "eager"; });
    await Promise.all(
      [...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))),
    );
  });
  await page.waitForTimeout(600);

  const text = await page.evaluate(() => {
    const el = document.querySelector(".screen, .page, main.gv");
    return el ? el.innerText : document.body.innerText;
  });
  const stale = STALE.filter(([re, ok]) => !(ok || []).includes(id) && re.test(text)).map(([re]) => String(re));
  if (stale.length) errs.push(`${id}: stale data still visible ${stale.join(" ")}`);

  const broken = await page.evaluate(() => [...document.images].filter((i) => i.getAttribute("src") && i.naturalWidth === 0).map((i) => i.getAttribute("src")));
  if (broken.length) errs.push(`${id}: broken images ${broken.join(" ")}`);

  const el = await page.$(".screen, .page, main.gv");
  if (!el) {
    errs.push(`${id}: no .screen/.page/.gv element`);
    await ctx.close();
    return;
  }
  const box = await el.boundingBox();
  // fullPage is load-bearing: without it Playwright clips the clip to the
  // 874px viewport, and every screen taller than one phone height (the
  // dashboard is 1188) silently loses its bottom half.
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
// so the poster-to-live wipe lands pixel-aligned. Reduced motion puts both the
// stage's entrance and the splash's draw-on monogram at their end state (the
// splash's own CSS collapses every animation to 1ms), so the poster shows the
// settled splash rather than whatever frame of the draw-on the clock caught.
// The splash routes itself on to onboarding 2.2s after it loads, so the shot is
// taken as soon as the phone's document and fonts are in.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`stage: ${e.message}`));
  // ?case-link=0 keeps the portfolio's "Back to the case study" link out of the poster.
  for (let attempt = 1; ; attempt++) {
    try { await page.goto(`${BASE}/app.html?case-link=0`, { waitUntil: "load", timeout: 60000 }); break; }
    catch (e) { if (attempt >= 2) throw e; }
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const d = document.getElementById("phone").contentDocument;
    return d && d.readyState === "complete" && d.fonts.status === "loaded";
  }, null, { timeout: 30000 });
  await page.waitForTimeout(300);
  const onSplash = await page.evaluate(() => /splash\.html$/.test(document.getElementById("phone").contentWindow.location.pathname));
  if (!onSplash) errs.push("stage: the phone had left the splash before the poster was taken");
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
