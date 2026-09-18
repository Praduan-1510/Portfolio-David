"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { gsap, gsapEase, registerGsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * useDropletLens: the liquid-glass droplet that rests under the current item
 * and glides to whichever item is hovered or focused. Shared by the top nav
 * and the bottom dock, so both instruments move the same way.
 *
 * USAGE
 *   const rowRef = useRef<HTMLDivElement>(null);
 *   const lensRef = useRef<HTMLSpanElement>(null);
 *   useDropletLens({ containerRef: rowRef, lensRef, activeKey: "/work" });
 *
 *   <div ref={rowRef} className="relative flex">        // positioned container
 *     <LiquidLens ref={lensRef} />                      // first child
 *     <a data-lens-key="/work" className="lg-lens-item …">
 *       <span data-lens-label>Work</span>              // optional: magnifies 4%
 *     </a>
 *     …
 *   </div>
 *
 * CONTRACT
 *   - Items are any descendants carrying data-lens-key (string). Give them the
 *     .lg-lens-item class for the ink + magnify styling.
 *   - activeKey is the item the lens RESTS on (the current route). null = no
 *     home: the lens evaporates at rest and condenses out of a bead on the
 *     first item you point at.
 *   - The item under the lens gets data-lensed (the hook writes it; React
 *     never sees it), which is what swells its [data-lens-label].
 *   - Keyboard focus always moves it; hover only for a real pointer (touch
 *     taps navigate, they never "hover" first).
 *   - Returns { moveTo(key | null), rest() } for imperative control (a dock
 *     that wants the lens on an item after an action, say).
 *
 * MOTION
 *   The two edges travel separately: the LEADING edge sets off first on the
 *   ui curve (out-quad, 70% of `base`), the TRAILING edge follows a beat later
 *   on out-back over the full `base`. Mid-flight the lens is therefore longer
 *   than both its start and end (the stretch), and thins a little as it
 *   stretches (scaleY, volume kept), then the tail overshoots and settles.
 *   Width is written directly rather than faked with scaleX, so the round
 *   ends stay round at every frame. Tweens run on gsap.ticker (the site's
 *   single RAF source) and only while moving; nothing runs at rest.
 *   Reduced motion: it jumps, no stretch, no settle.
 */

export interface DropletLensOptions {
  /** A position:relative element containing the lens and the items. */
  containerRef: RefObject<HTMLElement | null>;
  /** The <LiquidLens/> element. */
  lensRef: RefObject<HTMLElement | null>;
  /** data-lens-key of the item the lens rests on, or null for none. */
  activeKey: string | null;
  /** Follow a fine pointer's hover (default true). Focus always moves it. */
  hover?: boolean;
  /** ms to wait after the pointer leaves before gliding home (default 110). */
  returnDelay?: number;
}

export interface DropletLens {
  /** Glide to the item with this key (null evaporates the lens). */
  moveTo: (key: string | null) => void;
  /** Glide back to the focused item, else the active one. */
  rest: () => void;
}

