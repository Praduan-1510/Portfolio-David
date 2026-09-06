/**
 * Bespoke icon set.
 *
 * The dock, the ETA pill and the delivery states all use marks drawn for Nukkad rather than a
 * stock library: a corner shop with a half-rolled shutter, a cloth jhola, a door nameplate, and a
 * lightning bolt whose lower half turns ninety degrees — the corner. Everything else (chevrons,
 * search, close) is a plain 24-grid stroke icon at 1.75, so the bespoke marks stay the loud ones.
 */
const svg = (paths, { size = 24, fill = false } = {}) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill ? 'currentColor' : 'none'}"
        stroke="${fill ? 'none' : 'currentColor'}" stroke-width="1.75" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  /* ── Dock ─────────────────────────────────────────────────────────────── */
  // A shopfront with its shutter half rolled up: the corner shop, open.
  home: (o) =>
    svg(
      '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M6 9.5h12M6 12.5h12"/><path d="M8 21v-4.5a4 4 0 0 1 8 0V21"/>',
      o,
    ),
  // A jaali screen: four cells, one filled — the shelf you are looking at.
  categories: (o) =>
    svg(
      '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" stroke="none"/>',
      o,
    ),
  // A cloth jhola, the bag every Indian household keeps by the door.
  orders: (o) =>
    svg(
      '<path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
      o,
    ),
  // A door nameplate.
  you: (o) =>
    svg(
      '<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 17.5a4.5 4.5 0 0 1 9 0"/>',
      o,
    ),
  search: (o) => svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>', o),

  /* ── Delivery ─────────────────────────────────────────────────────────── */
  // The bolt turns a corner: speed, but around the block rather than in a straight line.
  bolt: (o) =>
    svg('<path d="M13 2 5 13h5l-1 9 6-8h-4l2-5h5Z" fill="currentColor" stroke="none"/>', o),
  scooter: (o) =>
    svg(
      '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6M6 17V9h5l4 8"/><path d="M11 9h4l2 4"/>',
      o,
    ),
  shop: (o) =>
    svg(
      '<path d="M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M3 9l1.6-5h14.8L21 9"/><path d="M9 21v-5h6v5"/>',
      o,
    ),
  pin: (o) =>
    svg(
      '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
      o,
    ),

  /* ── Utility ──────────────────────────────────────────────────────────── */
  chevron: (o) => svg('<path d="m9 5 7 7-7 7"/>', o),
  chevronDown: (o) => svg('<path d="m5 9 7 7 7-7"/>', o),
  back: (o) => svg('<path d="m15 5-7 7 7 7"/>', o),
  close: (o) => svg('<path d="m6 6 12 12M18 6 6 18"/>', o),
  check: (o) => svg('<path d="m5 12.5 4.5 4.5L19 7"/>', o),
  plus: (o) => svg('<path d="M12 5v14M5 12h14"/>', o),
  minus: (o) => svg('<path d="M5 12h14"/>', o),
  mic: (o) =>
    svg(
      '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
      o,
    ),
  scan: (o) =>
    svg(
      '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M7 12h10"/>',
      o,
    ),
  phone: (o) =>
    svg(
      '<path d="M6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L21 15v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.2 2 2 0 0 1 6 3Z"/>',
      o,
    ),
  chat: (o) =>
    svg(
      '<path d="M20 12a7 7 0 0 1-7 7H8l-4 3v-4.5A7 7 0 0 1 4 12a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7Z"/>',
      o,
    ),
  help: (o) =>
    svg(
      '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3"/><path d="M12 17h.01"/>',
      o,
    ),
  ticket: (o) =>
    svg(
      '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5Z"/><path d="M13 6v12" stroke-dasharray="2 3"/>',
      o,
    ),
  // Cash: a ₹ on a note. Drawn rather than borrowed, so it sits at the same 1.75 stroke as
  // the rest of the set instead of importing a second icon language for one row.
  rupee: (o) =>
    svg(
      '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/>' +
        '<path d="M9.5 9h5M9.5 11.5h5M13 9c1.6 0 2.4 1 2.4 2s-.8 2.2-2.6 2.2H9.5L14 17"/>',
      o,
    ),
  wallet: (o) =>
    svg(
      '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none"/>',
      o,
    ),
  gift: (o) =>
    svg(
      '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12"/><path d="M12 9S9 3 6.5 4.5 9 9 12 9Zm0 0s3-6 5.5-4.5S15 9 12 9Z"/>',
      o,
    ),
  clock: (o) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>', o),
  shield: (o) =>
    svg('<path d="M12 3 5 6v6c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6Z"/><path d="m9 12 2 2 4-4"/>', o),
  settings: (o) =>
    svg(
      '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
      o,
    ),
  sparkle: (o) =>
    svg('<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9Z"/>', o),
  filter: (o) => svg('<path d="M4 6h16M7 12h10M10 18h4"/>', o),
  leaf: (o) =>
    svg('<path d="M20 4S9 3 6 8s0 11 0 11 6 2 10-3 4-12 4-12Z"/><path d="M12 12 6 19"/>', o),
};

export const icon = (name, opts) => (icons[name] ? icons[name](opts) : '');
