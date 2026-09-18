"use client";

import {
  useCallback,
  useRef,
  type CSSProperties,
  type ElementType,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
  type Ref,
} from "react";
import { cn } from "@/lib/utils/cn";
import { useGlassMap } from "@/hooks/useGlassMap";
import "./liquid-glass.css";

/*
 * LiquidGlass: the site's one glass material, as a component. The top nav,
 * the bottom dock, the contact drawer and the mobile menu sheet are all cut
 * from it, so they read as one object family. The CSS (and the full anatomy,
 * paths and rules) lives in ./liquid-glass.css; the refraction in
 * hooks/useGlassMap.ts and ./GlassFilters.tsx.
 *
 * USAGE
 *   // a floating capsule (the nav)
 *   <LiquidGlass as="div" radius={26} tone="nav" strong={condensed}
 *     className="pointer-events-auto">
 *     …content…
 *   </LiquidGlass>
 *
 *   // a docked bar (the dock): position it with utilities, they always win
 *   <LiquidGlass as="nav" aria-label="Quick actions" radius={30} tone="dock"
 *     className="fixed bottom-3 left-1/2 -translate-x-1/2 print:hidden">
 *     …
 *   </LiquidGlass>
 *
 *   // a panel (drawer / sheet): heavier tint for paragraphs and forms
 *   <LiquidGlass tone="panel" radius={28} interactive={false}>…</LiquidGlass>
 *
 * PROPS
 *   as           element: div (default) | nav | section | aside | header |
 *                footer | span | form. (Not ul: the glass layers are spans.)
 *   radius       corner radius in px (default 26). Drives border-radius AND
 *                the refraction map, so pass the real radius, not a class.
 *   tone         "nav" | "dock" (42% tint, 16px rim) or "panel" (70% tint,
 *                deeper frost). Default "nav".
 *   refract      real SVG refraction where supported (Chromium). Default: on
 *                for nav/dock, off for panel.
 *   strong       deeper tint + brighter rim (condensed nav, dock over busy
 *                content). Cross-fades on opacity.
 *   interactive  pointer-tracked highlight + warm rim caustic on hover and
 *                keyboard focus. Default true.
 *   ref          forwarded to the root element (React 19 ref prop).
 *   …rest        any HTML attribute / handler, spread on the root.
 *
 * RULES: never give the root, or any ancestor of it, opacity < 1, filter,
 * clip-path, mask or mix-blend-mode: each makes a Backdrop Root and blanks the
 * glass. Animate transform; to fade the glass itself, fade its .lg-body
 * child. Floating chrome adds print:hidden itself.
 *
 * Also exported: <LiquidLens/>, the droplet that useDropletLens() drives.
 */

export type LiquidGlassTone = "nav" | "dock" | "panel";

type GlassTag = "div" | "nav" | "section" | "aside" | "header" | "footer" | "span" | "form";

export interface LiquidGlassProps extends HTMLAttributes<HTMLElement> {
  as?: GlassTag;
  radius?: number;
  tone?: LiquidGlassTone;
  refract?: boolean;
  strong?: boolean;
  interactive?: boolean;
  ref?: Ref<HTMLElement>;
}

// Refraction tuning per tone. The rim is a fixed physical width, so a larger
// panel bends over a proportionally thinner band; its core frosts harder.
const OPTICS: Record<
  LiquidGlassTone,
  { depth: number; frost: number; chroma: number; bevel?: number }
> = {
  // Dispersion stays sub-pixel (R and B land <= 1px apart at the lip): on
  // this site's thin warm-grey type a wider split reads as red/cyan glyph
  // fragments, a glitch rather than glass.
  nav: { depth: 10, frost: 6, chroma: 0.05 },
  dock: { depth: 10, frost: 6, chroma: 0.05 },
  panel: { depth: 12, frost: 12, chroma: 0.04, bevel: 22 },
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as { current: T | null }).current = value;
}

export function LiquidGlass({
  as = "div",
  radius = 26,
  tone = "nav",
  refract,
  strong = false,
  interactive = true,
  className,
  style,
  children,
  ref,
  onPointerMove,
  onFocus,
  ...rest
}: LiquidGlassProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const filterId = useGlassMap(rootRef, radius, {
    enabled: refract ?? tone !== "panel",
    ...OPTICS[tone],
  });

  // The glint follows the pointer. Coordinates are divided by the rendered
  // scale so a transformed surface (a condensing nav) still lights up exactly
  // under the cursor. Touch has no hover light.
  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    onPointerMove?.(e);
    if (!interactive || e.pointerType === "touch") return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const k = el.offsetWidth ? rect.width / el.offsetWidth : 1;
    el.style.setProperty("--lg-x", `${((e.clientX - rect.left) / k).toFixed(1)}px`);
    el.style.setProperty("--lg-y", `${((e.clientY - rect.top) / k).toFixed(1)}px`);
  };

  // Keyboard focus lights the rim where the focused control is.
  const handleFocus = (e: FocusEvent<HTMLElement>) => {
    onFocus?.(e);
    if (!interactive) return;
    const el = e.currentTarget;
    const target = e.target as HTMLElement;
    if (target === el) return;
    const rect = el.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const k = el.offsetWidth ? rect.width / el.offsetWidth : 1;
    el.style.setProperty("--lg-x", `${((t.left + t.width / 2 - rect.left) / k).toFixed(1)}px`);
    el.style.setProperty("--lg-y", `${((t.bottom - rect.top) / k).toFixed(1)}px`);
  };

  const Tag = as as ElementType;
  const vars = {
    "--lg-r": `${radius}px`,
    ...(filterId ? { "--lg-filter": `url(#${filterId})` } : null),
  } as CSSProperties;

  return (
    <Tag
      ref={setRef}
      className={cn("lg", `lg--${tone}`, className)}
      data-lg-refract={filterId ? "" : undefined}
      data-lg-strong={strong ? "" : undefined}
      data-lg-interactive={interactive ? "" : undefined}
      style={{ ...vars, ...style }}
      onPointerMove={handlePointerMove}
      onFocus={handleFocus}
      {...rest}
    >
      <span className="lg-body" aria-hidden="true" />
      {interactive && <span className="lg-glint" aria-hidden="true" />}
      {children}
    </Tag>
  );
}

/*
 * LiquidLens: the droplet. Purely visual (aria-hidden, no pointer events);
 * useDropletLens() places and glides it. Render it as the FIRST child of a
 * position:relative container that also holds the [data-lens-key] items, and
 * pass its ref to the hook. It fills the container's height; set top/bottom
 * with utilities (e.g. "inset-y-1") to inset it.
 */
export function LiquidLens({
  className,
  ref,
}: {
  className?: string;
  ref?: Ref<HTMLSpanElement>;
}) {
  return <span ref={ref} aria-hidden="true" className={cn("lg-lens", className)} />;
}
