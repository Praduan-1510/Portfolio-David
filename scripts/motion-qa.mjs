// Motion QA for the 2026-09 animation set-pieces. Run from the project root:
//   node scripts/motion-qa.mjs                 (needs `next dev` on :3000)
// Captures console/page errors per route, live-motion frames for the four
// set-pieces (docking flight, project-card loops + hover, prototype launch,
// services boot), and a reduced-motion pass that asserts no content is left
// invisible and no card loop runs.
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
  const link = await page.$('[data-card] a[href="/work/nukkad"]');
  if (!link) {
    errs.push("docking: no /work/nukkad card on home");
  } else {
    // Bring the card into view with the wheel: Lenis owns scrolling, and a
    // window.scrollTo is snapped back often enough to leave the card off
    // screen, where the layer (correctly) refuses to fly from it.
    await page.mouse.move(720, 450);
    for (let i = 0; i < 60; i++) {
      const top = await page.evaluate(
        () => document.querySelector('[data-card] a[href="/work/nukkad"]').getBoundingClientRect().top,
      );
      if (top > 100 && top < 300) break;
      await page.mouse.wheel({ deltaY: Math.max(-400, Math.min(400, top - 200)) });
      await sleep(200);
    }
    await sleep(1200);
    const has = await page.evaluate(() => !!document.querySelector('[data-handoff-source="nukkad"]'));
    console.log("docking source present:", has);
    // Record the flight's attribute from before the click: a screenshot can
    // take long enough that the flight has already docked (and taken the
    // attribute off) by the time a later read runs.
    await page.evaluate(() => {
      window.__handoffSeen = null;
      new MutationObserver(() => {
        window.__handoffSeen ??= document.documentElement.dataset.handoff ?? null;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-handoff"] });
    });
    // A real click on the card's media, so the hover zoom is in play too.
    const box = await link.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.width * 0.3);
    await sleep(120);
    const armed = await page.evaluate(() => window.__handoffSeen);
    console.log("html[data-handoff] after the click:", armed);
    if (armed !== "nukkad") errs.push("docking: the card click did not start a flight");
    await page.screenshot({ path: `${OUT}/dock-0120.png` });
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

// 3. Project cards on /work: grid shape, in-view loops, hover chip.
//    Every card is an <li data-card> in ProjectGrid; the loop element is the
//    drifting web screenshot (.pc-drift), the scrolling phone screen
//    (.pc-scroll) or the floating phone (.pc-float).
{
  const { page, ctx } = await newPage();
  wire(page, "cards");
  await page.goto(BASE + "/work", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2500);
  const cards = await page.$$("[data-card]");
  const shape = await page.evaluate(() => {
    const els = [...document.querySelectorAll("[data-card]")];
    // Columns = cards sharing the first card's row. (Distinct left edges would
    // over-count: the ragged last row is centred between the columns.)
    const firstTop = els[0] ? Math.round(els[0].getBoundingClientRect().top) : 0;
    return {
      cards: els.length,
      columns: els.filter((c) => Math.round(c.getBoundingClientRect().top) === firstTop).length,
      links: els.filter((c) => c.querySelector('a[href^="/work/"][aria-labelledby]')).length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  console.log("cards:", JSON.stringify(shape));
  if (shape.cards === 0) errs.push("cards: no [data-card] on /work");
  if (shape.columns !== 3) errs.push(`cards: expected 3 columns at 1440, got ${shape.columns}`);
  if (shape.overflow !== 0) errs.push(`cards: horizontal overflow ${shape.overflow}px`);

  // Loops run only on cards in view, and actually move.
  const loopAt = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[data-card]")].map((li) => {
        const el = li.querySelector(".pc-drift, .pc-scroll, .pc-float");
        const r = el?.getBoundingClientRect();
        return {
          playing: li.hasAttribute("data-playing"),
          state: el ? getComputedStyle(el).animationPlayState : null,
          x: r?.left ?? 0,
          y: r?.top ?? 0,
        };
      }),
    );
  const a = await loopAt();
  await sleep(2000);
  const b = await loopAt();
  const moved = a.filter((s, i) => s.playing && (Math.abs(b[i].x - s.x) > 0.2 || Math.abs(b[i].y - s.y) > 0.2)).length;
  const playing = a.filter((s) => s.playing).length;
  const wrong = a.filter((s) => s.state && (s.playing ? s.state !== "running" : s.state !== "paused")).length;
  console.log(`loops: ${playing} playing, ${moved} moved in 2s, ${wrong} in the wrong play state`);
  if (playing === 0 || moved === 0) errs.push("cards: no loop moved on an in-view card");
  if (wrong) errs.push(`cards: ${wrong} loops in the wrong play state`);

  // Hover: the chip slides in over the media.
  if (cards.length > 1) {
    const box = await cards[1].boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.width * 0.3);
    await sleep(600);
    const chip = await cards[1].evaluate((li) => {
      const el = li.querySelector("[data-card-chip]");
      return el ? getComputedStyle(el).opacity : null;
    });
    console.log("hover chip opacity:", chip);
    if (chip !== "1") errs.push(`cards: hover chip opacity ${chip}`);
    await page.screenshot({ path: `${OUT}/cards-hover.png` });
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
  // No project-card loop may even be declared under reduced motion.
  const loops = await page.evaluate(
    () =>
      [...document.querySelectorAll(".pc-drift, .pc-scroll, .pc-float")].filter(
        (el) => getComputedStyle(el).animationName !== "none",
      ).length,
  );
  if (loops) errs.push(`reduced ${r}: ${loops} card loops declared`);
  await page.screenshot({ path: `${OUT}/reduced${r.replace(/\//g, "_") || "_home"}.png` });
  await ctx.close();
  console.log("reduced ok", r);
}

// 7. Phone pass (no fine pointer): the docking must not mount, and the cards
//    are the same grid in one column with no hover chip.
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
