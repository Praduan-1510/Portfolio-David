import NextLink from "next/link";
import { Text, PhoneFrame } from "@/components/primitives";
import { cn } from "@/lib/utils/cn";
import type { ProjectMeta } from "@/types/project";

/*
 * Project teaser for the home page. The whole card is a single link to the case
 * study. The media is an accent-washed dark "stage" holding the project's cover
 * screen in a phone frame — themed to each project's own accent (the same remap
 * the case-study route uses), with the phone bleeding off the bottom edge so it
 * reads as rising out of the card. Hover lifts the phone and shifts the title to
 * the site accent. The per-project accent is scoped to the stage only, so the
 * wash stays vivid on dark while the title/focus keep their AA-safe values on
 * the light page below.
 *
 * Two layouts share the same stage + meta: the default vertical card (stage over
 * meta, used in the 2-up grid) and a `wide` editorial row (stage beside meta,
 * used to make the trailing odd project a full-width feature instead of leaving
 * a hole in the grid).
 */
export function ProjectCard({
  project,
  layout = "default",
}: {
  project: ProjectMeta;
  /** "wide" lays the stage beside the meta as a full-width feature row. */
  layout?: "default" | "wide";
}) {
  const accentStyle = project.accent
    ? ({ "--accent": project.accent } as React.CSSProperties)
    : undefined;
  const wide = layout === "wide";

  return (
    <article className="group">
      <NextLink
        href={`/work/${project.slug}`}
        aria-label={`View case study: ${project.title}`}
        className={cn(
          "block rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg",
          wide && "grid items-stretch gap-space-6 md:grid-cols-[1.15fr_1fr] md:gap-space-8",
        )}
      >
        {/* Media stage — dark, accent-washed, cover screen rising from the base.
            A radial accent wash from the top, a soft floor gradient so the phone
            doesn't float, and an inset hairline + shadow ring so the stage reads
            as a recessed well with the phone raised inside it — keeping presence
            even on a dark app screen (e.g. Spendee/Decathlon). */}
        <div
          data-theme="dark"
          style={accentStyle}
          className={cn(
            "relative isolate overflow-hidden rounded-[3px] border border-line bg-bg transition-[border-color,box-shadow] duration-base ease-out-quad group-hover:border-neon group-hover:shadow-neon",
            wide ? "aspect-[16/10] md:aspect-auto md:min-h-[24rem]" : "aspect-[4/3]",
          )}
        >
          {/* Accent wash from the crown of the stage. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(82% 72% at 50% 6%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 72%)",
            }}
          />
          {/* Floor gradient + faint accent grounding so the phone has a base to
              rise from instead of a flat field. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 -z-10 h-1/2"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--bg) 92%, #000) 0%, transparent 100%)",
            }}
          />
          {/* Inset ring — a recessed-well edge that lifts the phone off the stage.
              Inline style (not an arbitrary shadow class) so the color-mix commas
              don't fight Tailwind's multi-shadow splitting. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[3px]"
            style={{
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--accent) 22%, transparent), inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 -40px 60px -30px rgba(0,0,0,0.6)",
            }}
          />
          {/* Cover screen in a phone frame, anchored low and bleeding off-edge. */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 transition-transform duration-base ease-out-quad will-change-transform group-hover:-translate-y-2",
              wide ? "top-[14%] w-[32%] md:top-[16%] md:w-[34%]" : "top-[12%] w-[40%]",
            )}
          >
            <PhoneFrame
              src={project.cover}
              alt={`${project.title} — cover screen`}
              sizes={
                wide
                  ? "(min-width: 768px) 14rem, 34vw"
                  : "(min-width: 768px) 12rem, 40vw"
              }
              imgClassName="object-top transition-transform duration-slow ease-out-quad will-change-transform group-hover:scale-[1.05]"
            />
          </div>
          {/* Corner affordance. */}
          <span className="absolute right-space-4 top-space-4 font-mono text-caption uppercase tracking-[0.16em] text-muted transition-colors duration-fast ease-out-quad group-hover:text-neon">
            View →
          </span>
        </div>

        {/* Meta — beside the stage in the wide layout, beneath it otherwise. */}
        <div className={cn(wide && "flex flex-col justify-center")}>
          {wide && (
            <span className="mb-space-4 font-mono text-caption uppercase tracking-[0.18em] text-muted">
              Featured project
            </span>
          )}
          <div
            className={cn(
              "flex items-baseline justify-between gap-space-4",
              !wide && "mt-space-4",
            )}
          >
            <Text
              as="h3"
              variant={wide ? "display-l" : "heading"}
              className="relative inline-block transition-colors duration-fast ease-out-quad group-hover:text-neon"
            >
              {project.title}
              {/* Neon underline draws in from the left on hover (transform only). */}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-neon transition-transform duration-base ease-out-quad group-hover:scale-x-100"
              />
            </Text>
            <span className="shrink-0 font-mono text-caption text-muted">
              {project.year}
            </span>
          </div>
          <Text
            variant={wide ? "body-l" : "body"}
            className={cn("mt-space-2 text-muted", wide && "max-w-[44ch] md:mt-space-4")}
          >
            {project.summary}
          </Text>
          <ul
            className={cn(
              "flex flex-wrap gap-x-space-4 gap-y-space-1",
              wide ? "mt-space-5" : "mt-space-3",
            )}
          >
            {project.services.map((service) => (
              <li
                key={service}
                className="font-mono text-caption uppercase tracking-[0.12em] text-muted"
              >
                {service}
              </li>
            ))}
          </ul>
        </div>
      </NextLink>
    </article>
  );
}
