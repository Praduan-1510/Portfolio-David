# Design Guidelines — Portfolio

> **What this is:** the visual + motion system for your portfolio. It defines *how it looks and how it moves* so that every screen feels like one intentional piece of work rather than a collection of effects.
>
> **How to use it with Claude Code:** keep this file at the repo root. Reference it explicitly in prompts ("follow DESIGN_GUIDELINES.md, section 7 motion language"). Treat the token tables as the single source of truth — values here map directly to the CSS variables and Tailwind config defined in `ARCHITECTURE.md`. When a decision isn't covered here, the rule is: **restraint over decoration.**

---

## 1. Reading this document

Two kinds of content live here:

- **System** — scales, tokens, easing curves, motion specs, accessibility rules. These are craft standards. Use them as written; they're tuned and internally consistent.
- **Identity decisions** (marked 🎯) — palette, type pairing, the signature element. This is a *personal* portfolio, so these must ultimately be *yours*, not a default. I've supplied a refined **reference direction** so the build can start and so you can see the intended level of execution — but you should confirm or replace each one. `PROJECT_BRIEF.md` collects the inputs that drive these.

---

## 2. Design philosophy

Five principles, in priority order. When two conflict, the higher one wins.

1. **The work is the hero, the interface is the frame.** Motion and styling exist to direct attention to projects, never to compete with them. A portfolio that's more memorable than its contents has failed.
2. **One orchestrated moment beats ten scattered effects.** Spend your boldness in a single place per page (usually the hero load or one scroll sequence). Keep everything around it quiet and disciplined.
3. **Motion must mean something.** Every animation either reveals structure, guides the eye, gives feedback, or expresses craft. If it does none of those, cut it.
4. **Perceived performance is part of the design.** A fast-feeling site reads as more premium than a slow one with more effects. Loading states, transition timing, and restraint are design decisions, not afterthoughts.
5. **Accessible by construction.** Reduced-motion, keyboard focus, and contrast aren't a final pass — they're built into every component from the first commit.

---

## 3. Art direction 🎯

> *Decision layer — confirm or replace using your answers in `PROJECT_BRIEF.md`.*

**Direction (locked): high-tech / instrument-grade.** Precision over flash — the feel of aerospace UI, scientific instruments, and developer tooling, *not* "futuristic" sci-fi. Exposed structure (a visible grid, hairlines, deliberate alignment), monospace for data and labels, technical annotations (indices, coordinates, timestamps, status readouts), and motion that feels **computational** — scrubbed, snapping, precise — rather than decorative. Maximal in execution (§7 calibration), disciplined on the surface. The result should read as *engineered and exact*, never busy.

**Pick one base flavor** (a one-line token change — see §4):
- **Dark instrument** *(recommended for a high-tech showpiece)* — dark surface is primary (`[data-theme="dark"]`), the signal accent used *sparingly* as a data highlight, WebGL and fine detail pop against it.
- **Technical light** — stark off-white "lab" base, ink type, grid and hairlines doing the heavy lifting. Cleaner, less obvious, harder to make feel premium-technical but very distinctive when it lands.

**Deliberately avoid the *cheap* high-tech look** — this direction's biggest risk:
- Pure-black + neon/acid "cyberpunk" glow everywhere, matrix rain, generic chrome or "futuristic" gradients. **Glow is a seasoning, not a base.**
- Tech-flavored iconography or readouts that encode nothing — every coordinate, index, and status line should reflect something real.
- The other AI-default looks stay off-limits too: cream + high-contrast serif + terracotta; broadsheet hairline-newspaper.

Real high-tech reads *precise and earned*, not "sci-fi skinned." Your actual work and references (`PROJECT_BRIEF.md` §3) should still steer the specifics.

