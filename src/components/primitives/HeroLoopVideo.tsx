"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * A looping product capture, presented as a PLATE: a dark panel with a
 * hairline, sitting on the page. The source is an *opaque* H.264 MP4 (plays
 * everywhere incl. Safari, unlike a VP9-alpha WebM) whose surround is baked to
 * a near-black (~rgb(15,17,18)).
 *
 * This used to fake transparency: a feathered radial aperture plus a gentle
 * contrast() that pulled the near-black surround down toward the page's own
 * near-black, so the capture appeared to float with no box.
 *
 * The argument written here previously was that the illusion died with the
 * PAPER ground, because nothing feathers cleanly between the capture's
 * surround and #f5f0e8. That ground lasted one commit: B2 flipped back to a
 * dark one and the logo repaint has since made it a cool #0D0D10, which is
 * actually within a couple of points of the surround's own ~rgb(15,17,18).
 * So the feather is technically back on the table, and the box stays anyway,
 * on the grounds it should have been kept for in the first place: the capture
 * reads as a dark object photographed on the page, which is exactly what
 * --device and --bezel already say a screenshot is, and what keeps the
 * case-study plates legible as the page's only LINE DRAWINGS. A feathered
 * aperture is an effect; a plate is a register.
 *
 * Rejected on the way here: mix-blend-mode: screen. The montages contain
 * genuinely-dark screens (that is why the old contrast() was capped at 1.06),
 * and screen() would erase those along with the surround.
 *
 * "Lazyload" here is preload="none" + an IntersectionObserver play-gate: the
 * file never touches the LCP path and only decodes while the hero is on screen.
 * Reduced motion renders the static `fallback` (the phone still) instead.
 */

interface HeroLoopVideoProps {
  /** H.264 MP4 source: plays in every browser, including Safari. */
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

  // Cursor parallax: the reel rotates toward the pointer for a tangible 3D
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
    // blocks autoplay on a video it considers unmuted: force the property so
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
    <div className={cn("hlv-stage relative", className)}>
      <div
        ref={tiltRef}
        className="hlv-tilt"
        onPointerMove={handleTiltMove}
        onPointerLeave={handleTiltLeave}
      >
        <div
          className="hlv-float hlv-plate relative w-full overflow-hidden"
          style={{ aspectRatio: aspect }}
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
      </div>
    </div>
  );
}
