import { Children, isValidElement, type ReactNode } from "react";
import { StaggerGroup } from "@/components/motion";
import { stagger, distance, durations } from "@/lib/motion/tokens";
import { Plate } from "./Plate";
import { CHEVRON_RIGHT, CHEVRON_LEFT } from "@/lib/diagram/grid";
import { FlowNode, type FlowNodeProps } from "./Flow";
import type { PlateProps } from "@/lib/diagram/types";

/*
 * <Landscape>: a positioning. Two camps, and the gap neither of them covers.
 *
 * Deliberately NOT a <Flow> with three columns: a flow asserts direction and
 * sequence, and this shape asserts neither. What it asserts is that something
 * sits BETWEEN two things, which is why the gap has to stay physically between
 * the camps at every width, including when the plate stacks on a phone.
 *
 * There is no draw-on here. There is no direction to trace, and animating the
 * gap's boundary would be animating an absence.
 */

export interface LandscapeCampProps {
  label: string;
  note?: string;
  /** Chevron on the camp's INNER edge: this camp is moving toward the seam.
   *  Only set it where the copy actually says so. */
  lean?: boolean;
  children?: ReactNode;
}
export const LandscapeCamp: (p: LandscapeCampProps) => null = () => null;

export interface LandscapeGapProps {
  label: string;
  note?: string;
  /** "intent" hatches the occupant instead of filling it: a concept project
   *  may not be drawn as though it were a third shipping competitor. */
  tone?: "solid" | "intent";
  children?: ReactNode;
}
export const LandscapeGap: (p: LandscapeGapProps) => null = () => null;

function props<T>(node: ReactNode): T | null {
  return isValidElement(node) ? (node.props as T) : null;
}
function kids(children: ReactNode): FlowNodeProps[] {
  return Children.toArray(children)
    .map((c) => props<FlowNodeProps>(c))
    .filter((p): p is FlowNodeProps => p !== null);
}

function Lean({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      className={`dgm-lean dgm-lean--${dir}`}
      width={10}
      height={24}
      viewBox="0 0 10 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={dir === "right" ? CHEVRON_RIGHT : CHEVRON_LEFT}
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function Landscape({
  title,
  alt,
  note,
  replaces,
  children,
}: PlateProps & { children?: ReactNode }) {
  const items = Children.toArray(children);
  const camps: { p: LandscapeCampProps; i: number }[] = [];
  let gap: LandscapeGapProps | null = null;

  items.forEach((c, i) => {
    if (!isValidElement(c)) return;
    if (c.type === LandscapeCamp) camps.push({ p: c.props as LandscapeCampProps, i });
    if (c.type === LandscapeGap) gap = c.props as LandscapeGapProps;
  });

  const g = gap as LandscapeGapProps | null;
  const occupants = g ? kids(g.children) : [];
  const promoted = [...camps.flatMap((c) => kids(c.p.children)), ...occupants].filter(
    (n) => n.promote,
  ).length;
  if (promoted !== 1) {
    const msg = `<Landscape title="${title}"> has ${promoted} promoted nodes, needs exactly 1 (replaces ${replaces}).`;
    if (process.env.NODE_ENV === "production") throw new Error(msg);
    console.warn(msg);
  }

  return (
    <Plate title={title} alt={alt} note={note} replaces={replaces}>
      <StaggerGroup
        as="div"
        className="dgm-landscape"
        stagger={stagger.base}
        y={distance.sm}
        duration={durations.base}
      >
        {camps[0] && <Camp p={camps[0].p} side="left" />}
        {g && (
          <div className={`dgm-gap${g.tone === "intent" ? " dgm-gap--intent" : ""}`}>
            <span className="dgm-gap__label">{g.label}</span>
            <ul className="dgm-gap__items">
              {occupants.map((n) => (
                <li key={n.label} className="dgm-cell">
                  <div
                    className={`dgm-node${n.promote ? " dgm-node--key" : ""}${
                      g.tone === "intent" ? " dgm-node--intent" : ""
                    }`}
                  >
                    <span className="dgm-label">{n.label}</span>
                    {n.note && <span className="dgm-note">{n.note}</span>}
                  </div>
                </li>
              ))}
            </ul>
            {g.note && <span className="dgm-gap__note">{g.note}</span>}
          </div>
        )}
        {camps[1] && <Camp p={camps[1].p} side="right" />}
      </StaggerGroup>
    </Plate>
  );
}

function Camp({ p, side }: { p: LandscapeCampProps; side: "left" | "right" }) {
  return (
    <div className={`dgm-camp dgm-camp--${side}`}>
      <span className="dgm-camp__label">{p.label}</span>
      {p.note && <span className="dgm-camp__note">{p.note}</span>}
      <ul className="dgm-camp__items">
        {kids(p.children).map((n) => (
          <li key={n.label} className="dgm-cell">
            <div className={`dgm-node${n.promote ? " dgm-node--key" : ""}`}>
              <span className="dgm-label">{n.label}</span>
              {n.note && <span className="dgm-note">{n.note}</span>}
            </div>
          </li>
        ))}
      </ul>
      {p.lean && <Lean dir={side === "left" ? "right" : "left"} />}
    </div>
  );
}

export { FlowNode };