**The signature** (the thing the site is remembered by): for a maximal direction, choose one **primary** signature and commit hard, then allow up to ~2 supporting set-pieces. Options, in rough order of effort:
- A **page-load sequence** that resolves into the hero (mask reveal + staggered split-text).
- A **scroll-driven work index** — projects that scrub, pin, or scale as you move through them.
- A **cursor-led** interaction model (magnetic targets, contextual cursor states over project thumbnails).
- A **WebGL hero or transition** (highest effort, strongest "showpiece" payoff — encouraged here; see §8 and `ARCHITECTURE.md` §7.6).

For this project, a strong default is a **WebGL/orchestrated hero as the primary signature** plus a **pinned scroll-driven work index** as the secondary — but pick based on your work and the references in `PROJECT_BRIEF.md`. The primary signature should clearly dominate; keep the connective sections between set-pieces calm so each lands.

---

## 4. Color system

**Token architecture** — three layers, so theming and per-project accents stay clean:

1. **Primitives** — raw values (`--ink-900`, `--paper-50`, `--accent-500`). Never used directly in components.
2. **Semantic** — role-based aliases that components consume (`--bg`, `--fg`, `--muted`, `--accent`, `--line`). Light/dark and per-project themes only ever remap this layer.
3. **Component** — only when a component needs something the semantic layer doesn't cover.

### Palette (finalized — dark-first, monochrome)

The site is **near-black and monochrome**. The interface itself carries no colour — the animated background and the type lead, and **colour belongs to the projects.**

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0A0A0B` | Primary background (near-black) |
| `--fg` | `#F3F3F1` | Primary text / foreground |
| `--mut` | `#8C8C92` | Secondary text |
| `--dim` | `#55555C` | Captions, technical/mono labels |
| `--line` | `rgba(255,255,255,.10)` | Hairlines, dividers |

**Colour is the work.** The only colour anywhere in the site comes from the three project accents — applied per project on the work-index rows and on each case-study page by remapping `--accent` on that route:

| Project | Accent |
|---|---|
| Spendee | `--lime #C9E94B` |
| Voyager | `--orange #F7A53B` |
| Decathlon | `--blue #46B4F0` |

There is **one** non-project colour: a vivid **neon green** signal used site-wide for the interaction state.

| Token | Value | Role |
|---|---|---|
| `--neon` | `#39FF6A` | Interaction signal — every card lights its border + glow to this on hover/focus (`.card-neon`, `shadow-neon`), card titles shift to it, and "available / live" indicators use it. The colour of *interaction*, constant across all routes (it does not change with the project accent). |

**Usage rules**
- The base interface stays monochrome — no project accent on the home/hero chrome. Let the fluid background and type carry it. The only standing colour in the chrome is the neon signal, and only on hover/focus or as a live-status dot.
- Each project owns exactly one accent, and it appears only inside that project's context (its work row, its case-study page).
- Text/background contrast meets **WCAG AA** (4.5:1 body, 3:1 large). The three accents are tuned for legibility on the dark base.
- Large flat fields and the atmospheric background read as premium; avoid decorative gradients elsewhere.

---

## 5. Typography

Type carries the personality here — treat it as the lead instrument, not a neutral delivery vehicle.

### Pairing (finalized)

All three are free and self-hosted via `next/font` — no licensing needed.

| Role | Typeface | Use |
|---|---|---|
| **Display** | **Space Grotesk** | Headlines, project titles. Clean, with a slightly technical character that suits the direction; used with restraint. |
| **Body / UI** | **Inter** | Paragraphs, nav, labels. Excellent at 14–18px. |
| **Technical / mono** | **Space Mono** | Eyebrows, indices (01/02/03), the live clock, technical labels — the "instrument" texture. |

### Type scale (fluid, modular)

Base 18px, ratio ≈ 1.25 (major third) for body steps, with display steps stretching wider for editorial impact. Use `clamp()` so type scales smoothly between mobile and desktop without breakpoints.

