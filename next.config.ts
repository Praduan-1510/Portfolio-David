import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // next/image already resizes every image to its rendered size and re-encodes
    // it; default delivery is WebP. Offer AVIF first (~20–30% smaller than WebP on
    // these UI screenshots) so modern browsers get the lighter file, with WebP and
    // then the source format as fallbacks. Encoding is cached after first request.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
