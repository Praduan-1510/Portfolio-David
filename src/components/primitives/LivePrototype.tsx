"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import blurMap from "@/lib/content/blur-map.json";
import { gsap, registerGsap, gsapEase } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { useLenis } from "@/lib/lenis/useLenis";
import { FlapText } from "@/components/motion";
import { Button } from "./Button";

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * LivePrototype: the real thing, one click away.
 *
 * Every other project on this site is shown through a recording or a still.
 * These studies ship self-contained HTML prototypes, so the work can be USED
 * instead of watched: this frames it in the house browser chrome and hands the
 * visitor the actual app.
 *
 * Sibling to BrowserMockup, not a fork of it. BrowserMockup's screen well
 * hardcodes <Image>/<video> and is load-bearing on five surfaces (case hero,
 * ProjectCard, WorkStack, FlightBoard, <Shot>), threading a node slot and a tab
 * strip through it to serve one caller would put every card at risk. The shared
 * look lives in CSS (.lp-* mirrors .browser-slab's tilt/shadow values, see
 * globals.css), which stays the single source of truth for the vocabulary.
 *
 * Five deliberate behaviours:
 *
 * 1. DORMANT IN THE PAGE. The frame in the case study is only ever a picture:
 *    the tilted slab, a real screenshot, a launch control. No iframe exists
 *    until the visitor asks for one. A prototype is ~173KB of HTML plus
 *    webfonts; mounting it on page load would put all of that on a case
 *    study's critical path for the majority of readers who only scroll.
 *
 * 2. LAUNCH OPENS A WINDOW, NOT THE SCREEN. The demo runs in a modal <dialog>
 *    that covers the browser window, with the browser's own tabs, address bar
 *    and Back button still in view. It used to take the display with the
 *    Fullscreen API, and readers felt trapped: the way out was an unlabelled
 *    30px icon or a key they had to already know, and on phones the demo was
 *    a raw new tab with no way back at all. Now there are three exits and each
 *    is one a reader already reaches for: a labelled ✕ Close, Esc, and the
 *    browser's Back. All three land on the exact scroll position the reader
 *    left, with focus on the control that opened the demo. Full screen
 *    survives as an opt-in toggle in the window's bar.
 *
 * 3. THE VIEWPORT REALLY CHANGES. The prototypes' media queries are part of
 *    the work (Meridian's gate collapses to one column below 900px, its nav
 *    folds below 820px), so the iframe is given a real layout viewport rather
 *    than a zoomed picture. Desktop fills the window: at native CSS px once
 *    the window is desktop-sized, and on a narrower one (a tablet) laid out at
 *    DESKTOP_MIN_W and scaled down to fill, so a desktop prototype is never
 *    shown as a phone stretched across a tablet. Tablet and Phone lay out at a
 *    real device's viewport, scaled down to fit when the window is smaller. A
 *    phone-width window is itself the phone, so there the frame fills the
 *    space under the bar at native size and the switcher is not offered.
 *
 * 4. THE LAUNCH IS A BOOT SEQUENCE BOUND TO THE REAL LOAD. The window grows
 *    out of the frame the reader clicked, carrying its poster with it, and the
 *    poster stays above the iframe until its onLoad fires, so the well never
 *    shows the prototype's bare ink while its document parses. The address
 *    line flutters the domain as the loading indicator, then a scanline cuts
 *    the poster away top to bottom: the screenshot becomes the running app.
 *    Reduced motion holds the poster too (that part is correctness) and swaps
 *    it out with no wipe, and the window opens and closes without the grow.
 *
 * 5. ONE HISTORY ENTRY, WHATEVER HAPPENS INSIDE. Opening pushes one entry so
 *    the browser's Back closes the demo instead of leaving the page. That only
 *    works if the prototype adds none of its own, and most of them navigate:
 *    Baseweight routes by `location.hash =`, Keel and CareBridge are multi-
 *    page, Spendee walks its screens in a nested iframe, and every one of
 *    those is a joint-history entry that Back would step through first. So the
 *    window bridges into its same-origin frames (see bridgeWindow) and turns
 *    their pushes into replaces (pushState steps included), keeping a
 *    per-frame stack so the prototypes' own back arrows (Spendee's call
 *    history.back()) still step back a screen, or a step within one.
 *    The same bridge decides which Esc is whose: see "The frame bridge" below.
 *
 * The frame's height is capped at ~78vh so there is always page above and
 * below to scroll on: a wheel event over the dormant frame belongs to the page.
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
  /** Text shown in the address line (not a real link: this isn't a live site). */
  domain: string;
}

type DeviceId = "desktop" | "tablet" | "phone";

const DEVICE_LABEL: Record<DeviceId, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  phone: "Phone",
};

/* Real device viewports, for the two devices that are SIMULATED. Desktop has
   no fixed size any more: in the demo window it is the window. */
const DEVICE_SIZE: Record<Exclude<DeviceId, "desktop">, { w: number; h: number }> = {
  tablet: { w: 834, h: 1112 },
  phone: { w: 390, h: 844 },
};

/* The narrowest layout viewport Desktop will hand a prototype: the width these
   were composed at, and the in-page frame's old desktop viewport. Below their
   desktop breakpoints (880px for Spendee and Nukkad) the app studies fold into
   a full-bleed phone UI, which on a tablet-width window is a phone stretched
   to 768px: exactly what their frontmatter leaves Tablet out to avoid. */
const DESKTOP_MIN_W = 1280;

/* A portrait tablet: a touch window too narrow for Desktop to read (it would be
   scaled to about 0.6) and too tall to be a landscape phone. */
const TABLET_WINDOW =
  "(pointer: coarse) and (min-width: 640px) and (max-width: 1023px) and (min-height: 521px)";

/* The longest the boot layer holds before it lifts whatever the frame is doing:
   a stalled webfont once kept the poster up for 21s over an app taking taps. */
const BOOT_CAP_MS = 3500;

