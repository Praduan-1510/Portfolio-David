---
title: Spendee
slug: spendee
client: Concept project        # [confirm] self-initiated, or real client work?
role: UI/UX & Product Design   # [confirm] your exact role — solo, or part of a team?
year: 2025                     # [confirm]
services: [UX Design, UI Design, Design System, Prototyping]
summary: A dark-mode finance super-app for Indian small businesses — ledger, GST, invoicing, payments, and credit in one calm interface.
cover: /images/work/spendee/dashboard.png
accent: "#C2E000"              # [confirm] Spendee's lime-green; or use the onboarding blue
featured: true
order: 1
gallery:
  - /images/work/spendee/welcome.png
  - /images/work/spendee/onboarding-1.png
  - /images/work/spendee/onboarding-2.png
  - /images/work/spendee/onboarding-3.png
  - /images/work/spendee/login.png
  - /images/work/spendee/sign-up.png
  - /images/work/spendee/dashboard.png
  - /images/work/spendee/add-entry.png
  - /images/work/spendee/send-money.png
  - /images/work/spendee/contact.png
  - /images/work/spendee/customer-details.png
  - /images/work/spendee/invoices.png
  - /images/work/spendee/gst-center.png
  - /images/work/spendee/reports.png
  - /images/work/spendee/spendee-bank.png
  - /images/work/spendee/credit-growth.png
  - /images/work/spendee/notifications.png
  - /images/work/spendee/settings.png
  - /images/work/spendee/edit-profile.png
---

> **This is the MDX body for `src/content/work/spendee.mdx`.** The frontmatter above matches the `Project` schema in `ARCHITECTURE.md` §8. Image paths assume the screens are placed under `public/images/work/spendee/` — see the asset manifest at the end.

# Spendee — a finance super-app for small business

Spendee pulls everything a small-business owner juggles — their ledger, GST filing, invoicing, payments, and access to credit — into one dark, calm interface. It's a concept exploring how to make Indian SMB finance feel manageable instead of scattered across a paper khata, a tax portal, an invoicing tool, and three banking apps.

## The problem

A small-business owner in India usually keeps their books in a paper khata or a basic ledger app, files GST through a separate portal or an accountant, raises invoices somewhere else, collects over UPI, and chases working capital from banks that never see their real cash position. The information lives in silos, compliance deadlines sneak up, and the very data that proves a business is healthy never gets used to unlock the credit it qualifies for.

The design challenge: bring all of it into one place — and make a dense, high-stakes, deadline-driven domain feel calm and in control rather than overwhelming.

## My role

`[confirm]` I designed Spendee end to end — information architecture, user flows, UI across every screen, and the design system that holds it together.

## Approach

A few decisions shaped the whole product.

**Start from a model the owner already knows: "I Gave / I Got."** The core ledger entry is built on the khata mental model — money you gave (payable) versus money you got (receivable) — so the most frequent action feels familiar from the first use rather than like accounting software.

**A calm dark interface where colour is information, not decoration.** The entire app sits on near-black, which lets colour carry meaning: green for money in and settled, red for overdue and money out, amber for pending items and approaching deadlines. The eye learns the system once and reads every screen faster for it.

**Surface the next action, not just the data.** Every screen leads with something to do — "File & Pay Now", "Collect from 3 clients", "Get ₹62k Today", "Apply in 2 Minutes" — turning passive numbers into prompts that move the business forward.

**One consistent shell.** A five-slot bottom bar — Home, Ledger, a central add button, Bank, More — keeps the highest-frequency actions one tap away everywhere in the app, with a recurring header pattern (back · section label · title) so you always know where you are.

## Walkthrough

**Onboarding & welcome.** A short, four-step intro frames the value — a smart ledger, AI that watches your cash flow, and credit built on your books — over a blue-to-lime gradient, before handing off to the calm, near-black product.

**Sign in & sign up.** Mobile-first auth with a four-digit PIN, biometrics, and Google, plus GSTIN capture at registration — built for how Indian small businesses actually onboard.

