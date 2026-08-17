import { Children, isValidElement, type ReactNode } from "react";
import { StaggerGroup, DrawIn } from "@/components/motion";
import { stagger, distance, durations } from "@/lib/motion/tokens";
import { Plate } from "./Plate";
import { fanY, fanPath, CHEVRON_RIGHT, CHEVRON_DOWN } from "@/lib/diagram/grid";
import type { PlateProps, EdgeStyle, NodeKind } from "@/lib/diagram/types";

/*
 * <Flow>: a sequence, a comparison of sequences, or a convergence.
 *
 * Authors write declarative markers. FlowNode / FlowTrack / FlowGroup render
 * NOTHING themselves: Flow reads their props via React.Children and emits the
 * real markup, because the geometry depends on the whole child list (how many
 * stages there are, how many strands the fan needs). Diagram text is therefore
 * plain strings by design, which is also what keeps every label in the DOM.
 */

export interface FlowNodeProps {
  /** Mono kicker above the label: the stage name, or the actor. */
  kicker?: string;
  /** The node's name, one to three words. MUST be quoted from the .mdx. */
  label: string;
  /** One clause, never a sentence. MUST be quoted from the .mdx. */
  note?: string;
  /** A figure this node carries: mono, tabular. */
  value?: string;
  /** "gate" draws the accountant's double rule on the leading edge. */
  kind?: NodeKind;
  /** Label on the edge ARRIVING at this node. */
  edge?: string;
  /** "soft" dashes the arriving edge, meaning NOT VERIFIED. It also does not
   *  draw on: animating a dash pattern destroys it, and the confident draw-on
   *  belongs to paths that are real. */
  edgeStyle?: EdgeStyle;
  /** Sets this row in the tertiary ink: the baseline being argued against. */
  quiet?: boolean;
  /** THE one promoted element. Exactly one per plate. */
  promote?: boolean;
}
export const FlowNode: (p: FlowNodeProps) => null = () => null;

export interface FlowTrackProps {
  /** Row label, set on the track's leading rule. */
  label: string;
  children?: ReactNode;
}
export const FlowTrack: (p: FlowTrackProps) => null = () => null;

export interface FlowGroupProps {
  /** Optional label on the group's bracket. */
  label?: string;
  children?: ReactNode;
}
export const FlowGroup: (p: FlowGroupProps) => null = () => null;

/* ── internals ─────────────────────────────────────────────────────────── */

function props<T>(node: ReactNode): T | null {
  return isValidElement(node) ? (node.props as T) : null;
}
function kids<T>(children: ReactNode): T[] {
  return Children.toArray(children)
    .map((c) => props<T>(c))
    .filter((p): p is T => p !== null);
}

/*
 * The arriving edge: a stretch shaft plus a fixed-size chevron glyph.
 *
 * BOTH orientations are rendered and CSS shows one, which looks wasteful and is
 * the only correct option. The chain's direction is decided by a MEDIA QUERY
 * (horizontal from xl, vertical below, see globals.css), so a JS `vertical`
 * prop can never agree with it: this component previously took one, defaulted
 * it to false, and was never passed anything, so every stacked chain drew a
 * right-pointing arrow across a downward flow. CHEVRON_DOWN and the
 * `dgm-edge--v` class were both written for that switch and neither was ever
 * reachable (`dgm-edge--v` has no rule in the stylesheet at all).
 *
 * Rotating one glyph instead would be fewer nodes and wrong: the shaft is a
 * preserveAspectRatio="none" STRETCH piece that has to stretch along the flow
 * axis, and rotating it stretches the other one.
 */
function Edge({ style = "solid", label }: { style?: EdgeStyle; label?: string }) {
  const soft = style === "soft";
  // A dashed shaft means NOT VERIFIED and deliberately does not draw on:
  // animating a dash pattern destroys it.
  const draw = soft ? {} : { pathLength: 1, "data-draw": "" };
  return (
    <span className={`dgm-edge${soft ? " dgm-edge--soft" : ""}`} aria-hidden="true">
      <svg
        className="dgm-edge__shaft dgm-edge__shaft--h"
        viewBox="0 0 24 24"
        preserveAspectRatio="none"
        focusable="false"
      >
        <line x1="0" y1="12" x2="24" y2="12" {...draw} />
      </svg>
      <svg
        className="dgm-edge__head dgm-edge__head--h"
        width={10}
        height={24}
        viewBox="0 0 10 24"
        focusable="false"
      >
        <path d={CHEVRON_RIGHT} strokeLinejoin="miter" strokeLinecap="butt" />
      </svg>
      <svg
        className="dgm-edge__shaft dgm-edge__shaft--v"
        viewBox="0 0 24 24"
        preserveAspectRatio="none"
        focusable="false"
      >
        <line x1="12" y1="0" x2="12" y2="24" {...draw} />
      </svg>
      <svg
        className="dgm-edge__head dgm-edge__head--v"
        width={24}
        height={10}
        viewBox="0 0 24 10"
        focusable="false"
      >
        <path d={CHEVRON_DOWN} strokeLinejoin="miter" strokeLinecap="butt" />
      </svg>
      {label && <span className="dgm-edge__label">{label}</span>}
    </span>
  );
}

