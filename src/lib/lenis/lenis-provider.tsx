"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import { LenisContext } from "./useLenis";
import { syncLenisWithGsap } from "./gsap-sync";
import { registerGsap, ScrollTrigger } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Mounts Lenis and wires it to GSAP's single RAF loop (ARCHITECTURE.md §7.3).
 * Rendered once from the root layout so smooth scroll applies app-wide.
 *
 * Reduced motion: smoothing is skipped entirely (native scroll); ScrollTrigger
 * still works off native scroll. Toggling the OS setting re-runs this effect,
 * tearing Lenis down or back up live.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    registerGsap();

    if (reduced) {
      ScrollTrigger.refresh();
      return;
    }

    const instance = new Lenis({
      autoRaf: false, // GSAP's ticker is the single RAF source
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false, // native touch scroll feels better on mobile (§7.3)
    });
    setLenis(instance);

    const stopSync = syncLenisWithGsap(instance);
    ScrollTrigger.refresh();

    return () => {
      stopSync();
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
