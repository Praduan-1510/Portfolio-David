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

/* Static fallback — the shader's resting state as a still grayscale gradient.
   Rendered under reduced-motion, on low-power devices, with no WebGL, or while
   the chunk loads. Derived from the --bg token via color-mix (soft gray core →
   base → slightly darker edge), so it tracks the theme and mirrors the live
   shader's resting tone + vignette, keeping the two states visually continuous. */
function Fallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 120% 90% at 50% 46%, color-mix(in srgb, var(--bg), #fff 7%) 0%, var(--bg) 52%, color-mix(in srgb, var(--bg), #000 14%) 100%)",
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
