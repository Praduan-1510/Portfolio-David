import NextLink from "next/link";
import Image from "next/image";
import { PhoneFrame } from "@/components/primitives";
import { cn } from "@/lib/utils/cn";
import { displayTitle } from "@/lib/utils/typography";
import blurMap from "@/lib/content/blur-map.json";
import type { ProjectMeta, ProjectStatus } from "@/types/project";
import "./project-card.css";

/*
 * Project card: the one listing for the work, on the home page and on /work.
 *
 * A 4:3 media box over four lines of type, the whole card one link. The media
 * is a still that behaves as if it were in use (project-card.css): a website
 * sits in a browser window inset from the top-left and bleeding off the right
 * and bottom edges, drifting slowly as if someone were reading it; a phone app
 * rises out of the bottom edge with its screenshot scrolling from top to bottom
 * inside the screen. Under the media: where the work stands (a status pill),
 * what it is and when, its name, and the one line it came to (`outcome`, which
 * the content layer holds to 90 characters and to claims its own study makes).
 *
 * The project's accent is scoped to the card (the same inline remap the
 * case-study route uses), so the wash, the prototype dot and the focus ring
 * speak in the project's colour while the page around it stays monochrome.
 * Voyager has no accent by design and speaks in the site's own signal.
 *
 * Hover exists only on a real hover device (`can-hover:`): the screenshot
 * zooms in its frame (a web page from its resting 1.06 to 1.10; a phone
 * screen, which has no drift to hide, from 1.00 to 1.04), the frame lifts 4px,
 * and a solid chip slides in over the media naming the client. Keyboard focus
 * shows the same chip. On touch there is no overlay to discover; an arrow
 * beside the title says the card goes somewhere. Motion is transform and
 * opacity only.
 *
 * No hooks, no client state: the card renders wherever its parent does. The
 * loops are pure CSS; ProjectGrid decides which cards are playing.
 */

/** `sizes` pinned to what is actually painted, by the grid's breakpoints (see
 *  ProjectGrid: 1 column below 640px, 2 to 1279px, 3 above, 90rem container
 *  with a 5vw gutter). A web screenshot is drawn at object-fit: cover in a 4:3
 *  window, about 1.37 card widths wide, times its 1.06 resting zoom (a 416px
 *  card paints about 600px, which the 1200w variant covers at 2x); a phone's
 *  screen is about 0.37 of a card width. Measured: every card fetches at
 *  least its painted width in device pixels at 1440@2x, 1024@2x and 390@3x. */
const WEB_SIZES = "(min-width: 1280px) 37.5rem, (min-width: 640px) 68vw, 136vw";
const APP_SIZES = "(min-width: 1280px) 10rem, (min-width: 640px) 17vw, 34vw";

/*
 * Intrinsic sizes of the phone covers, so next/image can draw a tall
 * screenshot at its natural height inside the screen (`fill` would crop it to
 * the screen's shape and there would be nothing to scroll). A cover missing
 * here is not an error: its phone simply fills the screen and floats.
 */
const PHONE_COVERS: Record<string, { width: number; height: number }> = {
  "/images/work/nukkad/home.png": { width: 804, height: 1748 },
  "/images/work/spendee/dashboard.png": { width: 804, height: 2640 },
  "/images/work/voyager/dashboard.png": { width: 804, height: 2376 },
  "/images/work/decathlon/home.png": { width: 393, height: 852 },
};

/** Height over width past which a screenshot is worth scrolling. The card's
 *  screen is about 2.25, so a single-screen capture (Nukkad 2.17, Decathlon
 *  2.17) has nothing to show by moving and floats instead, while a dashboard
 *  three screens tall (Spendee 3.28, Voyager 2.96) scrolls. */
const SCROLL_ASPECT = 2.5;

const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: "Live",
  prototype: "Prototype",
  concept: "Concept",
};

const KIND_LABEL: Record<NonNullable<ProjectMeta["kind"]>, string> = {
  app: "App",
  web: "Web",
  graphic: "Graphic",
};

