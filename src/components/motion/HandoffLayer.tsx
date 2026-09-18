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
import {
  handoff,
  type HandoffRadii,
  type HandoffRect,
  type HandoffSource,
} from "@/lib/motion/handoff";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import "./handoff.css";

/*
 * Docking: the cover frame flies to the gate (the site's primary signature).
 *
 * On a desktop, fine-pointer, motion-allowed click on a case-study link, the
 * screen the visitor clicked is the ONE thing that does not change: a fixed
 * clone of it appears at its exact rect above the route wipe, the rest of the
 * page departs underneath, and once the new route has mounted its hero and sits
 * at scroll 0 the clone glides and scales to the hero's screen well (one
 * transform tween, `slow` on the cinematic curve). At 85% of the flight a `fast`
 * crossfade docks it into the real hero, which HandoffTarget had hidden for the
 * flight, and `html[data-handoff]` comes off so the slab tilts into its rest.
 *
 * THE CLONE IS TAKEN FROM WHAT WAS PAINTED, not from what the markup says. A
 * listing thumbnail is rarely at rest: a card zooms its screenshot on hover,
 * drifts it, or scrolls a tall phone screenshot inside the screen, and a phone
 * or browser window can bleed off the edge of its card. So at the click the
 * layer records three things against the frame that clips the image: the
 * image's real box after every transform (resolved through object-fit into the
 * painted content box), the part of the frame that was actually visible, and
 * that visible shape's corners. The clone is born identical to the pixels on
 * screen, then, while it flies, the clip opens out to the target frame's shape
 * and the image slides from where it was to where the hero paints its own, so
 * the crossfade at the end lands on matching geometry instead of a jump.
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

/**
 * The screen element (image or poster video) inside a root, and the FRAME that
 * clips it. A `[data-handoff-frame]` inside the root wins: a card's browser
 * window and PhoneFrame's scroll mode hold the image in a mover (a drifting
 * layer, a scroller taller than the screen) that is not the clipping element.
 * Otherwise the image's parent is the frame, which is the screen well in
 * PhoneFrame, BrowserMockup and LivePrototype.
 */
function findScreen(root: Element): { screen: Screen; frame: HTMLElement } | null {
  const screen = root.querySelector<Screen>("img, video");
  if (!screen) return null;
  const marked = screen.closest<HTMLElement>("[data-handoff-frame]");
  const frame = marked && root.contains(marked) ? marked : screen.parentElement;
  if (!frame) return null;
  return { screen, frame };
}

function screenSrc(screen: Screen): string {
  if (screen instanceof HTMLVideoElement) return screen.poster;
  return screen.currentSrc || screen.src;
}

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  if (r.bottom < 0 || r.top > window.innerHeight) return false;
  // Stacked previews can keep inactive covers at opacity 0.
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

/* ── Geometry: what was actually painted ──────────────────────────────────── */

/** One object-position component as a px offset: a percentage of the free
 *  space, a length, or a keyword. */
function positionOffset(token: string | undefined, free: number): number {
  if (!token) return free / 2;
  if (token.endsWith("%")) return (parseFloat(token) / 100) * free;
  if (token.endsWith("px")) return parseFloat(token) || 0;
  if (token === "left" || token === "top") return 0;
  if (token === "right" || token === "bottom") return free;
  return free / 2; // center, or a form not worth parsing here
}

/**
 * Where an image is actually painted, relative to a frame rect: the element's
 * real box after every transform (getBoundingClientRect includes `transform`
 * and the individual `translate`/`scale` properties), resolved through
 * object-fit into the painted content box when the natural size is known.
 * Transforms here are translate and scale only, so layout space maps to the
 * viewport by one factor per axis.
 */
function paintedBox(screen: Screen, frame: HandoffRect): HandoffSource["image"] {
  const box = screen.getBoundingClientRect();
  const cs = getComputedStyle(screen);
  // Layout size before transforms: object-fit works in this space.
  const w = parseFloat(cs.width) || screen.offsetWidth;
  const h = parseFloat(cs.height) || screen.offsetHeight;
  const video = screen instanceof HTMLVideoElement;
  const nw = video ? screen.videoWidth : screen.naturalWidth;
  const nh = video ? screen.videoHeight : screen.naturalHeight;
  const kx = w > 0 ? box.width / w : 1;
  const ky = h > 0 ? box.height / h : 1;

  let x = 0;
  let y = 0;
  let cw = w;
  let ch = h;
  let exact = true;
  const fit = cs.objectFit;
  if (fit !== "fill") {
    if (nw > 0 && nh > 0 && w > 0 && h > 0) {
      const s =
        fit === "cover"
          ? Math.max(w / nw, h / nh)
          : fit === "contain"
            ? Math.min(w / nw, h / nh)
            : fit === "scale-down"
              ? Math.min(1, w / nw, h / nh)
              : 1; // none
      cw = nw * s;
      ch = nh * s;
      const [px, py] = cs.objectPosition.split(/\s+/);
      x = positionOffset(px, w - cw);
      y = positionOffset(py, h - ch);
    } else {
      // No natural size yet (an undecoded image, a poster-only video): keep
      // the element box and let the clone apply the same fit and position.
      exact = false;
    }
  }

  return {
    left: box.left - frame.left + x * kx,
    top: box.top - frame.top + y * ky,
    width: cw * kx,
    height: ch * ky,
    exact,
  };
}

