import { cn } from "@/lib/utils/cn";

/*
 * Eyebrow / kicker — a short mono, all-caps label above a heading or section
 * (DESIGN_GUIDELINES.md §5 casing rule + §9 structural devices). Reserve
 * all-caps for these short labels only.
 */
interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-block font-mono text-caption uppercase tracking-[0.18em] text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
