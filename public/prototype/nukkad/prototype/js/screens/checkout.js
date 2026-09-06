import { productById } from '../../data/catalog.js';
import { brandMark } from '../brands.js';
import { icon } from '../icons.js';
import {
  KHATA,
  RULES,
  bill,
  cartLines,
  clearCart,
  commit,
  couponApplies,
  eta,
  placeOrder,
  setQty,
  state,
} from '../store.js';
import {
  amount,
  deva,
  dietMark,
  price,
  productName,
  rupees,
  sheet,
  closeSheet,
  stepper,
  t,
  toast,
} from '../ui.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Cart, checkout and payment — where the fee argument is actually made.

   Reference points this is built against: a sub-₹99 basket carries about ₹54 in stacked fees on
   Blinkit and ₹55 on Instamart (delivery + small-cart + handling, before any surge). The CCPA
   fined Zepto ₹7 lakh for showing a ₹170 item that cost ₹177.40 at checkout, and for pre-ticking
   a membership in the cart. Nothing here is pre-ticked and nothing appears after this screen.
   ───────────────────────────────────────────────────────────────────────────── */

export function cart() {
  const b = bill();
  const [low, high] = eta();

  if (!b.lines.length) {
    return {
      html: `
        <div class="screen">
          <div class="navbar">
            <button class="navbar__back" data-back>${icon('back')}</button>
            <span class="t-title3">Your cart</span>
          </div>
          <div class="empty grow center">
            ${emptyJhola()}
            <p class="t-title3">Nothing in the jhola yet</p>
            <p class="t-footnote muted" style="max-width:28ch">
              Milk, atta, something for chai — the usual suspects are two taps away.
            </p>
            <button class="btn btn--primary" data-go="home">Start shopping</button>
          </div>
        </div>`,
    };
  }

  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <div class="col grow">
            <span class="t-title3">Your cart</span>
            <span class="t-caption2 dim">Arriving in ${low}–${high} ${t('min')}</span>
          </div>
        </div>

        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">
          ${
            b.savings > 0
              ? `
            <div class="banner banner--success">
              ${icon('sparkle', { size: 20 })}
              <span class="t-caption"><b>${rupees(b.savings)}</b> saved on this order</span>
            </div>`
              : ''
          }

          ${unlockBar(b)}

          <div class="col">
            ${b.lines.map(cartLine).join('')}
          </div>

          <button class="rowcard" data-coupons>
            <span class="row gap-md">
              <span class="brandc">${icon('ticket', { size: 20 })}</span>
              <span class="col" style="text-align:left">
                <span class="t-headline">${b.couponCode ? `${b.couponCode} applied` : 'Apply a coupon'}</span>
                <span class="t-caption2 ${b.couponCode ? 'success' : 'muted'}">
                  ${b.couponCode ? `You saved ${rupees(b.couponOff)}` : 'One code per order, no fine print'}
                </span>
              </span>
            </span>
            <span class="dim">${icon('chevron', { size: 16 })}</span>
          </button>

          <button class="rowcard" data-tip>
            <span class="col" style="text-align:left">
              <span class="t-headline">Tip your rider</span>
              <span class="t-caption2 muted">
                ${state.tip ? `${rupees(state.tip)} added · 100% goes to Ramesh` : 'Optional, and off by default'}
              </span>
            </span>
            <span class="t-caption brandc tap-44">${state.tip ? 'Change' : 'Add'}</span>
          </button>

          ${billBlock(b)}

          <p class="t-caption2 dim" style="text-align:center;max-width:32ch;margin:0 auto">
            Cancel free until we start packing. After that it is a two-tap chat, not a fee.
          </p>
        </div>

        <div class="chrome" style="position:static;padding:var(--space-md) var(--layout-screen-gutter) var(--space-lg);box-shadow:inset 0 1px 0 var(--border);background:var(--canvas)">
          <button class="btn btn--primary btn--pay btn--block" data-go="checkout">
            <span>${t('payNow')} ${rupees(b.total)}</span>
            <span class="row gap-xs t-subhead">Continue ${icon('chevron', { size: 16 })}</span>
          </button>
        </div>
      </div>`,
    mount: (root, go, ctx) => {
      root
        .querySelector('[data-coupons]')
        ?.addEventListener('click', () => openCoupons(ctx.rerender));
      root.querySelector('[data-tip]')?.addEventListener('click', () => openTip(ctx.rerender));
      root
        .querySelectorAll('[data-why]')
        .forEach((button) =>
          button.addEventListener('click', () => openBillExplainer(button.dataset.why)),
        );
    },
  };
}

function cartLine({ product, qty }) {
  return `
    <div class="row gap-md" style="padding:var(--space-md) 0;box-shadow:inset 0 -1px 0 var(--border)">
      <span class="thumb">
        <img src="${product.image}" alt="" />
      </span>
      <span class="col grow gap-xs" style="min-width:0">
        <span class="row gap-xs">${dietMark(product.diet)}
          <span class="t-subhead line-2 ${deva()}">${productName(product)}</span></span>
        <span class="t-caption2 dim">${product.unit}</span>
      </span>
      <span class="col gap-xs" style="align-items:flex-end;flex:none">
        ${price(product.price * qty, 't-price-s')}
        ${stepper(product)}
      </span>
    </div>`;
}

/**
 * One progress bar, showing the next thing the basket unlocks — free delivery, then the
 * Bachat tiers. Never a nag, and never more than one target at a time.
 */
function unlockBar(b) {
  let label;
  let pct;
  if (!b.freeDelivery) {
    label = `Add ${rupees(b.toFreeDelivery)} for free delivery`;
    pct = (b.itemTotal / RULES.freeDeliveryAbove) * 100;
  } else if (b.nextTier) {
    label = `Add ${rupees(b.nextTier.threshold - b.itemTotal)} to take ${rupees(b.nextTier.discount)} off`;
    pct = (b.itemTotal / b.nextTier.threshold) * 100;
  } else {
    label = 'Everything unlocked — free delivery and the full Bachat discount';
    pct = 100;
  }
  return `
    <div class="col gap-sm">
      <p class="t-caption ${pct >= 100 ? 'success' : 'muted'}">${label}</p>
      <div class="progress">
        <div class="progress__fill ${pct >= 100 ? 'progress__fill--done' : ''}" style="width:${Math.min(100, pct)}%"></div>
      </div>
    </div>`;
}

/** Expanded by default. A bill you have to tap to see is a bill with something to hide. */
function billBlock(b) {
  return `
    <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
      <div class="row between">
        <h3 class="t-title3">Bill</h3>
        <span class="t-caption2 dim">All in. Nothing added later.</span>
      </div>
      <div class="bill">
        <div class="bill__row">
          <span class="muted">${t('itemTotal')}</span><span>${rupees(b.itemTotal)}</span>
        </div>
        ${
          b.mrpSavings > 0
            ? `
          <div class="bill__row bill__row--save">
            <span class="muted">Savings on MRP</span><span>− ${rupees(b.mrpSavings)}</span>
          </div>`
            : ''
        }
        <div class="bill__row ${b.freeDelivery ? 'bill__row--free' : ''}">
          <span class="muted">${t('delivery')}
            <button class="bill__why" data-why="delivery" aria-label="Why this fee">?</button>
          </span>
          <span>${
            b.freeDelivery
              ? `<span class="bill__strike">${rupees(RULES.deliveryFee)}</span>${t('free')}`
              : rupees(b.delivery)
          }</span>
        </div>
        ${
          b.bachat > 0
            ? `
          <div class="bill__row bill__row--save">
            <span class="muted">Nukkad Bachat ${b.tier ? `(${b.tier.label})` : ''}</span>
            <span>− ${rupees(b.bachat)}</span>
          </div>`
            : ''
        }
        ${
          b.couponOff > 0
            ? `
          <div class="bill__row bill__row--save">
            <span class="muted">Coupon ${b.couponCode}</span><span>− ${rupees(b.couponOff)}</span>
          </div>`
            : ''
        }
        ${
          b.tip > 0
            ? `
          <div class="bill__row"><span class="muted">Rider tip</span><span>${rupees(b.tip)}</span></div>`
            : ''
        }
        <div class="bill__rule"></div>
        <div class="bill__row">
          <span class="bill__total">${t('total')}</span>
          <span class="bill__total">${rupees(b.total)}</span>
        </div>
      </div>

      <div class="row gap-md" style="padding:12px;border-radius:var(--radius-lg);background:var(--brand-tint)">
        ${icon('shield', { size: 20 })}
        <span class="t-caption2" style="color:var(--brand)">
          The same basket carries about ${rupees(b.rivalFees)} in handling, small-cart and surge fees
          elsewhere. Here that line does not exist.
        </span>
      </div>
    </div>`;
}

function openBillExplainer() {
  sheet({
    body: `
      <div class="col gap-lg" style="padding-bottom:var(--space-lg)">
        <h2 class="t-title2">Why one fee</h2>
        <p class="t-callout muted">
          Getting an order to your door costs money: a picker, a bag, a rider, a battery. We charge
          ₹30 for that below ₹99 and nothing above it. That is the entire fee structure.
        </p>
        <div class="col gap-md">
          <p class="t-eyebrow dim">What we will never add</p>
          ${[
            'Handling fee',
            'Platform fee',
            'Small-cart fee',
            'Rain fee',
            'High-demand surge',
            'Late-night fee',
          ]
            .map(
              (fee) => `<div class="row gap-md">
                <span class="dim" style="width:18px">${icon('close', { size: 16 })}</span>
                <span class="t-callout">${fee}</span>
              </div>`,
            )
            .join('')}
        </div>
        <p class="t-caption2 dim">
          When the store is slammed or it is pouring, the clock gets longer and we say so on the home
          screen. The price does not move.
        </p>
      </div>`,
  });
}

function openCoupons(rerender) {
  const b = bill();
  const entries = Object.entries(RULES.coupons);
  sheet({
    body: `
      <div class="col gap-lg">
        <h2 class="t-title2">Coupons</h2>
        <div class="col gap-md">
          ${entries
            .map(([code, coupon]) => {
              const ok = couponApplies(code);
              const active = state.coupon === code;
              const reason = coupon.expired
                ? 'Expired'
                : coupon.firstOrder && state.ordersPlaced > 0
                  ? 'First order only'
                  : `Add ${rupees(Math.max(0, coupon.min - b.itemTotal))} more`;
              return `
                <div class="row between gap-md" style="padding:14px;border-radius:var(--radius-xl);background:var(--surface);${ok ? '' : 'opacity:.55'}">
                  <div class="col gap-xs" style="min-width:0">
                    <span class="row gap-sm">
                      <span class="chip chip--outline t-caption2" style="font-family:'Bricolage';font-weight:700">${code}</span>
                    </span>
                    <span class="t-subhead">${coupon.label}</span>
                    ${ok ? '' : `<span class="t-caption2 dim">${reason}</span>`}
                  </div>
                  <button class="btn btn--sm ${active ? 'btn--secondary' : 'btn--primary'}"
                          data-coupon="${code}" ${ok ? '' : 'disabled'}>
                    ${active ? 'Remove' : 'Apply'}
                  </button>
                </div>`;
            })
            .join('')}
        </div>
        <p class="t-caption2 dim">
          Coupons are shown with the reason they do not apply, rather than failing silently at payment.
        </p>
      </div>`,
    onMount: (el) => {
      el.querySelectorAll('[data-coupon]').forEach((button) =>
        button.addEventListener('click', () => {
          const code = button.dataset.coupon;
          state.coupon = state.coupon === code ? null : code;
          commit();
          closeSheet();
          rerender();
          if (state.coupon) toast(`${code} applied · ${rupees(RULES.coupons[code].off)} off`);
        }),
      );
    },
  });
}

function openTip(rerender) {
  sheet({
    body: `
      <div class="col gap-lg">
        <h2 class="t-title2">Tip your rider</h2>
        <p class="t-callout muted">
          Every rupee goes to Ramesh, on top of the per-order rate we publish. Nothing is
          pre-selected, and you can also tip after delivery.
        </p>
        <div class="row gap-sm wrap">
          ${RULES.tipPresets
            .map(
              (value) =>
                `<button class="chip ${state.tip === value ? 'chip--on' : ''}" data-tip="${value}"
                  style="padding:12px 18px;font-size:15px">${rupees(value)}</button>`,
            )
            .join('')}
          <button class="chip ${state.tip === 0 ? 'chip--on' : ''}" data-tip="0"
                  style="padding:12px 18px;font-size:15px">No tip</button>
        </div>
      </div>`,
    onMount: (el) => {
      el.querySelectorAll('[data-tip]').forEach((button) =>
        button.addEventListener('click', () => {
          state.tip = Number(button.dataset.tip);
          commit();
          closeSheet();
          rerender();
        }),
      );
    },
  });
}

function emptyJhola() {
  return `
    <svg viewBox="0 0 160 160" width="132" height="132" aria-hidden="true">
      <path d="M28 12h104" stroke="var(--illo-ink2)" stroke-width="7" stroke-linecap="round"
            opacity=".38"/>
      <path d="M80 12v16" stroke="var(--illo-ink2)" stroke-width="6" stroke-linecap="round"
            opacity=".55"/>
      <path d="M52 56h56l7 78a10 10 0 0 1-10 11H55a10 10 0 0 1-10-11Z" fill="var(--illo-ink2)" opacity=".9"/>
      <path d="M62 56V44a18 18 0 0 1 36 0v12" stroke="var(--illo-ink2)" stroke-width="7" fill="none"
            stroke-linecap="round"/>
      <path d="M62 84h36" stroke="var(--illo-ink1)" stroke-width="6" stroke-linecap="round" opacity=".5"/>
    </svg>`;
}

/* ── Checkout ──────────────────────────────────────────────────────────────── */

export function checkout() {
  const b = bill();
  const [low, high] = eta();
  const address = state.address ?? { label: 'Home', line: 'Indiranagar, Bengaluru' };

  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Checkout</span>
        </div>
        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">

          <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <div class="row between">
              <span class="t-eyebrow dim">${t('deliverTo')}</span>
              <button class="t-caption brandc tap-44" data-go="location">Change</button>
            </div>
            <div class="row gap-md">
              <span class="brandc">${icon('pin', { size: 20 })}</span>
              <div class="col">
                <span class="t-headline">${address.label}</span>
                <span class="t-caption muted">${address.line}</span>
              </div>
            </div>
          </div>

          <div class="col gap-md">
            <p class="t-eyebrow dim">When</p>
            <div class="row gap-sm">
              <button class="chip chip--on" style="padding:12px 18px">Now · ${low}–${high} ${t('min')}</button>
              <button class="chip" style="padding:12px 18px" data-schedule>Schedule</button>
            </div>
          </div>

          <div class="col gap-md">
            <p class="t-eyebrow dim">Delivery instructions</p>
            <div class="row wrap gap-sm">
              ${[
                'Leave at the door',
                "Don't ring the bell",
                'Call on arrival',
                'Leave with security',
              ]
                .map(
                  (note) =>
                    `<button class="chip ${state.instructions.includes(note) ? 'chip--on' : ''}"
                      data-note="${note}">${note}</button>`,
                )
                .join('')}
            </div>
            <p class="t-caption2 dim">
              Your rider sees these before pickup and has to acknowledge them — the commonest
              complaint about every app in this category is that nobody reads them.
            </p>
          </div>

          <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <div class="bill">
              <div class="bill__row"><span class="muted">${t('itemTotal')}</span><span>${rupees(b.itemTotal)}</span></div>
              <div class="bill__row ${b.freeDelivery ? 'bill__row--free' : ''}">
                <span class="muted">${t('delivery')}</span>
                <span>${b.freeDelivery ? t('free') : rupees(b.delivery)}</span>
              </div>
              ${
                b.bachat + b.couponOff > 0
                  ? `
                <div class="bill__row bill__row--save">
                  <span class="muted">Discounts</span><span>− ${rupees(b.bachat + b.couponOff)}</span>
                </div>`
                  : ''
              }
              ${b.tip ? `<div class="bill__row"><span class="muted">Tip</span><span>${rupees(b.tip)}</span></div>` : ''}
              <div class="bill__rule"></div>
              <div class="bill__row"><span class="bill__total">${t('total')}</span><span class="bill__total">${rupees(b.total)}</span></div>
            </div>
          </div>
        </div>

        <div style="padding:var(--space-md) var(--layout-screen-gutter) var(--space-lg);box-shadow:inset 0 1px 0 var(--border)">
          <button class="btn btn--primary btn--pay btn--block" data-go="payment">
            <span>Choose payment</span>
            <span class="t-price-m">${rupees(b.total)}</span>
          </button>
        </div>
      </div>`,
    mount: (root, go, ctx) => {
      root.querySelectorAll('[data-note]').forEach((button) =>
        button.addEventListener('click', () => {
          const note = button.dataset.note;
          state.instructions = state.instructions.includes(note)
            ? state.instructions.filter((n) => n !== note)
            : [...state.instructions, note];
          commit();
          ctx.rerender();
        }),
      );
      root
        .querySelector('[data-schedule]')
        ?.addEventListener('click', () => toast('Scheduled slots open at 6 AM tomorrow'));
    },
  };
}

