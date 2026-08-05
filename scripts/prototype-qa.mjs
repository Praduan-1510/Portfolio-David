// End-to-end QA for the live-prototype embed on /work/meridian.
// Usage: node scripts/prototype-qa.mjs        (needs `next dev` on :3000)
//
// Motion is deliberately left ON: prefers-reduced-motion skips Lenis entirely,
// so a reduced-motion run would pass the pointer-events tests for the wrong
// reason. Everything here is asserted against the real smooth-scroll setup.
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:3000/work/meridian";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}${detail ? `: ${detail}` : ""}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? `: ${detail}` : ""}`);
  }
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const requests = [];
page.on("request", (r) => requests.push(r.url()));
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));

await page.goto(URL, { waitUntil: "networkidle0", timeout: 45000 });
await sleep(1200);

console.log("\n1. Deferred activation");
ok("no iframe before launch", (await page.$$("iframe")).length === 0);
ok(
  "prototype HTML not requested",
  !requests.some((u) => u.includes("/prototype/meridian/")),
);
ok(
  "prototype webfonts not requested",
  !requests.some((u) => u.includes("fonts.googleapis.com")),
);

console.log("\n2. Lenis state at rest");
const restClasses = await page.evaluate(() => document.documentElement.className);
ok("html has no lenis-smooth at rest", !restClasses.includes("lenis-smooth"), `class="${restClasses}"`);

console.log("\n3. Launch");
await page.evaluate(() => {
  document.querySelector(".lp-launch")?.scrollIntoView({ block: "center" });
});
await sleep(1400);
await page.click(".lp-launch");
await page.waitForSelector("iframe[data-live-frame]", { timeout: 10000 });
const frameEl = await page.$("iframe[data-live-frame]");
let frame = await frameEl.contentFrame();
await frame.waitForSelector("#gate", { timeout: 15000 });
await sleep(900);
ok("iframe mounted", !!frame);
ok(
  "prototype HTML now requested",
  requests.some((u) => u.includes("/prototype/meridian/app.html")),
);

console.log("\n4. Clicks reach the running app");
// NOTE: puppeteer's elementHandle.click() adds the iframe's page offset WITHOUT
// applying its CSS scale, so it lands in the wrong place inside a scaled frame.
// That is a harness bug, not a product one: real hit-testing maps through the
// transform correctly, which is exactly what these helpers use real mouse events
// at manually-mapped coordinates to prove.
const frameScale = () =>
  page.evaluate(
    () =>
      new DOMMatrix(
        getComputedStyle(document.querySelector("iframe[data-live-frame]")).transform,
      ).a,
  );
async function pointIn(sel) {
  const box = await (await page.$("iframe[data-live-frame]")).boundingBox();
  const s = await frameScale();
  const f = await (await page.$("iframe[data-live-frame]")).contentFrame();
  const r = await f.evaluate((q) => {
    const e = document.querySelector(q);
    const b = e.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }, sel);
  return { x: box.x + r.x * s, y: box.y + r.y * s };
}
async function clickIn(sel) {
  const p = await pointIn(sel);
  await page.mouse.click(p.x, p.y);
}

await clickIn('[data-auth="submit"]');
await frame.waitForSelector('[data-otp="0"]', { timeout: 5000 });
ok("real click reached the frame", true, "sign-in → MFA");
for (let i = 0; i < 6; i++) await frame.type(`[data-otp="${i}"]`, String(i + 1));
await clickIn('[data-auth="verify"]');
await frame.waitForSelector("#app:not(.hidden)", { timeout: 5000 });
ok("signed in through the frame", true, "gate → MFA → app");

