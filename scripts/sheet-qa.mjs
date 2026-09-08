// Checks the work index's contact sheet (the graphics beat).
// Usage: node scripts/sheet-qa.mjs      (needs `next dev` on :3000)
//
// The section is a picker with an auto-advancing plate, so the things worth
// asserting are the ones that quietly rot: that it fits every viewport, that
// the sheet lays out on a column count that divides evenly into eighteen
// (seventeen frames plus the way-in tile), that the chinagraph ring is present,
// that the keyboard drives it, and that reduced motion stops it moving and
// takes the transport away rather than leaving a dead Pause button.
import { chromium } from "playwright";

const URL = "http://localhost:3000/work";
const SIZES = [
  ["desktop", 1440, 900],
  ["laptop", 1280, 720],
  ["tablet", 834, 1112],
  ["phone", 390, 844],
  ["small", 320, 640],
  ["landscape", 844, 390],
];

const fails = [];
const browser = await chromium.launch();

for (const [name, width, height] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fails.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && fails.push(`${name}: ${m.text()}`));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator("#graphics").scrollIntoViewIfNeeded();
  // Lenis forces scroll-behavior:auto and swallows programmatic scrolls; one
  // wheel tick hands it a real event so the section settles where it belongs.
  await page.mouse.wheel(0, 1);
  await page.waitForTimeout(1600);

  const m = await page.evaluate(() => {
    const sec = document.querySelector("#graphics");
    const cells = [...sec.querySelectorAll("[data-frame]")];
    const cols = getComputedStyle(sec.querySelector("[role='group']"))
      .gridTemplateColumns.split(" ").length;
    const box = (el) => el.getBoundingClientRect();
    return {
      frames: cells.length,
      cols,
      cell: Math.round(box(cells[0]).width),
      ring: !!sec.querySelector(".grease-ring"),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      broken: [...sec.querySelectorAll("img")]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.getAttribute("src")),
      small: [...sec.querySelectorAll("button, a")]
        .map((el) => {
          const b = box(el);
          const cs = getComputedStyle(el, "::before");
          const grown = cs.content !== "none";
          const ix = grown ? parseFloat(cs.insetInlineStart) || 0 : 0;
          const iy = grown ? parseFloat(cs.insetBlockStart) || 0 : 0;
          return {
            t: el.textContent.trim().slice(0, 16),
            w: Math.round(b.width - 2 * ix),
            h: Math.round(b.height - 2 * iy),
          };
        })
        .filter((x) => x.w < 44 || x.h < 44),
    };
  });

  if (m.frames !== 17) fails.push(`${name}: ${m.frames} frames, expected 17`);
  if (18 % m.cols !== 0) fails.push(`${name}: ${m.cols} columns leaves the sheet ragged`);
  if (!m.ring) fails.push(`${name}: no chinagraph ring on the selected frame`);
  if (m.overflow > 0) fails.push(`${name}: document overflows by ${m.overflow}px`);
  if (m.broken.length) fails.push(`${name}: broken image(s) ${m.broken.join(", ")}`);
  if (m.small.length) fails.push(`${name}: hit area under 44px ${JSON.stringify(m.small)}`);
  console.log(
    `${name.padEnd(10)} ${m.cols} cols · ${m.cell}px cells · overflow ${m.overflow}`,
  );
  await ctx.close();
}

// Keyboard: arrows move the selection AND the focus with it.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fails.push(`keyboard: ${e.message}`));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator("[data-frame='0']").focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const kb = await page.evaluate(() => ({
    pressed: document.querySelector('[aria-pressed="true"]')?.getAttribute("data-frame"),
    focused: document.activeElement?.getAttribute("data-frame"),
  }));
  if (kb.pressed !== "3" || kb.focused !== "3")
    fails.push(`keyboard: ArrowRight x3 landed on ${JSON.stringify(kb)}, expected 3 / 3`);
  await page.keyboard.press("End");
  await page.waitForTimeout(300);
  const end = await page.evaluate(() =>
    document.querySelector('[aria-pressed="true"]')?.getAttribute("data-frame"),
  );
  if (end !== "16") fails.push(`keyboard: End landed on ${end}, expected 16`);
  console.log(`keyboard   arrows ${kb.pressed}/${kb.focused} · End ${end}`);
  await ctx.close();
}

// Reduced motion: nothing advances on its own, and the transport is gone.
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fails.push(`reduced: ${e.message}`));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator("#graphics").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const before = await page.locator('[aria-pressed="true"]').getAttribute("data-frame");
  await page.waitForTimeout(5000);
  const after = await page.locator('[aria-pressed="true"]').getAttribute("data-frame");
  const transport = await page.locator("#graphics button", { hasText: "Pause" }).count();
  if (before !== after) fails.push(`reduced: advanced ${before} -> ${after}`);
  if (transport !== 0) fails.push(`reduced: ${transport} transport control(s) still rendered`);
  console.log(`reduced    frame held at ${after} · ${transport} transport controls`);
  await ctx.close();
}

await browser.close();
if (fails.length) {
  console.log("\nFAILURES:\n" + [...new Set(fails)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nALL DONE");
}
