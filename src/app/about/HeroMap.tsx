"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * Full-bleed "motion map" — the About hero's background. A bespoke, abstract city
 * locator drawn as crisp inline SVG (NOT a literal map tile): a faint lat/long
 * graticule, faint district blocks, a road network in two weights, and a precise
 * crosshair marker on Kolkata with live-ticking coordinates. Structure is inspired
 * by a monochrome Google-Maps style (roads / blocks), but it stays in the dark
 * system — near-white linework on near-black, luminance not hue (DESIGN_GUIDELINES
 * §4); the marker is the single brightest point, no accent.
 *
 * Motion (§7, transform/opacity only): a locator ping, one LINEAR scan sweep with
 * a soft trailing gradient, a slow graticule "breathe", two great-circle arcs that
 * fade, and pointer parallax across three depth layers.
 *
 * GUARDRAILS: one GSAP master timeline paused via IntersectionObserver off-screen;
 * transform/opacity only; box reserved by the hero (no CLS); aria-hidden (the real
 * facts are readable text in the hero HUD). The marker, coordinates and PS mark are
 * SVG so they track the marker exactly under preserveAspectRatio="slice" + parallax.
 * Under prefers-reduced-motion no timeline is built — animated layers start at
 * opacity 0, leaving one composed static frame.
 */

// Marker — Kolkata, on the right of the wide viewBox (clear of the left-hand text).
const MX = 252;
const MY = 104;
const LAT = 22.5726; // °N
const LNG = 88.3639; // °E

// Faint lat/long graticule.
const GX = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const GY = [30, 60, 90, 120, 150, 180, 210];

// Abstract district blocks (faint fills) — city texture, not real geography.
const BLOCKS = [
  [44, 42, 66, 44], [126, 150, 58, 40], [248, 58, 54, 36], [206, 150, 46, 30],
  [300, 120, 44, 52], [150, 40, 50, 36], [40, 150, 56, 44], [300, 40, 44, 40],
] as const;

// Road network. Majors are brighter/heavier; minors fainter/thinner. A small
// "downtown" grid clusters near the marker.
const ROADS_MAJOR = [
  "M0 86 L360 128", "M72 0 L150 240", "M0 202 L360 92", "M210 0 L300 240",
];
const ROADS_MINOR = [
  "M0 150 L360 150", "M120 0 L300 240", "M44 240 L300 0", "M0 56 L360 40",
  // downtown grid near the marker
  "M212 96 L300 96", "M208 130 L304 130", "M232 80 L232 150", "M280 80 L280 150",
];

