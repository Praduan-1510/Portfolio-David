"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { TextReveal } from "@/components/motion";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";
import { gsap, gsapEase, registerGsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { useLenis } from "@/lib/lenis/useLenis";
import { site } from "@/lib/site";
import "./chrome.css";

/*
 * The contact drawer: a slab of the dock's liquid glass that slides in from
 * the right over a dimmed, softly blurred page, holding the site's one
 * ContactForm (the /contact page's form, its Server Action unchanged).
 *
 * MECHANICS
 *   - A native <dialog> opened with showModal(): top layer (no containing
 *     block on the page can trap it), the page behind goes inert, and Esc is a
 *     cancelable `cancel` event. Styled after .lp-dialog (chrome.css).
 *   - Motion: the panel slides from x 100% (--slow, out-expo) while the veil
 *     fades up (--base); closing plays it back faster (--base, in-out-quart)
 *     and only then calls dialog.close(). Transform on the glass root and
 *     opacity on the veil, a SIBLING of the glass: nothing that holds glass is
 *     ever faded or filtered. Reduced motion: it is simply open, or shut.
 *   - Scroll: Lenis stopped and html.lp-scroll-lock (the root, never <body>:
 *     a clipped body becomes its own scroller and the sticky header pins to
 *     it); the position is re-asserted on release. The panel scrolls itself
 *     (data-lenis-prevent, overscroll contained).
 *   - Focus: the heading takes focus on open (the panel scrolls, so the top of
 *     it must be where a screen reader starts); Tab and Shift+Tab wrap inside;
 *     focus returns to the trigger on close. Closes on Esc, the close key, a
 *     click on the veil, and any route change (instantly).
 *   - The form is fetched only when the drawer first opens (the dock also
 *     warms the chunk on hover/focus of "Let's talk"). It stays mounted after
 *     that, so a draft survives closing, EXCEPT on /contact: that page renders
 *     its own form with the same field ids, so the drawer's copy is dropped
 *     there to keep every id in the document unique.
 */

const loadContactForm = () => import("@/components/ContactForm");

/** Warm the form's chunk before the first open (hover / focus on the cap). */
export function preloadContactForm() {
  void loadContactForm();
}

// Stand-in with ContactForm's own layout (mono readout, Name | Email side by
// side from sm, the select, a five-row message, the submit bar) while the
// chunk arrives, so the panel does not jump when the real form lands.
function PlaceholderField({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div>
      <p className="mb-space-3 font-mono text-caption uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <div className={tall ? "h-[10.25rem] border-b border-line" : "h-[3.25rem] border-b border-line"} />
    </div>
  );
}

function FormPlaceholder() {
  return (
    <div className="space-y-space-6" aria-hidden="true">
      <p className="font-mono text-caption uppercase tracking-[0.16em] text-muted">
        Send a message
      </p>
      <div className="grid gap-space-6 sm:grid-cols-2">
        <PlaceholderField label="Name" />
        <PlaceholderField label="Email" />
      </div>
      <PlaceholderField label="What's this about" />
      <PlaceholderField label="Message" tall />
      <div className="h-[3.7rem] w-full bg-[color:color-mix(in_srgb,var(--fg)_6%,transparent)]" />
    </div>
  );
}

const ContactForm = dynamic(() => import("@/components/ContactForm"), {
  ssr: false,
  loading: () => <FormPlaceholder />,
});

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ContactDrawerProps {
  open: boolean;
  /** Close without the slide (a route change: the page it covered is gone). */
  instant?: boolean;
  onRequestClose: () => void;
  /** Where focus goes back to when the drawer closes. */
  returnFocusRef: RefObject<HTMLElement | null>;
}

interface Session {
  release: (restoreScroll: boolean) => void;
}

export function ContactDrawer({
  open,
  instant = false,
  onRequestClose,
  returnFocusRef,
}: ContactDrawerProps) {
  const pathname = usePathname();
  const lenis = useLenis();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const rafRef = useRef(0);

  // The content mounts on the first open and stays; `visits` re-keys the
  // heading so its blur-in plays on every open, not just the first.
  const [visits, setVisits] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setVisits((v) => v + 1);
  }
  const mounted = visits > 0;
  const showForm = mounted && pathname !== "/contact";

  const onRequestCloseRef = useRef(onRequestClose);
  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

  // Every exit converges here: close the dialog, release the page, hand focus
  // back. Idempotent; the session is cleared first so the native `close`
  // event this fires is recognised as ours.
  const finalize = useCallback(
    (restoreScroll: boolean) => {
      const session = sessionRef.current;
      sessionRef.current = null;
      const dialog = dialogRef.current;
      const panel = panelRef.current;
      if (panel) delete panel.dataset.state;
      if (dialog?.open) dialog.close();
      session?.release(restoreScroll);
      const back = returnFocusRef.current;
      if (back && back.isConnected && !back.closest("[inert]")) {
        back.focus({ preventScroll: true });
      }
    },
    [returnFocusRef],
  );

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const veil = veilRef.current;
    if (!dialog || !panel || !veil) return;
    registerGsap();
    cancelAnimationFrame(rafRef.current);

    if (open) {
      if (sessionRef.current) return;
      const still = prefersReducedMotion();
      gsap.killTweensOf([panel, veil]);
      delete panel.dataset.state;
      if (!still) {
        // Start state painted now; the clock starts on the next frame, after
        // this task's long work (the top layer, the page going inert, the
        // lock's restyle), so the slide never spends its opening beat unseen.
        gsap.set(panel, { xPercent: 100, x: 32 });
        gsap.set(veil, { opacity: 0 });
      } else {
        gsap.set(panel, { clearProps: "transform" });
        gsap.set(veil, { opacity: 1 });
      }

      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute("open", "");
      }

      // Scroll lock, as LivePrototype holds it. The class goes on BEFORE
      // Lenis stops and comes off AFTER it restarts: Lenis's own stopped
      // state is a bare overflow:hidden, which on a classic scrollbar drops
      // the gutter and reflows the page (measured: 11px of scroll drift);
      // lp-scroll-lock holds the gutter for as long as either is on.
      const html = document.documentElement;
      const y = window.scrollY;
      html.classList.add("lp-scroll-lock");
      lenis?.stop();
      sessionRef.current = {
        release: (restoreScroll) => {
          lenis?.start();
          html.classList.remove("lp-scroll-lock");
          if (restoreScroll && Math.abs(window.scrollY - y) > 0.5) {
            if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
            else window.scrollTo(0, y);
          }
        },
      };

      // (TextReveal keeps its own ref, so the heading is found by id.)
      dialog
        .querySelector<HTMLElement>("#contact-drawer-title")
        ?.focus({ preventScroll: true });

      if (!still) {
        rafRef.current = requestAnimationFrame(() => {
          gsap.to(veil, { opacity: 1, duration: durations.base, ease: gsapEase.outQuad });
          gsap.to(panel, {
            xPercent: 0,
            x: 0,
            duration: durations.slow,
            ease: gsapEase.outExpo,
            // Nothing is left hit-testing through a transform once it lands.
            clearProps: "transform",
          });
        });
      }
      return;
    }

    // Closing.
    if (!sessionRef.current) return;
    if (instant || prefersReducedMotion() || !dialog.open) {
      gsap.killTweensOf([panel, veil]);
      gsap.set(panel, { clearProps: "transform" });
      finalize(!instant);
      return;
    }
    panel.dataset.state = "closing";
    gsap.killTweensOf([panel, veil]);
    gsap.to(veil, { opacity: 0, duration: durations.base, ease: gsapEase.outQuad });
    gsap.to(panel, {
      xPercent: 100,
      x: 32,
      duration: durations.base,
      ease: gsapEase.inOutQuart,
      onComplete: () => {
        gsap.set(panel, { clearProps: "transform" });
        finalize(true);
      },
    });
  }, [open, instant, lenis, finalize]);

  // Unmounting mid-session (never in practice: the dock lives in the root
  // layout) still gives the page back.
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      sessionRef.current?.release(false);
      sessionRef.current = null;
    },
    [],
  );

  // Tab and Shift+Tab wrap inside the panel. The page is already inert behind
  // a modal; this keeps the loop from stepping out to the browser's chrome.
  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"]'),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !panel.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="contact-drawer"
      aria-labelledby="contact-drawer-title"
      aria-describedby="contact-drawer-desc"
      className="cd-dialog print:hidden"
      onKeyDown={onKeyDown}
      // Esc: take over the UA's instant close so the slide can play.
      onCancel={(e) => {
        e.preventDefault();
        onRequestCloseRef.current();
      }}
      // Only reached when something else closed the dialog (a browser's
      // close-request safeguard on a repeated Esc): catch up without a slide.
      onClose={() => {
        if (!sessionRef.current) return;
        finalize(true);
        onRequestCloseRef.current();
      }}
    >
      <div
        ref={veilRef}
        aria-hidden="true"
        className="cd-veil"
        onClick={() => onRequestCloseRef.current()}
      />
      <LiquidGlass
        ref={panelRef}
        tone="panel"
        radius={28}
        interactive={false}
        className="cd-panel"
      >
        <div className="cd-scroll" data-lenis-prevent>
          {mounted && (
            <>
              <div className="flex items-center justify-between gap-space-4">
                <p className="flex items-center gap-space-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--lg-ink-soft)]">
                  <span aria-hidden="true" className="dock-led motion-safe:animate-status-pulse" />
                  Open to new work
                </p>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => onRequestCloseRef.current()}
                  className="cd-close"
                >
                  <X aria-hidden="true" strokeWidth={1.75} className="h-[18px] w-[18px]" />
                </button>
              </div>

              <TextReveal
                key={visits}
                id="contact-drawer-title"
                as="h2"
                by="words"
                trigger="load"
                delay={0.14}
                tabIndex={-1}
                className="mt-space-6 font-display text-[clamp(2.5rem,6vw,3.75rem)] leading-[1.02] tracking-[-0.03em] text-[color:var(--lg-ink)] outline-none"
              >
                {"Let's talk"}
              </TextReveal>
              <p
                id="contact-drawer-desc"
                className="mt-space-4 max-w-[38ch] text-body text-[color:var(--lg-ink-soft)]"
              >
                {"Tell me what you're working on and where it stands: I read every message."}
              </p>
              <p className="mt-space-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[color:var(--lg-ink-dim)]">
                Replies within 1–2 working days · IST
              </p>

              {/* The input panel, as on /contact: the island flags it
                  data-busy while a send is in flight (the crown's sweep) and
                  data-received once it lands (the crown's pulse). */}
              <div
                data-transmit-panel
                className="group relative mt-space-6 overflow-hidden rounded-panel border border-line bg-[color:color-mix(in_srgb,var(--bg)_42%,transparent)] p-space-5 sm:p-space-6"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px overflow-hidden"
                  style={{
                    maskImage:
                      "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
                    WebkitMaskImage:
                      "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
                  }}
                >
                  <span
                    className="absolute inset-0 opacity-[0.55] transition-opacity duration-slower ease-out-quad group-data-[received]:opacity-100 group-data-[received]:duration-slow"
                    style={{ background: "var(--spectrum-gradient)" }}
                  />
                  <span
                    className="crown-sweep absolute inset-y-0 left-0 w-[28%] -translate-x-full"
                    style={{ background: "var(--spectrum-gradient)" }}
                  />
                </span>
                {showForm ? <ContactForm /> : <FormPlaceholder />}
              </div>

              <div className="mt-space-6 flex flex-wrap items-center gap-x-space-5 gap-y-space-2">
                <span className="font-mono text-caption uppercase tracking-[0.14em] text-[color:var(--lg-ink-dim)]">
                  Prefer email?
                </span>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex min-h-[44px] items-center text-body text-[color:var(--lg-ink)] underline decoration-line underline-offset-4 transition-colors duration-fast ease-out-quad hover:text-neon"
                >
                  {site.email}
                </a>
                <a
                  href={site.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-body text-[color:var(--lg-ink)] underline decoration-line underline-offset-4 transition-colors duration-fast ease-out-quad hover:text-neon"
                >
                  LinkedIn <span aria-hidden="true">&nbsp;↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </>
          )}
        </div>
      </LiquidGlass>
    </dialog>
  );
}