function Node({ n, withEdge }: { n: FlowNodeProps; withEdge: boolean }) {
  const cls = [
    "dgm-node",
    n.promote ? "dgm-node--key" : "",
    n.kind === "gate" ? "dgm-node--gate" : "",
    n.quiet ? "dgm-node--quiet" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <li className="dgm-cell">
      {withEdge && <Edge style={n.edgeStyle} label={n.edge} />}
      <div className={cls}>
        {n.kicker && <span className="dgm-kicker">{n.kicker}</span>}
        <span className="dgm-label">{n.label}</span>
        {n.value && <span className="dgm-value">{n.value}</span>}
        {n.note && <span className="dgm-note">{n.note}</span>}
      </div>
    </li>
  );
}

/** A converging fan: N gapless sources on the left, one target on the right. */
function Fan({ n }: { n: number }) {
  return (
    <svg
      className="dgm-fan"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={fanPath(fanY(i, n))} pathLength={1} data-draw="" />
      ))}
    </svg>
  );
}

export function Flow({
  title,
  alt,
  note,
  replaces,
  children,
}: PlateProps & { children?: ReactNode }) {
  const items = Children.toArray(children);
  const tracks = items
    .map((c) => props<FlowTrackProps>(c))
    .filter((p): p is FlowTrackProps => !!p && typeof p.label === "string" && "children" in p);
  const isTracked =
    tracks.length >= 2 &&
    items.every((c) => isValidElement(c) && c.type === FlowTrack);
  const groups = items.filter((c) => isValidElement(c) && c.type === FlowGroup);

  // Exactly one promoted element per plate. Zero is also an error: a plate that
  // cannot name the one thing it is arguing about should be a sentence.
  const all: FlowNodeProps[] = isTracked
    ? tracks.flatMap((t) => kids<FlowNodeProps>(t.children))
    : items.flatMap((c) =>
        isValidElement(c) && c.type === FlowGroup
          ? kids<FlowNodeProps>((c.props as FlowGroupProps).children)
          : [props<FlowNodeProps>(c)].filter((p): p is FlowNodeProps => p !== null),
      );
  const promoted = all.filter((n) => n.promote).length;
  /* An edge label has to live in the GAP between two cells, and the default gap
     (2-3rem) cannot hold one: at 13px mono with 0.14em tracking, anything past
     about five characters wraps and then collides with the node it labels. So a
     labelled chain widens its own gap rather than silently overlapping, and the
     class is set here because only Flow can see whether any label exists. */
  const labelled = all.some((n) => !!n.edge);
  if (promoted !== 1) {
    const msg = `<Flow title="${title}"> has ${promoted} promoted nodes, needs exactly 1 (replaces ${replaces}).`;
    if (process.env.NODE_ENV === "production") throw new Error(msg);
    console.warn(msg);
  }

  return (
    <Plate title={title} alt={alt} note={note} replaces={replaces}>
      {isTracked ? (
        <StaggerGroup
          as="div"
          className="dgm-tracks"
          stagger={stagger.tight}
          y={distance.sm}
          duration={durations.base}
        >
          {tracks.map((t) => {
            const nodes = kids<FlowNodeProps>(t.children);
            return (
              <div key={t.label} className="dgm-track">
                <span className="dgm-track__label">{t.label}</span>
                <DrawIn
                  className="dgm-scroll"
                  stagger={stagger.tight}
                  duration={durations.slow}
                  delay={0.08}
                >
                  <ol
                    className={`dgm-chain${labelled ? " dgm-chain--labelled" : ""}`}
                    style={{ "--dgm-n": nodes.length } as React.CSSProperties}
                  >
                    {nodes.map((n, i) => (
                      <Node key={n.label} n={n} withEdge={i > 0} />
                    ))}
                  </ol>
                </DrawIn>
              </div>
            );
          })}
        </StaggerGroup>
      ) : groups.length > 0 ? (
        <DrawIn className="dgm-converge" stagger={stagger.tight} duration={durations.slow}>
          {items.map((c, ci) => {
            const g = props<FlowGroupProps>(c);
            if (isValidElement(c) && c.type === FlowGroup && g) {
              const sources = kids<FlowNodeProps>(g.children);
              return (
                <div key={ci} className="dgm-group">
                  {g.label && <span className="dgm-group__label">{g.label}</span>}
                  <ul className="dgm-group__items">
                    {sources.map((n) => (
                      <Node key={n.label} n={n} withEdge={false} />
                    ))}
                  </ul>
                  <Fan n={sources.length} />
                </div>
              );
            }
            const n = props<FlowNodeProps>(c);
            return n ? (
              <ul key={ci} className="dgm-target">
                <Node n={n} withEdge={false} />
              </ul>
            ) : null;
          })}
        </DrawIn>
      ) : (
        <StaggerGroup
          as="div"
          className="dgm-scroll"
          stagger={stagger.tight}
          y={distance.sm}
          duration={durations.base}
        >
          <DrawIn stagger={stagger.tight} duration={durations.slow} delay={0.08}>
            <ol
              className={`dgm-chain${labelled ? " dgm-chain--labelled" : ""}`}
              style={{ "--dgm-n": all.length } as React.CSSProperties}
            >
              {all.map((n, i) => (
                <Node key={n.label} n={n} withEdge={i > 0} />
              ))}
            </ol>
          </DrawIn>
        </StaggerGroup>
      )}
    </Plate>
  );
}
