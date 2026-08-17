#!/usr/bin/env node
/*
 * PALETTE AUDIT. Two jobs, both of which the repaint commits previously did by
 * hand in a commit message and could not re-check afterwards:
 *
 *   1. TRACEABILITY. Sample public/Favicon/icon-512.png and print the logo's
 *      own ground and flame ramp, so the palette's provenance is a measurement
 *      rather than a claim. Every primitive in globals.css should be findable
 *      in this output or be a stated extension of it.
 *   2. VERIFICATION. Parse the primitives back OUT of globals.css and compute
 *      the real WCAG ratios and CIEDE2000 separations. The ratios written in
 *      the comments there are only trustworthy if something recomputes them,
 *      and every previous ground change silently invalidated all of them.
 *
 * Usage:  node scripts/palette-audit.mjs [--logo] [--json]
 * Exits non-zero if any assertion fails, so it can gate a commit.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CSS = path.join(ROOT, "src/app/globals.css");
const LOGO = path.join(ROOT, "public/Favicon/icon-512.png");
const WORK = path.join(ROOT, "src/content/work");

/* ---------- colour maths ------------------------------------------------ */

const hexToRgb = (h) => {
  const s = h.replace("#", "").trim();
  const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const rgbToHex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const relLum = ([r, g, b]) => {
  const s = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
};
/* WCAG 2.1 contrast ratio. */
const ratio = (a, b) => {
  const [x, y] = [relLum(hexToRgb(a)), relLum(hexToRgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* sRGB -> CIELAB (D65), needed for a perceptual difference that actually
   tracks how far apart two reds look. Euclidean RGB distance does not. */
const toLab = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

/* CIEDE2000. The full formula on purpose: CIE76 badly understates differences
   in the saturated-red region, which is precisely the region this palette
   lives in, and "is this error colour far enough from the accent" is the one
   question the whole status family depends on. */
const deltaE = (h1, h2) => {
  const [L1, a1, b1] = toLab(h1);
  const [L2, a2, b2] = toLab(h2);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = a1 * (1 + G);
  const ap2 = a2 * (1 + G);
  const Cp1 = Math.hypot(ap1, b1);
  const Cp2 = Math.hypot(ap2, b2);
  const hp = (b, ap) => {
    if (b === 0 && ap === 0) return 0;
    const d = Math.atan2(b, ap) / rad;
    return d >= 0 ? d : d + 360;
  };
  const hp1 = hp(b1, ap1);
  const hp2 = hp(b2, ap2);
  const dL = L2 - L1;
  const dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) {
    dh = hp2 - hp1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh / 2) * rad);
  const Lb = (L1 + L2) / 2;
  const Cpb = (Cp1 + Cp2) / 2;
  let Hb;
  if (Cp1 * Cp2 === 0) Hb = hp1 + hp2;
  else if (Math.abs(hp1 - hp2) <= 180) Hb = (hp1 + hp2) / 2;
  else Hb = hp1 + hp2 < 360 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2 - 360) / 2;
  const T =
    1 -
    0.17 * Math.cos((Hb - 30) * rad) +
    0.24 * Math.cos(2 * Hb * rad) +
    0.32 * Math.cos((3 * Hb + 6) * rad) -
    0.2 * Math.cos((4 * Hb - 63) * rad);
  const dTh = 30 * Math.exp(-(((Hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cpb;
  const Sh = 1 + 0.015 * Cpb * T;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt(
    (dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh),
  );
};

/* Hue angle in Lab, for reporting the warm/cool bias of the neutrals. */
const hueAngle = (hex) => {
  const [, a, b] = toLab(hex);
  const d = (Math.atan2(b, a) * 180) / Math.PI;
  return d < 0 ? d + 360 : d;
};

/* ---------- 1. the logo ------------------------------------------------- */

async function sampleLogo() {
  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    return null; // sharp is a transitive dep; the audit still runs without it
  }
  const { data, info } = await sharp(LOGO).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const at = (x, y) => {
    const i = (y * W + x) * C;
    return [data[i], data[i + 1], data[i + 2]];
  };

  /* The mark: warm, saturated pixels. The ground: everything desaturated. */
  const isMark = ([r, g, b]) => r > 120 && r - b > 60;
  const mark = [];
  const ground = [];
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2) {
      const p = at(x, y);
      (isMark(p) ? mark : ground).push({ p, y });
    }

  const mean = (list) => {
    const s = list.reduce((a, { p }) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]);
    return s.map((v) => v / list.length);
  };
  /* Area-weighted mean of the mark = the single colour that best stands for
     the logo. This is what decides which step of the ramp becomes the voice:
     the flame's tip is the brightest but it is a sliver, and the eye weights
     by area. */
  const markMean = rgbToHex(mean(mark));

  /* The ramp, as the vertical extremes of the mark's own gradient. */
  const ys = mark.map((m) => m.y);
  const [yMin, yMax] = [Math.min(...ys), Math.max(...ys)];
  const band = (lo, hi) => {
    const sel = mark.filter((m) => m.y >= lo && m.y <= hi);
    return sel.length ? rgbToHex(mean(sel)) : null;
  };
  const span = yMax - yMin;
  const ramp = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const c = yMin + t * span;
    return band(c - span * 0.06, c + span * 0.06);
  });

  /* Ground: the vertical extremes, excluding the ember bloom around the mark
     (which is warm on purpose and is the logo's third fact). */
  const gTop = ground.filter((g) => g.y < H * 0.06);
  const gBot = ground.filter((g) => g.y > H * 0.94);
  return {
    markMean,
    ramp,
    groundTop: rgbToHex(mean(gTop)),
    groundBottom: rgbToHex(mean(gBot)),
    markArea: ((mark.length / (mark.length + ground.length)) * 100).toFixed(1),
  };
}