/** A computed corner radius ("10px", "12% 5.5%") as one px value: the mean of
 *  its two axes, which is exact for the circular corners used here. */
function radiusPx(value: string, w: number, h: number): number {
  const [a, b] = value.split(/\s+/);
  const len = (t: string | undefined, base: number) =>
    !t ? 0 : t.endsWith("%") ? (parseFloat(t) / 100) * base : parseFloat(t) || 0;
  const rx = len(a, w);
  const ry = b ? len(b, h) : a?.endsWith("%") ? len(a, h) : rx;
  return (rx + ry) / 2;
}

function cornerRadii(el: Element, size: { width: number; height: number }): HandoffRadii {
  const cs = getComputedStyle(el);
  const { width: w, height: h } = size;
  return [
    radiusPx(cs.borderTopLeftRadius, w, h),
    radiusPx(cs.borderTopRightRadius, w, h),
    radiusPx(cs.borderBottomRightRadius, w, h),
    radiusPx(cs.borderBottomLeftRadius, w, h),
  ];
}

/**
 * The part of the frame that is actually on screen: the frame's rect cut by
 * every ancestor that clips overflow (at its padding box), plus the corner
 * radii of that visible shape. A corner keeps the frame's own radius where it
 * is the frame's corner, takes a clipping ancestor's where it is that
 * ancestor's corner (a phone bleeding off a rounded card), and is square where
 * a straight clip edge cuts across the frame.
 */
function visibleClip(frame: HTMLElement, r: DOMRect): HandoffSource["clip"] {
  const own = cornerRadii(frame, r);
  let left = r.left;
  let top = r.top;
  let right = r.right;
  let bottom = r.bottom;
  const clippers: { l: number; t: number; r: number; b: number; radii: HandoffRadii }[] = [];

  for (let el = frame.parentElement; el && el !== document.documentElement; el = el.parentElement) {
    const cs = getComputedStyle(el);
    const clipX = cs.overflowX !== "visible";
    const clipY = cs.overflowY !== "visible";
    if (!clipX && !clipY) continue;
    const b = el.getBoundingClientRect();
    const bl = parseFloat(cs.borderLeftWidth) || 0;
    const bt = parseFloat(cs.borderTopWidth) || 0;
    const pad = {
      l: b.left + bl,
      t: b.top + bt,
      r: b.right - (parseFloat(cs.borderRightWidth) || 0),
      b: b.bottom - (parseFloat(cs.borderBottomWidth) || 0),
    };
    if (clipX) {
      left = Math.max(left, pad.l);
      right = Math.min(right, pad.r);
    }
    if (clipY) {
      top = Math.max(top, pad.t);
      bottom = Math.min(bottom, pad.b);
    }
    const inset = Math.max(bl, bt);
    const outer = cornerRadii(el, b);
    clippers.push({
      ...pad,
      radii: outer.map((v) => Math.max(0, v - inset)) as HandoffRadii,
    });
  }

  if (right - left < 1 || bottom - top < 1) {
    return { top: 0, right: 0, bottom: 0, left: 0, radii: own };
  }

  const near = (a: number, b: number) => Math.abs(a - b) < 0.75;
  const corner = (i: 0 | 1 | 2 | 3, x: number, y: number): number => {
    const west = i === 0 || i === 3;
    const north = i < 2;
    if (near(x, west ? r.left : r.right) && near(y, north ? r.top : r.bottom)) return own[i];
    for (const c of clippers) {
      if (near(x, west ? c.l : c.r) && near(y, north ? c.t : c.b)) return c.radii[i];
    }
    return 0;
  };

  return {
    top: top - r.top,
    right: r.right - right,
    bottom: r.bottom - bottom,
    left: left - r.left,
    radii: [corner(0, left, top), corner(1, right, top), corner(2, right, bottom), corner(3, left, bottom)],
  };
}

/** A clip-path inset() in one fixed shape, so GSAP can interpolate between
 *  two of them number by number. */
function insetShape(
  top: number,
  right: number,
  bottom: number,
  left: number,
  radii: HandoffRadii,
): string {
  const px = (n: number) => `${Math.round(n * 100) / 100}px`;
  return `inset(${px(top)} ${px(right)} ${px(bottom)} ${px(left)} round ${radii.map(px).join(" ")})`;
}

