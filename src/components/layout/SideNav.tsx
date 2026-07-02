"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLenis } from "@/lib/lenis/useLenis";
import { spectrumAt } from "@/lib/spectrum";

/*
 * Desktop-only left rail — a section-aware scroll indicator that COMPLEMENTS the
 * top <Nav> (it scrolls to in-page sections rather than routing). Hidden below md,
 * so the mobile hamburger nav is untouched. Ported from the v0 export and adapted:
 *   - cn import points at our util (@/lib/utils/cn);
 *   - hardcoded template ids/labels swapped for our real home-page section ids
 *     (each must exist on the home page — see src/app/page.tsx);
 *   - template classes (border-border/bg-background/muted-foreground) remapped to
 *     our semantic tokens (line/bg/muted/accent/fg); the /opacity modifiers the
 *     template used don't work on our var() tokens, so dot dimming uses opacity-*;
 *   - z-40 keeps it beneath the sticky top nav (z-50);
 *   - reduced-motion switches scrollIntoView to behavior:"auto".
 */
const navItems = [
  { id: "top", label: "Index" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

export function SideNav() {
  const [activeSection, setActiveSection] = useState<string>("top");
  const reduced = useReducedMotion();
  const lenis = useLenis();
  // Desktop, mouse-only affordance. It duplicates the top <Nav>, its labels only
  // reveal on hover, and its fixed rail would otherwise paint over the left gutter
  // of the content on tablets — so it's gated to a fine pointer at lg+ (touch
  // tablets fall back to the top nav). SSR-false → it mounts after hydration.
  const enabled = useMediaQuery("(min-width: 1024px) and (pointer: fine)");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3 },
    );

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Anchor enhancement: the rail renders real <a href="#id"> links (deep-linkable,
  // functional without JS); the handler keeps Lenis driving the scroll and records
  // the hash without a native jump.
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.history.pushState(null, "", `#${id}`);
    // Scroll through the single engine (Lenis) when it's active — Lenis forces
    // scroll-behavior:auto, so a native smooth scroll would jump. Offset clears
    // the 64px sticky top nav. Under reduced motion Lenis is null → native jump.
    if (lenis) {
      lenis.scrollTo(el, { offset: -64 });
    } else {
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
  };

  if (!enabled) return null;

  return (
    <nav
      aria-label="Sections"
      // w-12 keeps the fixed translucent rail inside the page's left gutter at
      // lg+ (gutter ≥ ~51px there) so it never paints over the content's left edge.
      // No full-height fill/border: a painted rail read as a hard seam over the
      // hero aurora (review: "hairline at x≈48"). The dots float; each carries its
      // own halo for contrast against bright backdrops.
      className="fixed left-0 top-0 z-40 flex h-screen w-12 flex-col justify-center"
    >
      <ul className="flex flex-col gap-space-5 px-space-4">
        {navItems.map(({ id, label }, i) => {
          const active = activeSection === id;
          // Each section owns one spectrum hue, so the rail reads as a legend:
          // position in the page = position in the spectrum. The hue rides on a
          // per-item `--dot` var so the dot + label can pick it up at rest/hover
          // while the base list stays monochrome.
          return (
            <li key={id} style={{ "--dot": spectrumAt(i) } as React.CSSProperties}>
              <a
                href={`#${id}`}
                onClick={(e) => scrollToSection(e, id)}
                aria-label={label}
                aria-current={active ? "true" : undefined}
                // The 6px dot is the only visible mark, so a ::before extends the
                // pointer hit area to a comfortable box without moving the dot.
                className="group relative flex items-center gap-space-3 before:absolute before:-inset-x-2 before:-inset-y-[9px] before:content-['']"
              >
                <span
                  aria-hidden="true"
                  // The dark halo replaces the removed rail fill: keeps each dot
                  // legible when it floats directly over the bright aurora.
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shadow-[0_0_0_3px_rgba(0,0,0,0.35)] transition-all duration-base ease-out-quad",
                    active
                      ? "scale-125 bg-[var(--dot)]"
                      : "bg-muted opacity-40 group-hover:bg-[var(--dot)] group-hover:opacity-90",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-space-5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] opacity-0 transition-all duration-fast ease-out-quad group-hover:left-space-6 group-hover:opacity-100",
                    active ? "text-[var(--dot)]" : "text-muted",
                  )}
                >
                  {label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