| Token | Mobile → Desktop (`clamp`) | Use |
|---|---|---|
| `display-xl` | `clamp(2.75rem, 7vw, 7rem)` | Hero headline |
| `display-l` | `clamp(2.25rem, 5vw, 4.5rem)` | Section / case-study titles |
| `heading` | `clamp(1.5rem, 2.5vw, 2.25rem)` | Sub-headings |
| `body-l` | `clamp(1.125rem, 1.4vw, 1.375rem)` | Lead paragraphs |
| `body` | `1rem`–`1.125rem` | Default text |
| `caption` | `0.8125rem` | Captions, metadata, mono |

**Settings**
- **Tracking:** tighten display type (`-0.02em` to `-0.04em`); leave body near `0`; mono can sit slightly open.
- **Leading:** display `1.0–1.1`; body `1.5–1.65`; captions `1.4`.
- **Measure:** body line length 60–75 characters max. Enforce with a `--measure` container, not fixed widths.
- **Weights:** keep to 2–3 (e.g. Regular 400, Medium 500, and one display weight). More weights = more font payload and a muddier voice.
- **Casing:** sentence case for almost everything. Reserve all-caps for short mono labels/eyebrows only, with added tracking.

### Type as motion
Display headlines are your primary candidates for **split-text reveals** (per-line or per-character, mask-clipped). This is GSAP `SplitText` territory (now free — see `ARCHITECTURE.md`). Use it on the hero and *maybe* one section title — not on every heading, or it loses impact and hurts readability for some users.

---

## 6. Spacing & layout

### Spacing scale (4px base)
`4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192` → tokens `space-1 … space-11`. Compose layouts from these only; no arbitrary one-off pixel values. Section vertical rhythm typically `space-9`/`space-10` on desktop, scaling down on mobile.

### Grid
- **12-column** fluid grid, max content width ≈ `1440px`, with a comfortable outer gutter (`clamp(1.25rem, 5vw, 6rem)`).
- Define a reusable `Container` (standard) and allow **full-bleed** escapes for hero media, horizontal galleries, and signature moments.
- Asymmetry is welcome — a confident off-center layout reads more editorial than everything centered. Let the grid *enable* asymmetry, not forbid it.

### Breakpoints
`sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`. Design mobile-first; the hardest layouts (horizontal scroll, pinned sequences) need an explicit, simpler mobile fallback — don't just shrink the desktop version.

---

## 7. Motion language

> The core of this portfolio. These specs are concrete and apply across whatever aesthetic you choose. The implementation split (which library does what) is in `ARCHITECTURE.md` §7.

> **🔧 Motion calibration for this project: MAXIMAL SHOWPIECE.**
> This raises the *ceiling* on expression — but **not** the floor on craft. Concretely, "maximal" here means:
> - **Elaborate execution, not more clutter.** Maximalism is earned through richer, more orchestrated, frame-perfect sequences — not by animating everything. A maximalist piece can still feel disciplined.
> - **A bold primary signature + up to ~2 secondary set-pieces.** Keep one *primary* moment (§3) clearly dominant; the others support it. Quiet connective tissue between set-pieces is what makes them land.
> - **WebGL is in-scope and encouraged** (Three.js / R3F) for the signature or transitions — built as an isolated, lazy-loaded, reduced-motion-safe layer per `ARCHITECTURE.md` §7.6.
> - **Lean into:** split-text headline reveals, pin+scrub storytelling, a horizontal work gallery, shared-element route morphs, a stateful custom cursor, subtle ambient/WebGL atmosphere.
> - **The hard limits still hold without exception:** transform/opacity only · 60fps · full `prefers-reduced-motion` fallback · single scroll engine (Lenis) · the work stays the hero · performance budget (§11) met. Maximal motion makes that budget *harder* — so the lazy-loading and RAF discipline in `ARCHITECTURE.md` §7.5/§12 become more important, not less.

