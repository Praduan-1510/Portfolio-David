"use client";

import { createElement, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { stagger as staggerTokens, distance } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Staggered group reveal (DESIGN_GUIDELINES.md §7.4 choreography). The group's
 * DIRECT children enter in concert, fading and rising in sequence, when the
 * group scrolls into view (or on load, for above-the-fold beats). One ScrollTrigger
 * per group, transform/opacity only.
 *
 * Ruled entry: a child (or the group itself) may carry a full-width hairline as
 * `<span aria-hidden data-rule className="absolute inset-x-0 top-0 h-px bg-line" />`
 * in place of its border-top. When any rule is present the group plays a
 * timeline instead of the single tween: each rule draws left to right on the
 * entrance curve, and its row's CONTENT (not the row, so the rule stays visible
 * while the type is still transparent) rises in one stagger step later, like a
 * ruling pen ahead of the type. Groups with no rule anywhere keep the original
 * single tween untouched.
 *
 * Children are visible by default and only hidden inside the layout effect, so
 * reduced-motion / no-JS never traps content behind the animation (§10). Pairs
 * with the shared motion tokens so its rhythm matches <Reveal> everywhere.
 */
interface StaggerGroupProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** Seconds between siblings (default = tokens.stagger.base). */
  stagger?: number;
  /** Translate distance in px. */
  y?: number;
  /** Delay before the sequence starts (seconds). */
  delay?: number;
  /** Per-child duration (seconds). */
  duration?: number;
  /** "inView" (default) plays on scroll-in; "load" plays on mount. */
  trigger?: "inView" | "load";
  /** Direction of the rise: children below (default) or above their resting spot. */
  from?: "below" | "above";
}

const isRule = (node: Element) => node.hasAttribute("data-rule");
const ownRule = (item: Element) => item.querySelector<HTMLElement>(":scope > [data-rule]");

export function StaggerGroup({
  as: Tag = "div",
  className,
  stagger = staggerTokens.base,
  y = distance.md,
  delay = 0,
  duration = durations.slow,
  trigger = "inView",
  from = "below",
  children,
  ...rest
}: StaggerGroupProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (prefersReducedMotion() || !el) return; // visible, no animation
      const children = Array.from(el.children) as HTMLElement[];
      // A rule that belongs to the group itself (the spec strip's dl) rather
      // than to one of its rows.
      const groupRules = children.filter(isRule);
      const items = children.filter((child) => !isRule(child));
      if (items.length === 0) return;

      if (groupRules.length === 0 && !items.some(ownRule)) {
        const vars: gsap.TweenVars = {
          opacity: 0,
          y: from === "below" ? y : -y,
          duration,
          ease: gsapEase.outExpo,
          stagger,
          delay,
        };
        if (trigger === "inView") {
          vars.scrollTrigger = { trigger: el, start: "top 82%", once: true };
        }
        gsap.from(items, vars);
        return;
      }

      // Ruled branch: one tween per rule and per row's content, each carrying
      // the same trigger and a position folded into `delay`. Deliberately NOT a
      // gsap.timeline({ scrollTrigger }): a tween initialises its trigger lazily
      // on the next tick, after PageTransition has reset the new route's scroll
      // position, whereas a timeline creates it synchronously here while the
      // page may still sit deep in the previous route. A once:true trigger
      // created past its own end kills itself inside another trigger's init
      // loop, and that shrinking array is a route-level error.
      const triggerVars =
        trigger === "inView"
          ? ({ trigger: el, start: "top 82%", once: true } as const)
          : undefined;
      const scrollTrigger = () => (triggerVars ? { ...triggerVars } : undefined);
      const drawRule = (rule: HTMLElement, at: number) =>
        gsap.fromTo(
          rule,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: durations.base,
            ease: gsapEase.outExpo,
            delay: at,
            scrollTrigger: scrollTrigger(),
          },
        );
      groupRules.forEach((rule) => drawRule(rule, delay));
      items.forEach((item, i) => {
        const at = delay + i * stagger;
        const rule = ownRule(item);
        const content = Array.from(item.children).filter((child) => child !== rule);
        if (rule) drawRule(rule, at);
        gsap.from(content.length ? content : item, {
          opacity: 0,
          y: from === "below" ? y : -y,
          duration,
          ease: gsapEase.outExpo,
          delay: rule ? at + staggerTokens.loose : at,
          scrollTrigger: scrollTrigger(),
        });
      });
    },
    {
      scope: ref,
      dependencies: [reduced, stagger, y, delay, duration, trigger, from],
      revertOnUpdate: true,
    },
  );

  return createElement(Tag, { ref, className, ...rest }, children);
}