interface Engine {
  go: (key: string | null, instant?: boolean) => void;
  rest: () => void;
  /** activeKey changed: glide home unless someone is pointing at an item. */
  sync: () => void;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useDropletLens({
  containerRef,
  lensRef,
  activeKey,
  hover = true,
  returnDelay = 110,
}: DropletLensOptions): DropletLens {
  const activeRef = useRef(activeKey);
  const engineRef = useRef<Engine | null>(null);

  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    const lens = lensRef.current;
    if (!container || !lens) return;
    registerGsap();

    // Edge positions (px, in the container's own unscaled space), the width of
    // the item being travelled to, and what is currently lensed.
    const s = { l: 0, r: 0 };
    let targetW = 0;
    let shown = false;
    let currentKey: string | null = null;
    let lensed: HTMLElement | null = null;
    let hovering = false;
    let focusKey: string | null = null;
    let returnTimer = 0;
    let alive = true;

    const items = () =>
      Array.from(container.querySelectorAll<HTMLElement>("[data-lens-key]"));
    const itemFor = (key: string | null) =>
      key == null ? null : (items().find((el) => el.dataset.lensKey === key) ?? null);

    // Layout box of an item relative to the container, corrected for any
    // transform on an ancestor (a condensed nav may be scaled or moved).
    const measure = (item: HTMLElement) => {
      if (!container.offsetWidth) return null;
      const c = container.getBoundingClientRect();
      const b = item.getBoundingClientRect();
      if (!b.width) return null;
      const k = c.width / container.offsetWidth || 1;
      const l = (b.left - c.left) / k - container.clientLeft;
      return { l, r: l + b.width / k };
    };

    const paint = () => {
      const w = Math.max(0, s.r - s.l);
      const stretch = targetW > 0 ? w / targetW : 1;
      const squash = stretch > 1 ? Math.max(0.84, 1 - (stretch - 1) * 0.22) : 1;
      lens.style.width = `${w.toFixed(2)}px`;
      lens.style.transform = `translate3d(${s.l.toFixed(2)}px,0,0) scaleY(${squash.toFixed(3)})`;
    };

    const mark = (item: HTMLElement | null) => {
      if (lensed === item) return;
      lensed?.removeAttribute("data-lensed");
      item?.setAttribute("data-lensed", "");
      lensed = item;
    };

    const fade = (on: boolean, instant: boolean) => {
      if (shown === on) return;
      shown = on;
      gsap.to(lens, {
        opacity: on ? 1 : 0,
        duration: instant ? 0 : durations.fast,
        ease: gsapEase.outQuad,
        overwrite: "auto",
      });
    };

    const go = (key: string | null, instant = false) => {
      const item = itemFor(key);
      const box = item ? measure(item) : null;
      const still = instant || prefersReducedMotion();

      if (!item || !box) {
        // Nowhere to rest: the droplet draws in on its centre and evaporates.
        currentKey = null;
        mark(null);
        if (shown && !still) {
          const mid = (s.l + s.r) / 2;
          gsap.killTweensOf(s);
          gsap.to(s, { l: mid, r: mid, duration: durations.fast, ease: gsapEase.outQuad, onUpdate: paint });
        }
        fade(false, still);
        return;
      }

      currentKey = key;
      targetW = box.r - box.l;
      mark(item);
      gsap.killTweensOf(s);

      if (still) {
        s.l = box.l;
        s.r = box.r;
        paint();
        fade(true, true);
        return;
      }

      if (!shown) {
        // Condense out of a bead at the item's centre, then swell to fit.
        const mid = (box.l + box.r) / 2;
        s.l = mid;
        s.r = mid;
        paint();
        fade(true, false);
        gsap.to(s, { l: box.l, r: box.r, duration: durations.base, ease: gsapEase.outBack, onUpdate: paint });
        return;
      }

      const rightward = box.l > s.l;
      const lead = rightward ? "r" : "l";
      const trail = rightward ? "l" : "r";
      gsap.to(s, {
        [lead]: box[lead],
        duration: durations.base * 0.7,
        ease: gsapEase.outQuad,
        onUpdate: paint,
      });
      gsap.to(s, {
        [trail]: box[trail],
        duration: durations.base,
        delay: durations.base * 0.12,
        ease: gsapEase.outBack,
        onUpdate: paint,
      });
    };

    const rest = () => go(focusKey ?? activeRef.current);
    const sync = () => {
      if (hovering) return;
      const key = focusKey ?? activeRef.current;
      if (key !== currentKey || !shown) go(key);
    };

    const keyOf = (target: EventTarget | null) => {
      const item =
        target instanceof Element ? target.closest<HTMLElement>("[data-lens-key]") : null;
      return item && container.contains(item) ? (item.dataset.lensKey ?? null) : null;
    };

    const onOver = (e: globalThis.PointerEvent) => {
      if (!hover || e.pointerType === "touch") return;
      hovering = true;
      window.clearTimeout(returnTimer);
      const key = keyOf(e.target);
      if (key != null && key !== currentKey) go(key);
    };
    const onLeave = (e: globalThis.PointerEvent) => {
      if (e.pointerType === "touch") return;
      hovering = false;
      window.clearTimeout(returnTimer);
      returnTimer = window.setTimeout(() => {
        if (!hovering) rest();
      }, returnDelay);
    };
    const onFocusIn = (e: FocusEvent) => {
      const key = keyOf(e.target);
      focusKey = key;
      window.clearTimeout(returnTimer);
      if (key != null && key !== currentKey) go(key);
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget;
      if (next instanceof Node && container.contains(next)) return;
      focusKey = null;
      if (!hovering) rest();
    };

    container.addEventListener("pointerover", onOver);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);

    // Re-seat (no animation) whenever the row's box changes: a font swap, a
    // viewport crossing md, a condensing surface.
    const ro = new ResizeObserver(() => go(currentKey ?? focusKey ?? activeRef.current, true));
    ro.observe(container);
    document.fonts?.ready.then(() => {
      if (alive) go(currentKey ?? activeRef.current, true);
    });

    go(activeRef.current, true);
    engineRef.current = { go, rest, sync };

    return () => {
      alive = false;
      engineRef.current = null;
      container.removeEventListener("pointerover", onOver);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      ro.disconnect();
      window.clearTimeout(returnTimer);
      gsap.killTweensOf(s);
      gsap.killTweensOf(lens);
      mark(null);
    };
  }, [containerRef, lensRef, hover, returnDelay]);

  // A new route: glide home, unless someone is pointing at or focused on an
  // item (then the lens stays with them and returns when they leave).
  useEffect(() => {
    activeRef.current = activeKey;
    engineRef.current?.sync();
  }, [activeKey]);

  return useMemo<DropletLens>(
    () => ({
      moveTo: (key) => engineRef.current?.go(key),
      rest: () => engineRef.current?.rest(),
    }),
    [],
  );
}
