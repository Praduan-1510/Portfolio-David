"use client";

import { createContext, useContext } from "react";
import type Lenis from "lenis";

export const LenisContext = createContext<Lenis | null>(null);

/*
 * Access the active Lenis instance, or null when smooth scroll is off (e.g.
 * under reduced motion, where native scroll is used instead). Consumers must
 * handle the null case.
 */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}
