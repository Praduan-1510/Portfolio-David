"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/*
 * Hero backdrop — flowing grayscale "smoke / liquid" field.
 *
 * A single fullscreen triangle (drei <ScreenQuad>, no camera math, no overdraw)
 * driven by a custom fragment shader: domain-warped fractal noise (FBM) marbles
 * soft grayscale forms as lightness layered over the theme base (uBase = the
 * resolved --bg token, read in HeroBackground) — so it tracks the theme and
 * blends seamlessly with the section. The flow is a slow time uniform (ambient,
 * §7.8) with subtle reactivity to pointer position and scroll progress. No accent
 * colour — grayscale keeps the single-accent rule intact (DESIGN_GUIDELINES §2/§4).
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
// a comfortable 60fps budget for the gated audience (non-coarse-pointer, >4GB,
// dpr capped at 2). Drop to 3, or to a single warp, if a weaker GPU slips the gate.
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

  #define OCTAVES 4
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
    n = smoothstep(0.12, 0.92, n);

    // The smoke is grayscale LIGHTNESS layered above the theme base (uBase = the
    // resolved --bg) rather than absolute grays — so the field always blends
    // seamlessly with the section and tracks the theme. Highlights top out at a
    // soft gray, not white: atmosphere, not a spotlight. Amplitudes are kept
    // deliberately low (~35% below the original) so the marbling reads as quiet
    // depth behind the centred type rather than a high-contrast backdrop; the
    // reading scrim in Hero.tsx handles the final legibility pass over the top.
    float light = mix(0.0, 0.14, n);
    light += smoothstep(0.58, 1.0, n) * 0.065;           // soft highlight crests
    light += 0.03 * smoothstep(0.2, 1.45, length(r));    // marbled liquid veins

    // Soft highlight that follows the pointer (aspect-corrected screen space).
    vec2 sc = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 pc = uPointer * 0.5 * vec2(aspect, 1.0);
    light += 0.028 * smoothstep(0.40, 0.0, distance(sc, pc));

    // Elliptical vignette: fade the smoke out and darken the base toward the
    // edges for depth. Pulled in a touch (0.34→0.92) and deepened at the rim so
    // the field settles into a quieter atmosphere, with the centre — behind the
    // headline — still the calmest, brightest pocket.
    float vig = clamp(1.0 - smoothstep(0.34, 0.92, distance(vUv, vec2(0.5, 0.46))), 0.0, 1.0);
    vec3 col = uBase * mix(0.72, 1.0, vig) + vec3(light * vig);

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
      dpr={[1, 2]}
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
