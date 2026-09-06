"use client";

import {
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/primitives";
import { Reveal, FlapText } from "@/components/motion";
import { gsap } from "@/lib/motion/gsap";
import { durations } from "@/lib/motion/durations";
import { distance } from "@/lib/motion/tokens";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";
import { sendContactMessage } from "@/app/actions/contact";
// Plain consts/types live outside the "use server" module (see contact-schema).
import {
  initialContactState,
  ENQUIRY_TYPES,
  type ContactState,
} from "@/app/actions/contact-schema";

/**
 * Contact form. Progressive by construction: a real <form> posting to a Server
 * Action, so it works before hydration and degrades cleanly.
 *
 * Styled to the site tokens (DESIGN_GUIDELINES.md §4–6): mono caption labels,
 * hairline `border-line` underline fields that brighten to `fg` on focus, the
 * shared `Button` primitive for submit, and the semantic `--error` / `--success`
 * roles for validation state: one instrument language, no foreign colours.
 *
 * Those two roles exist because this form used to borrow the spectrum for
 * "error" and the interaction signal for "success". Neither survives the
 * spectrum collapse, and a grey error message is not an error message.
 */

const label =
  "block font-mono text-caption uppercase tracking-[0.14em] text-muted mb-space-3";

// Underline field on the dark panel: hairline that brightens to fg on focus.
// text-body (17px) keeps iOS from zoom-on-focus; the global focus ring is
// intentionally traded for the border-brighten affordance.
const field =
  "w-full rounded-none border-0 border-b border-line bg-transparent px-0 py-space-3 " +
  "text-body text-fg placeholder:text-muted " +
  "focus:border-fg focus:outline-none focus:ring-0 transition-colors duration-base ease-out-quad";

const errorText =
  "mt-space-2 flex items-center gap-space-2 text-caption text-[color:var(--error)]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      disabled={pending}
      className="mt-space-3 w-full"
    >
      {pending ? (
        "Sending…"
      ) : (
        <>
          Send message
          <ArrowRight aria-hidden className="size-[18px]" />
        </>
      )}
    </Button>
  );
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className={errorText}>
      <span aria-hidden className="inline-block size-[5px] shrink-0 rounded-full bg-[color:var(--error)]" />
      {children}
    </p>
  );
}

// The Kolkata clock at the moment the message landed: HH:MM, read once. Not
// useKolkataClock(): that ticks every second for the page's whole life, and a
// timestamp that was true once has no reason to keep re-rendering the form.
const kolkataHHMM = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

const readoutClass =
  "font-mono text-caption uppercase tracking-[0.16em] text-muted";

/*
 * Transmission readout: the panel's mono header reports the message's state on
 * the board. Every label change remounts FlapText (key) so it flutters once;
 * labels are A-Z 0-9 plus "·" and ":", which FlapText passes through static.
 * It lives inside the <form> because useFormStatus().pending only exists there.
 *
 * It also drives the panel crown from inside the client island, so the server
 * page never re-renders: data-busy on the nearest [data-transmit-panel] while
 * the action is in flight (the busy-light sweep, CSS) and data-received once it
 * lands (the hairline pulses to full strength, holds, then settles back).
 *
 * aria-hidden: the sr-only aria-live region already announces state.message,
 * and FlapText's own sr-only twin would double-announce it.
 */