/** The clone's image at its painted box (see paintedBox). */
function imageStyle(source: HandoffSource): React.CSSProperties {
  const { image } = source;
  return {
    position: "absolute",
    left: image.left,
    top: image.top,
    width: image.width,
    height: image.height,
    // Preflight caps images at their container's width; a painted box is often
    // wider than the frame (object-fit: cover, a zoomed thumbnail).
    maxWidth: "none",
    objectFit: image.exact ? "fill" : (source.fit as React.CSSProperties["objectFit"]),
    objectPosition: image.exact ? undefined : source.position,
  };
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
  const imgRef = useRef<HTMLImageElement>(null);
  const flightRef = useRef<gsap.core.Timeline | null>(null);
  const timeoutRef = useRef<gsap.core.Tween | null>(null);
  const abortingRef = useRef(false);

  // Arm: measure the clicked frame and start a flight. Capture phase, no
  // preventDefault: Next's <Link> navigates exactly as it does today.
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
      // visible one on the page (a preview that sits beside its rows).
      let source: Element | null = a.querySelector(selector);
      if (!source || !isVisible(source)) {
        source =
          Array.from(document.querySelectorAll(selector)).find(isVisible) ?? null;
      }
      if (!source) return;
      const found = findScreen(source);
      if (!found) return;
      const { screen, frame } = found;
      const src = screenSrc(screen);
      if (!src || !isVisible(frame)) return;

      const r = frame.getBoundingClientRect();
      const frameStyle = getComputedStyle(frame);
      const screenStyle = getComputedStyle(screen);
      const rect = { top: r.top, left: r.left, width: r.width, height: r.height };
      const payload: HandoffSource = {
        slug,
        src,
        rect,
        radius: frameStyle.borderRadius,
        bezel: frameStyle.backgroundColor,
        image: paintedBox(screen, rect),
        fit: screenStyle.objectFit,
        position: screenStyle.objectPosition,
        clip: visibleClip(frame, r),
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
    const tFrame = found?.frame ?? target;
    const t = tFrame.getBoundingClientRect();
    const source = snap.source;
    const s = source.rect;
    if (t.width < 1 || t.height < 1 || s.width < 1) {
      handoff.abort();
      return;
    }
    timeoutRef.current?.kill();
    timeoutRef.current = null;

    // Top-centre to top-centre: both frames are centred in their columns, and
    // the width ratio is the scale. At the end of the flight the clone's own
    // (pre-scale) px map onto the target frame as local * scale from its
    // top-left corner, which is what the clip and image targets below use.
    const scale = t.width / s.width;
    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top - s.top;
    const dockAt = durations.slow * DOCK_AT;
    const flight = { duration: durations.slow, ease: gsapEase.inOutQuart };

    // The clip opens from the visible part of the source frame to the target
    // frame's visible shape: full width, cut to the target's height where the
    // clone is taller (a 4:3 card window docking into a 16:10 well), with the
    // corners the target actually shows (a poster layer takes its rounding
    // from the well that clips it, not from itself).
    const { clip } = source;
    const tClip = visibleClip(tFrame, t);
    const clipFrom = insetShape(clip.top, clip.right, clip.bottom, clip.left, clip.radii);
    const clipTo = insetShape(
      tClip.top / scale,
      tClip.right / scale,
      Math.max(0, s.height - (t.height - tClip.bottom) / scale),
      tClip.left / scale,
      tClip.radii.map((v) => v / scale) as HandoffRadii,
    );

    const tl = gsap.timeline({
      onComplete: () => {
        flightRef.current = null;
        handoff.clear();
      },
    });
    tl.to(clone, { x: dx, y: dy, scale, ...flight }, 0);
    tl.fromTo(clone, { clipPath: clipFrom }, { clipPath: clipTo, ...flight }, 0);

    // The image travels from where it was painted (mid-drift, mid-scroll,
    // zoomed) to where the hero paints its own: one uniform scale, by width,
    // so it never distorts. When the hero shows the same picture this makes
    // the dock seamless; when it shows a different one (a prototype's poster)
    // the geometry still agrees and the crossfade carries the rest.
    const img = imgRef.current;
    if (img && found && source.image.width > 0) {
      const to = paintedBox(found.screen, t);
      tl.to(
        img,
        {
          x: to.left / scale - source.image.left,
          y: to.top / scale - source.image.top,
          scale: to.width / scale / source.image.width,
          transformOrigin: "0 0",
          ...flight,
        },
        0,
      );
    }

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
  const { clip } = source;
  return (
    <div
      ref={cloneRef}
      aria-hidden="true"
      className="handoff-clone"
      style={{
        // Initial placement only (never animated): the clone is born at the
        // source frame's rect and moves by transform from there, cut to the
        // part of the frame that was visible.
        top: source.rect.top,
        left: source.rect.left,
        width: source.rect.width,
        height: source.rect.height,
        borderRadius: source.radius,
        backgroundColor: source.bezel,
        clipPath: insetShape(clip.top, clip.right, clip.bottom, clip.left, clip.radii),
      }}
    >
      <img ref={imgRef} src={source.src} alt="" draggable={false} style={imageStyle(source)} />
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
