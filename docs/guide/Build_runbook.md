# Build Runbook — Praduan Saha Portfolio

> Every step to build the site, in order. Run each in **Claude Code** (VS Code extension or `claude` in the integrated terminal), **verify it works, then move to the next.** Don't run them all at once.

## Before you start
- **Node 20 LTS** (`node -v`), **VS Code**, **Claude Code** installed (needs a paid Claude plan).
- Open the project folder in VS Code (File → Open Folder).
- These files should sit in the repo root: `DESIGN_GUIDELINES.md`, `ARCHITECTURE.md`, `SITE_CONTENT.md`, `PROJECT_BRIEF.md`, the three `*-case-study.md` files, and `reference/prototype.html`.
- In the Claude Code panel you can `@`-mention any of those files to pull them in.

---

## Step 0 — Setup (terminal, not a prompt)
```bash
npx create-next-app@latest .
# answers: TypeScript Yes · ESLint Yes · Tailwind Yes · src/ Yes · App Router Yes · Turbopack Yes · import alias No
npm i motion gsap @gsap/react lenis three @react-three/fiber @react-three/drei
```

---

## Step 1 — Foundation
*Verify: `npm run dev` shows a blank page on the dark background, in the body font, no errors.*
```
Read DESIGN_GUIDELINES.md and ARCHITECTURE.md. Implement Phase 0 foundation only — no pages or sections yet:
1. Tokens in src/app/globals.css from guidelines §4: dark palette (--bg #0A0A0B, --fg #F3F3F1, --mut, --dim, --line), the three project accents (--lime #C9E94B, --orange #F7A53B, --blue #46B4F0), and motion tokens from §7.2/§7.3 (easing cubic-beziers + duration scale).
2. tailwind.config.ts: expose the semantic colour tokens, the spacing scale (§6), the easings as transitionTimingFunction, and the font families.
3. Self-host fonts via next/font: Space Grotesk (display), Inter (body), Space Mono (mono); wire to CSS vars and Tailwind fontFamily.
4. Create src/lib/motion/easings.ts and durations.ts exporting the same values as TS constants.
5. Minimal root layout: body font + bg/fg tokens + a skip-to-content link.
Foundation only. Confirm npm run dev renders a blank tokenized page.
```

---

## Step 2 — Structure & content model
*Verify: you can navigate all five routes and a case study renders from its MDX (unstyled is fine).*
```
Phase 1 — structure and content model, following ARCHITECTURE.md §3, §4, §6, §8. No motion yet:
1. Routes under src/app: / (home), /work (index), /work/[slug] (case study), /about, /contact.
2. Nav and Footer in components/layout/, and primitives (Container, Text, Button, Link, Eyebrow) in components/primitives/, styled with the semantic tokens.
3. MDX pipeline for case studies in src/content/work/, with the Project frontmatter schema from §8 typed in src/types/. Use generateStaticParams for static generation.
4. Add the three case-study MDX files — spendee.mdx, voyager.mdx, decathlon.mdx (content provided) — and place each project's screens under public/images/work/<slug>/ per the asset manifest in each file.
5. Wire /work to list projects from content, and /work/[slug] to render frontmatter + MDX body.
Keep it static and motion-free. Confirm all five routes navigate and a case study renders.
```

---

## Step 3 — Motion system + home page (match the prototype)
*Verify: the home matches `reference/prototype.html` — fluid background, load sequence, smooth scroll, reveals; reduced-motion fully degrades it.*
```
Read reference/prototype.html, DESIGN_GUIDELINES.md (§3 dark direction, §7 motion), and ARCHITECTURE.md (§3, §7). Recreate the prototype's look and motion as proper components — same fluid hero, same motion language, same "monochrome until the work, colour per project" concept:
1. Smooth scroll: src/lib/lenis/LenisProvider.tsx — Lenis synced to GSAP's ticker as a single RAF loop per ARCHITECTURE.md §7.3; mount from layout.tsx; reduced-motion disables it.
2. Fluid background: components/motion/FluidBackground.tsx — port the prototype's domain-warped FBM-noise fragment shader into an isolated, dynamically imported (next/dynamic, ssr:false) WebGL layer (R3F shader plane preferred per §7.6; raw WebGL canvas is fine). Grayscale smoke on near-black, slow time-driven flow, subtle pointer + scroll reactivity, dpr capped ~1.6, pause when offscreen, static gradient fallback under prefers-reduced-motion or no-WebGL.
3. Motion primitives in components/motion/, all reduced-motion aware, using the easing tokens and useGSAP for cleanup: SplitText (word/line mask reveal), Reveal (in-view once), MagneticButton, Marquee, Counter. Plus Cursor in components/layout/ (growing custom cursor, disabled on touch).
4. Hero: components/sections/Hero.tsx — pill, SplitText headline "I turn complex ideas into clean, usable design", subhead, View work / Get in touch magnetic buttons, corner technical labels (ASANSOL IN / EST. 2021 + a live IST clock), scroll cue. Orchestrate the load with a GSAP timeline (loader wipe → staggered reveal).
5. Sections assembled in src/app/page.tsx with real copy from SITE_CONTENT.md: Marquee, an intro statement (word reveal), WorkIndex (Spendee/lime, Voyager/orange, Decathlon/blue as alternating rows with the angled phone mockup + hover lift + accent — placeholder phone UIs for now), Stats (count-up), Capabilities, Contact (magnetic email). Theme each project row to its accent.
Match the prototype's spacing, type scale, and motion timing. Transform/opacity-only at 60fps, client boundaries low, all GSAP/ScrollTrigger cleaned up. Confirm the home renders matching reference/prototype.html, with smooth scroll, the load sequence, and reduced-motion fully degrading it.
```

