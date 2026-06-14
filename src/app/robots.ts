import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * robots.txt. Everything is crawlable except /playground (a dev sandbox, not
 * portfolio content). Points crawlers at the sitemap and declares the canonical
 * host so SITE_URL stays the one source of truth.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/playground"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