const blurFor = (src: string): string | undefined =>
  (blurMap as Record<string, string>)[src];

/*
 * Whether the study's hero has a screen for the cover to fly into (the
 * HandoffLayer docking). It mirrors `hasReel` in app/work/[slug]/page.tsx: an
 * app study with a hero video opens on a floating reel, which registers no
 * HandoffTarget. Offering a source there would park a clone over the new page
 * for 1.2s before it gave up, so those cards get the ordinary transition.
 */
const docks = (project: ProjectMeta): boolean =>
  project.kind === "web" || !project.video?.src;

export function ProjectCard({
  project,
  titleAs: Title = "h3",
}: {
  project: ProjectMeta;
  /** Heading level for the title: h3 under a section h2 (home), h2 directly
   *  under the page h1 (/work). */
  titleAs?: "h2" | "h3";
}) {
  const { slug } = project;
  const isWeb = project.kind === "web";
  const ids = {
    title: `pc-${slug}-title`,
    status: `pc-${slug}-status`,
    outcome: `pc-${slug}-outcome`,
  };

  return (
    <NextLink
      href={`/work/${slug}`}
      aria-labelledby={ids.title}
      aria-describedby={`${ids.status} ${ids.outcome}`}
      className="group block rounded-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      style={{ "--accent": project.accent ?? "var(--signal)" } as React.CSSProperties}
    >
      {/* The media box. It holds the screenshot, so it is the handoff source. */}
      <div
        data-handoff-source={docks(project) ? slug : undefined}
        className="relative isolate aspect-[4/3] overflow-hidden rounded-[16px] border border-line bg-surface"
      >
        <Wash web={isWeb} />
        {isWeb ? <BrowserWindow project={project} /> : <RisingPhone project={project} />}
        <Chip client={project.client} />
      </div>

      <div className="mt-space-4">
        <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
          <StatusPill id={ids.status} status={project.status} />
          <span className="font-mono text-caption uppercase tracking-[0.14em] text-muted">
            {KIND_LABEL[project.kind ?? "app"]} · {project.year}
          </span>
        </div>
        <Title
          id={ids.title}
          className="mt-space-3 font-display text-heading-s text-fg transition-colors duration-fast ease-out-quad can-hover:group-hover:text-neon"
        >
          {displayTitle(project.title)}
          {/* Touch has no hover chip, so the affordance lives here instead. */}
          <span aria-hidden="true" className="ml-space-2 inline-block text-muted can-hover:hidden">
            →
          </span>
        </Title>
        <p id={ids.outcome} className="mt-space-2 font-sans text-body text-muted">
          {project.outcome ?? project.indexNote ?? project.summary}
        </p>
      </div>
    </NextLink>
  );
}

/* The accent pool behind the device: from the top-left corner for a window
   (the only ground a bleeding window leaves visible), from the base for a
   phone rising out of it. The recipe is the work index's stage wash. */
function Wash({ web }: { web: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.85] transition-opacity duration-slow ease-out-quad can-hover:group-hover:opacity-100"
      style={{
        background: web
          ? "radial-gradient(90% 90% at 0% 0%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 72%)"
          : "radial-gradient(78% 70% at 50% 100%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 72%)",
      }}
    />
  );
}

/* A website: the screenshot in a hairline window inset 7% / 9% from the
   top-left (equal margins in a 4:3 box) and running off the other two edges,
   anchored at the page's top-left so the logo and navigation lead. */
