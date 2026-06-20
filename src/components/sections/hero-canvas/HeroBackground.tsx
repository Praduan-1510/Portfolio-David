"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Isolation boundary for the WebGL hero backdrop (ARCHITECTURE.md §7.6). The R3F
 * Canvas is a removable enhancement layer:
 *   - dynamically imported with ssr:false → never in the SSR HTML, never blocks
 *     first paint; the chunk loads after hydration;
 *   - gated behind capability + reduced-motion → static fallback otherwise;
 *   - paused (frameloop "never") when offscreen or the tab is hidden.
 */
const HeroCanvas = dynamic(
  () => import("./HeroCanvas").then((m) => m.HeroCanvas),
  { ssr: false, loading: () => <Fallback /> },
);

function supportsWebGL(): boolean {
  try {
    if (!window.WebGLRenderingContext) return false;
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    // Release the probe context so repeated gate runs don't leak GL contexts.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function isLowPower(): boolean {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number") {
    if (nav.deviceMemory <= 4) return true;
  } else if (
    // deviceMemory is unavailable on Firefox/Safari — fall back to CPU cores so
    // weak desktops on those engines still get the static fallback (§7.6).
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4
  ) {
    return true;
  }
  if (window.matchMedia?.("(pointer: coarse)").matches) return true; // touch / mobile
  return false;
}

/* Static fallback — a still version of the colour aurora. Rendered under
   reduced-motion, on low-power devices, with no WebGL, or while the chunk loads.
   Soft spectrum blooms (violet / blue / lime / amber / rose, via color-mix so they
   track the tokens) pool around an intentionally calmer centre over the --bg base,
   then an elliptical vignette darkens the rim — mirroring the live shader's
   composition so the two states read as one and mobile users still get colour. */
function Fallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: [
          // Colour blooms (kept off-centre, lower alpha behind the headline).
          "radial-gradient(38% 44% at 16% 26%, color-mix(in srgb, var(--spectrum-violet) 26%, transparent), transparent 72%)",
          "radial-gradient(40% 46% at 84% 22%, color-mix(in srgb, var(--spectrum-blue) 22%, transparent), transparent 72%)",
          "radial-gradient(46% 50% at 78% 84%, color-mix(in srgb, var(--spectrum-amber) 20%, transparent), transparent 72%)",
          "radial-gradient(42% 48% at 22% 82%, color-mix(in srgb, var(--spectrum-rose) 20%, transparent), transparent 72%)",
          "radial-gradient(30% 34% at 50% 50%, color-mix(in srgb, var(--spectrum-lime) 12%, transparent), transparent 78%)",
          // Dark ground + rim vignette beneath the blooms.
          "radial-gradient(ellipse 120% 95% at 50% 46%, color-mix(in srgb, var(--bg), #fff 3%) 0%, var(--bg) 56%, color-mix(in srgb, var(--bg), #000 16%) 100%)",
        ].join(", "),
      }}
    />
  );
}

export function HeroBackground() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false); // false at first paint → fallback
  const [onscreen, setOnscreen] = useState(true);
  const [visible, setVisible] = useState(true);
  const [lost, setLost] = useState(false); // GPU context lost → static fallback
  const [baseColor, setBaseColor] = useState<[number, number, number]>([
    0.05, 0.05, 0.06,
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Capability + reduced-motion gate. Runs after mount, so the canvas only ever
  // appears post first-paint.
  useEffect(() => {
    if (reduced) {
      setEnabled(false);
      return;
    }
    setEnabled(supportsWebGL() && !isLowPower());
  }, [reduced]);

  // Read the resolved --bg within the dark-themed hero subtree once, so the
  // shader's base tone tracks the theme token instead of a hardcoded near-black.
  useEffect(() => {
    const host =
      containerRef.current?.closest<HTMLElement>("[data-theme]") ??
      containerRef.current;
    if (!host) return;
    const m = getComputedStyle(host).backgroundColor.match(/[\d.]+/g);
    if (m && m.length >= 3) {
      setBaseColor([+m[0] / 255, +m[1] / 255, +m[2] / 255]);
    }
  }, []);

  // Pause when scrolled offscreen or the tab is backgrounded.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnscreen(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    // Decorative layer — hidden from assistive tech across both branches (live
    // canvas + static fallback), so the isolation layer is self-contained.
    <div ref={containerRef} aria-hidden="true" className="absolute inset-0">
      {enabled && !lost ? (
        <HeroCanvas
          active={onscreen && visible}
          baseColor={baseColor}
          onContextLost={() => setLost(true)}
        />
      ) : (
        <Fallback />
      )}
    </div>
  );
}
