import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/*
 * Measured outcomes for the InsightsTap case study — real Lighthouse numbers
 * against the LIVE production site, not lab claims. 5 runs per page per mode,
 * median reported (single Lighthouse runs are noisy). JSON reports are kept in
 * scripts/lighthouse/reports/ as provenance for every published figure.
 *
 *   node scripts/lighthouse-insightstap.mjs            (5 runs, mobile+desktop)
 *   node scripts/lighthouse-insightstap.mjs --quick    (1 run each, smoke test)
 */

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "scripts/lighthouse/reports";
mkdirSync(OUT, { recursive: true });

const PAGES = [["home", "https://insightstap.com/"]];
const RUNS = process.argv.includes("--quick") ? 1 : 5;
const MODES = ["mobile", "desktop"];

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const results = {};
for (const [name, url] of PAGES) {
  for (const mode of MODES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const out = join(OUT, `${name}-${mode}-${i}.json`);
      const args = [
        "lighthouse",
        url,
        "--only-categories=performance,accessibility,best-practices,seo",
        `--output-path=${out}`,
        "--output=json",
        "--quiet",
        `--chrome-flags=--headless=new --no-sandbox`,
      ];
      if (mode === "desktop") args.push("--preset=desktop");
      execFileSync("npx", args, {
        env: { ...process.env, CHROME_PATH: CHROME },
        stdio: ["ignore", "ignore", "inherit"],
        timeout: 300000,
      });
      const r = JSON.parse(readFileSync(out, "utf8"));
      runs.push({
        perf: Math.round(r.categories.performance.score * 100),
        a11y: Math.round(r.categories.accessibility.score * 100),
        bp: Math.round(r.categories["best-practices"].score * 100),
        seo: Math.round(r.categories.seo.score * 100),
        lcp: r.audits["largest-contentful-paint"].numericValue / 1000,
        cls: r.audits["cumulative-layout-shift"].numericValue,
        tbt: r.audits["total-blocking-time"].numericValue,
        fcp: r.audits["first-contentful-paint"].numericValue / 1000,
      });
      console.log(`${name} ${mode} run ${i + 1}/${RUNS}: perf ${runs.at(-1).perf}, LCP ${runs.at(-1).lcp.toFixed(2)}s, CLS ${runs.at(-1).cls.toFixed(3)}`);
    }
    results[`${name}-${mode}`] = {
      perf: median(runs.map((r) => r.perf)),
      a11y: median(runs.map((r) => r.a11y)),
      bp: median(runs.map((r) => r.bp)),
      seo: median(runs.map((r) => r.seo)),
      lcp: median(runs.map((r) => r.lcp)),
      cls: median(runs.map((r) => r.cls)),
      tbt: median(runs.map((r) => r.tbt)),
      fcp: median(runs.map((r) => r.fcp)),
      runs: RUNS,
    };
  }
}

console.log("\n=== MEDIANS ===");
for (const [key, m] of Object.entries(results)) {
  console.log(
    `${key}: perf ${m.perf} · a11y ${m.a11y} · bp ${m.bp} · seo ${m.seo} · LCP ${m.lcp.toFixed(2)}s · CLS ${m.cls.toFixed(3)} · TBT ${Math.round(m.tbt)}ms · FCP ${m.fcp.toFixed(2)}s (median of ${m.runs})`,
  );
}
console.log(`\nReports: ${OUT}/ (${readdirSync(OUT).length} files)`);
