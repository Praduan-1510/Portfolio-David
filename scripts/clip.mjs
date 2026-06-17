import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox","--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 30000 });
await new Promise(r=>setTimeout(r,800));
// clip the hero top region
await page.screenshot({ path: "/tmp/qa-shots/hero-clip.png", clip: { x: 0, y: 0, width: 1440, height: 620 } });
await browser.close();
console.log("done");
