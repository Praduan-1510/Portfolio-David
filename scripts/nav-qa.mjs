// Client-navigation QA. Run from the project root:
//   node scripts/nav-qa.mjs                    (needs `next dev` on :3000)
// The 2026-09 route crash only happened on SOFT navigation into a case study
// from a deep-scrolled page (a synchronously created ScrollTrigger; see
// components/motion/AnimatedDivider.tsx). Drives real client navigations from
// the board, the home grid and a study's next-project teaser, collects page
// errors, and logs the docking (HandoffLayer) states. Shots in /tmp/motion-qa/.
import puppeteer from "puppeteer-core";
const OUT = "/tmp/motion-qa";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--no-sandbox"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [];
async function run(tag, startUrl, selector, shots) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`${tag}: pageerror ${e.message.slice(0, 160)}`));
  page.on("console", (m) => m.type() === "error" && !/DevTools|favicon/.test(m.text()) && errs.push(`${tag}: console ${m.text().slice(0, 160)}`));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(startUrl, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2500);
  // Deep-scroll first so the new route's triggers are created while the page
  // is still scrolled (the condition that crashed).
  await page.evaluate(() => window.scrollTo(0, 2400));
  await sleep(1200);
  const el = await page.$(selector);
  if (!el) { errs.push(`${tag}: selector ${selector} not found`); await ctx.close(); return; }
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), selector);
  await sleep(1000);
  const src = await page.evaluate((sel) => { const a = document.querySelector(sel); const s = a.querySelector("[data-handoff-source]") || a.closest("[data-handoff-source]"); return s ? s.getAttribute("data-handoff-source") : null; }, selector);
  await page.evaluate((sel) => document.querySelector(sel).click(), selector);
  const states = [];
  for (const t of [100, 350, 650, 1000, 1800]) {
    await sleep(t - (states.length ? [100, 350, 650, 1000, 1800][states.length - 1] : 0));
    states.push(`${t}ms handoff=${await page.evaluate(() => document.documentElement.dataset.handoff ?? "-")} landed=${await page.evaluate(() => "handoffLanded" in document.documentElement.dataset)} clone=${await page.evaluate(() => !!document.querySelector(".handoff-clone"))}`);
    if (shots) await page.screenshot({ path: `${OUT}/${tag}-${t}.png` });
  }
  const after = await page.evaluate(() => ({
    url: location.pathname,
    errorBoundary: /couldn.t load|Something went wrong/i.test(document.body.innerText),
    hero: !!document.querySelector("header"),
    target: (() => { const t = document.querySelector("[data-handoff-target]"); return t ? getComputedStyle(t).opacity : "none"; })(),
    h1: document.querySelector("h1")?.textContent?.trim().slice(0, 40),
  }));
  console.log(tag, "| source:", src, "|", states.join(" | "), "|", JSON.stringify(after));
  await ctx.close();
}
await run("board-to-nukkad", "http://localhost:3000/work", 'ol a[href="/work/nukkad"]', true);
await run("board-to-baseweight", "http://localhost:3000/work", 'ol a[href="/work/baseweight"]', false);
await run("home-to-nukkad", "http://localhost:3000/", 'a[href="/work/nukkad"]', true);
await run("home-to-baseweight", "http://localhost:3000/", 'a[href="/work/baseweight"]', false);
await run("study-to-next", "http://localhost:3000/work/nukkad", 'section a.group[href^="/work/"]', false);
await browser.close();
console.log(errs.length ? "ERRORS:\n" + [...new Set(errs)].join("\n") : "NO PAGE ERRORS");
