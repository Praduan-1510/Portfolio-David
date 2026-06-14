import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { easings } from "./easings";

/*
 * Central GSAP setup. Registers the (now free) plugins once and builds a
 * CustomEase for each named curve from lib/motion/easings, so GSAP animations
 * use the EXACT same cubic-beziers as the CSS variables. Idempotent and a
 * no-op on the server — call registerGsap() at the top of any client effect
 * before creating tweens.
 *
 * cubic-bezier(x1,y1,x2,y2)  ->  CustomEase path "M0,0 C x1,y1 x2,y2 1,1".
 */
let registered = false;

export function registerGsap(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  for (const [name, [x1, y1, x2, y2]] of Object.entries(easings)) {
    CustomEase.create(name, `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);
  }
  registered = true;
}

/** GSAP ease names matching lib/motion/easings (created by registerGsap). */
export const gsapEase = {
  outExpo: "outExpo",
  inOutQuart: "inOutQuart",
  outQuad: "outQuad",
  outBack: "outBack",
} as const;

export { gsap, ScrollTrigger, SplitText, CustomEase };
