import NextLink from "next/link";
import Image from "next/image";
import { Container, Text } from "@/components/primitives";
import { AnimatedDivider, StaggerGroup } from "@/components/motion";
import { durations } from "@/lib/motion/durations";
import { distance, stagger } from "@/lib/motion/tokens";
import { site } from "@/lib/site";

/*
 * Site footer. Static server component: mark, one-line descriptor, nav, social,
 * copyright. Copy is verbatim from docs/reference/Site.md.
 *
 * Its seam IS the closing rule: no border-t. The rule draws from the centre
 * outward with the register ticks at both gutters, and the two column groups
 * rise behind it. The copyright line does nothing.
 */
const nav = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Résumé" },
  { href: "/contact", label: "Contact" },
];

const socials = [
  { href: site.linkedIn, label: "LinkedIn" },
  { href: "https://github.com/Praduan-1510", label: "GitHub" },
  { href: `mailto:${site.email}`, label: "Email" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-space-9">
      {/* Closing rule: inside a Container so its ticks land on the same gutter
          register as every other seam on the page. Slower than a section seam
          (the site's last beat), ink heaviest in the middle and fading toward
          both gutters. Decorative. */}
      <Container as="div" className="pointer-events-none absolute inset-x-0 top-0">
        <AnimatedDivider ink="rule" from="center" ticks duration={durations.slower} />
      </Container>

      <Container as="div" className="flex flex-col gap-space-8 py-space-9 md:flex-row md:items-start md:justify-between">
        {/* Two groups so the four columns cascade as one sequence: mark,
            descriptor, then (one stagger step later) nav and social. */}
        <StaggerGroup y={distance.sm} className="max-w-[40ch]">
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
            Product designer &amp; front-end designer. Clarity, usable systems,
            shipped to production.
          </Text>
        </StaggerGroup>

        <StaggerGroup y={distance.sm} delay={stagger.base * 2} className="flex gap-space-9">
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
        </StaggerGroup>
      </Container>

      <Container as="div" className="border-t border-line py-space-5">
        <span className="font-mono text-caption text-muted">
          © {year} Praduan Saha
        </span>
      </Container>
    </footer>
  );
}
