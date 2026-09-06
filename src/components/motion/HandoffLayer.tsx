"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { handoff, type HandoffSource } from "@/lib/motion/handoff";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import "./handoff.css";

/*
 * Docking: the cover frame flies to the gate (the site's primary signature).
 *
 * On a desktop, fine-pointer, motion-allowed click on a case-study link, the
 * screen well the visitor clicked is the ONE thing that does not change: a
 * fixed clone of it appears at its exact rect above the route wipe, the rest of
 * the page departs underneath, and once the new route has mounted its hero and
 * sits at scroll 0 the clone glides and scales to the hero's screen well (one
 * transform tween, `slow` on the cinematic curve). At 85% of the flight a `fast`
 * crossfade docks it into the real hero, which HandoffTarget had hidden for the
 * flight, and `html[data-handoff]` comes off so the slab tilts into its rest.
 *
 * Everything degrades to today's transition whenever anything is missing:
 * below lg, on touch, under reduced motion, with no source or target, on a
 * registration timeout, a resize or a second click. HandoffTarget only hides
 * itself when a flight is pending for its slug, so hard loads (the LCP case)
 * are never opacity-gated.
 *
 * Mounted once in app/layout.tsx so it outlives the route change.
 */

const GATE = "(min-width: 1024px) and (pointer: fine)";
/** Give the new route this long to mount its hero before giving up. */
const REGISTER_TIMEOUT = 1.2;
/** Where in the flight the crossfade into the real hero begins. */
const DOCK_AT = 0.85;

type Screen = HTMLImageElement | HTMLVideoElement;

/** The screen element (poster) inside a frame, and the well that clips it. */
function findScreen(root: Element): { screen: Screen; well: HTMLElement } | null {
  const screen = root.querySelector<Screen>("img, video");
  const well = screen?.parentElement;
  if (!screen || !well) return null;
  return { screen, well };
}

function screenSrc(screen: Screen): string {
  if (screen instanceof HTMLVideoElement) return screen.poster;
  return screen.currentSrc || screen.src;
}

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  if (r.bottom < 0 || r.top > window.innerHeight) return false;
  // Stacked previews (the flight board) keep inactive covers at opacity 0.
  if (typeof el.checkVisibility === "function") {
    return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  }
  return true;
}