---

## Step 3b — Logo marquee ("Tools I work with")
*Verify: the strip scrolls seamlessly, logos render monochrome (white) on the dark background, it pauses on hover, and reduced-motion shows a static wrapped row.*

*First — register for a free Brandfetch client ID (their developer portal) and add it to `.env.local`:*
```
NEXT_PUBLIC_BRANDFETCH_CLIENT_ID=your_id_here
```
*Then run:*
```
Add a logo marquee titled "Tools I work with" to the home page, replacing the text marquee. Create src/components/motion/LogoMarquee.tsx:
1. An infinite horizontal marquee (CSS keyframes or GSAP), with a duplicated track for a seamless loop, paused on hover, and disabled under prefers-reduced-motion (show a static wrapped row instead).
2. Source each logo from the Brandfetch Logo API by domain, embedded directly via a plain <img> per Brandfetch's terms (do not download/self-host): https://cdn.brandfetch.io/{domain}/logo?c=${process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID} — use the symbol/icon endpoint with SVG where available per docs.brandfetch.com. Add loading="lazy" and a descriptive alt per brand.
3. Match the monochrome dark aesthetic: render logos with filter: grayscale(1) brightness(0) invert(1); opacity:.55, transitioning to full opacity on hover. Uniform height ~28px, generous gaps.
4. Put the domains in a typed array so it's easy to edit: figma.com, adobe.com, canva.com, framer.com, sketch.com, webflow.com, notion.so, openai.com, anthropic.com, midjourney.com, runwayml.com, perplexity.ai.
5. Small mono eyebrow label "Tools I work with" above the strip. Use the component in src/app/page.tsx where the text Marquee was.
If a logo 404s, hide that image. This is a "tools I use" strip, not clients. (Alternative: pull monochrome SVGs from the simple-icons npm package instead of Brandfetch — no key needed.)
```

---

## Step 4 — Case-study pages + real screens
*Verify: all three case studies render with your real screens, each page picks up its accent, and the work index degrades on mobile.*
```
Phase 4 — case-study detail pages + work index, following DESIGN_GUIDELINES.md §7.5 and ARCHITECTURE.md §7, §8:
1. Build /work/[slug]: a full-bleed cover, title + meta (client, role, year, services), the problem/approach/walkthrough/outcome body from MDX, a metrics row if present, a gallery that shows the real mobile screens in clean phone frames, and a "next project" link. Theme the page to the project's accent (remap --accent on the route).
2. Replace the home WorkIndex placeholder phones with each project's real cover image, keeping it the scroll-driven set-piece from §7.5 with a simple vertical-stack fallback on mobile and under reduced-motion.
Confirm all three case studies render with real screens, accents apply, and the index degrades on mobile.
```

---

## Step 5 — Polish & ship
*Then work through `LAUNCH_CHECKLIST.md`.*
```
Phase 6 — polish:
1. Route transitions: an overlay wipe between pages (app/template.tsx + AnimatePresence), and a shared-element morph from a work-index card into the case-study cover; reduced-motion gets an instant path.
2. Performance to the budget in ARCHITECTURE.md §12: lazy-load the WebGL layer, next/image with explicit sizes (priority only on the LCP image), preload the hero font, reserve media space. Target LCP < 2.5s, CLS < 0.1, INP < 200ms, 60fps.
3. Accessibility pass: keyboard operability, visible focus, contrast (AA), alt text, semantic landmarks.
4. SEO: Metadata API per route, Open Graph / Twitter images, sitemap.ts, robots.ts, JSON-LD (Person + CreativeWork).
5. Analytics: Vercel Analytics or Plausible (lightweight).
Confirm the budgets are met and the test matrix in ARCHITECTURE.md §17 passes.
```

---

## Then deploy
`git init` → push to GitHub → import at vercel.com → connect your domain. Previews deploy per pull request; merge to main to go live.