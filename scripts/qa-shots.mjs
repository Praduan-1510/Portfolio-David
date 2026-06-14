import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/qa-shots";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errors = [];

async function cap(name, path, vp, { reduced = true, full = true, wait = 700 } = {}) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(`[console] ${m.text()}`);
  });
  page.on("pageerror", (e) => pageErrors.push(`[pageerror] ${e.message}`));
  await page.setViewport(vp);
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(wait);
  // Detect horizontal overflow (a common responsive bug)
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, overflow: de.scrollWidth - de.clientWidth };
  });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  if (pageErrors.length) errors.push({ name, errors: pageErrors });
  if (overflow.overflow > 1) errors.push({ name, errors: [`H-OVERFLOW ${overflow.overflow}px (scrollW ${overflow.scrollW} > clientW ${overflow.clientW})`] });
  await page.close();
  console.log(name, "done", `overflow=${overflow.overflow}px`);
}

const D = { width: 1440, height: 900, deviceScaleFactor: 1 };
const T = { width: 768, height: 1024, deviceScaleFactor: 1 };
const M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const routes = [
  ["home", "/"],
  ["work", "/work"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["case-insightstap", "/work/insightstap"],
  ["case-spendee", "/work/spendee"],
  ["case-decathlon", "/work/decathlon"],
  ["case-voyager", "/work/voyager"],
  ["notfound", "/zzz-missing"],
];

for (const [n, p] of routes) await cap(`${n}-d`, p, D);
for (const [n, p] of routes) await cap(`${n}-m`, p, M);
for (const [n, p] of [["home", "/"], ["work", "/work"], ["about", "/about"], ["contact", "/contact"], ["case-insightstap", "/work/insightstap"]])
  await cap(`${n}-t`, p, T);

// Live (motion on) captures to judge hero atmosphere + video mockup.
await cap("home-hero-live", "/", D, { reduced: false, full: false, wait: 2400 });
await cap("insightstap-hero-live", "/work/insightstap", D, { reduced: false, full: false, wait: 2400 });
await cap("about-hero-live", "/about", D, { reduced: false, full: false, wait: 2400 });

await browser.close();
console.log("\n=== RUNTIME ERRORS / OVERFLOW ===");
console.log(errors.length ? JSON.stringify(errors, null, 2) : "NONE — no console errors, no horizontal overflow");
console.log("ALL DONE");
