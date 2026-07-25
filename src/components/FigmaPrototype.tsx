"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { PhoneFrame } from "@/components/primitives";
import blurMap from "@/lib/content/blur-map.json";

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * FigmaPrototype — the real Figma prototype, embedded, but not at the cost of
 * the page.
 *
 * WHY IT IS CLICK-TO-LAUNCH. Measured on this route (puppeteer against dev):
 * with the iframe in the markup, the case study fired **197 requests to
 * figma.com, the first at +199ms and the last still arriving at +10.4s**.
 * `loading="lazy"` did not save it — Chrome's lazy threshold for iframes is
 * generous enough that a below-the-fold embed still begins loading essentially
 * at navigation, so Figma's whole runtime competed with the page's own content
 * on every visit, whether or not the reader ever scrolled to it. Deferring the
 * mount takes that to zero.
 *
 * It does NOT make Figma fast, and the UI says so rather than implying an
 * instant demo: insertion to the iframe's load event measures ~1.5s, and the
 * artboard paints seconds after that. So the poster stays on screen UNDER the
 * iframe and the frame cross-fades only once Figma has actually painted —
 * otherwise the reader watches Figma's white loading shell strobe on a
 * near-black page, which reads as a bug.
 *
 * DEVICE ART. Dormant, the poster sits in a real PhoneFrame so the beat reads
 * as this site's work. Live, the frame is bare: the Figma artboard renders its
 * own iPhone body, and wrapping that in PhoneFrame would nest a phone inside a
 * phone.
 *
 * URL PARAMS (verified empirically, not assumed — each was loaded and
 * screenshotted): `footer=0` removes Figma's chrome bar, which otherwise puts a
 * bright white band across the bottom of the frame advertising the FILE's name
 * ("E-Commerce V1 · Edited 8 months ago") on a study titled Spendee. `theme=dark`
 * keeps its shell from flashing white. The cost is that `footer=0` also removes
 * Figma's own back/forward/restart arrows — so Restart is rebuilt below in our
 * own vocabulary (a key bump remounts the frame at the starting node).
 */
interface FigmaPrototypeProps {
  /** Figma embed URL (embed.figma.com/proto/…&embed-host=share). */
  embedUrl: string;
  /** Still of the prototype's first screen — a bare screen render, no device
   *  art. Doubles as the backdrop while Figma paints, so it must match the
   *  prototype's starting frame or launching reads as a jump cut. */
  poster: string;
  /** Accessible description of the poster. */
  posterAlt: string;
  /** Accessible iframe title. */
  title?: string;
  /** CSS aspect-ratio string for the frame. Default "390 / 844". */
  aspectRatio?: string;
  /** Caption under the frame, in the house mono treatment. */
  caption?: string;
  /** next/image sizes hint for the poster. */
  sizes?: string;
  /** Max width of the frame as a raw CSS length. Applied inline so a caller can
   *  always win — `cn` is a plain join, so a className cap wouldn't reliably
   *  override the default. */
  maxWidth?: string;
  className?: string;
}

/** Figma's own chrome leaks the FILE name and flashes white; suppress both.
 *  Appended rather than baked into frontmatter so the reasoning lives with the
 *  component that depends on it. */
function tuneEmbedUrl(url: string): string {
  const out = new URL(url);
  out.searchParams.set("footer", "0");
  out.searchParams.set("theme", "dark");
  return out.toString();
}

/** Ratio as a number, for the CSS height cap. "390 / 844" → 0.462. */
function ratioOf(aspect: string): number {
  const [w, h] = aspect.split("/").map((n) => Number(n.trim()));
  return w > 0 && h > 0 ? w / h : 390 / 844;
}

