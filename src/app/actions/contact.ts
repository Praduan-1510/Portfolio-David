"use server";

import { Resend } from "resend";
import { ENQUIRY_TYPES, type ContactState } from "./contact-schema";

/*
 * Contact Server Action + email delivery (Resend).
 *
 * A "use server" module exports ONLY async actions — the form's constants/types
 * live in ./contact-schema. This file consumes the ContactForm FormData fields
 * (name / email / type / message / website honeypot / startedAt) and returns the
 * ContactState shape useActionState feeds back to the form. Runs only on the
 * server, so RESEND_API_KEY never reaches the client. Resend is instantiated
 * INSIDE the action (never at module load) so a missing key can't throw at
 * build/import time — the build stays green before the env vars exist.
 */

type Values = NonNullable<ContactState["values"]>;
type Errors = NonNullable<ContactState["errors"]>;

const SUCCESS_MSG =
  "Thanks — your message is on its way. I'll get back to you soon.";
const GENERIC_ERROR =
  "Something went wrong sending that. Please try again, or email me directly.";

// Pragmatic email shape check — deliberately loose (only a real send proves
// deliverability); rejects the obvious typos.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Sub-second submits are near-certainly instant bots. Kept intentionally LOW so
// it NEVER catches a real (even autofill-assisted) human — silently dropping a
// genuine enquiry is far worse than letting a rare bot through. The honeypot
// above is the primary defence; this only blocks sub-0.8s submissions.
const MIN_FILL_MS = 800;

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim(); // honeypot
  const startedAt = Number(formData.get("startedAt") ?? 0);
  const values: Values = { name, email, type, message };

  // Spam gate 1 — honeypot. A person never fills a field they can't see. Return
  // a *success* so a bot gets no signal to retry with a different payload shape.
  if (website) return { status: "success", message: SUCCESS_MSG };

  // Spam gate 2 — implausibly fast submit after mount. Same silent success.
  if (startedAt && Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "success", message: SUCCESS_MSG };
  }

  // Validation — collect per-field errors and keep the values so the form
  // repopulates instead of wiping what the person typed.
  const errors: Errors = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email))
    errors.email = "Please enter a valid email address.";
  if (!(ENQUIRY_TYPES as readonly string[]).includes(type))
    errors.type = "Please choose what this is about.";
  if (message.length < 10)
    errors.message = "A little more detail helps — at least a sentence.";
  else if (message.length > 2000)
    errors.message = "That's over the 2000-character limit.";

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors,
      values,
    };
  }

  // Delivery. Missing config fails cleanly (and points the visitor to email)
  // rather than throwing — so the form is safe to ship before the Resend keys
  // are set in the environment.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    return {
      status: "error",
      message:
        "The contact form isn't fully wired up yet — please email me directly for now.",
      values,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email, // hitting "reply" in the inbox writes back to the sender
      subject: `Portfolio enquiry — ${type} — ${name}`,
      text: [`Name:  ${name}`, `Email: ${email}`, `About: ${type}`, "", message].join(
        "\n",
      ),
    });
    if (error) return { status: "error", message: GENERIC_ERROR, values };
  } catch {
    return { status: "error", message: GENERIC_ERROR, values };
  }

  return { status: "success", message: SUCCESS_MSG };
}
