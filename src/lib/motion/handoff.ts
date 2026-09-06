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

export interface HandoffSource {
  slug: string;
  /** The screen image the clone shows: the source <img>'s currentSrc. */
  src: string;
  /** Viewport rect of the source screen well at click time. */
  rect: { top: number; left: number; width: number; height: number };
  /** Look of the source well, copied so the clone is pixel-identical at t=0. */
  radius: string;
  bezel: string;
  fit: string;
  position: string;
  /** The source <img>'s own transform (hover scale on cards), so no pop at click. */
  transform: string;
  transformOrigin: string;
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