interface LivePrototypeProps {
  /** The surfaces reachable inside the demo, in tab order. */
  tabs: PrototypeTab[];
  /** Screenshot shown in the dormant frame, and in the demo window until it boots. */
  poster: string;
  /** Accessible description of the poster. */
  alt: string;
  /** The project's name: titles the demo window and the iframe, e.g. "Meridian". */
  title: string;
  /** Tab id to open first. Defaults to the first tab. */
  initialTab?: string;
  /** Devices offered by the demo window's switcher. Defaults to all three. */
  devices?: DeviceId[];
  /** Aspect (w/h) of the dormant frame and of the poster capture. Default 1.6. */
  desktopAspect?: number;
  /** Hard cap on the dormant frame's height in px (also capped at 78vh). Default 760. */
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
const noop = () => {};

/* ── Browser surfaces this file reaches for ────────────────────────────────
   The prefixed halves of the Fullscreen API: WebKit still ships these and
   only these, so they are typed here rather than cast away at each call site.
   And the slice of the Navigation API used below, typed locally because this
   TypeScript's DOM lib predates it. Every use of either is feature-detected. */
type FsDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
interface NavResult {
  committed: Promise<unknown>;
  finished: Promise<unknown>;
}
interface NavigationLike extends EventTarget {
  currentEntry: { key: string } | null;
  entries(): { key: string }[];
  traverseTo(key: string): NavResult;
}
type NavigateEventLike = Event & {
  navigationType: "push" | "replace" | "reload" | "traverse";
  hashChange: boolean;
  formData: FormData | null;
  downloadRequest: string | null;
  destination: { url: string; sameDocument: boolean };
};
type NavWindow = Window & { navigation?: NavigationLike };

const fullscreenSupported = () =>
  // Safari and iPadOS expose only the prefixed flag, and reading the standard
  // one alone reported "no fullscreen" on every WebKit browser. iPhone Safari
  // reports neither for elements, which is what hides the toggle there.
  !!(document.fullscreenEnabled || (document as FsDocument).webkitFullscreenEnabled);
const fullscreenElement = () =>
  document.fullscreenElement ?? (document as FsDocument).webkitFullscreenElement ?? null;
function exitFullscreen() {
  const exit = document.exitFullscreen ?? (document as FsDocument).webkitExitFullscreen;
  try {
    void exit?.call(document)?.catch?.(noop);
  } catch {
    /* some engines throw synchronously instead of rejecting */
  }
}

/** A media query as render state. Only ever read by the demo window, which is
 *  client-only (it mounts from a click), so the server snapshot never shows. */
function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/* ── The frame bridge ──────────────────────────────────────────────────────
   The prototypes are same-origin, so the demo window can listen inside them,
   and has to, for two things the parent page cannot see from outside:

   ESC. A keydown whose focus is inside an iframe is dispatched in the iframe's
   document and never reaches this one, so the dialog's own `cancel` covers
   only Esc pressed on the bar. And the prototypes use Esc themselves:
   Meridian's ⌘K palette and modals, Baseweight's search panel and native
   dialogs, the Spendee and Nukkad sheets, CareBridge's overlays. The rule is
   that the FIRST Esc belongs to whatever layer the prototype has open, and
   only an Esc it leaves untouched closes the demo. "Untouched" is measured,
   not guessed per prototype, because they disagree about how to say it:
   CareBridge and Baseweight preventDefault, Meridian and Nukkad close their
   layer without doing so, Baseweight's <dialog>s close as the key's DEFAULT
   action, after every listener has run, and Spendee swallows the key outright
   while a payment is processing. So an Esc is the prototype's if any of these
   is true once it and its microtasks have finished:
     - it was defaultPrevented;
     - it never reached the window's bubble phase (propagation was stopped);
     - a modal <dialog> or an auto popover was open when it went down, since
       those close by default action and change nothing before we look;
     - the document is not the same as it was: a class, attribute, text or
       node actually changed (net of no-op writes, so Spendee's unconditional
       sheet.close() does not count as handling a key it ignored).
   Anything else closes the demo.

   HISTORY. See behaviour 5 in the header. pushState steps and the prototype's
   own back() need only window.history, so they are converted everywhere.
   Navigations are converted through the Navigation API where it exists; where
   it does not, the reader's link clicks and GET forms are still caught (Keel
   and CareBridge navigate only that way), and only SCRIPT navigations
   (Spendee's location.href, Baseweight's location.hash) push natively. Back
   then steps through those before it closes the demo, and ✕ and Esc step out
   past them when they close it (see stepOut). */

/** Esc in a field with something typed in it is the field's: the reader is
 *  mid-entry (Keel's sign-in email, say), and closing the demo would drop it.
 *  Checked by tag rather than instanceof, which fails across the frame's realm. */
function fieldHoldsText(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return !!(el as HTMLTextAreaElement).value;
  if (tag === "INPUT") {
    const type = ((el as HTMLInputElement).type || "text").toLowerCase();
    if (/^(button|checkbox|color|file|hidden|image|radio|range|reset|submit)$/.test(type)) {
      return false;
    }
    return !!(el as HTMLInputElement).value;
  }
  return el.isContentEditable === true && !!el.textContent?.trim();
}

/** One entry the demo's own history would have pushed, kept so the prototype's
 *  back() can still return to it. Two kinds, because they come back two ways:
 *  a navigation (a new document, or a #fragment route) is re-navigated to; a
 *  classic pushState step is restored in place, with its state and a popstate,
 *  exactly as a traversal inside one document would. */
type FrameStep =
  | { kind: "navigation"; url: string }
  | { kind: "state"; url: string; state: unknown };

interface Bridge {
  signal: AbortSignal;
  /** Per-frame stack of the entries the bridge replaced, newest last. */
  stacks: WeakMap<Element, FrameStep[]>;
  /** Documents already bridged: a Window can outlive its first document. */
  seen: WeakSet<Document>;
  onEscape: () => void;
  /** The reader traversed the demo's own history (browser Back inside it). */
  onTraverse: () => void;
}

const MUTATIONS: MutationObserverInit = {
  subtree: true,
  childList: true,
  attributes: true,
  attributeOldValue: true,
  characterData: true,
  characterDataOldValue: true,
};

function hasOpenNativeLayer(doc: Document): boolean {
  try {
    return (
      doc.querySelector('dialog:modal, [popover]:popover-open:not([popover="manual"])') !== null
    );
  } catch {
    // An engine without :modal or :popover-open rejects the whole list.
    return doc.querySelector("dialog[open]") !== null;
  }
}

/** Whether a batch of mutation records left the document different. Records
 *  are folded per node so a value written and restored inside the same event,
 *  or rewritten to what it already was, counts as no change. */
function documentChanged(records: MutationRecord[]): boolean {
  const before = new Map<Node, Map<string, string | null>>();
  for (const r of records) {
    if (r.type === "childList") {
      if (r.addedNodes.length > 0 || r.removedNodes.length > 0) return true;
      continue;
    }
    const key = r.type === "attributes" ? `@${r.attributeName ?? ""}` : "#text";
    let seen = before.get(r.target);
    if (!seen) before.set(r.target, (seen = new Map()));
    if (!seen.has(key)) seen.set(key, r.oldValue);
  }
  for (const [node, fields] of before) {
    for (const [key, old] of fields) {
      const now =
        key === "#text" ? node.nodeValue : (node as Element).getAttribute(key.slice(1));
      if (now !== old) return true;
    }
  }
  return false;
}

/** Wire one same-origin window of the running demo, and every frame inside it. */
function bridgeWindow(win: Window | null, bridge: Bridge): void {
  if (!win || bridge.signal.aborted) return;
  let doc: Document;
  try {
    doc = win.document;
  } catch {
    return; // cross-origin: out of reach, and out of scope
  }
  // about:blank is the placeholder an iframe holds before its document lands;
  // the real document is bridged on its own load event.
  if (!doc || doc.URL === "about:blank" || bridge.seen.has(doc)) return;
  bridge.seen.add(doc);
  const { signal } = bridge;

  // ── Esc. The capture listener on the window is the first thing to see the
  // key, so it snapshots before the prototype acts. The verdict is given by a
  // listener added mid-dispatch, which therefore runs after every bubble
  // listener the window already has, the prototype's own included, and it is
  // given SYNCHRONOUSLY: every handler has run by then, and closes deferred to
  // a microtask have flushed at the checkpoints between listeners, but no
  // animation frame or timer can have run. Deferring the verdict to a timer was
  // the first version, and measured wrong: a frame of the prototype's own
  // animation could land in that gap and read as the key being handled.
  win.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || e.isComposing || e.repeat) return;
      if (fieldHoldsText(e.composedPath()[0] ?? e.target)) return;
      const layerOpen = hasOpenNativeLayer(doc);
      const records: MutationRecord[] = [];
      const observer = new MutationObserver((batch) => {
        records.push(...batch);
      });
      observer.observe(doc, MUTATIONS);
      let settled = false;
      const settle = () => {
        if (settled) return false;
        settled = true;
        win.removeEventListener("keydown", onBubble);
        records.push(...observer.takeRecords());
        observer.disconnect();
        return true;
      };
      const onBubble = (ev: Event) => {
        if (ev !== e || !settle() || signal.aborted) return;
        if (layerOpen || e.defaultPrevented || documentChanged(records)) return;
        // Closed from the parent's clock, outside the prototype's dispatch.
        window.setTimeout(bridge.onEscape, 0);
      };
      win.addEventListener("keydown", onBubble, { signal });
      // If the bubble never reaches the window, the prototype stopped the
      // key's propagation, which is the plainest way of keeping it.
      win.setTimeout(settle, 0);
    },
    { capture: true, signal },
  );

  // ── History. Pushes become replaces; the prototype's own back steps down the
  // frame's stack. Keyed by the <iframe> element rather than the window,
  // because a cross-document navigation brings a new Window with it.
  const nav = (win as NavWindow).navigation;
  const frame = win.frameElement;
  if (frame) {
    const stackOf = () => {
      let stack = bridge.stacks.get(frame);
      if (!stack) bridge.stacks.set(frame, (stack = []));
      return stack;
    };
    // A push, re-issued as a replace with the page it would have covered kept
    // on the stack. Synchronous on purpose: `location.hash = x` updates the
    // URL before it returns, and a router that reads it straight back must
    // see x.
    const replaceTo = (url: string) => {
      stackOf().push({ kind: "navigation", url: win.location.href });
      win.location.replace(url);
    };
    const sameOrigin = (href: string, base = win.location.href): string | null => {
      try {
        const url = new URL(href, base);
        return url.origin === win.location.origin ? url.href : null;
      } catch {
        return null;
      }
    };
    // NAVIGATIONS: a link to another page, `location.href =`, a #fragment
    // route (`location.hash =`, Baseweight's whole router). Cancelled and
    // re-issued as a replace of the same URL.
    if (nav) {
      nav.addEventListener(
        "navigate",
        (event) => {
          const e = event as NavigateEventLike;
          if (e.navigationType !== "push" || !e.cancelable) return;
          // A POST body or a download cannot be re-issued as a plain replace.
          if (e.formData || e.downloadRequest !== null) return;
          // A same-document push that is not a #fragment route is a pushState,
          // handled below. Re-issuing one as location.replace() is a LOAD: with
          // the same URL it reloads the page, and the state it carried is gone.
          // That was Spendee's GST flow, stuck on step 1. One that bypasses the
          // patch below is left to push natively rather than risk that.
          if (e.destination.sameDocument && !e.hashChange) return;
          const dest = sameOrigin(e.destination.url);
          if (!dest) return;
          e.preventDefault();
          replaceTo(dest);
        },
        { signal },
      );
    } else {
      // WITHOUT the Navigation API, what the reader clicks can still be caught:
      // a same-frame link to this origin, and a GET form (Keel signs in with
      // one, and is otherwise all links). Decided at the END of the event's
      // dispatch, the way Esc is, so a prototype that handles the click or the
      // submit itself (preventDefault) keeps it.
      const afterDispatch = (e: Event, decide: () => void) => {
        const onBubble = (ev: Event) => {
          if (ev !== e) return;
          win.removeEventListener(e.type, onBubble);
          if (!e.defaultPrevented && !signal.aborted) decide();
        };
        win.addEventListener(e.type, onBubble, { signal });
        win.setTimeout(() => win.removeEventListener(e.type, onBubble), 0);
      };
      const selfTarget = (t: string | null) => {
        const target = (t || doc.querySelector("base[target]")?.getAttribute("target") || "")
          .toLowerCase();
        return target === "" || target === "_self";
      };
      win.addEventListener(
        "click",
        (event) => {
          const e = event as MouseEvent;
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          const a = (e.target as Element | null)?.closest?.("a[href], area[href]") as
            | HTMLAnchorElement
            | null;
          if (!a || typeof a.href !== "string" || a.hasAttribute("download")) return;
          if (!selfTarget(a.getAttribute("target"))) return;
          const dest = sameOrigin(a.href);
          // The same URL again is already a replace, natively.
          if (!dest || dest === win.location.href) return;
          afterDispatch(e, () => {
            e.preventDefault();
            replaceTo(dest);
          });
        },
        { capture: true, signal },
      );
      win.addEventListener(
        "submit",
        (event) => {
          const form = event.target as HTMLFormElement;
          const by = (event as SubmitEvent).submitter as HTMLButtonElement | null;
          const method = by?.getAttribute("formmethod") || form.getAttribute("method") || "get";
          if (method.toLowerCase() !== "get") return;
          if (!selfTarget(by?.getAttribute("formtarget") || form.getAttribute("target"))) return;
          // getAttribute, not form.action: a control named "action" shadows it.
          const action = sameOrigin(
            by?.getAttribute("formaction") || form.getAttribute("action") || win.location.href,
          );
          if (!action) return;
          afterDispatch(event, () => {
            const FormDataIn = (win as Window & typeof globalThis).FormData;
            let data: FormData;
            try {
              data = new FormDataIn(form, by);
            } catch {
              data = new FormDataIn(form);
            }
            const query = new URLSearchParams();
            data.forEach((v, k) => query.append(k, typeof v === "string" ? v : v.name));
            const url = new URL(action);
            url.search = query.toString();
            event.preventDefault();
            replaceTo(url.href);
          });
        },
        { capture: true, signal },
      );
    }

    // A traversal the reader makes inside the demo (the browser's Back stepping
    // a frame, which only happens where pushes got through) is reported, so a
    // close knows it can no longer count its way back to the page's entry. A
    // new document says so in its navigation timing; a same-document one fires
    // a TRUSTED popstate (the bridge's own are synthetic).
    const timing = win.performance?.getEntriesByType?.("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (timing?.type === "back_forward") bridge.onTraverse();
    win.addEventListener(
      "popstate",
      (e) => {
        if (e.isTrusted) bridge.onTraverse();
      },
      { capture: true, signal },
    );

    const hist = win.history;
    const back = hist.back.bind(hist);
    const go = hist.go.bind(hist);
    const replaceState = hist.replaceState.bind(hist);
    // PUSHSTATE: a step inside one document. Spendee's GST and loan flows give
    // each step its own entry this way (the same URL, state {step: n}) and
    // walk back with history.back() and a popstate listener. Rewritten as a
    // replaceState, so the navigate event it raises arrives as a "replace" and
    // is let through, with the entry it would have covered kept on the stack.
    hist.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      const stack = stackOf();
      stack.push({ kind: "state", url: win.location.href, state: hist.state });
      try {
        replaceState(data, unused, url);
      } catch (err) {
        // pushState's own failures (a bad URL, state that cannot be cloned)
        // must still reach the caller, with nothing recorded.
        stack.pop();
        throw err;
      }
    };

    // BACK, n steps. An empty stack falls through to the real back(), which
    // pops the demo's own entry and closes it: backing out of the first screen
    // leaves the demo. It never traverses further than that, so no prototype
    // can walk the reader off the case study.
    const stepBack = (steps: number) => {
      const stack = bridge.stacks.get(frame);
      let target: FrameStep | undefined;
      for (let i = 0; i < steps && stack?.length; i++) target = stack.pop();
      if (!target) {
        back();
        return;
      }
      const sameDocument =
        target.kind === "state" &&
        target.url.split("#")[0] === win.location.href.split("#")[0];
      if (!sameDocument) {
        // A new document at that URL: always for a navigation step, and for a
        // state step whose URL is no longer this document's (the stack has
        // crossed to another page since), which then loads without its step.
        win.location.replace(target.url);
        return;
      }
      const step = target as Extract<FrameStep, { kind: "state" }>;
      // The traversal it stands in for: history.back() returns first, then the
      // entry's state and URL come back and a popstate carries the state, in a
      // later task, from the prototype's own realm so its instanceof checks
      // hold. A hashchange too when the fragment differs, as a real one does.
      win.setTimeout(() => {
        if (signal.aborted) return;
        const from = win.location.href;
        replaceState(step.state, "", step.url);
        const events = win as Window & typeof globalThis;
        win.dispatchEvent(new events.PopStateEvent("popstate", { state: hist.state }));
        if (from.split("#")[1] !== win.location.href.split("#")[1]) {
          win.dispatchEvent(
            new events.HashChangeEvent("hashchange", { oldURL: from, newURL: win.location.href }),
          );
        }
      }, 0);
    };
    hist.back = () => stepBack(1);
    hist.go = (delta?: number) => {
      if (delta !== undefined && delta < 0) stepBack(-delta);
      else go(delta);
    };
  }

  // ── Frames inside frames (Spendee runs its phone in one). Those already
  // loaded are bridged now; each later navigation arrives as the <iframe>'s
  // load event, caught in the capture phase on the DOCUMENT. Not the window:
  // an element's load event is the one event whose path stops at the
  // document (the DOM's get-the-parent rule excludes "load" from reaching the
  // Window), which is how Spendee's second phone screen first went unbridged.
  const bridgeChild = (el: EventTarget | null) => {
    if (!el || (el as Element).tagName !== "IFRAME") return;
    try {
      bridgeWindow((el as HTMLIFrameElement).contentWindow, bridge);
    } catch {
      /* a frame that refuses to be read is simply left alone */
    }
  };
  doc.querySelectorAll("iframe").forEach(bridgeChild);
  doc.addEventListener("load", (e) => bridgeChild(e.target), { capture: true, signal });
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

