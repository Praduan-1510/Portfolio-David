# Architecture — Portfolio

> **What this is:** the technical architecture and build plan. It defines *how the portfolio is constructed* — stack, structure, the motion system's internals, performance discipline, and a phased roadmap.
>
> **How to use it with Claude Code:** keep at repo root alongside `DESIGN_GUIDELINES.md`. Reference both in prompts. This file is the source of truth for structure and tooling; the guidelines file is the source of truth for look and motion behavior. Build in the phase order in §18 — don't let Claude Code generate the whole site in one shot; ship section by section and review.

---

## 1. Stack

All versions/licensing verified current as of mid-2026.

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | SSR/SSG, image optimization, routing, metadata. |
| Language | **TypeScript** (strict) | |
| UI runtime | **React 19** | Concurrent features; all libs below are React-19 compatible. |
| Styling | **Tailwind CSS** + CSS variables | Tokens live as CSS vars; Tailwind config maps to them (§5). |
| Component motion | **Motion** (`motion`, import `motion/react`) v12 | Formerly Framer Motion; MIT. Enter/exit, layout, gestures, `whileInView`, `AnimatePresence`. |
| Timeline / scroll motion | **GSAP 3.13** + `@gsap/react` | **Now 100% free incl. all plugins** (ScrollTrigger, ScrollSmoother, SplitText, Flip, DrawSVG, MorphSVG) since Apr 2025. Use `useGSAP` hook. |
| Smooth scroll | **Lenis** (`lenis`, import `lenis/react`) v1.3+ | ~3KB, by Darkroom Engineering. Drives ScrollTrigger (§7.3). Old `@studio-freight/*` packages are deprecated — use `lenis`. |
| 3D / WebGL | **Three.js** + **React Three Fiber** + **drei** | **In-scope for this (maximal) build** — likely the hero signature and/or transitions. Always lazy-loaded, isolated, reduced-motion-safe (§7.6). |
| Content | **MDX** (`next-mdx-remote` or `@next/mdx`) | Case studies as MDX. Swap to a headless CMS later if you want non-dev editing (§9). |
| Fonts | **`next/font`** (self-hosted) | Zero layout shift, no external requests. |
| Deploy | **Vercel** | First-class Next.js support, previews per PR, edge CDN. Netlify/Cloudflare also fine. |

**Install (once scaffolded):**
```bash
npx create-next-app@latest   # TypeScript, ESLint, Tailwind, src/, App Router, alias @/*
npm i motion gsap @gsap/react lenis
# optional 3D:
npm i three @react-three/fiber @react-three/drei
```

---

## 2. Why this stack for motion-heavy work
- **Next.js** gives SSG/SSR + `next/image` + `next/font`, which directly serve the performance budget (LCP, CLS) that a heavy-motion site otherwise risks blowing.
- **Two motion libraries on purpose, with clear lanes** (§7): Motion is ergonomic for component/route animation and layout transitions; GSAP+ScrollTrigger is unmatched for scroll-driven timelines, pinning, scrubbing, and text splitting. GSAP going fully free removes the old reason to avoid its premium plugins.
- **Lenis** normalizes scroll and feeds ScrollTrigger from a single RAF loop — this is what makes scroll motion feel "buttery" without fighting the browser.
- This is a deliberately **mainstream, well-documented** stack so Claude Code has dense, current references to draw on.

---

## 3. Project structure

```
portfolio/
├─ public/
│  ├─ fonts/                 # self-hosted woff2
│  ├─ images/  videos/       # static media (large media via next/image)
│  └─ og/                    # social share images
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # root: providers (Lenis, theme), <head>, fonts
│  │  ├─ template.tsx        # page-transition wrapper (optional)
│  │  ├─ globals.css         # tokens (CSS vars) + base styles
│  │  ├─ page.tsx            # home
│  │  ├─ work/
│  │  │  ├─ page.tsx         # work index
│  │  │  └─ [slug]/page.tsx  # case study (generated from content)
│  │  ├─ about/page.tsx
│  │  └─ contact/page.tsx
│  ├─ components/
│  │  ├─ primitives/         # Button, Link, Text, Container, Eyebrow
│  │  ├─ motion/             # Reveal, Parallax, SplitText, MagneticButton,
│  │  │                      #   PageTransition, ScrollProgress, Marquee
│  │  ├─ sections/           # Hero, WorkIndex, CaseStudyHeader, ProcessScrub,
│  │  │                      #   Gallery, NextProject, ContactCTA
│  │  └─ layout/             # Nav, Footer, Cursor
│  ├─ lib/
│  │  ├─ motion/             # easings.ts, durations.ts, variants.ts
│  │  ├─ lenis/              # lenis-provider.tsx, useLenis.ts, gsap-sync.ts
│  │  └─ utils/              # cn(), formatters
│  ├─ hooks/                 # useReducedMotion, useMediaQuery, useMousePosition
│  ├─ content/
│  │  └─ work/*.mdx          # one file per case study (frontmatter + body)
│  └─ types/                 # Project, CaseStudySection, etc.
├─ tailwind.config.ts
├─ next.config.ts
├─ DESIGN_GUIDELINES.md
├─ ARCHITECTURE.md
└─ PROJECT_BRIEF.md
```

