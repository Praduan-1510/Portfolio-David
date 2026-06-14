"use client";

import { useEffect, useRef } from "react";
import NextLink from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { stagger as staggerTokens, distance } from "@/lib/motion/tokens";
import { useLenis } from "@/lib/lenis/useLenis";
import { Text, PhoneFrame } from "@/components/primitives";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import type { ProjectMeta } from "@/types/project";

/*
 * Desktop work index — a pinned horizontal scroll set-piece (DESIGN_GUIDELINES.md
 * §7.5, ARCHITECTURE.md §3). The section pins and a track of project panels
 * translates LINEARLY with scroll (ease:"none" + scrub) so it tracks scroll
 * exactly (§7.1). Each panel reveals + scales as it crosses the viewport, tied to
 * the horizontal scroll via containerAnimation.
 *
 * Rides the existing Lenis ⇄ ScrollTrigger single RAF loop — no second engine.
 * Only mounted on desktop with motion enabled; mobile / reduced-motion render the
 * static stack (see WorkIndex).
 */
export function WorkScrollTrack({ projects }: { projects: ProjectMeta[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      registerGsap();
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const getDistance = () =>
        Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none", // linear — scrubbed motion must track scroll exactly
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + getDistance(),
          pin: true,
          scrub: true,
          invalidateOnRefresh: true, // recompute distance on resize/refresh
          anticipatePin: 1,
        },
      });
      stRef.current = tween.scrollTrigger ?? null;

      // Reveal + scale each panel as it crosses the viewport, driven by the
      // horizontal tween (containerAnimation). Skipped under reduced motion.
      if (!prefersReducedMotion()) {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", section);
        panels.forEach((panel) => {
          gsap.from(panel, {
            autoAlpha: 0.35,
            scale: 0.92,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              start: "left 88%",
              end: "left 48%",
              scrub: true,
            },
          });
        });

        // Entrance choreography that SUPPORTS the set-piece: as the section pins,
        // the panels rise + fade in in concert (directional stagger), so the
        // track arrives composed rather than already-there. Transform/opacity
        // only; on-token (outExpo, base stagger, distance.md). Plays once.
        gsap.from(panels, {
          autoAlpha: 0,
          y: distance.md,
          duration: durations.slow,
          ease: gsapEase.outExpo,
          stagger: staggerTokens.base,
          scrollTrigger: { trigger: section, start: "top 80%", once: true },
        });

        // Subtle depth: each panel's media drifts horizontally relative to its
        // text as the panel crosses the pinned viewport, scrubbed to the
        // horizontal tween. Small differential (speed ≤ 0.1), transform-only.
        const media = gsap.utils.toArray<HTMLElement>("[data-media]", section);
        media.forEach((el) => {
          gsap.fromTo(
            el,
            { xPercent: -8 },
            {
              xPercent: 8,
              ease: "none", // linear — tracks scroll exactly (§7.1)
              scrollTrigger: {
                trigger: el,
                containerAnimation: tween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
        });
      }

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        stRef.current = null;
      };
    },
    { scope: sectionRef, dependencies: [projects.length] },
  );

  // Keyboard access: tabbing to an off-screen panel can't scroll it into view
  // (it's transform-translated, not scrolled). On focus, drive the page scroll
  // so the panel comes into the pinned viewport (§10 keyboard operability).
  const handlePanelFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    const st = stRef.current;
    if (!st) return;
    const target = st.start + e.currentTarget.offsetLeft - 96;
    if (lenis) lenis.scrollTo(target, { duration: 0.6 });
    else window.scrollTo({ top: target });
  };

  // Recompute pin geometry after fonts AND images load — both change layout and
  // would otherwise leave the pin distance miscomputed (ARCHITECTURE.md §7.3).
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh();
    };
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(refresh);
    }
    window.addEventListener("load", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("load", refresh);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-work-section
      aria-label="Selected projects"
      className="relative h-screen overflow-hidden"
    >
      <span className="pointer-events-none absolute right-[clamp(1.25rem,5vw,6rem)] top-space-8 z-10 font-mono text-caption uppercase tracking-[0.18em] text-muted">
        Scroll →
      </span>

      <div
        ref={trackRef}
        data-work-track
        className="flex h-full items-center gap-[6vw] pl-[clamp(1.25rem,5vw,6rem)] will-change-transform"
      >
        {projects.map((project, i) => {
          // Per-project accent (lime / orange / blue), scoped to the panel via an
          // inline --accent remap on a dark surface — text-accent / bg-accent and
          // the color-mix washes resolve to the project's colour while the rest of
          // the page stays monochrome (§4/§8, same remap as the case-study route).
          const accentStyle = project.accent
            ? ({ "--accent": project.accent } as React.CSSProperties)
            : undefined;
          const ordinal = String(i + 1).padStart(2, "0");
          return (
            <NextLink
              key={project.slug}
              href={`/work/${project.slug}`}
              data-panel
              data-theme="dark"
              style={accentStyle}
              aria-label={`View case study: ${project.title}`}
              onFocus={handlePanelFocus}
              className="group grid h-[68vh] max-h-[42rem] w-[clamp(30rem,72vw,56rem)] shrink-0 grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-center gap-space-9 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
            >
              {/* Media stage — a tall accent-washed panel with the cover screen
                  rising from its base and the oversized index numeral set behind
                  it. Fills the panel height so the composition reads as a poster
                  rather than a small phone floating in space. */}
              <div className="relative isolate flex h-full items-end justify-center overflow-hidden rounded-[4px] border border-line bg-bg transition-[border-color,box-shadow] duration-base ease-out-quad group-hover:border-neon group-hover:shadow-neon">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 transition-opacity duration-slow ease-out-quad group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(72% 64% at 50% 100%, color-mix(in srgb, var(--accent) 28%, transparent), transparent 72%)",
                    opacity: 0.85,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[6%] top-[4%] font-display text-[clamp(5rem,12vw,11rem)] leading-none tracking-[-0.04em] text-fg opacity-[0.06] transition-opacity duration-slow ease-out-quad group-hover:opacity-[0.12]"
                >
                  {ordinal}
                </span>
                {/* The media parallaxes horizontally (data-media, scrubbed in the
                    GSAP effect) and lifts on hover. */}
                <div
                  data-media
                  className="w-[clamp(9rem,15vw,15rem)] translate-y-[6%] will-change-transform"
                >
                  <PhoneFrame
                    src={project.cover}
                    alt={`${project.title} — cover screen`}
                    sizes="15rem"
                    imgClassName="object-top transition-transform duration-slow ease-out-quad will-change-transform group-hover:scale-[1.04]"
                    className="transition-transform duration-base ease-out-quad group-hover:-translate-y-1"
                  />
                </div>
              </div>

              {/* Meta column — fills the panel's other half: ordinal, title,
                  client/year/role, summary, services, and the view affordance. */}
              <div className="min-w-0">
                <div className="flex items-baseline gap-space-3 font-mono text-caption uppercase tracking-[0.16em] text-muted">
                  <span
                    aria-hidden="true"
                    className="h-[7px] w-[7px] rounded-full bg-accent"
                  />
                  <span>
                    <span className="text-accent">{ordinal}</span> /{" "}
                    {String(projects.length).padStart(2, "0")}
                  </span>
                </div>

                <Text
                  as="h2"
                  variant="display-l"
                  className="relative mt-space-4 inline-block group-hover:text-neon"
                >
                  {project.title}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-neon transition-transform duration-base ease-out-quad group-hover:scale-x-100"
                  />
                </Text>

                <div className="mt-space-4 flex flex-wrap gap-x-space-5 gap-y-space-1 font-mono text-caption uppercase tracking-[0.14em] text-muted">
                  <span>{project.client}</span>
                  <span>{project.year}</span>
                  <span>{project.role}</span>
                </div>

                <Text variant="body-l" className="mt-space-4 max-w-[44ch] text-muted">
                  {project.summary}
                </Text>

                <ul className="mt-space-5 flex flex-wrap gap-x-space-3 gap-y-space-2">
                  {project.services.map((service) => (
                    <li
                      key={service}
                      className="rounded-full border border-line px-space-4 py-space-1 font-mono text-caption uppercase tracking-[0.12em] text-muted transition-colors duration-fast ease-out-quad group-hover:border-neon group-hover:text-neon"
                    >
                      {service}
                    </li>
                  ))}
                </ul>

                <span className="mt-space-6 inline-flex items-center gap-space-2 font-mono text-caption uppercase tracking-[0.16em] text-muted transition-colors duration-fast ease-out-quad group-hover:text-neon">
                  View case study
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-base ease-out-quad group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </div>
            </NextLink>
          );
        })}
        {/* Trailing spacer (a flex child counts toward scroll distance, unlike
            trailing padding) — lets the last panel rest off the edge. */}
        <div aria-hidden="true" className="w-[clamp(1.25rem,16vw,10rem)] shrink-0" />
      </div>
    </section>
  );
}
