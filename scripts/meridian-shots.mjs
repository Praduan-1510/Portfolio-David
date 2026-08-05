// Captures stills of the Meridian prototype for the case study.
// Usage: node scripts/meridian-shots.mjs      (needs `next dev` on :3000)
//
// The prototype always boots to its sign-in gate, so every app shot has to
// drive the real auth flow first (submit → 6-digit MFA → dashboard). Shooting
// it through the dev server rather than file:// keeps the paths identical to
// production and proves the static assets are actually being served.
//
// Two aspect ratios on purpose:
//   1280×800 (16:10): the LivePrototype poster; matches the desktop viewport
//                      the frame renders, so launching causes no visual jump.
//   1280×700 (64:35): the listing cover; matches BrowserMockup's default well
//                      aspect exactly, so ProjectCover crops nothing.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000/prototype/meridian";
const OUT = "public/images/work/meridian";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function openApp(vp) {
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errs.push(`[console] ${m.text()}`));
  await page.setViewport(vp);
  await page.goto(`${BASE}/app.html`, { waitUntil: "networkidle0", timeout: 30000 });
  // Sign in: the gate ships pre-filled, so submit → MFA → any 6 digits.
  await page.click('[data-auth="submit"]');
  await page.waitForSelector('[data-otp="0"]');
  for (let i = 0; i < 6; i++) await page.type(`[data-otp="${i}"]`, String(i + 1));
  await page.click('[data-auth="verify"]');
  await page.waitForSelector("#app:not(.hidden)");
  // The "Signed in" toast auto-dismisses; wait it out so it isn't baked into
  // the poster, which is the still the case-study hero shows at rest.
  await sleep(4200);
  return { page, errs };
}

async function shoot(page, name, vp) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false, clip: { x: 0, y: 0, ...vp } });
  console.log("✓", name, `${vp.width}×${vp.height}`);
}

// ── App shots ──────────────────────────────────────────────────────────────
{
  const VP = { width: 1280, height: 800, deviceScaleFactor: 2 };
  const { page, errs } = await openApp(VP);

  await shoot(page, "app-home", { width: 1280, height: 800 });
  // The listing cover is the same dashboard at the card's exact aspect.
  await shoot(page, "cover", { width: 1280, height: 700 });

  // Board view: the drag-and-drop work surface.
  await page.evaluate(() => {
    // eslint-disable-next-line no-undef
    go("all");
    // eslint-disable-next-line no-undef
    S.mode = "board";
    // eslint-disable-next-line no-undef
    render();
  });
  await sleep(500);
  await shoot(page, "app-board", { width: 1280, height: 800 });

  // Command palette: the keyboard spine of the product.
  await page.evaluate(() => {
    // eslint-disable-next-line no-undef
    openPalette();
  });
  await sleep(450);
  await shoot(page, "app-palette", { width: 1280, height: 800 });
  await page.evaluate(() => {
    // eslint-disable-next-line no-undef
    closePalette();
  });

  // Billing: plans, usage, and the entitlement paywalls behind them.
  await page.evaluate(() => {
    // eslint-disable-next-line no-undef
    go("plans");
  });
  await sleep(500);
  await shoot(page, "app-plans", { width: 1280, height: 800 });

  if (errs.length) console.log("  page errors:", errs.join(" | "));
  await page.close();
}

// ── Design system + build plan ─────────────────────────────────────────────
for (const [file, name] of [
  ["design-system.html", "design-system"],
  ["build-plan.html", "build-plan"],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  // Both pages reveal on scroll (IntersectionObserver), so reduced motion gives
  // a settled frame instead of a half-faded one.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(700);
  await shoot(page, name, { width: 1280, height: 800 });
  await page.close();
}

await browser.close();
console.log("ALL DONE ->", OUT);
