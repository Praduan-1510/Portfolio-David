import { cn } from "@/lib/utils/cn";

/*
 * Spectrum ember — a coal of the home hero's aurora, carried to every route so
 * the identity survives past the first viewport. Pure CSS (two/three radial
 * blooms in the same color-mix recipe as the hero Fallback), decorative,
 * pointer-events:none, zero runtime cost. Each surface tunes temperature via
 * `hues`; "accent" blends the route's --accent with its spectrum neighbours so
 * case-study heroes read as "the aurora, tuned to this project".
 *
 * Dosage: ONE ember per viewport, always behind content (-z), always subtle —
 * it's an ember, not a second hero.
 */

type Hue = "violet" | "blue" | "lime" | "amber" | "rose" | "accent";

const HUE_VAR: Record<Exclude<Hue, "accent">, string> = {
  violet: "var(--spectrum-violet)",
  blue: "var(--spectrum-blue)",
  lime: "var(--spectrum-lime)",
  amber: "var(--spectrum-amber)",
  rose: "var(--spectrum-rose)",
};

const POSITIONS: Record<string, [string, string]> = {
  "top-right": ["82% 12%", "62% 30%"],
  "top-left": ["16% 12%", "38% 28%"],
  "bottom-right": ["84% 86%", "64% 68%"],
  "bottom-left": ["16% 86%", "36% 70%"],
  center: ["50% 42%", "58% 60%"],
};

interface AuroraEmberProps {
  /** One or two hues; "accent" uses the route's accent + a violet neighbour. */
  hues?: Hue[];
  position?: keyof typeof POSITIONS;
  /** Peak bloom opacity 0–1 (the ember's temperature). */
  intensity?: number;
  className?: string;
}

export function AuroraEmber({
  hues = ["violet", "blue"],
  position = "top-right",
  intensity = 0.16,
  className,
}: AuroraEmberProps) {
  const [pos1, pos2] = POSITIONS[position];
  const c1 =
    hues[0] === "accent" ? "var(--accent)" : HUE_VAR[hues[0] ?? "violet"];
  const second = hues[1] ?? (hues[0] === "accent" ? "violet" : "blue");
  const c2 = second === "accent" ? "var(--accent)" : HUE_VAR[second];
  const a1 = Math.round(intensity * 100);
  const a2 = Math.round(intensity * 62);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      style={{
        background: [
          `radial-gradient(46% 42% at ${pos1}, color-mix(in srgb, ${c1} ${a1}%, transparent), transparent 72%)`,
          `radial-gradient(52% 48% at ${pos2}, color-mix(in srgb, ${c2} ${a2}%, transparent), transparent 74%)`,
        ].join(", "),
      }}
    />
  );
}
