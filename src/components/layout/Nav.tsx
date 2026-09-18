"use client";

import NextLink from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { LiquidGlass, LiquidLens } from "@/components/primitives/LiquidGlass";
import { useDropletLens } from "@/hooks/useDropletLens";
import { useLenis } from "@/lib/lenis/useLenis";
import { spectrumAt } from "@/lib/spectrum";
import { site } from "@/lib/site";

/*
 * Site navigation: a floating liquid-glass capsule, centred at the top.
 *
 * LAYOUT CONTRACT. The <header> is still a sticky, 64px-tall (48px on short
 * landscape) block at the top of every page, exactly as the opaque bar was,
 * so nothing below it moved and the case-study "Contents" rail (sticky
 * top-16) still lines up under it. It is transparent and pointer-events:none;
 * only the capsule (and the open sheet) take the pointer, so the strip either
 * side of the capsule is page, not chrome. It keeps z-50: the dock sits at 45
 * under it, the mobile sheet covers everything below.
 *
 * THE CAPSULE (components/primitives/LiquidGlass, one material with the dock)
 *   mark + name (home) · | · Work Services About. Below md: mark + name ·
 *   bead toggle. Résumé and the way to get in touch live in the bottom dock
 *   (components/layout/Dock), so the capsule stays a pure wayfinder.
 *   A droplet lens (hooks/useDropletLens) rests under the current route and
 *   glides to whichever link is hovered or focused, stretching as it travels
 *   and settling with a small overshoot; the label under it swells 4%.
 *
 * CONDENSE. Past 80px of scroll (relaxing again under 48, so idling near the
 * line never flickers) the capsule condenses: the name folds
 * away (a clip-path wipe over a 0fr grid track), the capsule rises 4px on a
 * transform and its rim and tint strengthen on an opacity cross-fade. One
 * boolean flip per crossing from a passive scroll listener (Lenis drives
 * native scroll, so it fires for both), never per-frame work.
 *
 * THE MOBILE MENU is an accessible dialog: while open, the wrapper around the
 * capsule and the sheet carries role="dialog"/aria-modal, focus moves to the
 * first link and is trapped (Tab / Shift+Tab wrap), Escape closes, a route
 * change closes (link taps + back/forward), crossing to md closes, body scroll
 * is locked and Lenis stopped, focus returns to the toggle on close, and
 * html[data-menu-open] is set (the dock hides itself on it). The toggle's
 * three glass beads run together into a bar and fold into an x; the sheet is
 * the same glass, heavier, and its links enter with the heading blur-in.
 * The sheet opens by transform on the glass root and opacity on its body
 * only: fading the root would blank the backdrop (see liquid-glass.css).
 */
const links = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
];

// The capsule's own row: Home is the mark.
const rowLinks = links.filter((l) => l.href !== "/");

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Condense past CONDENSE_AT px of scroll, relax again under RELAX_AT.
const CONDENSE_AT = 80;
const RELAX_AT = 48;

