// Quick horizontal-overflow probe for the home hero across widths, incl. the
// landscape-phone short-viewport (the known responsive weak spot). Run from the
// project root so puppeteer-core resolves. QA against `next dev` on :3000.
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const vps = [
  [1440, 900, "desktop"],
  [834, 1112, "tablet"],
  [390, 844, "phone"],
  [320, 690, "phone-xs"],
  [844, 390, "landscape-phone"],
];
let bad = 0;
for (const [w, h, name] of vps) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h });
  await p.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 500));
  const o = await p.evaluate(() => {
    const d = document.documentElement;
    return d.scrollWidth - d.clientWidth;
  });
  if (o > 1) bad++;
  console.log(name.padEnd(16), `${w}x${h}`.padEnd(10), `overflow=${o}px`, o > 1 ? "  <-- OVERFLOW" : "");
  await p.close();
}
await b.close();
console.log(bad ? `\n${bad} viewport(s) overflow` : "\nno horizontal overflow");
