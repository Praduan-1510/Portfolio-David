/*
 * Handoff store: the cover frame a visitor clicks on a listing flies to the
 * case-study hero and docks there (components/motion/HandoffLayer.tsx).
 *
 * A module singleton, the same survival class as PageTransition's `hasMounted`:
 * it has to outlive the route change, because the source is measured on the
 * page being left and the target registers on the page arriving. Three parties
 * write to it and one reads:
 *   - HandoffLayer   begin() at click, abort()/clear() when the flight ends
 *   - HandoffTarget  registerTarget() from its layout effect on the new page
 *   - PageTransition scrollResetDone() once the new route sits at scroll 0
 * The layer flies only when BOTH the target is registered AND the reset is done:
 * child effects run before the parent's, so measuring at registration would be
 * off by the previous page's scroll offset.
 *
 * Nothing here touches the DOM; the store only holds geometry and references.
 */

export interface HandoffRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Four corner radii in px, clockwise from top-left (the order CSS uses). */
export type HandoffRadii = [number, number, number, number];

export interface HandoffSource {
  slug: string;
  /** The screen image the clone shows: the source <img>'s currentSrc. */
  src: string;
  /** Viewport rect of the source FRAME at click time: the element that clips
   *  the screenshot (a `[data-handoff-frame]` inside the source, else the
   *  image's parent, which is the screen well of PhoneFrame/BrowserMockup). */
  rect: HandoffRect;
  /** Look of the source frame, copied so the clone is pixel-identical at t=0. */
  radius: string;
  bezel: string;
  /**
   * The image as it was actually drawn, relative to `rect`: its real box after
   * every transform in play at the click (a card's hover zoom, a thumbnail's
   * drift, a phone screen's scroll), resolved through object-fit into the
   * painted content box when the natural size is known (`exact`). The clone
   * draws the image at exactly this box, so a moving thumbnail is caught where
   * it was rather than snapped back to its resting position.
   */
  image: HandoffRect & { exact: boolean };
  /** object-fit / object-position for the inexact case only (no natural size
   *  yet): the clone then draws the element box the way the source did. */
  fit: string;
  position: string;
  /**
   * The part of the frame that was actually on screen, as insets (px) from each
   * edge of `rect`, plus the corner radii of that visible shape. A frame that
   * bleeds off its card (a phone rising out of the bottom edge, a browser
   * window running off the right) is clipped by the card; without this the
   * clone would show the hidden bleed the instant it appears. The flight opens
   * the clip out to the target frame's own shape.
   */
  clip: { top: number; right: number; bottom: number; left: number; radii: HandoffRadii };
}

export interface HandoffState {
  slug: string;
  source: HandoffSource;
  /** The HandoffTarget wrapper on the new page, once it has mounted. */
  target: HTMLElement | null;
  resetDone: boolean;
  aborted: boolean;
}

let state: HandoffState | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function set(next: HandoffState | null): void {
  state = next;
  emit();
}

export const handoff = {
  /** The in-flight handoff, or null. Aborted flights read as null so a target
   *  arriving during the abort fade never hides itself. */
  get pending(): HandoffState | null {
    return state && !state.aborted ? state : null;
  },

  /** Raw state including an aborting flight (the layer needs to see it). */
  getSnapshot(): HandoffState | null {
    return state;
  },

  getServerSnapshot(): HandoffState | null {
    return null;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  begin(source: HandoffSource): void {
    set({ slug: source.slug, source, target: null, resetDone: false, aborted: false });
  },

  /** Called by HandoffTarget's layout effect. Returns an unregister function
   *  that only clears the reference (never aborts): StrictMode double-invokes
   *  effects on mount, and a real unmount mid-flight is handled by the layer. */
  registerTarget(slug: string, el: HTMLElement): () => void {
    if (!state || state.aborted || state.slug !== slug) return () => {};
    set({ ...state, target: el });
    return () => {
      if (state && state.target === el) set({ ...state, target: null });
    };
  },

  /** Called by PageTransition after the new route is scrolled to the top. A
   *  route other than the one the clone is aiming at means the navigation went
   *  elsewhere (or was intercepted), so the flight is abandoned. */
  scrollResetDone(pathname: string): void {
    if (!state || state.aborted) return;
    const expected = `/work/${state.slug}`;
    if (pathname === expected || pathname === `${expected}/`) {
      set({ ...state, resetDone: true });
    } else {
      set({ ...state, aborted: true });
    }
  },

  /** Mark the flight abandoned; the layer fades the clone and reveals the target. */
  abort(): void {
    if (!state || state.aborted) return;
    set({ ...state, aborted: true });
  },

  /** Drop the state entirely (the clone unmounts). */
  clear(): void {
    if (!state) return;
    set(null);
  },
};
