"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * A looping product capture that floats over the hero background as if it were
 * transparent. The source is an *opaque* H.264 MP4 (plays everywhere incl.
 * Safari, unlike a VP9-alpha WebM) whose surround is baked to a near-black
 * (~rgb(15,17,18)) — a hair lighter than the page's near-black --bg (~rgb(5,5,5)).
 *
 * We recreate the transparency with two moves, no alpha and no colour-shifting
 * blend mode:
 *   1. object-cover on a portrait aperture drops the dark side-margins, and a
 *      radial mask feathers the fanned side-screens so the crop never shows an
 *      edge.
 *   2. a *gentle* contrast() pulls that near-black surround down toward the page
 *      black — contrast(1.06) sends rgb(~17)→rgb(~10) while whites stay white and
 *      mids hold. It's deliberately restrained: pushing harder (e.g. 1.12) crushes
 *      the montage's genuinely-dark top screens *below* the page black, which then
 *      read as a dark block where they overlap the bright aurora glow. The mask,
 *      not the filter, is what erases the box; the filter only narrows the delta.
 *
 * "Lazyload" here is preload="none" + an IntersectionObserver play-gate: the
 * file never touches the LCP path and only decodes while the hero is on screen.
 * Reduced motion renders the static `fallback` (the phone still) instead.
 */

// Feathered apertures — ellipses nudged DOWN (centre ~55%) with a short
// vertical radius, so a montage's dark top screens dissolve well before the
// box edge (otherwise they form a hard block against the aurora) and the crop
// never shows an edge. Two geometries, both tuned on the live heroes:
// - portrait crops (Spendee's centre-column montage) want a narrow ellipse that
//   melts the fanned side-screens early;
// - landscape apertures (Decathlon's carousel, Voyager's isometric flow) show
//   the WHOLE composition, so the ellipse widens to keep the outermost screens
//   present and only feather the true edges.
const PORTRAIT_MASK =
  "radial-gradient(58% 74% at 50% 56%, #000 26%, transparent 88%)";
// closest-side reaches EXACTLY zero at every box edge, so full-frame
// compositions (whose content bleeds to the video's own edges) can never leave
// a residual straight line where the aperture ends — the geometry guarantees it.
const LANDSCAPE_MASK =
  "radial-gradient(closest-side at 50% 52%, #000 64%, transparent 100%)";

// "9 / 16" | "4/3" → numeric ratio (NaN-safe: falls back to portrait).
const ratioOf = (aspect: string): number => {
  const [w, h] = aspect.split("/").map((n) => parseFloat(n));
  return w > 0 && h > 0 ? w / h : 0;
};

// Narrows the surround-vs-page delta without crushing darks (see note above).
const SURROUND_KNOCKOUT = "contrast(1.06) brightness(0.99)";

interface HeroLoopVideoProps {
  /** H.264 MP4 source — plays in every browser, including Safari. */
  mp4: string;
  /** Accessible label for the looping capture. */
  alt: string;
  /** Static visual shown under reduced motion (e.g. the PhoneFrame still). */
  fallback: ReactNode;
  /** Optional poster still painted before the first video frame. */
  poster?: string;
  /** Portrait aspect of the cropped aperture (w / h). */
  aspect?: string;
  className?: string;
}

export function HeroLoopVideo({
  mp4,
  alt,
  fallback,
  poster,
  aspect = "9 / 16",
  className,
}: HeroLoopVideoProps) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cursor parallax — the reel rotates toward the pointer for a tangible 3D
  // feel (same idiom as BrowserMockup's .bm-tilt). Only wired on fine pointers
  // with motion allowed; touch/reduced-motion keep the vars at 0.
  const tiltRef = useRef<HTMLDivElement>(null);
  const [tiltOn, setTiltOn] = useState(false);
  useEffect(() => {
    if (reduced) return;
    setTiltOn(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, [reduced]);

  const handleTiltMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = tiltRef.current;
      if (!tiltOn || !el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--hlv-ry", `${(x * 10).toFixed(2)}deg`); // horiz → rotateY
      el.style.setProperty("--hlv-rx", `${(-y * 7).toFixed(2)}deg`); // vert → rotateX
    },
    [tiltOn],
  );
  const handleTiltLeave = useCallback(() => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--hlv-ry", "0deg");
    el.style.setProperty("--hlv-rx", "0deg");
  }, []);

  // Play only while in view; pause off-screen. preload="none" + this gate keep
  // the file off the LCP path and idle when the hero isn't on screen.
  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;
    // React doesn't reliably set the `muted` DOM property from JSX, and Safari
    // blocks autoplay on a video it considers unmuted — force the property so
    // the in-view .play() isn't silently rejected.
    v.muted = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.muted = true;
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduced]);

  // Reduced motion → the static still; no video mounted, no motion.
  if (reduced) return <>{fallback}</>;

  const edgeMask = ratioOf(aspect) >= 1 ? LANDSCAPE_MASK : PORTRAIT_MASK;

  return (
    <div className={cn("hlv-stage relative", className)}>
      <div
        ref={tiltRef}
        className="hlv-tilt"
        onPointerMove={handleTiltMove}
        onPointerLeave={handleTiltLeave}
      >
        <div
          className="hlv-float relative w-full overflow-hidden"
          style={{
            aspectRatio: aspect,
            WebkitMaskImage: edgeMask,
            maskImage: edgeMask,
          }}
        >
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            poster={poster}
            aria-label={alt}
            className="h-full w-full object-cover"
            style={{ filter: SURROUND_KNOCKOUT }}
          >
            <source src={mp4} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}
