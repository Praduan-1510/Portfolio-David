/* ==========================================================================
   Voyager prototype — shared interactions + travel data layer
   Exposes window.Voyager (alias window.V). Load at the end of <body>:
     <script src="../assets/js/app.js"></script>
   then page logic in an inline <script> after it.
   ========================================================================== */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const within = (sel, root = document) => (root !== document && root.matches && root.matches(sel) ? [root] : []).concat($$(sel, root)); // root included
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const V = (window.Voyager = window.V = window.Voyager || {});
  const SCREEN = (location.pathname.match(/([\w-]+)\.html$/) || [])[1] || 'index';
  V.screen = SCREEN;
  V.$ = $; V.$$ = $$;

  if (params.has('capture')) document.body.classList.add('capture');
  const capture = document.body.classList.contains('capture');
  if (window.self !== window.top) {
    document.body.classList.add('embedded');
    try { window.parent.postMessage({ voyagerScreen: SCREEN }, '*'); } catch (e) {}
  }

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */
  V.q = (k) => new URLSearchParams(location.search).get(k);
  V.wait = (ms) => new Promise((r) => setTimeout(r, reduced || capture ? Math.min(ms, 120) : ms));
  V.go = (href) => { location.href = /\.html|^https?:|^#/.test(href) ? href : href.replace(/^([\w-]+)/, '$1.html'); };
  V.haptic = () => { try { navigator.vibrate && navigator.vibrate(10); } catch (e) {} };
  V.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  V.img = (slug) => `../assets/img/${slug}.jpg`;

  // Safe localStorage (private mode / blocked storage never throws)
  const PFX = 'voyager:';
  V.store = {
    get(k, d) { try { const v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} return v; },
    remove(k) { try { localStorage.removeItem(PFX + k); } catch (e) {} },
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith(PFX)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} },
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Session: one flag, `voyager:signedIn`. signIn() also marks onboarding done; signOut() keeps the account data.
  V.auth = {
    isSignedIn() { return !!V.store.get('signedIn', false); },
    signIn() { V.store.set('signedIn', true); V.store.set('onboarded', true); },
    signOut() { V.store.remove('signedIn'); },
  };

  // Number / money formatting
  V.fmt = (n, opt = {}) => {
    const v = Number(n) || 0; const neg = v < 0;
    const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: opt.cents ? 2 : 0, maximumFractionDigits: opt.cents ? 2 : 0 });
    return (neg ? '−' : '') + '$' + s;
  };
  V.fmtNum = (n) => (Number(n) || 0).toLocaleString('en-US');
  V.fmtFrom = (n) => 'From $ ' + n;                 // card style: "From $ 1240"
  V.fmtPts = (n) => V.fmtNum(n) + ' Pts';

  // Dates — ISO strings "YYYY-MM-DD" everywhere; parsed at local noon (no TZ drift)
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const pad = (n) => String(n).padStart(2, '0');
  V.date = {
    MON, MONTH, DOW,
    parse(iso) { if (iso instanceof Date) return iso; const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); },
    iso(d) { d = V.date.parse(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
    add(iso, n) { const d = V.date.parse(iso); d.setDate(d.getDate() + n); return V.date.iso(d); },
    nights(a, b) { return Math.round((V.date.parse(b) - V.date.parse(a)) / 864e5); },
    // styles: 'long' Aug 12, 2026 · 'md' Aug 12 · 'dm' 12 Aug · 'dmy' 12 Aug 2026 · 'dow' Wed · 'full' Wednesday, Aug 12
    fmt(iso, style = 'long') {
      const d = V.date.parse(iso), m = MON[d.getMonth()], day = d.getDate(), y = d.getFullYear();
      return { long: `${m} ${day}, ${y}`, md: `${m} ${day}`, dm: `${day} ${m}`, dmy: `${day} ${m} ${y}`, dow: DOW[d.getDay()], full: `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]}, ${m} ${day}`, my: `${MONTH[d.getMonth()]} ${y}` }[style];
    },
    // Prototype "today" as a Date (local noon) — use instead of new Date() for any date comparison
    now() { return V.date.parse(V.today); },
    range(a, b) { // "Aug 12–19" · "Aug 28 – Sep 3"
      const x = V.date.parse(a), y = V.date.parse(b);
      return x.getMonth() === y.getMonth() ? `${MON[x.getMonth()]} ${x.getDate()}–${y.getDate()}` : `${MON[x.getMonth()]} ${x.getDate()} – ${MON[y.getMonth()]} ${y.getDate()}`;
    },
  };

  // Prototype "today": every date comparison (calendar min, trip status, expiry checks) uses V.today, never the device
  // clock, so the demo reads the same whenever it is opened. Override with ?today=YYYY-MM-DD (persists) or V.setToday().
  const TODAY_DEFAULT = '2026-07-28';
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRe.test(params.get('today') || '')) V.store.set('today', params.get('today'));
  V.today = (() => { const t = V.store.get('today', null); return isoRe.test(t || '') ? t : TODAY_DEFAULT; })();
  V.setToday = (iso) => { if (iso && isoRe.test(iso)) { V.store.set('today', iso); V.today = iso; } else { V.store.remove('today'); V.today = TODAY_DEFAULT; } return V.today; };

  /* ------------------------------------------------------------------------
     Icons — Phosphor-style (regular) strokes on a 24 grid. Voyager.icon(name, size, extraAttrs)
     Declarative: <span data-icon="plane" data-size="20"></span> is hydrated on load.
     ------------------------------------------------------------------------ */
  const I = {
    'arrow-left': '<path d="M20 12H4.5M10.5 5.5 4 12l6.5 6.5"/>',
    'arrow-right': '<path d="M4 12h15.5M13.5 5.5 20 12l-6.5 6.5"/>',
    'chevron-right': '<path d="m9 4.5 7.5 7.5L9 19.5"/>',
    'chevron-left': '<path d="M15 4.5 7.5 12l7.5 7.5"/>',
    'chevron-down': '<path d="m4.5 9 7.5 7.5L19.5 9"/>',
    'chevron-up': '<path d="m4.5 15 7.5-7.5 7.5 7.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 4.5v15M4.5 12h15"/>',
    minus: '<path d="M4.5 12h15"/>',
    check: '<path d="m4.5 12.5 5 5L19.5 7"/>',
    heart: '<path d="M12 20.3s-8.3-4.6-8.3-10.4A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8.3 2.7c0 5.8-8.3 10.4-8.3 10.4Z"/>',
    'heart-fill': '<path fill="currentColor" stroke="none" d="M12 21.2c-.2 0-.3 0-.5-.1C11.1 20.9 2.5 16.1 2.5 9.9a5.3 5.3 0 0 1 9.5-3.3 5.3 5.3 0 0 1 9.5 3.3c0 6.2-8.6 11-9 11.2-.2.1-.3.1-.5.1Z"/>',
    plane: '<path d="M21 12c0-.9-.7-1.6-1.6-1.6h-4.6L9.9 3H7.8l2.6 7.4H6.1L4.4 8.5H3l1 3.5-1 3.5h1.4l1.7-1.9h4.3L7.8 21h2.1l4.9-7.4h4.6c.9 0 1.6-.7 1.6-1.6Z"/>',
    building: '<path d="M3 21h18M5 21V4.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5V21M14 9h4.5a.5.5 0 0 1 .5.5V21M8 7.5h3M8 11h3M8 14.5h3M8 21v-3h3v3"/>',
    car: '<path d="M2.5 12.5h19M5.5 12.5l2-4.6a1.6 1.6 0 0 1 1.5-.9h6a1.6 1.6 0 0 1 1.5.9l2 4.6M3.5 12.5h17a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-3.5a1 1 0 0 1 1-1ZM4.5 18v1.5M19.5 18v1.5"/><circle cx="7" cy="15.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="17" cy="15.2" r="1.1" fill="currentColor" stroke="none"/>',
    shield: '<path d="M4.5 5.5v5.3c0 5.9 5.3 8.6 7.2 9.3.2.1.4.1.6 0 1.9-.7 7.2-3.4 7.2-9.3V5.5a.5.5 0 0 0-.5-.5h-14a.5.5 0 0 0-.5.5Z"/>',
    'shield-check': '<path d="M4.5 5.5v5.3c0 5.9 5.3 8.6 7.2 9.3.2.1.4.1.6 0 1.9-.7 7.2-3.4 7.2-9.3V5.5a.5.5 0 0 0-.5-.5h-14a.5.5 0 0 0-.5.5Z"/><path d="m8.5 12 2.5 2.5 4.5-4.5"/>',
    book: '<path d="M12 7.5c0-1.7 1.3-3 3-3h6v14h-6c-1.7 0-3 1.3-3 3M3 18.5h6c1.7 0 3 1.3 3 3V7.5c0-1.7-1.3-3-3-3H3v14Z"/>',
    calendar: '<rect x="3.75" y="4.5" width="16.5" height="16" rx=".8"/><path d="M16.5 3v3M7.5 3v3M3.75 9h16.5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="1"/><path d="M2.5 9.5h19M15.5 15.5h3M11 15.5h1.5"/>',
    tag: '<path d="M3.7 13.2a1 1 0 0 1-.2-.6V4a.5.5 0 0 1 .5-.5h8.6c.2 0 .4.1.6.2l8.3 8.3a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0l-8.8-7.8Z"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/>',
    gear: '<circle cx="12" cy="12" r="3.5"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    bell: '<path d="M5.3 10.4a6.7 6.7 0 0 1 13.4 0c0 3.7.8 5.9 1.5 7.1a.7.7 0 0 1-.6 1H4.4a.7.7 0 0 1-.6-1c.7-1.2 1.5-3.4 1.5-7.1Z"/><path d="M9 18.5a3 3 0 0 0 6 0"/>',
    'bell-fill': '<path fill="currentColor" stroke="none" d="M20.8 17.1c-.6-1-1.4-3.3-1.4-6.9a7.4 7.4 0 0 0-14.8 0c0 3.6-.8 5.9-1.4 6.9a1.4 1.4 0 0 0 1.2 2.1h3.8a3.8 3.8 0 0 0 7.6 0h3.8a1.4 1.4 0 0 0 1.2-2.1Z"/>',
    exit: '<path d="M13.5 3.5H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-5.5M9 7.5 4.5 12 9 16.5M4.5 12h11"/>',
    'sign-out': '<path d="M10 3.5H5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h5M15.5 7.5 20 12l-4.5 4.5M20 12H9.5"/>',
    star: '<path d="m12 3.2 2.6 5.5 5.9.8-4.3 4.2 1 5.9L12 16.8l-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.2Z"/>',
    'star-fill': '<path fill="currentColor" stroke="none" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z"/>',
    search: '<circle cx="10.75" cy="10.75" r="7.25"/><path d="m16 16 5 5"/>',
    'map-pin': '<path d="M12 21.5s7.3-5.8 7.3-11.7a7.3 7.3 0 0 0-14.6 0c0 5.9 7.3 11.7 7.3 11.7Z"/><circle cx="12" cy="9.8" r="2.8"/>',
    'map-pin-fill': '<path fill="currentColor" stroke="none" d="M12 1.8a8 8 0 0 0-8 8c0 6.4 7.1 12.1 7.4 12.3.4.3.9.3 1.2 0 .3-.2 7.4-5.9 7.4-12.3a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>',
    map: '<path d="M9 17.5 3.5 20V6.5L9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5ZM9 4v13.5M15 6.5V20"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="1.2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18M11 12.5h2v1.5h-2z"/>',
    user: '<circle cx="12" cy="8.5" r="4.5"/><path d="M3.5 20.5c1.7-3 4.8-4.8 8.5-4.8s6.8 1.8 8.5 4.8"/>',
    'user-fill': '<circle cx="12" cy="8" r="5" fill="currentColor" stroke="none"/><path fill="currentColor" stroke="none" d="M2.6 20.3C4.5 16.9 8 15 12 15s7.5 1.9 9.4 5.3a.8.8 0 0 1-.7 1.2H3.3a.8.8 0 0 1-.7-1.2Z"/>',
    house: '<path d="M4 10.4 11.6 3.6a.6.6 0 0 1 .8 0L20 10.4V20a.5.5 0 0 1-.5.5H15v-5.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v5.5H4.5A.5.5 0 0 1 4 20v-9.6Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.3 2.4 3.6 5.6 3.6 9s-1.3 6.6-3.6 9c-2.3-2.4-3.6-5.6-3.6-9S9.7 5.4 12 3Z"/>',
    key: '<circle cx="15" cy="9" r="5.5"/><path d="M11.1 12.9 3.5 20.5M6.5 17.5 9 20M9 15l2 2"/><circle cx="16.3" cy="7.7" r="1.1" fill="currentColor" stroke="none"/>',
    lock: '<rect x="4" y="9" width="16" height="12" rx="1"/><path d="M8 9V6.5a4 4 0 0 1 8 0V9"/><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>',
    trash: '<path d="M20 5.5H4M9.5 10v6.5M14.5 10v6.5M18.5 5.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V5.5M15.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5h-4A1.5 1.5 0 0 0 8.5 4v1.5"/>',
    moon: '<path d="M20.2 14.3A8.3 8.3 0 0 1 9.7 3.8a8.3 8.3 0 1 0 10.5 10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    envelope: '<rect x="3" y="5" width="18" height="14" rx=".8"/><path d="m3 5.5 9 7.5 9-7.5"/>',
    file: '<path d="M18.5 21h-13a.5.5 0 0 1-.5-.5v-17a.5.5 0 0 1 .5-.5H14l5 5v12.5a.5.5 0 0 1-.5.5Z"/><path d="M14 3v5h5M8.5 13h7M8.5 16.5h7"/>',
    headset: '<path d="M20.5 13h-3a1.5 1.5 0 0 0-1.5 1.5v3.5a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5V13Zm0 0v-1a8.5 8.5 0 0 0-17 0v1m0 0v5a1.5 1.5 0 0 0 1.5 1.5H6.5A1.5 1.5 0 0 0 8 18v-3.5A1.5 1.5 0 0 0 6.5 13h-3Z"/><path d="M20.5 18v1a2.5 2.5 0 0 1-2.5 2.5h-5"/>',
    paperclip: '<path d="m15.5 7.5-7.8 7.9a1.9 1.9 0 0 0 2.7 2.7l9-9.1a3.8 3.8 0 0 0-5.3-5.3l-9 9.1a5.7 5.7 0 0 0 8 8l7.4-7.4"/>',
    send: '<path d="M20.5 12 3.8 3.6a.5.5 0 0 0-.7.6L6 12l-2.9 7.8a.5.5 0 0 0 .7.6L20.5 12ZM6 12h7"/>',
    crown: '<path d="M4.5 18.5h15M3.5 7.5l4 5 4.5-7 4.5 7 4-5-1.6 9.2a.6.6 0 0 1-.6.5H5.7a.6.6 0 0 1-.6-.5L3.5 7.5Z"/>',
    'crown-fill': '<path fill="currentColor" stroke="none" d="M22.4 6.6a1 1 0 0 0-1.1.3l-3.9 4.2-4.5-7.2a1 1 0 0 0-1.8 0l-4.5 7.2-3.9-4.2a1 1 0 0 0-1.7.8l1.9 10.6c.1.5.5.8 1 .8h15.8c.5 0 .9-.3 1-.8l1.9-10.6a1 1 0 0 0-.2-1.1Z"/>',
    cutlery: '<path d="M7.5 3v18M4.5 3v4.8a3 3 0 0 0 6 0V3M19 15h-4.5s0-8.5 4.5-12v18"/>',
    'id-card': '<rect x="2.5" y="4.5" width="19" height="15" rx="1"/><circle cx="8.5" cy="11" r="2.3"/><path d="M5 16.5c.6-1.4 2-2.3 3.5-2.3s2.9.9 3.5 2.3M14.5 9.5H19M14.5 13H19"/>',
    passport: '<rect x="4.5" y="2.5" width="15" height="19" rx="1"/><circle cx="12" cy="10" r="3.5"/><path d="M8.5 10h7M12 6.5c1 .9 1.5 2.1 1.5 3.5s-.5 2.6-1.5 3.5c-1-.9-1.5-2.1-1.5-3.5s.5-2.6 1.5-3.5ZM9 17.5h6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.25"/>',
    'eye-slash': '<path d="M4.5 3.5l15 17M9.9 9.8a3.3 3.3 0 0 0 4.3 4.6M7 6.6C3.9 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.8 0 3.3-.5 4.6-1.2M19.4 16c1.4-1.6 2.1-4 2.1-4S18 5.5 12 5.5c-.5 0-1 0-1.5.1"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M14.8 9c-.4-.9-1.5-1.5-2.8-1.5-1.6 0-2.8.8-2.8 2 0 2.9 5.8 1.4 5.8 4.3 0 1.2-1.3 2.1-3 2.1-1.4 0-2.6-.6-3-1.6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M11.5 11.5H12v5h.5"/><circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none"/>',
    warning: '<path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor" stroke="none"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 10.5H5.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H16"/>',
    download: '<path d="M12 3.5v12M7 10.5l5 5 5-5M4.5 20h15"/>',
    phone: '<path d="M8.4 12.3a9.3 9.3 0 0 0 3.3 3.3l2.2-1.5a.8.8 0 0 1 .7-.1l4.1 1.8c.3.1.5.4.4.7a4.3 4.3 0 0 1-4.2 3.8A12.4 12.4 0 0 1 2.7 7.8 4.3 4.3 0 0 1 6.5 3.6c.3 0 .6.1.7.4l1.8 4.1c.1.2.1.5-.1.7l-1.5 2.3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5h5"/>',
    camera: '<path d="M19.5 19.5h-15a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3l1.5-2.5h6L16.5 7h3a1 1 0 0 1 1 1v10.5a1 1 0 0 1-1 1Z"/><circle cx="12" cy="12.8" r="3.5"/>',
    image: '<rect x="3" y="4.5" width="18" height="15" rx="1"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="9" r="1.3" fill="currentColor" stroke="none"/>',
    copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="1"/><path d="M16 8V4a.5.5 0 0 0-.5-.5h-12A.5.5 0 0 0 3 4v12a.5.5 0 0 0 .5.5H8"/>',
    ticket: '<path d="M3 8.5V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a3.5 3.5 0 0 0 0 7V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a3.5 3.5 0 0 0 0-7Z"/><path d="M15 5v14" stroke-dasharray="2 2"/>',
    bed: '<path d="M2.5 19V5M2.5 15.5h19V19M21.5 15.5v-4a3 3 0 0 0-3-3h-8v7"/><circle cx="6.5" cy="11.5" r="1.8"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none"/>',
    chat: '<path d="M7.5 18.5 3.5 21V5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v12.5a1 1 0 0 1-1 1h-12Z"/><path d="M8 9.5h8M8 13h5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    fingerprint: '<path d="M8 20.5A9.9 9.9 0 0 1 6.5 15v-3a5.5 5.5 0 0 1 11 0v1M12 12v3a13.5 13.5 0 0 0 2.2 7.4M9 12a3 3 0 0 1 6 0v3a14 14 0 0 0 .6 4M4.5 17.5A13 13 0 0 1 3.5 12a8.5 8.5 0 0 1 15-5.5M20.5 11.5v3.5"/>',
    translate: '<path d="M3.5 6h10M8.5 4v2M11 6c-.8 4.3-3.6 7.6-7 9M6 9.5c.9 2.3 2.8 4.3 5 5.5M13 20l4-9 4 9M14.3 17.5h5.4"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>',
    sparkle: '<path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2L12 3.5Z"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx=".5"/><path d="M5 12v8a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-8M12 8v12.5M12 8c-1-3.5-5-4.5-5.5-2.5S10 8 12 8Zm0 0c1-3.5 5-4.5 5.5-2.5S14 8 12 8Z"/>',
    upload: '<path d="M12 15.5v-12M7 8.5l5-5 5 5M4.5 20h15"/>',
    refresh: '<path d="M16.5 9.5h4.5V5M21 9.5l-3.2-3.2a8.5 8.5 0 1 0 0 12"/>',
    filter: '<path d="M3.5 5h17l-6.5 7.5V19l-4 1.5v-8L3.5 5Z"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    edit: '<path d="M9 20.5H4.5a.5.5 0 0 1-.5-.5v-4.3l11.3-11.3a.8.8 0 0 1 1.1 0l3.7 3.7a.8.8 0 0 1 0 1.1L9 20.5ZM12.5 6.5l5 5"/>',
    logo: '',
  };
  V.icons = I;
  V.icon = (name, size = 24, attrs = '') => {
    const body = I[name]; if (body == null) return '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs}>${body}</svg>`;
  };
  // Brand monogram (V + A + circle). Color via currentColor.
  V.logo = (size = 172, sw = 1.4) => `<svg width="${size}" height="${size}" viewBox="0 0 172 172" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="86" cy="67.5" r="33.5"/><path d="M32 40 86 139 138 40M33 138 86 35 139 138M59 89h53M86 34v105M67 41l19 46 19-46M86 67.5h32"/></svg>`;
  const hydrateIcons = (root = document) => {
    within('[data-icon]', root).forEach((el) => { if (el.firstElementChild) return; el.innerHTML = V.icon(el.dataset.icon, +el.dataset.size || 24, el.dataset.sw ? `stroke-width="${el.dataset.sw}"` : ''); });
    within('[data-logo]', root).forEach((el) => { if (!el.firstElementChild) el.innerHTML = V.logo(+el.dataset.size || 172); });
  };
  V.hydrateIcons = hydrateIcons;

  /* ------------------------------------------------------------------------
     DATA LAYER — seeds + persistence (all through V.store)
     ------------------------------------------------------------------------ */
  V.destinations = [
    { id: 'paris', name: 'Paris', country: 'France', code: 'PAR', days: 7, from: 1240, rating: 4.9, reviews: 2418, booked: '2.4k', region: 'Europe', styles: ['Cultural', 'Food & Wine', 'Luxury'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 4, img: 'dest-paris', hero: 'hero-paris', package: { name: 'Paris City Break', pp: 1240 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Experience The Magic Of The City Of Light — From The Iconic Eiffel Tower To Hidden Montmartre Streets, World-Class Cuisine, And Legendary Art Museums.' },
    { id: 'bali', name: 'Bali', country: 'Indonesia', code: 'DPS', days: 10, from: 800, rating: 4.8, reviews: 1932, booked: '1.9k', region: 'Asia', styles: ['Beach', 'Adventure', 'Family'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 5, img: 'dest-bali', hero: 'dest-bali', package: { name: 'Bali Island Retreat', pp: 800 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Turquoise Coves, Cliff-Top Temples And Rice Terraces — Ten Unhurried Days Across Nusa Penida, Ubud And The Southern Beaches.' },
    { id: 'rome', name: 'Rome', country: 'Italy', code: 'ROM', days: 5, from: 1100, rating: 4.7, reviews: 1604, booked: '1.6k', region: 'Europe', styles: ['Cultural', 'Food & Wine'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 4, img: 'dest-rome', hero: 'dest-rome', package: { name: 'Roman Holiday', pp: 1100 }, inclusions: { flights: true, hotel: true, transfers: false }, blurb: 'Toss A Coin In The Trevi Fountain, Walk The Colosseum At Golden Hour And Eat Your Way Through Trastevere.' },
    { id: 'prague', name: 'Prague', country: 'Czech Rep', code: 'PRG', days: 5, from: 800, rating: 4.8, reviews: 1215, booked: '1.2k', region: 'Europe', styles: ['Cultural', 'Food & Wine'], cats: ['Flights', 'Hotels', 'Tours'], hotelStars: 4, img: 'dest-prague', hero: 'trip-prague-night', package: { name: 'Prague Old Town Escape', pp: 800 }, inclusions: { flights: true, hotel: true, transfers: false }, blurb: 'Gothic Spires, Charles Bridge At Dawn And Candle-Lit Cellar Bars — A Fairytale Capital Best Explored On Foot.' },
    { id: 'sydney', name: 'Sydney', country: 'Australia', code: 'SYD', days: 8, from: 1500, rating: 4.8, reviews: 1377, booked: '1.4k', region: 'Oceania', styles: ['Beach', 'Adventure', 'Family'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 5, img: 'dest-sydney', hero: 'trip-sydney-opera', package: { name: 'Sydney Harbour Explorer', pp: 1500 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Harbour Ferries, The Opera House, Bondi To Coogee Coastal Walks And Weekend Escapes To The Blue Mountains.' },
    { id: 'minsk', name: 'Minsk', country: 'Belarus', code: 'MSQ', days: 10, from: 2000, rating: 4.5, reviews: 402, booked: '400+', region: 'Europe', styles: ['Cultural'], cats: ['Flights', 'Hotels'], hotelStars: 4, img: 'dest-minsk', hero: 'dest-minsk', package: { name: 'Minsk & Beyond', pp: 2000 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Grand Soviet Boulevards, Neoclassical Theatres And Day Trips To Mir And Nesvizh Castles.' },
    { id: 'jaipur', name: 'Jaipur', country: 'India', code: 'JAI', days: 8, from: 1500, rating: 4.7, reviews: 988, booked: '980+', region: 'Asia', styles: ['Cultural', 'Luxury'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 5, img: 'dest-jaipur', hero: 'dest-jaipur', package: { name: 'Pink City Palaces', pp: 1500 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'The Hawa Mahal At Sunrise, Amber Fort By Jeep And Evenings In Restored Haveli Palaces.' },
    { id: 'toronto', name: 'Toronto', country: 'Canada', code: 'YYZ', days: 10, from: 2000, rating: 4.6, reviews: 764, booked: '760+', region: 'North America', styles: ['Family', 'Food & Wine'], cats: ['Flights', 'Hotels', 'Package'], hotelStars: 4, img: 'dest-toronto', hero: 'dest-toronto', package: { name: 'Toronto & Niagara', pp: 2000 }, inclusions: { flights: true, hotel: true, transfers: false }, blurb: 'CN Tower Views, Kensington Market Food Crawls And A Day Beneath The Thunder Of Niagara Falls.' },
    { id: 'santorini', name: 'Santorini', country: 'Greece', code: 'JTR', days: 6, from: 1650, rating: 4.9, reviews: 2105, booked: '2.1k', region: 'Europe', styles: ['Beach', 'Luxury'], cats: ['Flights', 'Hotels', 'Package'], hotelStars: 5, img: 'dest-santorini', hero: 'dest-santorini', package: { name: 'Santorini Sunsets', pp: 1650 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Whitewashed Oia, Caldera Sailing And Volcanic-Sand Beaches — Sunsets You Will Talk About For Years.' },
    { id: 'kyoto', name: 'Kyoto', country: 'Japan', code: 'KIX', days: 7, from: 1900, rating: 4.9, reviews: 1780, booked: '1.8k', region: 'Asia', styles: ['Cultural', 'Food & Wine'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 4, img: 'dest-kyoto', hero: 'dest-kyoto', package: { name: 'Kyoto Temples & Tea', pp: 1900 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Vermilion Torii At Fushimi Inari, Tea Ceremonies In Gion And Quiet Mornings In The Arashiyama Bamboo Grove.' },
    { id: 'dubai', name: 'Dubai', country: 'UAE', code: 'DXB', days: 5, from: 1350, rating: 4.7, reviews: 1450, booked: '1.5k', region: 'Middle East', styles: ['Luxury', 'Family', 'Adventure'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 5, img: 'dest-dubai', hero: 'dest-dubai', package: { name: 'Dubai Skyline Stay', pp: 1350 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Sunrise Above The Burj Khalifa, Desert Dunes By 4×4 And Souks Glittering With Gold And Spice.' },
    { id: 'swiss-alps', name: 'Swiss Alps', country: 'Switzerland', code: 'ZRH', days: 8, from: 2400, rating: 4.9, reviews: 1120, booked: '1.1k', region: 'Europe', styles: ['Adventure', 'Luxury'], cats: ['Flights', 'Hotels', 'Tours', 'Package'], hotelStars: 5, img: 'dest-swiss-alps', hero: 'dest-swiss-alps', package: { name: 'Alpine Rail & Peaks', pp: 2400 }, inclusions: { flights: true, hotel: true, transfers: true }, blurb: 'Glacier Express Panoramas, Chalet Villages And Cable Cars To The Matterhorn’s Doorstep.' },
  ];
  V.dest = (id) => V.destinations.find((d) => d.id === id) || null;

  // ---- Getting there: one source for flights, hotel, airport and time difference per destination -------
  // out/back = outbound and return flight numbers from London Heathrow; mins = gate-to-gate journey time
  // (including the connection where there is no non-stop); utc = destination UTC offset in minutes,
  // [standard, summer] where it observes daylight saving (south = southern-hemisphere summer).
  const TRAVEL = {
    paris: { out: 'BA303', back: 'BA318', airport: ['CDG', 'Paris Charles de Gaulle'], mins: 80, utc: [60, 120], hotel: 'Hôtel Le Marais' },
    prague: { out: 'BA856', back: 'BA857', airport: ['PRG', 'Prague Václav Havel'], mins: 115, utc: [60, 120], hotel: 'Hotel Josef' },
    rome: { out: 'BA548', back: 'BA549', airport: ['FCO', 'Rome Fiumicino'], mins: 155, utc: [60, 120], hotel: 'Hotel Artemide' },
    'swiss-alps': { out: 'LX317', back: 'LX316', airport: ['ZRH', 'Zurich Airport'], mins: 100, utc: [60, 120], hotel: 'The Omnia, Zermatt' },
    santorini: { out: 'A3601', back: 'A3600', airport: ['JTR', 'Santorini (Thira)'], mins: 330, utc: [120, 180], hotel: 'Canaves Oia Suites' },
    minsk: { out: 'LO282', back: 'LO281', airport: ['MSQ', 'Minsk National'], mins: 330, utc: [180], hotel: 'Hotel Minsk' },
    dubai: { out: 'EK2', back: 'EK1', airport: ['DXB', 'Dubai International'], mins: 415, utc: [240], hotel: 'Jumeirah Al Naseem' },
    jaipur: { out: 'BA143', back: 'BA142', airport: ['JAI', 'Jaipur International'], mins: 660, utc: [330], hotel: 'Rambagh Palace' },
    toronto: { out: 'AC857', back: 'AC856', airport: ['YYZ', 'Toronto Pearson'], mins: 500, utc: [-300, -240], hotel: 'Fairmont Royal York' },
    kyoto: { out: 'JL44', back: 'JL43', airport: ['KIX', 'Osaka Kansai'], mins: 835, utc: [540], hotel: 'Hotel The Celestine Gion' },
    bali: { out: 'SQ317', back: 'SQ318', airport: ['DPS', 'Bali Denpasar'], mins: 1010, utc: [480], hotel: 'Alila Uluwatu' },
    sydney: { out: 'QF1', back: 'QF2', airport: ['SYD', 'Sydney Airport'], mins: 1335, utc: [600, 660], south: true, hotel: 'Park Hyatt Sydney' },
  };
  V.AIRLINES = { BA: 'British Airways', QF: 'Qantas', JL: 'Japan Airlines', SQ: 'Singapore Airlines', LX: 'Swiss', A3: 'Aegean Airlines', LO: 'LOT Polish Airlines', EK: 'Emirates', AC: 'Air Canada' };
  V.travel = (id) => {
    const t = TRAVEL[id] || TRAVEL.paris;
    // Hours ahead of London on a given date (UK and EU summer time: Apr–Oct; southern summer: Oct–Mar).
    const tz = (iso) => { const m = V.date.parse(iso || V.today).getMonth() + 1; const north = m >= 4 && m <= 10; const dest = t.utc.length < 2 ? t.utc[0] : t.utc[(t.south ? !north : north) ? 1 : 0]; return dest - (north ? 60 : 0); };
    return Object.assign({}, t, { airline: (no) => V.AIRLINES[String(no || t.out).slice(0, 2)] || 'Voyager', tz });
  };

  // ---- Saved / wishlist ----------------------------------------------------
  // Seed matches the designs' filled hearts (Paris, Prague, Sydney, Jaipur) + 4 off-screen extras → 8 saved (Profile "8 Saved").
  const SAVED_SEED = ['paris', 'prague', 'sydney', 'jaipur', 'santorini', 'kyoto', 'dubai', 'swiss-alps'];
  V.saved = {
    ids() { return V.store.get('saved', SAVED_SEED.slice()); },
    has(id) { return V.saved.ids().includes(id); },
    list() { return V.saved.ids().map(V.dest).filter(Boolean); },
    count() { return V.saved.ids().length; },
    toggle(id, force) {
      let ids = V.saved.ids(); const on = force == null ? !ids.includes(id) : !!force;
      ids = ids.filter((x) => x !== id); if (on) ids.unshift(id);
      V.store.set('saved', ids);
      document.dispatchEvent(new CustomEvent('voyager:saved', { detail: { id, saved: on } }));
      return on;
    },
  };

  // ---- User ------------------------------------------------------------------
  const USER_SEED = {
    first: 'Alex', name: 'Alex Johnson', email: 'alex.johnson@email.com', phone: '+44 7700 900123', dob: '1990-06-14', nationality: 'British', country: 'United Kingdom',
    avatar: 'avatar-alex', tier: 'Gold', points: 4820, nextTier: 'Platinum', nextTierAt: 10000, trips: 12, rating: 4.9,
    language: 'English (UK)', region: 'United Kingdom', currency: 'USD',
    prefs: { notifications: true, email: true, dark: false, biometrics: true, location: true },
    activity: [{ label: 'Paris Booking', pts: 1240, tone: 'valid' }, { label: 'Promo Code Used', pts: 500, tone: 'expiring' }],
  };
  V.user = {
    get() { return Object.assign(clone(USER_SEED), V.store.get('user', {})); },
    set(patch) { const u = Object.assign(V.user.get(), patch); V.store.set('user', u); return u; },
    pref(k, v) { const u = V.user.get(); if (v === undefined) return u.prefs[k]; u.prefs[k] = v; V.store.set('user', u); return v; },
    toNext() { const u = V.user.get(); return Math.max(0, u.nextTierAt - u.points); },
    progress() { const u = V.user.get(); return Math.min(1, u.points / u.nextTierAt); },
    redeem(points, label) {
      const u = V.user.get(); if (u.points < points) return false;
      u.points -= points; u.activity.unshift({ label: label || 'Points Redeemed', pts: -points, tone: 'expiring' }); V.store.set('user', u); return true;
    },
    earn(points, label) { const u = V.user.get(); u.points += points; u.activity.unshift({ label, pts: points, tone: 'valid' }); V.store.set('user', u); return u.points; },
  };

  // ---- Payment cards -------------------------------------------------------
  const CARDS_SEED = [
    { id: 'visa-4887', brand: 'Visa', last4: '4887', holder: 'Alex Johnson', exp: '09/28', isDefault: true },
    { id: 'mc-2210', brand: 'Mastercard', last4: '2210', holder: 'Alex Johnson', exp: '04/27', isDefault: false },
  ];
  V.cards = {
    list() { return V.store.get('cards', clone(CARDS_SEED)); },
    get(id) { return V.cards.list().find((c) => c.id === id) || null; },
    default() { const l = V.cards.list(); return l.find((c) => c.isDefault) || l[0] || null; },
    add({ number, holder, exp, makeDefault = true }) {
      const digits = String(number).replace(/\D/g, ''); const last4 = digits.slice(-4);
      const brand = /^4/.test(digits) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(digits) ? 'Mastercard' : /^3[47]/.test(digits) ? 'Amex' : 'Card';
      let l = V.cards.list(); const card = { id: brand.toLowerCase() + '-' + last4 + '-' + Date.now().toString(36).slice(-3), brand, last4, holder, exp, isDefault: !!makeDefault };
      if (makeDefault) l.forEach((c) => (c.isDefault = false));
      l.push(card); V.store.set('cards', l); return card;
    },
    remove(id) { let l = V.cards.list().filter((c) => c.id !== id); if (l.length && !l.some((c) => c.isDefault)) l[0].isDefault = true; V.store.set('cards', l); return l; },
    setDefault(id) { const l = V.cards.list(); l.forEach((c) => (c.isDefault = c.id === id)); V.store.set('cards', l); return l; },
    mask(c) { return '**** **** **** ' + c.last4; },
  };

  // ---- Travel documents ------------------------------------------------------
  const DOCS_SEED = [
    { id: 'passport', type: 'passport', name: 'UK Passport', number: '123456789', country: 'GBR', expires: 'Mar 2030', status: 'valid', icon: 'book' },
    { id: 'licence', type: 'licence', name: "Driver's Licence", number: 'JOHNS906140AJ9DW', country: 'GBR', expires: 'Jul 2031', status: 'valid', icon: 'id-card' },
    { id: 'insurance', type: 'insurance', name: 'Travel Insurance', number: 'VYG-INS-77120', country: 'GBR', expires: 'Oct 2026', status: 'expiring', icon: 'shield-check' },
  ];
  V.documents = {
    list() { return V.store.get('docs', clone(DOCS_SEED)); },
    get(id) { return V.documents.list().find((d) => d.id === id) || null; },
    add(doc) { const l = V.documents.list(); const d = Object.assign({ id: 'doc-' + Date.now().toString(36), status: 'valid', icon: 'file' }, doc); l.push(d); V.store.set('docs', l); return d; },
    update(id, patch) { const l = V.documents.list(); const d = l.find((x) => x.id === id); if (!d) return null; Object.assign(d, patch); V.store.set('docs', l); return d; },
    remove(id) { V.store.set('docs', V.documents.list().filter((d) => d.id !== id)); },
  };

  // ---- Notifications -----------------------------------------------------------
  const NOTIFS_SEED = [
    { id: 'n1', group: 'today', title: 'Flight Confirmed', body: 'British Airways BA303 London → Paris On Aug 12 Is Confirmed. Check-In Opens 24 Hours Before Departure.', time: '20 Minutes Ago', href: 'e-ticket.html?ref=VYG-4892-PAR', unread: true },
    { id: 'n2', group: 'today', title: 'Hotel Ready', body: 'Hôtel Le Marais Has Confirmed Your Reservation. Early Check-In Available.', time: '35 Minutes Ago', href: 'hotel.html?id=paris', unread: true },
    { id: 'n3', group: 'today', title: 'Transport Update', body: 'Your Private Transfer From CDG Airport Is Scheduled For 12:30 PM. Your Driver Will Meet You At The Arrivals Gate 2 Exit.', time: '50 Minutes Ago', href: 'itinerary.html?trip=paris-aug', unread: true },
    { id: 'n4', group: 'yesterday', title: 'Deal Alert!', body: 'Bali Trips Are 15% Off This Week. Prices Drop Tomorrow — Book Now!', time: 'Yesterday', href: 'destination.html?id=bali', unread: false },
    { id: 'n5', group: 'yesterday', title: 'Leave A Review', body: 'How Was Your Rome Trip? Share Your Experience With The Community.', time: '2 Days Ago', href: 'write-review.html?id=rome', unread: false },
    { id: 'n6', group: 'yesterday', title: 'Last-Minute Access', body: 'Flash Sale: 2 Tickets Just Became Available For The Louvre Skip-The-Line Tour Tomorrow Morning. Tap To Grab Them!', time: '2 Days Ago', href: 'itinerary.html?trip=paris-aug', unread: false },
  ];
  V.notifications = {
    list() { return V.store.get('notifs', clone(NOTIFS_SEED)); },
    unread() { return V.notifications.list().filter((n) => n.unread).length; },
    markRead(id) { const l = V.notifications.list(); l.forEach((n) => { if (!id || n.id === id) n.unread = false; }); V.store.set('notifs', l); },
    markAllRead() { V.notifications.markRead(); },
    remove(id) { V.store.set('notifs', V.notifications.list().filter((n) => n.id !== id)); },
    add(n) { const l = V.notifications.list(); l.unshift(Object.assign({ id: 'n' + Date.now().toString(36), group: 'today', time: 'Just Now', unread: true }, n)); V.store.set('notifs', l); },
  };

  // ---- Promo codes -------------------------------------------------------------
  V.promos = [
    { code: 'SUMMER20', title: '20% Summer Escapes', desc: '20% off the package price, up to $300', type: 'pct', value: 20, cap: 300, expires: 'Sep 30, 2026' },
    { code: 'WELCOME50', title: '$50 Welcome Credit', desc: '$50 off any booking over $500', type: 'flat', value: 50, min: 500, expires: 'Dec 31, 2026' },
    { code: 'GOLD100', title: 'Gold Member Bonus', desc: '$100 off trips of 7+ nights', type: 'flat', value: 100, minNights: 7, expires: 'Nov 15, 2026' },
  ];
  V.promo = (code) => V.promos.find((p) => p.code === String(code || '').trim().toUpperCase()) || null;

  // ---- Booking (wizard state) ----------------------------------------------------
  // Pricing rules (documented in BUILD_BRIEF):
  //   package   = pp × adults            (label "<Package> × <adults>")
  //   children  = 50% of pp × children
  //   business  = +$850 × (adults + children)
  //   add-ons   = transfer $60, insurance $45, guided tour $80 (flat per booking)
  //   room      = hotel room upgrade × nights (Classic $0 · Deluxe +$35 · Suite +$120 per night), billed in the package
  //   promo     = optional (pct of package capped, or flat)
  //   taxes     = round(5% × (package + children + business + room))
  //   Default Paris: 1240×2=2480 + 60 + 45 + 124 = $2,709
  V.PRICES = { business: 850, insurance: 45, tour: 80, transfer: 60, childFactor: 0.5, taxRate: 0.05 };
  // Hotel rooms (hotel.html). extra = per-night upgrade over the package room; included in V.booking.totals().
  V.ROOMS = [
    { id: 'classic', name: 'Classic Room', img: 'room-classic', size: '22 m²', bed: 'Queen bed', extra: 0 },
    { id: 'deluxe', name: 'Deluxe Room', img: 'room-deluxe', size: '28 m²', bed: 'King bed · Courtyard view', extra: 35 },
    { id: 'suite', name: 'Signature Suite', img: 'room-suite', size: '42 m²', bed: 'King bed · Lounge · Balcony', extra: 120 },
  ];
  V.room = (id, destId) => { const r = V.ROOMS.find((x) => x.id === id) || V.ROOMS[0]; return r.id === 'suite' && destId === 'paris' ? Object.assign({}, r, { name: 'Marais Suite' }) : r; };
  const BOOKING_SEED = { dest: 'paris', depart: '2026-08-12', ret: '2026-08-19', adults: 2, children: 0, cls: 'economy', room: 'classic', addons: { insurance: true, tour: false, transfer: true }, requests: '', card: 'visa-4887', promo: '', ref: '' };
  V.booking = {
    get() { const b = Object.assign(clone(BOOKING_SEED), V.store.get('booking', {})); b.addons = Object.assign({}, BOOKING_SEED.addons, b.addons); return b; },
    set(patch) { const b = V.booking.get(); if (patch.addons) patch = Object.assign({}, patch, { addons: Object.assign(b.addons, patch.addons) }); const n = Object.assign(b, patch); V.store.set('booking', n); document.dispatchEvent(new CustomEvent('voyager:booking', { detail: n })); return n; },
    reset() { V.store.remove('booking'); return V.booking.get(); },
    start(destId) { const d = V.dest(destId) || V.dest('paris'); V.store.set('booking', Object.assign(clone(BOOKING_SEED), { dest: d.id, ret: V.date.add(BOOKING_SEED.depart, d.days) })); return V.booking.get(); },
    dest() { return V.dest(V.booking.get().dest) || V.dest('paris'); },
    travellers(b = V.booking.get()) { return b.adults + b.children; },
    summary(b = V.booking.get()) { // "Aug 12–19 · 2 Adults · Economy"
      const g = `${b.adults} Adult${b.adults === 1 ? '' : 's'}` + (b.children ? ` · ${b.children} Child${b.children === 1 ? '' : 'ren'}` : '');
      return `${V.date.range(b.depart, b.ret)} · ${g} · ${b.cls === 'business' ? 'Business' : 'Economy'}`;
    },
    totals(b = V.booking.get()) {
      const d = V.dest(b.dest) || V.dest('paris'); const P = V.PRICES; const pp = d.package.pp;
      const lines = []; const trav = b.adults + b.children;
      const pkg = pp * b.adults; lines.push({ key: 'package', label: `${d.package.name} × ${b.adults}`, amount: pkg });
      const kids = Math.round(pp * P.childFactor) * b.children; if (b.children) lines.push({ key: 'children', label: `Children × ${b.children}`, amount: kids });
      const biz = b.cls === 'business' ? P.business * trav : 0; if (biz) lines.push({ key: 'business', label: `Business Class × ${trav}`, amount: biz });
      const rm = V.room(b.room, d.id); const rmNights = Math.max(0, V.date.nights(b.depart, b.ret));
      const room = rm.extra * rmNights; if (room) lines.push({ key: 'room', label: `${rm.name} × ${rmNights} nights`, amount: room });
      if (b.addons.transfer) lines.push({ key: 'transfer', label: 'Airport Transfer', amount: P.transfer });
      if (b.addons.insurance) lines.push({ key: 'insurance', label: 'Travel Insurance', amount: P.insurance });
      if (b.addons.tour) lines.push({ key: 'tour', label: 'Guided City Tour', amount: P.tour });
      const promo = V.promo(b.promo); let disc = 0;
      if (promo) {
        const nights = V.date.nights(b.depart, b.ret);
        const ok = (!promo.min || pkg + kids >= promo.min) && (!promo.minNights || nights >= promo.minNights);
        if (ok) disc = promo.type === 'pct' ? Math.min(promo.cap || Infinity, Math.round((pkg + kids) * promo.value / 100)) : promo.value;
        if (disc) lines.push({ key: 'promo', label: `Promo ${promo.code}`, amount: -disc, discount: true });
      }
      const taxes = Math.round((pkg + kids + biz + room) * P.taxRate); lines.push({ key: 'taxes', label: 'Taxes & Fees', amount: taxes });
      const total = lines.reduce((a, l) => a + l.amount, 0);
      return { lines, total, taxes, perPerson: Math.round(total / Math.max(1, trav)), dest: d };
    },
    total(b) { return V.booking.totals(b).total; },
    // Confirm → create/refresh trip. Same destination + dates as an existing trip keeps its ref (default flow → VYG-4892-PAR).
    confirm() {
      const b = V.booking.get(); const d = V.dest(b.dest); const t = V.booking.totals(b);
      const existing = V.trips.list().find((x) => x.dest === b.dest && x.start === b.depart && x.end === b.ret && x.status !== 'cancelled');
      const ref = existing ? existing.ref : `VYG-${1000 + Math.floor(Math.random() * 9000)}-${d.code}`;
      const tr = V.travel(d.id);
      const trip = { id: existing ? existing.id : `${b.dest}-${b.depart.slice(5, 7)}${b.depart.slice(8)}`, ref, dest: b.dest, title: d.package.name, flight: existing && existing.flight || tr.out, hotel: existing && existing.hotel || tr.hotel, start: b.depart, end: b.ret, adults: b.adults, children: b.children, cls: b.cls, room: b.room || 'classic', addons: clone(b.addons), requests: b.requests, total: t.total, status: 'upcoming', img: existing ? existing.img : (d.id === 'paris' ? 'trip-paris' : d.img), card: b.card };
      V.trips.upsert(trip); V.booking.set({ ref });
      return trip;
    },
  };

  // ---- Trips ---------------------------------------------------------------------
  const TRIPS_SEED = [
    { id: 'paris-aug', ref: 'VYG-4892-PAR', dest: 'paris', title: 'Paris City Break', start: '2026-08-12', end: '2026-08-19', adults: 2, children: 0, cls: 'economy', addons: { insurance: true, tour: false, transfer: true }, total: 2709, status: 'upcoming', img: 'trip-paris', hotel: 'Hôtel Le Marais', flight: 'BA303', card: 'visa-4887' },
    { id: 'prague-oct', ref: 'VYG-5170-PRG', dest: 'prague', title: 'Prague Old Town Escape', start: '2026-10-06', end: '2026-10-11', adults: 2, children: 0, cls: 'economy', addons: { insurance: true, tour: true, transfer: false }, total: 1805, status: 'upcoming', img: 'trip-prague-night', hotel: 'Hotel Josef', flight: 'BA856', card: 'visa-4887' },
    { id: 'sydney-dec', ref: 'VYG-6023-SYD', dest: 'sydney', title: 'Sydney Harbour Explorer', start: '2026-12-02', end: '2026-12-10', adults: 2, children: 0, cls: 'economy', addons: { insurance: true, tour: false, transfer: true }, total: 3255, status: 'upcoming', img: 'trip-sydney-opera', hotel: 'Park Hyatt Sydney', flight: 'QF1', card: 'visa-4887' },
    { id: 'kyoto-jul', ref: 'VYG-3981-KIX', dest: 'kyoto', title: 'Kyoto Temples & Tea', start: '2026-07-24', end: '2026-07-31', adults: 2, children: 0, cls: 'economy', addons: { insurance: true, tour: true, transfer: true }, total: 4175, status: 'active', img: 'dest-kyoto', hotel: 'Hotel The Celestine Gion', flight: 'JL44', card: 'visa-4887' },
    { id: 'rome-may', ref: 'VYG-2217-ROM', dest: 'rome', title: 'Roman Holiday', start: '2026-05-03', end: '2026-05-08', adults: 2, children: 0, cls: 'economy', addons: { insurance: true, tour: true, transfer: false }, total: 2435, status: 'past', img: 'dest-rome', hotel: 'Hotel Artemide', flight: 'BA548', card: 'visa-4887', reviewed: false },
    { id: 'bali-feb', ref: 'VYG-1764-DPS', dest: 'bali', title: 'Bali Island Retreat', start: '2026-02-10', end: '2026-02-20', adults: 2, children: 0, cls: 'economy', addons: { insurance: true, tour: false, transfer: true }, total: 1785, status: 'past', img: 'dest-bali', hotel: 'Alila Uluwatu', flight: 'SQ317', card: 'visa-4887', reviewed: true },
  ];
  // Status is derived from the dates against V.today (cancelled is sticky): end < today → past · start ≤ today ≤ end → active · else upcoming.
  V.tripStatus = (t) => t.status === 'cancelled' ? 'cancelled' : t.end < V.today ? 'past' : t.start <= V.today ? 'active' : 'upcoming';
  V.trips = {
    list(status) { const l = V.store.get('trips', clone(TRIPS_SEED)); l.forEach((t) => { t.status = V.tripStatus(t); }); return status ? l.filter((t) => t.status === status) : l; },
    get(key) { return V.trips.list().find((t) => t.id === key || t.ref === key) || null; },
    count(status) { return V.trips.list(status).length; },
    upsert(trip) { const l = V.trips.list(); const i = l.findIndex((t) => t.id === trip.id); if (i >= 0) l[i] = Object.assign(l[i], trip); else l.unshift(trip); V.store.set('trips', l); return trip; },
    update(key, patch) { const t = V.trips.get(key); if (!t) return null; return V.trips.upsert(Object.assign(t, patch)); },
    cancel(key, reason) { return V.trips.update(key, { status: 'cancelled', cancelReason: reason || '', cancelledAt: V.today }); },
    // Cancellation policy: ≥14 days before departure → 90% back (insurance is non-refundable), otherwise 50%.
    daysToGo(t) { return V.date.nights(V.today, t.start); },
    refundRate(t) { return V.trips.daysToGo(t) >= 14 ? 0.9 : 0.5; },
    refund(t) { return Math.round((t.total - (t.addons && t.addons.insurance ? V.PRICES.insurance : 0)) * V.trips.refundRate(t)); },
    // helper for trip cards: "France 7 Days"
    meta(t) { const d = V.dest(t.dest); return `${d.country} ${V.date.nights(t.start, t.end)} Days`; },
  };

  // Reset the demo: wipe every voyager:* key (localStorage + sessionStorage) and fall back to the seeds.
  V.reset = () => {
    V.store.clear();
    try { Object.keys(sessionStorage).filter((k) => k.startsWith(PFX)).forEach((k) => sessionStorage.removeItem(k)); } catch (e) {}
    V.today = TODAY_DEFAULT;
    document.dispatchEvent(new CustomEvent('voyager:reset'));
  };
  if (params.has('reset')) V.reset();

  /* ------------------------------------------------------------------------
     Components rendered from data
     ------------------------------------------------------------------------ */
  const HEART_SVG = `<svg class="h-line" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">${I.heart}</svg><svg class="h-fill" viewBox="0 0 24 24" aria-hidden="true">${I['heart-fill']}</svg>`;
  V.heartHTML = (id, label) => `<button class="heart" type="button" data-heart="${id}" aria-pressed="${V.saved.has(id)}" aria-label="Save ${V.esc(label || id)}">${HEART_SVG}</button>`;
  // Destination card (flow). opts: { href, heart:true, meta, price, cls, style }
  V.cardHTML = (d, opts = {}) => {
    if (typeof d === 'string') d = V.dest(d);
    if (!d) return '';
    const href = opts.href || `destination.html?id=${d.id}`;
    const meta = opts.meta || `${d.country} ${d.days} Days`;
    const price = opts.price || V.fmtFrom(d.from);
    return `<article class="dcard ${opts.cls || ''}" ${opts.style ? `style="${opts.style}"` : ''}>
      <a class="dcard__link" href="${href}" aria-label="${V.esc(d.name)}, ${V.esc(meta)}, ${V.esc(price)}"></a>
      <div class="dcard__img ph"><img src="${V.img(d.img)}" alt=""></div>
      <div class="dcard__body"><span class="dcard__name">${V.esc(d.name)}</span><span class="dcard__meta">${V.esc(meta)}</span><span class="dcard__price">${V.esc(price)}</span></div>
      ${opts.heart === false ? '' : V.heartHTML(d.id, d.name)}
    </article>`;
  };
  V.starsHTML = (n = 5, size = 14) => `<span class="stars" aria-label="${n} out of 5 stars">${[1, 2, 3, 4, 5].map((i) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="${i > Math.round(n) ? 'is-off' : ''}" aria-hidden="true">${I['star-fill']}</svg>`).join('')}</span>`;

  /* ------------------------------------------------------------------------
     Tab bar: <nav data-tabbar="home|search|explore|trip|profile|none" [data-tabbar-grey]>
     ------------------------------------------------------------------------ */
  const TABS = [
    ['home', 'Home', 61, 'dashboard.html', 'house'],
    ['search', 'Search', 130, 'search.html', 'search'],
    ['explore', 'Explore', 200, 'map.html', 'map-pin'],
    ['trip', 'Trip', 270, 'trips.html', 'briefcase'],
    ['profile', 'Profile', 340, 'profile.html', 'user'],
  ];
  const wireTabbar = (nav) => {
    if (nav._wTab) return; nav._wTab = true;
    const active = nav.getAttribute('data-tabbar');
    nav.classList.add('tabbar'); if (nav.hasAttribute('data-tabbar-grey')) nav.classList.add('tabbar--grey');
    nav.setAttribute('aria-label', 'Primary');
    nav.innerHTML = '<div class="tabbar__in">' + TABS.map(([key, label, x, href, ic]) =>
      `<a class="tab" href="${href}" style="left:${x - 14}px"${active === key ? ' aria-current="page"' : ''}>${V.icon(ic, 26, 'stroke-width="1.7"')}<span>${label}</span></a>`).join('') +
      '<span class="home-indicator"></span></div>';
  };

  /* ------------------------------------------------------------------------
     Stepper: <div class="steps" data-step="2" data-total="4"></div>
     ------------------------------------------------------------------------ */
  V.steps = (el, step, total) => {
    step = +step || +el.dataset.step || 1; total = +total || +el.dataset.total || 4;
    el.dataset.step = step; el.setAttribute('role', 'img'); el.setAttribute('aria-label', `Step ${step} of ${total}`);
    let h = '';
    for (let i = 1; i <= total; i++) {
      const cls = i < step ? 'is-done' : i === step ? 'is-active' : '';
      h += `<span class="steps__dot ${cls}">${i < step ? V.icon('check', 16, 'stroke-width="2.6"') : i}</span>`;
      if (i < total) h += `<i class="steps__line ${i < step - 1 || (i === step - 1 && step < total) ? 'is-done' : i === step - 1 ? 'is-active-navy' : ''}"></i>`;
    }
    el.innerHTML = h;
  };
  $$('.steps[data-step]').forEach((el) => V.steps(el));

  /* ------------------------------------------------------------------------
     Navigation: [data-go="screen" | "screen?x=1" | "back"]
     ------------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go]');
    if (!el || el.closest('[aria-disabled="true"]')) return;
    e.preventDefault();
    const target = el.getAttribute('data-go');
    if (target === 'back') {
      const fb = el.getAttribute('data-fallback') || (el.getAttribute('href') && el.getAttribute('href') !== '#' ? el.getAttribute('href') : 'dashboard.html');
      if (history.length > 1 && document.referrer) history.back(); else location.href = fb;
      return;
    }
    V.go(target);
  });
  // Keyboard activation for non-button tappables
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-go]:not(button):not(a), [role="switch"]:not(button), [role="tab"]:not(button), [role="radio"]:not(button), [role="button"]:not(button):not(a)')) {
      e.preventDefault(); e.target.click();
    }
  });

  /* ------------------------------------------------------------------------
     Toggles: [role=switch] (class .toggle) → emits 'change' {detail: bool}
     ------------------------------------------------------------------------ */
  const wireSwitch = (sw) => {
    if (sw._wSw) return; sw._wSw = true;
    if (sw.tagName !== 'BUTTON') sw.tabIndex = 0;
    if (!sw.hasAttribute('aria-checked')) sw.setAttribute('aria-checked', 'false');
    sw.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sw.getAttribute('aria-disabled') === 'true') return;
      const on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on)); V.haptic();
      sw.dispatchEvent(new CustomEvent('change', { detail: on, bubbles: true }));
    });
  };
  // Row that toggles its switch: <div class="list__item" data-switch-row> … <button class="toggle" role="switch"> </div>
  document.addEventListener('click', (e) => {
    const row = e.target.closest('[data-switch-row]'); if (!row || e.target.closest('[role="switch"]')) return;
    const sw = row.querySelector('[role="switch"]'); sw && sw.click();
  });

  /* ------------------------------------------------------------------------
     Chip groups: [data-group] > [role=tab] (single) · [data-group][data-multi] > .chip (multi)
     Emits 'change' on the group: detail = value (single) or array (multi)
     ------------------------------------------------------------------------ */
  // Idempotent: the container is set up once; every item is wired once (items injected later are picked up by V.refresh).
  const wireGroup = (group) => {
    const multi = group.hasAttribute('data-multi');
    const cls = group.getAttribute('data-active-class') || 'is-active';
    const items = () => $$(multi ? '.chip, [data-value]' : '[role="tab"]', group);
    if (!group._wGrp) {
      group._wGrp = true;
      if (!multi && !group.getAttribute('role')) group.setAttribute('role', 'tablist');
      group.value = () => multi ? items().filter((t) => t.classList.contains(cls)).map((t) => t.dataset.value || t.textContent.trim()) : (items().find((t) => t.classList.contains(cls)) || {}).dataset?.value;
      group.reset = () => items().forEach((t) => { t.classList.remove(cls); t.setAttribute(multi ? 'aria-pressed' : 'aria-selected', 'false'); });
    }
    items().forEach((tab) => {
      if (tab._vw) return; tab._vw = true;
      if (tab.tagName !== 'BUTTON') tab.tabIndex = 0;
      if (multi) tab.setAttribute('aria-pressed', String(tab.classList.contains(cls)));
      else tab.setAttribute('aria-selected', String(tab.classList.contains(cls)));
      tab.addEventListener('click', () => {
        if (multi) {
          const on = !tab.classList.contains(cls); tab.classList.toggle(cls, on); tab.setAttribute('aria-pressed', String(on));
          group.dispatchEvent(new CustomEvent('change', { detail: items().filter((t) => t.classList.contains(cls)).map((t) => t.dataset.value || t.textContent.trim()) }));
        } else {
          items().forEach((t) => { t.classList.remove(cls); t.setAttribute('aria-selected', 'false'); });
          tab.classList.add(cls); tab.setAttribute('aria-selected', 'true');
          group.dispatchEvent(new CustomEvent('change', { detail: tab.dataset.value || tab.textContent.trim() }));
        }
      });
    });
  };
  // Filterable lists: <div data-group data-filter-target="#list"> + items with data-status
  const wireFilter = (group) => {
    if (group._wFlt) return; group._wFlt = true;
    const list = $(group.getAttribute('data-filter-target'));
    group.addEventListener('change', (e) => { const v = e.detail; $$('[data-status]', list).forEach((it) => { it.hidden = !(v === 'all' || it.dataset.status === v); }); });
  };

  /* ------------------------------------------------------------------------
     Segmented / content tabs: .seg or .tabs > button (aria-controls optional → shows panel)
     ------------------------------------------------------------------------ */
  const wireSeg = (seg) => {
    const btns = () => $$(':scope > button', seg);
    const fresh = btns().filter((b) => !b._vw);
    if (seg._wSeg && !fresh.length) return;
    seg._wSeg = true;
    seg.setAttribute('role', 'tablist');
    fresh.forEach((b) => {
      b._vw = true;
      b.setAttribute('role', 'tab'); if (!b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', 'false');
      b.addEventListener('click', () => {
        btns().forEach((x) => { x.setAttribute('aria-selected', String(x === b)); const p = x.getAttribute('aria-controls'); if (p && document.getElementById(p)) document.getElementById(p).hidden = x !== b; });
        seg.dispatchEvent(new CustomEvent('change', { detail: b.dataset.value }));
      });
    });
    const all = btns(); const cur = all.find((b) => b.getAttribute('aria-selected') === 'true') || all[0];
    all.forEach((x) => { const p = x.getAttribute('aria-controls'); if (p && document.getElementById(p)) document.getElementById(p).hidden = x !== cur; });
    seg.select = (v) => { const b = btns().find((x) => x.dataset.value === v); b && b.click(); };
  };

  /* ------------------------------------------------------------------------
     Radio option lists: [data-options] > .option | .opt | .day  (emits 'select')
     ------------------------------------------------------------------------ */
  const wireOptions = (group) => {
    const opts = () => $$('.option, .opt, [data-option]', group);
    if (!group._wOpt) {
      group._wOpt = true;
      group.setAttribute('role', 'radiogroup');
      group.select = (v) => opts().forEach((x) => x.setAttribute('aria-checked', String(x.dataset.value === v)));
    }
    opts().forEach((o) => {
      if (o._vw) return; o._vw = true;
      o.setAttribute('role', 'radio'); if (!o.hasAttribute('aria-checked')) o.setAttribute('aria-checked', 'false');
      if (o.tagName !== 'BUTTON' && o.tagName !== 'A') o.tabIndex = 0;
      o.addEventListener('click', () => {
        opts().forEach((x) => x.setAttribute('aria-checked', String(x === o)));
        group.dispatchEvent(new CustomEvent('select', { detail: o.dataset.value || o.textContent.trim() }));
      });
    });
  };

  /* ------------------------------------------------------------------------
     Hearts: [data-heart="destId"] — syncs every heart for that id + toast
     ------------------------------------------------------------------------ */
  const syncHearts = (id) => $$(`[data-heart${id ? `="${id}"` : ''}]`).forEach((h) => h.setAttribute('aria-pressed', String(V.saved.has(h.dataset.heart))));
  V.hydrateHearts = (root = document) => within('[data-heart]', root).forEach((h) => {
    if (!h.querySelector('svg')) h.innerHTML = HEART_SVG;
    if (!h.hasAttribute('aria-label')) { const d = V.dest(h.dataset.heart); h.setAttribute('aria-label', 'Save ' + (d ? d.name : h.dataset.heart)); }
    h.setAttribute('aria-pressed', String(V.saved.has(h.dataset.heart)));
  });
  document.addEventListener('click', (e) => {
    const h = e.target.closest('[data-heart]'); if (!h) return;
    e.preventDefault(); e.stopPropagation();
    const id = h.dataset.heart; const on = V.saved.toggle(id); const d = V.dest(id);
    syncHearts(id); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); V.haptic();
    V.toast(on ? `${d ? d.name : 'Trip'} saved to your wishlist` : `${d ? d.name : 'Trip'} removed from saved`, { action: 'Undo', onAction: () => { V.saved.toggle(id, !on); syncHearts(id); } });
  });

  /* ------------------------------------------------------------------------
     Count-up numbers: <span data-count="4820" data-format="num|money">4,820</span>
     ------------------------------------------------------------------------ */
  if (!capture && !reduced) {
    $$('[data-count]').forEach((el) => {
      const final = el.textContent; const target = parseFloat(el.dataset.count); const f = el.dataset.format || 'num';
      const start = performance.now(), dur = 900;
      const step = (t) => { const p = Math.min(1, (t - start) / dur); const v = target * (1 - Math.pow(1 - p, 3)); el.textContent = f === 'money' ? V.fmt(v) : V.fmtNum(Math.round(v)); if (p < 1) requestAnimationFrame(step); else el.textContent = final; };
      requestAnimationFrame(step);
    });
  }

  /* ------------------------------------------------------------------------
     Toast: Voyager.toast(msg, {action, onAction, ms}) · declarative [data-toast]
     ------------------------------------------------------------------------ */
  V.toast = (msg, opt = {}) => {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.innerHTML = `<span>${V.esc(msg)}</span>` + (opt.action ? `<button class="toast__action" type="button">${V.esc(opt.action)}</button>` : '');
    if (opt.action) t.querySelector('.toast__action').onclick = () => { t.classList.remove('show'); opt.onAction && opt.onAction(); };
    t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), opt.ms || (opt.action ? 3600 : 2400));
  };
  window.voyagerToast = V.toast;
  document.addEventListener('click', (e) => { const el = e.target.closest('[data-toast]'); if (el && !el.hasAttribute('data-confirm')) V.toast(el.getAttribute('data-toast')); });

  /* ------------------------------------------------------------------------
     Loading buttons: await Voyager.loading(btn, ms)
     ------------------------------------------------------------------------ */
  V.loading = async (btn, ms = 1000) => {
    if (!btn) return V.wait(ms);
    btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true');
    await V.wait(ms);
    btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy');
  };

  /* ------------------------------------------------------------------------
     Bottom sheets: <section class="sheet" id="x"> · [data-sheet="x"] · [data-close] · ?sheet=x
     ------------------------------------------------------------------------ */
  let openSheet = null, lastFocus = null, scrim = null, dialogOpen = null;
  const ensureScrim = () => {
    if (scrim) return scrim;
    scrim = document.createElement('div'); scrim.className = 'sheet-scrim'; scrim.hidden = true;
    scrim.addEventListener('click', () => V.sheet.close());
    document.body.appendChild(scrim); return scrim;
  };
  V.sheet = {
    open(id) {
      const el = typeof id === 'string' ? document.getElementById(id) : id; if (!el) return;
      if (openSheet && openSheet !== el) V.sheet.close(true);
      lastFocus = document.activeElement;
      const sc = ensureScrim(); sc.hidden = false;
      el.hidden = false; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      requestAnimationFrame(() => { sc.classList.add('open'); el.classList.add('open'); });
      openSheet = el;
      setTimeout(() => { const f = el.querySelector('[autofocus]') || el.querySelector('input, textarea, button:not(.sheet__close), [tabindex="0"]'); f && f.focus({ preventScroll: true }); }, 80);
      el.dispatchEvent(new CustomEvent('sheet:open'));
    },
    close(instant) {
      if (!openSheet) return;
      const el = openSheet; openSheet = null;
      el.classList.remove('open'); el.style.transform = '';
      if (scrim) scrim.classList.remove('open');
      const done = () => { if (!openSheet && scrim) scrim.hidden = true; if (!el.classList.contains('open')) el.hidden = true; };
      instant === true ? done() : setTimeout(done, 300);
      el.dispatchEvent(new CustomEvent('sheet:close'));
      lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    },
    current: () => openSheet,
  };
  const wireSheet = (el) => {
    if (el._wSheet) return; el._wSheet = true;
    el.hidden = true;
    if (!el.querySelector('.sheet__grab')) { const g = document.createElement('span'); g.className = 'sheet__grab'; g.setAttribute('aria-hidden', 'true'); el.prepend(g); }
    let y0 = null, dy = 0;
    const start = (e) => { y0 = e.clientY; dy = 0; el.classList.add('dragging'); };
    const move = (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; };
    const end = () => { if (y0 == null) return; y0 = null; el.classList.remove('dragging'); if (dy > 90) V.sheet.close(); else el.style.transform = ''; };
    const grab = el.querySelector('.sheet__grab');
    grab.addEventListener('pointerdown', (e) => { grab.setPointerCapture(e.pointerId); start(e); });
    grab.addEventListener('pointermove', move); grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  };
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-sheet]');
    if (open) { e.preventDefault(); V.sheet.open(open.getAttribute('data-sheet')); return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); V.sheet.close(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (dialogOpen) dialogOpen(false); else V.sheet.close(); }
    const trap = dialogOpen ? $('.dialog') : openSheet;
    if (e.key === 'Tab' && trap) {
      const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]', trap).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ------------------------------------------------------------------------
     Dialogs: await Voyager.dialog({title, message, confirm, cancel, tone:'danger'|'info'|'ok'|'warn'}) → bool
     Declarative: data-confirm="Title|Message|Confirm label|tone" (+ data-confirm-toast)
     ------------------------------------------------------------------------ */
  const DLG_TONES = { danger: ['#FDECEC', '#E53935', 'btn--danger', 'warning'], info: ['#EAF3FE', '#2F74C7', 'btn--navy', 'info'], ok: ['#E8F8E3', '#2E9B2E', 'btn--primary', 'check'], warn: ['#FFE7C1', '#C47A00', 'btn--primary', 'warning'] };
  V.dialog = ({ title, message = '', confirm = 'Confirm', cancel = 'Cancel', tone = 'info', icon } = {}) => new Promise((resolve) => {
    const [bg, fg, cls, ic] = DLG_TONES[tone] || DLG_TONES.info;
    const wrap = document.createElement('div'); wrap.className = 'dialog-wrap';
    wrap.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-m">
      <div class="dialog__icon" style="background:${bg};color:${fg}">${V.icon(icon || ic, 26, 'stroke-width="2"')}</div>
      <p class="dialog__title" id="dlg-t">${V.esc(title)}</p>${message ? `<p class="dialog__msg" id="dlg-m">${V.esc(message)}</p>` : ''}
      <div class="dialog__actions" ${cancel ? '' : 'style="grid-template-columns:1fr"'}>${cancel ? `<button class="btn btn--neutral" type="button" data-r="0">${V.esc(cancel)}</button>` : ''}<button class="btn ${cls}" type="button" data-r="1">${V.esc(confirm)}</button></div></div>`;
    const prev = document.activeElement;
    const close = (r) => { dialogOpen = null; wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 200); prev && prev.focus && prev.focus({ preventScroll: true }); resolve(r); };
    dialogOpen = close;
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(false); const b = e.target.closest('[data-r]'); if (b) close(b.dataset.r === '1'); });
    document.body.appendChild(wrap);
    requestAnimationFrame(() => { wrap.classList.add('open'); wrap.querySelector('[data-r="1"]').focus(); });
  });
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-confirm]');
    if (!el || el.dataset.confirmed) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const [title, message, confirm, tone] = el.dataset.confirm.split('|');
    if (await V.dialog({ title, message, confirm: confirm || 'Confirm', tone: tone || 'danger' })) {
      if (el.dataset.confirmToast) V.toast(el.dataset.confirmToast);
      const href = el.getAttribute('href');
      if (href && href !== '#') { await V.wait(el.dataset.confirmToast ? 700 : 0); location.href = href; }
      else { el.dataset.confirmed = '1'; el.click(); delete el.dataset.confirmed; }
    }
  }, true);

  /* ------------------------------------------------------------------------
     OTP: <div class="otp" data-length="6"> → emits 'complete' (detail code); .reset() .fill(code) .value()
     ------------------------------------------------------------------------ */
  const wireOtp = (box) => {
    if (box._wOtp) return; box._wOtp = true;
    const n = +box.dataset.length || 6;
    if (!box.children.length) box.innerHTML = Array.from({ length: n }, (_, i) => `<input inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" aria-label="Digit ${i + 1} of ${n}">`).join('');
    const ins = $$('input', box);
    const value = () => ins.map((i) => i.value).join('');
    const emit = () => { ins.forEach((i) => i.classList.toggle('filled', !!i.value)); box.classList.remove('is-error', 'is-ok'); box.dispatchEvent(new CustomEvent('input')); if (value().length === n) box.dispatchEvent(new CustomEvent('complete', { detail: value() })); };
    ins.forEach((inp, i) => {
      inp.addEventListener('input', (e) => { e.stopPropagation(); inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); emit(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) { ins[i - 1].focus(); ins[i - 1].value = ''; emit(); } if (e.key === 'ArrowLeft' && ins[i - 1]) ins[i - 1].focus(); if (e.key === 'ArrowRight' && ins[i + 1]) ins[i + 1].focus(); });
      inp.addEventListener('paste', (e) => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, n); if (!t) return; e.preventDefault(); t.split('').forEach((c, k) => { if (ins[k]) ins[k].value = c; }); ins[Math.min(t.length, n - 1)].focus(); emit(); });
    });
    box.value = value;
    box.fill = (code) => { String(code).split('').forEach((c, k) => { if (ins[k]) ins[k].value = c; }); emit(); };
    box.reset = () => { ins.forEach((i) => (i.value = '')); ins.forEach((i) => i.classList.remove('filled')); box.classList.remove('is-ok'); ins[0].focus(); };
  };

  /* ------------------------------------------------------------------------
     PIN keypad (optional): <div class="pin-dots" id="dots"></div><div class="keypad" data-target="dots" data-length="4">
     emits 'complete' (detail pin) and 'biometric'; methods .reset() .error()
     ------------------------------------------------------------------------ */
  const wireKeypad = (pad) => {
    if (pad._wKey) return; pad._wKey = true;
    const n = +pad.dataset.length || 4; const dots = document.getElementById(pad.dataset.target);
    if (!pad.children.length) pad.innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => `<button type="button" data-k="${d}">${d}</button>`).join('') +
      `<button type="button" class="key-muted" data-k="bio" aria-label="Use Face ID">${V.icon('fingerprint', 26)}</button><button type="button" data-k="0">0</button><button type="button" class="key-muted" data-k="del" aria-label="Delete">${V.icon('arrow-left', 24)}</button>`;
    if (dots && !dots.children.length) dots.innerHTML = '<i></i>'.repeat(n);
    let val = '';
    const render = () => dots && $$('i', dots).forEach((d, i) => d.classList.toggle('on', i < val.length));
    pad.reset = () => { val = ''; render(); };
    pad.error = () => { dots && dots.classList.add('is-error'); V.haptic(); setTimeout(() => { dots && dots.classList.remove('is-error'); pad.reset(); }, 420); };
    const press = (k) => {
      if (k === 'bio') { pad.dispatchEvent(new CustomEvent('biometric')); return; }
      if (k === 'del') val = val.slice(0, -1); else if (val.length < n) val += k;
      render(); V.haptic();
      if (val.length === n) { const v = val; setTimeout(() => pad.dispatchEvent(new CustomEvent('complete', { detail: v })), 160); }
    };
    pad.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
    document.addEventListener('keydown', (e) => { if (pad.offsetParent === null || /input|textarea/i.test(document.activeElement.tagName)) return; if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') press('del'); });
  };

  /* ------------------------------------------------------------------------
     Countdown: <button data-countdown="30">Resend code</button>
     ------------------------------------------------------------------------ */
  const wireCountdown = (btn) => {
    if (btn._wCd) return; btn._wCd = true;
    const label = btn.textContent.trim(); const secs = +btn.dataset.countdown;
    const run = () => { let t = secs; btn.disabled = true; const tick = () => { btn.textContent = `${label} in 0:${pad(t)}`; if (t-- <= 0) { btn.disabled = false; btn.textContent = label; clearInterval(h); } }; tick(); const h = setInterval(tick, 1000); };
    btn.addEventListener('click', () => { if (!btn.disabled) { V.toast('A new code is on its way'); run(); } });
    run();
  };

  /* ------------------------------------------------------------------------
     Range: <input type="range" class="range" data-out="id" data-fmt="money|days|pct">
     Dual range: <div class="drange" data-min="500" data-max="4500" data-step="100" data-from="1000" data-to="3000" data-out-from="id" data-out-to="id">
       → emits 'change' {detail:{from,to}}; el.value() / el.set(from,to)
     ------------------------------------------------------------------------ */
  const fmtBy = (v, f) => f === 'money' ? '$' + V.fmtNum(v) : f === 'days' ? v + ' Days' : f === 'pct' ? v + '%' : v;
  const wireRange = (r) => {
    if (r._wRng) return; r._wRng = true;
    const out = r.dataset.out && document.getElementById(r.dataset.out);
    const upd = () => { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%'); if (out) out.textContent = fmtBy(r.value, r.dataset.fmt); };
    r.addEventListener('input', upd); upd();
  };
  const wireDrange = (el) => {
    if (el._wDr) return; el._wDr = true;
    const min = +el.dataset.min || 0, max = +el.dataset.max || 100, step = +el.dataset.step || 1;
    el.innerHTML = `<div class="drange__track"><div class="drange__fill"></div></div><input type="range" min="${min}" max="${max}" step="${step}" value="${el.dataset.from || min}" aria-label="${el.dataset.labelFrom || 'Minimum'}"><input type="range" min="${min}" max="${max}" step="${step}" value="${el.dataset.to || max}" aria-label="${el.dataset.labelTo || 'Maximum'}">`;
    const [a, b] = $$('input', el); const fill = $('.drange__fill', el);
    const oF = el.dataset.outFrom && document.getElementById(el.dataset.outFrom), oT = el.dataset.outTo && document.getElementById(el.dataset.outTo);
    const upd = (src) => {
      let x = +a.value, y = +b.value; const gap = step * 2;
      if (y - x < gap) { if (src === a) { x = y - gap; a.value = x; } else { y = x + gap; b.value = y; } }
      const px = (v) => ((v - min) / (max - min)) * 100;
      fill.style.left = px(x) + '%'; fill.style.right = 100 - px(y) + '%';
      if (oF) oF.textContent = '$' + V.fmtNum(x); if (oT) oT.textContent = '$' + V.fmtNum(y);
      el.dispatchEvent(new CustomEvent('change', { detail: { from: x, to: y } }));
    };
    a.addEventListener('input', () => upd(a)); b.addEventListener('input', () => upd(b)); upd();
    el.value = () => ({ from: +a.value, to: +b.value });
    el.set = (x, y) => { a.value = x; b.value = y; upd(); };
  };

  /* ------------------------------------------------------------------------
     Counter: <div class="counter" data-counter data-min="0" data-max="9" data-value="2" aria-label="Adults"></div>
     → emits 'change' (detail value); el.value getter/setter
     ------------------------------------------------------------------------ */
  const wireCounter = (el) => {
    if (el._wCnt) return; el._wCnt = true;
    const min = el.dataset.min != null ? +el.dataset.min : 0, max = el.dataset.max != null ? +el.dataset.max : 9; let v = +el.dataset.value || 0;
    const lbl = el.getAttribute('aria-label') || 'quantity';
    el.setAttribute('role', 'group');
    el.innerHTML = `<button type="button" data-d="-1" aria-label="Decrease ${lbl}">${V.icon('minus', 12, 'stroke-width="3"')}</button><output aria-live="polite">${v}</output><button type="button" data-d="1" aria-label="Increase ${lbl}">${V.icon('plus', 12, 'stroke-width="3"')}</button>`;
    const out = $('output', el); const [m, p] = $$('button', el);
    const render = () => { out.textContent = v; m.disabled = v <= min; p.disabled = v >= max; };
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (!b) return; const n = Math.min(max, Math.max(min, v + +b.dataset.d)); if (n === v) return; v = n; render(); V.haptic(); el.dispatchEvent(new CustomEvent('change', { detail: v })); });
    Object.defineProperty(el, 'value', { get: () => v, set: (n) => { v = Math.min(max, Math.max(min, +n)); render(); } });
    render();
  };

  /* ------------------------------------------------------------------------
     Calendar: Voyager.calendar(el, {from, to, month:'2026-08', min, single, onChange(from,to)})
     Returns { set(from,to), show(month) }. Weeks start Monday. Range = orange ends + tint band.
     ------------------------------------------------------------------------ */
  V.calendar = (el, o = {}) => {
    let from = o.from || null, to = o.to || null; let cur = (o.month || from || V.today).slice(0, 7);
    const render = () => {
      const [y, m] = cur.split('-').map(Number); const first = new Date(y, m - 1, 1, 12); const lead = (first.getDay() + 6) % 7; const n = new Date(y, m, 0).getDate();
      let cells = ''; for (let i = 0; i < lead; i++) cells += '<span aria-hidden="true"></span>';
      for (let d = 1; d <= n; d++) {
        const iso = `${y}-${pad(m)}-${pad(d)}`; const cls = [];
        if (from && iso === from) cls.push('is-start'); if (to && iso === to) cls.push('is-end');
        if (from && to && iso > from && iso < to) cls.push('is-range');
        const dis = o.min && iso < o.min;
        cells += `<button type="button" class="cal__day ${cls.join(' ')}" data-date="${iso}" ${dis ? 'disabled' : ''} aria-pressed="${cls.length > 0}" aria-label="${V.date.fmt(iso, 'full')}">${d}</button>`;
      }
      const trail = (7 - ((lead + n) % 7)) % 7; for (let i = 0; i < trail; i++) cells += '<span aria-hidden="true"></span>';
      el.classList.add('cal');
      el.innerHTML = `<div class="cal__head"><p class="cal__month" aria-live="polite">${MONTH[m - 1]} ${y}</p><div class="cal__nav"><button type="button" data-m="-1" aria-label="Previous month">${V.icon('chevron-left', 16, 'stroke-width="2.4"')}</button><button type="button" data-m="1" aria-label="Next month">${V.icon('chevron-right', 16, 'stroke-width="2.4"')}</button></div></div>
        <div class="cal__dow" aria-hidden="true"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="cal__grid">${cells}</div>`;
    };
    el.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-m]');
      if (nav) { const [y, m] = cur.split('-').map(Number); const d = new Date(y, m - 1 + +nav.dataset.m, 1, 12); cur = V.date.iso(d).slice(0, 7); render(); return; }
      const day = e.target.closest('[data-date]'); if (!day) return;
      const iso = day.dataset.date;
      if (o.single) { from = iso; to = null; }
      else if (!from || (from && to) || iso < from) { from = iso; to = null; }
      else if (iso === from) { to = null; }
      else { to = iso; }
      render(); V.haptic(); o.onChange && o.onChange(from, to);
    });
    render();
    return { set(f, t) { from = f; to = t; if (f) cur = f.slice(0, 7); render(); }, show(mm) { cur = mm; render(); }, get: () => ({ from, to }) };
  };

  /* ------------------------------------------------------------------------
     Forms: data-validate="required|email|password|phone|card|expiry|cvv|passport|name|match" (+ data-match="#id")
     Voyager.validate(root) → bool (shows inline .error-text, focuses first invalid)
     Masks: data-mask="card|expiry|cvv|phone|passport"
     ------------------------------------------------------------------------ */
  const luhn = (num) => { const s = num.replace(/\D/g, ''); let sum = 0, alt = false; for (let i = s.length - 1; i >= 0; i--) { let d = +s[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; } return s.length >= 13 && s.length <= 19 && sum % 10 === 0; };
  V.luhn = luhn;
  const RULES = {
    required: (v) => v.trim().length > 0 || 'This field is required',
    name: (v) => !v.trim() || /^[\p{L}' .-]{2,}$/u.test(v.trim()) || 'Use letters only, e.g. Alex Johnson',
    email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email, e.g. alex@email.com',
    password: (v) => !v || (v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)) || 'Use at least 8 characters with letters and a number',
    phone: (v) => { const d = v.replace(/\D/g, ''); return !v.trim() || (d.length >= 7 && d.length <= 15) || 'Enter a valid phone number, e.g. +44 7700 900123'; },
    card: (v) => !v.trim() || luhn(v) || 'Check the card number — it doesn’t look valid',
    expiry: (v) => {
      if (!v.trim()) return true; const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/); if (!m || +m[1] < 1 || +m[1] > 12) return 'Use MM/YY, e.g. 09/28';
      const now = V.date.now(); const exp = new Date(2000 + +m[2], +m[1], 0, 23, 59); return exp >= now || 'This card has expired';
    },
    cvv: (v) => !v.trim() || /^\d{3,4}$/.test(v.trim()) || 'CVV is the 3 or 4 digits on the back',
    passport: (v) => !v.trim() || /^[A-Z0-9]{6,9}$/i.test(v.replace(/\s/g, '')) || 'Passport numbers are 6–9 letters or digits',
    match: (v, inp) => { const o = $(inp.dataset.match); return !o || v === o.value || 'Passwords don’t match'; },
  };
  V.rules = RULES;
  // V.validate(root, {focus}) — focus:false validates without moving focus (used on blur).
  V.validate = (root = document, opt = {}) => {
    let first = null;
    const inputs = root.matches && root.matches('[data-validate]') ? [root] : $$('[data-validate]', root);
    inputs.forEach((inp) => {
      const fg = inp.closest('.fg'); if (!fg || inp.disabled || inp.offsetParent === null) return;
      const msgs = inp.dataset.validate.split('|').map((r) => RULES[r] && RULES[r](inp.value, inp)).filter((m) => m !== true && m);
      fg.classList.toggle('has-error', msgs.length > 0);
      inp.setAttribute('aria-invalid', String(msgs.length > 0));
      let et = fg.querySelector('.error-text');
      if (!et) { et = document.createElement('span'); et.className = 'error-text'; et.id = (inp.id || 'f' + Math.random().toString(36).slice(2, 7)) + '-err'; et.setAttribute('role', 'alert'); fg.appendChild(et); inp.setAttribute('aria-describedby', ((inp.getAttribute('aria-describedby') || '') + ' ' + et.id).trim()); }
      et.innerHTML = msgs[0] ? V.icon('warning', 14, 'stroke-width="2"') + `<span>${V.esc(msgs[0])}</span>` : '';
      if (msgs.length && !first) first = inp;
    });
    if (first && opt.focus !== false) first.focus();
    return !first;
  };
  document.addEventListener('focusout', (e) => { const inp = e.target.closest && e.target.closest('[data-validate]'); if (inp && inp.value) V.validate(inp, { focus: false }); });
  document.addEventListener('input', (e) => {
    const t = e.target; if (!t.closest) return;
    const fg = t.closest('.fg.has-error'); if (fg) { fg.classList.remove('has-error'); t.removeAttribute('aria-invalid'); }
    const mask = t.dataset && t.dataset.mask; if (mask) {
      let v = t.value;
      if (mask === 'card') v = v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
      if (mask === 'expiry') { v = v.replace(/\D/g, '').slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2); }
      if (mask === 'cvv') v = v.replace(/\D/g, '').slice(0, 4);
      if (mask === 'phone') v = v.replace(/[^\d+ ]/g, '').slice(0, 18);
      if (mask === 'passport') v = v.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 9);
      if (v !== t.value) t.value = v;
    }
    const cc = t.dataset && t.dataset.charcount && document.getElementById(t.dataset.charcount); if (cc) cc.textContent = `${t.value.length}/${t.maxLength > 0 ? t.maxLength : ''}`;
    $$(`[data-strength-for="${t.id}"]`).forEach((m) => { const lvl = V.strength(t.value); m.dataset.level = lvl; const lab = m.nextElementSibling; if (lab && lab.hasAttribute('data-strength-label')) lab.textContent = t.value ? ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][lvl] : ''; });
  });
  V.strength = (v) => { if (!v) return 0; let s = 0; if (v.length >= 8) s++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++; return v.length < 6 ? Math.min(s, 1) : s; };
  // Password eye: <div class="field-wrap"><input type="password" …><button class="field-wrap__btn" data-pw-toggle aria-label="Show password"></button></div>
  $$('[data-pw-toggle]').forEach((b) => { if (!b.firstElementChild) b.innerHTML = V.icon('eye', 20); b.setAttribute('aria-pressed', 'false'); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pw-toggle]'); if (!b) return; e.preventDefault();
    const inp = b.parentElement.querySelector('input'); const show = inp.type === 'password'; inp.type = show ? 'text' : 'password';
    b.innerHTML = V.icon(show ? 'eye-slash' : 'eye', 20); b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  /* ------------------------------------------------------------------------
     Images: mark broken <img> inside .ph so the tinted fallback shows through
     ------------------------------------------------------------------------ */
  document.addEventListener('error', (e) => { const t = e.target; if (t && t.tagName === 'IMG') t.classList.add('is-broken'); }, true);
  $$('img').forEach((i) => { if (i.complete && i.naturalWidth === 0 && i.getAttribute('src')) i.classList.add('is-broken'); });

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  // Every declarative component, wired idempotently. V.refresh(root) re-runs them on injected markup (root included).
  const WIRES = [
    ['[data-tabbar]', wireTabbar], ['[role="switch"]', wireSwitch], ['[data-group]', wireGroup], ['[data-filter-target]', wireFilter],
    ['.seg, .tabs, .segmented', wireSeg], ['[data-options]', wireOptions], ['.sheet', wireSheet], ['.otp', wireOtp], ['.keypad', wireKeypad],
    ['[data-countdown]', wireCountdown], ['input.range', wireRange], ['.drange', wireDrange], ['[data-counter]', wireCounter],
  ];
  V.refresh = (root = document) => {
    hydrateIcons(root); V.hydrateHearts(root);
    WIRES.forEach(([sel, fn]) => within(sel, root).forEach(fn));
    within('.steps[data-step]', root).forEach((el) => { if (!el.children.length) V.steps(el); });
    return root;
  };
  hydrateIcons(); V.hydrateHearts();
  WIRES.forEach(([sel, fn]) => $$(sel).forEach(fn));
  document.addEventListener('voyager:reset', () => syncHearts());
  // Deep-link a sheet open: ?sheet=id
  if (V.q('sheet')) setTimeout(() => V.sheet.open(V.q('sheet')), capture ? 0 : 350);
})();
