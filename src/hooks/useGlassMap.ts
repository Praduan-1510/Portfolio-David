"use client";

import { useEffect, useId, useState, type RefObject } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/*
 * useGlassMap: real refraction for one liquid-glass surface, as progressive
 * enhancement.
 *
 *   const filterId = useGlassMap(ref, 26, { depth: 10 });
 *   // null  -> keep the CSS frosted path (blur + saturate + brightness)
 *   // "lg-…" -> backdrop-filter: url(#lg-…) saturate(1.7)
 *
 * <LiquidGlass> already calls this; reach for the hook directly only when you
 * are building a surface that is not a <LiquidGlass>.
 *
 * WHAT IT DOES
 * It paints the element's edge map to a canvas: a rounded-rect SDF where the
 * RED and GREEN channels push each pixel INWARD along the surface normal
 * (128 = still), growing toward the rim and exactly still in the flat middle,
 * and the BLUE channel says how "core" a pixel is (0 at the rim, 1 once past
 * the bevel). That map feeds a per-instance clone of the #lg-refract template
 * that <GlassFilters/> renders once in the root layout: three displacement
 * passes at slightly different strengths (the R and B channels land a pixel or
 * two apart at the rim: dispersion), a frosted blur used only where BLUE says
 * "core", so the rim stays crisp and visibly bent while the text band behind
 * the labels is soft, then a highlight cap that keeps light content from ever
 * washing the glass out (the legibility floor; see liquid-glass.css).
 *
 * Sampling inward is the physics of a convex slab: a vertical ray entering a
 * rim that tilts outward bends toward the centre, so the rim shows what lies
 * further in. It also keeps every sample inside the element, which matters
 * because a backdrop is not guaranteed to exist past the border box.
 *
 * WHERE IT RUNS
 * Chromium only. Safari and Firefox parse `backdrop-filter: url()` (so
 * CSS.supports() says yes) and then paint nothing, so a Chromium check is
 * required on top of it. iOS Chrome is WebKit and is correctly excluded.
 * prefers-reduced-transparency and html[data-glass="flat"] opt out entirely.
 *
 * COST
 * No per-frame work. The map is rebuilt only when the element's border box
 * changes size (ResizeObserver, debounced 90ms with a 180ms max wait so a long
 * width transition still gets intermediate maps), at CSS-pixel resolution: the
 * GPU upsamples a smooth field for free. The filter itself runs on the
 * compositor. Every sample reads the element's LAYOUT box, so transforms on
 * the surface (a condensing nav, a gliding dock) never invalidate it.
 */

export interface GlassMapOptions {
  /** Default true. False removes the filter and returns null. */
  enabled?: boolean;
  /** Width of the refracting rim in px. Default: min(16, radius, shortSide / 2). */
  bevel?: number;
  /** Displacement at the very edge in px (the "bend"). Default 10. */
  depth?: number;
  /** Dispersion 0..0.2: how far R and B split at the rim (0.05 = ~1px at
   *  depth 10). Default 0.05; wider splits fringe thin type red/cyan. */
  chroma?: number;
  /** stdDeviation (px) of the frosted core. Default 6. */
  frost?: number;
}

/** id of the template <filter> rendered by <GlassFilters/>. */
export const GLASS_TEMPLATE_ID = "lg-refract";

let chromiumCache: boolean | null = null;

function isChromium(): boolean {
  if (chromiumCache !== null) return chromiumCache;
  const nav = navigator as Navigator & {
    userAgentData?: { brands?: { brand: string }[] };
  };
  const brands = nav.userAgentData?.brands;
  chromiumCache = brands
    ? brands.some((b) => /Chromium/i.test(b.brand))
    : // "Chrome/" also matches HeadlessChrome/, Edge, Opera, Samsung; iOS
      // browsers say CriOS/EdgiOS instead and are WebKit, so they fall out.
      /Chrome\/\d/.test(navigator.userAgent);
  return chromiumCache;
}

/**
 * Whether this browser can render SVG refraction through backdrop-filter right
 * now. Live on the two opt-outs, cached on the engine check.
 */
export function canRefract(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.glass === "flat") return false;
  if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) {
    return false;
  }
  if (typeof ResizeObserver === "undefined" || typeof CSS === "undefined") {
    return false;
  }
  return CSS.supports("backdrop-filter", "url(#lg)") && isChromium();
}

let canvas: HTMLCanvasElement | null = null;

/**
 * Paint the edge map for a w x h rounded rect. R/G = inward displacement along
 * the normal, B = core weight, A = opaque. Returns a PNG data URL.
 */
