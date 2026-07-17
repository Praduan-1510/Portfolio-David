---
title: Decathlon — App Redesign   # [confirm title] this is your "E-Commerce V1" project
slug: decathlon
client: Concept redesign (unofficial)   # [confirm]
role: UI/UX & Product Design            # [confirm] solo, or part of a team?
year: 2025                              # [confirm] (in-app order dates show 2026)
services: [UX Design, UI Design, Design System, Prototyping]
summary: A clean redesign concept for a sports-retail app — browse a huge multi-sport catalogue, filter fast, and check out in a few taps.
cover: /images/work/decathlon/home.png
accent: "#0082C3"                       # Decathlon blue [confirm]
featured: true
order: 3
gallery:
  - /images/work/decathlon/welcome.png
  - /images/work/decathlon/home.png
  - /images/work/decathlon/categories.png
  - /images/work/decathlon/search.png
  - /images/work/decathlon/filters.png
  - /images/work/decathlon/product-details.png
  - /images/work/decathlon/bag.png
  - /images/work/decathlon/checkout.png
  - /images/work/decathlon/confirmation.png
  - /images/work/decathlon/account.png
  - /images/work/decathlon/order-history.png
  - /images/work/decathlon/wishlist.png
  - /images/work/decathlon/travel-store.png
---

> **This is the MDX body for `src/content/work/decathlon.mdx`.** Frontmatter matches the `Project` schema in `ARCHITECTURE.md` §8; image paths assume the screens live under `public/images/work/decathlon/` — see the asset manifest at the end.
>
> *Unofficial concept redesign. "Decathlon" and its logo are trademarks of their owner; this project is not affiliated with or endorsed by Decathlon.*

# Decathlon — a sports retail app, redesigned

A redesign concept for a sports-retail experience: a huge, multi-sport catalogue made fast to browse, filter, and buy. The goal was to take someone from "I need running shoes" to a confirmed order without drowning them in options.

## The problem

A sports retailer's catalogue spans dozens of sports and thousands of products. The hard part isn't showing the range — it's helping one person cut through it quickly. This redesign focuses on three things: fast discovery (categories, search, filters), product pages that make the buying decision easy, and a short, confident checkout.

## My role

`[confirm]` I designed the experience end to end — information architecture, user flows, UI across every screen, and the design system.

## Approach

A few decisions shaped the product.

**Image-first browsing.** Home and category screens are dense, photo-led grids — sport and product imagery does the navigating, which suits a visual, multi-sport catalogue far better than text lists.

**Fast narrowing.** Search pairs prominent filter chips with a full filter sheet — price range, category counts, size, brand — so a broad query like "running shoes" (48 results) narrows to the right pair in a tap or two.

**A short, legible checkout.** A three-step flow — address → payment → confirm — with a clear bag summary, promo code, and one primary action per screen keeps a high-stakes moment calm.

**One brand colour, used with restraint.** Decathlon's blue anchors actions and brand moments against a clean white interface, so the products and photography stay the focus.

**A consistent five-tab shell.** Home, Categories, Travel store, Bag, Account — covering browse, buy, and manage — with a clear active state throughout.

## Walkthrough

**Welcome.** A branded blue splash — "your sports, your world" — into get-started and sign-in.

**Home.** A sale hero, then a photo grid of sport categories, with location-aware delivery and search up top.

**Categories.** The full catalogue as a scannable image grid spanning every sport.

**Search & filters.** A query returns a two-column product grid with ratings and discounted prices; filter chips and a full filter sheet (price range, category counts, size, brand) narrow it fast.

**Product details.** A large product image, price with the original struck through, rating, colour and size selectors, description, and Add to bag.

**Bag.** Line items with quantity steppers and savings, a promo-code field, and a price breakdown — subtotal, discount, GST, delivery — into checkout.

**Checkout & confirmation.** A three-step address → payment → confirm flow with multiple payment methods, ending in a clean order-confirmed screen with continue-shopping and order tracking.

**Account & orders.** A profile with club membership, orders, wishlist, saved addresses, and support; an orders screen with status tabs (all, active, delivered, returns), plus reorder and review.

**Wishlist.** Saved products as cards with quick add-to-cart.

**Store locator.** A world map of store coverage and nearby stores with photos.

## Design system

A clean, light interface anchored by Decathlon's blue; photo-led category and product cards; a consistent header and a five-tab bottom nav with a clear active state; a rating-plus-strikethrough-price pattern for products; and a bold sans for headings paired with a clean UI sans. `[confirm]` If you have a styles/components board, send it and I'll add a "design system" section.

## Outcome

An end-to-end e-commerce design: 13 screens spanning onboarding, home, categories, search and filtering, product detail, bag, a three-step checkout, confirmation, account, orders, wishlist, and store locator — unified by one design system.

`[confirm — reflection in your words]` As a concept, this explores how a large, multi-sport catalogue can stay fast and uncluttered from first tap to checkout. Given more time, I'd prototype the search → filter → product → checkout path and test the filter sheet for friction.

---

### Asset manifest (place these in `public/images/work/decathlon/`)

| Your upload | Repo path | Used in |
|---|---|---|
| `..._Welcome.png` | `welcome.png` | Welcome |
| `..._Home.png` | `home.png` | Home / **cover** |
| `..._Category.png` | `categories.png` | Categories |
| `..._Search_results.png` | `search.png` | Search |
| `..._Filters.png` | `filters.png` | Filters |
| `..._Product_details.png` | `product-details.png` | Product detail |
| `..._Bag.png` | `bag.png` | Bag |
| `..._Checkout.png` | `checkout.png` | Checkout |
| `..._Confirmation.png` | `confirmation.png` | Confirmation |
| `..._Account.png` | `account.png` | Account |
| `..._Order_history.png` | `order-history.png` | Orders |
| `..._Wishlist.png` | `wishlist.png` | Wishlist |
| `..._Travel_Store.png` | `travel-store.png` | Store locator |