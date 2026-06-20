"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/*
 * Hero backdrop — flowing "liquid aurora" field in the site spectrum.
 *
 * A single fullscreen triangle (drei <ScreenQuad>, no camera math, no overdraw)
 * driven by a custom fragment shader: domain-warped fractal noise (FBM) marbles
 * soft organic forms, tinted with the site's five signature hues (the spectrum,
 * globals.css --spectrum-*) so the marbling reads as a slow, living aurora over
 * the theme base (uBase = the resolved --bg token, read in HeroBackground). Colour
 * concentrates in the bright crests and stays calmer dead-centre so the white
 * wordmark over it remains legible (the Hero reading-scrim does the final pass).
 * The flow is a slow time uniform (ambient, §7.8) with subtle reactivity to
 * pointer position and scroll progress.
 *
 * The hero is the one DELIBERATE exception to the monochrome chrome / "colour
 * belongs to the work" rule (DESIGN_GUIDELINES §2/§4): the backdrop paints the
 * spectrum as a field rather than a thin signal mark — quiet atmosphere, not a
 * spotlight — so the entrance still leads with type while feeling alive.
 *
 * This module is the heavy chunk; it is only ever loaded via next/dynamic
 * (ssr:false) from HeroBackground, so it never blocks first paint, and the Canvas
 * pauses (frameloop "never") when offscreen or the tab is hidden (ARCHITECTURE.md
 * §7.6). The static grayscale fallback in HeroBackground matches this shader's
 * resting tone, so the gated path looks continuous with the live one.
 */