export function FigmaPrototype({
  embedUrl,
  poster,
  posterAlt,
  title = "Interactive Figma prototype",
  aspectRatio = "390 / 844",
  caption,
  sizes = "(min-width: 640px) 24rem, 78vw",
  maxWidth = "24rem",
  className,
}: FigmaPrototypeProps) {
  const [live, setLive] = useState(false);
  const [painted, setPainted] = useState(false);
  // Bumped by Restart; keying the iframe on it remounts at the starting node.
  const [runKey, setRunKey] = useState(0);

  const launch = useCallback(() => setLive(true), []);
  const restart = useCallback(() => {
    setPainted(false);
    setRunKey((n) => n + 1);
  }, []);

  // The iframe's load event fires on Figma's loading shell, well before the
  // artboard is on screen. There is no cross-origin signal for "painted", so
  // the poster is held for a short dwell past load rather than cutting to a
  // white rectangle. Honest and cheap; the poster IS the first frame, so a late
  // cross-fade costs the reader nothing.
  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => setPainted(true), 2600);
    return () => clearTimeout(t);
  }, [live, runKey]);

  const src = tuneEmbedUrl(embedUrl);

  return (
    <figure className={cn("not-prose group/fp w-full", className)}>
      <div
        className="fp-frame"
        style={
          { maxWidth, "--fp-ratio": String(ratioOf(aspectRatio)) } as React.CSSProperties
        }
      >
        {live ? (
          /* No frame of our own once it's live. Figma reserves room inside the
             embed for its nav arrows and letterboxes the artboard to fit, so the
             phone always renders smaller than the box — inside a bordered shell
             that reads as a badly fitted frame. Dropping the shell lets Figma's
             own device art float on the page instead, and the size difference
             reads as the prototype rather than as a mistake. */
          <div className="relative" style={{ aspectRatio }}>
            {/* The first frame, held under the iframe until Figma has painted, so
                launching is a cross-fade between two identical screens. Masked to
                the phone's own footprint so it doesn't stretch across the box. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 mx-auto block h-full overflow-hidden rounded-[2rem] transition-opacity duration-slow ease-out-quad",
                painted ? "opacity-0" : "opacity-100",
              )}
              style={{ aspectRatio }}
            >
              <Image
                src={poster}
                alt=""
                fill
                sizes={sizes}
                placeholder={blurFor(poster) ? "blur" : "empty"}
                blurDataURL={blurFor(poster)}
                className="object-cover"
              />
            </span>
            <iframe
              key={runKey}
              src={src}
              title={title}
              // Opts out of Lenis's blanket pointer-events:none on iframes, which
              // would otherwise eat clicks for the ~0.3–1s a smooth scroll coasts
              // (see the rule in globals.css).
              data-live-frame
              allow="fullscreen"
              allowFullScreen
              className={cn(
                "absolute inset-0 h-full w-full border-0 transition-opacity duration-slow ease-out-quad",
                painted ? "opacity-100" : "opacity-0",
              )}
            />
            {!painted && (
              <span className="pointer-events-none absolute inset-x-0 bottom-space-4 z-[1] flex items-center justify-center gap-space-2 font-mono text-caption uppercase tracking-[0.14em] text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
                <span
                  aria-hidden="true"
                  className="h-[6px] w-[6px] rounded-full bg-accent motion-safe:animate-status-pulse"
                />
                Starting Figma…
              </span>
            )}
          </div>
        ) : (
          /* The control sits BELOW the phone, not on it. This poster is a full
             splash screen with content to every edge — its own two buttons are
             at the bottom — so anything overlaid either veils the work this beat
             exists to show or collides with the design's own controls. Keeping
             the screen untouched and grounding the affordance underneath solves
             both, and the phone lifts with the button on hover so the two still
             read as one object. */
          <PhoneFrame
            src={poster}
            alt={posterAlt}
            sizes={sizes}
            className="transition-transform duration-base ease-out-quad group-hover/fp:-translate-y-1"
          />
        )}
      </div>

      <div className="mt-space-5 flex justify-center">
        {live ? (
          /* Restart — Figma's own arrows go away with footer=0, so the one
             control a prototype genuinely needs is rebuilt in our vocabulary. */
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-space-2 rounded-full border border-line px-space-4 py-space-2 font-mono text-caption uppercase tracking-[0.14em] text-muted transition-colors duration-fast ease-out-quad hover:border-neon hover:text-neon"
          >
            <span aria-hidden="true">↺</span> Restart the prototype
          </button>
        ) : (
          <button
            type="button"
            onClick={launch}
            className="lp-launch inline-flex items-center gap-space-2 rounded-full border border-accent bg-accent/10 px-space-5 py-space-3 font-mono text-caption uppercase tracking-[0.14em] text-fg transition-colors duration-fast ease-out-quad hover:border-neon hover:text-neon"
          >
            <span aria-hidden="true" className="h-[6px] w-[6px] rounded-full bg-accent" />
            Launch the prototype
          </button>
        )}
      </div>

      {(caption || !live) && (
        <figcaption className="mx-auto mt-space-4 max-w-[52ch] text-center font-mono text-caption uppercase tracking-[0.14em] text-muted">
          {caption}
          {/* The honest note lives here rather than on the screen: over the
              artwork it crowded the prototype's own buttons, and the wait is
              context for the control, not a label on the design. */}
          {!live && (
            <span className="mt-space-2 block normal-case tracking-normal text-muted opacity-70">
              Loads on demand — a few seconds to start.
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
