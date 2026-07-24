# praduansaha.com

Personal portfolio for Praduan Saha — product designer and front-end developer.
A dark, instrument-styled site with a small set of case studies, an about page,
and a contact page, built as a Next.js App Router application.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** (with PostCSS / Autoprefixer)
- **MDX** case studies — `next-mdx-remote` + `gray-matter`, sourced from `src/content/work/`
- **Motion** — `gsap` + `@gsap/react` for scroll-driven choreography, `motion` (Motion for React) for route/element transitions, `lenis` for smooth scroll
- **lucide-react** icons, `next/image` for imagery

Node `>=20.9.0`.

## Notable implementation decisions

- **Per-route Open Graph images.** OG/Twitter cards are generated dynamically per
  route via `opengraph-image.tsx` / `twitter-image.tsx` — a root card plus a
  per-case-study card at `src/app/work/[slug]/opengraph-image.tsx`.
- **Status board ("Currently").** The home page carries a live departure-board
  readout (`CurrentlyBoard`) — current work, what shipped, method, and an
  availability row with a live IST clock. It is choreographed inside a
  scroll-scrubbed cinematic reel (`CinematicReel`).
- **One shared motion system.** Motion tokens live in `src/lib/motion/` and are
  consumed by both the GSAP scroll work and the Motion transitions, so timings and
  easings stay consistent. GSAP is driven off a single Lenis-synced RAF loop
  (`src/lib/lenis/`). Everything degrades under `prefers-reduced-motion`.
- **Content as data.** Case studies are MDX with front-matter; shared building
  blocks (galleries, before/after, stat grids) are React components in
  `src/components/mdx/`.
- **Accessibility.** Animated components (split-flap wordmark, flap text, odometer
  digits, marquees) render a real `sr-only` copy and mark the animated copies
  `aria-hidden`, so assistive tech reads each string once.
- **Single source of truth** for site facts (name, role, contact, URLs) in
  `src/lib/site.ts`, consumed by metadata, JSON-LD, sitemap, and OG images.

## Local setup

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

Environment variables are documented in `.env.example`. The only one used is
`NEXT_PUBLIC_SITE_URL` (defaults to `https://praduansaha.com`); no secrets are
required to run the site.

## Project layout

```
src/
  app/            # App Router routes, layouts, per-route OG images
  components/     # sections, primitives, motion, mdx blocks, layout
  content/work/   # case studies (MDX + front-matter)
  lib/            # site facts, motion tokens, lenis/gsap wiring, content loaders
public/           # images, logos, videos, fonts, favicons
scripts/          # local QA harnesses (screenshots, lighthouse, mockup rendering)
```

## Deployment

Deployed on Vercel. Pushes to the production branch trigger a build and deploy;
`main` is the production branch and `staging` is the working branch.
