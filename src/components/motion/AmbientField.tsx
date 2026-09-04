"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";
import { gsap, registerGsap } from "@/lib/motion/gsap";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useReducedMotion";

/*
 * AmbientField — the ledger field.
 *
 * A full-bleed WebGL fragment shader running behind the page: a slow
 * domain-warped pressure field, drifting ledger rules, and sparse cells that
 * "settle" — brighten on their own phase and decay — with a rare flame flicker
 * where one resolves. It is made of the site's own subject matter (ruled
 * ledgers, cells, values landing) rather than the generic gradient blob, so it
 * could not be lifted onto another site without the argument going with it.
 *
 * This is deliberately HEAVY: a real per-pixel shader, not a CSS gradient. The
 * engineering below is what makes heavy survivable rather than what makes it
 * lighter, and every guard is load-bearing:
 *
 *   ONE RAF LOOP. Driven by gsap.ticker — the same ticker that drives Lenis
 *   which drives ScrollTrigger (lib/lenis/gsap-sync.ts). There are zero raw
 *   requestAnimationFrame calls in src/ and this does not add one. A second
 *   scroll/animation clock is the architectural line this site does not cross.
 *
 *   30fps, NOT 60. Ambient motion at this amplitude is indistinguishable at
 *   60fps and costs exactly twice as much. Halving the frame rate is the single
 *   largest saving available and nobody can see it.
 *
 *   RESOLUTION IS THE REAL LEVER. Fill rate, not shader complexity, is what
 *   kills phones: one full-screen RGBA8 pass at native iPhone resolution is
 *   ~11MB written per frame. We render at a fraction of DPR and let the
 *   compositor upscale — invisible on a soft ambient field, and a 0.5x scale is
 *   a 4x cut in pixels shaded.
 *
 *   IT WATCHES ITSELF. A rolling frame-time average degrades the render scale,
 *   then disables the field outright and leaves the static ground behind it.
 *   The page never gets to be slow for more than about a second.
 *
 *   IT STOPS WHEN UNWATCHED. IntersectionObserver plus visibilitychange: no
 *   GPU work while scrolled past or while the tab is in the background, which
 *   is where ambient shaders quietly eat batteries.
 *
 *   IT HAS AN OFF SWITCH. WCAG 2.2.2 (Pause, Stop, Hide) is LEVEL A and applies
 *   to anything that moves automatically for more than five seconds alongside
 *   other content. axe-core does not test it. The control is real, keyboard
 *   reachable, and its state persists.
 *
 *   REDUCED MOTION NEVER STARTS IT. Not "animates to zero" — no context is
 *   created at all, and the static ground underneath is the whole design.
 */

