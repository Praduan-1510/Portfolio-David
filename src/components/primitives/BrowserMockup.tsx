"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import blurMap from "@/lib/content/blur-map.json";

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * Landscape browser/window mockup — the web counterpart to PhoneFrame. Holds a
 * site screen-recording (looping <video>) or a still (poster) inside a dark
 * window chrome, on the dark page. Two modes:
 *   tilt="hero"  — the showpiece: a 3D-tilted "slab" (.browser-slab in globals.css)
 *                  with a layered shadow + a resting teal glow that flips to neon
 *                  on hover, the looping video, and a live-capture badge.
 *   tilt="still" — a flat, lightly-shadowed frame holding the poster (used in cards,
 *                  the work index, and the gallery).
 *
 * The source recording includes the OS menu bar + browser chrome + dock, so the
 * screen well is CSS-cropped (aspect 64/35 + object-position) to show ONLY the page
 * content inside OUR chrome — no double chrome, and no re-encode (quality intact).
 *
 * Guardrails: the <video> is muted/loop/playsInline, preload="none", and only
 * .play()s while ≥50% in view (IntersectionObserver) — so it never blocks the SSR
 * headline's LCP. Under prefers-reduced-motion it renders ONLY the poster image (no
 * video, no autoplay). The well reserves its aspect → no CLS. The URL pill is a real
 * live link ONLY in hero mode (standalone); in still mode it's plain text so it never
 * nests inside a card's <a>.
 */
interface BrowserMockupProps {
  /** Poster / still image (page content; will be cropped to hide chrome). */
  poster: string;
  /** MP4 source (hero mode). */
  mp4?: string;
  /** WebM source (hero mode; offered first). */
  webm?: string;
  /** Live URL — turns the chrome URL pill into a link in hero mode. */
  liveUrl?: string;
  /** Domain shown in the URL pill. */
  domain?: string;
  /** Accessible description of the captured site. */
  alt: string;
  tilt?: "hero" | "still";
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Extra classes on the well (e.g. hover transitions in cards). */
  wellClassName?: string;
  /** Hero centerpiece: run the orchestrated "boot" intro (chrome lights up, a
   *  shutter scans the screen in, the badge blinks on). Reduced-motion-safe. */
  boot?: boolean;
  /** Hero centerpiece at full width: a gentler, more frontal resting tilt. */
  big?: boolean;
  /** Screen-well aspect ratio (CSS aspect-ratio). Default "64 / 35" — the crop
   *  tuned to the hero video (which bakes in OS chrome). Clean screenshots that
   *  are already just page content should pass their own ratio (e.g. "198 / 100"). */
  aspect?: string;
  /** object-position for the still/video inside the well. Default "50% 73%"
   *  (drops the recording's chrome); a full screenshot wants "50% 50%". */
  objectPosition?: string;
  /** object-fit for the still image. Default "cover"; "contain" letterboxes a
   *  whole screenshot when its ratio doesn't match the well. */
  fit?: "cover" | "contain";
}

function Lock() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="4.4" width="6" height="4.2" rx="1" stroke="currentColor" strokeWidth="0.9" />
      <path d="M3.4 4.4V3.2a1.6 1.6 0 0 1 3.2 0v1.2" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

