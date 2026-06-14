import type Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

/*
 * The critical Lenis ⇄ GSAP integration (ARCHITECTURE.md §7.3): exactly ONE RAF
 * loop. GSAP's ticker drives Lenis (lenis.raf), and Lenis drives ScrollTrigger
 * (ScrollTrigger.update on every scroll). lagSmoothing(0) keeps scrub in lockstep
 * with the scroll position. Returns a cleanup that detaches everything.
 *
 * Golden rule: never run a second smooth-scroll engine — Lenis owns scrolling,
 * ScrollTrigger only reads from it.
 */
export function syncLenisWithGsap(lenis: Lenis): () => void {
  lenis.on("scroll", ScrollTrigger.update);

  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return () => {
    lenis.off("scroll", ScrollTrigger.update);
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33); // restore GSAP's default
  };
}