---

## 4. Component architecture
- **Layered, loosely atomic:** `primitives` (style-only building blocks) → `motion` (reusable animation wrappers, headless about content) → `sections` (page-level compositions) → page files (assemble sections). Pages stay thin; logic lives in components/hooks.
- **Motion is composable, not bespoke per element.** A `<Reveal>` wrapper, a `<Parallax>` wrapper, a `<SplitText>` component — content gets wrapped, not re-animated by hand each time. This keeps timing consistent and reduces bugs.
- **Server vs client:** default to Server Components; mark only interactive/animated pieces `"use client"`. Motion, GSAP, Lenis, cursor, and anything using browser APIs are client components. Keep client boundaries as low in the tree as possible.
- **Naming:** PascalCase components, camelCase hooks (`useX`), kebab-case files only where a convention requires. Co-locate component styles/variants with the component.

---

## 5. Design tokens → code
The token tables in `DESIGN_GUIDELINES.md` are implemented **once** as CSS variables and surfaced through Tailwind so there's a single source of truth.

`globals.css` (shape):
```css
:root{
  /* monochrome dark base */
  --bg:#0A0A0B; --fg:#F3F3F1; --mut:#8C8C92; --dim:#55555C; --line:rgba(255,255,255,.10);
  /* project accents — applied per project, not on the base UI */
  --lime:#C9E94B; --orange:#F7A53B; --blue:#46B4F0;
  /* motion */
  --ease-out-expo: cubic-bezier(.16,1,.3,1);
  --ease-inout-quart: cubic-bezier(.76,0,.24,1);
  --dur-base:350ms; --dur-slow:600ms; --dur-slower:900ms;
  /* spacing scale, radii, etc. */
}
/* per-project theming: set --accent on the case-study route / work row */
.theme-spendee{--accent:var(--lime)} .theme-voyager{--accent:var(--orange)} .theme-decathlon{--accent:var(--blue)}
```

`tailwind.config.ts` maps utilities to the vars (`colors: { bg:'var(--bg)', fg:'var(--fg)', accent:'var(--accent)' }`, plus `transitionTimingFunction`, `spacing`, `fontFamily` from `next/font`). **Rule:** components consume semantic tokens (`bg`, `fg`, `accent`), never raw primitives. Per-project theming = remap `--accent` (and optionally `--bg/--fg`) on the case-study route only.

Motion constants are *also* exported as TS (`lib/motion/easings.ts`, `durations.ts`) so JS-driven animations (Motion/GSAP) share the exact same values as CSS.

---

## 6. Routing & IA
```
/                 Home — hero (signature moment) + curated work teaser + about teaser + contact CTA
/work             Work index — full project list (grid / horizontal / scrub per §7.5 choice)
/work/[slug]      Case study — header, problem, process, solution, outcome, gallery, next-project
/about            Bio, approach, capabilities, experience, optional résumé download
/contact          Email + socials; light form (mailto or a serverless action — see §10)
```
Optional later: `/journal` or `/notes` (MDX blog), `/playground` (experiments).

---

## 7. Motion architecture (the important part)

### 7.1 Division of labor — which library does what
| Use case | Library |
|---|---|
| Component enter/exit, mount/unmount | **Motion** `AnimatePresence` + variants |
| Simple in-view reveals | **Motion** `whileInView` *or* a GSAP `Reveal` — pick one and standardize |
| Layout / shared-element / route morph | **Motion** `layout` / `layoutId` (or **GSAP Flip**) |
| Gestures, hover, drag | **Motion** |
| Scroll-driven timelines, pin, scrub | **GSAP ScrollTrigger** |
| Horizontal scroll section | **GSAP ScrollTrigger** (pin + x-translate) |
| Split-text headline reveals | **GSAP SplitText** |
| SVG draw/morph | **GSAP DrawSVG / MorphSVG** |
| Smooth scroll (global) | **Lenis** (feeds ScrollTrigger) |
| WebGL / shaders (optional) | **R3F**, isolated & lazy |

**Golden rule:** don't run two smooth-scroll engines. Lenis owns scrolling; ScrollTrigger reads from it. Don't also enable GSAP ScrollSmoother *and* Lenis.