export function BrowserMockup({
  poster,
  mp4,
  webm,
  liveUrl,
  domain,
  alt,
  tilt = "still",
  priority = false,
  sizes = "(min-width: 768px) 46rem, 92vw",
  className,
  wellClassName,
  boot = false,
  big = false,
  aspect = "64 / 35",
  objectPosition = "50% 73%",
  fit = "cover",
}: BrowserMockupProps) {
  const reduced = useReducedMotion();
  const hero = tilt === "hero";
  const showVideo = hero && !!mp4 && !reduced;
  const runBoot = hero && boot;
  const videoRef = useRef<HTMLVideoElement>(null);
  // WCAG 2.2.2: the looping capture needs an on-page pause mechanism. A user
  // pause beats the IntersectionObserver auto-play (ref mirrors state so the IO
  // callback reads it without resubscribing).
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);

  // Cursor parallax — the slab rotates toward the pointer for a tangible 3D look.
  // Only wired on fine pointers (mouse) with motion allowed; touch/reduced-motion
  // keep the vars at 0, so the slab just shows its static tilt.
  const tiltRef = useRef<HTMLDivElement>(null);
  const [tiltOn, setTiltOn] = useState(false);
  useEffect(() => {
    if (!hero || reduced) return;
    setTiltOn(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, [hero, reduced]);

  const handleTiltMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = tiltRef.current;
      if (!tiltOn || !el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--bm-my", `${(x * 14).toFixed(2)}deg`); // horiz → rotateY
      el.style.setProperty("--bm-mx", `${(-y * 10).toFixed(2)}deg`); // vert → rotateX
    },
    [tiltOn],
  );
  const handleTiltLeave = useCallback(() => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--bm-my", "0deg");
    el.style.setProperty("--bm-mx", "0deg");
  }, []);

  // Play only while in view; pause off-screen. preload="none" + this gate keep the
  // video off the LCP path entirely.
  useEffect(() => {
    if (!showVideo) return;
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPausedRef.current) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [showVideo]);

  const togglePlayback = () => {
    const v = videoRef.current;
    const next = !userPausedRef.current;
    userPausedRef.current = next;
    setUserPaused(next);
    if (!v) return;
    if (next) v.pause();
    else v.play().catch(() => {});
  };

  return (
    <div className={cn(hero && "browser-stage", className)}>
      <div
        ref={tiltRef}
        className={cn(hero && "bm-tilt")}
        onPointerMove={handleTiltMove}
        onPointerLeave={handleTiltLeave}
      >
      <div
        data-boot={runBoot ? "" : undefined}
        data-variant={hero && big ? "big" : undefined}
        className={cn(
          "group/bm relative w-full overflow-hidden rounded-[12px] border border-white/12 bg-surface p-[6px]",
          hero
            ? "browser-slab"
            : "shadow-[0_24px_60px_-26px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)]",
        )}
      >
        {/* Window chrome — traffic dots (leftmost = teal tell) + the live URL pill. */}
        <div className="flex h-[34px] items-center gap-space-3 rounded-t-[7px] border-b border-line bg-[#0d0d10] px-space-3">
          <span aria-hidden="true" className="flex shrink-0 items-center gap-[6px]">
            <span className="bm-dot h-[10px] w-[10px] rounded-full bg-accent" />
            <span className="bm-dot h-[10px] w-[10px] rounded-full bg-white/15" />
            <span className="bm-dot h-[10px] w-[10px] rounded-full bg-white/15" />
          </span>
          {liveUrl && hero ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bm-url mx-auto inline-flex max-w-[62%] items-center gap-space-2 rounded-full border border-line bg-white/[0.04] px-space-3 py-[3px] font-mono text-caption text-muted transition-colors duration-fast ease-out-quad hover:border-neon hover:text-neon"
            >
              <Lock />
              <span className="truncate">{domain ?? liveUrl}</span>
              <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="bm-url mx-auto inline-flex max-w-[62%] items-center gap-space-2 rounded-full border border-line bg-white/[0.04] px-space-3 py-[3px] font-mono text-caption text-muted">
              <Lock />
              <span className="truncate">{domain ?? ""}</span>
            </span>
          )}
          <span aria-hidden="true" className="w-[46px] shrink-0" />
        </div>

        {/* Screen well — cropped to the page content (64/35 + object-position hides
            the recording's OS menu bar / browser chrome / dock). */}
        <div
          className={cn("relative overflow-hidden rounded-b-[7px] bg-bezel", wellClassName)}
          style={{
            aspectRatio: aspect,
            // Blurred poster behind both branches: the well is never a black
            // hole while the video/still streams in.
            backgroundImage: blurFor(poster) ? `url("${blurFor(poster)}")` : undefined,
            backgroundSize: "cover",
            backgroundPosition: objectPosition,
          }}
        >
          {showVideo ? (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              poster={poster}
              aria-label={alt}
              className="h-full w-full object-cover"
              style={{ objectPosition }}
            >
              {webm && <source src={webm} type="video/webm" />}
              {mp4 && <source src={mp4} type="video/mp4" />}
            </video>
          ) : (
            <Image
              src={poster}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              placeholder={blurFor(poster) ? "blur" : "empty"}
              blurDataURL={blurFor(poster)}
              className={fit === "contain" ? "object-contain" : "object-cover"}
              style={{ objectPosition }}
            />
          )}

          {/* Glass sheen (shares PhoneFrame's vocabulary). */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_38%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          />

          {/* Boot shutter — a dark panel over the screen that scans down off the
              bottom on load, revealing the capture top→bottom, with a teal scan
              line riding its leading (top) edge. Parked off-screen at rest, so
              reduced motion / no-boot shows the screen uncovered (CSS does the
              motion + gating). */}
          {runBoot && (
            <span
              aria-hidden="true"
              className="bm-shutter pointer-events-none absolute inset-0 z-[3] bg-bezel"
              style={{ transform: "translateY(100%)" }}
            >
              <span
                className="bm-scanline absolute inset-x-0 top-0 h-[2px]"
                style={{
                  background: "var(--accent)",
                  boxShadow:
                    "0 0 16px 1px color-mix(in srgb, var(--accent) 75%, transparent)",
                }}
              />
            </span>
          )}

          {/* Pause/play — the WCAG 2.2.2 mechanism for the looping capture.
              Mirrors the badge vocabulary at the opposite corner; ::before
              extends the hit area to a comfortable 44px. Hero mode is always
              standalone (never nested in a card link), so a button is safe. */}
          {showVideo && (
            <button
              type="button"
              onClick={togglePlayback}
              className="absolute bottom-space-2 left-space-2 z-[2] inline-flex items-center gap-[5px] rounded-full bg-black/45 px-space-2 py-[2px] font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm transition-colors duration-fast ease-out-quad before:absolute before:-inset-3 before:content-[''] hover:text-neon"
            >
              <span
                aria-hidden="true"
                className={cn("h-[5px] w-[5px] rounded-full", userPaused ? "bg-white/60" : "bg-neon")}
              />
              {userPaused ? "Play capture" : "Pause capture"}
            </button>
          )}
          {/* Live-capture badge — signals this is a real screen recording (and reads
              "poster" honestly under reduced motion). Hero only. */}
          {hero && (
            <span className="bm-badge pointer-events-none absolute bottom-space-2 right-space-2 z-[2] inline-flex items-center gap-[5px] rounded-full bg-black/45 px-space-2 py-[2px] font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
              <span
                className={cn(
                  "h-[5px] w-[5px] rounded-full",
                  reduced ? "bg-white/60" : "bg-neon motion-safe:animate-status-pulse",
                )}
              />
              {reduced ? "Poster" : "Live capture"}
            </span>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