/* ── Payment ───────────────────────────────────────────────────────────────── */

/*
 * `mark` is a Simple Icons slug drawn in the brand's own colour; `network` puts a second mark
 * on the trailing edge, which is how a saved card is actually identified — issuing bank on the
 * left, scheme on the right. The rows that are not a third-party brand (our wallet, cash, add
 * a card) use the app's own icon set rather than borrowing someone else's mark.
 *
 * NPCI retires UPI Collect in February 2026, so every UPI row here is intent-based: the app
 * opens, you approve in it. Nothing on this screen can pull money without that.
 */
const methods = () => [
  {
    id: 'gpay',
    group: 'UPI',
    name: 'Google Pay',
    tag: 'Last used · UPI intent',
    mark: 'googlepay',
    recommended: true,
  },
  { id: 'phonepe', group: 'UPI', name: 'PhonePe', tag: 'UPI intent', mark: 'phonepe' },
  { id: 'paytm', group: 'UPI', name: 'Paytm', tag: 'UPI intent', mark: 'paytm' },
  { id: 'upi', group: 'UPI', name: 'Add another UPI ID', icon: 'plus' },
  {
    id: 'card',
    group: 'Cards',
    name: 'HDFC •••• 4821',
    tag: 'Tokenised · expires 09/28',
    mark: 'hdfcbank',
    network: 'visa',
  },
  // The accepted schemes, where a real sheet puts them: on the row that adds a new card.
  {
    id: 'addcard',
    group: 'Cards',
    name: 'Add a card',
    icon: 'plus',
    accepts: ['visa', 'mastercard'],
  },
  { id: 'wallet', group: 'Wallet', name: 'Nukkad Wallet', tag: '₹120 balance', icon: 'wallet' },
  {
    id: 'khata',
    group: 'Khata',
    name: 'Put it on the khata',
    tag: `${rupees(state.khata)} running · settles ${KHATA.settlesOn}`,
    icon: 'shop',
  },
  { id: 'cod', group: 'Cash', name: 'Cash on delivery', tag: 'Up to ₹1,500', icon: 'rupee' },
];