function paintMap(w: number, h: number, radius: number, bevel: number): string {
  canvas ??= document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const hw = w / 2;
  const hh = h / 2;
  // Crisp only across a thin lip (~12% of the bevel), fully frosted by ~57%:
  // the edge catches a bent sliver of the scene, the face stays calm.
  const coreFrom = bevel * 0.12;
  const coreSpan = bevel * 0.45;

  for (let j = 0; j < h; j++) {
    const py = j + 0.5 - hh;
    const qy = Math.abs(py) - hh + r;
    const sy = py < 0 ? -1 : 1;
    for (let i = 0; i < w; i++) {
      const px = i + 0.5 - hw;
      const qx = Math.abs(px) - hw + r;
      const sx = px < 0 ? -1 : 1;
      let nx = 0;
      let ny = 0;
      let sd: number;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy);
        sd = len - r;
        nx = (qx / len) * sx;
        ny = (qy / len) * sy;
      } else if (qx > qy) {
        sd = qx - r;
        nx = sx;
      } else {
        sd = qy - r;
        ny = sy;
      }
      const dist = -sd; // inward distance from the rim, px

      // Bend: steep at the lip, gone by the end of the bevel.
      let m = 0;
      if (dist < bevel) {
        const t = dist <= 0 ? 0 : dist / bevel;
        m = Math.pow(1 - t, 2.4);
      }
      // Core weight: smoothstep across the inner part of the bevel.
      let core = (dist - coreFrom) / coreSpan;
      core = core <= 0 ? 0 : core >= 1 ? 1 : core * core * (3 - 2 * core);

      const k = (j * w + i) * 4;
      // Sample INWARD: minus the outward normal.
      d[k] = (128 - nx * m * 127.5) | 0;
      d[k + 1] = (128 - ny * m * 127.5) | 0;
      d[k + 2] = (core * 255 + 0.5) | 0;
      d[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

let warned = false;

export function useGlassMap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  radius: number,
  options: GlassMapOptions = {},
): string | null {
  const { enabled = true, bevel, depth = 10, chroma = 0.05, frost = 6 } = options;
  const reactId = useId();
  const filterId = `lg-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reducedTransparency = useMediaQuery("(prefers-reduced-transparency: reduce)");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || reducedTransparency || !el || !canRefract()) return;

    const template = document.getElementById(GLASS_TEMPLATE_ID);
    if (!template || !template.parentNode) {
      if (!warned && process.env.NODE_ENV !== "production") {
        warned = true;
        console.warn(
          "useGlassMap: <GlassFilters /> is not mounted; liquid glass falls back to frost.",
        );
      }
      return;
    }

    const filter = template.cloneNode(true) as SVGFilterElement;
    filter.id = filterId;
    const part = (name: string) => filter.querySelector(`[data-lg="${name}"]`);
    const image = part("map");
    const scaleOf = (name: string, s: number) =>
      part(name)?.setAttribute("scale", s.toFixed(2));
    scaleOf("dr", 2 * depth * (1 - chroma)); // red bends least
    scaleOf("dg", 2 * depth);
    scaleOf("db", 2 * depth * (1 + chroma)); // blue bends most
    part("frost")?.setAttribute("stdDeviation", String(frost));
    template.parentNode.appendChild(filter);

    let w = 0;
    let h = 0;
    let painted = "";
    let timer = 0;
    let burstStart = 0;

    const paint = () => {
      timer = 0;
      burstStart = 0;
      if (!image || w < 2 || h < 2) {
        painted = "";
        setReady(false);
        return;
      }
      const key = `${w}x${h}`;
      if (key === painted) return;
      painted = key;
      const rim = Math.max(1, bevel ?? Math.min(16, radius, Math.min(w, h) / 2));
      image.setAttribute("width", String(w));
      image.setAttribute("height", String(h));
      image.setAttribute("href", paintMap(w, h, radius, rim));
      setReady(true);
    };

    const schedule = () => {
      const now = performance.now();
      if (!burstStart) burstStart = now;
      window.clearTimeout(timer);
      // Debounce, but never starve a long transition of a fresh map.
      timer = window.setTimeout(paint, now - burstStart > 180 ? 0 : 90);
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      const box = entry.borderBoxSize?.[0];
      const nw = Math.round(box ? box.inlineSize : el.offsetWidth);
      const nh = Math.round(box ? box.blockSize : el.offsetHeight);
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      if (!painted) paint();
      else schedule();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
      filter.remove();
      setReady(false);
    };
  }, [ref, enabled, reducedTransparency, radius, bevel, depth, chroma, frost, filterId]);

  return ready ? filterId : null;
}
