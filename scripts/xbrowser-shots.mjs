import { chromium, webkit, firefox } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.URL || "http://localhost:3000/";
const OUT = "/tmp/xbrowser";
mkdirSync(OUT, { recursive: true });

const engines = { chromium, webkit, firefox };

// Scroll offsets (px) to probe the reel choreography reveal.
const OFFSETS = [0, 600, 1200, 1800, 2400, 3000];

async function run(name, type) {
  const browser = await type.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(URL, { waitUntil: "networkidle" }).catch((e) => errors.push("GOTO: " + e.message));
  await page.waitForTimeout(1500);

  for (const y of OFFSETS) {
    // Real wheel-driven scroll so Lenis/ScrollTrigger advance, then settle.
    await page.evaluate((target) => window.scrollTo(0, target), y);
    // Nudge with a wheel tick to make Lenis pick up the position.
    await page.mouse.wheel(0, 1);
    await page.waitForTimeout(900);
    const info = await page.evaluate(() => {
      const sec = document.getElementById("currently");
      const title = document.querySelector('#currently h2');
      const t = title ? getComputedStyle(title) : null;
      const rect = title?.getBoundingClientRect();
      return {
        scrollY: Math.round(window.scrollY),
        titleFound: !!title,
        titleOpacity: t?.opacity,
        titleVisibility: t?.visibility,
        titleDisplay: title ? getComputedStyle(title.parentElement).display : null,
        titleTop: rect ? Math.round(rect.top) : null,
        secH: sec ? Math.round(sec.getBoundingClientRect().height) : null,
      };
    });
    console.log(`[${name}] y=${y} ->`, JSON.stringify(info));
    await page.screenshot({ path: `${OUT}/${name}-${String(y).padStart(4, "0")}.png` });
  }

  // Mobile viewport check.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-mobile-top.png` });

  if (errors.length) console.log(`[${name}] ERRORS:\n  ` + errors.join("\n  "));
  else console.log(`[${name}] no console/page errors`);

  await browser.close();
}

for (const [name, type] of Object.entries(engines)) {
  try {
    await run(name, type);
  } catch (e) {
    console.log(`[${name}] FATAL: ${e.message}`);
  }
}
console.log("DONE -> " + OUT);
