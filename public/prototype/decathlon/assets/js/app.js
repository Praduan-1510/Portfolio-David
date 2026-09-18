/* ==========================================================================
   Decathlon prototype — shared interactions + commerce layer  (window.Deca)
   Load once, at the end of <body>:  <script src="../assets/js/app.js"></script>
   Page-specific logic goes in an inline <script> AFTER this file.
   Sections: 1 core helpers · 2 icons · 3 catalogue + demo data · 4 commerce
   state (bag, wish, orders, addresses, payment, user, location, notifications,
   searches, reviews) · 5 render helpers · 6 chrome (tab bar, brand header,
   badges) · 7 behaviours (routing, chips, sheets, dialogs, toast, forms, OTP,
   keypad, ranges, hearts, add-to-bag, qty, carousel) · 8 boot
   ========================================================================== */
(function () {
  'use strict';
  const D = (window.Deca = window.Deca || {});
  const body = document.body;
  const params = new URLSearchParams(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCREEN = (location.pathname.match(/([\w-]+)\.html$/) || [])[1] || 'home';

  /* ------------------------------------------------------------------ 1 core */
  if (params.has('capture')) body.classList.add('capture');
  if (window.self !== window.top) {
    body.classList.add('embedded');
    try { window.parent.postMessage({ decaScreen: SCREEN }, '*'); } catch (e) {}
  }
  D.screen = SCREEN;
  D.$ = $; D.$$ = $$;
  D.q = (k) => new URLSearchParams(location.search).get(k);
  D.store = {
    get(k, d) { try { const v = localStorage.getItem('deca:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('deca:' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem('deca:' + k); } catch (e) {} },
  };
  D.wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 150) : ms));
  D.go = (href) => { location.href = href; };
  D.haptic = (ms = 12) => { try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(ms); } catch (e) {} };
  D.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  D.img = (slug) => '../assets/img/' + slug + '.jpg';
  D.fmtNum = (n) => Math.round(+n || 0).toLocaleString('en-IN');
  D.fmt = (n) => (n < 0 ? '−₹' : '₹') + D.fmtNum(Math.abs(n));             // "₹12,000" (Indian grouping)
  D.fmtIN = D.fmtNum;
  D.pct = (p) => Math.round((1 - p.price / p.mrp) * 100);                      // discount %
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ord = (d) => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th');
  const toDate = (x) => (x instanceof Date ? x : new Date(String(x).length === 10 ? x + 'T12:00:00' : x));
  D.fmtDate = (x) => { const d = toDate(x); return `${ord(d.getDate())} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`; };   // "3rd April, 2026"
  D.fmtDay = (x) => { const d = toDate(x); return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; }; // "Tue, 22 Sep"
  D.fmtShort = (x) => { const d = toDate(x); return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; }; // "03 Apr 2026"
  D.addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return d; };
  // Local calendar date (toISOString would give the UTC date, a day early after midnight IST)
  D.iso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  D.fmtDM = (x) => { const d = toDate(x); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };                          // "7 Sep"
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent('deca:' + name, { detail }));
  D.on = (name, fn) => document.addEventListener('deca:' + name, (e) => fn(e.detail));

  /* ----------------------------------------------------------------- 2 icons
     Deca.icon(name, size = 20, {sw, fill, cls}) -> inline SVG string (stroke,
     round caps). Or declaratively: <i data-icon="bell" data-size="18"></i>   */
  const IC = {
    back: '<path d="M15 5 8 12l7 7"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    'chevron-down': '<path d="m5 9 7 7 7-7"/>',
    'chevron-up': '<path d="m5 15 7-7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 1.8H4.4L6 16.5Z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>',
    heart: '<path d="M12 20.3s-8.3-4.9-8.3-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.3 2.7c0 6.1-8.3 11-8.3 11Z"/>',
    cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h2.6l2.4 11.3a1.8 1.8 0 0 0 1.8 1.4h8.3a1.8 1.8 0 0 0 1.8-1.4l1.5-7.3H6"/>',
    bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m20 20-4.4-4.4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    qr: '<rect x="3" y="3" width="6" height="6" rx="2"/><rect x="15" y="3" width="6" height="6" rx="2"/><rect x="3" y="15" width="6" height="6" rx="2"/><path d="M12 3v3.5M12 10v2.5h3M3 12.5h5M17.5 12.5H21M15 16.5v4.5M18.5 17h2.5M18.5 21H21"/>',
    scan: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10"/>',
    pin: '<path d="M12 21.2s-7-6.3-7-11.7a7 7 0 0 1 14 0c0 5.4-7 11.7-7 11.7Z"/><circle cx="12" cy="9.6" r="2.6"/>',
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1v-9.5Z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="3"/><rect x="13.5" y="3.5" width="7" height="7" rx="3"/><rect x="3.5" y="13.5" width="7" height="7" rx="3"/><rect x="13.5" y="13.5" width="7" height="7" rx="3"/>',
    globe: '<circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.5 3.9 5.6 3.9 9.2s-1.3 6.7-3.9 9.2c-2.6-2.5-3.9-5.6-3.9-9.2S9.4 5.3 12 2.8Z"/>',
    user: '<circle cx="12" cy="7.8" r="4"/><path d="M4.5 21v-1.2a5.8 5.8 0 0 1 5.8-5.8h3.4a5.8 5.8 0 0 1 5.8 5.8V21H4.5Z"/>',
    box: '<path d="M20.5 7.5 12 3 3.5 7.5v9L12 21l8.5-4.5v-9Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.3l8.5 4.5"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H5.5A1.5 1.5 0 0 1 4 18.5V14ZM20 14h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5V14Z"/>',
    truck: '<path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5v3h-7"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    store: '<path d="M3.5 9 5 4h14l1.5 5M4.5 9v11h15V9M3.5 9h17"/><path d="M9.5 20v-5.5h5V20"/>',
    phone: '<path d="M6.6 3.5h-2a1 1 0 0 0-1 1.1A16.5 16.5 0 0 0 19.4 20.4a1 1 0 0 0 1.1-1v-2l-4-1.6-2 2a13 13 0 0 1-6.3-6.3l2-2-1.6-4Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5M3.5 3.5v5h5M12 7.5V12l3 2"/>',
    edit: '<path d="M12 20h8.5M16.5 3.8a2.1 2.1 0 0 1 3 3L7.2 19.1l-4 1 1-4Z"/>',
    trash: '<path d="M3.5 6.5h17M9 6.5V4h6v2.5M5.8 6.5l1 13.5h10.4l1-13.5M10 10.5v6M14 10.5v6"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19M6 15h4"/>',
    upi: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3M9.5 7.5l2.5 6 2.5-6"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5H3ZM5 11.5v6M9.7 11.5v6M14.3 11.5v6M19 11.5v6M3 20h18"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
    wallet: '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14.5a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 19.5 7H5"/><path d="M16.5 13.5h.01"/>',
    camera: '<path d="M4 7.5h3L9 4.5h6l2 3h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.2" r="3.8"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    tag: '<path d="M3 12.2V4a1 1 0 0 1 1-1h8.2l8.8 8.8-9 9L3 12.2Z"/><circle cx="7.6" cy="7.6" r="1.4"/>',
    ticket: '<path d="M3 8.5V6.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a3.5 3.5 0 0 0 0 7v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a3.5 3.5 0 0 0 0-7Z"/><path d="M14 5.5v13" stroke-dasharray="2 2.2"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.8 3.5 8 4.2C5.8 4.8 7 8 9 8M12 8s1.2-4.5 4-3.8C18.2 4.8 17 8 15 8"/>',
    trophy: '<path d="M8 21h8M12 16.5V21M7 3.5h10v5.5a5 5 0 0 1-10 0V3.5ZM17 5h3v1.8a3.2 3.2 0 0 1-3.2 3.2M7 5H4v1.8A3.2 3.2 0 0 0 7.2 10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>',
    alert: '<path d="M12 9.5v4M12 17v.01"/><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.6"/>',
    filter: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    sort: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/>',
    share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 13.2 7.6 4.1M15.8 6.7l-7.6 4.1"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M3 3l18 18M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.9 3.7M6.6 6.6A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3 4.5 6v5.6c0 4.6 3.2 8 7.5 9.4 4.3-1.4 7.5-4.8 7.5-9.4V6L12 3Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    logout: '<path d="M9.5 20.5H5.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4M15.5 16.5 20 12l-4.5-4.5M20 12H9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1h-.2a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.2 1-1.2 1.7v.5M12 16.8v.01"/>',
    chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.4A8.5 8.5 0 1 1 20.5 12Z"/>',
    ruler: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21 3 16.5Z"/><path d="m7 12.5 2 2M10 9.5l1.5 1.5M13 6.5l2 2"/>',
    return: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    refresh: '<path d="M20.5 12a8.5 8.5 0 0 1-15.2 5.2M3.5 12A8.5 8.5 0 0 1 18.7 6.8M19 3v4h-4M5 21v-4h4"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
    arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5"/>',
    navigate: '<path d="M3.5 11 20.5 3.5 13 20.5l-2-7.5-7.5-2Z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    flash: '<path d="M13 2.5 4.5 14h7l-1 7.5L19 10h-7l1-7.5Z"/>',
    expand: '<path d="M14.5 3.5h6v6M9.5 20.5h-6v-6M20.5 3.5l-7 7M3.5 20.5l7-7"/>',
    'thumbs-up': '<path d="M7 10.5v10H3.5v-10H7Zm0 0 4-7.5a2.8 2.8 0 0 1 2.8 2.8v3.7h5.3a2 2 0 0 1 2 2.3l-1.3 7.2a2 2 0 0 1-2 1.5H7"/>',
    dots: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    run: '<circle cx="14.5" cy="4.5" r="2"/><path d="m5 21 3.5-5.5 3 2.5L13 13l3.5 3.5L20 15M8.5 10.5 11 7.5h4.5l-2.5 5.5M5 10.5l3.5-3"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  };
  const FILLED = {
    'heart-fill': '<path d="M12 20.3s-8.3-4.9-8.3-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.3 2.7c0 6.1-8.3 11-8.3 11Z"/>',
    star: '<path d="M12 2.6l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.2l-5.72 3 1.1-6.37-4.64-4.5 6.4-.93Z"/>',
    'pin-fill': '<path fill-rule="evenodd" d="M12 22s-7.5-6.6-7.5-12.3a7.5 7.5 0 0 1 15 0C19.5 15.4 12 22 12 22Zm0-9.3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>',
    'user-fill': '<circle cx="12" cy="7.5" r="4.5"/><path d="M3.5 21.5v-1a6.5 6.5 0 0 1 6.5-6.5h4a6.5 6.5 0 0 1 6.5 6.5v1h-17Z"/>',
    play: '<path d="M8 5.5v13l10.5-6.5L8 5.5Z"/>',
  };
  // Scalloped "verified" badge (Confirmation) — 12 lobes, generated once
  const scallop = (() => {
    const n = 12, R = 10.4, r = 8.9, cx = 12, cy = 12; let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2, a2 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const p = (a, rad) => `${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`;
      d += (i ? '' : `M${p(a0, r)}`) + `Q${p(a1, R + 1.6)} ${p(a2, r)}`;
    }
    return d + 'Z';
  })();
  D.icon = (name, size = 20, o = {}) => {
    const sw = o.sw || 1.8, cls = o.cls ? ` class="${o.cls}"` : '';
    if (name === 'verified') return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${scallop}" fill="${o.fill || '#0F96DB'}"/><path class="badge-check" d="m8.2 12.2 2.6 2.6 5-5.2" fill="none" stroke="${o.check || '#D3EAF2'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    if (FILLED[name]) return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="${o.fill || 'currentColor'}" aria-hidden="true">${FILLED[name]}</svg>`;
    const p = IC[name] || IC.info;
    return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${o.stroke || 'currentColor'}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  };
  D.icons = Object.keys(IC).concat(Object.keys(FILLED), ['verified']);
  const heartSvgs = (size) => `<svg class="h-line" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true">${IC.heart}</svg><svg class="h-fill" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${FILLED['heart-fill']}</svg>`;
  D.heartSvg = heartSvgs;

  /* ------------------------------------------------------ 3 catalogue + data */
  const SZ_APPAREL = ['XS', 'S', 'M', 'L', 'XL'];
  const SZ_SHOE = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
  const SZ_KIDS = ['UK 1', 'UK 2', 'UK 3', 'UK 4', 'UK 5'];
  const C = (name, hex) => ({ name, hex });
  const RUN_DESC = 'Responsive foam cushioning with a breathable engineered-mesh upper for daily runs up to 15 km. The rubber outsole grips wet roads and the padded collar keeps your heel locked in on every stride.';
  // kind: shoe | clothing | equipment | accessory (drives search, sport tabs and GST)
  const P = (id, o) => Object.assign({ id, brand: 'Decathlon', kind: 'equipment', rating: 4, reviews: 1200, colours: [], sizes: [], imgs: null }, o);
  D.products = [
    P('racket', { name: 'Tennis Racket', brand: 'Artengo', sport: 'tennis', price: 12000, mrp: 22000, rating: 4, reviews: 12800, img: 'racket', hero: 'racket-hero', imgs: ['racket-hero', 'racket', 'racket-2', 'racket-3'],
      colours: [C('Navy', '#001F30'), C('Yellow', '#FFC727'), C('Pink', '#FF9BBC'), C('Green', '#4FCD6F'), C('White', '#FFFFFF')], sizes: ['XS', 'S', 'M', 'L', 'XL'], defaultColour: 'White', defaultSize: 'L', sizeLabel: 'Grip size',
      description: 'A 285 g graphite frame with a 100 sq in head that gives you easy power from the baseline and control at the net. Pre-strung at 24 kg with a shock-absorbing grip, it is built for club players who train three times a week.',
      specs: [['Weight', '285 g unstrung'], ['Head size', '100 sq in'], ['Balance', '320 mm'], ['String pattern', '16 x 19'], ['Material', 'Graphite composite']] }),
    P('tennis-ball', { name: 'Tennis Ball Tube', brand: 'Artengo', sport: 'tennis', price: 1000, mrp: 2000, rating: 4, reviews: 5400, img: 'tennis-ball', colours: [C('Yellow', '#E6F14A')], sizes: [],
      description: 'Pressurised tournament balls with a durable felt that keeps its bounce on hard courts. Three balls to a tube, so you always have a spare in the bag.' }),
    P('tennis-shoe', { name: 'Tennis Shoe', brand: 'Artengo', kind: 'shoe', sport: 'tennis', price: 12000, mrp: 18000, rating: 4, reviews: 3100, img: 'shoe-tennis', colours: [C('White', '#FFFFFF'), C('Navy', '#001F30')], sizes: SZ_SHOE,
      description: 'All-court tennis shoe with a herringbone outsole for quick lateral cuts, a reinforced toe cap for drag shots and a cushioned midsole that stays comfortable through long matches.' }),
  ];

  /* Running shoes: the "Running shoes" query returns exactly these 48, and every
     facet on Filters is counted from them (type 22 + 12 + 8 + 6, brand 18 + 14 + 7 + 6 + 3).
     The first ten are the Search results / Wishlist designs, in design order. */
  const RUN_TYPE = { road: 'Road running', trail: 'Trail running', race: 'Racing', kids: 'Kids' };
  D.runTypes = RUN_TYPE;
  const W = C('White', '#FFFFFF'), K = C('Black', '#1B1B1B'), N = C('Navy', '#001F30'), G = C('Grey', '#8A949A'), B = C('Blue', '#4A6FD8'), O = C('Orange', '#F26B3A'), R = C('Red', '#D8262E'), V = C('Volt', '#C8F03C'), OL = C('Olive', '#5B6B4A'), PK = C('Pink', '#F4B7A8');
  const IMG_COL = { 'shoe-white-orange': [W, O], 'shoe-neon-green': [V, K], 'shoe-black': [K, G], 'shoe-red': [R, K], 'shoe-pink': [PK, W], 'shoe-grey-onfeet': [G, W], 'shoe-white-blue': [W, B], 'shoe-olive': [OL, K], 'shoe-black-blue': [K, B], 'shoe-white-blue-2': [W, C('Royal', '#2A5BD7')] };
  // Deterministic sold-out sizes: most shoes miss one or two sizes, so the size facet genuinely narrows
  const sizesFor = (id, kids) => { const all = kids ? SZ_KIDS : SZ_SHOE; const h = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 11); const drop = h % 3; return all.filter((s, i) => !(drop && (i === h % all.length || (drop === 2 && i === (h >> 3) % all.length))) || s === 'UK 9'); };
  const TYPE_DESC = {
    road: RUN_DESC,
    trail: 'Lugged rubber outsole that bites into mud and loose gravel, a rock plate under the forefoot and a gusseted tongue that keeps grit out on long trail days.',
    race: 'Lightweight racer with a firm, springy midsole and a thin mesh upper. Built for tempo sessions, 10 km races and half marathons.',
    kids: 'Cushioned, flexible running shoe for young runners with a hook-and-loop strap, a reinforced toe and a grippy sole for school tracks and playgrounds.',
  };
  const RUN = [
    // [id, name, brand, type, price, mrp, img, rating, reviews]
    ['nike-run-1', 'Nike Running Shoe', 'Nike', 'road', 12000, 22000, 'shoe-white-orange', 4, 2300],
    ['nike-run-2', 'Nike Running Shoe', 'Nike', 'race', 9000, 12000, 'shoe-neon-green', 4, 1850],
    ['nike-run-3', 'Nike Running Shoe', 'Nike', 'road', 12000, 22000, 'shoe-black', 4, 990],
    ['nike-run-4', 'Nike Running Shoe', 'Nike', 'road', 9000, 12000, 'shoe-red', 4, 4100],
    ['puma-shoe', 'Puma Shoe', 'Puma', 'road', 1000, 2200, 'shoe-pink', 4, 760],
    ['nike-run-5', 'Nike Running Shoe', 'Nike', 'road', 9000, 12000, 'shoe-grey-onfeet', 4, 1320],
    ['nike-run-6', 'Asics Running Shoe', 'Asics', 'road', 12000, 22000, 'shoe-white-blue', 4, 2750],
    ['nike-run-7', 'Nike Running Shoe', 'Nike', 'trail', 9000, 12000, 'shoe-olive', 4, 640],
    ['nike-run-8', 'Nike Running Shoe', 'Nike', 'road', 12000, 22000, 'shoe-black-blue', 4, 3900],
    ['nike-run-9', 'Adidas Running Shoe', 'Adidas', 'race', 9000, 12000, 'shoe-white-blue-2', 4, 870],
    ['kal-run-active', 'Kalenji Run Active', 'Kalenji', 'road', 1999, 2499, 'shoe-white-blue-2', 4, 18400],
    ['kal-run-support', 'Kalenji Run Support', 'Kalenji', 'road', 2499, 2999, 'shoe-grey-onfeet', 4, 9600],
    ['kal-run-cushion', 'Kalenji Run Cushion', 'Kalenji', 'road', 3499, 4299, 'shoe-white-blue', 5, 7200],
    ['kal-jogflow-500', 'Kalenji Jogflow 500', 'Kalenji', 'road', 2999, 3499, 'shoe-black', 4, 5300],
    ['kal-jogflow-190', 'Kalenji Jogflow 190', 'Kalenji', 'road', 1499, 1999, 'shoe-black-blue', 4, 12100],
    ['kal-kd900', 'Kalenji KD900', 'Kalenji', 'road', 6999, 8999, 'shoe-white-orange', 5, 2400],
    ['kal-run-100', 'Kalenji Run 100', 'Kalenji', 'road', 999, 1299, 'shoe-pink', 4, 21300],
    ['kal-trail-tr2', 'Kalenji Trail TR2', 'Kalenji', 'trail', 3999, 4999, 'shoe-olive', 4, 3800],
    ['kal-trail-xt8', 'Kalenji Trail XT8', 'Kalenji', 'trail', 5999, 7499, 'shoe-black', 5, 1900],
    ['kal-trail-tr', 'Kalenji Trail TR', 'Kalenji', 'trail', 2499, 2999, 'shoe-grey-onfeet', 4, 4600],
    ['kal-trail-mt', 'Kalenji Trail MT Cushion', 'Kalenji', 'trail', 4999, 5999, 'shoe-olive', 4, 1500],
    ['kal-trail-race', 'Kalenji Trail Race', 'Kalenji', 'trail', 6499, 7999, 'shoe-red', 4, 880],
    ['kal-kd-light', 'Kalenji KD Light', 'Kalenji', 'race', 4499, 5499, 'shoe-neon-green', 4, 2100],
    ['kal-race-carbon', 'Kalenji Race Carbon', 'Kalenji', 'race', 11999, 14999, 'shoe-white-orange', 5, 640],
    ['kal-kids-support', 'Kalenji Kids Run Support', 'Kalenji', 'kids', 1299, 1599, 'shoe-white-blue-2', 4, 6700],
    ['kal-kids-jogflow', 'Kalenji Kids Jogflow', 'Kalenji', 'kids', 999, 1299, 'shoe-pink', 4, 8200],
    ['kal-kids-active', 'Kalenji Kids Run Active', 'Kalenji', 'kids', 1499, 1799, 'shoe-black-blue', 4, 3500],
    ['kal-kids-trail', 'Kalenji Kids Trail', 'Kalenji', 'kids', 1799, 2199, 'shoe-olive', 4, 1200],
    ['nike-road-runner', 'Nike Road Runner', 'Nike', 'road', 7999, 9999, 'shoe-black', 4, 2900],
    ['nike-daily', 'Nike Daily Trainer', 'Nike', 'road', 5999, 7499, 'shoe-white-blue', 4, 3400],
    ['nike-cushion', 'Nike Cushion Runner', 'Nike', 'road', 10999, 13999, 'shoe-red', 5, 1700],
    ['nike-trail-tempo', 'Nike Trail Tempo', 'Nike', 'trail', 8499, 10999, 'shoe-grey-onfeet', 4, 760],
    ['nike-trail', 'Nike Trail Runner', 'Nike', 'trail', 8999, 10999, 'shoe-olive', 4, 1100],
    ['nike-race', 'Nike Race Flyer', 'Nike', 'race', 14999, 18999, 'shoe-neon-green', 5, 950],
    ['nike-kids', 'Nike Kids Runner', 'Nike', 'kids', 2999, 3499, 'shoe-white-orange', 4, 1400],
    ['asics-road-cushion', 'Asics Road Cushion', 'Asics', 'road', 6499, 7999, 'shoe-white-blue', 5, 2600],
    ['asics-road-glide', 'Asics Road Glide', 'Asics', 'road', 8999, 11999, 'shoe-grey-onfeet', 4, 1900],
    ['asics-stability', 'Asics Stability Runner', 'Asics', 'road', 7499, 8999, 'shoe-black-blue', 4, 2200],
    ['asics-trail-grip', 'Asics Trail Grip', 'Asics', 'trail', 7999, 9499, 'shoe-olive', 4, 830],
    ['asics-trail-venture', 'Asics Trail Venture', 'Asics', 'trail', 4999, 5999, 'shoe-black', 4, 1600],
    ['asics-race', 'Asics Race Tempo', 'Asics', 'race', 9999, 12999, 'shoe-white-orange', 4, 700],
    ['adidas-road', 'Adidas Road Runner', 'Adidas', 'road', 5499, 6999, 'shoe-white-blue-2', 4, 2500],
    ['adidas-trail', 'Adidas Trail Runner', 'Adidas', 'trail', 7999, 9999, 'shoe-black', 4, 1300],
    ['adidas-trail-rocker', 'Adidas Trail Rocker', 'Adidas', 'trail', 4499, 5499, 'shoe-red', 4, 980],
    ['adidas-race', 'Adidas Race Lite', 'Adidas', 'race', 10999, 13999, 'shoe-neon-green', 4, 610],
    ['adidas-kids', 'Adidas Kids Runner', 'Adidas', 'kids', 1999, 2499, 'shoe-white-blue', 4, 2300],
    ['puma-road', 'Puma Road Runner', 'Puma', 'road', 3999, 5499, 'shoe-red', 4, 1200],
    ['puma-race', 'Puma Race Runner', 'Puma', 'race', 6999, 8999, 'shoe-neon-green', 4, 540],
  ];
  RUN.forEach(([id, name, brand, type, price, mrp, img, rating, reviews]) => D.products.push(P(id, {
    name, brand, kind: 'shoe', sport: 'running', type, price, mrp, img, rating, reviews, colours: IMG_COL[img], sizes: sizesFor(id, type === 'kids'),
    description: id === 'puma-shoe' ? 'Entry-level running shoe with a SoftFoam+ sockliner and a cushioned rubber sole. Light enough for easy runs, gym warm-ups and walks around town.' : TYPE_DESC[type],
  })));

  D.products.push(
    P('bicycle', { name: 'Road Bike RC 520', brand: 'Btwin', sport: 'cycling', price: 42000, mrp: 52000, rating: 5, reviews: 640, img: 'bicycle', colours: [C('Grey', '#8A949A'), C('Black', '#1B1B1B')], sizes: ['S', 'M', 'L'],
      description: 'Aluminium road bike with a carbon fork, Shimano 105 11-speed groupset and hydraulic disc brakes. Endurance geometry keeps you comfortable on 100 km weekend rides.' }),
    P('jacket', { name: 'Winter Hiking Jacket', brand: 'Quechua', kind: 'clothing', sport: 'winter', price: 4999, mrp: 7999, rating: 4, reviews: 5200, img: 'jacket', colours: [C('Orange', '#E8662E'), C('Navy', '#001F30'), C('Black', '#1B1B1B')], sizes: SZ_APPAREL,
      description: 'Padded jacket that keeps you warm down to -10°C when moving. Water-repellent shell, adjustable hood and two zipped hand pockets. Packs into its own pocket.' }),
    P('backpack', { name: 'Hiking Backpack 30 L', brand: 'Quechua', kind: 'accessory', gst: 18, sport: 'hiking', price: 2499, mrp: 3499, rating: 4, reviews: 8100, img: 'backpack', colours: [C('Green', '#4C6B4F'), C('Navy', '#001F30')], sizes: [],
      description: 'A 30 L day pack with a ventilated back panel, hip belt pockets and an integrated rain cover. Hydration compatible, with a padded laptop sleeve for the commute.' }),
    P('tent', { name: 'Camping Tent 2 Seconds', brand: 'Quechua', kind: 'textile', sport: 'camping', price: 7999, mrp: 9999, rating: 5, reviews: 11200, img: 'tent', colours: [C('Green', '#6B8E5A'), C('Beige', '#D9CBB0')], sizes: ['2 person', '3 person'],
      description: 'Pop-up tent that pitches in two seconds and packs down in minutes. Fresh & Black fabric blocks 99% of daylight and keeps the inside cool on summer mornings.' }),
    P('bottle', { name: 'Steel Water Bottle 1 L', brand: 'Quechua', kind: 'accessory', sport: 'hiking', price: 799, mrp: 999, rating: 4, reviews: 3300, img: 'bottle', colours: [C('Coral', '#E77A5F'), C('Steel', '#B8C2C8')], sizes: [],
      description: 'Double-wall vacuum insulated bottle keeps drinks cold for 20 hours and hot for 10. Leak-proof screw cap with a carry loop.' }),
    P('dumbbell', { name: 'Hex Dumbbell 10 kg', brand: 'Domyos', sport: 'gym', price: 2999, mrp: 3999, rating: 4, reviews: 2600, img: 'dumbbell', colours: [C('Black', '#1B1B1B')], sizes: ['5 kg', '7.5 kg', '10 kg', '12.5 kg'],
      description: 'Rubber-coated hex dumbbell that will not roll away between sets. Knurled chrome handle for a secure grip during presses, rows and lunges.' }),
    P('yoga-mat', { name: 'Yoga Mat 8 mm', brand: 'Domyos', sport: 'yoga', price: 1299, mrp: 1999, rating: 4, reviews: 9400, img: 'yoga-mat', colours: [C('Coral', '#E7736B'), C('Teal', '#3A8C8C'), C('Grey', '#8A949A')], sizes: [],
      description: 'Extra-thick 8 mm mat that cushions knees and wrists in floor poses. Non-slip textured surface on both sides, with a carry strap included.' }),
    P('football', { name: 'Football F500 Size 5', brand: 'Kipsta', sport: 'football', price: 1499, mrp: 1999, rating: 5, reviews: 7300, img: 'football', colours: [C('White', '#FFFFFF'), C('Orange', '#F26B3A')], sizes: ['Size 4', 'Size 5'],
      description: 'FIFA Basic certified match ball with a thermo-bonded construction for a true flight and a consistent touch in wet or dry conditions.' }),
    P('helmet', { name: 'Cycling Helmet 500', brand: 'Btwin', kind: 'accessory', sport: 'cycling', price: 1999, mrp: 2999, rating: 4, reviews: 2100, img: 'helmet', colours: [C('White', '#FFFFFF'), C('Black', '#1B1B1B')], sizes: ['S', 'M', 'L'],
      description: 'In-mould road helmet with 18 vents and a dial fit system. Weighs just 250 g and meets EN 1078 safety standards.' }),
    P('tshirt', { name: 'Running T-Shirt Dry+', brand: 'Kalenji', kind: 'clothing', sport: 'running', price: 599, mrp: 899, rating: 4, reviews: 15800, img: 'tshirt', colours: [C('Navy', '#001F30'), C('Blue', '#0F96DB'), C('White', '#FFFFFF')], sizes: SZ_APPAREL,
      description: 'Lightweight running tee that wicks sweat away and dries fast. Flat seams stop chafing on long runs and reflective details keep you visible at dawn.' }),
    P('shorts', { name: 'Running Shorts', brand: 'Kalenji', kind: 'clothing', sport: 'running', price: 699, mrp: 999, rating: 4, reviews: 6200, img: 'shorts', colours: [C('Black', '#1B1B1B'), C('Navy', '#001F30')], sizes: SZ_APPAREL,
      description: 'Breathable shorts with a built-in brief and a zipped back pocket for keys and gels. Split hems give full freedom of movement.' }),
    P('cap', { name: 'Running Cap', brand: 'Kalenji', kind: 'accessory', sport: 'running', price: 399, mrp: 599, rating: 4, reviews: 4300, img: 'cap', colours: [C('Black', '#1B1B1B'), C('White', '#FFFFFF')], sizes: ['One size'],
      description: 'Ultra-light cap with a sweatband and mesh side panels. Adjustable strap at the back fits all head sizes.' }),
  );
  D.product = (id) => D.products.find((p) => p.id === id) || null;
  D.bySport = (sport) => D.products.filter((p) => p.sport === sport);
  const KIND_WORD = { shoe: 'shoe', clothing: 'clothing apparel', accessory: 'accessory', equipment: 'equipment', textile: '' };
  D.search = (q) => {
    const s = String(q || '').toLowerCase().trim(); if (!s) return D.products.slice();
    const words = s.split(/\s+/).map((w) => w.replace(/s$/, ''));
    return D.products.filter((p) => { const hay = `${p.name} ${p.brand} ${p.sport} ${KIND_WORD[p.kind] || ''} ${p.type ? RUN_TYPE[p.type] : ''}`.toLowerCase(); return words.every((w) => hay.includes(w)); });
  };
  D.related = (id, n = 6) => { const p = D.product(id); if (!p) return D.products.slice(0, n); const same = D.products.filter((x) => x.id !== id && x.sport === p.sport); const rest = D.products.filter((x) => x.id !== id && x.sport !== p.sport); return same.concat(rest).slice(0, n); };

  /* GST, as charged in India from 22 Sep 2025: sports goods, bicycles and most
     equipment 5%; footwear, clothing and made-up textiles 5% up to ₹2,500 a
     piece and 18% above; bags 18%. Prices are GST-inclusive, so tax is carved
     out of what the customer pays, never added on top. */
  // GST inside a GST-inclusive bill: [{rate, gross, tax}] per rate. Lines carry `price` (what was
  // charged) or fall back to the catalogue price; the promo is shared pro rata; delivery carries 18%.
  D.gstOf = (lines, promo = 0, delivery = 0) => {
    const unit = (it) => it.price || (it.product || D.product(it.id)).price;
    const sub = lines.reduce((a, it) => a + unit(it) * it.qty, 0); const share = sub ? (sub - promo) / sub : 0; const byRate = {};
    lines.forEach((it) => { const r = D.gstRate(it.product || D.product(it.id), unit(it)); byRate[r] = (byRate[r] || 0) + unit(it) * it.qty * share; });
    if (delivery) byRate[18] = (byRate[18] || 0) + delivery;
    const gstRates = Object.keys(byRate).map(Number).sort((a, b) => a - b).map((rate) => ({ rate, gross: Math.round(byRate[rate]), tax: Math.round(byRate[rate] * rate / (100 + rate)) }));
    return { gst: gstRates.reduce((a, g) => a + g.tax, 0), gstRates };
  };
  D.gstNote = (t) => t.gstRates.filter((g) => g.tax).map((g) => `${D.fmt(g.tax)} at ${g.rate}%`).join(' + ');   // "₹762 at 5% + ₹1,831 at 18%"
  D.gstRate = (p, unit) => { unit = unit == null ? p.price : unit; if (p.kind === 'shoe' || p.kind === 'clothing' || p.kind === 'textile') return unit > 2500 ? 18 : 5; return p.gst || 5; };

  // Sport tiles (Home / Category grid order). slug -> sport.html?sport=<slug>
  const S = (slug, name, img) => ({ slug, name, img });
  D.sports = [
    S('winter', 'Winter wear', 'cat-winter'), S('cycling', 'Cycling', 'cat-cycling'), S('football', 'Football', 'cat-football'), S('cricket', 'Cricket', 'cat-cricket'),
    S('tennis', 'Tennis', 'cat-tennis'), S('badminton', 'Badminton', 'cat-badminton'), S('basketball', 'Basketball', 'cat-basketball'), S('table-tennis', 'Table tennis', 'cat-table-tennis'),
    S('gym', 'Gym & strength', 'cat-gym'), S('bags', 'Sports bags', 'cat-gym-bag'), S('fitness', 'Fitness', 'cat-fitness'), S('yoga', 'Yoga', 'cat-yoga'),
    S('football-boots', 'Football boots', 'cat-football-boots'), S('running', 'Running', 'cat-running'), S('skating', 'Roller skating', 'cat-skating'), S('skateboarding', 'Skateboarding', 'cat-skateboard'),
    S('hiking', 'Hiking', 'cat-hiking'), S('snowboarding', 'Snowboarding', 'cat-snowboard'), S('skiing', 'Skiing', 'cat-ski'), S('trekking', 'Trekking', 'cat-trekking'),
    S('rainwear', 'Rainwear', 'cat-rainwear'), S('camping', 'Camping', 'cat-camping'), S('fishing', 'Fishing', 'cat-fishing'), S('tents', 'Tents', 'cat-tent'),
    S('swimming', 'Swimming', 'cat-swimming'),
  ];
  D.sport = (slug) => D.sports.find((s) => s.slug === slug) || null;
  D.brands = ['Decathlon', 'Quechua', 'Kipsta', 'Kalenji', 'Artengo', 'Btwin', 'Domyos', 'Nike', 'Adidas', 'Puma', 'Asics'];

  // Stores (Travel store / stores / store-detail)
  D.stores = [
    { id: 'saltlake', name: 'Salt Lake', full: 'Decathlon Salt Lake', img: 'store-saltlake', address: 'Plot X1, Sector V, Salt Lake City, Kolkata 700091', hours: '10:00 AM – 9:30 PM', phone: '+91 33 4060 2210', distance: '5.8 km', rating: 4.5 },
    { id: 'shakespeare', name: 'Shakespeare Sarani', full: 'Decathlon Shakespeare Sarani', img: 'store-shakespeare', address: '21 Shakespeare Sarani, Park Street area, Kolkata 700017', hours: '10:00 AM – 9:00 PM', phone: '+91 33 4060 2230', distance: '14.2 km', rating: 4.4 },
    { id: 'newtown', name: 'New Town', full: 'Decathlon New Town', img: 'store-newtown', address: 'Action Area 1C, Major Arterial Road, New Town, Kolkata 700135', hours: '9:30 AM – 10:00 PM', phone: '+91 33 4060 2250', distance: '1.4 km', rating: 4.6 },
    { id: 'acropolis', name: 'Acropolis Kasba Connect', full: 'Decathlon Connect, Acropolis Mall', img: 'store-acropolis', address: 'Level 2, Acropolis Mall, Rajdanga Main Road, Kasba, Kolkata 700107', hours: '11:00 AM – 9:30 PM', phone: '+91 33 4060 2270', distance: '12.6 km', rating: 4.3 },
  ];
  D.storeById = (id) => D.stores.find((s) => s.id === id) || null;
  // Opening status, the same everywhere (Home, Stores, Store): hours as listed, Sunday opens an hour later
  const parseT = (t) => { const m = t.trim().match(/(\d+):(\d+)\s*(AM|PM)/i); let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
  D.fmtT = (mins) => { let h = Math.floor(mins / 60); const m = mins % 60; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
  D.storeHours = (s, day) => { const [o, c] = s.hours.split('–').map(parseT); return day === 0 ? [o + 60, c] : [o, c]; };   // day: 0 = Sunday
  D.storeStatus = (s, now = new Date()) => {
    const d = now.getDay(); const t = now.getHours() * 60 + now.getMinutes(); const [a, b] = D.storeHours(s, d);
    if (t >= a && t < b) return b - t <= 60 ? { k: 'soon', label: 'Closing soon', sub: `closes ${D.fmtT(b)}` } : { k: 'yes', label: 'Open now', sub: `closes ${D.fmtT(b)}` };
    return { k: 'no', label: 'Closed', sub: `opens ${D.fmtT(t >= b ? D.storeHours(s, (d + 1) % 7)[0] : a)}${t >= b ? ' tomorrow' : ''}` };
  };
  // Deterministic stock per store/product: 'in' | 'low' | 'out'
  D.stock = (storeId, productId) => { const h = [...(storeId + productId)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7); return h % 5 === 0 ? 'out' : h % 3 === 0 ? 'low' : 'in'; };
  D.stockLabel = { in: 'In stock', low: 'Few left', out: 'Out of stock' };

  // Promo codes (Bag / coupons). RUN15 counts running gear only; FIRST100 needs an account with no orders yet.
  D.promos = [
    { code: 'DECA10', title: '10% off up to ₹1,000', desc: 'On orders above ₹2,000', min: 2000, pct: 10, cap: 1000 },
    { code: 'CLUB500', title: '₹500 off for Club members', desc: 'On orders above ₹5,000', min: 5000, flat: 500, club: true },
    { code: 'RUN15', title: '15% off running gear', desc: 'Max ₹750 · running gear above ₹3,000', min: 3000, pct: 15, cap: 750, sport: 'running' },
    { code: 'FIRST100', title: '₹100 off your first order', desc: 'New accounts · no minimum order value', min: 0, flat: 100, first: true },
  ];
  const promoAmount = (code, subtotal, items) => {
    const c = String(code || '').toUpperCase().trim();
    // Club vouchers generated on the Club screen (10 points = ₹1) work here like any flat code
    const v = (D.store.get('clubRedeemed', []) || []).find((r) => r.code === c);
    if (v && v.used) return { ok: false, msg: `${c} was already used on an order.` };
    const p = D.promos.find((x) => x.code === c) || (v && { code: v.code, flat: v.value, min: v.value });
    if (!p) return { ok: false, msg: 'That code isn’t valid. Check the spelling or pick one from Offers.' };
    if (p.first && state('orders').length) return { ok: false, msg: `${p.code} is for a first order only. Try DECA10 instead.` };
    if (p.club && !state('user').club) return { ok: false, msg: `${p.code} is for Decathlon Club members. Joining is free.` };
    let base = subtotal;
    if (p.sport) { const list = items || D.bag.items(); base = list.filter((it) => (it.product || D.product(it.id)).sport === p.sport).reduce((a, it) => a + (it.price || (it.product || D.product(it.id)).price) * it.qty, 0);
      if (base < p.min) return { ok: false, msg: base ? `Add ${D.fmt(p.min - base)} more running gear to use ${p.code}.` : `${p.code} is for running gear, and there is none in your bag.` }; }
    else if (subtotal < p.min) return { ok: false, msg: `Add ${D.fmt(p.min - subtotal)} more to use ${p.code}.` };
    const amount = p.flat ? p.flat : Math.min(p.cap || Infinity, Math.round(base * p.pct / 100));
    return { ok: true, code: p.code, amount, msg: `${p.code} applied · you save ${D.fmt(amount)}` };
  };
  D.promoCheck = (code) => promoAmount(code, D.bag.totals().subtotal);

  /* ------------------------------------------------------ 4 commerce state */
  const ago = (n) => D.iso(D.addDays(-n));
  const SEED = {
    bag: { items: [
      { key: 'racket|L|White', id: 'racket', qty: 1, size: 'L', colour: 'White' },
      { key: 'tennis-ball||Yellow', id: 'tennis-ball', qty: 4, size: '', colour: 'Yellow' },
      { key: 'tennis-shoe|UK 9|White', id: 'tennis-shoe', qty: 1, size: 'UK 9', colour: 'White' },
    ], promo: null },
    wish: ['nike-run-1', 'nike-run-4', 'puma-shoe', 'nike-run-5', 'nike-run-6', 'nike-run-8'],
    // Seed dates are relative to today, so return windows, the in-transit ETA and
    // points history stay coherent whenever the demo is opened.
    orders: [
      { id: 'DEC20260418', date: ago(26), status: 'delivered', deliveredOn: ago(22), payment: 'upi', addressId: 'home',
        items: [{ id: 'racket', qty: 1, price: 11000, size: 'L', colour: 'White' }, { id: 'tennis-ball', qty: 1, price: 1000, size: '', colour: 'Yellow' }], total: 12000 },
      { id: 'DEC20260644', date: ago(20), status: 'delivered', deliveredOn: ago(16), payment: 'credit', addressId: 'home',
        items: [{ id: 'nike-run-4', qty: 1, price: 12000, size: 'UK 9', colour: 'Red' }, { id: 'nike-run-8', qty: 1, price: 17000, size: 'UK 9', colour: 'Black' }], total: 29000 },
      { id: 'DEC20260599', date: ago(15), status: 'delivered', deliveredOn: ago(11), payment: 'cod', addressId: 'home',
        items: [{ id: 'nike-run-1', qty: 1, price: 12000, size: 'UK 9', colour: 'White' }, { id: 'nike-run-6', qty: 1, price: 12000, size: 'UK 9', colour: 'White' }], total: 24000 },
      { id: 'DEC20260222', date: ago(3), status: 'transit', eta: ago(0), payment: 'debit', addressId: 'home', courier: 'Delhivery', awb: 'DLV 4471 2290 8813',
        items: [{ id: 'bicycle', qty: 1, price: 42000, size: 'M', colour: 'Grey' }], total: 42000 },
    ],
    addresses: [
      { id: 'home', label: 'Home', name: 'Aditya Banerjee', phone: '+91 98311 20456', line1: 'Flat 4B, Palm Grove Apartments', line2: 'Action Area 2B, New Town', city: 'Kolkata', state: 'West Bengal', pin: '700135', text: 'Flat 4B, Palm Grove Apartments, Action Area 2B, New Town, Kolkata 700135' },
      { id: 'work', label: 'Work', name: 'Aditya Banerjee', phone: '+91 98311 20456', line1: 'Tower 2, 9th floor, DLF IT Park', line2: 'Action Area 1, New Town', city: 'Kolkata', state: 'West Bengal', pin: '700156', text: 'Tower 2, 9th floor, DLF IT Park, Action Area 1, New Town, Kolkata 700156' },
    ],
    addressId: 'home',
    payment: 'upi',
    cards: [
      { id: 'visa4821', type: 'credit', brand: 'Visa', last4: '4821', exp: '09/28', name: 'Aditya Banerjee' },
      { id: 'rupay1109', type: 'debit', brand: 'RuPay', last4: '1109', exp: '03/27', name: 'Aditya Banerjee' },
    ],
    upi: ['aditya.banerjee@okhdfcbank'],
    user: { name: 'Aditya Banerjee', first: 'Aditya', email: 'aditya.banerjee@gmail.com', phone: '+91 98311 20456', club: true, points: 2450, tier: 'Club member', memberSince: '2023', dob: '1994-08-12', gender: 'Male', avatar: 'avatar-david', address: 'Flat 4B, Palm Grove Apartments, Action Area 2B, New Town, Kolkata 700135', loggedIn: true },
    location: { area: 'New Town, Kolkata', pin: '700135' },
    notifications: [
      { id: 'n1', type: 'order', title: 'Your road bike is out for delivery', body: 'Order #DEC20260222 left our Kolkata hub this morning and arrives today. Keep your delivery OTP handy.', time: '2h ago', href: 'order-tracking.html?id=DEC20260222', read: false },
      { id: 'n6', type: 'stock', title: 'Back in stock: Camping Tent 2 Seconds', body: 'The 2-person Fresh & Black tent you viewed is available again. Only a few left in Kolkata.', time: '3h ago', href: 'product.html?id=tent', read: false },
      { id: 'n2', type: 'offer', title: 'Running shoe sale: up to 55% off', body: 'Nike, Asics, Adidas and Puma running shoes at their lowest prices this season.', time: '5h ago', href: 'search-results.html?q=Running%20shoes&sale=1', read: false },
      { id: 'n7', type: 'price', title: 'Price drop on your wishlist', body: 'Nike Running Shoe (red) is now ₹9,000, down from ₹12,000. Grab your size before it goes.', time: 'Yesterday', href: 'product.html?id=nike-run-4', read: false },
      { id: 'n4', type: 'order', title: 'Delivered: Nike Running Shoe', body: 'Order #DEC20260599 was delivered. How did it fit? Leave a review.', time: D.fmtDM(ago(11)), href: 'write-review.html?id=nike-run-1&order=DEC20260599', read: true },
      { id: 'n3', type: 'club', title: 'You earned 240 Club points', body: 'Points from order #DEC20260599 are now in your wallet. Total: 2,450.', time: D.fmtDM(ago(11)), href: 'club.html', read: true },
      { id: 'n5', type: 'store', title: 'Decathlon New Town is 1.4 km away', body: 'Reserve online and pick up in 2 hours, free of charge.', time: D.fmtDM(ago(14)), href: 'store-detail.html?id=newtown', read: true },
    ],
    searches: ['Running shoes', 'Tennis racket', 'Yoga mat', 'Camping tent'],
    reviews: {},
    settings: { push: true, email: true, sms: false, offers: true, orderUpdates: true, biometric: true, dark: false, language: 'English' },
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const state = (k) => { const v = D.store.get(k); return v == null ? clone(SEED[k]) : v; };
  const save = (k, v) => { D.store.set(k, v); emit(k, v); if (k === 'bag' || k === 'wish' || k === 'notifications') D.badges(); };
  D.seed = SEED;
  // Reset: wipe every deca:* key (shared state + page-local keys); state() falls back to SEED
  D.reset = () => { try { Object.keys(localStorage).filter((k) => k.indexOf('deca:') === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) {} try { Object.keys(sessionStorage).filter((k) => k.indexOf('deca:') === 0).forEach((k) => sessionStorage.removeItem(k)); } catch (e) {} D.badges && D.badges(); emit('reset'); };
  // ?reset=1 on any screen restores demo data, then reloads without the flag
  if (params.get('reset') === '1') { D.reset(); params.delete('reset'); const qs = params.toString(); try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {} }

  // ---- Bag -----------------------------------------------------------------
  const keyOf = (id, size, colour) => `${id}|${size || ''}|${colour || ''}`;
  D.bag = {
    raw: () => state('bag'),
    items() { return state('bag').items.map((it) => Object.assign({}, it, { product: D.product(it.id) })).filter((it) => it.product); },
    count() { return state('bag').items.reduce((a, it) => a + it.qty, 0); },
    lines() { return D.bag.items().length; },
    has(id) { return state('bag').items.some((it) => it.id === id); },
    add(id, o = {}) {
      const p = D.product(id); if (!p) return null;
      const b = state('bag'); const size = o.size || ''; const colour = o.colour || (p.colours[0] && p.colours[0].name) || '';
      const key = keyOf(id, size, colour); const ex = b.items.find((it) => it.key === key);
      if (ex) ex.qty = Math.min(10, ex.qty + (o.qty || 1)); else b.items.unshift({ key, id, qty: o.qty || 1, size, colour });
      save('bag', b); return key;
    },
    setQty(key, n) { const b = state('bag'); const it = b.items.find((x) => x.key === key); if (!it) return; if (n <= 0) return D.bag.remove(key); it.qty = Math.min(10, n); save('bag', b); },
    remove(key) { const b = state('bag'); const i = b.items.findIndex((x) => x.key === key); if (i < 0) return null; const [it] = b.items.splice(i, 1); save('bag', b); return { item: it, index: i }; },
    restore(r) { if (!r) return; const b = state('bag'); b.items.splice(r.index, 0, r.item); save('bag', b); },
    clear() { const b = state('bag'); b.items = []; b.promo = null; save('bag', b); },
    applyPromo(code) { const b = state('bag'); const t = D.bag.totals(); const r = promoAmount(code, t.subtotal); if (r.ok) { b.promo = r.code; save('bag', b); } return r; },
    removePromo() { const b = state('bag'); b.promo = null; save('bag', b); },
    promo() { return state('bag').promo; },
    // {count, mrp, subtotal, discount, promo, promoCode, delivery, gst, gstRates, total}
    // Prices are GST-inclusive: gst is the tax inside `total`, line by line at each
    // item's own rate, after its share of any promo. Club members never pay delivery.
    totals(items) {
      const list = (items || D.bag.items()).map((it) => Object.assign({}, it, { product: it.product || D.product(it.id) }));
      const unit = (it) => it.price || it.product.price;
      const mrp = list.reduce((a, it) => a + it.product.mrp * it.qty, 0);
      const subtotal = list.reduce((a, it) => a + unit(it) * it.qty, 0);
      const code = items ? null : state('bag').promo; const pr = code ? promoAmount(code, subtotal, list) : null;
      const promo = pr && pr.ok ? pr.amount : 0;
      const delivery = subtotal === 0 || subtotal >= 999 || state('user').club ? 0 : 99;
      const total = Math.max(0, subtotal - promo + delivery);
      const { gst, gstRates } = D.gstOf(list, promo, delivery);
      return { count: list.reduce((a, it) => a + it.qty, 0), mrp, subtotal, discount: mrp - subtotal, promo, promoCode: pr && pr.ok ? pr.code : null, delivery, gst, gstRates, total };
    },
  };

  // ---- Wishlist ------------------------------------------------------------
  D.wish = {
    list: () => state('wish').filter((id) => D.product(id)),
    products: () => D.wish.list().map(D.product),
    has: (id) => state('wish').includes(id),
    count: () => D.wish.list().length,
    toggle(id) { const w = state('wish'); const i = w.indexOf(id); if (i >= 0) w.splice(i, 1); else w.unshift(id); save('wish', w); return i < 0; },
    add(id) { if (!D.wish.has(id)) D.wish.toggle(id); },
    remove(id) { if (D.wish.has(id)) D.wish.toggle(id); },
  };

  // ---- Orders --------------------------------------------------------------
  const STATUS = { processing: ['Processing', 'pill--processing'], transit: ['In transit', 'pill--transit'], delivered: ['Delivered', 'pill--delivered'], cancelled: ['Cancelled', 'pill--cancelled'], returned: ['Returned', 'pill--returned'], 'return-requested': ['Return requested', 'pill--processing'] };
  D.orders = {
    list: () => state('orders'),
    get: (id) => state('orders').find((o) => o.id === id || o.id === String(id).replace('#', '')) || null,
    status: (s) => (STATUS[s] || STATUS.processing)[0],
    pill: (s) => (STATUS[s] || STATUS.processing)[1],
    items: (o) => o.items.map((it) => Object.assign({}, it, { product: D.product(it.id) })).filter((it) => it.product),
    count: (o) => o.items.reduce((a, it) => a + it.qty, 0),
    // Place an order from the current bag. Returns the new order.
    place(extra = {}) {
      const items = D.bag.items(); const t = D.bag.totals();
      const id = 'DEC2026' + String(Math.floor(1000 + Math.random() * 9000));
      const addr = D.addresses.selected();
      const o = Object.assign({ id, date: D.iso(), status: 'processing', eta: D.iso(D.addDays(D.location.days(addr && addr.pin))), payment: D.payment.get(), addressId: D.addresses.selectedId(),
        items: items.map((it) => ({ id: it.id, qty: it.qty, price: it.product.price, size: it.size, colour: it.colour })), total: t.total, promo: t.promo, promoCode: t.promoCode }, extra);
      const all = state('orders'); all.unshift(o); save('orders', all);
      // A Club voucher is spent once it pays for an order
      if (o.promoCode) { const vs = D.store.get('clubRedeemed', []) || []; const v = vs.find((r) => r.code === o.promoCode); if (v) { v.used = true; D.store.set('clubRedeemed', vs); } }
      D.store.set('lastOrder', o.id); D.bag.clear();
      // Club points are credited on delivery (see Club), not at checkout
      return o;
    },
    last: () => D.orders.get(D.store.get('lastOrder')) || state('orders')[0],
    update(id, patch) { const all = state('orders'); const o = all.find((x) => x.id === id); if (o) { Object.assign(o, patch); save('orders', all); } return o; },
    cancel(id, reason) { return D.orders.update(id, { status: 'cancelled', cancelledOn: D.iso(), reason: reason || '' }); },
    requestReturn(id, r = {}) { return D.orders.update(id, { status: 'return-requested', returnReq: Object.assign({ on: D.iso(), pickup: D.iso(D.addDays(2)) }, r) }); },
    // Tracking steps: [{title, meta, state:'done'|'now'|''}]
    timeline(o) {
      const d0 = toDate(o.date); const steps = [['Order placed', 0], ['Packed', 0], ['Shipped', 1], ['Out for delivery', 4], ['Delivered', 4]];
      // In transit: shipped, or out for delivery once the ETA is today
      const at = { processing: 0, transit: o.eta && o.eta <= D.iso() ? 3 : 2, delivered: 4, 'return-requested': 4, returned: 4 }[o.status];
      if (o.status === 'cancelled') return [{ title: 'Order placed', meta: D.fmtDay(d0) + ', 10:24 AM', state: 'done' }, { title: 'Cancelled', meta: D.fmtDay(o.cancelledOn || d0) + ' · refund in 3–5 days', state: 'now' }];
      // Out for delivery and Delivered fall on the delivery day (the ETA, or the actual delivery date)
      const last = toDate(o.deliveredOn || o.eta || D.iso(D.addDays(4, d0))); const dayOf = (i, off) => (i >= 3 ? last : D.addDays(off, d0));
      return steps.map(([title, off], i) => ({ title, meta: i <= at ? `${D.fmtDay(dayOf(i, off))}, ${['10:24 AM', '6:10 PM', '9:45 AM', '8:02 AM', '1:36 PM'][i]}` : (i === 4 ? 'Expected ' + D.fmtDay(last) : 'Pending'), state: i < at ? 'done' : i === at ? (at === 4 ? 'done' : 'now') : '' }));
    },
  };

  // ---- Addresses -----------------------------------------------------------
  D.addresses = {
    list: () => state('addresses'),
    get: (id) => state('addresses').find((a) => a.id === id) || null,
    selectedId: () => { const id = state('addressId'); return D.addresses.get(id) ? id : (state('addresses')[0] || {}).id; },
    selected: () => D.addresses.get(D.addresses.selectedId()),
    select(id) { save('addressId', id); },
    add(a) { const all = state('addresses'); const id = a.id || 'a' + Date.now().toString(36); const text = a.text || [a.line1, a.line2, a.city && `${a.city}${a.state ? ', ' + a.state : ''}`, a.pin].filter(Boolean).join(', ').replace(/, (\d{5,6})$/, ' $1'); all.push(Object.assign({}, a, { id, text })); save('addresses', all); return id; },
    update(id, patch) { const all = state('addresses'); const a = all.find((x) => x.id === id); if (a) Object.assign(a, patch); save('addresses', all); },
    remove(id) { const all = state('addresses').filter((a) => a.id !== id); save('addresses', all); if (state('addressId') === id && all[0]) save('addressId', all[0].id); },
  };

  // ---- Payment -------------------------------------------------------------
  D.paymentMethods = [
    { id: 'credit', label: 'Credit Card', icon: 'card', sub: 'Visa, Mastercard, RuPay, Amex' },
    { id: 'debit', label: 'Debit Card', icon: 'card', sub: 'All Indian bank debit cards' },
    { id: 'upi', label: 'UPI', icon: 'upi', sub: 'Google Pay, PhonePe, Paytm, BHIM' },
    { id: 'netbanking', label: 'Net Banking', icon: 'bank', sub: '50+ banks supported' },
    { id: 'cod', label: 'Cash on delivery', icon: 'cash', sub: 'Pay by cash or UPI at your door' },
  ];
  D.payment = {
    get: () => state('payment'),
    set: (id) => save('payment', id),
    label: (id) => (D.paymentMethods.find((m) => m.id === (id || state('payment'))) || {}).label || 'Cash on delivery',
    cards: () => state('cards'),
    addCard(c) { const all = state('cards'); const id = 'c' + Date.now().toString(36); all.push(Object.assign({ id }, c)); save('cards', all); return id; },
    removeCard(id) { save('cards', state('cards').filter((c) => c.id !== id)); },
    upi: () => state('upi'),
    addUpi(v) { const all = state('upi'); if (!all.includes(v)) all.push(v); save('upi', all); },
    removeUpi(v) { save('upi', state('upi').filter((x) => x !== v)); },
  };

  // ---- User / settings -----------------------------------------------------
  D.user = { get: () => state('user'), set(patch) { const u = Object.assign(state('user'), patch); save('user', u); return u; }, logout() { D.user.set({ loggedIn: false }); } };
  D.settings = { get: () => state('settings'), set(patch) { const s = Object.assign(state('settings'), patch); save('settings', s); return s; } };

  // ---- Delivery location (pincode) -----------------------------------------
  const PINS = { '700135': 'New Town, Kolkata', '700091': 'Salt Lake, Kolkata', '700017': 'Park Street, Kolkata', '700107': 'Kasba, Kolkata', '700156': 'Rajarhat, Kolkata', '110001': 'Connaught Place, New Delhi', '400001': 'Fort, Mumbai', '560001': 'MG Road, Bengaluru', '600001': 'Parrys, Chennai', '500001': 'Abids, Hyderabad', '411001': 'Camp, Pune' };
  D.location = {
    get: () => state('location'),
    lookup(pin) { pin = String(pin || '').replace(/\D/g, ''); if (PINS[pin]) return PINS[pin]; if (!/^[1-9]\d{5}$/.test(pin)) return null; return PINS[pin] || `Pincode ${pin}`; },
    set(pin) { const area = D.location.lookup(pin); if (!area) return null; const v = { area, pin: String(pin).replace(/\D/g, '') }; save('location', v); D.bindLocation(); return v; },
    days(pin) { const p = String(pin || state('location').pin); return /^7001/.test(p) ? 2 : /^(11|40|56|60|50|41)/.test(p) ? 3 : 5; },
    eta(pin) { return D.fmtDay(D.addDays(D.location.days(pin))); },
    label() { const l = state('location'); return `${l.area} ${l.pin}`; },
  };

  // ---- Notifications / searches / reviews ----------------------------------
  D.notifications = {
    list: () => state('notifications'),
    unread: () => state('notifications').filter((n) => !n.read).length,
    markRead(id) { const all = state('notifications'); const n = all.find((x) => x.id === id); if (n) n.read = true; save('notifications', all); },
    markAllRead() { const all = state('notifications'); all.forEach((n) => (n.read = true)); save('notifications', all); },
    remove(id) { save('notifications', state('notifications').filter((n) => n.id !== id)); },
  };
  D.searches = {
    list: () => state('searches'),
    add(q) { q = String(q || '').trim(); if (!q) return; const all = state('searches').filter((x) => x.toLowerCase() !== q.toLowerCase()); all.unshift(q); save('searches', all.slice(0, 8)); },
    clear() { save('searches', []); },
  };
  D.trending = ['Running shoes', 'Tennis racket', 'Cycling helmet', 'Hiking backpack', 'Yoga mat', 'Football'];
  const REVIEWERS = [
    { name: 'Ananya Sen', avatar: 'rev-1', rating: 5, date: '2026-04-28', title: 'Worth every rupee', text: 'Great control on volleys and the grip does not slip even when it is humid. Arrived well packed in two days.', size: 'L', helpful: 42 },
    { name: 'Rohit Mehra', avatar: 'rev-2', rating: 4, date: '2026-04-16', title: 'Solid for club play', text: 'Light and easy to swing. I would have liked a slightly firmer string tension out of the box, otherwise perfect.', size: 'M', helpful: 18 },
    { name: 'Priya Nair', avatar: 'rev-3', rating: 5, date: '2026-03-30', title: 'My daughter loves it', text: 'Bought for my 15 year old who trains thrice a week. Comfortable, well balanced and looks great too.', size: 'S', helpful: 11 },
    { name: 'Arjun Das', avatar: 'rev-4', rating: 3, date: '2026-03-12', title: 'Good, but check sizing', text: 'Quality is good for the price. The size chart runs a little small, go one size up if you are in between.', size: 'L', helpful: 7 },
  ];
  // Every other product gets reviews that fit any sport; sizes come from the product's own size list
  const GENERIC = [
    { name: 'Ananya Sen', avatar: 'rev-1', rating: 5, date: '2026-04-28', title: 'Worth every rupee', text: 'Well made and exactly as pictured. Arrived well packed in two days.', helpful: 42 },
    { name: 'Rohit Mehra', avatar: 'rev-2', rating: 4, date: '2026-04-16', title: 'Solid everyday pick', text: 'Comfortable from the first use. I would have liked one more colour option, otherwise perfect.', helpful: 18 },
    { name: 'Priya Nair', avatar: 'rev-3', rating: 5, date: '2026-03-30', title: 'My daughter loves it', text: 'Bought for my 15 year old who trains thrice a week. Comfortable, sturdy and looks great too.', helpful: 11 },
    { name: 'Arjun Das', avatar: 'rev-4', rating: 3, date: '2026-03-12', title: 'Good, but check sizing', text: 'Quality is good for the price. The size chart runs a little small, go one size up if you are in between.', helpful: 7, alt: ['Good, but slow delivery', 'Quality is good for the price, but it arrived a day later than the date shown at checkout.'] },
  ];
  // A size the reviewer could actually have bought: the product's own list, spread across it
  const sizeFor = (p, i) => (p && p.sizes.length > 1 ? p.sizes[(i * 2 + 1) % p.sizes.length] : '');
  D.reviews = {
    list: (id) => {
      const p = D.product(id); const base = id === 'racket' || !p ? REVIEWERS : GENERIC.map((r, i) => { const o = Object.assign({}, r, { size: sizeFor(p, i) }); if (r.alt && p.sizes.length < 2) { o.title = r.alt[0]; o.text = r.alt[1]; } delete o.alt; return o; });
      return (state('reviews')[id] || []).concat(base);
    },
    sizeFor,
    // Average of the star breakdown, so the big number, the stars and the bars always agree
    avg: (id) => { const b = D.reviews.breakdown(id); return Math.round(b.reduce((a, x) => a + x.stars * x.pct, 0) / 10) / 10; },
    add(id, r) { const all = state('reviews'); (all[id] = all[id] || []).unshift(Object.assign({ name: state('user').name, avatar: state('user').avatar, date: D.iso(), helpful: 0, mine: true }, r)); save('reviews', all); },
    // [{stars:5, pct:62}, ...] breakdown that averages to the product rating
    breakdown: (id) => { const p = D.product(id) || { rating: 4 }; const b = p.rating >= 5 ? [78, 14, 5, 2, 1] : p.rating >= 4 ? [58, 24, 10, 5, 3] : [30, 28, 22, 12, 8]; return b.map((pct, i) => ({ stars: 5 - i, pct })); },
    fmtCount: (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)),
  };

  /* ---- Search + filter model (Search results, Filters). One implementation, so the
     count on the results page, the count on every facet and the "Show N results"
     button can never disagree. Facet counts answer "how many results if I also tick
     this", so each facet's rows sum to the result count, and an option that would
     lead to zero results is disabled rather than offered. ---- */
  D.shop = (() => {
    const HOUSE = ['Decathlon', 'Quechua', 'Kipsta', 'Kalenji', 'Artengo', 'Btwin', 'Domyos'];
    const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].concat(SZ_KIDS, SZ_SHOE);
    const EMPTY = { min: 0, max: null, cats: [], sizes: [], brands: [] };
    const norm = (f) => Object.assign({}, EMPTY, JSON.parse(JSON.stringify(f || {})));
    const isEmpty = (f) => !f || (!f.min && f.max == null && !f.cats.length && !f.sizes.length && !f.brands.length);
    const onSale = (p) => D.pct(p) >= 30;
    const brandOf = (p) => (HOUSE.includes(p.brand) ? 'Decathlon' : p.brand);   // Decathlon = its own brands
    function base(q, sale) {
      const s = String(q || '').trim(); let list;
      const under = s.match(/under\s*(?:rs\.?\s*|₹\s*)?([\d,.]+)\s*(k)?/i);
      const brand = D.brands.find((b) => b.toLowerCase() === s.toLowerCase());
      const sport = D.sports.find((x) => x.name.toLowerCase() === s.toLowerCase() || x.slug === s.toLowerCase());
      if (!s || /^(sale|offers?|deals?|all)$/i.test(s)) list = D.products.slice();
      else if (under) { const cap = parseFloat(under[1].replace(/,/g, '')) * (under[2] ? 1000 : 1); const rest = s.replace(under[0], '').trim(); list = (rest ? D.search(rest) : D.products).filter((p) => p.price < cap); }   // "under" is strict: Home's "Deals under ₹1,000" rail and its See all agree
      else if (brand) list = D.products.filter((p) => (brand === 'Decathlon' ? HOUSE.includes(p.brand) : p.brand === brand));
      else if (sport && D.bySport(sport.slug).length) list = D.bySport(sport.slug);
      else list = D.search(s);
      return sale ? list.filter(onSale) : list;
    }
    // Category = shoe type when every result is a typed shoe, otherwise sport
    const catFn = (all) => (all.length && all.every((p) => p.type) ? (p) => p.type : (p) => p.sport);
    const catLabel = (v) => RUN_TYPE[v] || ((D.sport(v) || { name: v }).name).replace(' & strength', '');
    function passes(p, f, cat, skip) {
      if (skip !== 'price' && (p.price < (f.min || 0) || (f.max != null && p.price > f.max))) return false;
      if (skip !== 'cats' && f.cats.length && !f.cats.includes(cat(p))) return false;
      if (skip !== 'brands' && f.brands.length && !f.brands.includes(brandOf(p))) return false;
      if (skip !== 'sizes' && f.sizes.length && !f.sizes.some((z) => p.sizes.includes(z))) return false;
      return true;
    }
    function run(q, sale, f) {
      f = norm(f); const all = base(q, sale); const cat = catFn(all);
      const results = all.filter((p) => passes(p, f, cat));
      const count = (key, keyOf, v) => all.filter((p) => (key === 'sizes' ? p.sizes.includes(v) : keyOf(p) === v) && passes(p, f, cat, key)).length;
      const uniq = (arr) => [...new Set(arr)];
      const byBase = (keyOf) => (a, b) => all.filter((p) => keyOf(p) === b).length - all.filter((p) => keyOf(p) === a).length;
      const cats = uniq(all.map(cat).concat(f.cats)).sort(byBase(cat)).map((v) => ({ v, label: catLabel(v), n: count('cats', cat, v) }));
      const brands = uniq(all.map(brandOf).concat(f.brands)).sort(byBase(brandOf)).map((v) => ({ v, label: v, n: count('brands', brandOf, v) }));
      const sizes = uniq(all.flatMap((p) => p.sizes).concat(f.sizes)).filter((z) => SIZE_ORDER.includes(z)).sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)).map((v) => ({ v, label: v, n: count('sizes', null, v) }));
      const maxPrice = Math.max(1000, Math.ceil(Math.max(0, ...all.map((p) => p.price)) / 1000) * 1000);
      return { all, results, f, cats, brands, sizes, maxPrice, catLabel, isEmpty: isEmpty(f), countWith: (g) => all.filter((p) => passes(p, norm(g), cat)).length };
    }
    // Applied filters belong to one query: a new search starts clean
    const load = (q, sale) => { const x = D.store.get('filters', null); return x && x.q === String(q).toLowerCase() && !!x.sale === !!sale ? norm(x.f) : norm(EMPTY); };
    const saveF = (q, sale, f) => D.store.set('filters', isEmpty(f) ? null : { q: String(q).toLowerCase(), sale: !!sale, f: norm(f) });
    return { base, run, norm, isEmpty, EMPTY, load, save: saveF, onSale, brandOf, catLabel };
  })();

  /* ------------------------------------------------------- 5 render helpers */
  D.stars = (rating = 4, cls = '') => {
    const n = Math.round(rating); let s = '';
    for (let i = 0; i < 5; i++) s += i < n ? D.icon('star', 10) : `<svg class="s-empty" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${FILLED.star}</svg>`;
    return `<span class="stars ${cls}" role="img" aria-label="Rated ${n} out of 5">${s}</span>`;
  };
  D.priceHtml = (p, lg) => `<span class="price${lg ? ' price--lg' : ''} num">${D.fmt(p.price)}</span>${p.mrp > p.price ? `<span class="mrp${lg ? ' mrp--lg' : ''} num"><span class="sr-only">MRP </span>${D.fmt(p.mrp)}</span>` : ''}`;
  // Product card (Search results / Wishlist). o: {add:bool, rail:bool, white:bool, cls:''}
  D.card = (p, o = {}) => {
    if (typeof p === 'string') p = D.product(p); if (!p) return '';
    const href = `product.html?id=${p.id}`; const on = D.wish.has(p.id);
    return `<article class="pcard${o.rail ? ' pcard--rail' : ''}${o.white ? ' pcard--white' : ''} ${o.cls || ''}" data-product="${p.id}">
      <a class="pcard__media" href="${href}" tabindex="-1" aria-hidden="true"><img src="${D.img(p.img)}" alt="" loading="lazy"></a>
      <button class="heart${on ? ' is-on' : ''}" type="button" data-heart="${p.id}" aria-pressed="${on}" aria-label="Save ${D.esc(p.name)} to wishlist">${heartSvgs(9)}</button>
      <a class="pcard__body" href="${href}">
        <span class="pcard__row"><span class="pcard__name">${D.esc(p.name)}</span>${D.stars(p.rating)}</span>
        <span class="pcard__price">${D.priceHtml(p)}</span>
      </a>${o.add ? `<button class="add-btn tap" type="button" data-action="add-to-bag" data-id="${p.id}">Add to bag</button>` : ''}
    </article>`;
  };
  // Order card (Order history)
  D.orderCard = (o) => {
    const items = D.orders.items(o); const n = D.orders.count(o); const transit = o.status === 'transit' || o.status === 'processing';
    const thumbs = items.slice(0, 2).map((it) => `<span class="thumb"><img src="${D.img(it.product.img)}" alt="" loading="lazy"></span>`).join('');
    const actions = transit
      ? `<div class="order-card__actions order-card__actions--one"><a class="btn tap" href="order-tracking.html?id=${o.id}">Track order</a></div>`
      : o.status === 'delivered'
        ? `<div class="order-card__actions"><button class="btn tap" type="button" data-action="buy-again" data-id="${o.id}">Buy again</button><a class="btn tap" href="write-review.html?id=${items[0] ? items[0].id : ''}&order=${o.id}">Write a review</a></div>`
        : `<div class="order-card__actions order-card__actions--one"><a class="btn tap" href="order-detail.html?id=${o.id}">View details</a></div>`;
    return `<article class="order-card" data-status="${o.status}" data-order="${o.id}">
      <div class="order-card__head"><a class="order-card__id tap" href="order-detail.html?id=${o.id}">#${o.id}</a><span class="pill ${D.orders.pill(o.status)}">${D.orders.status(o.status)}</span></div>
      <a class="order-card__body" href="order-detail.html?id=${o.id}"><span class="order-card__thumbs">${thumbs}</span><span class="order-card__meta">${n} ${n === 1 ? 'item' : 'items'}&nbsp;&nbsp; ${D.fmtDate(o.date)}<span class="price num">${D.fmt(o.total)}</span></span></a>
      ${actions}
    </article>`;
  };

  /* ------------------------------------------------------------- 6 chrome */
  // Badges: any [data-badge="bag|wish|notif"] shows the live count (hidden at 0)
  D.badges = () => {
    const n = { bag: D.bag.count(), wish: D.wish.count(), notif: D.notifications.unread() };
    $$('[data-badge]').forEach((el) => { const v = n[el.dataset.badge] || 0; el.textContent = v > 9 ? '9+' : v ? String(v) : ''; el.dataset.n = v; });
  };
  D.bindLocation = () => { const l = state('location'); $$('[data-bind="delivery"]').forEach((el) => (el.textContent = `${l.area} ${l.pin}`)); $$('[data-bind="pin"]').forEach((el) => (el.textContent = l.pin)); $$('[data-bind="eta"]').forEach((el) => (el.textContent = D.location.eta())); };

  // Tab bar: <nav data-tabbar="home|categories|travel|bag|account|none"></nav>
  const TAB_ICON = {
    home: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3.6 11 13 3.4l9.4 7.6v11a1 1 0 0 1-1 1h-5.2v-7.3H9.8V23H4.6a1 1 0 0 1-1-1V11Z"/></svg>',
    categories: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.6" y="3.6" width="7.6" height="7.6" rx="3.2"/><rect x="14.8" y="3.6" width="7.6" height="7.6" rx="3.2"/><rect x="3.6" y="14.8" width="7.6" height="7.6" rx="3.2"/><rect x="14.8" y="14.8" width="7.6" height="7.6" rx="3.2"/></svg>',
    travel: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="13" cy="13" r="10"/><path d="M3 13h20M13 3c2.9 2.7 4.3 6 4.3 10s-1.4 7.3-4.3 10c-2.9-2.7-4.3-6-4.3-10S10.1 5.7 13 3Z"/></svg>',
    bag: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4.4 9.2h17.2l-.3 14H4.7l-.3-14Z"/><path d="M9 9.2V7.4a4 4 0 0 1 8 0v1.8"/></svg>',
    account: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><circle cx="13" cy="8" r="4.6"/><path d="M4.4 23v-.8a6.4 6.4 0 0 1 6.4-6.4h4.4a6.4 6.4 0 0 1 6.4 6.4v.8H4.4Z"/></svg>',
  };
  const TABS = [['home', 'Home', 40.5, 'home.html'], ['categories', 'Categories', 120, 'category.html'], ['travel', 'Travel store', 203, 'travel-store.html'], ['bag', 'Bag', 284, 'bag.html'], ['account', 'Account', 357, 'account.html']];
  $$('[data-tabbar]').forEach((nav) => {
    const active = nav.getAttribute('data-tabbar');
    if (active === 'none') { nav.remove(); return; }
    nav.classList.add('tabbar'); nav.setAttribute('aria-label', 'Primary');
    nav.innerHTML = TABS.map(([k, label, x, href]) => `<a class="tab" href="${href}" style="left:${x}px"${active === k ? ' aria-current="page"' : ''}>${TAB_ICON[k]}<span>${label}</span>${k === 'bag' ? '<b class="tab__badge" data-badge="bag" aria-label="items in bag"></b>' : ''}</a>`).join('');
  });
  if (!$('.tabbar')) body.classList.add('no-tabbar');

  // Brand header (Home / Category / Travel store): <header class="brand-head" data-brandhead></header>
  const headIcons = (ring) => `<a class="head-icon tap" href="notifications.html" aria-label="Notifications">${D.icon('bell', 16, { sw: 1.7 })}<b class="count-badge" data-badge="notif" style="--badge-ring:${ring}"></b></a>`
    + `<a class="head-icon tap" href="wishlist.html" aria-label="Wishlist">${D.icon('heart', 16, { sw: 1.7 })}<b class="count-badge" data-badge="wish" style="--badge-ring:${ring}"></b></a>`
    + `<a class="head-icon tap" href="bag.html" aria-label="Bag">${D.icon('cart', 16, { sw: 1.7 })}<b class="count-badge" data-badge="bag" style="--badge-ring:${ring}"></b></a>`;
  D.headIcons = headIcons;
  $$('[data-brandhead]').forEach((h) => {
    const ring = h.dataset.ring || '#C0E4F5';
    h.innerHTML = `<a class="brand-head__logo" href="home.html" aria-label="Decathlon home"><span class="wordmark" aria-hidden="true"></span></a>
      <div class="brand-head__icons">${headIcons(ring)}</div>
      <button class="delivery tap" type="button" data-action="pincode" aria-label="Change delivery location">${D.icon('pin', 15, { sw: 1.7 })}<b>Delivery</b> : <span data-bind="delivery"></span></button>
      <div class="search-pill"><a class="search-pill__go" href="search.html" aria-label="Search Decathlon">${D.icon('search', 17, { sw: 1.6 })}<span class="sr-only">Search</span></a><button class="search-pill__mic tap" type="button" data-action="voice" aria-label="Search by voice">${D.icon('mic', 17, { sw: 1.6 })}</button></div>
      <a class="qr-btn tap" href="scanner.html" aria-label="Scan a product barcode"><svg width="26" height="24" viewBox="0 0 26 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="1.5" width="6" height="6" rx="2.4"/><rect x="18.5" y="1.5" width="6" height="6" rx="2.4"/><rect x="1.5" y="16.5" width="6" height="6" rx="2.4"/><path d="M13 1.5v2.6M13 7.3v4.4h4.5M1.5 11.7h7M19.5 11.7h5M12.5 16.3v6.2M16.5 16.5h1.3M16.5 22.5h8M21.5 16.5h3"/></svg></a>`;
  });

  // Declarative icons: <i data-icon="bell" data-size="18" data-sw="1.8"></i>
  D.hydrateIcons = (root = document) => $$('[data-icon]', root).forEach((el) => { if (el.dataset.iconDone) return; el.innerHTML = D.icon(el.dataset.icon, +el.dataset.size || 20, { sw: el.dataset.sw }); el.dataset.iconDone = '1'; el.setAttribute('aria-hidden', el.getAttribute('aria-hidden') || 'true'); if (el.tagName === 'I') el.style.display = el.style.display || 'inline-flex'; });

  /* --------------------------------------------------------- 7 behaviours */
  // Routing: data-go="screen" | "screen?x=1" | "back" (falls back to href or home)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go]'); if (!el) return;
    e.preventDefault(); const t = el.getAttribute('data-go');
    if (t === 'back') { const fb = el.getAttribute('href') || 'home.html'; (history.length > 1 && document.referrer) ? history.back() : (location.href = fb); return; }
    const [scr, qs] = t.split('?'); location.href = scr + '.html' + (qs ? '?' + qs : '');
  });
  // Keyboard activation for non-button tappables
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-go]:not(button):not(a), [role="switch"]:not(button), [role="tab"]:not(button), [role="radio"]:not(button):not(input), [role="button"]:not(button)')) { e.preventDefault(); e.target.click(); }
  });

  // Switches: <button role="switch" class="switch" aria-checked="true" aria-label="..."> (emits change)
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('[role="switch"]'); if (!sw) return;
    const v = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', String(v)); D.haptic(8);
    sw.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: v }));
  });
  $$('[role="switch"]').forEach((sw) => { if (sw.tagName !== 'BUTTON') sw.tabIndex = 0; });

  // Single-select chips / tabs: [data-group] > [role=tab] (emits change with data-value)
  // self-inclusive query: root itself counts when it matches (Deca.hydrate(el) on a group)
  const within = (root, sel) => (root && root !== document && root.matches && root.matches(sel) ? [root] : []).concat($$(sel, root));
  // Idempotent per child: containers rendered empty at load are bound when their children appear
  const initGroups = (root = document) => within(root, '[data-group]').forEach((group) => {
    const cls = group.getAttribute('data-active-class') || 'is-active';
    if (!group.getAttribute('role')) group.setAttribute('role', 'tablist');
    $$('[role="tab"]', group).forEach((tab) => {
      if (tab.dataset.bound) return; tab.dataset.bound = '1';
      if (tab.tagName !== 'BUTTON') tab.tabIndex = 0;
      if (!tab.hasAttribute('aria-selected')) tab.setAttribute('aria-selected', String(tab.classList.contains(cls)));
      tab.addEventListener('click', () => {
        const group = tab.closest('[data-group]') || tab.parentNode; const cls = group.getAttribute('data-active-class') || 'is-active';
        $$('[role="tab"]', group).forEach((t) => { t.classList.remove(cls); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add(cls); tab.setAttribute('aria-selected', 'true');
        group.dispatchEvent(new CustomEvent('change', { detail: tab.dataset.value }));
      });
    });
  });
  // Multi-select chips: [data-multi] > .chip (aria-pressed). Emits change with array of values
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-multi] .chip, [data-multi] [data-value]'); if (!chip) return;
    const group = chip.closest('[data-multi]'); const on = chip.getAttribute('aria-pressed') !== 'true';
    chip.setAttribute('aria-pressed', String(on)); chip.classList.toggle('is-active', on);
    group.dispatchEvent(new CustomEvent('change', { detail: $$('[aria-pressed="true"]', group).map((c) => c.dataset.value || c.textContent.trim()) }));
  });
  // Filterable lists: <div data-group data-filter-target="#list"> chips drive items with data-status
  const initFilters = () => $$('[data-filter-target]').forEach((group) => {
    const list = $(group.getAttribute('data-filter-target')); if (!list) return;
    group.addEventListener('change', (e) => {
      const v = e.detail; let shown = 0;
      list.querySelectorAll('[data-status]').forEach((it) => { const ok = v === 'all' || (it.dataset.status || '').split(' ').includes(v); it.hidden = !ok; if (ok) shown++; });
      list.dispatchEvent(new CustomEvent('filtered', { detail: { value: v, shown } }));
    });
  });

  // ---- Toast: Deca.toast(msg, {action:'View bag', href:'bag.html', onAction:fn, icon:'check', ms}) ----
  D.toast = (msg, o = {}) => {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); body.appendChild(t); }
    t.innerHTML = (o.icon ? D.icon(o.icon, 18) : '') + `<span class="grow">${D.esc(msg)}</span>` + (o.action ? `<${o.href ? `a href="${o.href}"` : 'button type="button"'} class="toast__action">${D.esc(o.action)}</${o.href ? 'a' : 'button'}>` : '');
    if (o.onAction) { const b = $('.toast__action', t); b && b.addEventListener('click', (e) => { if (!o.href) e.preventDefault(); o.onAction(); t.classList.remove('show'); }); }
    t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), o.ms || (o.action ? 3600 : 2400));
  };
  window.decaToast = D.toast;
  document.addEventListener('click', (e) => { const el = e.target.closest('[data-toast]'); if (el && !el.hasAttribute('data-confirm')) D.toast(el.getAttribute('data-toast')); });

  // ---- Loading buttons: await Deca.loading(btn, ms) ----
  D.loading = async (btn, ms = 1000) => {
    if (!btn) return D.wait(ms);
    btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true');
    await D.wait(ms);
    btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy');
  };

  // ---- Bottom sheets ----
  let openSheet = null, lastFocus = null, scrim = null, dialogOpen = null;
  const ensureScrim = () => { if (scrim) return scrim; scrim = document.createElement('div'); scrim.className = 'sheet-scrim'; scrim.hidden = true; scrim.addEventListener('click', () => D.sheet.close()); body.appendChild(scrim); return scrim; };
  const initSheet = (el) => {
    if (el.dataset.inited) return; el.dataset.inited = '1'; el.hidden = true;
    if (!el.querySelector('.sheet__grab')) { const g = document.createElement('span'); g.className = 'sheet__grab'; g.setAttribute('aria-hidden', 'true'); el.prepend(g); }
    let y0 = null, dy = 0; const grab = el.querySelector('.sheet__grab');
    const start = (e) => { y0 = e.clientY; dy = 0; el.classList.add('dragging'); };
    const move = (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; };
    const end = () => { if (y0 == null) return; y0 = null; el.classList.remove('dragging'); if (dy > 80) D.sheet.close(); else el.style.transform = ''; };
    grab.addEventListener('pointerdown', (e) => { grab.setPointerCapture(e.pointerId); start(e); });
    grab.addEventListener('pointermove', move); grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  };
  D.sheet = {
    open(id) {
      const el = typeof id === 'string' ? document.getElementById(id) : id; if (!el) return;
      initSheet(el);
      if (openSheet && openSheet !== el) D.sheet.close(true);
      lastFocus = document.activeElement;
      const sc = ensureScrim(); sc.hidden = false; el.hidden = false;
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      if (body.classList.contains('capture')) { sc.classList.add('open'); el.classList.add('open'); }
      else requestAnimationFrame(() => requestAnimationFrame(() => { sc.classList.add('open'); el.classList.add('open'); }));
      openSheet = el;
      if (!body.classList.contains('capture')) setTimeout(() => { const f = el.querySelector('[autofocus]') || el.querySelector('input:not([type=hidden]), button:not(.sheet__close), a[href], [tabindex="0"]'); f && f.focus({ preventScroll: true }); }, 80);
      el.dispatchEvent(new CustomEvent('sheet:open'));
    },
    close(instant) {
      if (!openSheet) return; const el = openSheet; openSheet = null;
      el.classList.remove('open'); el.style.transform = ''; if (scrim) scrim.classList.remove('open');
      const done = () => { if (!openSheet && scrim) scrim.hidden = true; if (!el.classList.contains('open')) el.hidden = true; };
      instant === true ? done() : setTimeout(done, 320);
      el.dispatchEvent(new CustomEvent('sheet:close'));
      if (lastFocus && lastFocus.focus && instant !== true) lastFocus.focus({ preventScroll: true });
    },
    current: () => openSheet,
  };
  D.initSheets = (root = document) => within(root, '.sheet').forEach(initSheet);
  document.addEventListener('click', (e) => {
    const op = e.target.closest('[data-sheet]'); if (op) { e.preventDefault(); D.sheet.open(op.getAttribute('data-sheet')); return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); D.sheet.close(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (dialogOpen) dialogOpen(false); else D.sheet.close(); }
    const trap = dialogOpen ? $('.dialog') : openSheet;
    if (e.key === 'Tab' && trap) {
      const f = $$('a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex="0"]', trap).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // Sheet factory for runtime sheets: Deca.makeSheet(id, title, sub, innerHtml) -> element
  D.makeSheet = (id, title, sub, html) => {
    let el = document.getElementById(id); if (el) return el;
    el = document.createElement('section'); el.className = 'sheet'; el.id = id; el.setAttribute('aria-labelledby', id + 'T');
    el.innerHTML = `<div class="sheet__head"><div><p class="sheet__title" id="${id}T">${title}</p>${sub ? `<p class="sheet__sub">${sub}</p>` : ''}</div><button class="sheet__close tap" type="button" data-close aria-label="Close">${D.icon('close', 14, { sw: 2.2 })}</button></div>${html}`;
    body.appendChild(el); initSheet(el); initOptions(el); return el;
  };

  // Radio option lists: [data-options] > .option  (emits select with data-value)
  const initOptions = (root = document) => within(root, '[data-options]').forEach((group) => {
    group.setAttribute('role', 'radiogroup');
    $$('.option', group).forEach((o) => {
      if (o.dataset.bound) return; o.dataset.bound = '1';
      o.setAttribute('role', 'radio'); if (!o.hasAttribute('aria-checked')) o.setAttribute('aria-checked', 'false'); if (o.tagName !== 'BUTTON') o.tabIndex = 0;
      o.addEventListener('click', () => { const group = o.closest('[data-options]') || o.parentNode; $$('.option', group).forEach((x) => x.setAttribute('aria-checked', 'false')); o.setAttribute('aria-checked', 'true'); group.dispatchEvent(new CustomEvent('select', { detail: o.dataset.value || o.textContent.trim() })); });
    });
  });
  // Generic radio chips: [data-radio] > [role=radio] (sizes, swatches). Emits change with data-value
  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-radio] [role="radio"]'); if (!r || r.getAttribute('aria-disabled') === 'true') return;
    const g = r.closest('[data-radio]'); $$('[role="radio"]', g).forEach((x) => { x.setAttribute('aria-checked', 'false'); x.tabIndex = -1; });
    r.setAttribute('aria-checked', 'true'); r.tabIndex = 0; g.classList.remove('is-error'); D.haptic(6);
    g.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: r.dataset.value }));
  });
  document.addEventListener('keydown', (e) => {
    const r = e.target.closest && e.target.closest('[data-radio] [role="radio"]'); if (!r || !/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
    e.preventDefault(); const all = $$('[role="radio"]:not([aria-disabled="true"])', r.closest('[data-radio]')); const i = all.indexOf(r);
    const n = all[(i + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length]; n.focus(); n.click();
  });
  const initRadios = (root = document) => within(root, '[data-radio]').forEach((g) => { g.setAttribute('role', 'radiogroup'); const rs = $$('[role="radio"]', g); const sel = rs.find((x) => x.getAttribute('aria-checked') === 'true'); rs.forEach((x, i) => { if (!x.hasAttribute('aria-checked')) x.setAttribute('aria-checked', 'false'); x.tabIndex = (sel ? x === sel : i === 0) ? 0 : -1; }); });

  // ---- Dialogs: await Deca.dialog({title, message, confirm, cancel, tone:'danger'|'info'|'ok', icon}) -> bool
  const DLG = { danger: ['#FDE9E7', '#E0453A', 'btn--danger', 'alert'], info: ['#E5F2F7', '#0F96DB', 'btn--primary', 'info'], ok: ['#E1F5DF', '#3AAA35', 'btn--primary', 'check'] };
  D.dialog = ({ title, message = '', confirm = 'Confirm', cancel = 'Cancel', tone = 'info', icon } = {}) => new Promise((resolve) => {
    const [bg, fg, cls, ic] = DLG[tone] || DLG.info;
    const wrap = document.createElement('div'); wrap.className = 'dialog-wrap';
    wrap.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlgT" aria-describedby="dlgM">
      <div class="dialog__icon" style="background:${bg};color:${fg}">${D.icon(icon || ic, 26, { sw: 2 })}</div>
      <p class="dialog__title" id="dlgT">${title}</p>${message ? `<p class="dialog__msg" id="dlgM">${message}</p>` : ''}
      <div class="dialog__actions"${cancel ? '' : ' style="grid-template-columns:1fr"'}>${cancel ? `<button class="btn btn--neutral tap" type="button" data-r="0">${cancel}</button>` : ''}<button class="btn ${cls} tap" type="button" data-r="1">${confirm}</button></div></div>`;
    const prev = document.activeElement;
    const close = (r) => { dialogOpen = null; wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 200); prev && prev.focus && prev.focus({ preventScroll: true }); resolve(r); };
    dialogOpen = close;
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(false); const b = e.target.closest('[data-r]'); if (b) close(b.dataset.r === '1'); });
    body.appendChild(wrap);
    requestAnimationFrame(() => { wrap.classList.add('open'); wrap.querySelector('[data-r="1"]').focus(); });
  });
  // Declarative confirm: data-confirm="Title|Message|Confirm label|tone" (+ data-confirm-toast)
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-confirm]'); if (!el || el.dataset.confirmed) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const [title, message, confirm, tone] = el.dataset.confirm.split('|');
    if (await D.dialog({ title, message, confirm: confirm || 'Confirm', tone: tone || 'danger' })) {
      if (el.dataset.confirmToast) D.toast(el.dataset.confirmToast);
      const href = el.getAttribute('href');
      if (href && href !== '#') { await D.wait(el.dataset.confirmToast ? 700 : 0); location.href = href; }
      else { el.dataset.confirmed = '1'; el.click(); delete el.dataset.confirmed; }
    }
  }, true);

  // ---- OTP: <div class="otp" data-length="6"></div>  (emits complete; .reset(), .fill(code), .value()) ----
  const initOtp = () => $$('.otp').forEach((box) => {
    const n = +box.dataset.length || 6;
    if (!box.children.length) box.innerHTML = Array.from({ length: n }, (_, i) => `<input inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" aria-label="Digit ${i + 1} of ${n}">`).join('');
    const ins = $$('input', box); const value = () => ins.map((i) => i.value).join('');
    const upd = () => { ins.forEach((i) => i.classList.toggle('filled', !!i.value)); box.classList.remove('is-error'); box.dispatchEvent(new CustomEvent('input')); if (value().length === n) box.dispatchEvent(new CustomEvent('complete', { detail: value() })); };
    ins.forEach((inp, i) => {
      inp.addEventListener('input', (e) => { e.stopPropagation(); inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); upd(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) { ins[i - 1].focus(); ins[i - 1].value = ''; upd(); } });
      inp.addEventListener('paste', (e) => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, n); if (!t) return; e.preventDefault(); t.split('').forEach((c, k) => { if (ins[k]) ins[k].value = c; }); ins[Math.min(t.length, n - 1)].focus(); upd(); });
    });
    box.fill = (code) => { String(code).split('').forEach((c, k) => { if (ins[k]) ins[k].value = c; }); upd(); };
    box.reset = () => { ins.forEach((i) => (i.value = '')); ins.forEach((i) => i.classList.remove('filled')); ins[0].focus(); };
    box.value = value;
  });

  // ---- PIN keypad: <div class="pin-dots" id="dots"></div><div class="keypad" data-target="dots" data-length="4"> ----
  const initKeypads = () => $$('.keypad').forEach((pad) => {
    const n = +pad.dataset.length || 4; const dots = document.getElementById(pad.dataset.target);
    if (!pad.children.length) pad.innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => `<button type="button" data-k="${d}">${d}</button>`).join('') + `<button type="button" class="key-muted" data-k="bio" aria-label="Use biometrics">${D.icon('shield', 24, { sw: 1.6 })}</button><button type="button" data-k="0">0</button><button type="button" class="key-muted" data-k="del" aria-label="Delete">${D.icon('back', 24)}</button>`;
    if (dots && !dots.children.length) dots.innerHTML = '<i></i>'.repeat(n);
    let val = ''; const render = () => dots && $$('i', dots).forEach((d, i) => d.classList.toggle('on', i < val.length));
    pad.reset = () => { val = ''; render(); };
    pad.error = () => { if (dots) dots.classList.add('is-error'); D.haptic(30); setTimeout(() => { dots && dots.classList.remove('is-error'); pad.reset(); }, 420); };
    const press = (k) => { if (k === 'bio') { pad.dispatchEvent(new CustomEvent('biometric')); return; } if (k === 'del') val = val.slice(0, -1); else if (val.length < n) val += k; render(); D.haptic(6); if (val.length === n) { const v = val; setTimeout(() => pad.dispatchEvent(new CustomEvent('complete', { detail: v })), 160); } };
    pad.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
    document.addEventListener('keydown', (e) => { if (pad.offsetParent === null || /input|textarea/i.test(document.activeElement.tagName)) return; if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') press('del'); });
  });

  // ---- Countdown: <button data-countdown="30">Resend code</button> ----
  const initCountdowns = () => $$('[data-countdown]').forEach((btn) => {
    const label = btn.textContent.trim(); const secs = +btn.dataset.countdown; let h;
    const run = () => { let t = secs; btn.disabled = true; clearInterval(h); const tick = () => { btn.textContent = `${label} in 0:${String(t).padStart(2, '0')}`; if (t-- <= 0) { btn.disabled = false; btn.textContent = label; clearInterval(h); } }; tick(); h = setInterval(tick, 1000); };
    btn.addEventListener('click', () => { if (!btn.disabled) { D.toast('A new code is on its way'); run(); } });
    run();
  });

  // ---- Range (single): <input type=range class=range data-out="id" data-fmt="rs|pct"> ----
  const initRanges = () => $$('input.range').forEach((r) => {
    const out = r.dataset.out && document.getElementById(r.dataset.out);
    const upd = () => { const p = ((r.value - r.min) / (r.max - r.min)) * 100; r.style.setProperty('--p', p + '%'); if (out) out.textContent = r.dataset.fmt === 'rs' ? D.fmt(r.value) : r.dataset.fmt === 'pct' ? r.value + '%' : r.value; };
    r.addEventListener('input', upd); upd();
  });
  // ---- Dual range: <div class="dual-range" data-min="0" data-max="15000" data-step="500" data-from="3000" data-to="9000" data-fmt="rs">
  //      emits change {from,to}; el.set(from,to); el.value() -> {from,to}
  // Deca.dualRange(el) (re)builds one after its data-min/max changed
  const initDual = () => $$('.dual-range').forEach((el) => D.dualRange(el));
  D.dualRange = (el) => {
    const min = +el.dataset.min || 0, max = +el.dataset.max || 100, step = +el.dataset.step || 1, fmt = el.dataset.fmt === 'rs' ? D.fmt : (v) => v;
    el.innerHTML = `<span class="dual-range__track"></span><span class="dual-range__fill"></span><input type="range" min="${min}" max="${max}" step="${step}" value="${el.dataset.from || min}" aria-label="Minimum ${el.dataset.label || 'value'}"><input type="range" min="${min}" max="${max}" step="${step}" value="${el.dataset.to || max}" aria-label="Maximum ${el.dataset.label || 'value'}"><span class="dual-range__lbl num"></span><span class="dual-range__lbl num"></span>`;
    const [a, b] = $$('input', el); const [la, lb] = $$('.dual-range__lbl', el); const gap = step;
    const pos = (v) => ((v - min) / (max - min)) * 100;
    const upd = (src) => {
      if (+a.value > +b.value - gap) { if (src === a) a.value = +b.value - gap; else b.value = +a.value + gap; }
      el.style.setProperty('--a', pos(a.value) + '%'); el.style.setProperty('--b', pos(b.value) + '%');
      la.textContent = fmt(+a.value); lb.textContent = fmt(+b.value);
      la.style.left = pos(a.value) + '%'; lb.style.left = pos(b.value) + '%';
      a.setAttribute('aria-valuetext', fmt(+a.value)); b.setAttribute('aria-valuetext', fmt(+b.value));
    };
    a.addEventListener('input', () => upd(a)); b.addEventListener('input', () => upd(b));
    [a, b].forEach((i) => i.addEventListener('change', () => el.dispatchEvent(new CustomEvent('change', { detail: el.value() }))));
    el.value = () => ({ from: +a.value, to: +b.value });
    el.set = (f, t) => { a.value = f; b.value = t; upd(); el.dispatchEvent(new CustomEvent('change', { detail: el.value() })); };
    upd();
  };

  // ---- Segmented: .segmented > button (emits change) ----
  const initSegmented = (root = document) => within(root, '.segmented').forEach((seg) => {
    seg.setAttribute('role', 'tablist');
    $$('button', seg).forEach((b) => { if (b.dataset.bound) return; b.dataset.bound = '1'; b.setAttribute('role', 'tab'); if (!b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', 'false'); b.addEventListener('click', () => { $$('button', seg).forEach((x) => x.setAttribute('aria-selected', 'false')); b.setAttribute('aria-selected', 'true'); seg.dispatchEvent(new CustomEvent('change', { detail: b.dataset.value })); }); });
  });

  // ---- Validation: data-validate="required|email|phone|pin|name|card|expiry|cvv|upi|password|otp" inside .fg ----
  const RULES = {
    required: (v) => v.trim().length > 0 || 'This field is required',
    name: (v) => /^[A-Za-z][A-Za-z .'-]{1,}$/.test(v.trim()) || 'Enter your full name using letters only',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email, e.g. name@gmail.com',
    phone: (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10)) && v.replace(/\D/g, '').length >= 10 || 'Enter a 10-digit mobile number starting with 6–9',
    pin: (v) => /^[1-9]\d{5}$/.test(v.replace(/\s/g, '')) || 'Enter a 6-digit pincode, e.g. 700135',
    card: (v) => { const d = v.replace(/\D/g, ''); if (d.length < 15 || d.length > 16) return 'Card number should be 16 digits'; let s = 0; d.split('').reverse().forEach((c, i) => { let n = +c; if (i % 2) { n *= 2; if (n > 9) n -= 9; } s += n; }); return s % 10 === 0 || 'Check the card number, it doesn’t look right'; },
    expiry: (v) => { const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/); if (!m || +m[1] < 1 || +m[1] > 12) return 'Use MM/YY, e.g. 09/28'; const exp = new Date(2000 + +m[2], +m[1], 0); return exp >= new Date() || 'This card has expired'; },
    cvv: (v) => /^\d{3,4}$/.test(v.trim()) || 'CVV is the 3 digits on the back of your card',
    upi: (v) => /^[\w.-]{2,}@[a-z]{2,}$/i.test(v.trim()) || 'UPI ID looks like name@bank',
    password: (v) => v.length >= 8 || 'Use at least 8 characters',
    otp: (v) => /^\d{6}$/.test(v.trim()) || 'Enter the 6-digit code',
    promo: (v) => /^[A-Z0-9-]{4,14}$/i.test(v.trim()) || 'Enter a promo code, e.g. DECA10',
  };
  D.rules = RULES;
  D.validate = (root = document) => {
    let first = null;
    $$('[data-validate]', root).forEach((inp) => {
      const fg = inp.closest('.fg'); if (!fg || inp.disabled || inp.offsetParent === null) return;
      const rules = inp.dataset.validate.split('|'); const v = inp.value || '';
      const msgs = (!v.trim() && !rules.includes('required')) ? [] : rules.map((r) => RULES[r] && RULES[r](v)).filter((m) => m !== true && m);
      fg.classList.toggle('has-error', msgs.length > 0);
      let et = fg.querySelector('.error-text'); if (!et) { et = document.createElement('span'); et.className = 'error-text'; et.setAttribute('role', 'alert'); fg.appendChild(et); }
      et.textContent = msgs[0] || ''; inp.setAttribute('aria-invalid', String(msgs.length > 0));
      if (msgs.length && !first) first = inp;
    });
    if (first) first.focus();
    return !first;
  };
  document.addEventListener('focusout', (e) => { const inp = e.target.closest && e.target.closest('[data-validate]'); if (inp && inp.value) D.validate(inp.closest('.fg')); });
  document.addEventListener('input', (e) => { const fg = e.target.closest && e.target.closest('.fg.has-error'); if (fg) { fg.classList.remove('has-error'); e.target.removeAttribute('aria-invalid'); } });
  // Input masks: data-mask="card|expiry|phone|pin|upper"
  document.addEventListener('input', (e) => {
    const el = e.target; const m = el.dataset && el.dataset.mask; if (!m) return;
    let v = el.value;
    if (m === 'card') v = v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    if (m === 'expiry') { v = v.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); }
    if (m === 'phone') { v = v.replace(/\D/g, '').slice(0, 10); if (v.length > 5) v = v.slice(0, 5) + ' ' + v.slice(5); }
    if (m === 'pin' || m === 'digits') v = v.replace(/\D/g, '').slice(0, +el.maxLength > 0 ? +el.maxLength : 6);
    if (m === 'upper') v = v.toUpperCase().replace(/\s/g, '');
    if (v !== el.value) el.value = v;
  });
  // Password show/hide: <button data-action="reveal" aria-controls="inputId">
  // (handled in the action switch below)

  // ---- Wishlist hearts: [data-heart="productId"] (auto state + toggle + toast) ----
  D.syncHearts = (root = document) => $$('[data-heart]', root).forEach((h) => { const on = D.wish.has(h.dataset.heart); h.classList.toggle('is-on', on); h.setAttribute('aria-pressed', String(on)); if (!h.querySelector('svg')) h.innerHTML = heartSvgs(h.classList.contains('heart--box') ? 22 : 9); });
  document.addEventListener('click', (e) => {
    const h = e.target.closest('[data-heart]'); if (!h) return;
    e.preventDefault(); e.stopPropagation();
    const id = h.dataset.heart; const on = D.wish.toggle(id); const p = D.product(id);
    D.syncHearts(); h.classList.remove('pop'); void h.offsetWidth; if (on) h.classList.add('pop'); D.haptic(10);
    if (!h.hasAttribute('data-silent')) D.toast(on ? 'Saved to wishlist' : 'Removed from wishlist', on ? { action: 'View', href: 'wishlist.html' } : { action: 'Undo', onAction: () => { D.wish.add(id); D.syncHearts(); } });
    h.dispatchEvent(new CustomEvent('heart', { bubbles: true, detail: { id, on, product: p } }));
  });
  D.on('wish', () => D.syncHearts());

  // ---- Size picker sheet (used by card "Add to bag" when a size is needed) -> Promise<size|null> ----
  D.pickSize = (p) => new Promise((resolve) => {
    const el = D.makeSheet('decaSizeSheet', 'Select a size', '', '<div class="sizes" data-radio id="decaSizeList" style="gap:10px;margin:4px 0 6px"></div><p class="helper" id="decaSizeHelp" style="margin:12px 0 0"></p><div class="sheet__foot"><button class="btn btn--primary tap" type="button" id="decaSizeGo">Add to bag</button></div>');
    $('#' + el.id + 'T').textContent = 'Select a size'; $('.sheet__sub', el) && $('.sheet__sub', el).remove();
    const list = $('#decaSizeList', el); list.innerHTML = p.sizes.map((s) => `<button type="button" class="size${s.length > 2 ? ' size--wide' : ''}" role="radio" aria-checked="false" data-value="${s}">${s}</button>`).join('');
    initRadios(el); $('#decaSizeHelp', el).textContent = `${p.name} · ${D.fmt(p.price)}`;
    let chosen = null; const go = $('#decaSizeGo', el);
    list.onchange = (e) => { chosen = e.detail; };
    go.onclick = () => { if (!chosen) { list.classList.add('is-error'); $('#decaSizeHelp', el).textContent = 'Pick a size to continue'; return; } resolve(chosen); D.sheet.close(); };
    el.addEventListener('sheet:close', function f() { el.removeEventListener('sheet:close', f); setTimeout(() => resolve(null), 0); });
    D.sheet.open(el);
  });

  // ---- Add to bag: <button data-action="add-to-bag" data-id="racket" [data-size] [data-colour] [data-qty-from="#sel"]> ----
  D.addToBag = async (btn, id, o = {}) => {
    const p = D.product(id); if (!p) return false;
    if (p.sizes.length > 1 && !o.size) { const s = await D.pickSize(p); if (!s) return false; o.size = s; }
    if (p.sizes.length === 1 && !o.size) o.size = p.sizes[0];
    if (btn) await D.loading(btn, 700);
    D.bag.add(id, o); D.haptic(15);
    if (btn && btn.classList.contains('add-btn')) { const t = btn.textContent; btn.classList.add('is-added'); btn.textContent = 'Added'; setTimeout(() => { btn.classList.remove('is-added'); btn.textContent = t; }, 1600); }
    if (!o.silent) D.toast(`${p.name} added to bag`, { icon: 'check', action: 'View bag', href: 'bag.html' });
    return true;
  };

  // ---- Generic actions: data-action="add-to-bag|pincode|voice|share|copy|reveal|buy-again|reset-demo|dec|inc" ----
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]'); if (!el || el.closest('[data-qty]') && /^(dec|inc)$/.test(el.dataset.action)) return;
    const a = el.dataset.action;
    if (a === 'add-to-bag') { e.preventDefault(); D.addToBag(el, el.dataset.id, { size: el.dataset.size, colour: el.dataset.colour }); }
    else if (a === 'pincode') { e.preventDefault(); D.pincodeSheet(); }
    else if (a === 'voice') { e.preventDefault(); D.voiceSheet(); }
    else if (a === 'share') { e.preventDefault(); const data = { title: el.dataset.title || document.title, url: location.href }; try { if (navigator.share && !body.classList.contains('capture')) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); D.toast('Link copied to clipboard'); } } catch (x) { D.toast('Link copied to clipboard'); } }
    else if (a === 'copy') { e.preventDefault(); try { await navigator.clipboard.writeText(el.dataset.copy || el.textContent.trim()); } catch (x) {} D.toast(el.dataset.copied || 'Copied'); }
    else if (a === 'reveal') { e.preventDefault(); const inp = document.getElementById(el.getAttribute('aria-controls')); if (inp) { const show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; el.setAttribute('aria-pressed', String(show)); el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); el.innerHTML = D.icon(show ? 'eye-off' : 'eye', 20); } }
    else if (a === 'buy-again') { e.preventDefault(); const o = D.orders.get(el.dataset.id); if (!o) return; await D.loading(el, 700); o.items.forEach((it) => D.bag.add(it.id, { size: it.size, colour: it.colour, qty: it.qty })); D.toast(`${D.orders.count(o)} ${D.orders.count(o) === 1 ? 'item' : 'items'} added to bag`, { icon: 'check', action: 'View bag', href: 'bag.html' }); }
    else if (a === 'reset-demo') { e.preventDefault(); D.reset(); D.toast('Demo data restored'); setTimeout(() => location.reload(), 600); }
  });

  // ---- Qty stepper: <div class="qty" data-qty data-min="1" data-max="10" [data-key="bagKey"]>
  //      <button data-action="dec" aria-label="Decrease">-</button><output>1</output><button data-action="inc" aria-label="Increase">+</button></div>
  //      Emits change (detail = value). With data-key it also updates Deca.bag.
  D.qtyHtml = (v = 1, key = '', min = 1, max = 10, cls = '') => `<div class="qty ${cls}" data-qty data-min="${min}" data-max="${max}"${key ? ` data-key="${D.esc(key)}"` : ''}><button type="button" data-action="dec" aria-label="Decrease quantity">${D.icon('minus', 10, { sw: 2.6 })}</button><output aria-live="polite">${v}</output><button type="button" data-action="inc" aria-label="Increase quantity">${D.icon('plus', 10, { sw: 2.6 })}</button></div>`;
  const qtyState = (q) => { const o = $('output', q); const v = +o.textContent; const min = +(q.dataset.min || 1), max = +(q.dataset.max || 10); const [d, i] = $$('button', q); if (d) d.disabled = v <= min && !q.hasAttribute('data-removable'); if (i) i.disabled = v >= max; };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty] [data-action="dec"], [data-qty] [data-action="inc"]'); if (!b) return;
    e.preventDefault(); const q = b.closest('[data-qty]'); const o = $('output', q);
    const min = +(q.dataset.min || 1), max = +(q.dataset.max || 10); let v = +o.textContent + (b.dataset.action === 'inc' ? 1 : -1);
    if (v < min && q.hasAttribute('data-removable')) { q.dispatchEvent(new CustomEvent('remove', { bubbles: true })); return; }
    v = Math.max(min, Math.min(max, v)); o.textContent = v; qtyState(q); D.haptic(6);
    if (q.dataset.key) D.bag.setQty(q.dataset.key, v);
    q.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: v }));
    if (v === max && b.dataset.action === 'inc') D.toast(`Maximum ${max} per order`);
  });
  const initQty = (root = document) => within(root, '[data-qty]').forEach(qtyState);

  // ---- Carousel: <div data-carousel [data-auto="4500"]> slides </div> + <div class="dots" data-dots-for="id"> ----
  const initCarousels = () => $$('[data-carousel]').forEach((c) => {
    const slides = [...c.children]; const dots = c.id && $(`[data-dots-for="${c.id}"]`);
    if (dots && !dots.children.length) dots.innerHTML = slides.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('');
    const idx = () => { const x = c.scrollLeft; let best = 0, d = Infinity; slides.forEach((s, i) => { const dd = Math.abs(s.offsetLeft - slides[0].offsetLeft - x); if (dd < d) { d = dd; best = i; } }); return best; };
    const mark = () => { const i = idx(); dots && $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i)); c.dispatchEvent(new CustomEvent('slide', { detail: i })); };
    let raf; c.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); }, { passive: true });
    c.goTo = (i) => { const s = slides[(i + slides.length) % slides.length]; c.scrollTo({ left: s.offsetLeft - slides[0].offsetLeft, behavior: reduced ? 'auto' : 'smooth' }); };
    const ms = +c.dataset.auto; if (ms && !reduced && !body.classList.contains('capture')) { let paused = false; ['pointerdown', 'touchstart', 'focusin'].forEach((ev) => c.addEventListener(ev, () => (paused = true), { passive: true })); setInterval(() => { if (!paused && !document.hidden) c.goTo(idx() + 1); }, ms); }
  });

  // ---- Pincode sheet (brand header "Delivery" row, PDP delivery check) ----
  D.pincodeSheet = (onSet) => {
    const el = D.makeSheet('decaPinSheet', 'Choose delivery location', 'Delivery dates and stock are shown for this pincode',
      `<div class="fg"><label class="label" for="decaPin">Pincode</label><div class="field field-affix"><input id="decaPin" inputmode="numeric" maxlength="6" data-mask="pin" data-validate="pin" autocomplete="postal-code" placeholder="e.g. 700135"><button class="affix-btn" type="button" id="decaPinUse">Check</button></div><span class="helper" id="decaPinHelp">Currently delivering to <b data-bind="delivery"></b></span></div>
      <button class="option tap" type="button" id="decaPinGps" style="margin-top:16px"><span class="icon-tile" style="width:36px;height:36px">${D.icon('locate', 18)}</span><span class="option__body"><span class="option__title">Use my current location</span><span class="option__sub">Needs location permission</span></span></button>
      <p class="label-caps" style="margin:20px 0 8px">Saved addresses</p><div class="options" id="decaPinAddr"></div>
      <div class="sheet__foot"><button class="btn btn--primary btn--lg tap" type="button" id="decaPinSave">Save pincode</button></div>`);
    const inp = $('#decaPin', el); inp.value = '';
    $('#decaPinAddr', el).innerHTML = D.addresses.list().map((a) => `<button class="option tap" type="button" data-pin="${a.pin}"><span class="icon-tile" style="width:36px;height:36px">${D.icon('pin', 18)}</span><span class="option__body"><span class="option__title">${D.esc(a.label)} · ${a.pin}</span><span class="option__sub ellipsis">${D.esc(a.text)}</span></span></button>`).join('');
    const commit = async (pin, btn, saved) => {
      if (!saved) { inp.value = pin; if (!D.validate(inp.closest('.fg'))) return; }
      await D.loading(btn || $('#decaPinSave', el), 600);
      const v = D.location.set(pin); D.sheet.close(); D.toast(`Delivering to ${v.area} · by ${D.location.eta(v.pin)}`, { icon: 'truck' }); onSet && onSet(v);
    };
    $('#decaPinSave', el).onclick = () => commit(inp.value.trim());
    $('#decaPinUse', el).onclick = () => { const a = D.location.lookup(inp.value); const h = $('#decaPinHelp', el); if (!D.validate(inp.closest('.fg'))) return; h.innerHTML = `${D.esc(a)} · delivery by <b>${D.location.eta(inp.value)}</b>`; };
    $('#decaPinGps', el).onclick = async (e) => { const b = e.currentTarget; b.querySelector('.option__sub').textContent = 'Finding you…'; await D.wait(900); b.querySelector('.option__sub').textContent = 'Found: New Town, Kolkata 700135'; commit('700135'); };
    $$('[data-pin]', el).forEach((b) => (b.onclick = () => commit(b.dataset.pin, $('#decaPinSave', el), true)));
    inp.onkeydown = (e) => { if (e.key === 'Enter') commit(inp.value.trim()); };
    D.bindLocation(); D.sheet.open(el);
  };

  // ---- Voice search sheet (mic in search pills) ----
  D.voiceSheet = () => {
    const el = D.makeSheet('decaVoiceSheet', 'Search by voice', '', `<div class="voice" style="text-align:center;padding:10px 0 4px">
        <button class="voice__mic tap" type="button" id="decaVoiceMic" aria-label="Start listening"><span class="voice__ring"></span>${D.icon('mic', 30, { sw: 1.8 })}</button>
        <p id="decaVoiceStatus" role="status" aria-live="polite" style="font-size:16px;font-weight:500;margin-top:18px;min-height:24px">Listening…</p>
        <p id="decaVoiceHint" style="font-size:13px;color:var(--muted-2);margin-top:4px">Try “running shoes under 3000”</p></div>
      <p class="label-caps" style="margin:18px 0 10px">Popular right now</p><div class="chip-row" id="decaVoiceChips" style="gap:8px"></div>`);
    if (!$('#decaVoiceStyle')) { const st = document.createElement('style'); st.id = 'decaVoiceStyle'; st.textContent = '.voice__mic{position:relative;width:84px;height:84px;border-radius:50%;background:var(--brand);color:#fff;display:inline-grid;place-items:center;box-shadow:0 8px 24px rgba(15,150,219,.35)}.voice__ring{position:absolute;inset:-10px;border-radius:50%;border:2px solid var(--brand);opacity:0}.voice.is-live .voice__ring{animation:vring 1.4s var(--ease-out) infinite}@keyframes vring{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.35);opacity:0}}.voice.is-done .voice__mic{background:var(--navy)}'; document.head.appendChild(st); }
    $('#decaVoiceChips', el).innerHTML = D.trending.slice(0, 5).map((t) => `<a class="chip tap" href="search-results.html?q=${encodeURIComponent(t)}">${t}</a>`).join('');
    const v = $('.voice', el), st = $('#decaVoiceStatus', el), hint = $('#decaVoiceHint', el);
    let timer = null;
    const listen = () => {
      clearTimeout(timer); v.classList.add('is-live'); v.classList.remove('is-done'); st.textContent = 'Listening…'; hint.textContent = 'Try “running shoes under 3000”';
      timer = setTimeout(() => { v.classList.remove('is-live'); v.classList.add('is-done'); st.textContent = '“Running shoes”'; hint.innerHTML = 'Searching…'; timer = setTimeout(() => { if (D.sheet.current() === el) { D.searches.add('Running shoes'); location.href = 'search-results.html?q=Running%20shoes'; } }, 900); }, body.classList.contains('capture') ? 999999 : 2200);
    };
    $('#decaVoiceMic', el).onclick = listen;
    el.addEventListener('sheet:close', () => { clearTimeout(timer); v.classList.remove('is-live'); });
    D.sheet.open(el); listen();
  };

  // ---- Broken images: keep the tinted container visible instead of an alt-text glyph ----
  document.addEventListener('error', (e) => { const t = e.target; if (t && t.tagName === 'IMG') t.classList.add('is-broken'); }, true);

  // ---- Hydrate dynamic content: call after injecting HTML ----
  D.hydrate = (root = document) => { D.hydrateIcons(root); D.syncHearts(root); initQty(root); initGroups(root); initOptions(root); initRadios(root); initSegmented(root); D.initSheets(root); D.badges(); D.bindLocation(); $$('img', root).forEach((i) => { if (i.complete && i.naturalWidth === 0 && i.getAttribute('src')) i.classList.add('is-broken'); }); };

  /* ----------------------------------------------------------------- 8 boot */
  D.hydrate(document);
  initFilters(); initOtp(); initKeypads(); initCountdowns(); initRanges(); initDual(); initCarousels();
  // Deep-link a sheet: ?sheet=id (gallery captures)
  if (D.q('sheet')) setTimeout(() => { const id = D.q('sheet'); if (id === 'pincode') D.pincodeSheet(); else if (id === 'voice') D.voiceSheet(); else D.sheet.open(id); }, body.classList.contains('capture') ? 0 : 350);
})();