/** Slug from a same-origin /work/<slug> link; null for anything else. */
function workSlug(a: HTMLAnchorElement): string | null {
  if (a.origin !== window.location.origin) return null;
  if (a.target && a.target !== "_self") return null;
  const m = a.pathname.match(/^\/work\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

export function HandoffLayer() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const snap = useSyncExternalStore(
    handoff.subscribe,
    handoff.getSnapshot,
    handoff.getServerSnapshot,
  );
  const cloneRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<gsap.core.Timeline | null>(null);
  const timeoutRef = useRef<gsap.core.Tween | null>(null);
  const abortingRef = useRef(false);

  // Arm: measure the clicked frame's screen well and start a flight. Capture
  // phase, no preventDefault: Next's <Link> navigates exactly as it does today.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const slug = workSlug(a);
      if (!slug) return;
      // A second click while a flight is pending abandons it; that navigation
      // gets the ordinary transition.
      if (handoff.getSnapshot()) {
        handoff.abort();
        return;
      }
      if (a.pathname === window.location.pathname) return;
      if (!window.matchMedia(GATE).matches || prefersReducedMotion()) return;

      const selector = `[data-handoff-source="${CSS.escape(slug)}"]`;
      // Prefer the frame inside the link (card, teaser); fall back to the first
      // visible one on the page (the flight board's preview sits beside its rows).
      let source: Element | null = a.querySelector(selector);
      if (!source || !isVisible(source)) {
        source =
          Array.from(document.querySelectorAll(selector)).find(isVisible) ?? null;
      }
      if (!source) return;
      const found = findScreen(source);
      if (!found) return;
      const { screen, well } = found;
      const src = screenSrc(screen);
      if (!src || !isVisible(well)) return;

      const r = well.getBoundingClientRect();
      const wellStyle = getComputedStyle(well);
      const screenStyle = getComputedStyle(screen);
      const payload: HandoffSource = {
        slug,
        src,
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        radius: wellStyle.borderRadius,
        bezel: wellStyle.backgroundColor,
        fit: screenStyle.objectFit,
        position: screenStyle.objectPosition,
        transform: screenStyle.transform,
        transformOrigin: screenStyle.transformOrigin,
      };
      document.documentElement.dataset.handoff = slug;
      handoff.begin(payload);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Every route commit clears the landed flag, so the next web hero reached by
  // an ordinary transition runs its own landing again.
  useEffect(() => {
    delete document.documentElement.dataset.handoffLanded;
  }, [pathname]);

  // Abandon: kill the flight, fade the clone `fast`, hand the hero back.
  const runAbort = useCallback((target: HTMLElement | null) => {
    if (abortingRef.current) return;
    abortingRef.current = true;
    registerGsap();
    flightRef.current?.kill();
    flightRef.current = null;
    timeoutRef.current?.kill();
    timeoutRef.current = null;
    delete document.documentElement.dataset.handoff;
    if (target) {
      gsap.killTweensOf(target);
      gsap.to(target, {
        opacity: 1,
        duration: durations.fast,
        ease: gsapEase.outQuad,
        clearProps: "opacity",
      });
    }
    const clone = cloneRef.current;
    if (clone) {
      gsap.killTweensOf(clone);
      gsap.to(clone, {
        opacity: 0,
        duration: durations.fast,
        ease: gsapEase.outQuad,
        onComplete: () => handoff.clear(),
      });
    } else {
      handoff.clear();
    }
  }, []);

  // Drive the flight from the store. A layout effect so the target is measured
  // before the frame paints in which it became measurable.
  useLayoutEffect(() => {
    if (!snap) {
      abortingRef.current = false;
      flightRef.current = null;
      timeoutRef.current?.kill();
      timeoutRef.current = null;
      return;
    }
    if (snap.aborted || reduced) {
      runAbort(snap.target);
      return;
    }
    registerGsap();
    if (!timeoutRef.current && !flightRef.current) {
      timeoutRef.current = gsap.delayedCall(REGISTER_TIMEOUT, () => handoff.abort());
    }
    const clone = cloneRef.current;
    const target = snap.target;
    if (flightRef.current || !clone || !target || !snap.resetDone) return;

    const found = findScreen(target);
    const tWell = found?.well ?? target;
    const t = tWell.getBoundingClientRect();
    const s = snap.source.rect;
    if (t.width < 1 || t.height < 1 || s.width < 1) {
      handoff.abort();
      return;
    }
    timeoutRef.current?.kill();
    timeoutRef.current = null;

    // Top-centre to top-centre: both wells are centred in their columns, and
    // the width ratio is the scale; any aspect difference (card browser well vs
    // prototype well) is absorbed by the crossfade.
    const scale = t.width / s.width;
    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top - s.top;
    const dockAt = durations.slow * DOCK_AT;

    const tl = gsap.timeline({
      onComplete: () => {
        flightRef.current = null;
        handoff.clear();
      },
    });
    tl.to(
      clone,
      { x: dx, y: dy, scale, duration: durations.slow, ease: gsapEase.inOutQuart },
      0,
    );
    // The dock: the attribute comes off, so the slab's own transform transition
    // tilts it from flat into its rest while the clone crossfades into it.
    tl.add(() => {
      delete document.documentElement.dataset.handoff;
      document.documentElement.dataset.handoffLanded = "";
    }, dockAt);
    tl.to(
      target,
      { opacity: 1, duration: durations.fast, ease: gsapEase.outQuad, clearProps: "opacity" },
      dockAt,
    );
    tl.to(
      clone,
      { opacity: 0, duration: durations.fast, ease: gsapEase.outQuad },
      dockAt,
    );
    flightRef.current = tl;
  }, [snap, reduced, runAbort]);

  // A resize mid-flight invalidates both rects: abandon rather than mis-dock.
  useEffect(() => {
    if (!snap || snap.aborted) return;
    const onResize = () => handoff.abort();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [snap]);

  if (!snap) return null;
  const { source } = snap;
  return (
    <div
      ref={cloneRef}
      aria-hidden="true"
      className="handoff-clone"
      style={{
        // Initial placement only (never animated): the clone is born at the
        // source well's rect and moves by transform from there.
        top: source.rect.top,
        left: source.rect.left,
        width: source.rect.width,
        height: source.rect.height,
        borderRadius: source.radius,
        backgroundColor: source.bezel,
      }}
    >
      <img
        src={source.src}
        alt=""
        draggable={false}
        style={{
          objectFit: source.fit as React.CSSProperties["objectFit"],
          objectPosition: source.position,
          transform: source.transform === "none" ? undefined : source.transform,
          transformOrigin: source.transformOrigin,
        }}
      />
    </div>
  );
}

/*
 * HandoffTarget: wraps a case-study hero frame. Only when a flight is pending
 * for its slug does it hide itself (inline opacity 0) and register as the
 * gate; otherwise it is a plain block and the cover paints immediately, which
 * keeps every hard load's LCP untouched.
 */
export function HandoffTarget({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || handoff.pending?.slug !== slug) return;
    el.style.opacity = "0";
    const unregister = handoff.registerTarget(slug, el);
    return () => {
      unregister();
      el.style.opacity = "";
    };
  }, [slug, reduced]);

  return (
    <div ref={ref} data-handoff-target={slug} className={className}>
      {children}
    </div>
  );
}
