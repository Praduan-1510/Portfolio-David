import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getProjectSlugs } from "@/lib/content/work";

/*
 * XML sitemap (build-time). Static routes plus one entry per case study, all
 * resolved against SITE_URL. `new Date()` runs once at build, so generation
 * stays static and deterministic-per-build. Home ranks highest; case studies
 * sit just below the work index.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/work`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified, changeFrequency: "yearly", priority: 0.6 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = getProjectSlugs().map((slug) => ({
    url: `${SITE_URL}/work/${slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes];
}
