import { useSyncExternalStore } from "react";

/*
 * Tracks the OS "reduce motion" setting and updates when the user toggles it
 * (DESIGN_GUIDELINES.md §10 / ARCHITECTURE.md §14). Every motion primitive gates
 * on this and degrades to instant/static. SSR-safe: returns false on the server,
 * reads the real value on mount.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/*
 * Live, synchronous read for use INSIDE a (layout) effect — accurate even during
 * the hydration frame, where useReducedMotion() still returns the SSR value
 * (false) for one render. Motion primitives gate their animation on this so
 * already-reduced-motion users never see content hidden, while keeping the hook
 * value in their effect dependencies so a runtime toggle re-runs + reverts.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );
}