function Lock() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="4.4" width="6" height="4.2" rx="1" stroke="currentColor" strokeWidth="0.9" />
      <path d="M3.4 4.4V3.2a1.6 1.6 0 0 1 3.2 0v1.2" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
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

/* ── The page's one history entry ───────────────────────────────────────── */

type CloseReason = "button" | "escape" | "history" | "native";

interface DemoEntry {
  /** Written into the pushed entry's state: identifies it without the Navigation API. */
  token: string;
  /** Navigation API keys of the entry below ours (the page) and of ours. */
  openerKey: string | null;
  ownKey: string | null;
  /** Set once ✕ or Esc has asked the browser to pop the entry. */
  popping: boolean;
  /** history.length right after the push: this entry's index is one less. */
  lengthAtOpen: number;
  /** The reader traversed inside the demo, so the session may not be at the
   *  end of the joint history any more (see stepOut). */
  traversed: boolean;
}

/* Chrome keeps at most this many joint-history entries; past it the oldest go,
   and history.length stops saying how far above the page the session is. */
const MAX_HISTORY = 50;

/** ✕ and Esc WITHOUT the Navigation API. Script navigations inside the demo
 *  pushed real entries above the page's own, and closing must take all of them
 *  off without ever stepping past the page's entry. Called once the frame is
 *  gone, so stepping over a dead entry loads nothing.
 *
 *  Nothing traversed inside the demo: the session is still at the END of the
 *  joint history, so the distance to the page's entry is exact, and one
 *  history.go() lands on it. Something was traversed (or the history is at its
 *  cap): the position is unknown, so it steps one entry at a time, only while
 *  the top window is still on the demo's own entry, and stops the moment it is
 *  not. Entries above ours share our state, and the step that crosses into the
 *  page's entry is the only one that changes it and fires a popstate. */
function stepOut(entry: DemoEntry, done: () => void) {
  const own = () =>
    (window.history.state as { lpDemo?: string } | null)?.lpDemo === entry.token;
  const bound = window.history.length - entry.lengthAtOpen + 1;
  if (!own() || bound < 1) {
    done();
    return;
  }
  if (!entry.traversed && window.history.length < MAX_HISTORY) {
    const finish = () => {
      window.removeEventListener("popstate", finish);
      window.clearTimeout(timer);
      done();
    };
    window.addEventListener("popstate", finish);
    const timer = window.setTimeout(finish, 1500);
    window.history.go(-bound);
    return;
  }
  let left = bound;
  const step = () => {
    if (!own() || left-- <= 0) {
      done();
      return;
    }
    // One traversal, then wait for it: the crossing into the page's entry
    // announces itself with a popstate; an entry of the removed frame changes
    // nothing, so a timer stands in for it.
    const next = () => {
      window.removeEventListener("popstate", next);
      window.clearTimeout(timer);
      step();
    };
    window.addEventListener("popstate", next);
    const timer = window.setTimeout(next, 300);
    window.history.back();
  };
  step();
}

