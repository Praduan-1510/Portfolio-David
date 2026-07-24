import { NextResponse } from "next/server";
import { Resend } from "resend";

/*
 * TEMPORARY diagnostic — reports whether the contact env vars are present
 * (booleans, never the values) + a build marker. With ?send=1 it performs a
 * single guarded deliverability test through Resend and returns the outcome.
 * Remove once the contact form is confirmed sending.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const base = {
    code: "onestep-v3",
    hasKey: Boolean(process.env.RESEND_API_KEY),
    hasTo: Boolean(process.env.CONTACT_TO_EMAIL),
    hasFrom: Boolean(process.env.CONTACT_FROM_EMAIL),
  };

  const doSend = new URL(req.url).searchParams.get("send") === "1";
  if (!doSend) return NextResponse.json(base);

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ ...base, send: "no-key" });

  const to = process.env.CONTACT_TO_EMAIL ?? "hey@praduansaha.com";
  const from =
    process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>";
  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Contact form deliverability test — please ignore",
      text: "Automated test from the contact-form setup. If you received this, delivery works.",
    });
    return NextResponse.json({
      ...base,
      to,
      from,
      send: error ? { ok: false, error: error.message ?? String(error) } : { ok: true, id: data?.id },
    });
  } catch (e) {
    return NextResponse.json({ ...base, send: { ok: false, thrown: String(e) } });
  }
}
