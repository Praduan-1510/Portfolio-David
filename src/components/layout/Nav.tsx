"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/primitives";
import { cn } from "@/lib/utils/cn";
import { FlapText } from "@/components/motion";
import { routeLabel } from "@/lib/utils/routeLabel";
import { spectrumAt } from "@/lib/spectrum";

/*
 * Site navigation. Client component so the current route can be marked active
 * (usePathname). On md+ the links sit inline; below md they collapse into a
 * hamburger that opens a full-screen overlay (DESIGN_GUIDELINES.md §10 keyboard).
 *
 * The overlay is an accessible dialog: focus is trapped inside it, Escape closes
 * it, tapping a link closes it, a route change closes it, body scroll is locked
 * while open, and focus returns to the trigger on close. The reveal is pure
 * transform/opacity and is auto-neutralised under prefers-reduced-motion by the
 * global rule in globals.css (the links still end fully visible).
 */
const links = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close the menu whenever the route changes (covers link taps + back/forward).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While open: lock body scroll, focus the first control, trap Tab inside the
  // overlay, close on Escape, and restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusable = () =>
      overlayRef.current
        ? Array.from(
            overlayRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled])',
            ),
          )
        : [];

    getFocusable()[0]?.focus();

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

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <Container as="div" className="flex h-16 items-center justify-between [@media(max-height:480px)]:h-12">
        <div className="flex items-baseline gap-space-4">
          <NextLink
            href="/"
            className="font-display text-body-l font-semibold tracking-[-0.02em]"
          >
            Praduan Saha
          </NextLink>
          {/* RouteFlap — a persistent departure-board chip reading the current
              route; keyed by pathname so it re-flutters on every navigation
              (the settled end-state of the transition readout). */}
          <span
            aria-hidden="true"
            className="hidden font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted lg:inline-block"
          >
            <FlapText key={pathname} text={`→ ${routeLabel(pathname)}`} trigger="load" flips={3} colorMode="mono" />
          </span>
        </div>

        {/* Inline nav — md and up. */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-space-5">
            {links.slice(1).map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <NextLink
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center font-sans text-caption transition-colors duration-fast ease-out-quad hover:text-accent",
                      active ? "text-fg" : "text-muted",
                    )}
                  >
                    {link.label}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Hamburger — below md. */}
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls={open ? "mobile-menu" : undefined}
          onClick={() => setOpen(true)}
          className="-mr-space-2 flex h-11 w-11 items-center justify-center rounded-[2px] text-fg md:hidden"
        >
          <span aria-hidden="true" className="relative block h-[10px] w-[22px]">
            <span className="absolute left-0 top-0 h-[1.5px] w-full bg-current" />
            <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-current" />
          </span>
        </button>
      </Container>

      {/* Full-screen overlay menu. */}
      {open && (
        <div
          ref={overlayRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[70] flex flex-col bg-bg md:hidden"
        >
          <Container as="div" className="flex h-16 shrink-0 items-center justify-between border-b border-line">
            <span className="font-display text-body-l font-semibold tracking-[-0.02em]">
              Praduan Saha
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="-mr-space-2 flex h-11 w-11 items-center justify-center rounded-[2px] text-fg"
            >
              <span aria-hidden="true" className="relative block h-[18px] w-[18px]">
                <span className="absolute left-1/2 top-1/2 h-[1.5px] w-full -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
                <span className="absolute left-1/2 top-1/2 h-[1.5px] w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
              </span>
            </button>
          </Container>

          <Container as="nav" aria-label="Mobile" className="flex flex-1 flex-col justify-center">
            <ul className="flex flex-col gap-space-2">
              {links.map((link, i) => {
                const active = isActive(pathname, link.href);
                return (
                  <li
                    key={link.href}
                    className="overflow-hidden"
                    style={{
                      animation: "nav-link-in 0.5s var(--ease-out-expo) both",
                      animationDelay: `${0.05 + i * 0.05}s`,
                    }}
                  >
                    <NextLink
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-space-4 py-space-2"
                    >
                      <span
                        className="font-mono text-caption"
                        style={{ color: spectrumAt(i) }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "font-display text-display-l tracking-[-0.02em] transition-colors duration-fast ease-out-quad",
                          active ? "text-accent" : "text-fg",
                        )}
                      >
                        {link.label}
                      </span>
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          </Container>
        </div>
      )}
    </header>
  );
}
