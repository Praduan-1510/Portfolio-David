"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { easings } from "@/lib/motion/easings";
import { durations } from "@/lib/motion/durations";
import { transitions } from "@/lib/motion/tokens";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { useLenis } from "@/lib/lenis/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Route-transition choreography (DESIGN_GUIDELINES.md §7.6, ARCHITECTURE.md §7.4).
 * Rendered from app/template.tsx, which re-mounts on every navigation.
 *
 * On a client navigation: a near-black panel wipes UP off the new page (pure
 * transform: scaleY, origin top) while the content cross-fades in just behind it
 * — a brief, cinematic hand-off (~0.6s, under the §7.6 1s ceiling).
 *
 * On the very FIRST load of the session the wipe is skipped and the content isn't
 * re-animated, so the hero owns the first-load moment (no double intro). Under
 * prefers-reduced-motion the children render instantly with no overlay (§10).
 *
 * The persistent content wrapper animates OPACITY ONLY — a lingering transform
 * there would create a containing block and break position:fixed / GSAP pinning
 * inside pages. The wipe panel is a separate fixed leaf (no descendants), so its
 * transform is safe. Scroll resets to top and ScrollTrigger refreshes per route.
 */

// Module-level: true only for the first client render after a full page load.
// Re-evaluated on every hard reload, so the hero intro still plays on refresh.
let hasMounted = false;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const [firstLoad] = useState(() => !hasMounted);

  useEffect(() => {
    hasMounted = true;
  }, []);

  // Reset scroll to the top + refresh ScrollTrigger when the route changes.
  // Lenis owns the scroll position and PERSISTS across routes (it's mounted once
  // in the root layout), so a bare window.scrollTo is overridden on Lenis's next
  // RAF tick — the new page would open at the previous route's offset (e.g. deep
  // inside the pinned work track). Reset the Lenis instance itself (immediate, no
  // smooth, force past any lenis-stop), and fall back to native scroll when smooth
  // scroll is off (reduced motion → lenis is null).
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 80);
    return () => window.clearTimeout(id);
  }, [pathname, lenis]);

  if (reduced) return <>{children}</>;

  return (
    <>
      {!firstLoad && (
        <motion.div
          key={`wipe-${pathname}`}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[90] origin-top bg-bg"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: durations.slow, ease: easings.inOutQuart }}
        />
      )}
      <motion.div
        key={`content-${pathname}`}
        initial={firstLoad ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...transitions.entrance, delay: firstLoad ? 0 : 0.18 }}
      >
        {children}
      </motion.div>
    </>
  );
}
