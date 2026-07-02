import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import blurMap from "@/lib/content/blur-map.json";

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * Clean phone frame for mobile UI screens (these projects are phone apps). The
 * device body sits on --surface (one step lighter than --bg) with a hairline
 * border + a top highlight, so the phone reads as a raised object against the
 * near-black page even when the app screen itself is dark (e.g. Spendee) — a
 * dark-on-dark screen would otherwise dissolve into the background. The screen
 * well carries its own crisp inset ring (a light hairline + a faint dark seam),
 * so even a near-black app screen separates from both the bezel and the page.
 * The notch stays on the dark --bezel to read as a cutout. A 9:19.5 screen is
 * rendered via next/image and fills the well.
 */
interface PhoneFrameProps {
  src: string;
  alt: string;
  /** next/image sizes hint — set to the frame's rendered width across breakpoints. */
  sizes?: string;
  /** Prioritise the LCP image (the cover). */
  priority?: boolean;
  className?: string;
  /** Extra classes on the <Image> — e.g. "object-top" to anchor tall screens
   *  so the screen's header/title stays visible instead of a centre crop. */
  imgClassName?: string;
}

export function PhoneFrame({
  src,
  alt,
  sizes = "(min-width: 768px) 18rem, 60vw",
  priority = false,
  className,
  imgClassName,
}: PhoneFrameProps) {
  return (
    <div
      className={cn(
        // Device body — raised on --surface with a hairline rim, a top highlight
        // and a refined drop shadow so the phone reads as a physical object
        // lifted off the near-black page.
        "relative aspect-[9/19.5] w-full overflow-hidden rounded-[2rem] border border-white/12 bg-surface p-[6px] shadow-[0_28px_70px_-24px_rgba(0,0,0,0.85),0_2px_8px_-2px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
        className,
      )}
    >
      {/* Screen well — a dark seam under the screen so the edge stays defined. */}
      <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-bezel">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder={blurFor(src) ? "blur" : "empty"}
          blurDataURL={blurFor(src)}
          className={cn("object-cover", imgClassName)}
        />
        {/* Screen overlay (above the image) — a crisp light hairline ring keeps
            the screen edge defined even when the app screen is itself near-black
            (it would otherwise dissolve into the bezel and page), plus a faint
            diagonal glass sheen for depth. Decorative; box-shadow inset so the
            ring sits exactly on the screen edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] rounded-[1.6rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_38%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
        />
      </div>
      {/* Notch / dynamic-island hint — sits flush at the screen's top edge (on
          the dark bezel) so it reads as a cutout. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[6px] z-10 h-[14px] w-[34%] -translate-x-1/2 rounded-b-[10px] bg-bezel"
      />
    </div>
  );
}
