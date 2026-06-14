import { ImageResponse } from "next/og";
import { site, SITE_URL } from "@/lib/site";

// Caption host tracks the single source of truth, so the card never contradicts
// the live domain (e.g. on preview deploys or once the production domain changes).
const SITE_HOST = new URL(SITE_URL).host;

/*
 * Root social card (1200×630). Dark-monochrome, instrument-grade composition:
 * left-aligned with generous padding, a hairline frame + corner ticks, the name
 * set large in off-white, a muted role line, and a small mono caption — colour
 * is held back intentionally, matching the site system.
 *
 * Dependency-free: next/og's ImageResponse uses its built-in font, so there are
 * no external font fetches to fail at build/edge time. Literal hex is required
 * here because ImageResponse takes raw CSS, not Tailwind tokens.
 */
export const alt = "Praduan Saha — UI/UX & Graphic Designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Design tokens (raw hex — ImageResponse can't read Tailwind classes).
const BG = "#0A0A0B";
const FG = "#F3F3F1";
const MUTED = "#8C8C92";
const LINE = "rgba(255,255,255,0.10)";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          color: FG,
          padding: 80,
        }}
      >
        {/* Hairline frame — the faint grid hint that frames the composition. */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: `1px solid ${LINE}`,
          }}
        />

        {/* Top row: a small mono-style marker, like an instrument label. */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          Portfolio · 2026
        </div>

        {/* Name + role, anchored bottom-left. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 132,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: -3,
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 40,
              color: MUTED,
              letterSpacing: -0.5,
            }}
          >
            {site.jobTitle}
          </div>
        </div>

        {/* Bottom mono caption — location + medium. */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          Kolkata · {SITE_HOST}
        </div>
      </div>
    ),
    { ...size },
  );
}
