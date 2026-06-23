/*
 * Single source of truth for site-wide constants (name, role, contact, URLs).
 * Metadata, JSON-LD, sitemap/robots, and the OG images all import from here so
 * there's exactly one place to update a fact — and no drift between them.
 */

// Production origin (confirmed). Overridable per-environment (preview deploys
// etc.) via NEXT_PUBLIC_SITE_URL, and used as the base for metadataBase,
// canonical URLs, sitemap entries and JSON-LD ids.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://praduansaha.com";

/** Person / site facts. Kept verbatim from Content/Site.md — do not fabricate. */
export const site = {
  name: "Praduan Saha",
  jobTitle: "Product Designer (Design + Front-End)",
  description:
    "Product designer who also ships front-end — turning complex, data-heavy ideas into clear, usable interfaces and the systems that hold them together.",
  email: "spraduan@gmail.com",
  linkedIn: "https://www.linkedin.com/in/praduan-saha-9a8965172/",
  location: {
    addressLocality: "Kolkata",
    addressRegion: "West Bengal",
    addressCountry: "IN",
  },
} as const;
