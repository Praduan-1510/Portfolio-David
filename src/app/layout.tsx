import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/motion";
import { LenisProvider } from "@/lib/lenis/lenis-provider";
import { SITE_URL, site } from "@/lib/site";
import "./globals.css";

/*
 * Self-hosted fonts via next/font/google — downloaded at build time and served
 * from our own origin (zero layout shift, no external requests). Each is wired
 * to a CSS variable consumed by globals.css + tailwind.config.ts fontFamily.
 * Loaded as variable fonts so the full weight axis ships in one file.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Base for resolving relative OG/twitter image paths to absolute URLs.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Praduan Saha — UI/UX & Graphic Designer",
    template: "%s — Praduan Saha",
  },
  description:
    "Graphic and UI/UX designer based in Kolkata, crafting clear, usable interfaces and cohesive brand systems across web, mobile, and visual design.",
  openGraph: {
    title: "Praduan Saha — UI/UX & Graphic Designer",
    description:
      "Portfolio of Praduan Saha — UI/UX and graphic designer focused on clarity, usability, and strong visual systems.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Praduan Saha — UI/UX & Graphic Designer",
    description:
      "Portfolio of Praduan Saha — UI/UX and graphic designer focused on clarity, usability, and strong visual systems.",
  },
};

/*
 * Person JSON-LD — site-wide structured data so search engines understand who
 * this portfolio is about. Facts come from the single source of truth in
 * src/lib/site.ts; nothing is fabricated beyond what's declared there.
 */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: site.jobTitle,
  description: site.description,
  url: SITE_URL,
  sameAs: [site.linkedIn],
  email: `mailto:${site.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.location.addressLocality,
    addressRegion: site.location.addressRegion,
    addressCountry: site.location.addressCountry,
  },
  knowsAbout: ["UI/UX design", "Graphic design", "Figma", "Branding"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="bg-bg text-fg font-sans">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {/* Person structured data (rendered as plain JSON, not user input). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <LenisProvider>
          <ScrollProgress />
          <Nav />
          <main id="main-content">{children}</main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
