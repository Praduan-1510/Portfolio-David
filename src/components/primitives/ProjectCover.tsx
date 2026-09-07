import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { PhoneFrame } from "./PhoneFrame";
import { BrowserMockup } from "./BrowserMockup";
import type { ProjectMeta } from "@/types/project";

/*
 * Renders a project's cover in the right device frame for its medium: a portrait
 * PhoneFrame for app projects (default), or a landscape BrowserMockup (still) for
 * web projects. One branch, used by every listing surface (ProjectCard, the work
 * index track + stack, and the next-project teaser) so the choice lives in one
 * place. The case-study HERO renders BrowserMockup with the live <video> directly.
 */
function hostOf(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function ProjectCover({
  project,
  sizes,
  priority = false,
  className,
  imgClassName,
  playVideo = false,
}: {
  project: Pick<ProjectMeta, "kind" | "cover" | "title" | "liveUrl" | "video" | "prototype">;
  sizes?: string;
  priority?: boolean;
  /** Classes on the frame root (e.g. hover lift / transition). */
  className?: string;
  /** PhoneFrame: classes on the <Image>. BrowserMockup: classes on the screen well. */
  imgClassName?: string;
  /** Web covers only: play the looping capture in the still mockup instead of the
   *  poster (used on the home work grid so the shipped product reads as live). */
  playVideo?: boolean;
}) {
  /* Square artwork has no device. A phone frame would crop it to 9:19.5 and a
     browser frame would claim it is a web page, so it gets the plainest thing
     that still reads as an object on the page: the art, a hairline, and the
     same lift the other two frames carry. */
  if (project.kind === "graphic") {
    return (
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_18px_50px_-28px_rgba(0,0,0,0.9)]",
          className,
        )}
      >
        <Image
          src={project.cover}
          alt={`${project.title}, cover graphic`}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      </div>
    );
  }

  if (project.kind === "web") {
    return (
      <BrowserMockup
        tilt="still"
        poster={project.video?.poster ?? project.cover}
        mp4={project.video?.src}
        webm={project.video?.webm}
        playInStill={playVideo}
        // A prototype has no live host, so it falls back to the product domain
        // its own chrome shows: an empty URL pill reads as a broken frame.
        domain={hostOf(project.liveUrl) ?? project.prototype?.surfaces[0]?.domain}
        alt={`${project.title}, website`}
        sizes={sizes}
        priority={priority}
        className={className}
        wellClassName={imgClassName}
      />
    );
  }
  return (
    <PhoneFrame
      src={project.cover}
      alt={`${project.title}, cover screen`}
      sizes={sizes}
      priority={priority}
      className={className}
      imgClassName={imgClassName}
    />
  );
}
