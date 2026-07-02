import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

/*
 * Blur-placeholder map for every work image + the video poster. PhoneFrame /
 * BrowserMockup pass these as next/image blurDataURL so a phone/browser well is
 * never an empty black frame while the real asset streams in. Re-run after
 * adding or regenerating any image under public/images/work.
 *
 *   node scripts/generate-blur-map.mjs  ->  src/lib/content/blur-map.json
 */

const ROOTS = ["public/images/work", "public/videos"];
const EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const OUT = "src/lib/content/blur-map.json";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return EXTS.has(extname(name).toLowerCase()) ? [p] : [];
  });
}

const files = ROOTS.flatMap((r) => {
  try {
    return walk(r);
  } catch {
    return [];
  }
});

const map = {};
for (const file of files.sort()) {
  const buf = await sharp(file).resize(12).webp({ quality: 40 }).toBuffer();
  const key = "/" + relative("public", file).split("\\").join("/");
  map[key] = "data:image/webp;base64," + buf.toString("base64");
}

writeFileSync(OUT, JSON.stringify(map, null, 2) + "\n");
const kb = Math.round(statSync(OUT).size / 1024);
console.log(`blur-map.json: ${Object.keys(map).length} entries, ${kb}KB`);
