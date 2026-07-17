/*
 * Hero atmosphere — colour with a REASON. Instead of free-floating gradient
 * blobs (its own template smell), the hero's colour emanates from its one
 * structural colour element: the signal trace. A soft band of the four
 * project hues sits on the trace's latitude and FLOWS ALONG the line — an
 * oversized gradient strip translated slowly on the compositor (transform
 * only, no repaints, no canvas). One quiet violet ember up-right adds depth
 * so the rest of the frame isn't dead. Reduced motion holds the still.
 */

const TRACE_GRADIENT =
  "linear-gradient(90deg, transparent 0%, #2DD4BF 12%, #C9E94B 32%, #F7A53B 52%, #46B4F0 72%, #A98BFF 88%, transparent 100%)";

export function HeroFlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden motion-safe:lg:right-1/2"
    >
      {/* Trace glow — the light the signal line casts. Sits on the wordmark's
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
      {/* One quiet ember for depth — a single cool pool, not a constellation. */}
      <div
        className="absolute"
        style={{
          left: "58%",
          top: "-18%",
          width: "56%",
          height: "52%",
          background:
            "radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, #A98BFF 14%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}
