import { ImageResponse } from "next/og";

/*
 * Apple touch icon (180×180) — the favicon's neon-green "PS" monogram scaled for
 * a home screen. iOS squares the corners itself, so the tile is a full-bleed dark
 * square (no baked radius). Literal hex (ImageResponse takes raw CSS, not tokens;
 * keep in sync with --neon-green).
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BG = "#0A0A0B";
const FG = "#39FF6A"; // --neon-green (site signal colour)

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          color: FG,
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: -5,
        }}
      >
        PS
      </div>
    ),
    size,
  );
}
