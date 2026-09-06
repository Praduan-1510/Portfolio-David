import { icon } from './icons.js';
import { state, cartCount, bill } from './store.js';
import { rupees, t, plural } from './ui.js';

/* ─────────────────────────────────────────────────────────────────────────────
   The floating chrome: a dock, and the cart bar that buds out of it.

   This is the only part of the app made of glass. Four tabs plus a detached search
   bubble — the iOS 26 pattern, and the shape both Zepto and Blinkit reviewers ask for
   once cross-sell tabs start appearing in the bar.
   ───────────────────────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'home', icon: 'home', label: 'home' },
  { id: 'categories', icon: 'categories', label: 'categories' },
  { id: 'orders', icon: 'orders', label: 'orders' },
  { id: 'account', icon: 'you', label: 'you' },
];

/** Screens that are a task, not a place: the dock would just be in the way. */
const HIDE_ON = new Set([
  'splash',
  'onboarding',
  'phone',
  'otp',
  'location',
  // The cart and everything after it carry their own sticky footer with the amount on it.
  'cart',
  'checkout',
  'payment',
  'processing',
  'placed',
  'track',
  'circle',
]);

/** Rebuilt from scratch only when the language flips; otherwise patched in place. */
let builtLang = null;

export function renderChrome() {
  const host = document.getElementById('chrome-host');
  const count = cartCount();
  // Layout reads this to reserve room, so the last card is never trapped under the bar.
  document.body.dataset.cart = count > 0 && !HIDE_ON.has(state.screen) ? 'on' : 'off';
  if (HIDE_ON.has(state.screen)) {
    host.innerHTML = '';
    builtLang = null;
    return;
  }

  const b = bill();
  const chrome = host.querySelector('#chrome');

  if (!chrome || builtLang !== state.lang) {
    host.innerHTML = `
      <div class="chrome" id="chrome">
        ${count > 0 ? cartBar(count, b) : ''}
        <nav class="dock glass glass--pill" aria-label="Main">
          <div class="dock__items">
            ${TABS.map(
              (tab) => `
              <button class="dock__item" data-tab="${tab.id}"
                ${state.screen === tab.id ? 'aria-current="page"' : ''}
                aria-label="${t(tab.label)}">
                ${icon(tab.icon, { size: 24 })}
                <span class="dock__label">${t(tab.label)}</span>
              </button>`,
            ).join('')}
          </div>
          <button class="dock__search" data-tab="search" aria-label="${t('search')}">
            ${icon('search', { size: 24 })}
          </button>
        </nav>
      </div>`;
    builtLang = state.lang;
    return;
  }

  /*
   * Everything below is a patch rather than a rewrite. Re-setting innerHTML here — which is
   * what this used to do on every render — restarted the cart bar's `bud` animation on every
   * single tap of a stepper, and threw away the dock's minimised-on-scroll state on every
   * navigation. The bar should bud when it appears, and only then.
   */
  chrome.querySelectorAll('.dock__item').forEach((button) => {
    if (button.dataset.tab === state.screen) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  const bar = chrome.querySelector('.cartbar');
  if (count > 0 && !bar) {
    chrome.insertAdjacentHTML('afterbegin', cartBar(count, b));
  } else if (count === 0 && bar) {
    bar.remove();
  } else if (bar) {
    bar.querySelector('[data-cart-count]').textContent = plural(count, 'item', 'items');
    bar.querySelector('[data-cart-note]').textContent = b.freeDelivery
      ? 'Free delivery'
      : `+ ${rupees(b.delivery)} delivery`;
    bar.querySelector('[data-cart-total]').textContent = rupees(b.total);
  }
}

function cartBar(count, b) {
  // The bar states the amount, always. Zepto hides the payable total inside a bill summary,
  // which the press correctly calls a dark pattern; Blinkit and Instamart at least print it.
  return `
    <div class="cartbar glass glass--brand" data-cart-anchor>
      <div class="col">
        <span class="t-caption" data-cart-count style="color:var(--text)">${plural(count, 'item', 'items')}</span>
        <span class="t-caption2 muted" data-cart-note>${
          b.freeDelivery ? 'Free delivery' : `+ ${rupees(b.delivery)} delivery`
        }</span>
      </div>
      <button class="cartbar__cta" data-go="cart">
        <span>${t('viewCart')}</span>
        <span class="t-price-m" data-cart-total style="font-variant-numeric:tabular-nums">${rupees(b.total)}</span>
        ${icon('chevron', { size: 16 })}
      </button>
    </div>`;
}

/**
 * The dock shrinks to the active tab on a fast scroll down and comes back on the way up,
 * so a long shelf gets the full screen without losing the way out.
 */
export function bindDockScroll(scrollEl) {
  let last = 0;
  scrollEl.addEventListener(
    'scroll',
    () => {
      const chrome = document.getElementById('chrome');
      if (!chrome) return;
      const y = scrollEl.scrollTop;
      const delta = y - last;
      if (y > 120 && delta > 6) chrome.classList.add('chrome--min');
      else if (delta < -6 || y < 60) chrome.classList.remove('chrome--min');
      last = y;
    },
    { passive: true },
  );
}
