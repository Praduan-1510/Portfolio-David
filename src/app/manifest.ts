import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/*
 * Web app manifest — names the site for installs/shortcuts and locks browser
 * chrome to the near-black base so a saved shortcut opens on-theme.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Product Designer`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    icons: [
      { src: "/Favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
      { src: "/Favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/Favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/Favicon/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
