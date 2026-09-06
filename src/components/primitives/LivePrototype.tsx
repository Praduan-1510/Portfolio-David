"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import blurMap from "@/lib/content/blur-map.json";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { distance, stagger } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { FlapText } from "@/components/motion";

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * LivePrototype: the real thing, running in the page.
 *
 * Every other project on this site is shown through a recording or a still.
 * Meridian is a self-contained HTML prototype, so it can be USED instead of
 * watched: this frames it in the house browser chrome and hands the visitor the
 * actual app.
 *
 * Sibling to BrowserMockup, not a fork of it. BrowserMockup's screen well
 * hardcodes <Image>/<video> and is load-bearing on five surfaces (case hero,
 * ProjectCard, WorkStack, FlightBoard, <Shot>), threading a node slot and a tab
 * strip through it to serve one caller would put every card at risk. The shared
 * look lives in CSS (.lp-* mirrors .browser-slab's tilt/shadow values, see
 * globals.css), which stays the single source of truth for the vocabulary.
 *
 * Four deliberate behaviours:
 *
 * 1. DORMANT BY DEFAULT. The iframe does not exist until the visitor asks for
 *    it. The prototype is ~173KB of HTML plus three webfonts; mounting it on
 *    page load would put all of that on a case study's critical path for the
 *    majority of readers who only scroll. The poster is a real screenshot, so
 *    the dormant state still shows the work.
 *
 * 2. TILT → FLAT ON LAUNCH. At rest it's the same 3D-tilted slab as the web
 *    case-study hero. On activation it eases square-on: a picture of a product
 *    becomes the product. It's also the correct call technically: an
 *    interactive surface shouldn't be hit-tested through a rotateY(-9deg)
 *    parent. Reduced motion lands flat instantly.
 *
 * 3. THE VIEWPORT REALLY CHANGES. The device switcher resizes the window (and
 *    therefore the iframe's LAYOUT viewport) rather than just zooming a picture,
 *    so the prototype's own media queries fire: its sign-in gate collapses to
 *    one column below 900px, its nav folds below 820px. That responsive
 *    behaviour is part of the work being shown, so it has to be real.
 *
 * 4. THE LAUNCH IS A BOOT SEQUENCE BOUND TO THE REAL LOAD. The poster stays
 *    mounted above the iframe until its onLoad fires, so the well never shows
 *    the prototype's bare ink while 173KB of HTML and three webfonts parse,
 *    and the address pill flutters the domain as the loading indicator. The
 *    load event then sends a scanline down the well, cutting the poster away
 *    above it: the screenshot becomes the running app, pixel-aligned because
 *    it is a capture of the same first screen. Reduced motion holds the poster
 *    too (that part is correctness) and swaps it out with no wipe.
 *
 * Frame height is capped at ~78vh so there is always page above and below to
 * scroll on: a wheel event over a live iframe belongs to the iframe, and the
 * app shell (body{overflow:hidden}) won't pass it back.
 */

export interface PrototypeTab {
  /** Stable id (also the tab's DOM id seed). */
  id: string;
  /** Tab label. */
  label: string;
  /** Shorter label for narrow chrome; falls back to `label`. */
  shortLabel?: string;
  /** Same-origin path to the prototype page, e.g. /prototype/meridian/app.html */
  src: string;
  /** Text shown in the address pill (not a real link: this isn't a live site). */
  domain: string;
}

type DeviceId = "desktop" | "tablet" | "phone";

/* Real device viewports. `h: null` = desktop, whose height comes from the
   frame's own aspect rather than a device. */
const DEVICES: Record<DeviceId, { label: string; w: number; h: number | null }> = {
  desktop: { label: "Desktop", w: 1280, h: null },
  tablet: { label: "Tablet", w: 834, h: 1112 },
  phone: { label: "Phone", w: 390, h: 844 },
};

interface LivePrototypeProps {
  /** The surfaces reachable inside the frame, in tab order. */
  tabs: PrototypeTab[];
  /** Screenshot shown before the visitor launches the demo. */
  poster: string;
  /** Accessible description of the poster. */
  alt: string;
  /** Base for the iframe title, e.g. "Meridian" → "Meridian: App (interactive demo)". */
  title: string;
  /** Tab id to open first. Defaults to the first tab. */
  initialTab?: string;
  /** Devices offered. Defaults to all three. */
  devices?: DeviceId[];
  /** Desktop frame aspect (w/h). Default 1.6 (16:10). */
  desktopAspect?: number;
  /** Hard cap on frame height in px (also capped at 78vh). Default 760. */
  maxHeight?: number;
  /** One line under the frame: how to actually use the demo. */
  hint?: string;
  /** What THIS prototype does on open, e.g. "It opens on the sign-in screen…".
   *  Sits between the two invariant sentences of the launch scrim. Left out,
   *  the scrim promises nothing project-specific: which is the only safe
   *  default, since the component is shared by every prototype study. */
  launchNote?: string;
  /** Eager-load the poster: set only where the frame is the LCP element (hero). */
  priority?: boolean;
  className?: string;
}

/** Stable no-op subscriber for capability reads that never change at runtime. */
const NO_SUBSCRIBE = () => () => {};

/* The prefixed halves of the Fullscreen API. WebKit still ships these and only
   these, so they are typed here rather than cast away at each call site. */
type FsDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function Lock() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="4.4" width="6" height="4.2" rx="1" stroke="currentColor" strokeWidth="0.9" />
      <path d="M3.4 4.4V3.2a1.6 1.6 0 0 1 3.2 0v1.2" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12 7a5 5 0 1 1-1.6-3.67"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M12.2 1.4v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M5.4 1.6H1.6v3.8M8.6 12.4h3.8V8.6M12.4 5.4V1.6H8.6M1.6 8.6v3.8h3.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1.6 5.4h3.8V1.6M12.4 8.6H8.6v3.8M8.6 5.4h3.8V1.6M5.4 8.6H1.6v3.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LivePrototype({
  tabs,
  poster,
  alt,
  title,
  initialTab,
  devices = ["desktop", "tablet", "phone"],
  desktopAspect = 1.6,
  maxHeight = 760,
  hint,
  launchNote,
  priority = false,
  className,
}: LivePrototypeProps) {
  const [live, setLive] = useState(false);
  const [tabId, setTabId] = useState(initialTab ?? tabs[0]?.id);
  const [device, setDevice] = useState<DeviceId>(devices[0] ?? "desktop");
  // Bumped by the reload control; keying the iframe on it forces a remount.
  const [reloadKey, setReloadKey] = useState(0);
  // Measured well box → the scale that fits a real device viewport into it.
  // Height matters as much as width once the frame can go fullscreen: in the
  // page the well is aspect-locked so the two agree, but on a full screen it is
  // not, and scaling on width alone would push the bottom of the app off the
  // display.
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);
  // Whether the frame currently OWNS the screen. Tracked rather than inferred so
  // the control can say which way it goes, and so it survives the user leaving
  // fullscreen by a route this component never sees (Esc, the F11 key, the
  // browser's own chrome).
  const [fsActive, setFsActive] = useState(false);
  // Browser-capability read, SSR-safe and without a setState-in-effect: same
  // shape as useReducedMotion (no-op subscribe, false on the server).
  const canFullscreen = useSyncExternalStore(
    NO_SUBSCRIBE,
    // Safari and iPadOS expose only the prefixed flag, and reading the standard
    // one alone reported "no fullscreen" on every WebKit browser.
    () => !!(document.fullscreenEnabled || (document as FsDocument).webkitFullscreenEnabled),
    () => false,
  );

  // Ignition state. `loaded` flips on the iframe's first onLoad and the poster
  // is held above the panel until then; `posterGone` unmounts it once the
  // scanline has cut it away; `scrimGone` lets the scrim outlive `live` by one
  // exit tween. None of the three ever reset: a tab switch or reload keeps the
  // running app in view and only re-flutters the pill.
  const [loaded, setLoaded] = useState(false);
  const [scrimGone, setScrimGone] = useState(false);
  const [posterGone, setPosterGone] = useState(false);
  const reduced = useReducedMotion();

  const wrapRef = useRef<HTMLDivElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);
  // performance.now() at the first launch: the wipe waits on the slab landing.
  const launchedAt = useRef(0);
  const uid = useId();

  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];
  const dev = DEVICES[device];
  const devH = dev.h ?? Math.round(dev.w / desktopAspect);
  // Box ratio drives a pure-CSS size (below); the measured width drives the
  // scale. Splitting it this way means the frame reserves its space server-side
  // with no layout shift, and only the transform waits on measurement.
  const ratio = dev.w / devH;
  // Fit on the tighter axis. In the page this is arithmetically identical to
  // the old width-only scale, because the well is aspect-locked to exactly this
  // device ratio, so `min` only ever bites in fullscreen. Centring is done in
  // pixels rather than with a translate(-50%) because percentage translates
  // resolve against the element's UNSCALED box, which is wrong by a factor of
  // `scale` precisely when it matters.
  const scale =
    frameWidth > 0 && frameHeight > 0
      ? Math.min(frameWidth / dev.w, frameHeight / devH)
      : frameWidth > 0
        ? frameWidth / dev.w
        : 1;
  const offsetX = Math.max(0, (frameWidth - dev.w * scale) / 2);
  const offsetY = Math.max(0, (frameHeight - devH * scale) / 2);
  // The chrome sizes itself to the WINDOW, not the page: in tablet/phone mode the
  // slab is only a few hundred px wide, so full tab labels truncate to "A…" and
  // the status badge crowds the address pill. Host-viewport breakpoints can't see
  // that, because the window narrows while the page stays wide.
  const compact = dev.w < 900;

  // The frame's rendered width, tracked so the device viewport can be scaled to
  // fit it exactly. Runs from mount, so the number is already settled by the
  // time anyone clicks Launch.
  useEffect(() => {
    const el = wellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      setFrameWidth(entry.contentRect.width);
      setFrameHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);



  // The frame only ever mounts from a click, so directing keys into it is the
  // expected outcome (same contract as opening a dialog), and it's what makes
  // the demo's best feature, its ⌘K palette, work on the first try. The app
  // installs no focus trap, so Tab/Shift+Tab genuinely step back out.
  const focusFrame = useCallback(() => {
    try {
      frameRef.current?.contentWindow?.focus();
    } catch {
      /* focus is a nicety, never a failure mode */
    }
  }, []);

  const isFullscreen = () =>
    !!(document.fullscreenElement || (document as FsDocument).webkitFullscreenElement);

  const enterFullscreen = useCallback(() => {
    const el = wrapRef.current as FsElement | null;
    if (!el || isFullscreen()) return;
    // Must stay inside the click's user gesture, so this is called synchronously
    // from the handler and never after an await. A rejection is not a failure
    // mode: the demo has already launched inline underneath.
    const req = el.requestFullscreen ?? el.webkitRequestFullscreen;
    try {
      void req?.call(el)?.catch?.(() => {});
    } catch {
      /* some engines throw synchronously instead of rejecting */
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current as FsElement | null;
    if (!el) return;
    if (isFullscreen()) {
      const exit = document.exitFullscreen ?? (document as FsDocument).webkitExitFullscreen;
      try {
        void exit?.call(document)?.catch?.(() => {});
      } catch {
        /* as above */
      }
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen]);

  // Launching takes over the screen. The demo IS the artefact on these studies,
  // and the in-page frame is capped at 78vh precisely so the page still scrolls,
  // which is the right call for a dormant poster and the wrong one for a working
  // 14-column table. Fullscreen is requested in the same tick as the click so it
  // stays inside the user gesture; where the browser refuses or cannot (older
  // WebKit on iPhone), the demo simply launches inline as before.
  useEffect(() => {
    const sync = () =>
      setFsActive(
        !!(document.fullscreenElement || (document as FsDocument).webkitFullscreenElement),
      );
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const launch = useCallback(
    (id?: string) => {
      if (id) setTabId(id);
      if (!launchedAt.current) launchedAt.current = performance.now();
      setLive(true);
      enterFullscreen();
    },
    [enterFullscreen],
  );

  // Beat one, on the live rising edge: the control and its note lift away and
  // the scrim thins so the poster shows at full brightness while the slab eases
  // square-on (the CSS transition on [data-live]). The scrim is kept mounted
  // for its own exit and unmounts on completion; reduced motion drops it now.
  useGSAP(
    () => {
      if (!live || scrimGone) return;
      registerGsap();
      const scrim = scrimRef.current;
      if (!scrim || prefersReducedMotion()) {
        setScrimGone(true);
        return;
      }
      gsap.to(scrim.querySelectorAll("[data-scrim-item]"), {
        opacity: 0,
        y: -distance.sm,
        duration: durations.fast,
        ease: gsapEase.outQuad,
        stagger: stagger.tight,
      });
      gsap.to(scrim, {
        opacity: 0,
        duration: durations.base,
        ease: gsapEase.outQuad,
        onComplete: () => setScrimGone(true),
      });
    },
    { dependencies: [live, scrimGone, reduced] },
  );

  // Beat two, on the loaded rising edge: never before the slab has landed
  // (durations.slow from the click), a scanline sweeps the well while the
  // poster is clipped away above it, so the screenshot becomes the running app
  // top to bottom. The poster unmounts as the line clears the bottom edge and
  // the badge flips on that same beat. Reduced motion swaps it out with no wipe.
  useGSAP(
    () => {
      if (!loaded || posterGone) return;
      registerGsap();
      const posterEl = posterRef.current;
      const scan = scanRef.current;
      if (!posterEl || !scan || prefersReducedMotion()) {
        setPosterGone(true);
        return;
      }
      const wait = Math.max(
        0,
        durations.slow - (performance.now() - launchedAt.current) / 1000,
      );
      const tl = gsap.timeline({ delay: wait });
      tl.set(scan, { opacity: 1, immediateRender: false });
      // Percent-based so the cut holds inside :fullscreen, where the well scales.
      tl.fromTo(
        posterEl,
        { clipPath: "inset(0% 0 0 0)" },
        { clipPath: "inset(100% 0 0 0)", duration: durations.slower, ease: gsapEase.inOutQuart },
        0,
      );
      // Function-valued so the travel is read when the sweep starts, after the
      // wait, by which point a fullscreen well has taken its final height.
      tl.to(
        scan,
        {
          y: () => (wellRef.current?.clientHeight ?? 0) - 2,
          duration: durations.slower,
          ease: gsapEase.inOutQuart,
        },
        0,
      );
      tl.call(() => setPosterGone(true));
      tl.to(scan, { opacity: 0, duration: durations.fast, ease: gsapEase.outQuad });
    },
    { dependencies: [loaded, posterGone, reduced] },
  );

  if (!tab) return null;

  // `lp-ctl` and `lp-chrome` below are hooks for the fullscreen rules in
  // globals.css, which scale this chrome up. They carry no styling of their own:
  // the utilities stay the source of truth for the in-page appearance.
  const chromeButton =
    "lp-ctl inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-line text-muted transition-colors duration-fast ease-out-quad hover:border-neon hover:text-neon focus-visible:border-neon focus-visible:text-neon";

  return (
    <figure className={cn("lp-root not-prose my-space-8", className)}>
      {/* No `data-lenis-prevent` here, deliberately: Lenis tests it by walking
          event.composedPath() in the HOST document, and a wheel event dispatched
          inside an iframe never appears there. It would be pure cargo cult. The
          frame is instead capped at ~78vh so there's always page above and below
          to scroll on. */}
      <div ref={wrapRef} className="lp-wrap">
        <div className={cn(!live && "browser-stage")}>
          <div
            className="lp-slab"
            data-live={live ? "" : undefined}
            style={
              {
                // Pure CSS geometry: the frame is `ratio`-shaped and shrinks to
                // whichever of the column, 78vh, or maxHeight binds first, so
                // the box is correct on the server with no measurement and no CLS.
                "--lp-ratio": String(ratio),
                "--lp-maxh": `${maxHeight}px`,
              } as React.CSSProperties
            }
          >
            {/* ── Chrome, row 1: window dots · tabs · window actions ────────── */}
            <div className="lp-chrome flex h-[34px] items-center gap-space-3 rounded-t-[7px] border-b border-line bg-bezel px-space-3">
              <span aria-hidden="true" className="flex shrink-0 items-center gap-[6px]">
                <span className="h-[10px] w-[10px] rounded-full bg-accent" />
                <span className="h-[10px] w-[10px] rounded-full bg-white/15" />
                <span className="h-[10px] w-[10px] rounded-full bg-white/15" />
              </span>

              <div
                role="tablist"
                aria-label={`${title}, prototype surfaces`}
                className="flex min-w-0 flex-1 items-center gap-[3px] overflow-hidden"
              >
                {tabs.map((t) => {
                  const selected = t.id === tab.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      id={`${uid}-tab-${t.id}`}
                      aria-selected={selected}
                      aria-controls={`${uid}-panel`}
                      onClick={() => launch(t.id)}
                      className={cn(
                        "min-w-0 shrink truncate rounded-[6px] border py-[3px] font-mono text-[0.6875rem] uppercase transition-colors duration-fast ease-out-quad",
                        compact
                          ? "px-[5px] tracking-[0.04em]"
                          : "px-space-2 tracking-[0.1em]",
                        selected
                          ? "border-line bg-white/[0.07] text-fg"
                          : "border-transparent text-muted hover:text-fg",
                      )}
                    >
                      {compact ? t.shortLabel ?? t.label : t.label}
                    </button>
                  );
                })}
              </div>

              <span className="flex shrink-0 items-center gap-[5px]">
                {live && (
                  <button
                    type="button"
                    onClick={() => setReloadKey((n) => n + 1)}
                    className={chromeButton}
                    title="Reload the demo"
                  >
                    <ReloadIcon />
                    <span className="sr-only">Reload the demo</span>
                  </button>
                )}
                {/* Dropped in the narrow window: the three tab labels need that
                    space more than a control the OPEN ↗ link already covers. */}
                {/* `!compact` hides this in the phone and tablet viewports, where the
                    chrome genuinely has no room for it. That gate must not apply
                    while the demo owns the screen: switching to Phone in
                    fullscreen would otherwise remove the only way back out, and
                    leave the reader hunting for Esc. On a full screen there is
                    room for one 22px button. */}
                {live && canFullscreen && (fsActive || !compact) && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className={cn(chromeButton, fsActive ? "inline-flex" : "hidden md:inline-flex")}
                    title={fsActive ? "Exit full screen" : "Expand to full screen"}
                  >
                    {fsActive ? <CollapseIcon /> : <ExpandIcon />}
                    <span className="sr-only">
                      {fsActive ? "Exit full screen" : "Expand the demo to full screen"}
                    </span>
                  </button>
                )}
                <a
                  href={tab.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(chromeButton, "w-auto px-space-2 font-mono text-[0.625rem] uppercase tracking-[0.1em]")}
                >
                  Open ↗<span className="sr-only"> {tab.label} in a new tab</span>
                </a>
              </span>
            </div>

            {/* ── Chrome, row 2: address pill + honesty badge ───────────────── */}
            <div className="lp-chrome flex h-[30px] items-center gap-space-3 border-b border-line bg-bezel px-space-3">
              <span className="inline-flex min-w-0 flex-1 items-center gap-space-2 rounded-full border border-line bg-white/[0.04] px-space-3 py-[2px] font-mono text-caption text-muted">
                <Lock />
                {/* Live only: the pill is the loading indicator, fluttering the
                    domain in the accent colour while the document beneath the
                    poster parses. Keyed with the iframe so a surface switch or
                    reload re-flutters to the new document. Plain text while
                    dormant, so nothing flutters on page load. */}
                <span className="truncate">
                  {live ? (
                    <FlapText
                      key={`${tab.id}-${reloadKey}`}
                      text={tab.domain}
                      trigger="load"
                      flips={2}
                      colorMode="accent"
                    />
                  ) : (
                    tab.domain
                  )}
                </span>
              </span>
              {!compact && (
                <span className="hidden shrink-0 items-center gap-[5px] font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted sm:inline-flex">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-[5px] w-[5px] rounded-full",
                      posterGone ? "bg-neon motion-safe:animate-status-pulse" : "bg-white/30",
                    )}
                  />
                  {/* Honest until the wipe has cleared: the app is not running
                      for the reader while the poster still covers it. */}
                  {posterGone ? (
                    <FlapText key="running" text="RUNNING LOCALLY" trigger="load" flips={3} colorMode="mono" />
                  ) : (
                    "Prototype"
                  )}
                </span>
              )}
            </div>

            {/* ── Screen ────────────────────────────────────────────────────── */}
            <div ref={wellRef} className="lp-well">
              {live && (
                <div
                  id={`${uid}-panel`}
                  role="tabpanel"
                  aria-labelledby={`${uid}-tab-${tab.id}`}
                  className="absolute inset-0"
                >
                  <iframe
                    ref={frameRef}
                    // Deliberately NOT keyed on `device`: switching viewport must
                    // resize the frame, not remount it, so the running app keeps
                    // its state (the prototype has no resize listener: it just
                    // re-lays-out and re-fires its own media queries).
                    key={`${tab.id}-${reloadKey}`}
                    src={tab.src}
                    title={`${title}, ${tab.label} (interactive demo)`}
                    onLoad={() => {
                      setLoaded(true);
                      focusFrame();
                    }}
                    // Opts out of Lenis's blanket pointer-events:none on iframes
                    // (see globals.css), without it, clicks are eaten for the
                    // ~0.3–1s a smooth scroll coasts.
                    data-live-frame
                    // User-initiated, so lazy would be pointless. No `sandbox`:
                    // it's same-origin and needs localStorage, and
                    // `allow-scripts allow-same-origin` on a same-origin document
                    // is equivalent to no sandbox at all.
                    allow="fullscreen; clipboard-write"
                    // #16181B is NOT a site colour and must not be tokenised:
                    // it is the prototype document's own --ink-1 (see
                    // public/prototype/meridian/app.html), painted here so the
                    // frame does not flash a different dark before the iframe
                    // paints. Like the Spendee status swatches, it is CONTENT
                    // that happens to be a colour, so the logo repaint leaves
                    // it alone; retuning it would just reintroduce the flash.
                    // It tracks the prototype, though: it moved from the old
                    // plum #12101E when that palette became machined slate.
                    className="absolute border-0 bg-[#16181B]"
                    style={{
                      // The iframe is given the DEVICE's pixel dimensions and
                      // scaled to fit: so the document inside lays out at 390 /
                      // 834 / 1280 CSS px and its own media queries fire, which
                      // a plain percentage width could never do.
                      width: dev.w,
                      height: devH,
                      left: offsetX,
                      top: offsetY,
                      transform: `scale(${scale})`,
                      transformOrigin: "0 0",
                    }}
                  />
                </div>
              )}
              {/* The poster: the LCP image on the hero, never opacity-gated. It
                  simply stays mounted longer, above the panel, until the load
                  event lets the scanline cut it away. */}
              {(!live || !posterGone) && (
                <div
                  ref={posterRef}
                  aria-hidden={live ? "true" : undefined}
                  className="pointer-events-none absolute inset-0 z-[2]"
                >
                  <Image
                    src={poster}
                    alt={alt}
                    fill
                    sizes="(min-width: 1024px) 68rem, 94vw"
                    priority={priority}
                    placeholder={blurFor(poster) ? "blur" : "empty"}
                    blurDataURL={blurFor(poster)}
                    className="object-cover object-[50%_0%]"
                  />
                </div>
              )}
              {/* Launch scrim: dims the still just enough that the control
                  is unmistakably the primary action. Outlives `live` by one
                  exit tween, inert to the pointer from the click onward. */}
              {(!live || !scrimGone) && (
                <div
                  ref={scrimRef}
                  className={cn(
                    "absolute inset-0 z-[2] flex flex-col items-center justify-center gap-space-4 bg-gradient-to-b from-black/55 via-black/70 to-black/80 px-space-5 text-center",
                    live && "pointer-events-none",
                  )}
                >
                  <button
                    type="button"
                    data-scrim-item
                    onClick={() => launch()}
                    className="lp-launch hidden items-center gap-space-3 rounded-full border border-accent bg-accent/10 px-space-5 py-space-3 font-mono text-caption uppercase tracking-[0.16em] text-fg transition-colors duration-fast ease-out-quad hover:border-neon hover:text-neon sm:inline-flex"
                  >
                    <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-accent" />
                    Launch the live demo
                  </button>
                  <p data-scrim-item className="max-w-[48ch] font-mono text-caption text-white/70">
                    {/* Only the two invariants are hardcoded: they hold for
                        every prototype study. What happens on open is a claim
                        about ONE artefact, so it comes from that project's
                        frontmatter (`prototype.launchNote`). This sentence
                        used to describe Meridian's sign-in screen for every
                        study, which made it false the moment a second
                        prototype shipped. */}
                    <span className="hidden sm:inline">
                      The real prototype, not a recording.{" "}
                      {launchNote ? `${launchNote} ` : ""}Runs entirely in your
                      browser.
                    </span>
                    <span className="sm:hidden">
                      The real prototype runs in your browser, but it needs a wider
                      screen than this to be usable in-page.
                    </span>
                  </p>
                  <a
                    data-scrim-item
                    href={tab.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-space-2 rounded-full border border-line px-space-4 py-space-2 font-mono text-caption uppercase tracking-[0.14em] text-white/80 transition-colors duration-fast ease-out-quad hover:border-neon hover:text-neon sm:hidden"
                  >
                    Open the demo ↗
                  </a>
                </div>
              )}
              {/* Glass sheen: shared with PhoneFrame / BrowserMockup. Never
                  intercepts a click meant for the running app. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              />
              {/* The ignition scanline: rides the poster's cut edge on load.
                  Parked dark at the top; the wipe timeline owns it. */}
              <span
                ref={scanRef}
                aria-hidden="true"
                className="lp-scan pointer-events-none absolute inset-x-0 top-0 z-[3] h-[2px] opacity-0"
              />
            </div>
          </div>
        </div>

        {/* ── Device switcher ─────────────────────────────────────────────── */}
        {devices.length > 1 && (
          <div className="lp-devices mt-space-4 flex flex-wrap items-center justify-center gap-space-3">
            <span
              role="group"
              aria-label="Demo viewport size"
              className="inline-flex items-center gap-[2px] rounded-full border border-line bg-surface p-[3px]"
            >
              {devices.map((id) => {
                const active = id === device;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDevice(id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full px-space-3 py-[5px] font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors duration-fast ease-out-quad",
                      active
                        ? "bg-accent text-on-accent"
                        : "text-muted hover:text-fg",
                    )}
                  >
                    {DEVICES[id].label}
                    <span className="sr-only">
                      {", "}
                      {DEVICES[id].w} pixels wide
                    </span>
                  </button>
                );
              })}
            </span>
            <span className="font-mono text-caption text-muted" aria-hidden="true">
              {dev.w}px
            </span>
          </div>
        )}
      </div>

      {hint && (
        <figcaption className="mx-auto mt-space-4 max-w-[62ch] text-center font-mono text-caption uppercase tracking-[0.12em] text-muted">
          {hint}
        </figcaption>
      )}
    </figure>
  );
}
