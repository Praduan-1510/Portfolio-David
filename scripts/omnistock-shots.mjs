// Captures stills of the OmniStock prototype for the case study.
// Usage: node scripts/omnistock-shots.mjs      (needs `next dev` on :3000)
//
// OmniStock is a SINGLE self-contained file with a hash router: every one of
// the 51 screens is `omnistock.html#NN-name`, and four shells (auth, console,
// portal, handheld) live in the same document. So unlike Keel and Meridian
// there is no page to pick, only a hash, and unlike CareBridge the shell class
// on <body> changes with the route. Each shot asserts it actually landed on the
// requested screen, so a renamed id fails loudly instead of quietly shooting
// the index.
//
// Shot dark, because the system is committed single-theme dark: tokens.css says
// so outright ("the system's premise is dark-first, so there is no light
// palette"). A light still would be a portfolio flourish, not the product.
//
// Aspects match the other prototype studies:
//   1280x800 (16:10): LivePrototype poster + inline console stills.
//   1280x700 (64:35): the listing cover, BrowserMockup's well aspect, so
//                     ProjectCover crops nothing.
//   390x844:          the handheld shell, which is a real 390px layout.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000/prototype/omnistock/omnistock.html";
const OUT = "public/images/work/omnistock";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errs = [];

/**
 * Open one screen by hash and shoot it.
 * @param screen screen id, e.g. "05-dashboard"
 * @param name   output basename
 * @param vp     viewport + clip size
 */
async function shoot(screen, name, vp = { width: 1280, height: 800 }) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errs.push(`${name}: ${m.text()}`));
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

  await page.goto(`${BASE}#${screen}`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(700);
  // The router only reads the hash on hashchange/DOMContentLoaded, and a direct
  // load with the hash already set can race it. Re-assert, then settle.
  await page.evaluate((id) => {
    if (location.hash.slice(1) !== id) location.hash = id;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, screen);
  await sleep(600);

  const landed = await page.evaluate((id) => {
    const el = document.getElementById(id);
    return !!el && el.getAttribute("data-active") === "true";
  }, screen);
  if (!landed) {
    errs.push(`${name}: screen "${screen}" did not activate`);
    console.log(`x ${name} - screen ${screen} did not activate`);
    await page.close();
    return;
  }

  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
  });
  console.log(`ok ${name} ${vp.width}x${vp.height}  (#${screen})`);
  await page.close();
}

// Listing cover + launch poster: the dashboard, the exposure-ranked queue.
await shoot("05-dashboard", "cover", { width: 1280, height: 700 });
await shoot("05-dashboard", "app-dashboard");

// The argument: an edit form with no quantity field. The ledger screen was
// shot here too and cut: the written piece carries the ledger in prose and a
// fifth browser frame made a short study look like a gallery.
await shoot("10-item-edit", "item-edit");

// Variance: where two counts disagree and the system refuses to pick a winner.
await shoot("23-variance-triage", "variance");

// The separate shells.
await shoot("portal-32-holdings", "portal");
await shoot("handheld-45-scan", "handheld", { width: 390, height: 844 });

// The system itself.
await shoot("50-states", "system");

await browser.close();
if (errs.length) {
  console.log("\nPAGE ERRORS:\n" + [...new Set(errs)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nALL DONE ->", OUT);
}
