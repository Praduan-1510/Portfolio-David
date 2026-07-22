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
 *   2. a gentle contrast() maps that near-black surround *exactly* onto the page
 *      black: contrast(1.12) sends rgb(~17) → rgb(~5) while whites stay white and
 *      mid-tones stay put, so the surround dissolves without dulling the UI.
 *
 * "Lazyload" here is preload="none" + an IntersectionObserver play-gate: the
 * file never touches the LCP path and only decodes while the hero is on screen.
 * Reduced motion renders the static `fallback` (the phone still) instead.
 */

// Feathered aperture — a tall ellipse that keeps the montage's centre column
// crisp while its fanned side-screens melt into the hero, so the object-cover
// crop never shows a hard edge. Tuned against the live Spendee hero.
const EDGE_MASK =
  "radial-gradient(58% 86% at 50% 49%, #000 34%, transparent 92%)";

// Maps the baked-in near-black surround (~rgb(17)) onto the page black (~rgb(5)).
// contrast(1.12): output = (in-0.5)*1.12 + 0.5 → 0.067 → ~0.019; whites clamp to
// white, mids stay put. brightness(0.98) nudges the last hair of lift out.
const SURROUND_KNOCKOUT = "contrast(1.12) brightness(0.98)";

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
