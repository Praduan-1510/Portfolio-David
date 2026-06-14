"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLenis } from "@/lib/lenis/useLenis";

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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Scroll through the single engine (Lenis) when it's active — Lenis forces
    // scroll-behavior:auto, so a native smooth scroll would jump. Offset clears
    // the 64px sticky top nav. Under reduced motion Lenis is null → native jump.
    if (lenis) {
      lenis.scrollTo(el, { offset: -64 });
    } else {
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
  };

  return (
    <nav
      aria-label="Sections"
      className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col justify-center border-r border-line backdrop-blur-sm md:flex md:w-20"
      // /opacity no-ops on our var() tokens, so the translucency is set explicitly.
      style={{ backgroundColor: "color-mix(in srgb, var(--bg) 75%, transparent)" }}
    >
      <ul className="flex flex-col gap-space-5 px-space-4">
        {navItems.map(({ id, label }) => {
          const active = activeSection === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => scrollToSection(id)}
                aria-label={label}
                aria-current={active ? "true" : undefined}
                className="group relative flex items-center gap-space-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all duration-base ease-out-quad",
                    active
                      ? "scale-125 bg-accent"
                      : "bg-muted opacity-40 group-hover:bg-fg group-hover:opacity-70",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-space-5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] opacity-0 transition-all duration-fast ease-out-quad group-hover:left-space-6 group-hover:opacity-100",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
