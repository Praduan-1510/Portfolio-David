import { cn } from "@/lib/utils/cn";

/*
 * Reserved-space media placeholder. Phase 1 has no real imagery, so this holds
 * the correct aspect ratio (prevents CLS — DESIGN_GUIDELINES.md §8 / §12) and
 * labels what will live there. In Phase 4 the inner becomes a <next/image>.
 */
type Ratio = "16/10" | "4/3" | "1/1";

const ratioClass: Record<Ratio, string> = {
  "16/10": "aspect-[16/10]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
};

interface MediaFrameProps {
  ratio?: Ratio;
  label?: string;
  className?: string;
}

export function MediaFrame({
  ratio = "16/10",
  label = "Image",
  className,
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-[2px] border border-line bg-surface",
        ratioClass[ratio],
        className,
      )}
      role="img"
      aria-label={`${label} (placeholder)`}
    >
      <span className="px-space-4 text-center font-mono text-caption uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
    </div>
  );
}