export function payment() {
  const b = bill();
  const METHODS = methods();
  const groups = [...new Set(METHODS.map((m) => m.group))];

  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <div class="col grow">
            <span class="t-title3">Pay ${rupees(b.total)}</span>
            <span class="t-caption2 dim">Same total as the cart. It has not moved.</span>
          </div>
        </div>

        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">
          ${groups
            .map(
              (group) => `
              <div class="col gap-sm">
                <p class="t-eyebrow dim">${group}</p>
                ${METHODS.filter((m) => m.group === group)
                  .map(
                    (method) => `
                    <button class="payrow" data-method="${method.id}"
                            role="radio" aria-checked="${method.recommended ?? false}">
                      <span class="payrow__logo ${method.mark ? 'payrow__logo--brand' : ''}">
                        ${method.mark ? brandMark(method.mark) : icon(method.icon, { size: 20 })}
                      </span>
                      <span class="col grow" style="min-width:0">
                        <span class="t-headline">${method.name}</span>
                        ${method.tag ? `<span class="t-caption2 muted">${method.tag}</span>` : ''}
                      </span>
                      ${method.network ? `<span class="payrow__network">${brandMark(method.network)}</span>` : ''}
                      ${
                        method.accepts
                          ? `<span class="payrow__accepts">${method.accepts
                              .map((n) => `<span class="payrow__network">${brandMark(n)}</span>`)
                              .join('')}</span>`
                          : ''
                      }
                      <span class="payrow__radio"></span>
                    </button>`,
                  )
                  .join('')}
              </div>`,
            )
            .join('')}

          <p class="t-caption2 dim" style="text-align:center">
            Card numbers are never stored — tokenised as the RBI requires.
          </p>
        </div>

        <div style="padding:var(--space-md) var(--layout-screen-gutter) var(--space-lg);box-shadow:inset 0 1px 0 var(--border)">
          <button class="btn btn--primary btn--pay btn--block" id="pay">
            <span>${t('placeOrder')}</span>
            <span class="t-price-m">${rupees(b.total)}</span>
          </button>
        </div>
      </div>`,
    mount: (root, go) => {
      let chosen = 'gpay';
      root.querySelectorAll('[data-method]').forEach((row) =>
        row.addEventListener('click', () => {
          chosen = row.dataset.method;
          root
            .querySelectorAll('[data-method]')
            .forEach((r) => r.setAttribute('aria-checked', String(r === row)));
        }),
      );
      // An explicit tap places the order. Zepto shipped a default that placed orders without
      // a confirmation step, and it did not go down well.
      root
        .querySelector('#pay')
        .addEventListener('click', () => go('processing', { method: chosen }));
    },
  };
}

export function processing(params) {
  const b = bill();
  const isUpi = ['gpay', 'phonepe', 'paytm', 'upi'].includes(params.method);
  return {
    html: `
      <div class="screen">
        <div class="grow col center gap-xl gutter" style="text-align:center">
          <div class="spinner"></div>
          <div class="col gap-sm center">
            <h1 class="t-title2">${isUpi ? 'Approve in your UPI app' : 'Confirming your payment'}</h1>
            <p class="t-callout muted" style="max-width:28ch">
              ${isUpi ? `A request for ${rupees(b.total)} is waiting.` : 'This takes a moment.'}
            </p>
          </div>
          <p class="t-caption2 dim">Do not close the app.</p>
        </div>
      </div>`,
    mount: (root, go) => {
      setTimeout(() => {
        const order = placeOrder(params.method);
        commit();
        go('placed', { id: order.id });
      }, 1700);
    },
  };
}

export function placed(params) {
  const order = state.orders.find((o) => o.id === params.id) ?? state.orders[0];
  if (!order) return { html: '<div class="screen"></div>', mount: (_, go) => go('home') };

  return {
    html: `
      <div class="screen">
        <div class="grow col center gap-lg gutter" style="text-align:center">
          <div style="width:96px;height:96px;border-radius:50%;background:var(--brand-tint);display:grid;place-items:center">
            <svg class="check-draw" viewBox="0 0 24 24" width="46" height="46" fill="none"
                 stroke="var(--brand)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          </div>

          <div class="col gap-sm center">
            <h1 class="t-large-title">Order placed</h1>
            <p class="t-callout muted">Arriving in about ${order.etaMinutes} minutes</p>
            <p class="t-caption2 dim tnum">${order.id}</p>
          </div>

          ${
            order.savings > 0
              ? `
            <div class="banner banner--success" style="text-align:left">
              ${icon('sparkle', { size: 20 })}
              <span class="t-caption">You saved ${rupees(order.savings)} on this order</span>
            </div>`
              : ''
          }

          <div class="banner banner--info" style="text-align:left">
            ${icon('clock', { size: 20 })}
            <span class="t-caption">
              Forgot something? You can add to this order until we seal the bag — no second delivery fee.
            </span>
          </div>
        </div>

        <div class="col gap-sm" style="padding:var(--space-md) var(--layout-screen-gutter) var(--space-xl)">
          <button class="btn btn--primary btn--block" data-go="track">${t('trackOrder')}</button>
          <button class="btn btn--ghost btn--block" data-go="home">Keep shopping</button>
        </div>
      </div>`,
  };
}
