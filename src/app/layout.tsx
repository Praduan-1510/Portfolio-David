import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Inter,
  JetBrains_Mono,
  Mrs_Saint_Delafield,
} from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/motion";
import { LenisProvider } from "@/lib/lenis/lenis-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, site } from "@/lib/site";
import "./globals.css";

/*
 * Self-hosted fonts via next/font/google: downloaded at build time and served
 * from our own origin (no external requests). Each is wired
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

// The `fallback` list is load-bearing, not decoration. next/font synthesises a
// metric-adjusted fallback from the FIRST family in this list; left to itself it
// picks Arial and lands on size-adjust:134.59%, because JetBrains Mono's fixed
// advance is far wider than Arial's average. That average is the problem: on
// UPPERCASE mono — which is most of this site's metadata — scaled Arial caps run
// ~40% wider than the real font, and the hero eyebrow "PRODUCT DESIGNER ·
// FRONT-END" wrapped to two lines before the webfont arrived and snapped back to
// one after it. That single re-wrap was an 18px collapse of the hero, which
// shoved the near-full-viewport reel stage and measured CLS 0.208 on every cold
// mobile load. Falling back to a real monospace keeps the advance width right,
// so the line count cannot change. Measured, not assumed — see the commit.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

// Signature script: used ONCE (the hero's hand-signed counter-mark to the
// machine-set split-flap). Single weight, tiny subset; still self-hosted.
const signature = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature",
  display: "swap",
});

// Tint mobile browser chrome to the near-black base (address bar, overscroll).
export const viewport: Viewport = { themeColor: "#0d0d10" };

export const metadata: Metadata = {
  // Base for resolving relative OG/twitter image paths to absolute URLs.
  metadataBase: new URL(SITE_URL),
  // Home canonical. Each sub-page overrides alternates.canonical with its own
  // path (metadata merges per-field, so an un-overridden page would otherwise
  // inherit "/"). metadataBase resolves these relative paths to absolute URLs.
  alternates: { canonical: "/" },
  // Flame "P" logo icon set: static PNGs in public/Favicon (16/32/180/512) +
  // a real public/favicon.ico (16+32). The .ico is listed first with sizes:"any"
  // as the universal fallback: Safari is unreliable with PNG-only favicons and
  // wants a classic /favicon.ico. The ?v query busts the favicon cache when the
  // art changes (bump it on each art change). These override the generated
  // icon.tsx/apple-icon.tsx routes; Next emits the <link rel="icon"> / apple-
  // touch tags for them.
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/Favicon/favicon-32.png?v=3", type: "image/png", sizes: "32x32" },
      { url: "/Favicon/favicon-16.png?v=3", type: "image/png", sizes: "16x16" },
    ],
    apple: { url: "/Favicon/apple-touch-icon.png?v=3", sizes: "180x180" },
  },
  title: {
    default: "Praduan Saha: Product Designer (Design + Front-End)",
    template: "%s · Praduan Saha",
  },
  description:
    "Product designer and front-end designer in Kolkata, working on operational B2B software: ledgers, consoles and multi-tenant tools, where trust and permissions are the hard part.",
  openGraph: {
    title: "Praduan Saha: Product Designer (Design + Front-End)",
    description:
      "Portfolio of Praduan Saha: a product designer who designs and ships operational B2B software — ledgers, consoles and multi-tenant tools you can open and use on the page.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Praduan Saha: Product Designer (Design + Front-End)",
    description:
      "Portfolio of Praduan Saha: a product designer who designs and ships operational B2B software — ledgers, consoles and multi-tenant tools you can open and use on the page.",
  },
};

/*
 * Person JSON-LD: site-wide structured data so search engines understand who
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
  image: `${SITE_URL}/images/about/portrait.webp`,
  sameAs: [site.linkedIn, "https://github.com/Praduan-1510"],
  email: `mailto:${site.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.location.addressLocality,
    addressRegion: site.location.addressRegion,
    addressCountry: site.location.addressCountry,
  },
  knowsAbout: [
    "Product design",
    "UI/UX design",
    "Front-end development",
    "Design systems",
    "Figma",
    "Graphic design",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${signature.variable}`}
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
