/*
 * Shared contact-form contract: enquiry options, state shape, initial state.
 *
 * Kept OUT of the "use server" action file on purpose: a "use server" module may
 * export ONLY async server actions, so plain consts/types exported from there
 * don't survive to the client (they arrive as action refs: `.map` then throws).
 * The form (a client component) imports these values from here; the action from
 * ./contact. Both server and client can import this module freely, no secrets,
 * no server-only code.
 */

// The enquiry categories in the form's <select>. Structural options rather than
// prose: edit the list to taste; the form renders whatever's here.
export const ENQUIRY_TYPES = [
  "Freelance / contract",
  "Full-time role",
  "Collaboration",
  "Just saying hi",
] as const;

type Values = { name: string; email: string; type: string; message: string };
type Errors = Partial<Record<keyof Values, string>>;

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  values?: Values;
  errors?: Errors;
};

export const initialContactState: ContactState = { status: "idle", message: "" };
