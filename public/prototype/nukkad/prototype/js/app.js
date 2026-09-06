import { productById } from '../data/catalog.js';
import { bindDockScroll, renderChrome } from './chrome.js';
import * as onboardingScreens from './screens/onboarding.js';
import * as shopScreens from './screens/shop.js';
import * as checkoutScreens from './screens/checkout.js';
import * as accountScreens from './screens/account.js';
import * as orderScreens from './screens/orders.js';
import {
  addToCart,
  cartCount,
  commit,
  placeOrder,
  setPref,
  setQty,
  state,
  qtyOf,
} from './store.js';
import { closeSheet, flyToCart, toast } from './ui.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Router and event plumbing.

   No framework: a route table, one render pass, and a single delegated click handler.
   The whole prototype is a handful of files you can read top to bottom, which is the point —
   the interesting part is the product, not the machinery.
   ───────────────────────────────────────────────────────────────────────────── */

const ROUTES = {
  splash: onboardingScreens.splash,
  onboarding: onboardingScreens.onboarding,
  phone: onboardingScreens.phone,
  otp: onboardingScreens.otp,
  location: onboardingScreens.location,

  home: shopScreens.home,
  categories: shopScreens.categoriesScreen,
  category: shopScreens.category,
  search: shopScreens.search,

  cart: checkoutScreens.cart,
  checkout: checkoutScreens.checkout,
  payment: checkoutScreens.payment,
  processing: checkoutScreens.processing,
  placed: checkoutScreens.placed,

  track: orderScreens.track,
  orders: orderScreens.orders,
  account: orderScreens.account,
  circle: orderScreens.circle,

  // The account area. These seven were rows that opened nothing until now.
  addresses: accountScreens.addresses,
  wallet: accountScreens.wallet,
  giftcards: accountScreens.giftCards,
  referral: accountScreens.referral,
  coupons: accountScreens.couponsScreen,
  help: accountScreens.help,
  settings: accountScreens.settings,
};

const screenHost = document.getElementById('screen');
let leaveHandlers = [];

function onLeave(fn) {
  leaveHandlers.push(fn);
}

export function go(name, params = {}, { replace = false } = {}) {
  closeSheet();
  if (!replace && state.screen !== name)
    state.history.push({ name: state.screen, params: state.params });
  state.screen = name;
  state.params = params;
  render();
}

function back() {
  const previous = state.history.pop();
  if (previous) {
    state.screen = previous.name;
    state.params = previous.params;
    render();
  } else {
    go('home', {}, { replace: true });
  }
}

function render() {
  leaveHandlers.forEach((fn) => fn());
  leaveHandlers = [];

  const route = ROUTES[state.screen] ?? ROUTES.home;
  const view = route(state.params);

  screenHost.innerHTML = view.html;
  screenHost.firstElementChild?.classList.add('screen-enter');

  renderChrome();

  const scroll = screenHost.querySelector('#scroll');
  if (scroll) {
    bindDockScroll(scroll);
    bindHeaderScroll(scroll);
  }

  startRotator();
  view.mount?.(screenHost, go, { rerender: render, toast, onLeave });
  syncSidePanel();
}

const HINTS = ['doodh', 'atta', 'chai', 'Maggi', 'eggs', 'Dettol'];

/** Cycles the search placeholder through what people actually type. */
function startRotator() {
  const host = screenHost.querySelector('[data-rotator]');
  if (!host) return;
  let index = 0;
  const timer = setInterval(() => {
    index = (index + 1) % HINTS.length;
    host.innerHTML = `<span>Search "${HINTS[index]}"</span>`;
  }, 2600);
  onLeave(() => clearInterval(timer));
}

/** The header only turns to glass once there is content behind it worth refracting. */
function bindHeaderScroll(scrollEl) {
  const bar = screenHost.querySelector('#appbar');
  if (!bar) return;
  scrollEl.addEventListener(
    'scroll',
    () => bar.classList.toggle('appbar--scrolled', scrollEl.scrollTop > 8),
    { passive: true },
  );
}

/* ── One delegated handler for the whole app ───────────────────────────────── */