export function HeroMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Live-ticking coordinates — a settling "GPS fix". Initial render is the exact
  // base value (matches SSR); a client-only interval jitters the last digits.
  const [lat, setLat] = useState(LAT.toFixed(4));
  const [lng, setLng] = useState(LNG.toFixed(4));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setLat((LAT + (Math.random() - 0.5) * 0.0012).toFixed(4));
      setLng((LNG + (Math.random() - 0.5) * 0.0012).toFixed(4));
    }, 1400);
    return () => window.clearInterval(id);
  }, [reduced]);

  // One master timeline; paused off-screen via IntersectionObserver.
  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion()) return; // → composed static frame, no timeline

      const tl = gsap.timeline();
      const origin = `${MX} ${MY}`;

      tl.fromTo(
        ".hm-ping",
        { scale: 0.4, opacity: 0.5, svgOrigin: origin },
        { scale: 6, opacity: 0, svgOrigin: origin, duration: 3.6, ease: "power1.out", repeat: -1, stagger: 1.2 },
        0,
      );

      gsap.set(".hm-scan", { opacity: 1 });
      tl.fromTo(".hm-scan", { x: -80 }, { x: 360, duration: 6.5, ease: "none", repeat: -1 }, 0);

      tl.to(
        ".hm-drift",
        { scale: 1.012, y: 2, svgOrigin: "180 120", duration: 7, ease: "sine.inOut", repeat: -1, yoyo: true },
        0,
      );

      tl.fromTo(
        ".hm-arc",
        { opacity: 0 },
        { opacity: 0.2, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true, repeatDelay: 2.8, stagger: 2.1 },
        0.6,
      );

      const io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? tl.play() : tl.pause()),
        { threshold: 0 },
      );
      if (rootRef.current) io.observe(rootRef.current);
      return () => io.disconnect();
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true },
  );

  // Pointer parallax — depth tilt; the marker intensifies. Fine-pointer only.
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;
      if (!window.matchMedia("(pointer: fine)").matches) return;

      const layer = (sel: string, amp: number) => {
        const el = root.querySelector<SVGGElement>(sel);
        if (!el) return null;
        return {
          x: gsap.quickTo(el, "x", { duration: 0.7, ease: "power2.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.7, ease: "power2.out" }),
          amp,
        };
      };
      const layers = [layer(".hm-bg", 4), layer(".hm-mid", 7), layer(".hm-fg", 11)].filter(
        Boolean,
      ) as { x: (v: number) => void; y: (v: number) => void; amp: number }[];
      const dot = root.querySelector<SVGCircleElement>(".hm-dot");

      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach((l) => {
          l.x(nx * l.amp);
          l.y(ny * l.amp);
        });
        if (dot) gsap.to(dot, { scale: 1.5, svgOrigin: `${MX} ${MY}`, duration: 0.3, overwrite: "auto" });
      };
      const onLeave = () => {
        layers.forEach((l) => {
          l.x(0);
          l.y(0);
        });
        if (dot) gsap.to(dot, { scale: 1, svgOrigin: `${MX} ${MY}`, duration: 0.4, overwrite: "auto" });
      };

      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", onLeave);
      return () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <div ref={rootRef} className="absolute inset-0 h-full w-full text-fg">
      <svg
        viewBox="0 0 360 240"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hm-scan-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.74" stopColor="white" stopOpacity="0" />
            <stop offset="0.96" stopColor="white" stopOpacity="0.08" />
            <stop offset="1" stopColor="white" stopOpacity="0.14" />
          </linearGradient>
        </defs>

        {/* ── Background: blocks + graticule + roads (drifts) ── */}
        <g className="hm-bg">
          <g className="hm-drift">
            <g fill="currentColor" fillOpacity="0.04">
              {BLOCKS.map((b, i) => (
                <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} />
              ))}
            </g>
            <g stroke="currentColor" strokeWidth="1">
              {GX.map((x) => (
                <line key={`x${x}`} x1={x} y1="0" x2={x} y2="240" strokeOpacity={x === 270 ? 0.09 : 0.045} />
              ))}
              {GY.map((y) => (
                <line key={`y${y}`} x1="0" y1={y} x2="360" y2={y} strokeOpacity={y === 90 ? 0.09 : 0.045} />
              ))}
            </g>
            <g stroke="currentColor" strokeLinecap="round" fill="none">
              {ROADS_MINOR.map((d, i) => (
                <path key={`mn${i}`} d={d} strokeWidth="0.75" strokeOpacity="0.12" />
              ))}
              {ROADS_MAJOR.map((d, i) => (
                <path key={`mj${i}`} d={d} strokeWidth="1.3" strokeOpacity="0.2" />
              ))}
            </g>
          </g>
        </g>

        {/* ── Mid: great-circle arcs + scan sweep ── */}
        <g className="hm-mid">
          <path className="hm-arc" d={`M${MX} ${MY} Q 150 20 18 54`} stroke="currentColor" strokeWidth="1" opacity="0" />
          <path className="hm-arc" d={`M${MX} ${MY} Q 320 180 344 226`} stroke="currentColor" strokeWidth="1" opacity="0" />
          <rect className="hm-scan" x="0" y="0" width="80" height="240" fill="url(#hm-scan-grad)" opacity="0" />
        </g>

        {/* ── Foreground: locator pings + marker + coordinates + PS mark ── */}
        <g className="hm-fg">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              className="hm-ping"
              cx={MX}
              cy={MY}
              r="7"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <g stroke="currentColor" fill="none">
            <circle cx={MX} cy={MY} r="8" strokeOpacity="0.55" strokeWidth="1" />
            <line x1={MX - 16} y1={MY} x2={MX + 16} y2={MY} strokeOpacity="0.5" strokeWidth="1" />
            <line x1={MX} y1={MY - 16} x2={MX} y2={MY + 16} strokeOpacity="0.5" strokeWidth="1" />
            <line x1={MX} y1={MY + 8} x2={MX} y2={MY + 18} strokeOpacity="0.3" strokeWidth="1" />
            <circle className="hm-dot" cx={MX} cy={MY} r="2.6" fill="currentColor" stroke="none" />
          </g>

          {/* Instrument micro-readout: live coordinates (decorative). */}
          <g textAnchor="middle" fill="currentColor" className="font-mono">
            <text x={MX} y={MY + 26} fontSize="4.4" letterSpacing="1.1" fillOpacity="0.55">
              LAT / LONG
            </text>
            <text x={MX} y={MY + 34} fontSize="6" letterSpacing="0.4" className="tabular-nums">
              {lat}° N
            </text>
            <text x={MX} y={MY + 42} fontSize="6" letterSpacing="0.4" className="tabular-nums">
              {lng}° E
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