### 7.1 Principles
- **Physical, not floaty.** Motion should feel like it has weight and inertia — fast to start, settling gently. Avoid uniform linear UI motion (reserve linear for scroll-*linked* effects only).
- **Enter with intent, exit quickly.** Reveals can take their time; dismissals should be brisk so the UI never feels sluggish.
- **Choreograph, don't crowd.** Group related elements into one staggered sequence rather than animating everything independently.
- **Respect the scroll.** Scroll-linked motion (scrub) must track the scroll position exactly (linear) — easing it makes it feel broken.

### 7.2 Easing (named curves — use these, not ad-hoc beziers)

| Token | `cubic-bezier` | Use |
|---|---|---|
| `ease-out-expo` | `0.16, 1, 0.3, 1` | **Workhorse** for reveals & entrances |
| `ease-in-out-quart` | `0.76, 0, 0.24, 1` | Transforms, page/section transitions |
| `ease-out-quad` | `0.25, 1, 0.5, 1` | Default UI / hover settles |
| `ease-out-back` | `0.34, 1.56, 0.64, 1` | Slight overshoot — *sparingly*, for playful accents only |
| `linear` | — | **Scroll-linked / scrubbed motion only** |

### 7.3 Duration scale

| Token | Value | Use |
|---|---|---|
| `instant` | `100ms` | Micro hover feedback |
| `fast` | `200ms` | Buttons, small state changes |
| `base` | `350ms` | Most enter/exit, default |
| `slow` | `600ms` | Larger reveals, section transitions |
| `slower` | `800–1000ms` | Hero load, page transitions |
| `ambient` | `1200ms+` | Looping / atmospheric motion |

### 7.4 Choreography
- **Stagger** siblings by **40–80ms**. Cap the total sequence (~600–900ms) so it never drags.
- **Reveal distance:** translate **16–40px**, opacity `0→1`. Optional **blur 8px→0** for a premium feel — but it's GPU-costly, so use it only on hero/headline elements, never on long lists.
- **Transform & opacity only.** Animate `transform` and `opacity` for 60fps. Never animate `width`, `height`, `top/left`, `margin`, or other layout-triggering properties (use `transform: scale/translate` and FLIP techniques instead).

### 7.5 Scroll vocabulary (the toolkit — pick per section, don't use all at once)
- **In-view reveal** — element animates once when it enters viewport. The default for content sections. Animate once; don't re-trigger on scroll-up.
- **Parallax** — background/foreground move at different rates. Keep it **subtle** (<15% differential); heavy parallax reads as dated.
- **Pin + scrub** — pin a section and drive a timeline by scroll position. Reserve for *one* storytelling moment (e.g. a case-study process reveal).
- **Horizontal scroll** — a row of projects/images that moves sideways as you scroll down. Strong for a work gallery; needs a clear mobile fallback (vertical stack).
- **Sticky stack** — cards that stack/overlap as you scroll. Good for sequenced content.
- **Scroll progress** — a thin indicator or section-aware nav. Functional *and* expressive.

### 7.6 Page & route transitions
A cohesive transition between routes is a major part of the "high-end" feel. Approaches, simplest first:
- **Overlay wipe** — a panel sweeps in, route changes behind it, panel sweeps out (`ease-in-out-quart`, ~`slower`).
- **Shared element** — a project thumbnail morphs into the case-study hero (Motion `layoutId`, or GSAP Flip). Highest polish; implement after the basics work.
Keep transitions under ~1s total — long transitions frustrate on repeat visits. Always provide an instant/no-transition path under reduced-motion.

### 7.7 Micro-interactions
- **Hover:** subtle scale (`1.0→1.02`), color/underline transitions, image zoom-within-frame. `fast`, `ease-out-quad`.
- **Magnetic targets:** key buttons/links drift slightly toward the cursor. Use on 1–3 elements max.
- **Custom cursor:** optional. If used, give it *states* (default, hover-link, view-project) so it carries meaning. Always keep the real cursor accessible and disable on touch.
- **Link affordance:** every interactive element has a visible hover *and* focus state. Focus is never `outline: none` without a clear replacement.

