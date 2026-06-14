"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * PortraitFrame — the "dynamic" treatment for the feathered About portrait.
 * Three composited layers, each on its OWN element so they never collide and so
 * the `.about-portrait` mask on the <Image> is never written to:
 *
 *   1. ENTRANCE (one-shot, eased): a top-down clip-wipe "shutter" + a scale-settle
 *      + a short focus-pull (blur → sharp) as the frame scrolls into view. The
 *      clip travels through the image's already-transparent top/bottom feather, so
 *      the moving edge never shows a hard line.
 *   2. SCROLL BREATH (persistent, LINEAR / scrubbed): a slow scale + tiny vertical
 *      drift tracked to the section's pass through the viewport — keeps it alive,
 *      not just a single arrival. ease "none" per the scroll-linked rule (§7.1).
 *   3. POINTER DEPTH (desktop only, pointer:fine): a small cursor-follow tilt for
 *      parallax depth. Never attached on touch/coarse pointers.
 *
 * Reduced motion / no-JS: ONE guard early-returns before any tween or set, so the
 * start states are never written and the portrait renders in its final, fully
 * visible, fully-feathered state (§10). The hover scale stays a motion-safe CSS
 * class on the <Image>, so it self-disables too. transform / opacity / filter /
 * clip-path only → composited, 60fps, no CLS (the aspect box reserves space).
 */
interface PortraitFrameProps {
  className?: string;
  /** Entrance delay in seconds (sequences after a sibling heading reveal). */
  delay?: number;
  /** Desktop cursor-follow tilt. Default on; auto-skipped on coarse pointers. */
  pointerDepth?: boolean;
  children: React.ReactNode;
}

export function PortraitFrame({
  className,
  delay = 0,
  pointerDepth = true,
  children,
}: PortraitFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const wrap = wrapRef.current;
      const scrub = scrubRef.current;
      const tilt = tiltRef.current;
      if (prefersReducedMotion() || !wrap || !scrub || !tilt) return; // final static state
      const img = wrap.querySelector("img");
      if (!img) return;

      // 1 — ENTRANCE. Start states are set ONLY here, so no-JS / reduced-motion
      //     never trap content behind the animation.
      gsap.set(wrap, {
        willChange: "clip-path, opacity",
        clipPath: "inset(0 0 100% 0)", // opens top → down
        opacity: 0,
      });
      gsap.set(img, {
        willChange: "transform, filter",
        scale: 1.06,
        filter: "blur(8px)",
        transformOrigin: "50% 50%",
      });
      gsap
        .timeline({
          scrollTrigger: { trigger: wrap, start: "top 82%", once: true },
          delay,
        })
        .to(wrap, { opacity: 1, duration: durations.slow, ease: gsapEase.outExpo }, 0)
        .to(
          wrap,
          { clipPath: "inset(0 0 0% 0)", duration: durations.slower, ease: gsapEase.outExpo },
          0,
        )
        .to(
          img,
          { scale: 1, filter: "blur(0px)", duration: durations.slower, ease: gsapEase.outExpo },
          0,
        )
        // Drop the inline props once settled — clearing `transform` also hands the
        // hover-scale (a CSS class on the <Image>) back its authority.
        .set(wrap, { willChange: "auto", clipPath: "none" })
        .set(img, { willChange: "auto", clearProps: "transform,filter" });

      // 2 — SCROLL BREATH (linear, scrubbed) on the MID element. Stays over-scaled
      //     (min 1.04) so the ±1.5% drift never exposes a gap — the image fills the
      //     box exactly at scale 1, with no object-cover overflow to spare.
      gsap.fromTo(
        scrub,
        { scale: 1.04, yPercent: 1.5 },
        {
          scale: 1.08,
          yPercent: -1.5,
          ease: "none",
          scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
        },
      );

      // 3 — POINTER DEPTH (desktop, fine pointer only). Tiny angles via quickTo.
      if (pointerDepth && window.matchMedia("(pointer: fine)").matches) {
        const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: gsapEase.outQuad });
        const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: gsapEase.outQuad });
        const onMove = (e: PointerEvent) => {
          const r = wrap.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ry(px * 6); // ≤ 3°
          rx(py * -4); // ≤ 2°
        };
        const onLeave = () => {
          ry(0);
          rx(0);
        };
        wrap.addEventListener("pointermove", onMove);
        wrap.addEventListener("pointerleave", onLeave);
        return () => {
          wrap.removeEventListener("pointermove", onMove);
          wrap.removeEventListener("pointerleave", onLeave);
        };
      }
    },
    { scope: wrapRef, dependencies: [reduced, delay, pointerDepth], revertOnUpdate: true },
  );

  return (
    <div ref={wrapRef} className={className}>
      <div
        ref={scrubRef}
        className="absolute inset-0 will-change-transform [transform-style:preserve-3d]"
      >
        <div ref={tiltRef} className="absolute inset-0 [transform-style:preserve-3d]">
          {children}
        </div>
      </div>
    </div>
  );
}