console.log("\n4b. Hit-test precision through the CSS scale");
// The scaled iframe's real risk is coordinate drift: if the browser mis-maps
// pointer positions through the transform, everything (including the Board's
// native drag-and-drop, whose dragover targets resolve on the same hit-testing
// pipeline) lands on the wrong element. This probes points spread across the
// frame (cards at the top, middle and bottom of the board, nav items down the
// sidebar) and asserts each one hit-tests to exactly the intended element.
//
// Native HTML5 DnD itself is NOT asserted here: headless Chrome doesn't
// synthesise it at all: verified by control runs against the prototype
// directly, with no iframe and no scale, where the same drag also does nothing.
// It needs a human click-through. If it ever does misbehave at fractional
// scale, the fix is to cap the scale at 1 rather than to change the mapping.
await frame.evaluate(() => {
  /* eslint-disable no-undef */
  go("all");
  S.mode = "board";
  render();
});
await sleep(1500);
await frame.evaluate(() => {
  window.__hits = [];
  document.addEventListener(
    "mousedown",
    (e) => {
      const c = e.target.closest("[data-card],[data-nav]");
      window.__hits.push(c ? c.dataset.card || c.dataset.nav : "(none)");
    },
    true,
  );
});
const probes = await frame.evaluate(() => {
  const inView = (e) => {
    const b = e.getBoundingClientRect();
    return b.top > 4 && b.bottom < 796 && b.left > 4 && b.right < 1276;
  };
  const out = [];
  const cards = [...document.querySelectorAll(".bcard")].filter(inView);
  for (const c of [cards[0], cards[Math.floor(cards.length / 2)], cards[cards.length - 1]])
    if (c) out.push({ sel: `.bcard[data-card="${c.dataset.card}"]`, want: c.dataset.card });
  for (const n of ["home", "settings", "billing", "members"]) {
    const e = document.querySelector(`[data-nav="${n}"]`);
    if (e && inView(e)) out.push({ sel: `[data-nav="${n}"]`, want: n });
  }
  return out;
});
// mousedown on the target, mouseup far away: the hit-test is recorded but no
// click fires, so the app never navigates and the layout holds still between probes.
for (const t of probes) {
  const q = await pointIn(t.sel);
  await page.mouse.move(q.x, q.y);
  await page.mouse.down();
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await sleep(200);
}
const hits = await frame.evaluate(() => window.__hits);
const hitOk = probes.filter((t, i) => hits[i] === t.want).length;
ok(
  "every probe hit its intended element",
  hitOk === probes.length,
  `${hitOk}/${probes.length} at scale ${(await frameScale()).toFixed(3)}`,
);

console.log("\n5. The Lenis regression case (wheel, then click immediately)");
await page.mouse.move(720, 480);
await page.mouse.wheel({ deltaY: 260 });
// No sleep on purpose: this is the coast window where the stock Lenis rule
// makes every iframe pointer-events:none.
const pe = await page.evaluate(
  () => getComputedStyle(document.querySelector("iframe[data-live-frame]")).pointerEvents,
);
ok("iframe stays clickable mid-scroll", pe === "auto", `pointer-events: ${pe}`);
await sleep(600);

console.log("\n6. Device switcher changes the real layout viewport");
for (const [label, want] of [["Tablet", 834], ["Phone", 390], ["Desktop", 1280]]) {
  const clicked = await page.evaluate((l) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith(l));
    if (!b) return false;
    b.click();
    return true;
  }, label);
  await sleep(800);
  frame = await (await page.$("iframe[data-live-frame]")).contentFrame();
  const state = await frame.evaluate(() => ({
    w: window.innerWidth,
    mobileShell: matchMedia("(max-width: 860px)").matches,
    signedIn: !document.querySelector("#app").classList.contains("hidden"),
    stored: !!localStorage.getItem("meridian-b"),
  }));
  ok(`${label}: clicked`, clicked);
  ok(`${label}: iframe innerWidth is ${want}`, state.w === want, `got ${state.w}`);
  ok(
    `${label}: mobile shell ${want <= 860 ? "on" : "off"}`,
    state.mobileShell === want <= 860,
  );
  ok(`${label}: app state survived the resize`, state.signedIn && state.stored);
}

console.log("\n7. Tabs");
for (const [label, file] of [["Design system", "design-system.html"], ["Build plan", "build-plan.html"]]) {
  await page.evaluate((l) => {
    [...document.querySelectorAll('[role="tab"]')].find((x) => x.textContent.trim().startsWith(l))?.click();
  }, label);
  await sleep(1400);
  const src = await page.evaluate(
    () => document.querySelector("iframe[data-live-frame]")?.getAttribute("src"),
  );
  ok(`${label} tab loads`, src?.endsWith(file), src);
}

console.log("\n8. Layout");
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
ok("no horizontal overflow at 1440", overflow <= 0, `${overflow}px`);

for (const w of [390, 768, 1024]) {
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await sleep(600);
  const o = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(`no horizontal overflow at ${w}`, o <= 0, `${o}px`);
}

console.log("\n9. Small-screen fallback (fresh load at 390)");
const small = await browser.newPage();
await small.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await small.goto(URL, { waitUntil: "networkidle0", timeout: 45000 });
await sleep(900);
const fb = await small.evaluate(() => {
  const btn = document.querySelector(".lp-launch");
  return {
    launchHidden: !btn || getComputedStyle(btn).display === "none",
    iframes: document.querySelectorAll("iframe").length,
  };
});
ok("launch button hidden below sm", fb.launchHidden);
ok("no iframe on small screens", fb.iframes === 0);
await small.close();

console.log(`\n${fail === 0 ? "ALL PASS" : "FAILURES"}: ${pass} passed, ${fail} failed`);
if (errs.length) console.log("page errors:", [...new Set(errs)].join(" | "));
await browser.close();
process.exit(fail === 0 ? 0 : 1);
