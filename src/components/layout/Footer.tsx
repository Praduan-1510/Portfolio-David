import NextLink from "next/link";
import { Container, Text } from "@/components/primitives";

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
  {
    href: "https://www.linkedin.com/in/praduan-saha-9a8965172",
    label: "LinkedIn",
  },
  { href: "mailto:spraduan@gmail.com", label: "Email" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-space-11 border-t border-line">
      <Container as="div" className="flex flex-col gap-space-8 py-space-9 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[40ch]">
          <p className="font-display text-body-l font-semibold tracking-[-0.02em]">
            Praduan Saha
          </p>
          <Text variant="body" className="mt-space-3 text-muted">
            UI/UX &amp; graphic designer. Clarity, usability, and strong visual
            systems.
          </Text>
        </div>

        <div className="flex gap-space-9">
          <nav aria-label="Footer">
            <ul className="space-y-space-2">
              {nav.map((item) => (
                <li key={item.href}>
                  <NextLink
                    href={item.href}
                    className="font-sans text-caption text-muted hover:text-fg"
                  >
                    {item.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Social">
            <ul className="space-y-space-2">
              {socials.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    className="font-sans text-caption text-muted hover:text-fg"
                  >
                    {item.label}
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
