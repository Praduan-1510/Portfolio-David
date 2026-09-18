"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { LiquidGlass, LiquidLens } from "@/components/primitives/LiquidGlass";
import { useDropletLens } from "@/hooks/useDropletLens";
import { useChromeYield } from "@/hooks/useChromeYield";
import { site } from "@/lib/site";
import { ContactDrawer, preloadContactForm } from "./ContactDrawer";
import "./chrome.css";

/*
 * The dock: the second instrument cut from the nav's liquid glass, floating at
 * the bottom centre of every page.
 *
 *   (résumé) (in) │ [ Let's talk ]
 *
 * THE KEYS are two 44px glass beads. The same droplet lens as the nav
 * (hooks/useDropletLens) glides between them, but with no home key: it is
 * gone at rest and condenses out of a bead under whichever key is hovered or
 * focused, and the key's name rises above it as a small readout tag.
 *   Résumé       /resume.
 *   LinkedIn     a new tab (inline mark: lucide ships no brand icons).
 * THE CAP is the flame "Let's talk": it opens the contact drawer
 * (./ContactDrawer), which lazy-loads the site's one ContactForm.
 *
 * IT STEPS ASIDE (hooks/useChromeYield) on /contact, while the mobile menu is
 * open, and while a [data-chrome-yield] marker (the footer, the home reel's
 * pinned board) is in the bottom band: it glides below the fold on a
 * transform and goes inert + aria-hidden, so it can never cover the © row or
 * the board, or be tabbed to while it is away.
 *
 * ENTRANCE. It waits below the fold until the first client frame has decided
 * whether this page wants it (so it never rises and then retreats on home),
 * then rises once on --dur-slower / out-expo. No JS: a CSS keyframe raises it
 * anyway. Reduced motion: it is simply there. All of it lives in chrome.css.
 *
 * STACKING. z-45: under the z-50 header and its sheet, over the bottom edge
 * fade (44). It is a leaf of <body>, outside template.tsx: PageTransition's
 * opacity wrapper would otherwise blank its backdrop. The drawer is rendered
 * as its SIBLING, never inside the glass, so the dock's inert never reaches
 * the dialog and no dock transform ever touches it.
 */

// LinkedIn's "in", drawn in lucide's own stroke grammar (lucide dropped brand
// marks) so it sits with FileText at the same weight.
function LinkedInMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function Dock() {
  const pathname = usePathname();
  const yielded = useChromeYield();

  // "enter": the one slow first rise. "": settled. null: not yet decided.
  const [armed, setArmed] = useState<"enter" | "" | null>(null);
  const [open, setOpen] = useState(false);
  // A route change closes the drawer at once: the page it was over is gone.
  const [instantClose, setInstantClose] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const capRef = useRef<HTMLButtonElement>(null);

  useDropletLens({ containerRef: rowRef, lensRef, activeKey: null });

  // Close on navigation (a link, Back/Forward). Adjusted during render, like
  // Nav's menu, so the stale drawer never paints over the new page.
  const [routeSeen, setRouteSeen] = useState(pathname);
  if (routeSeen !== pathname) {
    setRouteSeen(pathname);
    if (open) {
      setInstantClose(true);
      setOpen(false);
    }
  }

  // Arm on the first frame after mount: by then useChromeYield has measured
  // the page, so a dock that should be away never shows for a frame.
  useEffect(() => {
    let settle = 0;
    const raf = requestAnimationFrame(() => {
      setArmed("enter");
      // Past the entrance (delay + --dur-slower), later moves use the
      // ordinary timings.
      settle = window.setTimeout(() => setArmed(""), 1400);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, []);

  const openDrawer = () => {
    preloadContactForm();
    setInstantClose(false);
    setOpen(true);
  };

  return (
    <>
      <LiquidGlass
        as="aside"
        aria-label="Quick contact"
        radius={28}
        tone="dock"
        strong
        data-armed={armed ?? undefined}
        data-yield={yielded ? "" : undefined}
        inert={yielded}
        aria-hidden={yielded ? true : undefined}
        className="dock fixed inset-x-0 z-[45] mx-auto w-fit print:hidden"
      >
        <div className="dock-row">
          <div ref={rowRef} className="dock-keys">
            <LiquidLens ref={lensRef} />

            <NextLink href="/resume" data-lens-key="resume" className="lg-lens-item dock-key">
              <span data-lens-label>
                <span className="dock-icon">
                  <FileText aria-hidden="true" strokeWidth={1.75} />
                </span>
              </span>
              <span className="dock-tip">Résumé</span>
            </NextLink>

            <a
              href={site.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              data-lens-key="linkedin"
              className="lg-lens-item dock-key"
            >
              <span data-lens-label>
                <span className="dock-icon">
                  <LinkedInMark />
                </span>
              </span>
              <span className="dock-tip">
                LinkedIn <span aria-hidden="true">↗</span>
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          <span aria-hidden="true" className="dock-rule" />

          <button
            ref={capRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="contact-drawer"
            onPointerEnter={preloadContactForm}
            onFocus={preloadContactForm}
            onClick={openDrawer}
            className="lg-cap dock-cap"
          >
            Let&apos;s talk
            <svg
              aria-hidden="true"
              viewBox="0 0 14 14"
              fill="none"
              className="dock-cap-glyph h-3.5 w-3.5"
            >
              <path
                d="M3.25 2.75h7.5a1.75 1.75 0 0 1 1.75 1.75v3.5a1.75 1.75 0 0 1-1.75 1.75H7.25L4.5 11.9V9.75H3.25A1.75 1.75 0 0 1 1.5 8V4.5a1.75 1.75 0 0 1 1.75-1.75Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </LiquidGlass>

      <ContactDrawer
        open={open}
        instant={instantClose}
        onRequestClose={() => setOpen(false)}
        returnFocusRef={capRef}
      />
    </>
  );
}