### 7.2 Reusable primitives (build these once, in `components/motion/`)
- `<Reveal>` — fade/translate in on view, once, reduced-motion aware.
- `<Parallax speed>` — translates child by a scroll-linked factor.
- `<SplitText as>` — wraps GSAP SplitText with cleanup + reduced-motion fallback (renders plain text).
- `<MagneticButton>` — pointer-follow drift.
- `<PageTransition>` — route enter/exit (see 7.4).
- `<ScrollProgress>` — section-aware progress.
- Each primitive **must** check `useReducedMotion()` and degrade to a static/instant state.

### 7.3 Scroll system — Lenis ⇄ GSAP single RAF
Critical integration pattern (one RAF loop, no jank):
```ts
// lib/lenis/gsap-sync.ts (inside a client provider/effect)
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000)); // single source of truth
gsap.ticker.lagSmoothing(0);
// cleanup: lenis.destroy(); remove ticker fn; kill ScrollTriggers on unmount
```
- Mount Lenis in a **client provider** rendered from the root layout. Set `autoRaf:false` and drive it from GSAP's ticker so there's exactly one animation frame loop.
- On mobile, prefer `syncTouch:false` (native touch scroll feels better than smoothed touch).
- Use `data-lenis-prevent` on modals/overlays that need native scroll.
- Refresh ScrollTrigger after route changes and after images/fonts load (`ScrollTrigger.refresh()`), and respect reduced-motion by skipping smoothing entirely.

### 7.4 Page-transition system
- Wrap routes in `app/template.tsx` (re-mounts per navigation) with a `<PageTransition>` using Motion `AnimatePresence` (overlay wipe) — the simplest reliable approach in App Router.
- For shared-element route morphs (thumbnail → case-study hero), use Motion `layoutId` or GSAP Flip. Implement *after* base navigation + transitions are solid.
- Always reset scroll to top on route change and provide a reduced-motion instant path.

### 7.5 Performance discipline for motion
- Animate **only `transform` / `opacity`**. Add `will-change` sparingly and remove it after.
- Lazy-load GSAP plugins and any R3F scene with `next/dynamic` (`ssr:false`) so they don't bloat first load.
- Kill ScrollTriggers and GSAP contexts on unmount (`useGSAP` handles scoping/cleanup — prefer it).
- Throttle pointer-driven effects (cursor, magnetic) with rAF, not on every `mousemove`.

### 7.6 WebGL isolation (only if chosen)
Keep all Three/R3F in a dynamically-imported `Canvas` boundary that: never blocks first paint, renders a static fallback under reduced-motion or on low-power devices, pauses when off-screen/ tab hidden, and caps pixel ratio (`dpr={[1,2]}`). Treat it as an enhancement layer, removable without breaking the page.

---

## 8. Content architecture
Case studies are **MDX** in `src/content/work/`. Each file = frontmatter (structured data) + body (rich content with custom components like `<Gallery>`, `<Metric>`, `<Quote>`).

Frontmatter schema (`types/Project.ts`):
```yaml
title:        # project name
slug:         # url
client:       # or "Personal"
role:         # your role
year:         # number
services:     # [Strategy, UX, UI, Motion]
summary:      # 1–2 sentence teaser for the index
cover:        # hero image path
gallery:      # [paths]
accent:       # optional per-project accent hex (themes the route)
metrics:      # [{ label, value }]
nextProject:  # slug of next case study
credits:      # [{ role, name }]
featured:     # boolean (show on home)
order:        # sort index
```
`work/page.tsx` and `[slug]/page.tsx` read this at build time (`generateStaticParams`) → fully static, fast pages. Migrating to a CMS later (§9) means swapping the data source, not the components — so keep data access behind a thin `lib/content` layer.

---

## 9. CMS (optional, later)
If you want to edit case studies without touching code, add a headless CMS (Sanity, Contentful, or a git-based one like Keystatic/TinaCMS that keeps MDX). Keep the same `Project` shape so components don't change. Don't build this until the MDX version is shipping — it's a later convenience, not a launch requirement.

## 10. Forms & data
- Contact: simplest is `mailto:` or a serverless **Server Action / Route Handler** posting to an email service (Resend) or form backend (Formspree). No `<form>` element inside React-driven animation contexts that conflict — handle via state + actions.
- **Never** put secrets client-side; use server env vars and Route Handlers/Server Actions.

---

## 11. State & data
Minimal global state — this is a content site. Use React state/context for: theme, Lenis instance, cursor state, menu open. No Redux/heavy store needed. Derive everything else from content at build time.

---

