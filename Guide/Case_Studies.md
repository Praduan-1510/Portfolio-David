# Case Study Design System & Structure Guide

A reusable spec for structuring every case study on the site so they read as
consistent, intentional, and world-class. Use this as the source of truth when
building or refactoring a case study (start with Spendee).

---

## 0. Operating Principles

Before the structure, the rules that make a case study feel senior rather than
like a screenshot dump:

1. **Tell a story, not a timeline.** Every case study is a narrative with
   tension and resolution: here was the problem → here's how I thought about it
   → here's what I shipped → here's what changed. If a section doesn't advance
   that arc, cut it.
2. **Show the thinking, not just the pixels.** Anyone can post final screens.
   What separates strong portfolios is visible reasoning — the messy middle,
   the tradeoffs, the decisions you *didn't* make and why.
3. **Lead with impact, prove it with process.** State the outcome early
   (in the overview), then spend the body earning it.
4. **Scannable on the surface, deep underneath.** A hiring manager skims in
   90 seconds. Make headings, captions, and the side nav tell the whole story
   on their own; reward the reader who goes deeper.
5. **Consistency is the product.** Every case study should use the *same*
   section system, the same side nav, the same image treatments, the same
   typographic rhythm. The structure becomes invisible and the work stands out.
6. **One idea per section.** Each section answers exactly one question. If you
   feel two ideas fighting, split them.

---

## 1. Page Architecture

The whole point of this refactor: a **two-region layout** with a persistent
section navigation on the side.

```
┌──────────────────────────────────────────────────────────────┐
│  HERO (full-bleed, no sidebar yet)                             │
├──────────────┬───────────────────────────────────────────────┤
│              │                                                 │
│   SIDE NAV   │   CONTENT COLUMN                                │
│   (sticky)   │   (sections stack vertically)                  │
│              │                                                 │
│  • Overview  │   ## Overview                                   │
│  • Context   │   ...                                           │
│  • Problem   │                                                 │
│  • Research  │   ## Context                                    │
│  • Strategy  │   ...                                           │
│  • Design    │                                                 │
│  • Outcome   │   ## Problem                                    │
│  • Reflect   │   ...                                           │
│              │                                                 │
├──────────────┴───────────────────────────────────────────────┤
│  FOOTER / NEXT CASE STUDY (full-bleed)                         │
└──────────────────────────────────────────────────────────────┘
```

**Grid**
- Content column max-width: ~720–820px for text, but allow media to break out
  wider (up to ~1100px or full-bleed) for hero shots and key screens.
- Side nav width: ~200–240px, left-aligned, with generous gutter (~80–120px)
  between nav and content.
- Vertical rhythm: large, consistent spacing between sections (e.g. 120–160px)
  so each section reads as its own "screen."

**Responsive**
- Desktop (≥1024px): sticky side nav visible.
- Tablet/mobile (<1024px): side nav collapses into a sticky top progress bar or
  a "Jump to section" dropdown; content goes single-column full-width.

---

## 2. Side Navigation Spec

This is the element your current case studies are missing. Build it once, reuse
everywhere.

**Contents**
- A short list of the section names (use the canonical section list in §3).
- Keep labels to 1–2 words: *Overview, Context, Problem, Research, Strategy,
  Design, Outcome, Reflection.*

**Behavior**
- **Sticky:** stays in view as the user scrolls the content column.
- **Scroll-spy:** the section currently in the viewport is highlighted
  (bold weight, accent color, or a filled dot). Use an IntersectionObserver
  keyed to each section's `id`.
- **Click-to-scroll:** clicking a label smooth-scrolls to that section and
  updates the URL hash (`#research`) for deep-linking and shareability.
- **Progress (optional):** a thin progress indicator showing how far through
  the study the reader is.

**Visual**
- Quiet by default — it's wayfinding, not decoration. Small type, muted color.
- Active state is the only loud thing.
- Optional: section numbers (01–08) for a more editorial feel.

**Accessibility**
- Wrap in `<nav aria-label="Case study sections">`.
- Active item gets `aria-current="true"`.
- Every section is an anchorable landmark with a real heading.

---

## 3. The Section System

The canonical sections, in order. Not every case study needs all of them — but
they should always appear in *this order*, and you should never invent a
new top-level section type per project. Pick from this set.

