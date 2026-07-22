"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * A looping product capture that floats over the hero background as if it were
 * transparent. The source is an *opaque* H.264 MP4 (plays everywhere incl.
 * Safari, unlike a VP9-alpha WebM) whose surround is baked to a near-black
 * (~rgb(15,17,18)) — a hair lighter than the page's near-black --bg. We don't
 * fake alpha with a blend mode (screen/lighten would only lift that surround
 * *above* the page and expose a brighter rectangle); instead we crop to the
 * content (object-cover on a portrait box drops the dark side-margins) and
 * feather the remaining edges with a radial mask, so what's left dissolves into
 * the page. Fidelity is untouched — no colour math on the pixels.
 *
 * "Lazyload" here is preload="none" + an IntersectionObserver play-gate: the
 * file never touches the LCP path and only decodes while the hero is on screen.
 * Reduced motion renders the static `fallback` (the phone still) instead.
 */

// Feathered aperture — a tall ellipse that keeps the montage's centre column
// crisp while its fanned side-screens (and the baked-in dark surround) melt into
// the hero, so the object-cover crop never shows a hard edge. Tuned against the
// live Spendee hero: a narrower solid core than it looks, with a long fade out.
const EDGE_MASK =
  "radial-gradient(62% 84% at 50% 49%, #000 40%, transparent 94%)";

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
  // WCAG 2.2.2: an autoplaying loop needs an on-page pause. A user pause beats
  // the IntersectionObserver auto-play (ref mirrors state so the IO callback
  // reads it without needing to resubscribe).
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);

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
        if (entry.isIntersecting && !userPausedRef.current) {
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

  const togglePlayback = () => {
    const v = videoRef.current;
    const next = !userPausedRef.current;
    userPausedRef.current = next;
    setUserPaused(next);
    if (!v) return;
    if (next) v.pause();
    else v.play().catch(() => {});
  };

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
        >
          <source src={mp4} type="video/mp4" />
        </video>
      </div>

      {/* Pause/play — the WCAG 2.2.2 mechanism for the looping capture. Mirrors
          BrowserMockup's badge vocabulary; ::before extends the hit area to a
          comfortable 44px. Sits outside the feathered aperture so it stays crisp. */}
      <button
        type="button"
        onClick={togglePlayback}
        className="absolute bottom-space-2 left-1/2 z-[2] inline-flex -translate-x-1/2 items-center gap-[5px] rounded-full bg-black/65 px-space-2 py-[2px] font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors duration-fast ease-out-quad before:absolute before:-inset-3 before:content-[''] hover:text-neon"
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-[5px] w-[5px] rounded-full",
            userPaused ? "bg-white/60" : "bg-neon motion-safe:animate-status-pulse",
          )}
        />
        {userPaused ? "Play capture" : "Pause capture"}
      </button>
    </div>
  );
}