## 12. Performance architecture (budgets)
| Metric | Target |
|---|---|
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| Initial JS (gz) | aim ≤ ~200KB; defer GSAP plugins / R3F beyond it |
| Animation | 60fps; transform/opacity only |

Tactics: `next/image` with explicit sizes + `priority` only on the LCP image; `next/font` self-hosted; `next/dynamic ssr:false` for heavy client modules; static generation for all content routes; preload the hero font/image; reserve media space to avoid shift; audit with Lighthouse + the Performance panel before each merge. Test on a mid-range phone, not just your laptop.

## 13. Responsive & device strategy
Mobile-first. The signature scroll moments (horizontal scroll, pinning) get **explicit simpler mobile variants** — design them, don't auto-shrink. Touch devices: disable custom cursor and magnetic effects, prefer native touch scroll. Test the matrix in §17.

## 14. Accessibility implementation
Wire the `DESIGN_GUIDELINES.md` §10 rules into code: a `useReducedMotion` hook gates every motion primitive; visible focus tokens; skip link in root layout; semantic landmarks; alt text enforced via the MDX/image components; keyboard-operable menu, cursor-independent. Add an automated check (axe / Lighthouse a11y) to the review checklist.

## 15. SEO & metadata
Next.js Metadata API per route (title, description, canonical), Open Graph + Twitter images (static or generated via `next/og`), `sitemap.ts`, `robots.ts`, JSON-LD `Person`/`CreativeWork` for you and your projects. Semantic HTML throughout.

## 16. Analytics
Privacy-friendly + lightweight (Vercel Analytics or Plausible). Avoid heavy third-party scripts that undercut the performance budget. Add consent handling only if you use anything that legally requires it.

## 17. Test matrix
Browsers: latest Chrome, Safari, Firefox, Edge (incl. **iOS Safari** — scroll behavior differs). Devices: one high-end + one mid-range phone, tablet, laptop, large desktop. States: reduced-motion ON, keyboard-only, slow 3G throttle, dark mode (if shipped).

---

## 18. Phased roadmap (build in this order with Claude Code)

**Phase 0 — Foundation.** Scaffold Next.js (App Router, TS, Tailwind). Install deps. Implement tokens (CSS vars + Tailwind config + motion TS constants). Set up `next/font`. Commit the two markdown docs. *Done when:* a tokenized blank app builds and deploys to a Vercel preview.

**Phase 1 — Structure & content model.** Routes, layout, Nav/Footer, `Container`/primitives, MDX pipeline + `Project` type, 1–2 placeholder case studies. *Done when:* you can navigate all pages and a case study renders from MDX — no motion yet.

**Phase 2 — Scroll & motion core.** Lenis provider + GSAP single-RAF sync. Build motion primitives (`Reveal`, `Parallax`, `SplitText`, `MagneticButton`, `ScrollProgress`), all reduced-motion aware. *Done when:* primitives work in isolation on a test page and reduced-motion fully degrades them.

**Phase 3 — The signature.** Build the one orchestrated moment (hero load sequence / scroll work-index / WebGL — per `DESIGN_GUIDELINES.md` §3). Get it excellent before anything else fancy. *Done when:* the signature lands and holds 60fps.

**Phase 4 — Sections & case studies.** Compose Hero, WorkIndex, CaseStudyHeader, ProcessScrub, Gallery, NextProject, ContactCTA. Apply real content. *Done when:* a full case study reads end-to-end with motion.

**Phase 5 — Transitions.** Page/route transitions; then shared-element morph if pursued. *Done when:* navigation feels cohesive and reduced-motion has an instant path.

**Phase 6 — Polish & ship.** Performance pass to budget, full a11y pass, SEO/OG, analytics, cross-device QA (§17), then production deploy + custom domain. *Done when:* the §17 matrix passes and budgets in §12 are met.

---

## 19. Claude Code working agreement
- **Reference both docs explicitly** in prompts; name the section.
- **Build per phase** (§18). Ask Claude Code for one phase/section at a time and review before moving on — don't request the whole site at once.
- **Definition of done** for any unit = `DESIGN_GUIDELINES.md` §13 quality bar (responsive, keyboard + visible focus, reduced-motion, no CLS, 60fps transform/opacity, copy in voice).
- **Guardrails to restate:** one accent; transform/opacity only; single scroll engine (Lenis drives); semantic tokens not raw primitives; client boundaries kept low; cleanup all GSAP/ScrollTrigger.
- **Commits:** small, conventional (`feat:`, `fix:`, `chore:`), one concern each. Branch per phase/feature; preview deploy per PR.
- When Claude Code proposes a heavy effect, ask: *does this serve the work, hold the budget, and degrade under reduced-motion?* If not, cut it.