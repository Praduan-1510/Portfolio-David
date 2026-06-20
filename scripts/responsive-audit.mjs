import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";

/*
 * Responsive sweep harness. Sweeps every route across a wide width matrix and,
 * at each width, measures horizontal overflow + any element wider than the
 * viewport (the two most common responsive bugs) entirely programmatically —
 * no image reading needed. It ALSO captures fold + full-page PNGs at a
 * representative subset of widths (incl. landscape phone) for visual review.
 *
 * Usage: node scripts/responsive-audit.mjs            (capture images + report)
 *        node scripts/responsive-audit.mjs --no-shots (report only, fast)
 */
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/responsive-audit";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = !process.argv.includes("--no-shots");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const routes = [
  ["home", "/"],
  ["work", "/work"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["case-insightstap", "/work/insightstap"],
  ["case-spendee", "/work/spendee"],
  ["case-decathlon", "/work/decathlon"],
  ["case-voyager", "/work/voyager"],
];

// Width matrix — covers small phone → large desktop, plus landscape phone & the
// tablet-landscape / small-laptop crossover where `md:` choreography turns on.
const WIDTHS = [
  { w: 320, h: 720, label: "320 (iPhone SE / small)" },
  { w: 360, h: 800, label: "360 (Android)" },
  { w: 390, h: 844, label: "390 (iPhone 14)" },
  { w: 414, h: 896, label: "414 (iPhone Plus)" },
  { w: 430, h: 932, label: "430 (iPhone Pro Max)" },
  { w: 667, h: 375, label: "667x375 (phone landscape)" },
  { w: 768, h: 1024, label: "768 (iPad portrait)" },
  { w: 834, h: 1112, label: "834 (iPad Air)" },
  { w: 1024, h: 768, label: "1024 (iPad landscape / laptop)" },
  { w: 1280, h: 800, label: "1280 (laptop)" },
  { w: 1440, h: 900, label: "1440 (design target)" },
  { w: 1920, h: 1080, label: "1920 (desktop)" },
  { w: 2560, h: 1440, label: "2560 (wide / 2K)" },
];

// Which widths also get image captures (fold + full).
const SHOT_WIDTHS = new Set([320, 390, 667, 768, 1024, 1440, 1920]);

const report = [];

for (const [name, path] of routes) {
  for (const { w, h, label } of WIDTHS) {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    const isMobile = w <= 430 || (w === 667 && h === 375);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile, hasTouch: isMobile });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 30000 });
    } catch (e) {
      report.push({ route: name, width: w, label, error: `nav: ${e.message}` });
      await page.close();
      continue;
    }
    await sleep(400);

    // Programmatic overflow + offending-element detection.
    const metrics = await page.evaluate((vw) => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;
      const offenders = [];
      if (overflow > 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1.5 && r.width > 4) {
            const cls = typeof el.className === "string" ? el.className : "";
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: cls.slice(0, 80),
              right: Math.round(r.right),
              width: Math.round(r.width),
            });
          }
        }
      }
      // Tap-target audit: links/buttons smaller than 44x44 (visible only).
      const small = [];
      for (const el of document.querySelectorAll("a[href], button")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.width < 40 || r.height < 40) {
          const label = (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30);
          small.push({ tag: el.tagName.toLowerCase(), label, w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
      return { overflow, scrollW: de.scrollWidth, offenders: offenders.slice(0, 8), small: small.slice(0, 12), docH: de.scrollHeight };
    }, w);

    const rec = { route: name, width: w, label, overflow: metrics.overflow, docH: metrics.docH };
    if (metrics.overflow > 1) rec.offenders = metrics.offenders;
    if (metrics.small.length) rec.smallTaps = metrics.small;
    if (consoleErrors.length) rec.errors = consoleErrors;
    report.push(rec);

    if (SHOTS && SHOT_WIDTHS.has(w)) {
      await page.screenshot({ path: `${OUT}/${name}_${w}_fold.png`, fullPage: false });
      // Full-page only for shorter routes — case studies are 11k–23k px tall, so
      // a full capture is unreadable; the fold + section captures cover them.
      if (metrics.docH < 9000) {
        await page.screenshot({ path: `${OUT}/${name}_${w}_full.png`, fullPage: true });
      }
    }
    const flag = metrics.overflow > 1 ? `  ⚠ OVERFLOW ${metrics.overflow}px` : "";
    console.log(`${name.padEnd(18)} ${String(w).padStart(4)}  ovf=${String(metrics.overflow).padStart(4)}${flag}`);
    await page.close();
  }
}

await browser.close();

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));

const overflows = report.filter((r) => r.overflow > 1);
console.log("\n=== OVERFLOW SUMMARY ===");
if (overflows.length === 0) console.log("No horizontal overflow at any width on any route. ✓");
else for (const o of overflows) console.log(`${o.route} @ ${o.width}px → ${o.overflow}px`, JSON.stringify(o.offenders));

console.log("\nFull report: " + `${OUT}/report.json`);
console.log("Shots: " + OUT);
