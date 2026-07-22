"use client";

import { useEffect, useRef, type ReactNode } from "react";
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

// Feathered aperture — an ellipse nudged DOWN (centre at 56%) with a short
// vertical radius, so the montage's dark top screens dissolve well before the
// box edge (otherwise they form a hard block against the aurora), the side
// screens melt away, and the crop never shows an edge. Tuned on the live hero.
const EDGE_MASK =
  "radial-gradient(58% 74% at 50% 56%, #000 26%, transparent 88%)";

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

  return (
    <div className={cn("relative", className)}>
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: aspect,
          WebkitMaskImage: EDGE_MASK,
          maskImage: EDGE_MASK,
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
  );
}
