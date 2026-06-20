import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--no-sandbox", "--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

const routes = [
  ["home", "/"],
  ["contact", "/contact"],
  ["work", "/work"],
  ["case-voyager", "/work/voyager"],
];

// rAF frame-time sampler installed in-page.
const START = () => {
  window.__f = [];
  let last = performance.now();
  const tick = (t) => { window.__f.push(t - last); last = t; window.__raf = requestAnimationFrame(tick); };
  window.__raf = requestAnimationFrame(tick);
};
const STOP = () => { cancelAnimationFrame(window.__raf); const f = window.__f.slice(5);
  const n = f.length, avg = f.reduce((a,b)=>a+b,0)/n;
  const j16 = f.filter(x=>x>16.8).length, j33 = f.filter(x=>x>33).length, worst = Math.max(...f);
  return { n, fps: +(1000/avg).toFixed(1), jank16pct: +(100*j16/n).toFixed(0), jank33pct: +(100*j33/n).toFixed(0), worstMs: +worst.toFixed(0) };
};

console.log("route            phase    | mainJS%/s  recalc/s layout/s | fps  jank>16  jank>33  worst");
console.log("-".repeat(95));

for (const [name, path] of routes) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(2000); // let entrance settle

  for (const phase of ["idle", "scroll"]) {
    const m0 = await page.metrics();
    await page.evaluate(START);
    const WIN = 4000;
    if (phase === "scroll") {
      const end = Date.now() + WIN;
      while (Date.now() < end) { await page.mouse.wheel({ deltaY: 60 }); await sleep(28); }
    } else {
      await sleep(WIN);
    }
    const stats = await page.evaluate(STOP);
    const m1 = await page.metrics();
    const secs = (m1.Timestamp - m0.Timestamp);
    const scriptPct = (100 * (m1.ScriptDuration - m0.ScriptDuration) / secs).toFixed(0);
    const recalc = ((m1.RecalcStyleCount - m0.RecalcStyleCount) / secs).toFixed(0);
    const layout = ((m1.LayoutCount - m0.LayoutCount) / secs).toFixed(0);
    console.log(
      `${name.padEnd(15)} ${phase.padEnd(7)} | ${String(scriptPct).padStart(7)}%  ${String(recalc).padStart(7)} ${String(layout).padStart(7)} | ${String(stats.fps).padStart(4)} ${String(stats.jank16pct).padStart(6)}% ${String(stats.jank33pct).padStart(7)}% ${String(stats.worstMs).padStart(5)}ms`
    );
    // reset scroll to top for next phase
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
  }
  await page.close();
}
await browser.close();
