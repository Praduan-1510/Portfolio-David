"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";

/*
 * Decorative, non-interactive Google Map used as the hero TEXTURE (not a focal
 * element). Styled dark-monochrome via the `styles` prop — and deliberately NO
 * mapId: `styles` and `mapId` are mutually exclusive (a mapId makes Google ignore
 * inline styles). Centred on Kolkata, low zoom, all interaction disabled.
 *
 * The key is read from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (referrer-restricted,
 * .env.local only). With no key the component renders nothing, so the hero
 * degrades cleanly to its near-black base + scrim (see HeroMapBackground).
 *
 * Lazy-loaded by HeroMapBackground via next/dynamic(ssr:false) so it never blocks
 * the hero LCP. aria-hidden + pointer-events:none are applied by the parent.
 */

// Praduan is based in Kolkata, West Bengal.
const KOLKATA = { lat: 22.5726, lng: 88.3639 };

// Dark monochrome style — tuned to the site's --bg (#0A0A0B) so the map reads as
// quiet near-black texture. Labels/POI/administrative/transit hidden; only the
// faint road + landscape + water geometry remains.
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#101014" }] },
  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#141418" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#26262c" }, { weight: 0.5 }],
  },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#303038" }] },
  { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#202026" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#0a0a0c" }] },
];

export function HeroMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null; // no key → clean dark fallback (no broken map)

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={KOLKATA}
        defaultZoom={12}
        styles={MAP_STYLE}
        // Fully non-interactive, decorative texture.
        disableDefaultUI
        gestureHandling="none"
        keyboardShortcuts={false}
        clickableIcons={false}
        // Cosmetic only — the map background colour matches --bg so the tile area
        // is near-black before/while tiles load (no grey flash).
        backgroundColor="#0a0a0b"
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      />
    </APIProvider>
  );
}
