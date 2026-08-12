import { cn } from "@/lib/utils/cn";

/*
 * The ember: a warm coal behind the content, carried to every route so the
 * identity survives past the first viewport. Pure CSS (two radial blooms in
 * one color-mix recipe), decorative, pointer-events:none, zero runtime cost.
 *
 * Its vocabulary used to be the five-hue spectrum, which meant an ember could
 * be violet on one route and lime on the next for no stated reason. That is
 * gone. There are exactly TWO temperatures now, because the palette has
 * exactly two things colour is allowed to mean:
 *   "signal"  the site's own voice (vermilion). The default.
 *   "accent"  the route's guest colour, inside a project's own context.
 * A second, dimmer bloom of the same colour gives the coal its depth; it is
 * never a second HUE.
 *
 * Dosage: ONE ember per viewport, always behind content (-z), always subtle:
 * it's an ember, not a second hero.
 */

type Hue = "signal" | "accent";

const HUE_VAR: Record<Hue, string> = {
  signal: "var(--signal)",
  accent: "var(--accent)",
};

const POSITIONS: Record<string, [string, string]> = {
  "top-right": ["82% 12%", "62% 30%"],
  "top-left": ["16% 12%", "38% 28%"],
  "bottom-right": ["84% 86%", "64% 68%"],
  "bottom-left": ["16% 86%", "36% 70%"],
  center: ["50% 42%", "58% 60%"],
};

interface AuroraEmberProps {
  /** The ember's temperature: the site's voice, or the route's guest colour. */
  hue?: Hue;
  position?: keyof typeof POSITIONS;
  /** Peak bloom opacity 0–1 (the ember's temperature). */
  intensity?: number;
  className?: string;
}

export function AuroraEmber({
  hue = "signal",
  position = "top-right",
  intensity = 0.16,
  className,
}: AuroraEmberProps) {
  const [pos1, pos2] = POSITIONS[position];
  const c = HUE_VAR[hue];
  const a1 = Math.round(intensity * 100);
  const a2 = Math.round(intensity * 62);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      style={{
        background: [
          `radial-gradient(46% 42% at ${pos1}, color-mix(in srgb, ${c} ${a1}%, transparent), transparent 72%)`,
          `radial-gradient(52% 48% at ${pos2}, color-mix(in srgb, ${c} ${a2}%, transparent), transparent 74%)`,
        ].join(", "),
      }}
    />
  );
}
