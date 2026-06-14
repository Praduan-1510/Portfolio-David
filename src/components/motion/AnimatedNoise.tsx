"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Ambient film grain (DESIGN_GUIDELINES.md §7.8 / §9 — faint, purposeful texture).
 * A half-resolution canvas of random grayscale noise, redrawn every other frame
 * and composited with `mix-blend-overlay` so it reads as subtle atmosphere over a
 * dark surface, never as a solid layer. Standalone — uses no design tokens.
 *
 * Ported from the v0 export; the only addition is reduced-motion safety: under
 * prefers-reduced-motion we paint ONE static frame and never start the rAF loop.
 * Decorative, so aria-hidden and pointer-events:none across both paths.
 */
interface AnimatedNoiseProps {
  /** 0–1; keep low (~0.03–0.05) so it stays texture, not a layer. */
  opacity?: number;
  className?: string;
}

export function AnimatedNoise({ opacity = 0.05, className }: AnimatedNoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Re-run the effect when the OS setting toggles at runtime (start/stop the loop).
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number | undefined;
    let frame = 0;

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value; // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255; // A
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const resize = () => {
      // Half-res buffer: cheaper and the grain reads finer when upscaled.
      canvas.width = canvas.offsetWidth / 2;
      canvas.height = canvas.offsetHeight / 2;
      // A resize clears the buffer, so repaint the static frame in reduced mode.
      if (prefersReducedMotion()) generateNoise();
    };

    resize();
    window.addEventListener("resize", resize);

    // Reduced motion: one static grain frame, no animation loop.
    if (prefersReducedMotion()) {
      generateNoise();
      return () => window.removeEventListener("resize", resize);
    }

    const animate = () => {
      frame++;
      // Update every 2nd frame — animated enough, half the work.
      if (frame % 2 === 0) generateNoise();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  );
}