document.addEventListener('click', (event) => {
  const el = (selector) => event.target.closest(selector);

  const back_ = el('[data-back]');
  if (back_) {
    back();
    return;
  }

  const goTo = el('[data-go]');
  if (goTo) {
    go(goTo.dataset.go);
    return;
  }

  const tab = el('[data-tab]');
  if (tab) {
    // Tapping the tab you are already on scrolls that tab back to the top, which is what
    // every iOS tab bar does. It used to do nothing at all.
    if (tab.dataset.tab === state.screen) {
      screenHost.querySelector('#scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    go(tab.dataset.tab);
    return;
  }

  const cat = el('[data-cat]');
  if (cat) {
    go('category', { id: cat.dataset.cat });
    return;
  }

  // Stepper controls sit inside the product card, so they must claim the click first.
  const add = el('[data-add]');
  if (add) {
    event.stopPropagation();
    const id = add.dataset.add;
    const product = productById.get(id);
    addToCart(id);
    const media = add.closest('.pcard')?.querySelector('.pcard__media');
    if (media && product) flyToCart(media, product.image);
    refreshInPlace(id);
    return;
  }

  const inc = el('[data-inc]');
  if (inc) {
    event.stopPropagation();
    setQty(inc.dataset.inc, qtyOf(inc.dataset.inc) + 1);
    refreshInPlace(inc.dataset.inc);
    return;
  }

  const dec = el('[data-dec]');
  if (dec) {
    event.stopPropagation();
    setQty(dec.dataset.dec, qtyOf(dec.dataset.dec) - 1);
    refreshInPlace(dec.dataset.dec);
    return;
  }

  const open = el('[data-open]');
  if (open) {
    shopScreens.openProduct(open.dataset.open, () => refreshInPlace(open.dataset.open));
    return;
  }
});

/**
 * Re-render only what a quantity change actually touches: the steppers for that product and the
 * cart bar. Repainting the whole screen would lose scroll position and kill the fly animation.
 */
function refreshInPlace(productId) {
  const product = productById.get(productId);
  if (!product) return;

  if (['cart', 'checkout', 'payment'].includes(state.screen)) {
    render();
    return;
  }

  document
    .querySelectorAll(`[data-add="${productId}"], [data-inc="${productId}"]`)
    .forEach((el) => {
      const holder = el.closest('.pcard__foot, #pdp-stepper, .col');
      if (!holder) return;
      const stepperEl = holder.querySelector('.stepper');
      if (!stepperEl) return;
      const qty = qtyOf(productId);
      if (qty === 0) {
        stepperEl.outerHTML = `<button class="stepper stepper--add" data-add="${productId}">ADD</button>`;
      } else {
        const count = stepperEl.querySelector('.qty');
        if (count) count.textContent = qty;
        else stepperEl.outerHTML = buildStepper(product, qty);
      }
    });

  // A sold-out or first add flips the whole control, so rebuild any add buttons left over.
  document.querySelectorAll(`.stepper--add[data-add="${productId}"]`).forEach((el) => {
    const qty = qtyOf(productId);
    if (qty > 0) el.outerHTML = buildStepper(product, qty);
  });

  renderChrome();
}

const buildStepper = (product, qty) => `
  <span class="stepper">
    <button data-dec="${product.id}" aria-label="Remove one">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M5 12h14"/></svg>
    </button>
    <span class="qty" aria-live="polite">${qty}</span>
    <button data-inc="${product.id}" aria-label="Add one">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </button>
  </span>`;

/* ── Desktop demo panel ────────────────────────────────────────────────────── */

function syncSidePanel() {
  const set = (act, label, on) => {
    const button = document.querySelector(`[data-act="${act}"]`);
    if (!button) return;
    button.textContent = label;
    button.classList.toggle('chip--on', Boolean(on));
  };
  set('theme', state.theme === 'dark' ? 'Light mode' : 'Dark mode', state.theme === 'dark');
  set('glass', state.glass === 'off' ? 'Glass on' : 'Reduce glass', state.glass === 'off');
  set('lang', state.lang === 'hi' ? 'English' : 'हिन्दी', state.lang === 'hi');
  set('speed', `Order speed ${state.orderSpeed}×`, state.orderSpeed !== 1);
  set('busy', state.busy ? 'Store calm' : 'Busy store', state.busy);
}

document.querySelector('.side')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-act]');
  if (!button) return;

  switch (button.dataset.act) {
    case 'theme':
      setPref('theme', state.theme === 'dark' ? 'light' : 'dark');
      break;
    case 'glass':
      setPref('glass', state.glass === 'off' ? 'on' : 'off');
      break;
    case 'lang':
      setPref('lang', state.lang === 'hi' ? 'en' : 'hi');
      break;
    case 'speed': {
      const speeds = [1, 4, 12];
      state.orderSpeed = speeds[(speeds.indexOf(state.orderSpeed) + 1) % speeds.length];
      toast(`Order simulation running at ${state.orderSpeed}×`);
      break;
    }
    case 'busy':
      state.busy = !state.busy;
      toast(
        state.busy
          ? 'Store is busy: the clock stretches, the price does not'
          : 'Store is calm again',
      );
      break;
    case 'reset':
      localStorage.removeItem('nukkad');
      location.reload();
      return;
  }
  render();
});

