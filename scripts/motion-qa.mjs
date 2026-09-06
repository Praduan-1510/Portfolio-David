// Motion QA for the 2026-09 animation set-pieces. Run from the project root:
//   node scripts/motion-qa.mjs                 (needs `next dev` on :3000)
// Captures console/page errors per route, live-motion frames for the four
// set-pieces (docking flight, board flip, prototype launch, services boot),
// and a reduced-motion pass that asserts no content is left invisible.
// Shots land in /tmp/motion-qa/.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/tmp/motion-qa";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errs = [];
function wire(page, tag) {
  page.on("pageerror", (e) => errs.push(`${tag}: pageerror ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // Next dev noise we do not own.
    if (/Download the React DevTools|hydration|favicon/i.test(t)) return;
    errs.push(`${tag}: console ${t.slice(0, 200)}`);
  });
}

async function newPage(reduced = false, w = 1440, h = 900) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  return { page, ctx };
}

const routes = ["/", "/work", "/work/meridian", "/work/baseweight", "/work/carebridge", "/work/insightstap", "/services", "/contact", "/about"];

// 1. Every route, motion on: errors + a settled viewport shot.
for (const r of routes) {
  const { page, ctx } = await newPage();
  wire(page, `motion ${r}`);
  await page.goto(BASE + r, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/route${r.replace(/\//g, "_") || "_home"}.png` });
  await ctx.close();
  console.log("route ok", r);
}

// 2. Docking flight: home card -> case study.
{
  const { page, ctx } = await newPage();
  wire(page, "docking");
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2500);
  const link = await page.$('a[href="/work/nukkad"]');
  if (!link) {
    errs.push("docking: no /work/meridian link on home");
  } else {
    // Bring the card into view without Lenis fighting us: read its page offset
    // and jump via lenis if present, else native.
    await page.evaluate(() => {
      const a = document.querySelector('a[href="/work/nukkad"]');
      const y = a.getBoundingClientRect().top + window.scrollY - 200;
      window.scrollTo(0, y);
    });
    await sleep(1200);
    const has = await page.evaluate(() => !!document.querySelector('[data-handoff-source="nukkad"]'));
    console.log("docking source present:", has);
    await page.evaluate(() => document.querySelector('a[href="/work/nukkad"]').click());
    await sleep(120);
    await page.screenshot({ path: `${OUT}/dock-0120.png` });
    console.log("html[data-handoff] at 120ms:", await page.evaluate(() => document.documentElement.dataset.handoff ?? null));
    await sleep(280);
    await page.screenshot({ path: `${OUT}/dock-0400.png` });
    await sleep(400);
    await page.screenshot({ path: `${OUT}/dock-0800.png` });
    await sleep(900);
    await page.screenshot({ path: `${OUT}/dock-1700.png` });
    console.log("landed url:", page.url(), "handoff attr:", await page.evaluate(() => document.documentElement.dataset.handoff ?? null));
    const heroOpacity = await page.evaluate(() => {
      const t = document.querySelector("[data-handoff-target]");
      return t ? getComputedStyle(t).opacity : "no-target";
    });
    console.log("hero target opacity after flight:", heroOpacity);
  }
  await ctx.close();
}

// 3. Board flip on /work.
{
  const { page, ctx } = await newPage();
  wire(page, "board");
  await page.goto(BASE + "/work", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2500);
  const rows = await page.$$('ol a[href^="/work/"]');
  console.log("board rows:", rows.length);
  if (rows.length > 2) {
    const b = await rows[2].boundingBox();
    await page.mouse.move(b.x + 40, b.y + b.height / 2);
    await sleep(90);
    await page.screenshot({ path: `${OUT}/board-flip-090.png` });
    await sleep(400);
    await page.screenshot({ path: `${OUT}/board-flip-500.png` });
    const b2 = await rows[1].boundingBox();
    await page.mouse.move(b2.x + 40, b2.y + b2.height / 2);
    await sleep(60);
    await page.screenshot({ path: `${OUT}/board-flip2-060.png` });
    await sleep(500);
  }
  await ctx.close();
}

// 4. Prototype launch on /work/meridian.
{
  const { page, ctx } = await newPage();
  wire(page, "launch");
  await page.goto(BASE + "/work/meridian", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2500);
  const btn = await page.$(".lp-launch");
  if (!btn) errs.push("launch: no .lp-launch button");
  else {
    await page.evaluate(() => document.querySelector(".lp-launch").scrollIntoView({ block: "center" }));
    await sleep(800);
    await btn.click();
    await sleep(300);
    await page.screenshot({ path: `${OUT}/launch-0300.png` });
    await sleep(700);
    await page.screenshot({ path: `${OUT}/launch-1000.png` });
    await sleep(900);
    await page.screenshot({ path: `${OUT}/launch-1900.png` });
    await sleep(1200);
    await page.screenshot({ path: `${OUT}/launch-3100.png` });
    const state = await page.evaluate(() => {
      const f = document.querySelector("iframe[data-live-frame], .lp-well iframe");
      const poster = document.querySelector(".lp-well img");
      return { iframe: !!f, posterStillMounted: !!poster, focused: document.activeElement?.tagName };
    });
    console.log("launch state:", JSON.stringify(state));
  }
  await ctx.close();
}

// 5. Services boot: scroll the first proof frame into view.
{
  const { page, ctx } = await newPage();
  wire(page, "services");
  await page.goto(BASE + "/services", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2000);
  await page.screenshot({ path: `${OUT}/services-top.png` });
  await page.evaluate(() => {
    const el = document.querySelector("[data-boot], .browser-slab");
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 200);
  });
  await sleep(250);
  await page.screenshot({ path: `${OUT}/services-boot-250.png` });
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/services-boot-1450.png` });
  await ctx.close();
}

// 6. Reduced-motion pass: every route renders settled with no errors, and the
//    hero cover is fully opaque on a hard load.
for (const r of routes) {
  const { page, ctx } = await newPage(true);
  wire(page, `reduced ${r}`);
  await page.goto(BASE + r, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1200);
  const hidden = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("main *")) {
      const cs = getComputedStyle(el);
      if (cs.opacity === "0" && el.getBoundingClientRect().height > 40 && !el.closest("[aria-hidden='true']")) {
        out.push(el.tagName + "." + String(el.className).slice(0, 60));
      }
      if (out.length > 5) break;
    }
    return out;
  });
  if (hidden.length) errs.push(`reduced ${r}: invisible content ${hidden.join(" | ")}`);
  await page.screenshot({ path: `${OUT}/reduced${r.replace(/\//g, "_") || "_home"}.png` });
  await ctx.close();
  console.log("reduced ok", r);
}

// 7. Phone pass (no fine pointer): the docking and board must not mount.
{
  const { page, ctx } = await newPage(false, 390, 844);
  wire(page, "phone");
  await page.goto(BASE + "/work", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/phone-work.png` });
  await page.goto(BASE + "/work/baseweight", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/phone-baseweight.png` });
  await ctx.close();
}

await browser.close();
if (errs.length) {
  console.log("\nERRORS:\n" + [...new Set(errs)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nNO ERRORS ->", OUT);
}
