import { cn } from "@/lib/utils/cn";

/*
 * Standard content container (DESIGN_GUIDELINES.md §6): max content width
 * ~1440px with a fluid outer gutter. Full-bleed sections opt out by not
 * using this.
 */
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "header" | "footer" | "main" | "article" | "nav";
}

export function Container({
  as: Tag = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[90rem] px-[clamp(1.25rem,5vw,6rem)]",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
