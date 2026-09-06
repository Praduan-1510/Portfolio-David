import { icon } from './icons.js';
import { state, qtyOf } from './store.js';

/* ── Money ─────────────────────────────────────────────────────────────────── */

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Indian grouping (₹1,24,999), no space after the symbol, paise only when they exist. */
export function amount(paise) {
  const value = paise / 100;
  return Number.isInteger(value) ? inr.format(value) : inrPaise.format(value);
}
export const rupees = (paise) => `₹${amount(paise)}`;

/** The ₹ sits a size smaller so the number stays the loudest thing in the row. */
export const price = (paise, cls = 't-price-m') =>
  `<span class="price ${cls}"><span><span class="sym">₹</span>${amount(paise)}</span></span>`;

export const priceWithMrp = (paise, mrp, cls = 't-price-m') =>
  `<span class="price ${cls}"><span><span class="sym">₹</span>${amount(paise)}</span>${
    mrp > paise ? `<span class="mrp">₹${amount(mrp)}</span>` : ''
  }</span>`;

/* ── Language ──────────────────────────────────────────────────────────────── */

const strings = {
  en: {
    skip: 'Skip',
    next: 'Next',
    getStarted: 'Get started',
    home: 'Home',
    categories: 'Shelves',
    orders: 'Orders',
    you: 'You',
    search: 'Search',
    viewCart: 'View cart',
    add: 'ADD',
    soldOut: 'Sold out',
    free: 'FREE',
    itemTotal: 'Item total',
    delivery: 'Delivery',
    total: 'To pay',
    savings: 'You saved',
    deliverTo: 'Deliver to',
    payNow: 'Pay',
    placeOrder: 'Place order',
    min: 'min',
    arriving: 'Arriving in',
    trackOrder: 'Track order',
  },
  hi: {
    skip: 'छोड़ें',
    next: 'आगे',
    getStarted: 'शुरू करें',
    home: 'होम',
    categories: 'शेल्फ़',
    orders: 'ऑर्डर',
    you: 'आप',
    search: 'खोजें',
    viewCart: 'कार्ट देखें',
    add: 'जोड़ें',
    soldOut: 'ख़त्म',
    free: 'मुफ़्त',
    itemTotal: 'सामान का कुल',
    delivery: 'डिलीवरी',
    total: 'देना है',
    savings: 'आपने बचाए',
    deliverTo: 'यहाँ भेजें',
    payNow: 'भुगतान',
    placeOrder: 'ऑर्डर करें',
    min: 'मिनट',
    arriving: 'पहुँचेगा',
    trackOrder: 'ट्रैक करें',
  },
};

export const t = (key) => strings[state.lang]?.[key] ?? strings.en[key] ?? key;
/** Hindi needs an explicit family: no font falls back per-glyph reliably. */
export const deva = () => (state.lang === 'hi' ? 'deva' : '');

/* ── Product name in the active language ───────────────────────────────────── */

export const productName = (product) =>
  state.lang === 'hi' && product.nameHi ? product.nameHi : product.name;

/* ── Components ────────────────────────────────────────────────────────────── */

export function dietMark(diet) {
  if (diet === 'none') return '';
  const cls = diet === 'nonVeg' ? 'non-veg' : diet;
  const label = { veg: 'Vegetarian', nonVeg: 'Non-vegetarian', egg: 'Contains egg' }[diet] ?? '';
  return `<span class="diet diet--${cls}" role="img" aria-label="${label}"></span>`;
}

export function stepper(product, size = '') {
  const qty = qtyOf(product.id);
  if (qty === 0) {
    return `<button class="stepper stepper--add ${size}" data-add="${product.id}"
      aria-label="Add ${product.name}">${t('add')}</button>`;
  }
  const atMax = qty >= product.maxQty;
  return `<span class="stepper ${size}">
    <button data-dec="${product.id}" aria-label="Remove one">${icon('minus', { size: 16 })}</button>
    <span class="qty" aria-live="polite">${qty}</span>
    <button data-inc="${product.id}" aria-label="Add one"${atMax ? ' disabled style="opacity:.4"' : ''}>
      ${icon('plus', { size: 16 })}</button>
  </span>`;
}

/**
 * The card is a div, not a button, and only its upper half is the tappable region.
 * A button cannot contain a button: the parser closes the outer one when it meets the
 * stepper's, which silently ejected the stepper out of the card and into the grid as its
 * own cell. Splitting the hit area is the fix, and it is also the correct semantics —
 * "open this product" and "add one" are two different actions on one card.
 */
export function productCard(product) {
  const soldOut = product.soldOut;
  return `<div class="pcard ${soldOut ? 'pcard--out' : ''}">
    <button class="pcard__body" data-open="${product.id}">
      <span class="pcard__media">
        <img src="${product.image}" alt="" loading="lazy" />
        ${product.discount >= 10 ? `<span class="badge badge--deal pcard__badge">${product.discount}% OFF</span>` : ''}
        <span class="pcard__diet">${dietMark(product.diet)}</span>
      </span>
      <span class="pcard__name ${deva()}">${productName(product)}</span>
    </button>
    <div class="pcard__foot">
      <span class="pcard__pricing">
        ${priceWithMrp(product.price, product.mrp, 't-price-s')}
        <span class="t-caption2 dim">${product.unit}</span>
      </span>
      ${soldOut ? `<span class="stepper stepper--sold-out">${t('soldOut')}</span>` : stepper(product)}
    </div>
  </div>`;
}