function BrowserWindow({ project }: { project: ProjectMeta }) {
  const blur = blurFor(project.cover);
  return (
    <div className="absolute left-[7%] top-[9%] h-full w-full transition-transform duration-base ease-out-quad can-hover:group-hover:-translate-y-1">
      <div
        data-handoff-frame
        className="relative isolate h-full w-full overflow-hidden rounded-[10px] border border-[color:color-mix(in_srgb,var(--fg)_14%,transparent)] bg-bezel shadow-[0_24px_60px_-26px_rgba(0,0,0,0.85)]"
      >
        <Image
          src={project.cover}
          alt=""
          fill
          sizes={WEB_SIZES}
          placeholder={blur ? "blur" : "empty"}
          blurDataURL={blur}
          className="pc-drift origin-top-left scale-[1.06] object-cover object-left-top transition-transform duration-slow ease-out-quad can-hover:group-hover:scale-[1.10]"
        />
        {/* Glass sheen, PhoneFrame's and BrowserMockup's vocabulary. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_38%)]"
        />
      </div>
    </div>
  );
}

/* A phone app: the device rising out of the bottom edge, a third of the card
   wide, its screenshot scrolling (or, for a single-screen capture, the whole
   device floating). */
function RisingPhone({ project }: { project: ProjectMeta }) {
  const size = PHONE_COVERS[project.cover];
  const scrolls = !!size && size.height / size.width > SCROLL_ASPECT;
  return (
    <div className="absolute left-1/2 top-[12%] w-[34%] -translate-x-1/2">
      <div
        className={cn(
          "transition-transform duration-base ease-out-quad can-hover:group-hover:-translate-y-1",
          !scrolls && "pc-float",
        )}
      >
        <PhoneFrame
          scroll
          src={project.cover}
          alt=""
          width={size?.width}
          height={size?.height}
          sizes={APP_SIZES}
          scrollerClassName={scrolls ? "pc-scroll" : undefined}
          // No resting zoom here, unlike the window's 1.06: that zoom exists
          // to hide the drift's travel, a phone screen does not drift
          // sideways, and a 6% zoom crops the text that app screens set
          // close to their edges. The hover adds the same 0.04 step.
          imgClassName="origin-top transition-transform duration-slow ease-out-quad can-hover:group-hover:scale-[1.04]"
        />
      </div>
    </div>
  );
}

/* The hover and focus chip. Decorative for assistive tech: the link already
   announces the title, the status and the outcome. */
function Chip({ client }: { client: string }) {
  return (
    <span
      aria-hidden="true"
      data-card-chip
      className="pointer-events-none absolute bottom-space-4 left-space-4 z-[2] flex max-w-[calc(100%-2rem)] -translate-x-2 items-center gap-space-2 rounded-full border border-line-strong bg-bg py-space-2 pl-space-4 pr-space-3 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.12em] text-fg opacity-0 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.9)] transition-[opacity,transform] duration-base ease-out-quad group-focus-visible:translate-x-0 group-focus-visible:opacity-100 can-hover:group-hover:translate-x-0 can-hover:group-hover:opacity-100"
    >
      <span className="min-w-0 truncate text-muted">{client}</span>
      <span className="shrink-0 text-muted">·</span>
      <span className="shrink-0">
        View case study <span className="text-neon">→</span>
      </span>
    </span>
  );
}

/* Where the work stands. Live is the one moving mark (the site's signal, a
   16px halo at 25% around an 8px dot, pulsing); a prototype is a steady dot in
   the project's colour; a concept is a hollow ring. Every mark sits in the same
   16px box so the labels line up across a row. */
function StatusPill({ id, status }: { id: string; status: ProjectStatus }) {
  const live = status === "live";
  return (
    <span
      id={id}
      className={cn(
        "inline-flex items-center gap-space-2 rounded-full border py-[3px] pl-space-2 pr-space-3 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.14em]",
        live
          ? "border-[color:color-mix(in_srgb,var(--signal)_45%,transparent)] text-fg"
          : "border-line text-muted",
      )}
    >
      <span aria-hidden="true" className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        {live && (
          <>
            <span className="absolute inset-0 rounded-full bg-signal opacity-25" />
            <span className="relative h-2 w-2 rounded-full bg-signal motion-safe:animate-status-pulse" />
          </>
        )}
        {status === "prototype" && <span className="h-2 w-2 rounded-full bg-accent" />}
        {status === "concept" && <span className="h-2 w-2 rounded-full border border-muted" />}
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}
