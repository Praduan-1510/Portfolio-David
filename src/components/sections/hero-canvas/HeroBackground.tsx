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
  // No loading component — the always-on base <Fallback /> already paints the
  // hero while the chunk streams in (a loading fallback here would stack a
  // second copy of the same gradients on top of it).
  { ssr: false, loading: () => null },
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

/* Static fallback — the SETTLED shader composition as pure CSS. Rendered under
   reduced-motion, on low-power devices (ALL phones: isLowPower gates on
   pointer:coarse), with no WebGL, while the chunk loads, and always as the
   painted floor beneath the canvas. Mirrors the live shader's resting state:
   a focal void behind the type block, a luminous rim at its edge, and a warm
   diagonal band of BOLD blooms (alphas tuned so 390px phones get real colour,
   not near-black smudges) over the --bg base with a corner vignette. */
function Fallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: [
          // Focal void — pools the base behind the centre type block.
          "radial-gradient(58% 46% at 50% 48%, var(--bg) 0%, color-mix(in srgb, var(--bg) 78%, transparent) 52%, transparent 76%)",
          // Rim light — a faint spectrum ring where the void meets the field.
          "radial-gradient(72% 58% at 50% 48%, transparent 58%, color-mix(in srgb, var(--spectrum-violet) 20%, transparent) 66%, color-mix(in srgb, var(--spectrum-blue) 14%, transparent) 72%, transparent 82%)",
          // The surviving diagonal band: bold blooms lower-left -> upper-right.
          "radial-gradient(44% 50% at 14% 84%, color-mix(in srgb, var(--spectrum-rose) 52%, transparent), transparent 70%)",
          "radial-gradient(40% 46% at 38% 66%, color-mix(in srgb, var(--spectrum-amber) 42%, transparent), transparent 72%)",
          "radial-gradient(42% 46% at 86% 20%, color-mix(in srgb, var(--spectrum-blue) 50%, transparent), transparent 70%)",
          "radial-gradient(34% 40% at 68% 38%, color-mix(in srgb, var(--spectrum-violet) 38%, transparent), transparent 74%)",
          // Counterweight blooms so the off-band corners aren't dead.
          "radial-gradient(36% 42% at 12% 18%, color-mix(in srgb, var(--spectrum-lime) 26%, transparent), transparent 74%)",
          "radial-gradient(38% 44% at 88% 86%, color-mix(in srgb, var(--spectrum-lime) 32%, transparent), transparent 72%)",
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
    // The Fallback always renders as the base layer: chunk load, context loss,
    // or any canvas transparency sits on a painted spectrum field, never raw --bg.
    <div ref={containerRef} aria-hidden="true" className="absolute inset-0">
      <Fallback />
      {enabled && !lost && (
        <div className="absolute inset-0">
          <HeroCanvas
            active={onscreen && visible}
            baseColor={baseColor}
            onContextLost={() => setLost(true)}
          />
        </div>
      )}
    </div>
  );
}
