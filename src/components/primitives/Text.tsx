import { cn } from "@/lib/utils/cn";

/*
 * Typographic primitive. `variant` picks a step from the fluid type scale
 * (DESIGN_GUIDELINES.md §5); `as` picks the element so semantics and size stay
 * independent (e.g. a visually-large <h2>). Color inherits from the document
 * (--fg); pass `text-muted` etc. to override.
 */
export type TextVariant =
  | "display-xl"
  | "display-l"
  | "heading"
  | "body-l"
  | "body"
  | "caption";

type TextElement = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div" | "li";

const variantClasses: Record<TextVariant, string> = {
  "display-xl": "font-display text-display-xl",
  "display-l": "font-display text-display-l",
  heading: "font-display text-heading",
  "body-l": "font-sans text-body-l",
  body: "font-sans text-body",
  caption: "font-sans text-caption",
};

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextElement;
  variant?: TextVariant;
}

export function Text({
  as: Tag = "p",
  variant = "body",
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Tag className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </Tag>
  );
}