/* ── Boot ──────────────────────────────────────────────────────────────────── */

/**
 * Chromium is the only engine that runs an SVG filter inside backdrop-filter. Feature-detecting
 * it properly is not possible, so this checks the engine and lets the CSS opt in.
 */
function detectRefraction() {
  const chromium =
    /Chrome|Chromium|Edg/.test(navigator.userAgent) && !/OPR/.test(navigator.userAgent);
  document.documentElement.dataset.refract = chromium ? 'yes' : 'no';
}

/**
 * Deep links, so any screen can be opened directly:
 *   ?screen=cart&seed=1   fills a basket and lands on it
 *   ?screen=track&seed=1  places an order and follows the rider
 * Useful for walking someone through the prototype, and for capturing screenshots.
 */
function applyDeepLink() {
  const url = new URLSearchParams(location.search);
  const screen = url.get('screen');
  if (!screen || !ROUTES[screen]) return null;

  // A shelf is the most linkable screen in a shopping app, so ?screen=category&cat=dairy works.
  if (screen === 'category' && url.get('cat')) state.params = { id: url.get('cat') };

  // …and ?open=maggi-70 lands on the product sheet, so a single link can show one product.
  const open = url.get('open');
  if (open && productById.has(open)) {
    requestAnimationFrame(() => shopScreens.openProduct(open, () => refreshInPlace(open)));
  }

  if (url.get('seed')) {
    state.signedIn = true;
    state.name = state.name || 'Aarav';
    state.phone = state.phone || '9880041234';
    state.address = state.address ?? {
      label: 'Home',
      line: '402, Prestige Ferns · Indiranagar',
      area: 'Indiranagar',
    };
    if (!Object.keys(state.cart).length) {
      ['amul-taaza-500', 'parle-g-800', 'onion-1kg', 'maggi-70', 'tapri-masala-chai'].forEach(
        (id) => {
          state.cart[id] = id === 'maggi-70' ? 2 : 1;
        },
      );
    }
    if (['track', 'placed'].includes(screen) && !state.orders.length) {
      const order = placeOrder('gpay');
      state.params = { id: order.id };
    }
    commit();
  }

  if (url.get('theme')) setPref('theme', url.get('theme'));
  if (url.get('glass')) setPref('glass', url.get('glass'));
  if (url.get('lang')) setPref('lang', url.get('lang'));
  return screen;
}

function boot() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.glass = state.glass;
  detectRefraction();

  // The device frame only exists on a wide screen, so the status bar padding follows it.
  // The embed page always draws the phone frame, whatever the container width, so the 52px
  // status-bar offset has to come with it — otherwise a navbar renders under the clock.
  const applyFrame = () =>
    document.body.classList.toggle(
      'frame-on',
      document.body.classList.contains('embed') || window.innerWidth >= 880,
    );
  applyFrame();
  window.addEventListener('resize', applyFrame);

  const deep = applyDeepLink();
  go(deep ?? 'splash', ['placed', 'category'].includes(deep) ? state.params : {}, {
    replace: true,
  });
}

boot();
