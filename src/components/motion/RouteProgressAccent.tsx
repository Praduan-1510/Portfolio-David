"use client";

import { useEffect } from "react";

/*
 * Themes the global <ScrollProgress> bar to the current project's accent while a
 * case-study route is mounted (DESIGN_GUIDELINES.md §7.5 section-aware accent).
 * Sets the --progress-accent custom property the bar reads, and clears it on
 * unmount so other routes fall back to the monochrome foreground. Renders nothing.
 */
export function RouteProgressAccent({ accent }: { accent?: string }) {
  useEffect(() => {
    if (!accent) return;
    const root = document.documentElement;
    root.style.setProperty("--progress-accent", accent);
    // Block body so the cleanup returns void — removeProperty() returns a string,
    // which isn't a valid effect Destructor.
    return () => {
      root.style.removeProperty("--progress-accent");
    };
  }, [accent]);

  return null;
}