**Dashboard.** The home screen answers one question: *how is my business right now?* Net position with its monthly trend, money to get versus give, a cash-velocity gauge, quick actions, recent activity, and surfaced alerts for GST due and low stock — the whole state of the business above the fold.

**Ledger.** Recording a transaction is the core loop: choose gave or got, enter the amount, contact, dates, and payment method, and attach a receipt that OCR reads automatically. Sending money links straight back to an open payable so the books stay reconciled.

**Contacts & customers.** Every customer and vendor with their outstanding balance and status, filterable by overdue, pending, and settled, drilling into a per-contact history with one-tap call, invoice, WhatsApp, and reminders.

**Invoices.** Create, track, and chase invoices by status, with share-as-PDF and reminders — and for overdue invoices, the option to discount them for instant cash.

**GST Center.** The compliance hub, and the screen I'm most proud of: GSTR-3B and GSTR-1 summaries, tax liability against available input tax credit, deadline countdowns, and one-tap file-and-pay. It turns a stressful, easy-to-miss obligation into a guided task.

**Reports.** A P&L summary, a six-month cash-flow chart, and the metrics owners actually act on — average collection period, working capital, gross margin — exportable as a PDF.

**Banking.** A built-in account with card, balance, a virtual account for UPI collections, and a shareable payment link, alongside transaction history.

**Credit & Growth.** The payoff of keeping good books: a ledger-health score built from on-time payments, inflow, and GST compliance, used to pre-approve working capital and let owners discount specific invoices for cash. This is the thread that ties the whole product together — good data in the ledger becomes real financial leverage.

**Notifications & settings.** Prioritised alerts split into urgent and earlier — overdue payments, filing deadlines, low stock — plus a settings hub for business profile, reminders, team access, and Tally-compatible data export.

## Design system

One dark surface; a status colour system (green / red / amber) that encodes meaning across the app; rounded cards as the primary container; a consistent header pattern; the five-slot bottom navigation with a central add button; and a rounded, slightly geometric display face paired with a clean UI sans. `[confirm]` If you have a styles/components board, send it and I'll add a "system" section showing the tokens and components directly.

## Outcome

An end-to-end product design: 19 screens spanning onboarding, authentication, ledger, contacts, invoicing, GST, reporting, banking, credit, and settings — held together by a single design system and one consistent navigation model.

`[confirm — reflection in your words]` As a concept, Spendee explores how an intimidating, compliance-heavy domain can be made to feel calm and actionable. Given more time, I'd validate the ledger flow with real owners, build a clickable prototype of the core loops, and pressure-test the GST flow against real filing data.

---

### Asset manifest (place these in `public/images/work/spendee/`)

| Your upload | Repo path | Used in |
|---|---|---|
| `Welcome.png` | `welcome.png` | Onboarding |
| `Onboarding_1.png` | `onboarding-1.png` | Onboarding |
| `Onboarding_2.png` | `onboarding-2.png` | Onboarding |
| `Onboarding_3.png` | `onboarding-3.png` | Onboarding |
| `Login.png` | `login.png` | Auth |
| `Sign_Up.png` | `sign-up.png` | Auth |
| `Dashboard.png` | `dashboard.png` | Dashboard / **cover** |
| `Add_Entry.png` | `add-entry.png` | Ledger |
| `Send_Money.png` | `send-money.png` | Ledger |
| `Contact.png` | `contact.png` | Contacts |
| `Customer_Details.png` | `customer-details.png` | Contacts |
| `Invoices.png` | `invoices.png` | Invoices |
| `GST_Center.png` | `gst-center.png` | GST Center |
| `Reports.png` | `reports.png` | Reports |
| `Spendee_Bank.png` | `spendee-bank.png` | Banking |
| `Credit___Growth.png` | `credit-growth.png` | Credit & Growth |
| `Notifications.png` | `notifications.png` | Notifications |
| `Settings.png` | `settings.png` | Settings |
| `Edit_Profile.png` | `edit-profile.png` | Settings |