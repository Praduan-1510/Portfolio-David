import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/content/work";
import { site } from "@/lib/site";

/*
 * Per-case-study social card (1200×630). Mirrors the root OG composition (same
 * dark frame, same left-aligned, instrument-grade rhythm) but themed to the
 * project's own accent: an accent dot + a thin accent rule under the title.
 * Falls back to a sensible card if the slug is missing (route is static, but
 * keep it robust). Literal hex required by ImageResponse (no Tailwind tokens).
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-image metadata so each card's og:image:alt names its own project instead
// of a single generic "Case study · Praduan Saha" for all four. The default
// export below renders the one image this returns (id "card").
export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const alt = project
    ? `${project.meta.title}, case study`
    : "Case study · Praduan Saha";
  return [{ id: "card", alt, size, contentType }];
}

const BG = "#0D0D10";
const FG = "#F7F0E4";
const MUTED = "#A09689";
const LINE = "rgba(247,240,228,0.12)";
// Default accent if a project omits one. This used to be FG, on the reasoning
// that a missing colour should read as a neutral hairline, and nothing
// exercised it because every study set an accent. Voyager now deliberately
// omits one (see voyager.mdx: its brand amber measures dE 5.5 from the site's
// flame, so it inherits the voice instead of faking a distinction), which
// makes this branch live: it has to match what the ROUTE renders, or the
// share card and the page disagree. --accent falls back to --flame-500 in
// :root, so this does too.
const DEFAULT_ACCENT = "#FB7B20"; // --flame-500, the site's voice

/** Trim the summary so it never overruns the card. */
function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  const title = project?.meta.title ?? "Case study";
  const summary = project
    ? truncate(project.meta.summary)
    : site.description;
  const accent = project?.meta.accent ?? DEFAULT_ACCENT;
  const client = project ? `${project.meta.client} · ${project.meta.year}` : site.name;

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
        {/* Hairline frame. */}
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

        {/* Top row: accent dot + client/year marker. */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: accent,
              marginRight: 18,
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {client}
          </div>
        </div>

        {/* Title + accent rule + summary, anchored bottom-left. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 104,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: -3,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {/* Thin accent rule: the per-project colour cue. */}
          <div
            style={{
              marginTop: 36,
              width: 140,
              height: 3,
              background: accent,
            }}
          />
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              lineHeight: 1.3,
              color: MUTED,
              maxWidth: 880,
              letterSpacing: -0.5,
            }}
          >
            {summary}
          </div>
        </div>

        {/* Bottom mono caption, attribution. */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          {site.name} · Portfolio
        </div>
      </div>
    ),
    { ...size },
  );
}
