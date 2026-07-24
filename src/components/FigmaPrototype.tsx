"use client";

import Image from "next/image";
import { useState } from "react";
import blurMap from "@/lib/content/blur-map.json";

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * FigmaPrototype — an interactive Figma prototype embedded in a clean device
 * "screen well" (the BrowserMockup / PhoneFrame vocabulary: raised --surface
 * body, hairline rim, --bezel well, glass sheen).
 *
 * The heavy Figma iframe loads ONLY on click ("Launch prototype"): until then
 * the well shows a poster still (or a graceful placeholder), so a third-party
 * app is never streamed on page load and the embed stays off the LCP path —
 * the same discipline as BrowserMockup's preload="none". Reduced-motion safe:
 * revealing the prototype is a click, not an animation.
 *
 * `aspectRatio` is a CSS aspect-ratio STRING (the house convention — see
 * BrowserMockup `aspect`), default "390 / 844" (portrait phone). The well width
 * is capped so a tall portrait ratio can't blow out the column height.
 */
interface FigmaPrototypeProps {
  /** Figma embed URL (embed.figma.com/proto/…&embed-host=share). */
  embedUrl: string;
  /** Still shown before the prototype is launched (click-to-load cover). */
  poster?: string;
  /** Accessible description of the poster still. */
  posterAlt?: string;
  /** Mono-caps caption under the frame. */
  caption?: string;
  /** CSS aspect-ratio string for the screen well. Default "390 / 844". */
  aspectRatio?: string;
}

export function FigmaPrototype({
  embedUrl,
  poster,
  posterAlt = "",
  caption,
  aspectRatio = "390 / 844",
}: FigmaPrototypeProps) {
  const [launched, setLaunched] = useState(false);

  return (
    <figure className="cs-wide my-space-9 flex flex-col items-center">
      {/* Width cap keeps a tall portrait ratio from dominating the column. */}
      <div className="w-full max-w-[22rem]">
        <div className="relative overflow-hidden rounded-[1.4rem] border border-white/12 bg-surface p-[6px] shadow-[0_28px_70px_-24px_rgba(0,0,0,0.85),0_2px_8px_-2px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]">
          {/* Screen well — holds the poster cover, then the live iframe. */}
          <div
            className="relative overflow-hidden rounded-[1.05rem] bg-bezel"
            style={{ aspectRatio }}
          >
            {launched ? (
              <iframe
                src={embedUrl}
                title={caption ?? "Interactive Figma prototype"}
                loading="lazy"
                allow="fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setLaunched(true)}
                aria-label="Launch the interactive Figma prototype"
                className="group absolute inset-0 flex flex-col items-center justify-center gap-space-4"
              >
                {poster ? (
                  <Image
                    src={poster}
                    alt={posterAlt}
                    fill
                    sizes="(min-width: 640px) 22rem, 80vw"
                    placeholder={blurFor(poster) ? "blur" : "empty"}
                    blurDataURL={blurFor(poster)}
                    className="object-cover object-top"
                  />
                ) : (
                  // Graceful placeholder cover when no poster still is supplied.
                  <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%), var(--bezel)",
                    }}
                  />
                )}
                {/* Scrim so the launch affordance reads over any poster. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-black/35 transition-colors duration-fast ease-out-quad group-hover:bg-black/25"
                />
                {/* Launch affordance — play glyph + label. */}
                <span
                  aria-hidden="true"
                  className="relative z-[1] flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-sm transition-[transform,border-color] duration-fast ease-out-quad group-hover:-translate-y-0.5 group-hover:border-neon"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="currentColor"
                    className="translate-x-[1px]"
                  >
                    <path d="M4 3.2v11.6L14.5 9 4 3.2z" />
                  </svg>
                </span>
                <span className="relative z-[1] font-mono text-caption uppercase tracking-[0.14em] text-white/90">
                  Launch prototype
                </span>
              </button>
            )}

            {/* Glass sheen — the PhoneFrame/BrowserMockup edge vocabulary. Only on
                the cover; a live prototype must stay crisp and unobstructed. */}
            {!launched && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[2] rounded-[1.05rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
              />
            )}
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-space-3 font-mono text-caption uppercase tracking-[0.14em] text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
