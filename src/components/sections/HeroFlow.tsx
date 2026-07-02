/*
 * Hero flow field — living colour for the Instrument hero without the stock
 * shader: four huge, soft radial blooms in the site's hues (violet/blue from
 * the spectrum + two project accents) drifting on very slow CSS transform
 * loops (30-50s, alternating), so the backdrop breathes like slow signal
 * weather behind the type. GPU-cheap (transform/opacity only, no canvas, no
 * per-frame JS) and frozen to a composed still under prefers-reduced-motion
 * (keyframes live behind a motion-safe media query in globals.css).
 * Decorative: aria-hidden, -z, pointer-events-none.
 */

const BLOOMS = [
  // colour, position, size, keyframe, duration, delay
  { c: "#A98BFF", x: "16%", y: "22%", w: "52%", h: "46%", k: "ember-drift-a", d: "38s", del: "0s", a: 0.27 },
  { c: "#46B4F0", x: "82%", y: "16%", w: "48%", h: "44%", k: "ember-drift-b", d: "46s", del: "-12s", a: 0.24 },
  { c: "#F7A53B", x: "74%", y: "84%", w: "50%", h: "46%", k: "ember-drift-c", d: "42s", del: "-24s", a: 0.19 },
  { c: "#2DD4BF", x: "22%", y: "84%", w: "46%", h: "42%", k: "ember-drift-b", d: "52s", del: "-30s", a: 0.17 },
] as const;

export function HeroFlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {BLOOMS.map((b) => (
        <div
          key={`${b.c}-${b.x}`}
          className="absolute"
          style={{
            left: `calc(${b.x} - ${b.w} / 2)`,
            top: `calc(${b.y} - ${b.h} / 2)`,
            width: b.w,
            height: b.h,
            background: `radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, ${b.c} ${Math.round(
              b.a * 100,
            )}%, transparent), transparent 70%)`,
            animation: `${b.k} ${b.d} ease-in-out ${b.del} infinite alternate`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
