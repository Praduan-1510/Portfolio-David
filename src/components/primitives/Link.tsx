import NextLink from "next/link";
import { cn } from "@/lib/utils/cn";

/*
 * Text link. Internal hrefs route through next/link; external / mailto / tel
 * render a plain <a>. Always underlined with a transparent decoration that
 * inks in on hover/focus — zero layout shift, and the ink-in eases on the
 * motion tokens (DESIGN_GUIDELINES.md §7.7 / §10).
 */
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:|#)/.test(href);
const isHttp = (href: string) => /^https?:/.test(href);

export function Link({ href, className, children, ...props }: LinkProps) {
  const classes = cn(
    "text-accent underline decoration-transparent underline-offset-4 transition-[color,text-decoration-color] duration-fast ease-out-quad hover:decoration-current focus-visible:decoration-current",
    className,
  );

  if (isExternal(href)) {
    // Off-origin links get rel="noopener noreferrer" by default (overridable);
    // mailto:/tel:/# don't need it.
    const rel = isHttp(href) ? (props.rel ?? "noopener noreferrer") : props.rel;
    return (
      <a href={href} className={classes} {...props} rel={rel}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} className={classes} {...props}>
      {children}
    </NextLink>
  );
}
