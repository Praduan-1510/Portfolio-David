"use client";

import { useEffect, useRef } from "react";

/*
 * ButtonGlint: the pointer light on a glass or bone <Button>, the nav's
 * .lg-glint cut down to one control (styles in ./button.css).
 *
 * It listens on its own button (its parent) and writes --btn-x / --btn-y on
 * itself: no RAF, the browser only repaints this one layer. The position is
 * kept after the pointer leaves so the light fades out where it was rather
 * than jumping; a keyboard focus clears it, so the light pools at the middle
 * of the lower rim (the CSS default), where the nav lights a focused link.
 * Touch has no hover light. A separate island so <Button> itself stays a
 * Server Component.
 */
export function ButtonGlint() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const glint = ref.current;
    const host = glint?.parentElement;
    if (!glint || !host) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = host.getBoundingClientRect();
      // Divide out the rendered scale (the :active press) so the light stays
      // exactly under the pointer.
      const k = host.offsetWidth ? rect.width / host.offsetWidth : 1;
      glint.style.setProperty("--btn-x", `${((e.clientX - rect.left) / k).toFixed(1)}px`);
      glint.style.setProperty("--btn-y", `${((e.clientY - rect.top) / k).toFixed(1)}px`);
    };
    const onFocus = () => {
      if (!host.matches(":focus-visible")) return;
      glint.style.removeProperty("--btn-x");
      glint.style.removeProperty("--btn-y");
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("focus", onFocus);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("focus", onFocus);
    };
  }, []);

  return <span ref={ref} aria-hidden="true" className="btn-glint" />;
}
