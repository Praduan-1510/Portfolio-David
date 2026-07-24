import { NextResponse } from "next/server";

/*
 * TEMPORARY diagnostic — reports ONLY whether the contact env vars are present
 * (booleans, never the values) + a build marker, so we can confirm what the live
 * function sees. Remove once the contact form is confirmed sending.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    code: "onestep-v2",
    hasKey: Boolean(process.env.RESEND_API_KEY),
    hasTo: Boolean(process.env.CONTACT_TO_EMAIL),
    hasFrom: Boolean(process.env.CONTACT_FROM_EMAIL),
  });
}