/* ---------- 2. the tokens ---------------------------------------------- */

async function readTokens() {
  const css = await readFile(CSS, "utf8");
  /* Scope to the :root block. Reading the whole file looks like it works and
     does not: the @media print block near the end remaps --device to #ffffff
     (a printed phone must not be a black slab), so an unscoped parse audits
     the PRINT palette while claiming to audit the screen one. */
  const start = css.indexOf(":root {");
  if (start === -1) throw new Error("no :root block in globals.css");
  const end = css.indexOf("\n}", start);
  const root = css.slice(start, end);

  const tokens = new Map();
  /* Primitives only: literal hex values. The semantic layer is var()
     indirection and is resolved by hand in PAIRS below, because that mapping
     is the thing under review. */
  for (const m of root.matchAll(/^\s*(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gm)) {
    tokens.set(m[1], m[2].toLowerCase());
  }
  return tokens;
}

/* ---------- 3. the guest accents ---------------------------------------- */

/* Each case study sets its own --accent in frontmatter, so colour only ever
   appears alongside the work. A guest has three jobs and the palette flip
   put all three at risk at once: it must be legible on the new ground, it
   must not be mistakable for the site's own VOICE (or the reader cannot tell
   the project's colour from the site's), and it must not be mistakable for a
   STATUS (or a brand colour reads as an error). */
async function readGuests() {
  const files = (await readdir(WORK)).filter((f) => f.endsWith(".mdx"));
  const guests = [];
  for (const f of files) {
    const src = await readFile(path.join(WORK, f), "utf8");
    const m = src.match(/^accent:\s*"(#[0-9a-fA-F]{3,6})"/m);
    if (m) guests.push({ slug: f.replace(/\.mdx$/, ""), hex: m[1].toLowerCase() });
  }
  return guests.sort((a, b) => a.slug.localeCompare(b.slug));
}

const AA = 4.5; // normal text
const AA_LARGE = 3; // large text / UI components & graphics (WCAG 1.4.11)

/* Every pair the palette actually depends on. `min` is the bar this pair must
   clear; `note` says what breaks if it does not. */
const PAIRS = [
  ["--bone-50", "--graphite-900", AA, "body type on the ground"],
  ["--bone-50", "--graphite-800", AA, "body type on a card"],
  ["--bone-50", "--graphite-700", AA, "body type in a well"],
  ["--bone-300", "--graphite-900", AA, "secondary type"],
  ["--bone-300", "--graphite-800", AA, "secondary type on a card"],
  ["--bone-500", "--graphite-900", AA, "--muted, which IS body copy in places"],
  ["--bone-500", "--graphite-800", AA, "--muted on a card"],
  ["--bone-500", "--graphite-700", AA, "--muted in a well"],
  ["--bone-700", "--graphite-900", AA_LARGE, "NON-TEXT only: hairlines, rules"],
  ["--flame-500", "--graphite-900", AA, "the voice as text/icon on the ground"],
  ["--flame-500", "--graphite-800", AA, "the voice on a card"],
  ["--flame-400", "--graphite-900", AA, "the ACTIVE step"],
  ["--flame-600", "--graphite-900", AA_LARGE, "deep flame: fills and rules only"],
  ["--graphite-900", "--flame-500", AA, "--on-accent: dark label on a flame fill"],
  ["--graphite-900", "--flame-400", AA, "--on-accent on the active fill"],
  ["--status-error", "--graphite-900", AA, "error text"],
  ["--status-error", "--graphite-800", AA, "error text on a card"],
  ["--status-success", "--graphite-900", AA, "success text"],
];

/* The status family has to be legible AS a status, which is a separation
   problem and not a contrast one. The bar is 20, and the number matters
   enough to justify: the comments in globals.css used to claim 40, but a
   saturated GREEN measures only 39 from this flame, so a bar of 40 demanded
   more separation between two reds than exists between red and green and was
   unmeetable by construction. 20 is roughly ten times the just-noticeable
   difference: nobody confuses two colours that far apart, and it leaves the
   status family somewhere that still reads as alarm and confirmation instead
   of walking a red to lilac to satisfy a number. */
const SEPARATION = 20;

/* ---------- report ----------------------------------------------------- */

const C = process.stdout.isTTY
  ? { ok: "\x1b[32m", bad: "\x1b[31m", dim: "\x1b[2m", b: "\x1b[1m", r: "\x1b[0m" }
  : { ok: "", bad: "", dim: "", b: "", r: "" };

const run = async () => {
  const tokens = await readTokens();
  const failures = [];
  const out = { logo: null, contrast: [], separation: [], neutrals: [] };

  const logo = await sampleLogo();
  out.logo = logo;
  if (logo) {
    console.log(`${C.b}THE LOGO${C.r}  public/Favicon/icon-512.png`);
    console.log(`  ground        ${logo.groundTop} (top) -> ${logo.groundBottom} (bottom)`);
    console.log(`  flame ramp    ${logo.ramp.filter(Boolean).join("  ")}`);
    console.log(
      `  mark mean     ${logo.markMean}   ${C.dim}area-weighted, ${logo.markArea}% of the icon${C.r}`,
    );
    console.log(
      `  bias          ground hue ${hueAngle(logo.groundTop).toFixed(0)}deg, mark hue ${hueAngle(logo.markMean).toFixed(0)}deg`,
    );
    console.log();
  }

  console.log(`${C.b}NEUTRALS${C.r}  ${C.dim}the ground must follow the logo's cool bias${C.r}`);
  for (const name of ["--graphite-950", "--graphite-900", "--graphite-800", "--graphite-700", "--device", "--bone-50"]) {
    const hex = tokens.get(name);
    if (!hex) continue;
    const [r, g, b] = hexToRgb(hex);
    const temp = b > r ? "cool" : b < r ? "warm" : "neutral";
    out.neutrals.push({ name, hex, temp });
    console.log(
      `  ${name.padEnd(16)} ${hex}  L=${relLum(hexToRgb(hex)).toFixed(4)}  ${temp.padEnd(7)} ${C.dim}b-r=${b - r}${C.r}`,
    );
  }
  console.log();

  console.log(`${C.b}CONTRAST${C.r}  ${C.dim}WCAG 2.1${C.r}`);
  for (const [fg, bg, min, note] of PAIRS) {
    const a = tokens.get(fg);
    const b = tokens.get(bg);
    if (!a || !b) {
      failures.push(`missing token in pair ${fg} / ${bg}`);
      console.log(`  ${C.bad}MISSING${C.r} ${fg} / ${bg}`);
      continue;
    }
    const v = ratio(a, b);
    const pass = v >= min;
    if (!pass) failures.push(`${fg} on ${bg} = ${v.toFixed(2)}, needs ${min} (${note})`);
    out.contrast.push({ fg, bg, ratio: +v.toFixed(2), min, pass });
    console.log(
      `  ${pass ? C.ok + "PASS" : C.bad + "FAIL"}${C.r} ${v.toFixed(2).padStart(6)}:1 ${C.dim}(needs ${min})${C.r}  ${fg} on ${bg}  ${C.dim}${note}${C.r}`,
    );
  }
  console.log();

  /* The comments in globals.css annotate each ink with "ground / card". Print
     that exact pair for every ink so the annotations can be diffed against
     reality instead of trusted: stale ratios in those comments are what this
     script exists to prevent. */
  console.log(`${C.b}AS ANNOTATED${C.r}  ${C.dim}ground / card, the format used in globals.css${C.r}`);
  const G = tokens.get("--graphite-900");
  const S = tokens.get("--graphite-800");
  for (const name of [...tokens.keys()].filter((k) =>
    /^--(bone|flame)-\d+$|^--status-/.test(k),
  )) {
    const hex = tokens.get(name);
    console.log(
      `  ${name.padEnd(17)} ${hex}  ${ratio(hex, G).toFixed(2).padStart(6)} / ${ratio(hex, S).toFixed(2)}`,
    );
  }
  console.log();

  const flames = [...tokens.keys()].filter((k) => /^--flame-\d+$/.test(k));
  console.log(
    `${C.b}SEPARATION${C.r}  ${C.dim}CIEDE2000, status vs every flame step, bar ${SEPARATION}${C.r}`,
  );
  for (const status of ["--status-error", "--status-success"]) {
    const s = tokens.get(status);
    if (!s) continue;
    for (const f of flames) {
      const d = deltaE(s, tokens.get(f));
      const pass = d >= SEPARATION;
      if (!pass) failures.push(`${status} is only dE ${d.toFixed(1)} from ${f}`);
      out.separation.push({ status, flame: f, dE: +d.toFixed(1), pass });
      console.log(
        `  ${pass ? C.ok + "PASS" : C.bad + "FAIL"}${C.r} dE ${d.toFixed(1).padStart(5)}  ${status} vs ${f}`,
      );
    }
  }
  console.log();

  /* Guests, and the bars are set by WHAT SHARES A VIEWPORT WITH WHAT rather
     than by one global number, which is the mistake that made an earlier pass
     of this audit unsatisfiable:

     vs the VOICE, 20. A guest never replaces --signal (that is the whole
     reason --signal exists as a token separate from --accent), so on a case
     study the project's colour and the site's flame are on screen together,
     the guest on headings and plate promotions, the flame on the focus ring,
     hover and progress bar. They have to be tellable apart.
     vs each OTHER, 20. The work index puts all of them side by side.
     vs a STATUS, 10. --error and --success live in one component on
     /contact, which sets no guest accent, so these never co-occur at all;
     the bar exists only so a confirmation is not literally the same green a
     reader saw one route earlier. */
  const GUEST_VS_VOICE = 20;
  const GUEST_VS_STATUS = 10;
  const GUEST_VS_GUEST = 20;
  const guests = await readGuests();
  out.guests = [];
  console.log(
    `${C.b}GUEST ACCENTS${C.r}  ${C.dim}per-project --accent, from src/content/work/*.mdx${C.r}`,
  );
  const voice = tokens.get("--flame-500");
  for (const g of guests) {
    const onBg = ratio(g.hex, G);
    const onCard = ratio(g.hex, S);
    const dVoice = Math.min(...flames.map((f) => deltaE(g.hex, tokens.get(f))));
    const dErr = deltaE(g.hex, tokens.get("--status-error"));
    const dOk = deltaE(g.hex, tokens.get("--status-success"));
    const checks = [
      [onBg >= AA, `${onBg.toFixed(2)}:1 on the ground`],
      [onCard >= AA, `${onCard.toFixed(2)}:1 on a card`],
      [dVoice >= GUEST_VS_VOICE, `dE ${dVoice.toFixed(1)} from the flame`],
      [dErr >= GUEST_VS_STATUS, `dE ${dErr.toFixed(1)} from --status-error`],
      [dOk >= GUEST_VS_STATUS, `dE ${dOk.toFixed(1)} from --status-success`],
    ];
    const bad = checks.filter(([ok]) => !ok);
    for (const [, label] of bad) failures.push(`${g.slug}: ${label}`);
    out.guests.push({ ...g, onBg: +onBg.toFixed(2), onCard: +onCard.toFixed(2), dVoice: +dVoice.toFixed(1) });
    console.log(
      `  ${bad.length ? C.bad + "FAIL" : C.ok + "PASS"}${C.r} ${g.slug.padEnd(12)} ${g.hex}  ` +
        `${onBg.toFixed(2)}/${onCard.toFixed(2)}  ${C.dim}dE: voice ${dVoice.toFixed(1)}, err ${dErr.toFixed(1)}, ok ${dOk.toFixed(1)}${C.r}` +
        (bad.length ? `\n         ${C.bad}${bad.map(([, l]) => l).join("; ")}${C.r}` : ""),
    );
  }
  /* Guests also sit SIDE BY SIDE on the work index, so they have to be
     separable from each other, not just from the system colours. */
  for (let i = 0; i < guests.length; i++)
    for (let j = i + 1; j < guests.length; j++) {
      const d = deltaE(guests[i].hex, guests[j].hex);
      if (d < GUEST_VS_GUEST) {
        failures.push(`${guests[i].slug} and ${guests[j].slug} are only dE ${d.toFixed(1)} apart`);
        console.log(
          `  ${C.bad}FAIL${C.r} ${guests[i].slug} vs ${guests[j].slug}: dE ${d.toFixed(1)}, they collide on the work index`,
        );
      }
    }
  void voice;
  console.log();

  if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 2));

  if (failures.length) {
    console.log(`${C.bad}${failures.length} FAILURE(S)${C.r}`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log(`${C.ok}All palette assertions pass.${C.r}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
