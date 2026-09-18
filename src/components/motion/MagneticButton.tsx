import { cn } from "@/lib/utils/cn";

/*
 * Static layout wrapper: formerly a magnetic/cursor-follow target (§7.7).
 *
 * The magnetic drift was removed site-wide by design: buttons now answer the
 * pointer with the nav's own light (a glint on glass, the flame cap's glow, a
 * condensing lens; see Button.tsx) instead of chasing it, which read as
 * buttons that "jump"/"bounce". This wrapper is kept so existing
 * call sites and their layout classes (e.g. `mt-space-7`, `inline-block`) are
 * untouched: it simply renders its children in an inline-block span. `strength`
 * and `max` are accepted for API compatibility but no longer do anything.
 */
interface MagneticButtonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @deprecated no-op: retained so existing call sites don't break. */
  strength?: number;
  /** @deprecated no-op: retained so existing call sites don't break. */
  max?: number;
}

export function MagneticButton({
  className,
  strength: _strength,
  max: _max,
  children,
  ...rest
}: MagneticButtonProps) {
  return (
    <span className={cn("inline-block", className)} {...rest}>
      {children}
    </span>
  );
}
