/*
 * GlassFilters: the one hidden <svg> that holds the liquid-glass refraction
 * filter. Render it ONCE, inside <body> (src/app/layout.tsx does). Server
 * component: static markup, no JS.
 *
 * #lg-refract is a TEMPLATE, never referenced by CSS directly: its feImage is
 * empty. Each glass surface is a different size, so useGlassMap() clones it
 * per instance (id from useId), paints that surface's own edge map into the
 * clone's feImage, sets the three displacement strengths and the frost, and
 * appends the clone next to it. Without this component mounted, every surface
 * silently keeps the CSS frosted path.
 *
 * The graph, in order:
 *   map      flood a neutral field (128,128 = still, B 255 = core), then lay
 *            the painted edge map over it, so any area the map does not cover
 *            (mid-resize, before the debounced repaint) is still, never shoved
 *   dr/dg/db three displacements of the backdrop, R weakest and B strongest,
 *            each keeping one channel, screened back together: the rim splits
 *            into a faint prism, the flat middle is untouched
 *   frost    blur the refracted image, keep the blur only where B says "core"
 *            and lay it over the crisp refraction, so the rim stays sharp
 *            enough to SEE bend while the band behind the labels is soft
 *   cap      a highlight shoulder: darks pass through almost linearly, lights
 *            are compressed to ~62%. This is the legibility floor that lets the
 *            tint stay light over the dark site and still hold >= 4.5:1 for
 *            text when the glass floats over a white cover or poster.
 *
 * color-interpolation-filters="sRGB" is load-bearing: in the default linearRGB
 * space a map value of 128 is not 0.5, so "still" would drift.
 */
export function GlassFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <defs>
        <filter
          id="lg-refract"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodColor="rgb(128,128,255)" result="still" />
          <feImage
            data-lg="map"
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="painted"
          />
          <feComposite in="painted" in2="still" operator="over" result="map" />

          <feDisplacementMap data-lg="dr" in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="dR" />
          <feDisplacementMap data-lg="dg" in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="dG" />
          <feDisplacementMap data-lg="db" in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="dB" />
          <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" result="refracted" />

          <feGaussianBlur data-lg="frost" in="refracted" stdDeviation="6" edgeMode="duplicate" result="soft" />
          <feColorMatrix in="map" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0" result="core" />
          <feComposite in="soft" in2="core" operator="in" result="softCore" />
          <feComposite in="softCore" in2="refracted" operator="over" result="glass" />

          <feComponentTransfer in="glass">
            <feFuncR type="table" tableValues="0 0.34 0.5 0.62" />
            <feFuncG type="table" tableValues="0 0.34 0.5 0.62" />
            <feFuncB type="table" tableValues="0 0.34 0.5 0.62" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}
