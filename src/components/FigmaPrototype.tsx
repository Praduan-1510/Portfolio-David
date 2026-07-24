import { cn } from "@/lib/utils/cn";

/*
 * FigmaPrototype — an interactive Figma prototype embedded directly in the page.
 * Just the embed: NO decorative device shell (the prototype already carries its
 * own device art — a shell would nest a phone inside a phone), clipped into a
 * rounded frame at the artboard's aspect ratio.
 *
 * The iframe is lazy-loaded, so the heavy Figma runtime only fetches when the
 * block scrolls near the viewport — it stays off the initial load path.
 *
 * `aspectRatio` is a CSS aspect-ratio STRING (house convention — see
 * BrowserMockup `aspect`), default "390 / 844" (portrait phone). Width is capped
 * so a tall portrait ratio can't blow out the column height.
 */
interface FigmaPrototypeProps {
  /** Figma embed URL (embed.figma.com/proto/…&embed-host=share). */
  embedUrl: string;
  /** Accessible iframe title. */
  title?: string;
  /** CSS aspect-ratio string for the frame. Default "390 / 844". */
  aspectRatio?: string;
  className?: string;
}

export function FigmaPrototype({
  embedUrl,
  title = "Interactive Figma prototype",
  aspectRatio = "390 / 844",
  className,
}: FigmaPrototypeProps) {
  return (
    <div className={cn("cs-wide my-space-8 flex justify-center", className)}>
      <div
        className="relative w-full max-w-[24rem] overflow-hidden rounded-[18px] border border-line"
        style={{ aspectRatio }}
      >
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