export function Nav() {
  const pathname = usePathname();
  const lenis = useLenis();
  const [open, setOpen] = useState(false);
  // The beads only play their closing fold after they have opened once, so
  // nothing animates on page load.
  const [armed, setArmed] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);

  // Close the menu whenever the route changes (link taps + back/forward).
  // Adjusted during render rather than in an effect: no extra paint with the
  // stale sheet still open.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const activeKey = rowLinks.find((l) => isActive(pathname, l.href))?.href ?? null;
  useDropletLens({ containerRef: rowRef, lensRef, activeKey });

  useEffect(() => {
    let current = false;
    const update = () => {
      const y = window.scrollY;
      const next = current ? y > RELAX_AT : y > CONDENSE_AT;
      if (next === current) return;
      current = next;
      setCondensed(next);
    };
    // A reload mid-page restores scroll before any scroll event: read once.
    const first = window.setTimeout(update, 0);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("scroll", update);
    };
  }, []);

  // While open: flag the document, lock scroll, focus the first link, trap
  // Tab, close on Escape or on crossing to md, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const trigger = triggerRef.current;
    root.dataset.menuOpen = "";
    // Lock on <html>, never <body>. Lenis's stop() also sets overflow:hidden on
    // <html>; once the root clips, a clipped <body> no longer propagates to the
    // viewport and becomes a scroll container of its own, the sticky header
    // pins to THAT, and the capsule opens 400px above the fold on a scrolled
    // page. Locking the root (with or without Lenis, i.e. under reduced motion
    // too) keeps <body> out of it.
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    lenis?.stop();

    // Rendered-only: the desktop links live in the same wrapper but are
    // display:none below md, and focus() on those silently does nothing.
    const getFocusable = () =>
      menuRef.current
        ? Array.from(
            menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
          ).filter((el) => el.getClientRects().length > 0)
        : [];

    sheetRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      wide.removeEventListener("change", onWide);
      delete root.dataset.menuOpen;
      root.style.overflow = prevOverflow;
      lenis?.start();
      trigger?.focus({ preventScroll: true });
    };
  }, [open, lenis]);

  // The sheet shows the capsule at full size: it is the menu's title bar.
  const compact = condensed && !open;

  return (
    <header
      data-lg-compact={compact ? "" : undefined}
      className="pointer-events-none sticky top-0 z-50 h-16 print:hidden [@media(max-height:480px)]:h-12"
    >
      <div
        ref={menuRef}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? "Menu" : undefined}
        className="h-full"
      >
        <div className="relative z-10 flex justify-center px-space-3 pt-space-3 [@media(max-height:480px)]:pt-0.5">
          <LiquidGlass
            radius={26}
            tone="nav"
            strong={compact || open}
            className={cn(
              "pointer-events-auto transition-transform duration-slow ease-out-expo",
              compact && "-translate-y-1",
            )}
          >
            <div className="flex h-[3.25rem] items-center p-1 [@media(max-height:480px)]:h-11">
              <NextLink
                href="/"
                aria-label="Praduan Saha: home"
                className="flex h-11 shrink-0 items-center rounded-full px-space-2 font-display text-[1rem] font-semibold tracking-[-0.02em] text-fg [@media(max-height:480px)]:h-9"
              >
                <span className="lg-mark h-7 w-7">
                  <Image
                    src="/Favicon/icon-512.png"
                    alt=""
                    width={28}
                    height={28}
                    priority
                    className="h-7 w-7"
                  />
                </span>
                <span className="lg-collapse">
                  <span>
                    <span className="block pl-space-2 pr-1">Praduan Saha</span>
                  </span>
                </span>
              </NextLink>

              <span
                aria-hidden="true"
                className="mx-1.5 hidden h-5 w-px shrink-0 bg-line-strong md:block"
              />

              <nav aria-label="Primary" className="hidden md:block">
                <div ref={rowRef} className="relative flex items-center">
                  <LiquidLens ref={lensRef} />
                  <ul className="flex items-center">
                    {rowLinks.map((link) => {
                      const active = isActive(pathname, link.href);
                      return (
                        <li key={link.href}>
                          <NextLink
                            href={link.href}
                            data-lens-key={link.href}
                            aria-current={active ? "page" : undefined}
                            className="lg-lens-item flex h-11 items-center rounded-full px-3.5 text-[0.875rem] font-medium tracking-[-0.005em] [@media(max-height:480px)]:h-9"
                          >
                            <span data-lens-label>{link.label}</span>
                          </NextLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </nav>


              {/* Bead toggle, below md. The label keeps the Open/Close wording
                  the QA scripts address it by; aria-expanded carries state. */}
              <button
                ref={triggerRef}
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="mobile-menu"
                data-armed={armed ? "" : undefined}
                onClick={() => {
                  setArmed(true);
                  setOpen((o) => !o);
                }}
                className="lg-beads md:hidden [@media(max-height:480px)]:h-9"
              >
                <span aria-hidden="true" className="lg-bead" />
                <span aria-hidden="true" className="lg-bead" />
                <span aria-hidden="true" className="lg-bead" />
              </button>
            </div>
          </LiquidGlass>
        </div>

        {/* The sheet: always mounted below md, hidden (and inert) while shut. */}
        <div
          ref={sheetRef}
          id="mobile-menu"
          data-open={open ? "" : undefined}
          inert={!open}
          data-lenis-prevent
          className="lg-sheet md:hidden"
        >
          <LiquidGlass tone="panel" radius={28} interactive={false}>
            <div className="flex h-full flex-col overflow-y-auto overscroll-contain px-space-5 pb-space-5 pt-[5.5rem]">
              <nav aria-label="Mobile" className="flex-1">
                <ul className="flex flex-col gap-space-1">
                  {links.map((link, i) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <li
                        key={link.href}
                        data-sheet-item
                        style={{ "--i": i } as CSSProperties}
                      >
                        <NextLink
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className="flex items-baseline gap-space-4 py-space-2"
                        >
                          {/* The ink ramp, lifted a step so the lightest index
                              still clears 4.5:1 on the glass. */}
                          <span
                            className="font-mono text-caption"
                            style={{
                              color: active
                                ? "var(--signal-press)"
                                : `color-mix(in srgb, ${spectrumAt(i)} 75%, var(--fg))`,
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "font-display text-display-l tracking-[-0.02em]",
                              active ? "text-signal" : "text-fg",
                            )}
                          >
                            {link.label}
                          </span>
                        </NextLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div
                data-sheet-item
                style={{ "--i": links.length } as CSSProperties}
                className="mt-space-6 flex flex-wrap items-center justify-between gap-space-3 border-t border-line pt-space-4 font-mono text-caption"
              >
                <a
                  href={`mailto:${site.email}`}
                  className="flex min-h-[44px] items-center text-fg underline decoration-line underline-offset-4"
                >
                  {site.email}
                </a>
                <span className="uppercase tracking-[0.14em] text-[color:var(--lg-ink-dim)]">
                  Kolkata · IN
                </span>
              </div>
            </div>
          </LiquidGlass>
        </div>
      </div>
    </header>
  );
}