/* ── Shaders (GLSL ES 1.00, so WebGL1 hardware is not excluded) ─────────── */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uAmp;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);

  float t = uTime * 0.03;

  // The pressure behind everything: a domain-warped field that decides where
  // the ledger is currently "active".
  vec2 w = vec2(fbm(p * 1.5 + vec2(0.0, t)), fbm(p * 1.5 + vec2(5.2, -t)));
  float field = fbm(p * 2.1 + w * 0.8);

  // Ruled lines, drifting upward, only visible where the field is up.
  float rows = 58.0;
  float ry = p.y * rows + t * 1.6;
  float rl = abs(fract(ry) - 0.5);
  float rule = smoothstep(0.5, 0.44, rl) * smoothstep(0.30, 0.74, field);

  // Cells that settle: each holds its own phase, brightens fast, decays slow.
  vec2 cells = vec2(rows * aspect * 0.5, rows);
  vec2 cp = vec2(p.x, p.y) * cells + vec2(0.0, t * 1.6);
  vec2 cid = floor(cp);
  vec2 cf = fract(cp);
  float h = hash21(cid);
  float ph = fract(uTime * 0.07 + h);
  float pulse = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.05, 0.55, ph));
  float inCell =
      smoothstep(0.06, 0.30, cf.x) * (1.0 - smoothstep(0.70, 0.94, cf.x)) *
      smoothstep(0.18, 0.42, cf.y) * (1.0 - smoothstep(0.58, 0.82, cf.y));
  float live = step(0.978, h);
  float settle = pulse * inCell * live;

  // Monochrome ink, with the interaction colour reserved for the rare resolve.
  vec3 bone  = vec3(0.968, 0.941, 0.894);
  vec3 flame = vec3(0.984, 0.482, 0.125);

  float accent = step(0.9975, h) * pulse * inCell;
  float ink = rule * 0.115 + field * 0.06 + settle * 0.26;

  // The reading column is the middle of the screen and text has to stay legible
  // over whatever this does, so the field is gated down to a whisper there and
  // runs at full strength only out in the margins. This is what lets the edges
  // be genuinely bright without touching a single contrast ratio.
  float edge = smoothstep(0.13, 0.46, abs(uv.x - 0.5));
  float gate = mix(0.10, 1.0, edge);
  ink *= gate;
  accent *= gate;

  // Hard ceiling on how bright the ground is ever allowed to get. The field
  // sits behind live text, and a settle pulse landing under body copy would
  // otherwise lift the ground far enough to fail contrast for a moment.
  // Derived, not guessed: the site's lowest-contrast text (--muted body copy)
  // measures 6.67:1 on the #0d0d10 ground. Ink of 0.12 raises the ground to
  // about rgb(43,42,44), which puts that text at ~4.9:1 — still clear of the
  // 4.5:1 floor. 0.16 would drop it to 4.31:1, which is why this is 0.12.
  ink = min(ink, 0.12);

  // Premultiplied: colour is already a light CONTRIBUTION, so it composites
  // over the page ground without a matte fringe.
  vec3 col = bone * ink + flame * accent * 0.30;
  float alpha = clamp(ink + accent * 0.30, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha) * uAmp;
}
`;

/* ── Tuning ─────────────────────────────────────────────────────────────── */

const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;
/** Render scales tried in order; index 0 is the best-looking. */
const SCALES = [0.7, 0.5, 0.34];
/** A frame budget generous enough that only genuine trouble trips it. */
const SLOW_FRAME_MS = 22;
/** Consecutive slow frames before degrading a step. */
const SLOW_STREAK = 24;
const STORAGE_KEY = "ambient-field:paused";
/** Same-tab notification; `storage` only fires in OTHER tabs. */
const PAUSE_EVENT = "ambient-field:change";

function readPaused(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false; // blocked storage: default to running
  }
}

function subscribePaused(onChange: () => void): () => void {
  window.addEventListener(PAUSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PAUSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[AmbientField] shader compile failed:", gl.getShaderInfoLog(sh));
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function AmbientField({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // The stored preference, read through useSyncExternalStore like the site's
  // other environment hooks (useMediaQuery, useReducedMotion). This gives the
  // first CLIENT render the real value — so a visitor who turned the field off
  // never gets a context created for one frame — while the server renders the
  // running default.
  const paused = useSyncExternalStore(subscribePaused, readPaused, () => false);
  // Set when the watchdog gives up, so the control can tell the truth.
  const [degraded, setDegraded] = useState(false);

  const toggle = useCallback(() => {
    const next = !readPaused();
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* private mode: the toggle still works for this session */
    }
    window.dispatchEvent(new Event(PAUSE_EVENT));
  }, []);

  useEffect(() => {
    // Reduced motion never creates a context, and neither does the off state.
    if (paused) return;
    if (reduced || prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const gl = (canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    if (!gl) {
      setDegraded(true); // no WebGL: the static ground is the design
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram() : null;
    if (!vs || !fs || !prog) {
      setDegraded(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setDegraded(true);
      return;
    }
    gl.useProgram(prog);

    // One oversized triangle covers the viewport with no index buffer and no
    // diagonal seam — cheaper than two triangles and the standard trick.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uAmp = gl.getUniformLocation(prog, "uAmp");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied
    gl.clearColor(0, 0, 0, 0);

    let scaleIdx = 0;
    let disposed = false;
    let visible = true;
    let slowStreak = 0;
    let last = 0;
    let elapsed = 0;
    let amp = 0; // fades up so the field arrives instead of popping

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const s = SCALES[scaleIdx];
      const w = Math.max(1, Math.round(host.clientWidth * dpr * s));
      const h = Math.max(1, Math.round(host.clientHeight * dpr * s));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      if (document.hidden) last = 0;
    };
    document.addEventListener("visibilitychange", onVisibility);

    // A lost context is a normal event on mobile Safari, not an error state.
    const onLost = (e: Event) => {
      e.preventDefault();
      disposed = true;
      setDegraded(true);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    registerGsap();

    const tick = () => {
      if (disposed) return;
      if (!visible || document.hidden) {
        last = 0;
        return;
      }
      const now = gsap.ticker.time * 1000;
      if (last === 0) {
        last = now;
        return;
      }
      const dt = now - last;
      if (dt < FRAME_MS) return; // 30fps throttle
      last = now;
      elapsed += dt / 1000;

      // Watchdog: sustained slow frames drop resolution, then give up.
      if (dt > SLOW_FRAME_MS + FRAME_MS) {
        slowStreak += 1;
        if (slowStreak >= SLOW_STREAK) {
          slowStreak = 0;
          if (scaleIdx < SCALES.length - 1) {
            scaleIdx += 1;
            resize();
          } else {
            disposed = true;
            setDegraded(true);
            return;
          }
        }
      } else if (slowStreak > 0) {
        slowStreak -= 1;
      }

      amp = Math.min(1, amp + dt / 1400);
      // Clear first: without this each frame blends over the previous one, which
      // smears the settle pulses into streaks and drifts the field brighter than
      // the shader constants claim.
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uAmp, amp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    gsap.ticker.add(tick);

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Free the drawing buffer immediately rather than waiting for GC.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [paused, reduced]);

  // Under reduced motion the control would offer to pause something that never
  // starts, so the whole apparatus stays out of the page.
  if (reduced) return null;

  const running = !paused && !degraded;

  return (
    <>
      <div
        ref={hostRef}
        aria-hidden="true"
        className={cn("pointer-events-none fixed inset-0 -z-10", className)}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{
            // The shader fades itself in; this keeps the element out of the
            // way entirely when it is not running.
            opacity: running ? 1 : 0,
            transition: "opacity var(--dur-slower, 900ms) var(--ease-out-expo, ease-out)",
          }}
        />
      </div>

      {/* WCAG 2.2.2 (Level A) — Pause, Stop, Hide. This moves automatically,
          runs well past five seconds, and sits alongside content, so an off
          switch is required, not a courtesy. Hidden only when the field has
          already given up, because then there is nothing left to stop. */}
      {!degraded && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={paused}
          className="group fixed bottom-space-4 right-space-4 z-40 inline-flex min-h-[44px] items-center gap-space-2 rounded-[2px] border border-line bg-bg px-space-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted transition-colors duration-fast ease-out-quad hover:border-line-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-[6px] w-[6px] rounded-full transition-colors duration-fast",
              running ? "bg-signal" : "bg-muted",
            )}
          />
          {paused ? "Motion off" : "Motion on"}
        </button>
      )}
    </>
  );
}