/** Whether the session is still sitting on the entry the launch pushed. */
function onOwnEntry(entry: DemoEntry, state: unknown): boolean {
  const nav = (window as NavWindow).navigation;
  if (nav?.currentEntry && entry.ownKey) return nav.currentEntry.key === entry.ownKey;
  return (state as { lpDemo?: string } | null)?.lpDemo === entry.token;
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
  const [open, setOpen] = useState(false);
  // Both survive a close. They are the reader's choices (which surface, which
  // viewport), not the demo's state, and the dormant chrome shows the surface
  // a relaunch will open on.
  const [tabId, setTabId] = useState(initialTab ?? tabs[0]?.id);
  const [device, setDevice] = useState<DeviceId>(devices[0] ?? "desktop");
  // Set once the reader picks a device, after which no default overrides it.
  const deviceChosenRef = useRef(false);
  // A no-API close waits here for the frame to unmount before stepping out.
  const stepOutRef = useRef<DemoEntry | null>(null);

  // The dormant well: the rect the demo window grows out of and shrinks into.
  const wellRef = useRef<HTMLDivElement>(null);
  const launchRef = useRef<HTMLButtonElement>(null);
  // Whatever was clicked to open the demo, so focus goes back to exactly it.
  // Recorded explicitly because Safari does not focus a button on click, and
  // the dialog's own restore would otherwise hand focus to <body>.
  const openerRef = useRef<HTMLElement | null>(null);
  const entryRef = useRef<DemoEntry | null>(null);
  const closeRef = useRef<((reason: CloseReason) => void) | null>(null);
  const uid = useId();

  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];

  // Back closes the demo: any traversal that leaves the entry the launch pushed.
  // Lives as long as the component rather than the window, because the pop that
  // ✕ and Esc trigger lands after the window has already gone.
  //
  // The App Router hears the same popstate and there is no keeping it out: a
  // listener on `window` fires in registration order even in the capture
  // phase (measured, in Chrome), and the router registers first. It does not
  // need keeping out. Landing on the page's own entry, it restores the tree
  // that entry stashed, which is the tree already on screen: a soft render
  // with no fetch, no scroll and no remount (all asserted by the overlay QA).
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const entry = entryRef.current;
      if (!entry || onOwnEntry(entry, e.state)) return;
      entryRef.current = null;
      closeRef.current?.("history");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const launch = useCallback(
    (opener: HTMLElement, id?: string) => {
      // A pop from the last close still in flight would land on the NEW entry
      // and close the window it just opened; it resolves in milliseconds.
      if (open || entryRef.current?.popping) return;
      if (id) setTabId(id);
      // A portrait tablet opens on Tablet where the study offers it: Desktop
      // there is 1280px scaled to about 0.6, and the app's text lands at 7-8px.
      if (
        !deviceChosenRef.current &&
        devices.includes("tablet") &&
        window.matchMedia(TABLET_WINDOW).matches
      ) {
        setDevice("tablet");
      }
      openerRef.current = opener;
      const nav = (window as NavWindow).navigation;
      const entry: DemoEntry = {
        token: `lp:${uid}:${Date.now().toString(36)}`,
        openerKey: nav?.currentEntry?.key ?? null,
        ownKey: null,
        popping: false,
        lengthAtOpen: 0,
        traversed: false,
      };
      // The App Router reloads the page on a popstate whose state is an object
      // without its `__NA` marker. Its patched pushState copies the marker in
      // from the current entry, which has one unless the reader arrived on it
      // by a native #fragment jump (the layout's skip link does exactly that),
      // leaving state null. Pushed bare from there, a Forward back onto this
      // entry after closing would reload the case study. Carrying the marker
      // turns that into the router's soft restore of the tree on screen.
      const state: Record<string, unknown> = { lpDemo: entry.token };
      const current: unknown = window.history.state;
      if (!current || typeof current !== "object" || !("__NA" in current)) {
        state.__NA = true;
      }
      try {
        // No URL: the address stays the case study's, and the App Router's
        // patched pushState only copies its own state in rather than routing.
        window.history.pushState(state, "");
        entry.ownKey = nav?.currentEntry?.key ?? null;
        entry.lengthAtOpen = window.history.length;
        entryRef.current = entry;
      } catch {
        entryRef.current = null;
      }
      setOpen(true);
    },
    [devices, open, uid],
  );

  // ✕ and Esc: take the entry back off the stack, so Back afterwards leaves the
  // page as the reader expects instead of spending a press on a dead entry.
  // traverseTo(opener) rather than back(): if any demo navigation slipped into
  // the joint history anyway, one traversal still pops past all of it.
  const popEntry = useCallback(() => {
    const entry = entryRef.current;
    if (!entry || entry.popping) return;
    if (!onOwnEntry(entry, window.history.state)) {
      entryRef.current = null;
      return;
    }
    entry.popping = true;
    const nav = (window as NavWindow).navigation;
    if (nav && entry.openerKey && nav.entries().some((e) => e.key === entry.openerKey)) {
      window.setTimeout(() => {
        if (entryRef.current === entry) entryRef.current = null;
      }, 1500);
      try {
        const r = nav.traverseTo(entry.openerKey);
        r.committed.catch(noop);
        r.finished.catch(noop);
        return;
      } catch {
        /* fall through to the classic API */
      }
    }
    // Without the Navigation API: step out once the frame has unmounted.
    stepOutRef.current = entry;
  }, []);

  useEffect(() => {
    if (open) return;
    const entry = stepOutRef.current;
    if (!entry) return;
    stepOutRef.current = null;
    stepOut(entry, () => {
      if (entryRef.current === entry) entryRef.current = null;
    });
  }, [open]);

  const chooseDevice = useCallback((id: DeviceId) => {
    deviceChosenRef.current = true;
    setDevice(id);
  }, []);
  const onTraverse = useCallback(() => {
    if (entryRef.current) entryRef.current.traversed = true;
  }, []);

  const registerClose = useCallback((fn: ((reason: CloseReason) => void) | null) => {
    closeRef.current = fn;
  }, []);
  const onClosed = useCallback(() => setOpen(false), []);

  if (!tab) return null;

  return (
    <figure className={cn("lp-root not-prose my-space-8", className)}>
      {/* No `data-lenis-prevent` here, deliberately: Lenis tests it by walking
          event.composedPath() in the HOST document, and a wheel event dispatched
          inside an iframe never appears there. The frame is capped at ~78vh so
          there's always page above and below to scroll on. */}
      <div className="browser-stage">
        <div
          className="lp-slab"
          style={
            {
              // Pure CSS geometry: the frame is the poster's shape and shrinks
              // to whichever of the column, 78vh, or maxHeight binds first, so
              // the box is correct on the server with no measurement and no CLS.
              // It no longer tracks the device: the switcher lives in the demo
              // window, where it changes a real viewport, not a screenshot.
              "--lp-ratio": String(desktopAspect),
              "--lp-maxh": `${maxHeight}px`,
            } as React.CSSProperties
          }
        >
          {/* ── Chrome, row 1: window dots · surfaces · open in a tab ────── */}
          <div className="flex h-[34px] items-center gap-space-3 rounded-t-[7px] border-b border-line bg-bezel px-space-3">
            <span aria-hidden="true" className="flex shrink-0 items-center gap-[6px]">
              <span className="h-[10px] w-[10px] rounded-full bg-accent" />
              <span className="h-[10px] w-[10px] rounded-full bg-white/15" />
              <span className="h-[10px] w-[10px] rounded-full bg-white/15" />
            </span>

            {/* Launchers dressed as the window's tabs. Not role="tab": in the
                page there is no panel for them to control, and a "tab" that
                opens a dialog would announce the wrong thing. They are buttons
                that open the demo on their surface; the real tablist, with its
                tabpanel, lives in the demo window. */}
            <div
              role="group"
              aria-label={`${title}: open the live demo on a surface`}
              // overflow-x-clip, not overflow-hidden: the strip still clips a label
              // row too long for it, but no longer clips the buttons' vertical
              // hit areas below.
              className="flex min-w-0 flex-1 items-center gap-[3px] overflow-x-clip"
            >
              {tabs.map((t) => {
                const current = t.id === tab.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-haspopup="dialog"
                    aria-current={current ? "true" : undefined}
                    onClick={(e) => launch(e.currentTarget, t.id)}
                    // ::before overhangs the 25px chip to a 44px-tall hit area,
                    // the Open link's idiom: inset-x-0 keeps it off its
                    // neighbours, and above and below is chrome with nothing to
                    // click. Truncation moved onto the labels, because a button
                    // that clips its overflow would clip its own ::before too.
                    className={cn(
                      "relative min-w-0 shrink rounded-full border px-[5px] py-[3px] font-mono text-[0.6875rem] uppercase tracking-[0.04em] transition-colors duration-fast ease-out-quad before:absolute before:inset-x-0 before:-inset-y-[11px] before:content-[''] sm:px-space-2 sm:tracking-[0.1em]",
                      current
                        ? "border-line bg-white/[0.07] text-fg"
                        : "border-transparent text-muted hover:text-fg",
                    )}
                  >
                    {/* Short labels on a phone, where four full ones used to
                        truncate to "P…"; the hidden one is out of the name. */}
                    <span className="block truncate sm:hidden">{t.shortLabel ?? t.label}</span>
                    <span className="hidden truncate sm:block">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop only: a raw tab is a tool for people with room for two. */}
            <a
              href={tab.src}
              target="_blank"
              rel="noopener noreferrer"
              // ::before overhangs the 22px chip to a 44px-tall hit area; the
              // strip it covers above and below holds nothing clickable.
              className="btn-chip relative hidden h-[22px] shrink-0 items-center justify-center rounded-full px-space-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] before:absolute before:inset-x-0 before:-inset-y-[11px] before:content-[''] lg:inline-flex"
            >
              Open <span aria-hidden="true">&nbsp;↗</span>
              <span className="sr-only"> {tab.label} in a new tab</span>
            </a>
          </div>

          {/* ── Chrome, row 2: address pill + honesty badge ───────────────── */}
          <div className="flex h-[30px] items-center gap-space-3 border-b border-line bg-bezel px-space-3">
            <span className="inline-flex min-w-0 flex-1 items-center gap-space-2 rounded-full border border-line bg-white/[0.04] px-space-3 py-[2px] font-mono text-caption text-muted">
              <Lock />
              <span className="truncate">{tab.domain}</span>
            </span>
            <span className="hidden shrink-0 items-center gap-[5px] font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted sm:inline-flex">
              <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-white/30" />
              Prototype
            </span>
          </div>

          {/* ── Screen: the poster, and the control that launches it ─────── */}
          <div ref={wellRef} className="lp-well">
            {/* The poster: the LCP image on the hero, never opacity-gated. */}
            <div className="pointer-events-none absolute inset-0 z-[1]">
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
            {/* Launch scrim: dims the still just enough that the control is
                unmistakably the primary action. It stays put while the demo
                runs, so closing the window shrinks it back onto the same
                picture it grew out of. */}
            <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-space-4 bg-gradient-to-b from-black/55 via-black/70 to-black/80 px-space-5 text-center">
              {/* The primary: the nav's flame cap in this study's own colour,
                  with a slow ping so the dormant frame reads as armed. */}
              <Button
                ref={launchRef}
                type="button"
                aria-haspopup="dialog"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => launch(e.currentTarget)}
                variant="primary"
                arrow="right"
                className="lp-launch"
              >
                <span aria-hidden="true" className="btn-ping" />
                Launch the live demo
              </Button>
              <p className="max-w-[48ch] font-mono text-caption text-white/70">
                {/* Only the invariants are hardcoded: they hold for every
                    prototype study. What happens on open is a claim about ONE
                    artefact, so it comes from that project's frontmatter
                    (`prototype.launchNote`). */}
                <span className="hidden sm:inline">
                  The real prototype, not a recording.{" "}
                  {launchNote ? `${launchNote} ` : ""}Runs entirely in your
                  browser.
                </span>
                {/* A phone gets the demo too now, so this no longer apologises
                    for the screen. It says the one thing a phone reader most
                    needs before tapping: this is not a trip away from the page. */}
                <span className="sm:hidden">
                  The real prototype, not a recording. It opens over this page,
                  and closing it brings you straight back here.
                </span>
              </p>
            </div>
            {/* Glass sheen: shared with PhoneFrame / BrowserMockup. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            />
          </div>
        </div>
      </div>

      {open && (
        <DemoWindow
          uid={uid}
          title={title}
          tabs={tabs}
          tab={tab}
          onSelectTab={setTabId}
          devices={devices}
          device={device}
          onDevice={chooseDevice}
          poster={poster}
          posterAspect={desktopAspect}
          originRef={wellRef}
          openerRef={openerRef}
          fallbackFocusRef={launchRef}
          onPopEntry={popEntry}
          onTraverse={onTraverse}
          registerClose={registerClose}
          onClosed={onClosed}
        />
      )}

      {hint && (
        <figcaption className="mx-auto mt-space-4 max-w-[62ch] text-center font-mono text-caption uppercase tracking-[0.12em] text-muted">
          {hint}
        </figcaption>
      )}
    </figure>
  );
}

/* ── The demo window ─────────────────────────────────────────────────────── */

interface DemoWindowProps {
  uid: string;
  title: string;
  tabs: PrototypeTab[];
  tab: PrototypeTab;
  onSelectTab: (id: string) => void;
  devices: DeviceId[];
  device: DeviceId;
  onDevice: (id: DeviceId) => void;
  poster: string;
  posterAspect: number;
  originRef: React.RefObject<HTMLDivElement | null>;
  openerRef: React.RefObject<HTMLElement | null>;
  fallbackFocusRef: React.RefObject<HTMLButtonElement | null>;
  onPopEntry: () => void;
  onTraverse: () => void;
  registerClose: (fn: ((reason: CloseReason) => void) | null) => void;
  onClosed: () => void;
}

/** Where the window starts (open) and ends (close): the dormant well's rect,
 *  expressed as a transform + clip on the full-window panel. Uniformly scaled
 *  so nothing inside is squashed, positioned so the bar lands on the frame's
 *  chrome rows and the stage on its well, then clipped to the well's height
 *  where the window is taller than the frame (every portrait phone). */
interface FrameRect {
  x: number;
  y: number;
  scale: number;
  /** Clip: px cut from the panel's bottom, and corner radius, both pre-scale. */
  cut: number;
  radius: number;
}
function frameRect(
  origin: HTMLElement | null,
  panel: HTMLElement,
  bar: HTMLElement | null,
): FrameRect | null {
  const o = origin?.getBoundingClientRect();
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  if (!o || !o.width || !o.height || !w || !h) return null;
  const scale = o.width / w;
  const barH = bar?.offsetHeight ?? 0;
  return {
    x: o.left,
    y: o.top - barH * scale,
    scale,
    cut: Math.max(0, h - (barH + o.height / scale)),
    // The slab's 12px radius, in the panel's pre-scale pixels.
    radius: 12 / scale,
  };
}

/* The clip is tweened as two numbers and written out by hand. Handed to GSAP
   as a clip-path string it came back wrong: the browser normalises
   `inset(0px 0px 0px 0px round 12px)` to `inset(0px round 12px)`, GSAP then
   pairs the numbers by position, and the corner radius was animated as a
   right-hand inset. Measured, frame by frame, before this existed. */
const writeClip = (panel: HTMLElement, cut: number, radius: number) => {
  panel.style.clipPath = `inset(0px 0px ${cut}px 0px round ${radius}px)`;
};

function DemoWindow({
  uid,
  title,
  tabs,
  tab,
  onSelectTab,
  devices,
  device,
  onDevice,
  poster,
  posterAspect,
  originRef,
  openerRef,
  fallbackFocusRef,
  onPopEntry,
  onTraverse,
  registerClose,
  onClosed,
}: DemoWindowProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);
  const closingRef = useRef(false);
  const unlockRef = useRef<(() => void) | null>(null);
  const bridgeRef = useRef<Bridge | null>(null);
  const requestCloseRef = useRef<((reason: CloseReason) => void) | null>(null);
  const popOnFinishRef = useRef(false);
  // performance.now() at which the grow-in lands: the wipe waits for it.
  const landsAtRef = useRef(0);
  // The clip, as numbers, shared by the grow and the shrink: a close that
  // interrupts a grow reverses from wherever the clip had got to.
  const clipRef = useRef({ cut: 0, radius: 0 });

  // Bumped by Restart; keying the iframe on it forces a remount.
  const [reloadKey, setReloadKey] = useState(0);
  // Ignition state. `ready` flips at the first of the frame's DOMContentLoaded,
  // its load event, or BOOT_CAP_MS after it was created, and the boot layer
  // holds above the panel until then; `posterGone` unmounts the layer once it
  // has lifted. Not the load event alone: that waits on every webfont and
  // image, and a stalled font kept an opaque-looking layer up for 21s over an
  // app that was already taking taps. Neither resets inside a session: a
  // surface switch or restart keeps the running app in view and only
  // re-flutters the address. A new session is a new mount, so a relaunch
  // boots from scratch.
  const [ready, setReady] = useState(false);
  const [posterGone, setPosterGone] = useState(false);
  // focusFrame() runs on the session's first load only: that one follows the
  // reader's Launch. A surface switch or Restart from the keyboard must leave
  // focus on the control that was pressed, not throw it into the app.
  const focusedOnceRef = useRef(false);
  // The iframe is created only once the window has LANDED. A same-origin
  // prototype parses and boots on this page's main thread, and measured in
  // Chrome that is a 150ms+ task: started with the grow-in, it landed in the
  // middle of it and the window jumped from half-grown to open. The poster
  // covers the wait, which is what it is for. Reduced motion has no grow to
  // protect, so the frame is armed from the first render.
  const [armed, setArmed] = useState(prefersReducedMotion);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [fsActive, setFsActive] = useState(false);

  const reduced = useReducedMotion();
  const lenis = useLenis();
  const canFullscreen = useSyncExternalStore(NO_SUBSCRIBE, fullscreenSupported, () => false);
  // Layout facts, all about the WINDOW. A phone-width window is the phone.
  // A landscape phone is wide but short, so it keeps one row and loses the
  // device switcher (a scaled Tablet in 330px of height is a thumbnail).
  const narrow = useMedia("(max-width: 639px)");
  const belowLg = useMedia("(max-width: 1023px)");
  const xl = useMedia("(min-width: 1280px)");
  const xxl = useMedia("(min-width: 1536px)");
  const shortLand = useMedia("(max-height: 520px) and (orientation: landscape)");
  // A touch screen under the app stages' 880px breakpoint is a phone (or a
  // phone-sized tablet in portrait): the prototypes draw their full-bleed app
  // there, so the demo must open as that app, not as a scaled desktop stage.
  const touchSmall = useMedia("(pointer: coarse) and (max-width: 879px)");
  const finePointer = useMedia("(pointer: fine)");
  const twoRow = belowLg && !shortLand;
  const fullLabels = !narrow && (twoRow || xl);
  const showDevices = devices.length > 1 && !narrow && !shortLand;

  // ── Geometry. Three regimes, each filling what it is given:
  //  - a phone-width window, or a short landscape one, IS the phone: the frame
  //    fills the stage at native CSS px and there is nothing to choose;
  //  - Desktop fills the stage too: at native px once the window is at least
  //    DESKTOP_MIN_W wide, and below that laid out at DESKTOP_MIN_W with its
  //    height matched to the stage, then scaled to fill it exactly (no
  //    letterbox), so the prototype always lays out as a desktop;
  //  - Tablet and Phone lay out at the real device viewport and scale to fit,
  //    never up: a phone blown up past its own size stops being a phone.
  // Centring is done in pixels rather than with a translate(-50%) because
  // percentage translates resolve against the element's UNSCALED box, which is
  // wrong by a factor of `scale`.
  const phoneWindow = narrow || shortLand || touchSmall;
  const measured = stage.w > 0 && stage.h > 0;
  const simulated = !phoneWindow && device !== "desktop" ? DEVICE_SIZE[device] : null;
  const desktopScaled = !phoneWindow && !simulated && measured && stage.w < DESKTOP_MIN_W;
  const scale = simulated
    ? measured
      ? Math.min(1, stage.w / simulated.w, stage.h / simulated.h)
      : 1
    : desktopScaled
      ? stage.w / DESKTOP_MIN_W
      : 1;
  // The layout viewport the prototype sees; null = the stage itself.
  const layout = simulated
    ? simulated
    : desktopScaled
      ? { w: DESKTOP_MIN_W, h: stage.h / scale }
      : null;
  const boxW = simulated ? simulated.w * scale : stage.w;
  const boxH = simulated ? simulated.h * scale : stage.h;
  const boxStyle: React.CSSProperties = simulated
    ? {
        left: Math.max(0, (stage.w - boxW) / 2),
        top: Math.max(0, (stage.h - boxH) / 2),
        width: boxW,
        height: boxH,
      }
    : { inset: 0 };
  // The viewport the prototype is laying out at, for the readout.
  const viewport = layout
    ? `${layout.w} × ${Math.round(layout.h)}`
    : `${Math.round(stage.w)} × ${Math.round(stage.h)}`;
  // The poster is a desktop capture. It covers a box close to its own shape
  // (a desktop-ish window) and is letterboxed into anything else, so a portrait
  // phone shows the whole picture rather than a random slice of its middle.
  const boxRatio = boxW > 0 && boxH > 0 ? boxW / boxH : posterAspect;
  const posterCovers = Math.abs(boxRatio - posterAspect) / posterAspect < 0.12;

  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const panelId = `${uid}-panel`;
  const tabDomId = (id: string) => `${uid}-surface-${id}`;

  // ── Open: into the top layer, keys to the window. The dialog is never
  // closed from a cleanup: StrictMode's rehearsal unmount would close and
  // reopen it, and a real unmount removes it from the top layer anyway.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute("open", "");
      }
    }
    // Keys go to the window first; once the prototype loads, focusFrame()
    // hands them on into the app (see onFrameLoad).
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  // ── Scroll lock. Lenis is stopped (its wheel handler would otherwise scroll
  // the page behind the window) and the html class holds the page under
  // reduced motion, where there is no Lenis. The position is recorded here and
  // re-asserted on release, which runs from finalize() before the window
  // unmounts, so no frame is ever painted at a different scroll position.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const y = window.scrollY;
    lenis?.stop();
    html.classList.add("lp-scroll-lock");
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      html.classList.remove("lp-scroll-lock");
      lenis?.start();
      if (Math.abs(window.scrollY - y) > 0.5) {
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      }
    };
    unlockRef.current = release;
    return release;
  }, [lenis]);

  // ── The bridge into the running prototype, one per session. Created in an
  // effect (not render) so StrictMode's rehearsal gets its own and aborts it.
  useEffect(() => {
    const ac = new AbortController();
    bridgeRef.current = {
      signal: ac.signal,
      stacks: new WeakMap(),
      seen: new WeakSet(),
      onEscape: () => requestCloseRef.current?.("escape"),
      onTraverse,
    };
    return () => {
      ac.abort();
      bridgeRef.current = null;
    };
  }, [onTraverse]);

  // The stage's box, for the device scale. Observed from mount, so the number
  // is settled before the grow-in lands.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      setStage({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // DOMContentLoaded is not an event a parent can hear on a frame, but the
  // frame is same-origin, so its document's readyState can be read; the
  // initial about:blank is skipped. The cap starts when the frame is created.
  useEffect(() => {
    if (!armed || ready) return;
    const started = performance.now();
    const poll = window.setInterval(() => {
      let doc: Document | null = null;
      try {
        doc = frameRef.current?.contentDocument ?? null;
      } catch {
        /* unreadable: the load event and the cap still apply */
      }
      const interactive = !!doc && doc.URL !== "about:blank" && doc.readyState !== "loading";
      if (interactive || performance.now() - started > BOOT_CAP_MS) setReady(true);
    }, 50);
    return () => window.clearInterval(poll);
  }, [armed, ready]);

  // Tracked rather than inferred, so the toggle can say which way it goes and
  // stays right when the reader leaves full screen by a route this component
  // never sees (Esc, F11, the browser's own chrome).
  useEffect(() => {
    const sync = () => setFsActive(fullscreenElement() === panelRef.current);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  // ── Grow-in: the window comes out of the frame that was clicked. The start
  // state is painted NOW, but the clock starts on the first frame after this
  // task: the click's own work (the dialog, the page going inert, the lock's
  // restyle) is a long task, and a tween timed from inside it would spend its
  // opening beat before a single frame was drawn, which reads as a pop.
  // Opacity runs on the short UI clock so the window is solid well before it
  // lands.
  useGSAP((_context, contextSafe) => {
    const panel = panelRef.current;
    const veil = veilRef.current;
    if (!panel || !veil || !contextSafe || prefersReducedMotion()) {
      // No grow to protect: the frame must never be left waiting to arm.
      setArmed(true);
      return;
    }
    registerGsap();
    const from = frameRect(originRef.current, panel, barRef.current);
    gsap.set(veil, { opacity: 0 });
    gsap.set(panel, { opacity: 0 });
    if (from) {
      gsap.set(panel, { x: from.x, y: from.y, scale: from.scale, transformOrigin: "0 0" });
      writeClip(panel, from.cut, from.radius);
    }
    const land = () => setArmed(true);
    const start = contextSafe(() => {
      landsAtRef.current = performance.now() + durations.base * 1000;
      gsap.to(veil, { opacity: 1, duration: durations.base, ease: gsapEase.outQuad });
      gsap.to(panel, {
        opacity: 1,
        duration: durations.fast,
        ease: gsapEase.outQuad,
        clearProps: "opacity",
        onComplete: from ? undefined : land,
      });
      if (from) {
        const clip = clipRef.current;
        clip.cut = from.cut;
        clip.radius = from.radius;
        gsap.to(clip, {
          cut: 0,
          radius: 0,
          duration: durations.base,
          ease: gsapEase.outExpo,
          onUpdate: () => writeClip(panel, clip.cut, clip.radius),
        });
        gsap.to(panel, {
          x: 0,
          y: 0,
          scale: 1,
          duration: durations.base,
          ease: gsapEase.outExpo,
          // Nothing interactive is ever left hit-testing through a transform,
          // or cut by a clip that has finished its job.
          clearProps: "transform",
          onComplete: () => {
            panel.style.clipPath = "";
            land();
          },
        });
      }
    });
    const raf = requestAnimationFrame(start);
    return () => cancelAnimationFrame(raf);
  }, []);

  const focusFrame = useCallback(() => {
    // The frame only ever mounts from a click, so directing keys into it is the
    // expected outcome (same contract as opening a dialog), and it's what makes
    // Meridian's ⌘K palette work on the first try. The apps install no global
    // focus trap, so Tab and Shift+Tab step back out to this window's bar.
    try {
      frameRef.current?.contentWindow?.focus();
    } catch {
      /* focus is a nicety, never a failure mode */
    }
  }, []);

  // ── Close. Every exit converges here; only the history pop differs, since
  // Back has already popped the entry by the time it arrives.
  const finalize = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    // preventScroll: the opener is where the reader left it, and a focus()
    // that scrolled it into view would be exactly the jump this must avoid.
    const opener = openerRef.current;
    const target = opener?.isConnected ? opener : fallbackFocusRef.current;
    target?.focus({ preventScroll: true });
    unlockRef.current?.();
    if (popOnFinishRef.current) onPopEntry();
    onClosed();
  }, [fallbackFocusRef, onClosed, onPopEntry, openerRef]);

  const requestClose = useCallback(
    (reason: CloseReason) => {
      if (closingRef.current) return;
      closingRef.current = true;
      bridgeRef.current = null;
      const panel = panelRef.current;
      const veil = veilRef.current;
      if (panel) panel.dataset.state = "closing";
      // Back has already popped the entry; every other exit pops it in
      // finalize(), after the shrink. Popping is a traversal, and the App
      // Router answers every traversal with a (harmless, same-tree) restore
      // render: started here, that render ate the shrink's first frames.
      popOnFinishRef.current = reason !== "history";
      // Leaving full screen resizes everything the shrink would measure, so
      // there is no shrink; and finalize() waits for the browser to report the
      // exit, because focus handed to the opener while the panel still owned
      // the display was lost when full screen let go (measured: focus ended on
      // <body>). A timeout covers an engine that never reports it.
      if (fullscreenElement()) {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          document.removeEventListener("fullscreenchange", finish);
          document.removeEventListener("webkitfullscreenchange", finish);
          finalize();
        };
        document.addEventListener("fullscreenchange", finish);
        document.addEventListener("webkitfullscreenchange", finish);
        window.setTimeout(finish, 800);
        exitFullscreen();
        return;
      }
      // "native": the dialog is already closed, so there is nothing to shrink.
      if (reason === "native" || !panel || !veil || prefersReducedMotion()) {
        finalize();
        return;
      }
      // Shrink back into the frame, faster than the grow (exit-faster-than-
      // enter). A grow still in flight is killed first: closing interrupts.
      const clip = clipRef.current;
      gsap.killTweensOf([panel, veil, clip]);
      const to = frameRect(originRef.current, panel, barRef.current);
      const d = durations.fast;
      gsap.to(veil, { opacity: 0, duration: d, ease: gsapEase.outQuad });
      if (to) {
        gsap.to(clip, {
          cut: to.cut,
          radius: to.radius,
          duration: d,
          ease: gsapEase.outQuad,
          onUpdate: () => writeClip(panel, clip.cut, clip.radius),
        });
        gsap.to(panel, {
          x: to.x,
          y: to.y,
          scale: to.scale,
          transformOrigin: "0 0",
          duration: d,
          ease: gsapEase.outQuad,
        });
      }
      gsap.to(panel, { opacity: 0, duration: d, ease: gsapEase.outQuad, onComplete: finalize });
    },
    [finalize, originRef],
  );

  useEffect(() => {
    requestCloseRef.current = requestClose;
    registerClose(requestClose);
    return () => registerClose(null);
  }, [registerClose, requestClose]);

  // ── Ignition, on the ready rising edge, never before the window has landed.
  // Where the poster matches the stage, a scanline sweeps the device while the
  // poster is clipped away above it, so the screenshot becomes the running app
  // top to bottom (and, since a clip also clips hit-testing, each band of the
  // app takes taps as it is uncovered). Where it does not match, the loading
  // card simply fades. Either way the layer unmounts at the end and the
  // address's status dot lights on that beat. Reduced motion lifts it at once.
  useGSAP(
    () => {
      if (!ready || posterGone) return;
      registerGsap();
      const posterEl = posterRef.current;
      const scan = scanRef.current;
      if (!posterEl || !scan || prefersReducedMotion()) {
        setPosterGone(true);
        return;
      }
      const wait = Math.max(0, (landsAtRef.current - performance.now()) / 1000);
      if (posterEl.dataset.fit !== "cover") {
        gsap.to(posterEl, {
          opacity: 0,
          delay: wait,
          duration: durations.base,
          ease: gsapEase.outQuad,
          onStart: () => {
            posterEl.style.pointerEvents = "none";
          },
          onComplete: () => setPosterGone(true),
        });
        return;
      }
      const tl = gsap.timeline({ delay: wait });
      tl.set(scan, { opacity: 1, immediateRender: false });
      tl.fromTo(
        posterEl,
        { clipPath: "inset(0% 0 0 0)" },
        { clipPath: "inset(100% 0 0 0)", duration: durations.slower, ease: gsapEase.inOutQuart },
        0,
      );
      // Function-valued so the travel is read when the sweep starts, by which
      // point the device box has its final height.
      tl.to(
        scan,
        {
          y: () => posterEl.clientHeight - 2,
          duration: durations.slower,
          ease: gsapEase.inOutQuart,
        },
        0,
      );
      tl.call(() => setPosterGone(true));
      tl.to(scan, { opacity: 0, duration: durations.fast, ease: gsapEase.outQuad });
    },
    { dependencies: [ready, posterGone, reduced] },
  );

  const onFrameLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    setReady(true);
    if (!focusedOnceRef.current) {
      focusedOnceRef.current = true;
      focusFrame();
    }
    // Every document the frame loads is bridged: Keel's and CareBridge's
    // pages are separate documents, and each needs its own listeners.
    const bridge = bridgeRef.current;
    if (bridge) bridgeWindow(e.currentTarget.contentWindow, bridge);
  };

  const toggleFullscreen = () => {
    const el = panelRef.current as FsElement | null;
    if (!el) return;
    if (fullscreenElement()) {
      exitFullscreen();
      return;
    }
    // Must stay inside the click's user gesture: called synchronously from
    // the handler, never after an await. A refusal just leaves the window
    // as it was, which is already the whole browser window.
    const req = el.requestFullscreen ?? el.webkitRequestFullscreen;
    try {
      void req?.call(el)?.catch?.(noop);
    } catch {
      /* some engines throw synchronously instead of rejecting */
    }
  };

  // ── The bar ───────────────────────────────────────────────────────────────
  // Every control is a 44px target. Visible text wherever there is room for
  // it; icon-only controls carry their name in sr-only text, and a tooltip.
  // All of them are capsules cut from the nav's glass (./button.css): Close is
  // a glass bead, the contact drawer's close key; the quiet actions are ghosts
  // whose lens condenses under the pointer or the focus; the device switcher's
  // current viewport keeps its lens.
  const ctl =
    "inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-space-2 rounded-full font-mono text-[0.75rem] uppercase tracking-[0.12em]";
  const quiet = "btn btn--ghost";
  // Labelled at 640px and up, landscape phones included (there is room);
  // icon-only below that, as a 44px target with its name in sr-only text.
  const closeLabel = !narrow;

  const closeButton = (
    <button
      ref={closeBtnRef}
      type="button"
      // Named explicitly: Chrome carries text-transform into a computed name,
      // so the uppercase label would be announced as "CLOSE".
      aria-label="Close the demo"
      onClick={() => requestClose("button")}
      className={cn(ctl, "btn-bead", closeLabel ? "px-3.5" : "w-11")}
    >
      <CloseIcon />
      <span aria-hidden="true" className={closeLabel ? undefined : "sr-only"}>
        Close
      </span>
      {finePointer && !belowLg && (
        <kbd
          aria-hidden="true"
          className="rounded-[4px] border border-line px-[5px] py-[1px] font-mono text-[0.625rem] leading-none tracking-[0.08em] text-muted"
        >
          Esc
        </kbd>
      )}
    </button>
  );

  const titleBlock = (
    <div className={cn("min-w-0", twoRow ? "flex-1" : "max-w-[20rem] shrink")}>
      <h2
        id={titleId}
        className="truncate font-display text-[0.9375rem] font-semibold leading-tight tracking-[-0.01em] text-fg"
      >
        {title}
      </h2>
      <p className="mt-[3px] flex min-w-0 items-center gap-[6px] font-mono text-[0.75rem] leading-none text-muted">
        {/* The honesty badge, folded into the address: dim while the poster
            still covers the app, lit once the app is what the reader sees. */}
        <span
          aria-hidden="true"
          className={cn(
            "h-[6px] w-[6px] shrink-0 rounded-full",
            posterGone ? "bg-accent motion-safe:animate-status-pulse" : "bg-white/30",
          )}
        />
        <Lock />
        {/* The loading indicator: flutters the domain while the document
            beneath the poster parses. Keyed with the iframe, so a surface
            switch or restart re-flutters to the new document. */}
        <span className="min-w-0 truncate">
          <FlapText
            key={`${tab.id}-${reloadKey}`}
            text={tab.domain}
            trigger="load"
            flips={2}
            colorMode="accent"
          />
        </span>
        {xxl && (
          <span className="ml-space-2 shrink-0 text-[0.625rem] uppercase tracking-[0.14em]">
            {posterGone ? "Running locally" : "Prototype"}
          </span>
        )}
      </p>
    </div>
  );

  // The ARIA tabs pattern with MANUAL activation: one tab stop (the selected
  // tab), arrows and Home/End move focus along the strip, Enter or Space
  // opens the surface. Automatic activation would load a document per key.
  const onTabKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const list = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    const at = list.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    const n = list.length;
    const to =
      e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (at + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
    list[to]?.focus();
  };

  const tablist = (
    <div
      role="tablist"
      aria-label={`${title}, prototype surfaces`}
      onKeyDown={onTabKeys}
      className={cn("flex items-center gap-[2px]", twoRow ? "w-full" : "shrink-0")}
    >
      {tabs.map((t) => {
        const selected = t.id === tab.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={tabDomId(t.id)}
            aria-selected={selected}
            // The panel exists for the window's whole life, so aria-controls
            // always points at a real id (a dangling one is an axe violation,
            // aria-valid-attr-value).
            aria-controls={panelId}
            aria-label={t.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelectTab(t.id)}
            className={cn(
              "lp-tab inline-flex h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-full font-mono text-[0.75rem] uppercase tracking-[0.1em] transition-colors duration-fast ease-out-quad",
              // A phone shares the row out equally; there is no cn merge here,
              // so the two paddings are exclusive rather than overridden.
              narrow ? "flex-1 px-space-1" : "px-space-3",
              !selected && "text-muted hover:text-fg",
            )}
          >
            {fullLabels ? t.label : (t.shortLabel ?? t.label)}
          </button>
        );
      })}
    </div>
  );

  const actions = (
    <div className={cn("flex shrink-0 items-center gap-space-1", !twoRow && "ml-auto")}>
      {showDevices && (
        <span
          role="group"
          aria-label="Demo viewport size"
          className="mr-space-1 inline-flex items-center rounded-full shadow-[inset_0_0_0_1px_var(--line)]"
        >
          {devices.map((id) => {
            const active = id === device;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onDevice(id)}
                aria-pressed={active}
                // Sentence case, set explicitly: the visible label is CSS
                // uppercase, and Chrome carries that into a computed name.
                aria-label={
                  id === "desktop"
                    ? "Desktop, fills the window"
                    : `${DEVICE_LABEL[id]}, ${DEVICE_SIZE[id].w} pixels wide`
                }
                className="btn btn--ghost h-11 rounded-full px-3.5 font-mono text-[0.75rem] uppercase tracking-[0.1em]"
              >
                {DEVICE_LABEL[id]}
              </button>
            );
          })}
        </span>
      )}
      {showDevices && xxl && (
        <span aria-hidden="true" className="mr-space-2 font-mono text-caption tabular-nums text-muted">
          {viewport}
        </span>
      )}
      <button
        type="button"
        onClick={() => setReloadKey((n) => n + 1)}
        aria-label="Restart the demo"
        className={cn(ctl, quiet, xl && !twoRow ? "px-3.5" : "w-11")}
        title={xl && !twoRow ? undefined : "Restart the demo"}
      >
        <ReloadIcon />
        <span aria-hidden="true" className={xl && !twoRow ? undefined : "sr-only"}>
          Restart
        </span>
      </button>
      {canFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fsActive ? "Exit full screen" : "Full screen"}
          className={cn(ctl, quiet, xxl && !twoRow ? "px-3.5" : "w-11")}
          title={xxl && !twoRow ? undefined : fsActive ? "Exit full screen" : "Full screen"}
        >
          {fsActive ? <CollapseIcon /> : <ExpandIcon />}
          <span className={xxl && !twoRow ? undefined : "sr-only"}>
            {fsActive ? "Exit full screen" : "Full screen"}
          </span>
        </button>
      )}
      {/* Desktop only. Safe to keep: the raw pages carry their own way back. */}
      {!belowLg && !shortLand && (
        <a
          href={tab.src}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${tab.label} in a new tab`}
          // The screen the reader is on, not the surface's first one: the
          // frame is same-origin, so its location is read as the tab opens.
          onClick={(e) => {
            try {
              const here = frameRef.current?.contentWindow?.location.href;
              if (here && here !== "about:blank") e.currentTarget.href = here;
            } catch {
              /* unreadable: the surface's own address stands */
            }
          }}
          className={cn(ctl, quiet, "px-3.5")}
        >
          Open <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      className="lp-dialog"
      // NATIVE: on a phone the demo opens as the app itself, edge to edge,
      // with no window chrome (no title bar, address line, tabs or loading
      // card): only a small floating close handle, plus the phone's own Back.
      data-native={phoneWindow ? "" : undefined}
      // A literal name: labelled by the heading plus an sr-only suffix, it was
      // computed as "Meridian , live demo", space before the comma.
      aria-label={`${title}, live demo`}
      aria-describedby={descId}
      // Esc with focus on the bar, taken on keydown. Chrome's close-watcher
      // rules sometimes skip the `cancel` event and close the dialog outright,
      // which skipped the shrink; a prevented keydown never becomes a close
      // request at all. Esc inside the app arrives through the bridge instead.
      onKeyDown={(e) => {
        if (e.key !== "Escape" || e.nativeEvent.isComposing) return;
        e.preventDefault();
        requestClose("escape");
      }}
      // The same, for a close request that arrives some other way.
      onCancel={(e) => {
        e.preventDefault();
        requestClose("escape");
      }}
      // Only reached when something other than this component closed the
      // dialog (a browser's close-request safeguard, say): catch up.
      onClose={() => {
        if (!closingRef.current) requestClose("native");
      }}
    >
      <div ref={veilRef} aria-hidden="true" className="lp-veil" />
      <div ref={panelRef} className="lp-panel" data-state="open">
        <div ref={barRef} className="lp-bar">
          {phoneWindow ? null : twoRow ? (
            <>
              <div className="flex items-center gap-space-2">
                {closeButton}
                {titleBlock}
                {actions}
              </div>
              {tabs.length > 1 && tablist}
            </>
          ) : (
            <div className="flex items-center gap-space-3">
              {closeButton}
              {titleBlock}
              {tabs.length > 1 && tablist}
              {actions}
            </div>
          )}
        </div>
        {phoneWindow && <div className="lp-native-close">{closeButton}</div>}
        <p id={descId} className="sr-only">
          Esc, or your browser&apos;s Back button, closes the demo and returns you
          to the case study.
        </p>

        <div ref={stageRef} className="lp-stage">
          <div
            id={panelId}
            role={tabs.length > 1 ? "tabpanel" : undefined}
            aria-labelledby={tabs.length > 1 ? tabDomId(tab.id) : undefined}
            aria-busy={!posterGone}
            className="lp-device"
            data-scaled={simulated ? device : undefined}
            style={boxStyle}
          >
            {armed && (
              <iframe
                ref={frameRef}
                // Deliberately NOT keyed on `device`: switching viewport must
                // resize the frame, not remount it, so the running app keeps its
                // state (the prototypes just re-lay-out and re-fire their own
                // media queries).
                key={`${tab.id}-${reloadKey}`}
                src={tab.src}
                title={`${title}, ${tab.label} (interactive demo)`}
                onLoad={onFrameLoad}
                // Opts out of Lenis's blanket pointer-events:none on iframes
                // (see globals.css), without it, clicks are eaten for the
                // ~0.3–1s a smooth scroll coasts.
                data-live-frame
                // User-initiated, so lazy would be pointless. No `sandbox`:
                // it's same-origin and needs localStorage, and
                // `allow-scripts allow-same-origin` on a same-origin document
                // is equivalent to no sandbox at all.
                allow="fullscreen; clipboard-write"
                // #16181B is NOT a site colour and must not be tokenised: it is
                // the prototype document's own --ink-1 (see
                // public/prototype/meridian/app.html), painted here so the frame
                // does not flash a different dark before the iframe paints. Like
                // the Spendee status swatches, it is CONTENT that happens to be a
                // colour, so the logo repaint leaves it alone; retuning it would
                // just reintroduce the flash. It tracks the prototype, though: it
                // moved from the old plum #12101E when that palette became
                // machined slate.
                className="absolute left-0 top-0 border-0 bg-[#16181B]"
                style={
                  layout
                    ? {
                        // The layout viewport's pixel dimensions, scaled to
                        // fit: the document inside lays out at 390 / 834 / 1280
                        // CSS px and its own media queries fire, which a plain
                        // percentage width could never do.
                        width: layout.w,
                        height: layout.h,
                        transform: `scale(${scale})`,
                        transformOrigin: "0 0",
                      }
                    : { width: "100%", height: "100%" }
                }
              />
            )}
            {/* The boot layer: opaque, and it takes the pointer until it lifts,
                so nothing of the app shows or is tapped half-booted. Where the
                stage is the poster's shape it rides in carrying the poster
                (same `sizes` as the dormant frame's, so the cached file) for
                the scanline to cut away. Anywhere else (a phone, a landscape
                phone, a tablet's letterbox) a desktop screenshot would be a
                strip with the live app showing round it, so it is a loading
                card instead, and fades. */}
            {!posterGone && (
              <div
                ref={posterRef}
                aria-hidden="true"
                data-fit={posterCovers ? "cover" : "card"}
                className="lp-boot absolute inset-0 z-[2]"
              >
                {posterCovers && (
                  <Image
                    src={poster}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 68rem, 94vw"
                    // Eager: next/image defaults to lazy, and a lazy image is
                    // not painted on the window's first frames.
                    loading="eager"
                    placeholder={blurFor(poster) ? "blur" : "empty"}
                    blurDataURL={blurFor(poster)}
                    className="object-cover object-[50%_0%]"
                  />
                )}
                <div className={posterCovers ? "lp-boot-pill" : "lp-boot-card"}>
                  {!posterCovers && (
                    <p className="font-display text-heading-s font-semibold tracking-[-0.01em] text-fg">
                      {title}
                    </p>
                  )}
                  {/* A loop while it loads; under reduced motion, the word. */}
                  {!reduced && <span className="lp-loader" />}
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                    Loading
                  </span>
                </div>
              </div>
            )}
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
    </dialog>
  );
}
