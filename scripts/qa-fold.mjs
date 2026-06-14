import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/tmp/qa-fold"; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
async function shot(name, path, vp, reduced=true) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(900);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  await page.close();
  console.log(name);
}
const D = { width: 1440, height: 900, deviceScaleFactor: 1 };
const M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const routes = [["home","/"],["work","/work"],["about","/about"],["contact","/contact"],["insightstap","/work/insightstap"],["spendee","/work/spendee"],["notfound","/zzz-missing"]];
for (const [n,p] of routes) await shot(`${n}-d`, p, D);
for (const [n,p] of [["home","/"],["work","/work"],["about","/about"],["contact","/contact"],["insightstap","/work/insightstap"]]) await shot(`${n}-m`, p, M);
// motion-on hero for home + insightstap to judge WebGL/video mockup
await shot("home-live-d", "/", D, false);
await shot("insightstap-live-d", "/work/insightstap", D, false);
await browser.close(); console.log("DONE");
