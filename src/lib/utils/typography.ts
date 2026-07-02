/*
 * Display-title wrap control. Compound project names ("InsightsTap — Website",
 * "Decathlon — App Redesign") break badly at display sizes: the em dash dangles
 * at a line end, or a two-word tail splits one word per line. Binding the dash
 * FORWARD (nbsp after it) means a break lands before the dash — "InsightsTap /
 * — Website" — never after it, and short tails stay together.
 *
 * For visual rendering only — never feed this into <title>, OG tags, or JSON-LD.
 */
const NBSP = " ";

export function displayTitle(title: string): string {
  return (
    title
      // "A — B" -> the dash binds to what follows it.
      .replace(/— /g, `—${NBSP}`)
      // Join a trailing two-word pair ("App Redesign") so it wraps as one unit.
      .replace(/ (\S+) (\S+)$/, ` $1${NBSP}$2`)
  );
}
