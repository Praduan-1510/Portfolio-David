import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // next/image already resizes every image to its rendered size and re-encodes
    // it; default delivery is WebP. Offer AVIF first (~20–30% smaller than WebP on
    // these UI screenshots) so modern browsers get the lighter file, with WebP and
    // then the source format as fallbacks. Encoding is cached after first request.
    formats: ["image/avif", "image/webp"],
    // Cap the generated variants at 1920. No slot on the site needs more: the
    // widest image is the case-study hero (~1248px) and the widest still is the
    // InsightsTap wide shot (~658px → 1316px @2×), both under 1920. Dropping the
    // default 2048 + 3840 tiers guarantees we never ship a 3840px file into a
    // few-hundred-px slot on a wide/retina screen.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    return [
      {
        // The Meridian prototype ships as raw static HTML under /prototype so it
        // can be framed same-origin by the case study. It carries its own titles,
        // nav, and landing page: left crawlable it would read as a second site
        // and compete with /work/meridian, which is the piece meant to be found.
        source: "/prototype/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
