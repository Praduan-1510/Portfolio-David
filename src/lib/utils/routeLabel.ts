/*
 * Mono-caps route label for the departure-board chrome (transition readout +
 * nav RouteFlap chip). Path-derived so it needs no data dependency.
 */
export function routeLabel(pathname: string): string {
  if (pathname === "/") return "Index";
  const seg = pathname.split("/").filter(Boolean);
  if (seg[0] === "work" && seg[1]) return seg[1].replace(/-/g, " ");
  if (seg[0] === "work") return "Work";
  if (seg[0] === "about") return "About";
  // ASCII on purpose — the flap charset is A–Z/0–9, so "Résumé" would flutter
  // every letter except the accented ones and read broken on the board.
  if (seg[0] === "resume") return "Resume";
  if (seg[0] === "contact") return "Contact";
  return seg[0] ?? "Index";
}