For each section below: **Purpose** (the one question it answers),
**Include** (content), **Layout** (how it's arranged), **Length** (keep honest).

---

### 3.1 — Hero / Cover
> *Question: What is this and why should I care?*

- **Include:** Project name, one-line value statement, a single striking visual
  (a polished hero mockup or product shot). Optionally: company logo, your role
  as a one-liner, year.
- **Layout:** Full-bleed, above the side nav. Big type, lots of breathing room.
  No body copy — this is a magazine cover, not a paragraph.
- **Length:** 1 screen. One sentence of copy, max.

---

### 3.2 — Overview / At a Glance
> *Question: Give me the whole story in 30 seconds.*

This is the most important section for skimmers. Many readers decide here
whether to keep going.

- **Include:**
  - A 2–3 sentence summary of the project and what you did.
  - **Meta block** (often rendered as a small left-aligned table or pill row):
    - **Role** (e.g. Lead Product Designer)
    - **Team** (who else — PM, eng count, etc.)
    - **Timeline** (e.g. 12 weeks, 2024)
    - **Platform** (iOS, Web, Design System…)
    - **Tools** (Figma, etc. — keep brief, it's the least interesting part)
  - **Headline outcome** stated up front (e.g. "+34% activation," "shipped to
    2M users"). Prove it later.
- **Layout:** Summary paragraph + meta block side by side, or meta as a compact
  spec card. This often mirrors the kind of info you'd pin in a sidebar.
- **Length:** Half a screen.

---

### 3.3 — Context & Background
> *Question: What's the product/company, and what world does this live in?*

- **Include:** What the product does, who uses it, where it was in its lifecycle,
  any business or market context that frames the work. Why this project, why now.
- **Layout:** Mostly prose, supported by a contextual image (the product as it
  existed before, a market diagram, etc.).
- **Length:** 1–2 short paragraphs. Resist the urge to write a company history.

---

### 3.4 — The Problem / Challenge
> *Question: What was broken, and what were we actually trying to solve?*

The pivot point of the story. Be specific and concrete.

- **Include:**
  - A sharp problem statement (ideally one bold sentence).
  - The pain — for users *and* for the business. Quantify if you can
    (drop-off rates, support tickets, churn).
  - Constraints you were working within (tech, time, brand, platform).
- **Layout:** A pulled-out problem statement (large quote-style text) followed by
  supporting detail. "Before" screenshots with annotations work well here.
- **Length:** Tight. The problem should feel urgent, not exhaustively documented.

---

### 3.5 — Goals & Success Metrics *(optional but powerful)*
> *Question: How would we know if this worked?*

- **Include:** The objectives, the design principles you set, and the metrics
  you'd judge success against. Setting metrics *before* the Outcome section makes
  your impact claims credible rather than retrofitted.
- **Layout:** Short list of goals + a small set of named metrics. Design
  principles can be 3–4 punchy statements.
- **Length:** Half a screen.

---

### 3.6 — Research & Discovery
> *Question: How did I understand the problem before solving it?*

- **Include:** Methods (interviews, surveys, competitive audit, analytics, support
  log review), who you talked to, and — most importantly — the **insights**, not
  the raw activity. "We did 12 interviews" is boring; "users abandoned at the
  link-bank step because they didn't trust it" is gold.
- Optionally: personas, journey maps, an affinity map, competitive teardown.
  Use these only if they earned a decision later.
- **Layout:** Insights as the headline, evidence as support. Each key insight can
  be its own mini-block with a one-line takeaway + supporting image/quote.
- **Length:** 1–2 screens. Curate ruthlessly — show 3 sharp insights, not 15.

---

### 3.7 — Strategy / Approach
> *Question: Given what I learned, what was the plan?*

The bridge between research and design. This section proves you think
strategically, not just decoratively.

- **Include:** How insights translated into a direction. "How might we…" framings,
  the bets you made, scope decisions, IA or user-flow decisions, the key tradeoff.
- **Layout:** Prose + a flow diagram, IA map, or sketch. Show the fork in the road
  and why you took your path.
- **Length:** 1 screen.

---

### 3.8 — Design / The Solution
> *Question: What did I actually make?*

The visual centerpiece — but structured, not a screenshot graveyard.

- **Include:** Walk through the solution **by feature or flow**, not screen by
  screen. For each: what it is, the key decision behind it, and the screen(s)
  that show it. Annotate screens to point at the decisions ("notice the
  progressive disclosure here").
- Break it into labeled sub-blocks (e.g. *Onboarding*, *The Dashboard*,
  *Adding a transaction*) rather than one undifferentiated wall.
- **Layout:** Alternate text and large media. Use full-bleed for the money shots,
  side-by-sides for before/after, device frames where they add clarity (and
  nowhere they don't).
- **Length:** This is the longest section — but every screen must justify itself
  with a caption explaining *why*, not just *what*.

---

### 3.9 — Design System / Craft Details *(optional)*
> *Question: How rigorous and detailed is the execution?*

- **Include:** Components, tokens, type scale, motion principles, edge cases,
  empty/error/loading states, responsive behavior — the craft that signals
  senior execution.
- **Layout:** A tidy grid of components or a spec-style breakdown.
- **Length:** Half to one screen. Skip if it doesn't strengthen *this* story.

---

### 3.10 — Prototype / Interaction *(optional)*
> *Question: How does it feel in motion?*

- **Include:** Short looping videos or GIFs of key interactions and transitions.
- **Layout:** Inline video, autoplay-muted-loop, with a one-line caption on what
  to notice.
- **Length:** A few clips, kept short.

---

### 3.11 — Testing & Iteration *(optional)*
> *Question: How did the design change once it met reality?*

- **Include:** Usability findings, what failed, what you changed. A v1→v2
  before/after is one of the most persuasive things you can show — it proves you
  iterate based on evidence, not ego.
- **Layout:** Before/after pairs with a note on what the test revealed.
- **Length:** Half a screen, focused on 1–2 meaningful changes.

---

### 3.12 — Outcome & Impact
> *Question: Did it work?*

Pay off the metrics you promised in Goals.

- **Include:** Quantitative results (the metrics, with numbers and timeframes),
  qualitative results (user/stakeholder quotes), and business impact. Be honest
  about what's measured vs. estimated.
- **Layout:** A small set of big-number stat blocks up top, supporting detail
  below, a testimonial pull-quote if you have a good one.
- **Length:** Half to one screen. Numbers do the talking.

---

### 3.13 — Reflection / Learnings
> *Question: What did I take away, and what would I do differently?*

The section juniors skip and seniors nail. Self-awareness reads as maturity.

- **Include:** What went well, what you'd change, what you learned, where the
  product went next (or could). One genuine "I'd do this differently" beats five
  humblebrags.
- **Layout:** Short prose. No images needed.
- **Length:** 1–2 paragraphs.

---

### 3.14 — Footer / Next Case Study
> *Question: Where do I go next?*

- **Include:** A prominent link to the **next** case study (keep people in the
  portfolio), plus back-to-work and contact links.
- **Layout:** Full-bleed, visually echoing the hero. A large preview card for the
  next project.
- **Length:** 1 screen.

---

## 4. Reusable Skeleton (copy this per case study)

```markdown
# [Project Name]
> [One-line value statement]

[Hero visual]

---

## Overview
[2–3 sentence summary. Lead with what you did and the headline result.]

**Role:** …
**Team:** …
**Timeline:** …
**Platform:** …
**Tools:** …

---

## Context
[What the product/company is and the world it lives in.]

## Problem
> [Sharp one-sentence problem statement.]
[The pain, for users and the business, with numbers. Constraints.]

## Goals & Metrics
[Objectives, design principles, success metrics defined up front.]

## Research
[Methods briefly, insights loudly. 3 sharp takeaways.]

## Strategy
[How insights → direction. HMWs, key bets, the main tradeoff. Flow/IA diagram.]

## Design
### [Feature / Flow 1]
[What it is + the key decision. Annotated screens.]
### [Feature / Flow 2]
…

## Craft Details        (optional)
[Components, states, motion, responsive.]

## Testing & Iteration  (optional)
[What failed, what changed. v1 → v2.]

## Outcome
[Big-number stats. Quotes. Business impact.]

## Reflection
[What went well, what you'd change, what you learned.]

---

## Next: [Next Project →]
```

---

## 5. Visual & Content Guidelines

Consistency across these is what makes the set feel "world-class."

**Typography**
- One clear hierarchy reused everywhere: section heading → sub-block heading →
  body → caption. Don't introduce new sizes per project.
- Generous line-height and measure (≈60–75 chars per line) for body text.

**Imagery**
- Pick a consistent treatment: e.g. soft shadow + rounded corners, OR full-bleed
  flat — not a mix. Same background tone behind mockups across all studies.
- Reserve full-bleed for the 2–3 best shots per study. Everything else lives
  inside the content column.
- Use device frames only when the platform context matters; otherwise show the
  UI clean.

**Captions (non-negotiable)**
- Every image gets a caption that explains the *decision* or *insight*, not the
  obvious ("the dashboard"). Captions are where you make skimmers into readers.

**Annotations**
- Point at the thing you want noticed. Numbered callouts or short labels beat a
  paragraph the reader has to map onto the screen themselves.

**Spacing & rhythm**
- Large, equal spacing between sections so each reads as its own screen.
- Consistent internal spacing within sections.

**Tone**
- First person, plain, confident. Short sentences. Cut adjectives. Let the work
  and the numbers carry the weight.

---

## 6. Do / Don't

**Do**
- State the outcome early, prove it late.
- Curate — 3 strong insights/screens beat 15 weak ones.
- Caption everything with the *why*.
- Keep the same section system and side nav across every study.
- Show one before/after and one honest reflection.

**Don't**
- Dump every screen you made.
- Narrate a literal timeline ("first I opened Figma…").
- Use process artifacts (personas, journey maps) as decoration if they didn't
  drive a decision.
- Reinvent the structure per project.
- Bury the result at the very bottom where skimmers never reach.

---

## 7. Applying this to Spendee (quick refactor checklist)

1. Add the **sticky side nav** with scroll-spy using the §3 section names.
2. Re-cut the existing page into the canonical sections — give each a real
   `id` and heading so the nav can track it.
3. Make sure there's an **Overview** with a meta block and a headline metric in
   the first screen.
4. Find or write a one-sentence **problem statement** and pull it out big.
5. Reframe the design walkthrough **by feature/flow**, not screen-by-screen, and
   add a *why* caption to each screen.
6. Confirm there's an **Outcome** with real numbers and a **Reflection** at the
   end, then a **Next case study** link in the footer.
7. Normalize image treatment and spacing to match the guidelines in §5.