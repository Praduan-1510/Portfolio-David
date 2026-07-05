import NextLink from "next/link";
import Image from "next/image";
import { Container, Text } from "@/components/primitives";
import { site } from "@/lib/site";

/*
 * Site footer. Static server component — mark, one-line descriptor, nav, social,
 * copyright. Copy is verbatim from Content/Site.md.
 */
const nav = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const socials = [
  { href: site.linkedIn, label: "LinkedIn" },
  { href: `mailto:${site.email}`, label: "Email" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-space-9 border-t border-line">
      {/* Closing spectrum thread — the hero opens by resolving the spectrum into
          the wordmark; the footer lays it back out flat across the top edge as a
          bookend. Faded ends so it's a thread, not a bar. Decorative. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "var(--spectrum-gradient)",
          opacity: 0.7,
          maskImage:
            "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        }}
      />
      <Container as="div" className="flex flex-col gap-space-8 py-space-9 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[40ch]">
          <p className="flex items-center gap-space-2 font-display text-body-l font-semibold tracking-[-0.02em]">
            <Image
              src="/Favicon/icon-512.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-[6px]"
            />
            Praduan Saha
          </p>
          <Text variant="body" className="mt-space-3 text-muted">
            Product designer &amp; front-end developer. Clarity, usable systems,
            shipped to production.
          </Text>
        </div>

        <div className="flex gap-space-9">
          <nav aria-label="Footer">
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <NextLink
                    href={item.href}
                    className="inline-flex min-h-[44px] items-center font-sans text-caption text-muted transition-colors duration-fast ease-out-quad hover:text-fg"
                  >
                    {item.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Social">
            <ul>
              {socials.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    className="inline-flex min-h-[44px] items-center font-sans text-caption text-muted transition-colors duration-fast ease-out-quad hover:text-fg"
                  >
                    {item.label}
                    {item.href.startsWith("http") && (
                      <span className="sr-only"> (opens in a new tab)</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>

      <Container as="div" className="border-t border-line py-space-5">
        <span className="font-mono text-caption text-muted">
          © {year} Praduan Saha
        </span>
      </Container>
    </footer>
  );
}