export const section = (title, body, link) => `
  <section class="section">
    <div class="section__head">
      <h2 class="t-title3">${title}</h2>
      ${link ? `<button class="section__link" data-go="${link.to}">${link.label}</button>` : ''}
    </div>
    ${body}
  </section>`;

export const eyebrowHead = (eyebrow, title) => `
  <div class="col gap-xs">
    <p class="t-eyebrow dim">${eyebrow}</p>
    <h2 class="t-title2">${title}</h2>
  </div>`;

/* ── Toast ─────────────────────────────────────────────────────────────────── */

/**
 * The account avatar, in one place because it appears in the app header and on the You tab and
 * those two were drifting already. Falls back to a monogram rather than a stock silhouette:
 * a grey head-and-shoulders is a placeholder pretending to be a person.
 */
export function avatar(size = 34, { photo = state.avatar, name = state.name } = {}) {
  const initial = (name || 'A')[0].toUpperCase();
  if (photo) {
    return `<img class="avatar" src="${photo}" alt="" width="${size}" height="${size}"
      style="width:${size}px;height:${size}px" />`;
  }
  return `<span class="avatar avatar--mono" aria-hidden="true"
    style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px">${initial}</span>`;
}

export function toast(message, action) {
  const host = document.getElementById('toast-host');
  const el = document.createElement('div');
  el.className = 'toast glass glass--pill';
  // Escaped here rather than at each call site. Toasts quote things the user typed — an
  // address label, a coupon code, a gift-card note — and one caller forgetting to escape is
  // all it takes for typed markup to render. No caller passes HTML deliberately.
  el.innerHTML = `<span>${escapeHtml(message)}</span>${
    action
      ? `<button class="t-caption brandc" data-toast-action>${escapeHtml(action.label)}</button>`
      : ''
  }`;
  if (action)
    el.querySelector('[data-toast-action]').addEventListener('click', () => {
      action.run();
      dismiss();
    });
  host.appendChild(el);

  const dismiss = () => {
    el.classList.add('toast--out');
    setTimeout(() => el.remove(), 200);
  };
  setTimeout(dismiss, action ? 4200 : 2600);
}

/* ── Sheet ─────────────────────────────────────────────────────────────────── */

let closeCurrentSheet = null;

/**
 * Bottom sheets, the way iOS presents a task that does not deserve a whole screen.
 * The scrim is dismissible and Escape works, because a sheet you cannot leave is a trap.
 */
export function sheet({ body, foot, onMount, height }) {
  closeSheet();
  const host = document.getElementById('sheet-host');
  const scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  const el = document.createElement('div');
  el.className = 'sheet';
  if (height) el.style.height = height;
  el.innerHTML = `<div class="sheet__grab"></div>
    <div class="sheet__body">${body}</div>
    ${foot ? `<div class="sheet__foot">${foot}</div>` : ''}`;

  host.append(scrim, el);
  scrim.addEventListener('click', closeSheet);

  const onKey = (event) => {
    if (event.key === 'Escape') closeSheet();
  };
  document.addEventListener('keydown', onKey);

  closeCurrentSheet = () => {
    document.removeEventListener('keydown', onKey);
    el.classList.add('sheet--out');
    scrim.style.opacity = '0';
    scrim.style.transition = 'opacity 180ms';
    setTimeout(() => {
      el.remove();
      scrim.remove();
    }, 200);
    closeCurrentSheet = null;
  };

  onMount?.(el);
  return el;
}

export function closeSheet() {
  closeCurrentSheet?.();
}

/* ── Add-to-cart flight ────────────────────────────────────────────────────── */

/**
 * The thumbnail flies to the cart along an arc rather than a straight line: a straight tween
 * reads as a computer moving a rectangle, an arc reads as something being tossed into a bag.
 */
export function flyToCart(fromEl, imageSrc) {
  const target = document.querySelector('[data-cart-anchor]');
  if (!fromEl || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const device = document.getElementById('device').getBoundingClientRect();
  const from = fromEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();

  const flyer = document.createElement('div');
  flyer.className = 'flyer';
  flyer.innerHTML = `<img src="${imageSrc}" alt="" />`;
  flyer.style.left = `${from.left - device.left + from.width / 2 - 23}px`;
  flyer.style.top = `${from.top - device.top + from.height / 2 - 23}px`;
  document.getElementById('fly-host').appendChild(flyer);

  const dx = to.left - from.left + (to.width - from.width) / 2;
  const dy = to.top - from.top + (to.height - from.height) / 2;

  flyer.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.34 - 70}px) scale(0.72)`,
        opacity: 0.95,
        offset: 0.5,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.24)`, opacity: 0.5 },
    ],
    { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  ).onfinish = () => {
    flyer.remove();
    target.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'cubic-bezier(0.34, 1.4, 0.4, 1)' },
    );
  };
}

/* ── Misc ──────────────────────────────────────────────────────────────────── */

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
