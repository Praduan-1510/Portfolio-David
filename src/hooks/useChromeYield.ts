"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

/*
 * useChromeYield: whether the floating BOTTOM chrome (the dock and the bottom
 * edge fade) should step aside right now. Both call it, so they always leave
 * and return together; one set of observers serves every caller.
 *
 *   const yielded = useChromeYield();
 *   <div data-yield={yielded ? "" : undefined} inert={yielded} … />
 *
 * YIELDS WHILE
 *   - the route is /contact: the page IS the contact form;
 *   - the mobile menu sheet is open (Nav sets html[data-menu-open]);
 *   - any [data-chrome-yield] element intersects the BOTTOM BAND, the strip of
 *     viewport the dock and the fade occupy, plus a little air. The footer
 *     carries the marker (the page ends clean: no fade over the © row, no dock
 *     over the Motion switch), and so does the home reel's bottom-pinned board.
 *
 * MARKER CONTRACT. Put data-chrome-yield on the element that must never sit
 * under the chrome. Markers are found wherever and whenever they mount (a
 * MutationObserver watches for them, so a streamed-in page or a route change
 * needs no wiring), and each is watched by one IntersectionObserver whose root
 * is shrunk to the bottom band. No scroll listener, no per-frame work: the
 * observer only calls back when a marker crosses the band's edge.
 *
 * SSR: the server (and the hydration render) says "not yielded" unless the
 * route alone decides it; the live state lands on the first client frame.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot = false;
let teardown: (() => void) | null = null;
let rescan: (() => void) | null = null;

/** Height of the band, px: the taller of the dock's footprint and the fade. */
function bandHeight(): number {
  const h = window.innerHeight;
  // .edge-fade--bottom is clamp(64px, 10vh, 104px) tall; the dock is 56px
  // standing 12px (or the safe-area inset) off the bottom edge.
  const fade = Math.min(104, Math.max(64, h * 0.1));
  const dock = 12 + 56;
  return Math.round(Math.max(fade, dock) + 16);
}

function start(): () => void {
  const root = document.documentElement;
  let menuOpen = false;
  let markersInBand = false;

  const publish = () => {
    const next = menuOpen || markersInBand;
    if (next === snapshot) return;
    snapshot = next;
    listeners.forEach((l) => l());
  };

  // 1. The mobile menu: Nav flags the root while its sheet is open.
  const readMenu = () => {
    menuOpen = root.hasAttribute("data-menu-open");
    publish();
  };
  const menuWatch = new MutationObserver(readMenu);
  menuWatch.observe(root, { attributes: true, attributeFilter: ["data-menu-open"] });

  // 2. The markers.
  const tracked = new Set<Element>();
  const inBand = new Set<Element>();
  let band = bandHeight();
  let io: IntersectionObserver | null = null;

  const settle = () => {
    markersInBand = inBand.size > 0;
    publish();
  };

  // Synchronous first answer (one layout read, at mount or after a resize),
  // so the chrome never shows for a frame over a marker that is already in
  // the band. The observer's own first callback confirms it a frame later.
  const measure = (el: Element) => {
    const r = el.getBoundingClientRect();
    const top = window.innerHeight - band;
    return r.width > 0 && r.bottom > top && r.top < window.innerHeight;
  };

  const connect = () => {
    io?.disconnect();
    band = bandHeight();
    inBand.clear();
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target);
          else inBand.delete(e.target);
        }
        settle();
      },
      { rootMargin: `-${Math.max(0, window.innerHeight - band)}px 0px 0px 0px` },
    );
    for (const el of tracked) {
      if (measure(el)) inBand.add(el);
      io.observe(el);
    }
    settle();
  };

  const scan = () => {
    const found = new Set(document.querySelectorAll("[data-chrome-yield]"));
    for (const el of tracked) {
      if (found.has(el)) continue;
      tracked.delete(el);
      inBand.delete(el);
      io?.unobserve(el);
    }
    for (const el of found) {
      if (tracked.has(el)) continue;
      tracked.add(el);
      if (measure(el)) inBand.add(el);
      io?.observe(el);
    }
    settle();
  };

  // Markers come and go with routes and streamed content. Any insertion or
  // removal anywhere (or a marker attribute toggling) schedules ONE rescan
  // for the next frame; the scan itself is a single selector query.
  let scanQueued = 0;
  const queueScan = () => {
    if (scanQueued) return;
    scanQueued = requestAnimationFrame(() => {
      scanQueued = 0;
      scan();
    });
  };
  const domWatch = new MutationObserver(queueScan);
  domWatch.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-chrome-yield"],
  });

  // The band is in px, so a new viewport height (rotation, a mobile toolbar
  // collapsing) rebuilds the observer. Debounced: resize fires in bursts.
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(connect, 150);
  };
  window.addEventListener("resize", onResize, { passive: true });

  readMenu();
  connect();
  scan();
  rescan = queueScan;

  return () => {
    menuWatch.disconnect();
    domWatch.disconnect();
    io?.disconnect();
    cancelAnimationFrame(scanQueued);
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
    tracked.clear();
    inBand.clear();
    rescan = null;
    snapshot = false;
  };
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) teardown = start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      teardown?.();
      teardown = null;
    }
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => false;

export function useChromeYield(): boolean {
  const pathname = usePathname();
  const observed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // A new route has committed: look for its markers now rather than waiting
  // for the DOM watcher's next frame.
  useEffect(() => {
    rescan?.();
  }, [pathname]);

  return observed || pathname === "/contact";
}