### 7.8 Ambient motion
Slow, looping background motion (gradient drift, grain, a gently rotating 3D object) can add life — at very low intensity, paused under reduced-motion, and never near text where it harms legibility.

---

## 8. Imagery & media

- **Project imagery is the star.** Shoot/export at high resolution; serve responsive sizes via `next/image`. Consistent treatment across projects (same corner radius — likely small or zero, same shadow language, same aspect-ratio discipline) makes the index feel curated.
- **Aspect ratios:** standardize on a small set (e.g. `16:10`, `4:3`, `1:1`) and reserve space to prevent layout shift (CLS).
- **Video:** use `muted`, `playsInline`, `loop`, autoplay only for ambient/decorative clips; lazy-load and pause off-screen. Provide a poster frame. Heavy hero video must have a lightweight fallback.
- **3D / WebGL (optional, high effort):** only if it expresses something true about your work and you can hold the performance budget. Lazy-load it, gate it behind capability/reduced-motion checks, and never block first paint on it. See `ARCHITECTURE.md` §7 for how it's isolated.

---

## 9. Iconography & graphic elements
- Use a single, consistent icon set (thin, geometric — e.g. *Lucide*) at a fixed stroke width. Don't mix icon styles.
- Structural devices (eyebrows, indices like `01/02`, dividers) should **encode real information** — use numbered indices only where order genuinely matters (a real process, a chronological list), not as decoration.
- Grain/noise overlays and fine hairlines can add texture; keep them faint and purposeful.

---

## 10. Accessibility & inclusive motion (non-negotiable)
- **`prefers-reduced-motion`:** honor it everywhere. Reduced-motion users get instant or heavily simplified transitions — content still fully reveals (never trap content behind an animation that doesn't run). Build a `useReducedMotion` check into every motion primitive.
- **Keyboard:** every interaction reachable and operable by keyboard; visible focus styles using the accent; logical tab order; skip-to-content link.
- **Contrast:** AA minimum across all text and meaningful UI.
- **Motion safety:** no aggressive flashing; parallax/auto-motion stays gentle.
- **Semantics:** real headings hierarchy, alt text on all meaningful images, `aria` only where native semantics fall short.

---

## 11. Performance as design
- Targets (also in `ARCHITECTURE.md` §12): **LCP < 2.5s, CLS < 0.1, INP < 200ms**, smooth 60fps animation.
- **Loading is designed:** a brief, intentional load sequence (not a generic spinner) sets tone; skeletons/placeholders prevent jarring pop-in; reserve media space to avoid shift.
- **Restraint is performance:** every effect has a cost. The most premium choice is often *fewer, better* animations.

---

## 12. Voice & copy
Words are design material. Keep copy specific and confident, never filler.
- **Sentence case**, plain verbs, no jargon. Describe what your work *did*, not adjectives about it ("rebuilt the checkout, cut drop-off 23%" beats "innovative seamless experience").
- **Actions say what happens:** "View project," "Get in touch" — and the destination matches the label.
- **Empty/error states give direction**, in the interface's voice, never an apology or a mood.
- Your hero line should say, plainly, who you are and what you do. Clever-but-vague loses to clear.

---

## 13. Quality bar & anti-patterns

**Definition of "done" for any screen:** responsive to mobile, keyboard-operable with visible focus, reduced-motion respected, no layout shift, animations at 60fps using transform/opacity, copy specific and in voice, and it serves the work rather than upstaging it.

**Avoid:**
- More than one accent color, or gradients used as a default.
- Animating layout-triggering CSS properties.
- Effects on everything — scattered motion with no focal moment.
- Two competing scroll engines (let Lenis drive; see architecture).
- The three AI-default looks (§3) chosen by inertia rather than intent.
- Decorative numbered markers where nothing is actually sequential.
- Transitions over ~1s, or content gated behind animations that may not run.
- Autoplaying sound; flashing; parallax strong enough to feel like motion sickness.