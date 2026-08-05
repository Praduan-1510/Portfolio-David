/*
 * Display-title wrap control. Compound project names ("InsightsTap: Website",
 * "Decathlon: App Redesign") break badly at display sizes, where a two-word tail
 * can split one word per line. Binding the tail together keeps it whole.
 *
 * This used to also bind an em dash forward (nbsp after it) so a break landed
 * before the dash rather than leaving it dangling at a line end. Titles now use
 * a colon, which is a closing mark that sits tight against the word before it
 * and cannot dangle, so that rule was removed rather than left as a no-op.
 *
 * For visual rendering only: never feed this into <title>, OG tags, or JSON-LD.
 */
const NBSP = " ";

export function displayTitle(title: string): string {
  // Join a trailing two-word pair ("App Redesign") so it wraps as one unit.
  return title.replace(/ (\S+) (\S+)$/, ` $1${NBSP}$2`);
}