function TransmitReadout({ state }: { state: ContactState }) {
  const { pending } = useFormStatus();
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLParagraphElement>(null);
  const [landedAt, setLandedAt] = useState<string | null>(null);

  // Stamp the clock once, before paint, so the label never repaints from a
  // plain RECEIVED to the timed one. Without JS this never runs and the header
  // reads RECEIVED, which is still true.
  useLayoutEffect(() => {
    if (state.status === "success") setLandedAt(kolkataHHMM());
  }, [state.status]);

  // Busy light: flag the panel while the action is in flight. The sweep itself
  // is CSS, gated to no-preference, so the flag is harmless under reduced motion.
  useEffect(() => {
    const panel = hostRef.current?.closest<HTMLElement>("[data-transmit-panel]");
    if (!panel || !pending) return;
    panel.setAttribute("data-busy", "");
    return () => panel.removeAttribute("data-busy");
  }, [pending]);

  // Received pulse: full strength for the rise (slow) plus a hold (slow), then
  // release and let the CSS transition settle it back over slower.
  useEffect(() => {
    if (state.status !== "success" || prefersReducedMotion()) return;
    const panel = hostRef.current?.closest<HTMLElement>("[data-transmit-panel]");
    if (!panel) return;
    panel.setAttribute("data-received", "");
    const release = gsap.delayedCall(durations.slow * 2, () =>
      panel.removeAttribute("data-received"),
    );
    return () => {
      release.kill();
      panel.removeAttribute("data-received");
    };
  }, [state.status, reduced]);

  const fieldErrors = Object.keys(state.errors ?? {}).length > 0;
  const readout = pending
    ? "SENDING"
    : state.status === "success"
      ? landedAt
        ? `RECEIVED · ${landedAt} IST`
        : "RECEIVED"
      : state.status === "error"
        ? fieldErrors
          ? "NOT SENT · CHECK FIELDS"
          : "NOT SENT · USE EMAIL"
        : "SEND A MESSAGE";

  return (
    <p ref={hostRef} aria-hidden="true" className={readoutClass}>
      <FlapText
        key={readout}
        text={readout}
        trigger="load"
        flips={3}
        colorMode="mono"
      />
    </p>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(
    sendContactMessage,
    initialContactState,
  );

  // Stamped at mount, compared server-side against submit time.
  const [startedAt] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const v = state.values;

  return (
    <div>
      {/* Announced to screen readers without stealing focus. */}
      <div aria-live="polite" className="sr-only">
        {state.status !== "idle" ? state.message : ""}
      </div>

      {state.status === "success" ? (
        <div>
          <TransmitReadout state={state} />
          {/* Rises the short distance on the entrance curve (Reveal carries
              curve.entrance): a received beat, not a page change. */}
          <Reveal
            trigger="load"
            y={distance.sm}
            duration={durations.base}
            className="mt-space-6 flex items-start gap-space-4 py-space-4"
          >
            <span
              aria-hidden
              className="mt-[2px] inline-flex size-space-6 shrink-0 items-center justify-center rounded-full border border-[color:var(--success)] text-[color:var(--success)]"
            >
              <Check className="size-4" />
            </span>
            <p className="text-body-l text-fg">{state.message}</p>
          </Reveal>
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="space-y-space-6" noValidate>
          <TransmitReadout state={state} />
          <input type="hidden" name="startedAt" value={startedAt} />

          {/* Honeypot. Hidden from people, not from bots. Never display:none:
              some bots skip those; this is off-screen and unreachable instead. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-space-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={label}>Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={v?.name}
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={!!state.errors?.name}
                aria-describedby={state.errors?.name ? "name-error" : undefined}
                className={field}
              />
              <FieldError id="name-error">{state.errors?.name}</FieldError>
            </div>

            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={v?.email}
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!state.errors?.email}
                aria-describedby={state.errors?.email ? "email-error" : undefined}
                className={field}
              />
              <FieldError id="email-error">{state.errors?.email}</FieldError>
            </div>
          </div>

          <div>
            <label htmlFor="type" className={label}>What&apos;s this about</label>
            <div className="relative">
              <select
                id="type"
                name="type"
                required
                defaultValue={v?.type ?? ""}
                aria-invalid={!!state.errors?.type}
                aria-describedby={state.errors?.type ? "type-error" : undefined}
                className={`${field} appearance-none pr-space-6`}
              >
                <option value="" disabled>Choose one</option>
                {ENQUIRY_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-bg text-fg">{t}</option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 size-[18px] text-muted"
              />
            </div>
            <FieldError id="type-error">{state.errors?.type}</FieldError>
          </div>

          <div>
            <label htmlFor="message" className={label}>Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              maxLength={2000}
              defaultValue={v?.message}
              placeholder="What are you working on, and where does it stand?"
              aria-invalid={!!state.errors?.message}
              aria-describedby={state.errors?.message ? "message-error" : undefined}
              className={`${field} resize-y`}
            />
            <FieldError id="message-error">{state.errors?.message}</FieldError>
          </div>

          {/* Form-level message ONLY when it isn't a field-validation failure
              (e.g. a delivery/config error). When fields are invalid they already
              highlight themselves, so the generic "fix the highlighted fields"
              summary is suppressed here: it's still announced to screen readers
              via the sr-only aria-live region above. */}
          {state.status === "error" &&
            state.message &&
            !Object.keys(state.errors ?? {}).length && (
              <p className="flex items-center gap-space-2 text-caption text-[color:var(--error)]">
                <span aria-hidden className="inline-block size-[5px] shrink-0 rounded-full bg-[color:var(--error)]" />
                {state.message}
              </p>
            )}

          <SubmitButton />
        </form>
      )}
    </div>
  );
}
