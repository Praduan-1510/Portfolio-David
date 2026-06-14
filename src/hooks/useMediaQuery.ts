import { useSyncExternalStore } from "react";

/*
 * SSR-safe media-query hook. Returns false on the server (mobile-first baseline)
 * and the real match on the client, updating on change. Used to gate the
 * desktop-only scroll choreography to its simpler mobile fallback (§13).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
