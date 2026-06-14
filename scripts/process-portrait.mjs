import sharp from "sharp";
import fs from "node:fs";
const SRC = "public/images/work/PNS_1269.JPG";
const OUT = "public/images/about/portrait.webp";

// Subject CENTERED (so an all-four-sides feather fades only the environment, not
// the face). Full vertical context kept; trees above + jacket below sit under the
// top/bottom feather. Output 4:5.
await sharp(SRC)
  .resize({ height: 1600 })                         // -> 2397 x 1600
  .extract({ left: 600, top: 0, width: 1280, height: 1600 }) // subject ~centered
  .grayscale()
  .linear(1.06, -8)
  .modulate({ brightness: 1.03 })
  .webp({ quality: 80, effort: 6 })
  .toFile(OUT);

const blur = await sharp(OUT).resize(12).webp({ quality: 40 }).toBuffer();
console.log("portrait.webp:", Math.round(fs.statSync(OUT).size / 1024) + "KB");
console.log("BLUR=data:image/webp;base64," + blur.toString("base64"));
