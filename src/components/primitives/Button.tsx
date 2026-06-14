import NextLink from "next/link";
import { cn } from "@/lib/utils/cn";

/*
 * Button / CTA. Renders a routed <NextLink>, an external <a>, or a <button>
 * depending on `href`. `variant` sets color, `shape` the radius (sharp
 * instrument default vs. pill), `size` the padding + type step. Hover settles on
 * the `fast` / ease-out-quad tokens — auto-neutralized under reduced motion by
 * the global rule in globals.css. Focus styling comes from the global
 * :focus-visible ring.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "invert";
export type ButtonShape = "sharp" | "pill";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-space-2 font-sans font-medium transition duration-fast ease-out-quad";

// Hover resolves to the neon-green signal across every variant, matching the
// site-wide card affordance: fills flip to neon (dark text stays AA-legible on
// the bright green), outlined/ghost buttons take a neon border + text. The base
// `transition` animates the colour change on the `fast` token.
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-neon hover:text-on-accent",
  secondary: "border border-line text-fg hover:border-neon hover:text-neon",
  ghost: "text-fg hover:text-neon",
  // High-contrast monochrome fill — white-on-dark (ink-on-paper in light).
  invert: "bg-fg text-bg hover:bg-neon hover:text-bg",
};

const shapeClasses: Record<ButtonShape, string> = {
  sharp: "rounded-[2px]",
  pill: "rounded-full",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-space-5 py-space-3 text-caption",
  lg: "px-space-6 py-space-4 text-body",
};

type CommonProps = {
  variant?: ButtonVariant;
  shape?: ButtonShape;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type AsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = CommonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);
const isHttp = (href: string) => /^https?:/.test(href);

export function Button(props: AsButton | AsLink) {
  const { variant = "primary", shape = "sharp", size = "md", className, children } = props;
  const classes = cn(
    base,
    variantClasses[variant],
    shapeClasses[shape],
    sizeClasses[size],
    className,
  );

  if ("href" in props && props.href !== undefined) {
    const {
      href,
      variant: _v,
      shape: _s,
      size: _sz,
      className: _c,
      children: _ch,
      ...rest
    } = props;
    if (isExternal(href)) {
      // Off-origin links get rel="noopener noreferrer" by default (overridable
      // via props); mailto:/tel: don't need it.
      const rel = isHttp(href)
        ? ((rest as React.AnchorHTMLAttributes<HTMLAnchorElement>).rel ??
          "noopener noreferrer")
        : (rest as React.AnchorHTMLAttributes<HTMLAnchorElement>).rel;
      return (
        <a href={href} className={classes} {...rest} rel={rel}>
          {children}
        </a>
      );
    }
    return (
      <NextLink href={href} className={classes} {...rest}>
        {children}
      </NextLink>
    );
  }

  const {
    variant: _v,
    shape: _s,
    size: _sz,
    className: _c,
    children: _ch,
    ...rest
  } = props;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
