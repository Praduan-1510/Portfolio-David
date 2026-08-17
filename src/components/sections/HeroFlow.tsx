import { cn } from "@/lib/utils/cn";

/*
 * Hero atmosphere: colour with a REASON. Instead of free-floating gradient
 * blobs (its own template smell), the hero's colour emanates from its one
 * structural colour element: the signal trace. A soft band of the flame ramp
 * sits on the trace's latitude and FLOWS ALONG the line: an
 * oversized gradient strip translated slowly on the compositor (transform
 * only, no repaints, no canvas). One quiet ember up-right adds depth so the
 * rest of the frame isn't dead. Reduced motion holds the still.
 */

/* The signal trace. Was five hard-coded project/spectrum hues in one string
   (#2DD4BF, #C9E94B, #F7A53B, #46B4F0, #A98BFF): the single biggest bypass of
   the token system on the site, and a rainbow at that. Then it was the
   vermilion voice, but with a stray #E8A317 (Voyager's guest amber) sitting
   in the middle of it, which meant the home hero was painting one project's
   colour for no stated reason.
   It now runs the LOGO'S OWN GRADIENT, laid on its side: tip, mean, foot, in
   that order, the same three steps in the same sequence the icon reads from
   top to bottom. The trace is the one place on the site where the flame gets
   to be a ramp rather than a single step, which is what the mark itself is.
   Literal hex rather than var() is deliberate: this is a painted artwork
   gradient, not chrome, and the token names are written beside the values so
   a future repaint can find them. */
const TRACE_GRADIENT =
  "linear-gradient(90deg, transparent 0%, #F8B838 16%, #FB7B20 42%, #F03E17 66%, #212129 86%, transparent 100%)"; /* flame-300, flame-500, flame-700, graphite-700 */

export function HeroFlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {/* Trace glow: the light the signal line casts. Sits on the wordmark's
          baseline latitude (~52% at desktop compositions), soft-masked so it
          reads as glow, not a band. The inner strip is 3x wide and drifts on
          a slow transform loop: the hues literally flow along the line. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "34%",
          height: "38%",
          maskImage:
            "radial-gradient(60% 46% at 62% 50%, #000 0%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(60% 46% at 62% 50%, #000 0%, transparent 92%)",
        }}
      >
        <div
          className="absolute inset-y-0 w-[300%] motion-safe:animate-trace-flow"
          style={{
            left: "-100%",
            background: `${TRACE_GRADIENT}, ${TRACE_GRADIENT}`,
            backgroundSize: "50% 100%, 50% 100%",
            backgroundPosition: "0% 0%, 50% 0%",
            backgroundRepeat: "repeat-x",
            opacity: 0.1,
            willChange: "transform",
          }}
        />
      </div>
      {/* One quiet ember for depth: a single warm pool, not a constellation. */}
      <div
        className="absolute"
        style={{
          left: "58%",
          top: "-18%",
          width: "56%",
          height: "52%",
          background:
            /* was #A98BFF at 14%: a violet bloom, and violet is exactly the
               hue a generated palette reaches for. Now the logo's third fact
               at the same dosage: warm light spilling onto a cool ground,
               which is measurable in the icon as #17110E behind the mark
               against a #0C0C0F field. On the old WARM graphite this bloom
               had nothing to be warm against; it does now. */
            "radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, #FB7B20 14%, transparent), transparent 70%)" /* flame-500 */,
        }}
      />
    </div>
  );
}
