/*
 * Screen registry — one entry per coded mockup. `w`/`h` are the ORIGINAL PNG's
 * CSS-pixel dimensions (the renderer outputs @2x). A screen only renders once
 * scripts/render-mockups/<app>/<name>.html exists, so this list can lead the
 * build. Screens verified clean (onboarding/splash/photo-collages and the
 * Decathlon home/categories/travel-store/confirmation) are intentionally absent.
 */
export const MANIFEST = [
  // ── Spendee (402 wide) ────────────────────────────────────────────────
  { app: "spendee", name: "dashboard", w: 402, h: 1320 },
  { app: "spendee", name: "gst-center", w: 402, h: 967 },
  { app: "spendee", name: "credit-growth", w: 402, h: 1189 },
  { app: "spendee", name: "add-entry", w: 402, h: 1045 },
  { app: "spendee", name: "send-money", w: 402, h: 874 },
  { app: "spendee", name: "contact", w: 402, h: 874 },
  { app: "spendee", name: "customer-details", w: 402, h: 874 },
  { app: "spendee", name: "invoices", w: 402, h: 874 },
  { app: "spendee", name: "reports", w: 402, h: 967 },
  { app: "spendee", name: "spendee-bank", w: 402, h: 1145 },
  { app: "spendee", name: "notifications", w: 402, h: 967 },
  { app: "spendee", name: "settings", w: 402, h: 1145 },
  { app: "spendee", name: "edit-profile", w: 402, h: 1781 },
  { app: "spendee", name: "sign-up", w: 402, h: 874 },
  { app: "spendee", name: "login", w: 402, h: 874 },
  { app: "spendee", name: "welcome", w: 402, h: 874 },

  // ── Voyager (402 wide) ────────────────────────────────────────────────
  { app: "voyager", name: "payment", w: 402, h: 932 },
  { app: "voyager", name: "itinerary", w: 402, h: 932 },
  { app: "voyager", name: "dashboard", w: 402, h: 1188 },
  { app: "voyager", name: "search", w: 402, h: 986 },
  { app: "voyager", name: "saved", w: 402, h: 932 },
  { app: "voyager", name: "destination-details", w: 402, h: 986 },
  { app: "voyager", name: "my-trips", w: 402, h: 986 },
  { app: "voyager", name: "reviews", w: 402, h: 932 },
  { app: "voyager", name: "notifications", w: 402, h: 932 },
  { app: "voyager", name: "documents", w: 402, h: 932 },
  { app: "voyager", name: "support", w: 402, h: 932 },
  { app: "voyager", name: "profile", w: 402, h: 932 },
  { app: "voyager", name: "rewards", w: 402, h: 932 },
  { app: "voyager", name: "dates-guests", w: 402, h: 932 },
  { app: "voyager", name: "filters", w: 402, h: 986 },
  { app: "voyager", name: "create-account", w: 402, h: 874 },

  // ── Decathlon (393 wide) ──────────────────────────────────────────────
  { app: "decathlon", name: "bag", w: 393, h: 964 },
  { app: "decathlon", name: "checkout", w: 393, h: 852 },
  { app: "decathlon", name: "product-details", w: 393, h: 902 },
  { app: "decathlon", name: "search", w: 393, h: 997 },
  { app: "decathlon", name: "wishlist", w: 393, h: 852 },
  { app: "decathlon", name: "order-history", w: 393, h: 852 },
  { app: "decathlon", name: "account", w: 393, h: 852 },
  { app: "decathlon", name: "welcome", w: 393, h: 852 },
  { app: "decathlon", name: "filters", w: 393, h: 864 },
];
