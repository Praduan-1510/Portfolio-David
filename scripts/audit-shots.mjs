import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/audit";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

// Clean, fully-composed captures: reduced-motion ON so every reveal is settled
// and nothing is mid-animation — ideal for judging layout / type / spacing / colour.
async function cap(name, path, vp, { reduced = true, full = true, wait = 700 } = {}) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(wait);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await page.close();
  console.log(name, "done");
}

const D = { width: 1440, height: 900, deviceScaleFactor: 1 };
const M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const routes = [
  ["home", "/"],
  ["work", "/work"],
  ["case", "/work/spendee"],
  ["case2", "/work/decathlon"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["notfound", "/zzz-missing"],
];

for (const [n, p] of routes) await cap(`${n}-d`, p, D);
for (const [n, p] of [["home", "/"], ["case", "/work/spendee"], ["about", "/about"], ["work", "/work"]])
  await cap(`${n}-m`, p, M);

// One LIVE hero capture (motion on) to judge the WebGL backdrop + grain atmosphere.
await cap("home-hero-live", "/", D, { reduced: false, full: false, wait: 2200 });

await browser.close();
console.log("ALL DONE");
