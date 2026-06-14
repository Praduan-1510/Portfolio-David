---
title: Voyager
slug: voyager
client: Concept project        # [confirm] self-initiated, or real client work?
role: UI/UX & Product Design   # [confirm] your exact role — solo, or part of a team?
year: 2025                     # [confirm]
services: [UX Design, UI Design, Design System, Prototyping]
summary: A travel app that carries you from inspiration to a booked, day-by-day itinerary — browse, plan, pay, and go, all in one place.
cover: /images/work/voyager/dashboard.png
accent: "#F5A623"              # Voyager orange [confirm]
featured: true
order: 2
gallery:
  - /images/work/voyager/splash.png
  - /images/work/voyager/onboarding-1.png
  - /images/work/voyager/onboarding-2.png
  - /images/work/voyager/onboarding-3.png
  - /images/work/voyager/create-account.png
  - /images/work/voyager/dashboard.png
  - /images/work/voyager/search.png
  - /images/work/voyager/map.png
  - /images/work/voyager/saved.png
  - /images/work/voyager/destination-details.png
  - /images/work/voyager/dates-guests.png
  - /images/work/voyager/payment.png
  - /images/work/voyager/confirmation.png
  - /images/work/voyager/itinerary.png
  - /images/work/voyager/my-trips.png
  - /images/work/voyager/reviews.png
  - /images/work/voyager/profile.png
  - /images/work/voyager/notifications.png
  - /images/work/voyager/settings.png
---

> **This is the MDX body for `src/content/work/voyager.mdx`.** Frontmatter matches the `Project` schema in `ARCHITECTURE.md` §8; image paths assume the screens live under `public/images/work/voyager/` — see the asset manifest at the end.

# Voyager — from inspiration to a booked itinerary

Voyager carries someone all the way from *"where should I go?"* to a confirmed, hour-by-hour itinerary — browsing curated destinations, planning dates and guests, paying, and managing the trip, all in one app. It's a concept exploring how the whole arc of travel can live in one place instead of scattered across a dozen tabs.

## The problem

Booking a trip usually means bouncing between an inspiration source, a flight site, a hotel site, a maps app, and a notes doc for the day-to-day plan — and the excitement of travel drowns in tab-juggling and logistics. The design challenge: hold the entire journey — discover, plan, book, and travel — in one app, and keep it feeling like an adventure rather than admin.

## My role

`[confirm]` I designed Voyager end to end — information architecture, user flows, UI across every screen, and the design system.

## Approach

A few decisions shaped the whole product.

**Two moods, on purpose.** The browse-and-dream screens — home, search, map, trips, profile — sit on deep navy with a topographic-map motif and warm orange, so they feel like wanderlust. The task-heavy screens — the booking steps, details, settings — flip to clean light backgrounds so picking dates, paying, and reading an itinerary stay calm and legible. The app changes its tone to match what you're doing.

**One warm accent doing the work.** Orange marks every primary action and highlight across both themes — Book Now, Continue, prices, active states — so the path forward is always obvious whichever mode you're in.

**A booking flow you can always orient in.** A persistent four-step progress stepper — dates & guests → customise → payment → confirmation — runs across the top of the flow, so the traveller always knows how far along they are and what's left.

**Inspiration first, logistics second.** Home and search lead with photography — big, saveable destination cards with duration and price — putting the dream up front, with the practical filters (flights, hotels, tours, packages) one tap away.

## Walkthrough

**Splash & onboarding.** A topographic splash — "your world awaits" — into a three-step intro that frames the value (explore 150+ countries, AI-built itineraries) over immersive destination collages.

**Create account.** A warm, branded sign-up over the topographic pattern, with Google and Apple options.

**Home.** A personalised greeting, a prominent search, and curated rows — Explore, a limited-time offer, Top Rated — each destination a photo card with duration, price, and a save heart.

**Search & map.** Find destinations by query and filter chips (flights, hotels, tours, packages), switch to a map view to browse by place, and keep favourites in a dedicated saved grid.

**Destination details.** A full-bleed hero, the numbers that matter (days, rating, bookings), an overview, what's included, and a sticky price with Book Now.

**Booking flow.** Pick dates and guests on a clean calendar with adult and child counts, customise the trip, and pay — with an itemised breakdown (package, transfer, insurance, taxes) and saved cards — ending in a clear confirmation with a booking reference and ticket download.

**Itinerary.** A day-by-day plan on a vertical timeline — flights, transfers, check-in, dinners — each with time, type, and detail, switchable by day.

**My Trips.** Upcoming, active, and past trips as photo cards, with quick actions to step through each.

**Reviews.** An aggregate rating with a distribution breakdown and individual traveller reviews.

**Profile & loyalty.** Traveller stats, a Gold-member tier with points toward an upgrade, and shortcuts to bookings, saved places, payment methods, and promo codes.

**Notifications & settings.** Timely, grouped updates — flight confirmed, hotel ready, transport, deals, review prompts — and a settings hub for account, preferences, currency, and privacy.

## Design system

A dual-theme system — deep navy with a topographic-map motif for the immersive screens, clean light surfaces for the task-heavy ones — unified by a single warm orange accent for actions and highlights. Photo-led destination cards, a four-step booking stepper, a five-slot bottom nav (Home, Search, Explore, Trip, Profile), and a geometric sans for headings paired with a clean UI sans. `[confirm]` If you have a styles/components board, send it and I'll add a "design system" section showing tokens and components.

## Outcome

An end-to-end product design: 19 screens spanning onboarding, authentication, discovery, search and map, destination details, a full four-step booking flow, a day-by-day itinerary, trips, reviews, profile and loyalty, notifications, and settings — unified by one design system across two themes.

`[confirm — reflection in your words]` As a concept, Voyager explores how a fragmented, multi-tab process can become one continuous, inspiring flow from dream to departure. Given more time, I'd prototype the booking flow end to end and test the date/guest and payment steps for friction.

---

### Asset manifest (place these in `public/images/work/voyager/`)

*Go by screen content — a couple of your filenames look crossed (there are two `Settings` files, and the itinerary screen; rename whichever is the itinerary to `itinerary.png`).*

| Screen | Repo path |
|---|---|
| Splash | `splash.png` |
| Onboarding 1 / 2 / 3 | `onboarding-1.png` / `-2.png` / `-3.png` |
| Create account | `create-account.png` |
| Home / dashboard | `dashboard.png` (**cover**) |
| Find Destinations (search) | `search.png` |
| Map view | `map.png` |
| Saved | `saved.png` |
| Destination details | `destination-details.png` |
| Dates & Guests | `dates-guests.png` |
| Customise / Payment | `payment.png` |
| Confirmation | `confirmation.png` |
| Paris Itinerary | `itinerary.png` |
| My Trips | `my-trips.png` |
| Reviews | `reviews.png` |
| Profile | `profile.png` |
| Notifications | `notifications.png` |
| Settings | `settings.png` |