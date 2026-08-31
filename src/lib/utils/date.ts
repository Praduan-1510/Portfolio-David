/*
 * Date formatting for notes.
 *
 * Built from the ISO string's own parts rather than `new Date(...)`: parsing
 * "2026-08-31" gives a Date at UTC midnight, and formatting that in any
 * timezone behind UTC renders the PREVIOUS day. A published note silently
 * showing the wrong date to readers west of Greenwich is the kind of bug that
 * survives for years because nobody in the author's timezone can see it.
 *
 * `formatNoteDate` therefore does no timezone work at all: the string is a
 * calendar date, and it is rendered as one.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** "2026-08-31" → "31 August 2026". Returns the input unchanged if malformed. */
export function formatNoteDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, year, month, day] = m;
  const name = MONTHS[Number(month) - 1];
  if (!name) return iso;
  return `${Number(day)} ${name} ${year}`;
}