// ScreenQuad's geometry is a clip-space triangle (positions already in NDC), so
// the vertex stage just passes position through — no projection/modelView.
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// OCTAVES is the cost knob: each octave is one simplex sample, and the domain
// warp evaluates FBM 5× per pixel (q.xy, r.xy, final). 4 octaves → 20 samples,
// down from 4. Lighter on weaker/integrated GPUs, and the soft scrimmed aurora
// looks essentially identical. Paired with the dpr 1.5 cap on the Canvas below.
const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uPointer;   // smoothed, NDC [-1,1]
  uniform float uScroll;    // smoothed hero scroll progress [0,1]
  uniform vec3  uBase;      // resolved theme --bg (sRGB 0..1); smoke adds light above it
  varying vec2  vUv;

  // 2D simplex noise (Ashima / Stefan Gustavson, public domain). Gradient noise
  // gives smoke a softer, less blocky character than value noise.
  vec3 permute(vec3 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  #define OCTAVES 3
  float fbm(vec2 p){
    float v = 0.0;
    float amp = 0.55;
    // Irrational rotation per octave breaks up axis-aligned noise artifacts.
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < OCTAVES; i++){
      v += amp * snoise(p);
      p = rot * p * 2.0;
      amp *= 0.5;
    }
    return v; // ~[-1, 1]
  }

  // ── Site spectrum (globals.css --spectrum-*), normalised sRGB ───────────────
  // The hero backdrop is the one deliberate place the five signature hues paint a
  // FIELD rather than a thin signal mark — a living aurora behind the wordmark.
  const vec3 C_VIOLET = vec3(0.663, 0.545, 1.000); // #a98bff
  const vec3 C_BLUE   = vec3(0.275, 0.706, 0.941); // #46b4f0
  const vec3 C_LIME   = vec3(0.788, 0.914, 0.294); // #c9e94b
  const vec3 C_AMBER  = vec3(0.969, 0.647, 0.231); // #f7a53b
  const vec3 C_ROSE   = vec3(1.000, 0.369, 0.561); // #ff5e8f

  // Cyclic 5-stop spectrum. t wraps, so an animated hue flows
  // violet→blue→lime→amber→rose→violet with no seam.
  vec3 spectrumLoop(float t){
    float x = fract(t) * 5.0;
    if (x < 1.0) return mix(C_VIOLET, C_BLUE,   x);
    if (x < 2.0) return mix(C_BLUE,   C_LIME,   x - 1.0);
    if (x < 3.0) return mix(C_LIME,   C_AMBER,  x - 2.0);
    if (x < 4.0) return mix(C_AMBER,  C_ROSE,   x - 3.0);
    return            mix(C_ROSE,   C_VIOLET, x - 4.0);
  }

  void main(){
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    // Aspect-corrected, centered coords so the forms stay isotropic on any ratio.
    vec2 p = (vUv - 0.5);
    p.x *= aspect;
    p *= 2.6; // base scale of the marbled forms

    // Subtle reactivity: the field drifts toward the pointer (parallax) and the
    // smoke shifts as the hero scrolls away. Both stay gentle (§7.7/§7.8).
    p += uPointer * 0.18;
    p.y += uScroll * 0.45;

    float t = uTime * 0.06; // slow, ambient flow
    vec2 flow = vec2(t, t * 0.7);

    // Domain warp (Inigo Quilez "marble"): warp the sample domain by FBM, twice,
    // to get the flowing liquid/smoke marbling rather than plain cloud noise.
    vec2 q = vec2(
      fbm(p + flow),
      fbm(p + flow + vec2(5.2, 1.3))
    );
    vec2 r = vec2(
      fbm(p + 1.7 * q + vec2(1.7, 9.2) - flow * 0.4),
      fbm(p + 1.7 * q + vec2(8.3, 2.8) + flow * 0.25)
    );
    float f = fbm(p + 1.8 * r);

    // Shape contrast softly — premium, low-contrast, never harsh.
    float n = clamp(f * 0.5 + 0.5, 0.0, 1.0);
    n = smoothstep(0.08, 0.95, n);

    // HUE flows through the spectrum across space + slow time. It's driven by the
    // warp field (so colour follows the marbling into smooth, large regions), with
    // a gentle diagonal positional bias for a warm→cool sweep; uTime slowly cycles
    // the whole field through the palette so the aurora keeps drifting.
    float hue = 0.50 * r.x + 0.34 * q.y + 0.13 * (vUv.x + vUv.y) + uTime * 0.018;
    vec3 chroma = spectrumLoop(hue);

    // Colour concentrates in the bright marbled crests and falls to the dark base
    // in the troughs, so the field reads as luminous aurora/liquid, not a flat wash.
    float glow = smoothstep(0.28, 1.0, n);
    glow += 0.6 * smoothstep(0.60, 1.0, n);  // hotter cores in the brightest crests

    // Keep the centre (behind the headline) calmer so white type stays legible;
    // colour blooms in a halo around it. The Hero reading-scrim adds the final pass.
    float dC = distance(vUv, vec2(0.5, 0.46));
    float centerDamp = mix(0.40, 1.0, smoothstep(0.05, 0.60, dC));

    // Elliptical vignette: fade the field + darken the base toward the edges for depth.
    float vig = clamp(1.0 - smoothstep(0.34, 0.98, dC), 0.0, 1.0);

    // Compose: dark theme base (darkened at the rim) + the colour aurora + a few
    // faint white glints on the very brightest crests for a wet, liquid sheen.
    vec3 col = uBase * mix(0.66, 1.0, vig);
    col += chroma * glow * 0.62 * centerDamp * vig;
    col += vec3(smoothstep(0.74, 1.0, n) * 0.05 * vig);

    // Soft bloom following the pointer, tinted to the local hue (aspect-corrected).
    vec2 sc = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 pc = uPointer * 0.5 * vec2(aspect, 1.0);
    col += chroma * smoothstep(0.42, 0.0, distance(sc, pc)) * 0.12 * vig;

    // Ordered-ish dither: near-black gradients band badly on 8-bit displays;
    // ±1/255 of hashed noise hides the steps without visible grain.
    float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    col += (dither - 0.5) / 255.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function SmokeField({ baseColor }: { baseColor?: [number, number, number] }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const size = useThree((s) => s.size);

  // Initial uniform values — R3F seeds the material from this once on mount.
  // IMPORTANT: per-frame updates must write to the MATERIAL's own uniforms (via
  // matRef), not this object. R3F's applyProps copies each uniform with
  // `{ ...uniform }` on apply, so scalar uniforms (uTime/uScroll) get their value
  // copied by value — mutating this object would never reach the GPU and the
  // flow would freeze. (Vector uniforms survive only by shared reference.)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      // Seeded near-black; HeroBackground passes the real resolved --bg below.
      uBase: { value: new THREE.Vector3(0.05, 0.05, 0.06) },
    }),
    [],
  );

  // Keep the resolution uniform in sync for aspect-correct, isotropic noise.
  useEffect(() => {
    matRef.current?.uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height]);

  // Track the theme base tone (resolved --bg from HeroBackground) so the smoke's
  // near-black always matches the section background — no hardcoded grays.
  useEffect(() => {
    if (baseColor) {
      matRef.current?.uniforms.uBase.value.set(
        baseColor[0],
        baseColor[1],
        baseColor[2],
      );
    }
  }, [baseColor]);

  // Track the pointer at the window level: the hero content overlays the canvas
  // (z-10 above z-0), so R3F's own pointer events wouldn't fire over the text.
  // The listener only writes a raw target (cheap); smoothing happens in the rAF
  // loop below, not per mousemove (ARCHITECTURE.md §7.5).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerTarget.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    const d = Math.min(delta, 0.05); // clamp so a resumed tab/scroll never jumps
    // Frame-rate-independent smoothing — same settle time at 60Hz and 120Hz.
    const ease = (k: number) => 1 - Math.pow(1 - k, d * 60);
    u.uTime.value += d;
    u.uPointer.value.lerp(pointerTarget.current, ease(0.05));
    const target =
      typeof window !== "undefined"
        ? Math.min(window.scrollY / window.innerHeight, 1)
        : 0;
    u.uScroll.value += (target - u.uScroll.value) * ease(0.1);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        depthTest={false}
        depthWrite={false}
      />
    </ScreenQuad>
  );
}

export function HeroCanvas({
  active,
  baseColor,
  onContextLost,
}: {
  active: boolean;
  baseColor?: [number, number, number];
  onContextLost?: () => void;
}) {
  return (
    <Canvas
      // Pause the RAF loop when offscreen/hidden — last frame is retained.
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      // No geometry edges in a fullscreen shader, so MSAA buys nothing — skip it.
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        // Degrade gracefully on GPU context loss (more likely since we
        // pause/resume the frameloop): let the browser try to restore, and
        // drop to the static fallback in the meantime.
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true },
        );
      }}
    >
      <SmokeField baseColor={baseColor} />
    </Canvas>
  );
}
