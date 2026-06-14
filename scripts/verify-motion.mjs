import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/motion-verify";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function shot(name, { path, viewport, reduced = false, scrollTo = 0, prep } = {}) {
  const page = await browser.newPage();
  await page.setViewport(viewport ?? { width: 1440, height: 900, deviceScaleFactor: 1 });
  if (reduced) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 30000 });
  if (scrollTo) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollTo);
  }
  await sleep(reduced ? 500 : 1800); // let load/scroll reveals settle
  if (prep) await prep(page);
  const checks = await page.evaluate(() => {
    // Sanity: report any element our reveals touch that is stuck invisible.
    const hidden = [];
    document.querySelectorAll("h1, h2, h3, p, dd, li, a").forEach((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4 && parseFloat(cs.opacity) < 0.05) {
        hidden.push((el.textContent || el.tagName).trim().slice(0, 40));
      }
    });
    return { hiddenCount: hidden.length, sample: hidden.slice(0, 6) };
  });
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${name}: hidden=${checks.hiddenCount} ${checks.sample.length ? JSON.stringify(checks.sample) : ""}`);
  await page.close();
}

// Desktop
await shot("home-desktop", { path: "/" });
await shot("home-work", { path: "/", scrollTo: 1500 });
await shot("case-study", { path: "/work/spendee", scrollTo: 1700 });
await shot("about", { path: "/about", scrollTo: 900 });

// Mobile + nav overlay
await shot("mobile-nav", {
  path: "/",
  viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  prep: async (page) => {
    await page.click('button[aria-label="Open menu"]');
    await sleep(700);
  },
});

// Reduced motion — content must be fully visible immediately
await shot("reduced-home", { path: "/", reduced: true });
await shot("reduced-case", { path: "/work/voyager", reduced: true, scrollTo: 1700 });

await browser.close();
console.log("done");
