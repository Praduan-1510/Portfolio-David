import { ImageResponse } from "next/og";

/*
 * Favicon (32×32) generated via ImageResponse — a dark rounded square with a
 * neon-green "PS" monogram (the site's one interaction/signal colour), so the
 * browser-tab mark carries the same signal green used site-wide. Tight tracking
 * and a weight tuned to stay crisp and legible at tab size. Literal hex
 * (ImageResponse takes raw CSS, not tokens; keep in sync with --neon-green).
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const BG = "#0A0A0B";
const FG = "#39FF6A"; // --neon-green (site signal colour)

export default function Icon() {
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
          borderRadius: 7,
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        PS
      </div>
    ),
    { ...size },
  );
}
