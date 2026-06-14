import { ImageResponse } from "next/og";

/*
 * Favicon (32×32) generated via ImageResponse — a dark rounded square with an
 * off-white "PS" monogram. Tight tracking and a weight tuned to stay crisp and
 * legible at tab size. Literal hex (ImageResponse takes raw CSS, not tokens).
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const BG = "#0A0A0B";
const FG = "#F3F3F1";

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
