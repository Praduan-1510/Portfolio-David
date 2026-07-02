import { cn } from "@/lib/utils/cn";
import { FlapText } from "@/components/motion";

/*
 * Eyebrow / kicker — a short mono, all-caps label above a heading or section
 * (DESIGN_GUIDELINES.md §5 casing rule + §9 structural devices). Reserve
 * all-caps for these short labels only.
 *
 * `flap` opts a plain-string eyebrow into the split-flap flutter (FlapText,
 * in-view once) — the departure-board signature carried to every route by the
 * one element every route already has. Mono-caps only; zero layout shift.
 */
interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  flap?: boolean;
}

export function Eyebrow({ className, children, flap = false, ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-block font-mono text-caption uppercase tracking-[0.18em] text-muted",
        className,
      )}
      {...props}
    >
      {flap && typeof children === "string" ? (
        <FlapText text={children} trigger="inView" flips={3} colorMode="spectrum" />
      ) : (
        children
      )}
    </span>
  );
}
