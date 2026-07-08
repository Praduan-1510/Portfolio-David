/*
 * Cover-fit drawImage — the shared math behind every full-bleed canvas image
 * (extracted from AboutHeroMap): scale the image so it covers w×h, then place
 * the overflow according to the anchor (0 = left/top edge flush, 1 = right/
 * bottom edge flush, 0.5 = centred). Callers own canvas sizing + dpr transform.
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  anchorX = 0.5,
  anchorY = 0.5,
) {
  if (!img.complete || img.naturalWidth === 0 || !w || !h) return;
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  const dw = cr > ir ? w : h * ir;
  const dh = cr > ir ? w / ir : h;
  ctx.drawImage(img, (w - dw) * anchorX, (h - dh) * anchorY, dw, dh);
}
