// Captures stills of the CareBridge prototype for the case study.
// Usage: node scripts/carebridge-shots.mjs      (needs `next dev` on :3000)
//
// Unlike Meridian, there is no auth gate to drive: every CareBridge surface is
// reachable directly, and each page carries its own hash router keyed to screen
// ids (scr-hom-01, scr-dsc-04, …). Loading `page.html#scr-xxx-nn` lands on that
// exact screen, so each still is a real state of the prototype rather than a
// composed mock. Screen ids come from the prototype's own markup: if one is
// renamed there, the shot below fails loudly instead of silently capturing the
// wrong screen.
//
// Shot in the LIGHT theme on purpose. CareBridge is light-first (its own spec
// says so, and the theme is what a clinic would actually run), so a dark-theme
// still would be a portfolio flourish rather than the product. It also keeps the
// three prototype studies visually distinct in the work index: Keel is cream,
// Meridian is slate, CareBridge is clinical white-blue.
//
// Two aspect ratios, matching the Meridian script:
//   1280×800 (16:10): the LivePrototype poster and the inline stills; the same
//                     viewport the frame renders, so launching causes no jump.
//   1280×700 (64:35): the listing cover; BrowserMockup's default well aspect,
//                     so ProjectCover crops nothing.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000/prototype/carebridge";
const OUT = "public/images/work/carebridge";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errs = [];

/**
 * Open one prototype screen and shoot it.
 * @param file   page under /prototype/carebridge, e.g. "app.html"
 * @param screen screen id for the hash router, or null for the page default
 * @param name   output basename
 * @param clip   capture box (the cover is shorter than the rest)
 */
async function shoot(file, screen, name, clip = { width: 1280, height: 800 }) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errs.push(`${name}: ${m.text()}`));
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  // The prototype reveals sections on scroll and animates screen transitions;
  // reduced motion gives a settled frame rather than a half-faded one.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

  const url = screen ? `${BASE}/${file}#${screen}` : `${BASE}/${file}`;
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(900);

  if (screen) {
    // Assert we actually landed: a renamed id would otherwise shoot screen one.
    const landed = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return !!el && el.getBoundingClientRect().width > 0;
    }, screen);
    if (!landed) {
      errs.push(`${name}: screen "${screen}" not visible in ${file}`);
      console.log(`✗ ${name} — screen ${screen} not visible`);
      await page.close();
      return;
    }
  }

  await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, ...clip } });
  console.log(`✓ ${name} ${clip.width}×${clip.height}  (${file}${screen ? "#" + screen : ""})`);
  await page.close();
}

// ── Patient surface ────────────────────────────────────────────────────────
// The listing cover and the launch poster are the same morning home screen at
// the two different aspects each slot expects.
await shoot("app.html", "scr-hom-01", "cover", { width: 1280, height: 700 });
await shoot("app.html", "scr-hom-01", "app-home");
// The routing argument: plain-language triage landing on a department, and the
// red-flag path that overrides it.
await shoot("app.html", "scr-dsc-04", "triage");
await shoot("app.html", "scr-dsc-07", "redflag");
// Store stock: the detail that decides whether someone actually gets the drug.
await shoot("care.html", "scr-med-05", "medicines");

// ── Clinician surface ──────────────────────────────────────────────────────
await shoot("clinician.html", "scr-cln-01", "clinician");
await shoot("clinician.html", "scr-cln-42", "critical");

// ── Operations + the system ────────────────────────────────────────────────
await shoot("ops.html", "scr-ops-01", "ops");
await shoot("styleguide.html", null, "styleguide");

await browser.close();
if (errs.length) {
  console.log("\nPAGE ERRORS:\n" + [...new Set(errs)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nALL DONE ->", OUT);
}
