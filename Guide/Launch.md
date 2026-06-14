# Launch Checklist — Praduan Saha Portfolio

> Work top to bottom before going public. The screen-polish section is the one most worth doing first — those are visible details reviewers notice.

## 1. Content & accuracy
- [ ] Confirm `[confirm]` frontmatter in all three case studies: **client** (concept vs real), **your role** (solo/team), **year**.
- [ ] Lock the **hero headline** (currently "I turn complex ideas into clean, usable design").
- [ ] Decide the **availability** line (open to work — include or remove).
- [ ] Set the **work-index order** (which project leads).
- [ ] Proofread all copy. Decathlon stays labelled an **unofficial concept**.
- [ ] Email + LinkedIn correct; phone left **off** the public site.

## 2. Screen polish (fix in Figma, re-export, then place) — punch-list
**Spendee**
- [ ] Currency: make it consistently **₹** (screens mix `$` and `₹` on an Indian/GST product).
- [ ] Locale: Sign Up / Edit Profile show **"Arizona, US" / "Phoenix, Arizona"** and **"$ DLR"** — change to Indian values to match +91 / GSTIN.
- [ ] Dummy data: **"To Get" = "To Give"** (same number); Send Money note field is labelled **"CONTACT NAME"** (should be Note/Reference).
- [ ] Card holder name consistency (Alex Johnson vs Joseph Alfred).

**Voyager**
- [ ] **"Belarus / Rome 10 Days"** card is mislabelled.
- [ ] Settings shows **₹** while all prices are **$** — pick one.
- [ ] Placeholder name varies (David / Alex Johnson / Alex Pope) — make it consistent.

**Decathlon**
- [ ] **Bag math doesn't add up**: Discount Rs 42000 > Subtotal Rs 28000, and Total ignores the discount.
- [ ] **"Sing in"** → "Sign in" on the Welcome screen.
- [ ] **"Returnes"** → "Returns" tab on My Orders.

**All three**
- [ ] The same demo card (`•••• 4887`, Alex Johnson, 09/28) appears across apps — vary it so each reads as its own product.
- [ ] Replace any obvious lorem/placeholder text with realistic content.

## 3. Responsive & devices
- [ ] Test latest **Chrome, Safari, Firefox, Edge** + **iOS Safari** (scroll behaves differently there).
- [ ] One high-end + one **mid-range phone**, tablet, laptop, large desktop.
- [ ] The scroll set-pieces (work index, any pinning) have a working **mobile fallback**.

## 4. Motion & accessibility
- [ ] **`prefers-reduced-motion`** ON → shader freezes, reveals off, content shows immediately, transitions instant.
- [ ] **Keyboard**: every interaction reachable, logical tab order, visible focus, skip-to-content works.
- [ ] **Contrast** AA across text and the three accents on the dark base.
- [ ] Animations are **transform/opacity only**, hold **60fps**, no layout shift.
- [ ] Custom cursor disabled on touch; the real cursor stays usable.

## 5. Performance
- [ ] Lighthouse: **LCP < 2.5s · CLS < 0.1 · INP < 200ms**.
- [ ] Images via **next/image** with explicit sizes; `priority` only on the LCP image; media space reserved.
- [ ] **WebGL layer lazy-loaded** (`next/dynamic`, `ssr:false`); paused when offscreen; dpr capped.
- [ ] Hero font preloaded; no font flash.
- [ ] Test on a throttled connection.

## 6. SEO & metadata
- [ ] Per-route **title** + **meta description** (from `SITE_CONTENT.md`).
- [ ] **Open Graph / Twitter** share images (a default + ideally one per project).
- [ ] `sitemap.ts`, `robots.ts`.
- [ ] **JSON-LD**: `Person` (you) and `CreativeWork` (each project).
- [ ] Favicon / app icons (and a small monogram if you add one).

## 7. Functionality
- [ ] Contact path works (mailto or a serverless form).
- [ ] Every link goes where its label says; external links use `rel="noopener"`.
- [ ] Custom **404** page.
- [ ] No console errors.

## 8. Analytics
- [ ] Vercel Analytics or Plausible added (lightweight, privacy-friendly).

## 9. Deploy
- [ ] Push to GitHub; import to **Vercel**.
- [ ] Any env vars (e.g. form/email service) set in Vercel, not committed.
- [ ] Connect **custom domain**; verify SSL.
- [ ] Check the production deploy on a fresh device, not just localhost.

## 10. Post-launch
- [ ] Submit the sitemap (Google Search Console).
- [ ] Add the live URL to your LinkedIn and résumé.
- [ ] Re-run Lighthouse on production.