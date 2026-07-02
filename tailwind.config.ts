import type { Config } from "tailwindcss";

/*
 * Tailwind maps utilities to the CSS variables defined in src/app/globals.css,
 * so the tokens have a single source of truth (ARCHITECTURE.md §5).
 * Components consume SEMANTIC tokens (bg, fg, accent, …), never raw primitives.
 * Per-project theming = remap --accent (and optionally --bg/--fg) on a route.
 */
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx,mdx}",
    "./src/content/**/*.mdx",
  ],
  theme: {
    extend: {
      // ---- Semantic colors (DESIGN_GUIDELINES.md §4) ----
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        surface: "var(--surface)",
        bezel: "var(--bezel)", // component layer — phone-frame device body/notch
        line: "var(--line)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        "on-accent": "var(--on-accent)",
        // Interaction signal — the site-wide neon-green hover/affordance colour.
        neon: "var(--neon)",
      },

      // Neon glow for card hovers (pairs with border-neon / the .card-neon class).
      boxShadow: {
        neon: "0 0 0 1px var(--neon), 0 0 34px -8px var(--neon-glow)",
        "neon-soft": "0 0 28px -10px var(--neon-glow)",
      },

      // ---- Fluid type scale (DESIGN_GUIDELINES.md §5) ----
      // clamp() so type scales between mobile and desktop without breakpoints.
      fontSize: {
        "display-xl": ["clamp(2.75rem, 7vw, 7rem)", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "display-l": ["clamp(2.25rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "heading-l": ["clamp(1.75rem, 3.2vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        heading: ["clamp(1.5rem, 2.5vw, 2.25rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "heading-s": ["clamp(1.25rem, 1.6vw, 1.5rem)", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "body-l": ["clamp(1.125rem, 1.4vw, 1.375rem)", { lineHeight: "1.6" }],
        body: ["1.0625rem", { lineHeight: "1.6" }],
        caption: ["0.8125rem", { lineHeight: "1.4" }],
      },

      // ---- Spacing scale, 4px base (DESIGN_GUIDELINES.md §6) ----
      // 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192 → space-1 … space-11
      spacing: {
        "space-1": "0.25rem", // 4px
        "space-2": "0.5rem", // 8px
        "space-3": "0.75rem", // 12px
        "space-4": "1rem", // 16px
        "space-5": "1.5rem", // 24px
        "space-6": "2rem", // 32px
        "space-7": "3rem", // 48px
        "space-8": "4rem", // 64px
        "space-9": "6rem", // 96px
        "space-10": "8rem", // 128px
        "space-11": "12rem", // 192px
      },

      // ---- Font families wired to next/font CSS variables (§5) ----
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      // ---- Easing curves (DESIGN_GUIDELINES.md §7.2) ----
      transitionTimingFunction: {
        "out-expo": "var(--ease-out-expo)",
        "in-out-quart": "var(--ease-in-out-quart)",
        "out-quad": "var(--ease-out-quad)",
        "out-back": "var(--ease-out-back)",
      },

      // ---- Duration scale (DESIGN_GUIDELINES.md §7.3) ----
      transitionDuration: {
        instant: "100ms",
        fast: "200ms",
        base: "350ms",
        slow: "600ms",
        slower: "900ms",
        ambient: "1200ms",
      },

      // ---- Keyframes / animations (DESIGN_GUIDELINES.md §7.8 ambient) ----
      // Marquee: translate a duplicated track by exactly one copy (-50%) and
      // loop. Linear (constant velocity); easing a continuous loop reads broken.
      keyframes: {
        "marquee-x": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // Instrument HUD (About). Transform/opacity only; the global
        // prefers-reduced-motion rule freezes it to a calm static frame.
        "status-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
      },
      animation: {
        "marquee-x": "marquee-x 40s linear infinite",
        "status-pulse": "status-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
