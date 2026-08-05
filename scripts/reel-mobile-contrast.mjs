/*
 * Mobile legibility audit for the cinematic reel's "Currently" board.
 *
 * The board rides over a full-bleed film clip below lg, so its contrast is not a
 * token question: it depends on whatever pixels the frame happens to put behind
 * each line of type, and that changes as the reel scrubs. This walks the reel's
 * scroll timeline, screenshots the phone viewport at each beat, and measures REAL
 * contrast: it re-decodes each screenshot in a canvas, finds the LIGHTEST backdrop
 * pixel under every line of board text (worst case for light-on-dark type) and
 * computes the WCAG ratio against that line's own colour.
 *
 *   node scripts/reel-mobile-contrast.mjs                (dev server on :3000)
 *   node scripts/reel-mobile-contrast.mjs --tag after
 *
 * No image dependency: the decode happens in a blank Chrome page via
 * createImageBitmap + getImageData.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/reel-mobile";
const tagArg = process.argv.indexOf("--tag");
const TAG = tagArg > -1 ? process.argv[tagArg + 1] : "before";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Beats worth checking: the title landing, then each row's rise, then the recede.
const BEATS = [0.34, 0.45, 0.6, 0.72, 0.82];
const DPR = 2;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
await sleep(2500); // let the frame loader decode

// A second page used purely as an image decoder.
const lab = await browser.newPage();
await lab.goto("about:blank");

const beats = [];

for (const beat of BEATS) {
  await page.evaluate((p) => {
    const sec = document.querySelector("#currently");
    const rect = sec.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const start = top - 64;
    const end = top + sec.offsetHeight - window.innerHeight;
    window.scrollTo({ top: start + (end - start) * p, behavior: "instant" });
  }, beat);
  await sleep(900);

  const file = `${OUT}/${TAG}-${String(beat).replace(".", "_")}.png`;
  await page.screenshot({ path: file });

  const boxes = await page.evaluate(() => {
    // getComputedStyle().color is NOT always rgb(0-255): a color-mix() resolves
    // to `color(srgb 0.78 0.78 0.79)` with 0-1 floats. Reading those as 0-255
    // reports a near-white grey as near-black, which makes a well-lit line look
    // like a 1.0:1 failure. Normalise both forms to 0-255.
    const parse = (s) => {
      const n = (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      return s.startsWith("color(") ? n.map((v) => Math.round(v * 255)) : n;
    };
    const section = document.querySelector("#currently");
    return Array.from(section.querySelectorAll("h2, p, dd, span"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return (
          r.width > 24 && r.height > 6 &&
          r.top > 0 && r.bottom < window.innerHeight &&
          cs.display !== "none" && cs.visibility !== "hidden" &&
          parseFloat(cs.opacity) > 0.5 &&
          (el.textContent || "").trim().length > 2 &&
          // Allow a <dd> that wraps spans: FlapText splits its value into
          // per-character spans, each too narrow to survive the width filter, so
          // excluding any element with span children would silently drop the
          // board's actual CONTENT: the most important text on the panel.
          !el.querySelector("h2, p, dd")
        );
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        // Gradient-clipped type (.text-spectrum) paints its glyphs from a
        // background-image and sets the fill transparent, so `color` is
        // rgba(0,0,0,0), reading that as the text colour reports a legible
        // violet-on-black headline as a 1.3:1 failure. The real colours are the
        // gradient's own stops; judge it by its DARKEST stop, the worst case.
        const fill = cs.webkitTextFillColor || cs.color;
        const transparent = /rgba?\([^)]*,\s*0\s*\)/.test(fill);
        let color = parse(fill);
        let gradient = false;
        if (transparent && cs.backgroundImage && cs.backgroundImage !== "none") {
          const stops = (cs.backgroundImage.match(/(?:rgba?|color)\([^)]*\)/g) || [])
            .map(parse)
            .filter((c) => c.length === 3);
          if (stops.length) {
            const l = ([r2, g2, b2]) => 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
            color = stops.reduce((a, b) => (l(a) <= l(b) ? a : b));
            gradient = true;
          }
        }
        return {
          text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 36),
          color,
          gradient,
          fontSize: parseFloat(cs.fontSize),
          weight: Number(cs.fontWeight) || 400,
          box: { x: r.x, y: r.y, w: r.width, h: r.height },
        };
      })
      // A <dd> and a span filling it occupy the same rect; keep one.
      .filter((m, i, all) => {
        const key = (o) => `${Math.round(o.box.x)},${Math.round(o.box.y)},${Math.round(o.box.w)}`;
        return all.findIndex((o) => key(o) === key(m)) === i;
      });
  });

  // Re-shoot with the board's TEXT hidden but everything behind it untouched.
  // Sampling the lit screenshot would find the glyphs themselves as the
  // "lightest pixel" and report a meaningless 1.00:1; the backdrop has to be
  // photographed on its own. Layout is preserved (visibility, not display), so
  // the boxes measured above still line up exactly.
  // Injected by hand, not page.addStyleTag: that helper ignores an `id`, so the
  // probe sheet would survive removal and blank the board for every later beat.
  await page.evaluate(() => {
    const s = document.createElement("style");
    s.id = "contrast-probe";
    s.textContent =
      "#currently h2, #currently p, #currently dd, #currently dt, #currently span { visibility: hidden !important; }";
    document.head.appendChild(s);
  });
  await sleep(120);
  const shot = await page.screenshot({ encoding: "base64" });
  await page.evaluate(() => document.getElementById("contrast-probe")?.remove());
  await sleep(80);

  // Decode the backdrop-only shot once and sample the lightest pixel per box.
  const sampled = await lab.evaluate(
    async (b64, boxes, dpr) => {
      const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
      const bmp = await createImageBitmap(blob);
      const cv = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = cv.getContext("2d");
      ctx.drawImage(bmp, 0, 0);
      const srgb = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
      return boxes.map((m) => {
        const x = Math.max(0, Math.round(m.box.x * dpr));
        const y = Math.max(0, Math.round(m.box.y * dpr));
        const w = Math.min(Math.round(m.box.w * dpr), cv.width - x);
        const h = Math.min(Math.round(m.box.h * dpr), cv.height - y);
        if (w <= 0 || h <= 0) return null;
        const d = ctx.getImageData(x, y, w, h).data;
        let lightest = [0, 0, 0];
        for (let i = 0; i < d.length; i += 4) {
          const px = [d[i], d[i + 1], d[i + 2]];
          if (lum(px) > lum(lightest)) lightest = px;
        }
        return lightest;
      });
    },
    shot,
    boxes,
    DPR,
  );

  beats.push({ beat, boxes, sampled });
}

await browser.close();

const srgb = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
};

console.log(`\n=== reel mobile contrast (${TAG}): 390x844, worst-case backdrop pixel ===`);
let worst = Infinity;
let worstLine = "";
let lowCount = 0;
for (const { beat, boxes, sampled } of beats) {
  console.log(`\n-- scroll ${beat}`);
  boxes.forEach((m, i) => {
    const bg = sampled[i];
    if (!bg) return;
    const c = contrast(m.color, bg);
    // WCAG large text = >=24px, or >=18.66px bold.
    const large = m.fontSize >= 24 || (m.fontSize >= 18.66 && m.weight >= 700);
    const min = large ? 3 : 4.5;
    const ok = c >= min;
    if (!ok) lowCount++;
    if (c < worst) { worst = c; worstLine = `"${m.text}" @ ${beat}`; }
    console.log(
      `   ${ok ? "ok  " : "LOW "} ${c.toFixed(2)}:1 (min ${min})  ${m.fontSize}px${m.gradient ? "  [gradient, darkest stop]" : ""}  "${m.text}"`,
    );
  });
}
console.log(`\n${lowCount} line(s) below their WCAG minimum`);
console.log(`worst: ${worst.toFixed(2)}:1: ${worstLine}`);
console.log(`shots in ${OUT} (tag: ${TAG})`);
