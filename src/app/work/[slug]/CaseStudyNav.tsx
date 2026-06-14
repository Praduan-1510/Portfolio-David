"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLenis } from "@/lib/lenis/useLenis";
import { spectrumAt } from "@/lib/spectrum";

/*
 * Case-study "Contents" rail — a sticky, scroll-spying index of the narrative
 * sections (the MDX h2s), beside the reading column. Mirrors the site's instrument
 * rails (home SideNav): each section owns one spectrum hue (position in the study =
 * position in the spectrum), carried on a per-item `--dot` var so the active tick +
 * label pick it up while the list stays monochrome at rest.
 *
 * Scroll uses the single engine (Lenis) when active — a native smooth scroll would
 * jump because Lenis forces scroll-behavior:auto; under reduced motion Lenis is
 * null and we fall back to an instant native jump (the headings carry scroll-mt).
 * The scrollspy is plain state, so it works regardless of motion preference.
 */
interface Section {
  id: string;
  label: string;
}

export function CaseStudyNav({
  sections,
  className,
}: {
  sections: Section[];
  className?: string;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const reduced = useReducedMotion();
  const lenis = useLenis();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      // Activate a heading once it reaches the upper third of the viewport.
      { rootMargin: "-28% 0px -62% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -96 }); // clear the sticky top nav
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <nav
      aria-label="On this page"
      className={cn("sticky top-space-9 self-start", className)}
    >
      <p className="mb-space-4 font-mono text-caption uppercase tracking-[0.18em] text-muted">
        Contents
      </p>
      <ul className="flex flex-col gap-space-3">
        {sections.map((s, i) => {
          const on = active === s.id;
          return (
            <li key={s.id} style={{ "--dot": spectrumAt(i) } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => go(s.id)}
                aria-current={on ? "true" : undefined}
                className="group flex w-full items-center gap-space-3 text-left"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px shrink-0 transition-all duration-base ease-out-quad",
                    on
                      ? "w-space-6 bg-[var(--dot)]"
                      : "w-space-4 bg-line group-hover:bg-[var(--dot)]",
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-caption uppercase tracking-[0.12em] transition-colors duration-base ease-out-quad",
                    on ? "text-fg" : "text-muted group-hover:text-fg",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
