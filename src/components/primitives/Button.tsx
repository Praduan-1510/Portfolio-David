import NextLink from "next/link";
import { cn } from "@/lib/utils/cn";
import { ButtonGlint } from "./ButtonGlint";
import "./button.css";

/*
 * Button / CTA: the capsule nav's controls, in the page. Renders a routed
 * <NextLink>, an external <a>, or a <button> depending on `href`. The material,
 * the light and every state live in ./button.css, which maps each variant onto
 * one of the two controls the nav (components/layout/Nav.tsx) is built from:
 *
 *   primary     the flame end cap (.lg-cap), painted in the route's
 *               --accent-gradient so a case study themes its own primary
 *   secondary   the glass capsule: tint, top sheen, lit rim, pointer glint
 *   ghost       a quiet label; hover and focus condense the droplet lens
 *   invert      the bone capsule, for high-contrast spots (404, résumé)
 *
 * Every variant is a capsule; there is no sharp shape any more (the prop was
 * dropped with the last caller). `size` is md (44px: the cap's own height and
 * type step) or lg (56px). `arrow` adds the cap's glyph, which nudges the way
 * it points on hover and on keyboard focus. Focus is the global :focus-visible
 * ring; reduced motion, forced colors and print are handled in the stylesheet.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "invert";
export type ButtonSize = "md" | "lg";
export type ButtonArrow = "right" | "left" | "down" | "up-right";

const base =
  "btn inline-flex items-center justify-center rounded-full text-center font-sans tracking-[-0.005em]";

// Weights are the nav's: the cap is semibold, the glass links are medium.
const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn--primary font-semibold",
  secondary: "btn--glass font-medium",
  ghost: "btn--ghost font-medium",
  invert: "btn--bone font-semibold",
};

// min-h keeps every target >= 44px. md is the nav's 14px step, lg one above.
const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-[2.75rem] gap-1.5 py-2 text-[0.875rem] leading-[1.2]",
  lg: "min-h-[3.5rem] gap-2 py-3 text-[1rem] leading-[1.2]",
};

// A ghost pads like a nav link: its padding is the room the lens condenses
// into. Kept apart from sizeClasses because cn() only joins (no merge), so two
// px-* utilities on one element would be settled by stylesheet order.
const padClasses: Record<ButtonSize, { solid: string; ghost: string }> = {
  md: { solid: "px-5", ghost: "px-3.5" },
  lg: { solid: "px-7", ghost: "px-5" },
};

// The nav cap's arrow (12-unit box, 1.5 stroke), turned.
const ARROW_PATH: Record<ButtonArrow, string> = {
  right: "M2 6h7.5M6.5 2.75 9.75 6 6.5 9.25",
  left: "M10 6H2.5M5.5 2.75 2.25 6 5.5 9.25",
  down: "M6 2v7.5M2.75 6.5 6 9.75 9.25 6.5",
  "up-right": "M3.25 8.75 8.75 3.25M4.5 3.25h4.25V7.5",
};

function Arrow({ dir }: { dir: ButtonArrow }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" data-dir={dir} className="btn-arrow">
      <path
        d={ARROW_PATH[dir]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** The cap's arrow, after the label ("left" goes before it). */
  arrow?: ButtonArrow;
  className?: string;
  children: React.ReactNode;
};

type AsButton = CommonProps &
  React.ComponentPropsWithRef<"button"> & { href?: undefined };
type AsLink = CommonProps & React.ComponentPropsWithRef<"a"> & { href: string };

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);
const isHttp = (href: string) => /^https?:/.test(href);

export function Button(props: AsButton | AsLink) {
  // `rest` keeps the union, so checking its href narrows it to link or button.
  const { variant = "primary", size = "md", arrow, className, children, ...rest } = props;
  // A `download` href points at a FILE in public/, not a route. Routing it
  // through NextLink makes the router prefetch it as an RSC payload, which 404s
  // on every render of the page (e.g. /pdf/… ?_rsc=…), so render a plain <a>.
  const isDownload =
    "download" in props && props.download !== undefined && props.download !== false;
  const classes = cn(
    base,
    variantClasses[variant],
    sizeClasses[size],
    variant === "ghost" ? padClasses[size].ghost : padClasses[size].solid,
    className,
  );

  // Glass and bone carry the pointer light; the cap and the lens don't, just
  // as neither does in the nav.
  const content = (
    <>
      {(variant === "secondary" || variant === "invert") && <ButtonGlint />}
      {arrow === "left" && <Arrow dir="left" />}
      {children}
      {arrow && arrow !== "left" && <Arrow dir={arrow} />}
    </>
  );

  if (rest.href !== undefined) {
    const { href, ...anchor } = rest;
    if (isExternal(href) || isDownload) {
      // Off-origin links get rel="noopener noreferrer" by default (overridable
      // via props); mailto:/tel: don't need it.
      const rel = isHttp(href) ? (anchor.rel ?? "noopener noreferrer") : anchor.rel;
      // New-tab links need a programmatic cue: the visual arrow alone isn't
      // announced. Append an sr-only note when the caller opens a new tab.
      const opensNewTab = anchor.target === "_blank";
      return (
        <a href={href} className={classes} {...anchor} rel={rel}>
          {content}
          {opensNewTab && <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      );
    }
    return (
      <NextLink href={href} className={classes} {...anchor}>
        {content}
      </NextLink>
    );
  }

  return (
    <button className={classes} {...rest}>
      {content}
    </button>
  );
}
