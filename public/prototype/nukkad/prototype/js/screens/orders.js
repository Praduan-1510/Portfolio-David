import { productById } from '../../data/catalog.js';
import { icon } from '../icons.js';
import {
  ORDER_STAGES,
  RULES,
  activeOrder,
  advanceOrder,
  canCancelFree,
  cancelOrder,
  commit,
  setPref,
  setQty,
  state,
} from '../store.js';
import { avatar, closeSheet, deva, plural, rupees, sheet, t, toast } from '../ui.js';
import { accountSummary, openProfile } from './account.js';

/* ─────────────────────────────────────────────────────────────────────────────
   After the order.

   The tracking screen is where every app in this category loses its customers: an ETA that only
   ever counts down, a rider marked "arrived" from 300 metres away, and a cancel button that
   vanished while you were reading the confirmation. This one shows a visible free-cancel timer,
   only says "arrived" at the door, and credits you automatically when it runs late.
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * The map is drawn, not fetched. A tile provider would need a key, would look different on every
 * platform, and would drag Google's grey into a warm palette. Hand-drawing it means the streets
 * are on-brand, the route is deterministic, and the whole thing works offline.
 */
/**
 * The neighbourhood, drawn rather than fetched: no API key, no tiles to load, identical in
 * light and dark, and on-brand in a way a grey Google raster never is.
 *
 * The land is drawn first, the roads are painted on top of it, and the buildings sit inside the
 * blocks the roads leave behind. The earlier version inverted that — white cards on a warm
 * ground, roads implied by the gaps — and it read as a grid of rounded rectangles, because that
 * is what it was. Roads have to be objects for a map to look like a map.
 */
function neighbourhoodMap() {
  const buildings = [
    // Each block gets an irregular footprint. A block drawn as one slab reads as a building,
    // not as a city block, and the whole map flattens.
    [14, 16, 36, 42],
    [56, 16, 38, 24],
    [56, 46, 38, 30],
    [14, 64, 24, 42],
    [44, 82, 50, 24],
    [128, 14, 46, 32],
    [180, 14, 52, 24],
    [128, 52, 32, 54],
    [166, 52, 34, 34],
    [206, 44, 26, 62],
    [267, 16, 44, 30],
    [317, 16, 40, 42],
    [363, 16, 26, 50],
    [267, 52, 30, 54],
    [303, 64, 50, 42],
    [14, 148, 40, 36],
    [60, 148, 34, 50],
    [14, 190, 26, 64],
    [46, 204, 48, 50],
    [267, 148, 50, 32],
    [323, 148, 34, 44],
    [363, 148, 26, 56],
    [267, 186, 36, 68],
    [309, 198, 44, 56],
    [359, 210, 30, 44],
    [14, 292, 36, 40],
    [56, 292, 38, 26],
    [56, 324, 38, 34],
    [14, 338, 26, 48],
    [46, 364, 48, 24],
    [172, 292, 60, 38],
    [128, 292, 38, 22],
    [128, 358, 32, 30],
    [172, 338, 36, 32],
    [214, 338, 18, 50],
    [267, 292, 46, 34],
    [319, 292, 38, 44],
    [363, 292, 26, 52],
    [267, 332, 34, 54],
    [307, 342, 48, 44],
    [361, 350, 28, 36],
  ];

  return `
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <!-- Land. -->
      <rect width="400" height="400" fill="var(--surface-sunken)"/>

      <g fill="var(--text)" opacity=".08">
        ${buildings.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`).join('')}
      </g>

      <!-- The park, so there is a landmark that is not another building. -->
      <rect x="124" y="143" width="113" height="117" rx="6" fill="var(--success-bg)"/>
      <g fill="var(--veg)" opacity=".38">
        <circle cx="152" cy="176" r="13"/><circle cx="192" cy="198" r="17"/><circle cx="216" cy="168" r="10"/>
        <circle cx="146" cy="216" r="9"/>
      </g>

      <!-- Roads, painted over the land. Wider for the arterial road everyone navigates by. -->
      <g stroke="var(--surface)" fill="none" stroke-linecap="square">
        <path d="M0 128H400" stroke-width="30"/>
        <path d="M0 271H400" stroke-width="22"/>
        <path d="M111 0V400" stroke-width="22"/>
        <path d="M250 0V400" stroke-width="22"/>
      </g>
      <path d="M0 128H400" stroke="var(--border-strong)" stroke-width="1.5" fill="none"
            stroke-dasharray="7 9" opacity=".5"/>

      <!-- The Nukkad itself: the corner parcel the store stands on. -->
      <rect x="124" y="316" width="42" height="38" rx="4" fill="var(--brand-tint)"/>

      <g font-family="Plex, sans-serif" fill="var(--text-tertiary)" font-size="9">
        <text x="200" y="119" text-anchor="middle" letter-spacing="1.4">100 FT ROAD</text>
        <text x="181" y="248" text-anchor="middle">Defence Colony Park</text>
        <text x="60" y="276" text-anchor="middle" letter-spacing="1.2">12TH MAIN</text>
      </g>

      <!-- The rider's path. Drawn on the roads now, rather than across them. -->
      <path d="M111 334 L111 271 L250 271 L250 92"
            stroke="var(--brand)" stroke-width="4" fill="none" stroke-linecap="round"
            stroke-linejoin="round" stroke-dasharray="8 8" opacity=".45"/>
    </svg>`;
}

const ROUTE = [
  [111, 334],
  [111, 271],
  [250, 271],
  [250, 92],
];

/** Walks the polyline so the marker follows the street rather than cutting across buildings. */
function pointAt(progress) {
  const lengths = ROUTE.slice(1).map(([x, y], i) => Math.hypot(x - ROUTE[i][0], y - ROUTE[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let travelled = progress * total;
  for (let i = 0; i < lengths.length; i += 1) {
    if (travelled <= lengths[i]) {
      const ratio = lengths[i] === 0 ? 0 : travelled / lengths[i];
      return [
        ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * ratio,
        ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * ratio,
      ];
    }
    travelled -= lengths[i];
  }
  return ROUTE[ROUTE.length - 1];
}

export function track() {
  const order = activeOrder() ?? state.orders[0];
  if (!order || order.stage === 'cancelled') {
    return {
      html: `<div class="screen"><div class="empty grow center">
        <p class="t-title3">No order on the way</p>
        <button class="btn btn--primary" data-go="home">Start an order</button>
      </div></div>`,
    };
  }

  const stageIndex = ORDER_STAGES.findIndex((s) => s.id === order.stage);

  return {
    html: `
      <div class="screen screen--flush">
        <div class="map">
          ${neighbourhoodMap()}
          <div class="map__pin" style="left:27.7%;top:83.5%">
            <span class="row center" style="width:30px;height:30px;border-radius:50%;background:var(--kulhad-500);color:#fff">
              ${icon('shop', { size: 20 })}
            </span>
          </div>
          <div class="map__pin" style="left:62.5%;top:23%">
            <span class="row center" style="width:30px;height:30px;border-radius:50%;background:var(--ink-800);color:#fff">
              ${icon('pin', { size: 20 })}
            </span>
          </div>
          <div class="map__rider" id="rider">${icon('scooter', { size: 20 })}</div>

          <button class="map__overlay glass glass--pill glass--clear" data-back
                  style="width:44px;height:44px;display:grid;place-items:center;left:var(--space-md);right:auto">
            ${icon('back', { size: 20 })}
          </button>
        </div>

        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding:var(--space-lg) var(--layout-screen-gutter) var(--space-xxl)">
          <div class="col gap-xs">
            <p class="t-eyebrow dim tnum">${order.id}</p>
            <h1 class="t-large-title" id="eta-line">Arriving in ${order.etaMinutes} minutes</h1>
            <p class="t-callout muted" id="stage-note">${ORDER_STAGES[Math.max(0, stageIndex)]?.note ?? ''}</p>
          </div>

          <div id="cancel-slot"></div>

          <div class="steps" id="steps">
            ${ORDER_STAGES.map(
              (stage, i) => `
              <div class="step ${i < stageIndex ? 'step--done' : ''} ${i === stageIndex ? 'step--now' : ''}"
                   data-stage="${stage.id}">
                <div class="step__gutter">
                  <span class="step__dot"></span>
                  ${i < ORDER_STAGES.length - 1 ? '<span class="step__line"></span>' : ''}
                </div>
                <div class="step__body">
                  <p class="t-subhead ${deva()}">${state.lang === 'hi' ? stage.hi : stage.label}</p>
                  <p class="t-caption2 dim">${stage.note}</p>
                </div>
              </div>`,
            ).join('')}
          </div>

          <div class="row gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <span class="row center" style="width:44px;height:44px;border-radius:50%;background:var(--brand-tint);color:var(--brand);font-weight:700">R</span>
            <div class="col grow">
              <span class="t-headline">${order.rider.name}</span>
              <span class="t-caption2 muted">★ ${order.rider.rating} · ${order.rider.vehicle}</span>
            </div>
            <button class="chip" data-call aria-label="Call rider">${icon('phone', { size: 20 })}</button>
            <button class="chip" data-chat aria-label="Message rider">${icon('chat', { size: 20 })}</button>
          </div>

          <div class="col gap-sm" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <div class="row between">
              <span class="t-subhead">Hand-over code</span>
              <span class="t-price-m tnum brandc">${order.otp}</span>
            </div>
            <p class="t-caption2 dim">
              Share this only when the bag is in your hand. Every delivery is also photographed at
              the door, so "marked delivered" can never be someone's word against yours.
            </p>
          </div>

          <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <span class="t-subhead">${order.lines.length} items · ${rupees(order.total)}</span>
            <div class="row gap-sm wrap">
              ${order.lines
                .map((line) => {
                  const product = productById.get(line.id);
                  return product
                    ? `<span style="width:44px;height:44px;border-radius:10px;background:var(--surface-sunken);display:grid;place-items:center;overflow:hidden">
                        <img src="${product.image}" alt="${product.name}" style="width:84%;height:84%;object-fit:contain"/>
                      </span>`
                    : '';
                })
                .join('')}
            </div>
          </div>

          <button class="rowcard" data-help>
            <span class="row gap-md"><span class="brandc">${icon('help', { size: 20 })}</span>
              <span class="t-headline">Something wrong?</span></span>
            <span class="dim">${icon('chevron', { size: 16 })}</span>
          </button>
        </div>
      </div>`,

    mount: (root, go, ctx) => {
      const rider = root.querySelector('#rider');
      const etaLine = root.querySelector('#eta-line');
      const stageNote = root.querySelector('#stage-note');
      const cancelSlot = root.querySelector('#cancel-slot');

      let index = ORDER_STAGES.findIndex((s) => s.id === order.stage);
      if (index < 0) index = 0;

      const place = (progress) => {
        const [x, y] = pointAt(progress);
        rider.style.left = `${(x / 400) * 100}%`;
        rider.style.top = `${(y / 400) * 100}%`;
      };

      const paintCancel = () => {
        if (order.stage === 'delivered') {
          cancelSlot.innerHTML = `
            <div class="banner banner--success">
              ${icon('check', { size: 20 })}
              <span class="t-caption">Delivered. Rate it and we will remember what you liked.</span>
            </div>`;
          return;
        }
        if (canCancelFree(order)) {
          cancelSlot.innerHTML = `
            <div class="row between gap-md" style="padding:12px 16px;border-radius:var(--radius-xl);background:var(--surface)">
              <span class="col">
                <span class="t-subhead">Cancel free</span>
                <span class="t-caption2 muted">Until we start sealing the bag</span>
              </span>
              <button class="btn btn--sm btn--secondary" data-cancel>Cancel order</button>
            </div>`;
          cancelSlot.querySelector('[data-cancel]').addEventListener('click', () => {
            cancelOrder(order.id);
            toast('Order cancelled · full refund to your UPI in 1–3 days');
            go('home');
          });
        } else {
          cancelSlot.innerHTML = `
            <p class="t-caption2 dim">
              The bag is sealed, so cancelling now goes through support — two taps, no fee.
            </p>`;
        }
      };

      const paintSteps = () => {
        root.querySelectorAll('.step').forEach((el, i) => {
          el.classList.toggle('step--done', i < index);
          el.classList.toggle('step--now', i === index);
        });
        const stage = ORDER_STAGES[index];
        stageNote.textContent = stage.note;
        const remaining = ORDER_STAGES.slice(index).reduce((sum, s) => sum + s.seconds, 0);
        const minutes = Math.max(1, Math.round(remaining / 6));
        etaLine.textContent =
          stage.id === 'delivered'
            ? 'Delivered'
            : stage.id === 'near'
              ? 'Rider is 200 m away'
              : `Arriving in ${minutes} minute${minutes === 1 ? '' : 's'}`;
        // The rider only starts moving once the bag is actually with them.
        const riderStages = ['picked', 'onway', 'near', 'delivered'];
        const at = riderStages.indexOf(stage.id);
        place(at < 0 ? 0 : at / (riderStages.length - 1));
        paintCancel();
      };

      paintSteps();

      const tick = () => {
        if (index >= ORDER_STAGES.length - 1) return;
        index += 1;
        advanceOrder(order.id, ORDER_STAGES[index].id);
        paintSteps();
        if (ORDER_STAGES[index].id === 'delivered') {
          toast('Delivered · photographed at your door');
          state.activeOrder = null;
          commit();
          return;
        }
        schedule();
      };

      let timer = null;
      const schedule = () => {
        clearTimeout(timer);
        const seconds = ORDER_STAGES[index].seconds / state.orderSpeed;
        timer = setTimeout(tick, seconds * 1000);
      };
      schedule();
      ctx.onLeave(() => clearTimeout(timer));

      root
        .querySelector('[data-call]')
        ?.addEventListener('click', () => toast('Calling Ramesh on a masked number'));
      root
        .querySelector('[data-chat]')
        ?.addEventListener('click', () => toast('“I’m at the gate” sent to Ramesh'));
      root.querySelector('[data-help]')?.addEventListener('click', openHelp);
    },
  };
}

function openHelp() {
  const issues = [
    ['Something is missing', 'Refunded to your UPI within minutes, no photo needed under ₹200.'],
    ['An item is damaged', 'Send one photo. Approved on the spot.'],
    ['It is running late', 'We credit ₹25 automatically past fifteen minutes. Nothing to claim.'],
    ['Wrong item delivered', 'We collect it at your door and refund on pickup.'],
    ['Talk to a person', 'Callback within ten minutes, seven days a week.'],
  ];
  sheet({
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">Something wrong?</h2>
          <p class="t-callout muted">Pick the issue. Most of these resolve without anyone typing.</p>
        </div>
        <div class="col">
          ${issues
            .map(
              ([title, body]) => `
              <button class="row-item" data-issue="${title}">
                <span class="col grow">
                  <span class="t-headline">${title}</span>
                  <span class="t-caption2 muted">${body}</span>
                </span>
                <span class="row-item__chev">${icon('chevron', { size: 16 })}</span>
              </button>`,
            )
            .join('')}
        </div>
        <p class="t-caption2 dim">
          Refunds go back to the way you paid, with the bank reference shown. Wallet credit is an
          option, never the default — that swap is the single biggest complaint about this category.
        </p>
      </div>`,
    onMount: (el) => {
      el.querySelectorAll('[data-issue]').forEach((button) =>
        button.addEventListener('click', () => {
          closeSheet();
          toast('₹48 refunded to your UPI · reference NK4821X');
        }),
      );
    },
  });
}

/* ── Order history ─────────────────────────────────────────────────────────── */

export function orders() {
  if (!state.orders.length) {
    return {
      html: `
        <div class="screen">
          <div class="navbar"><span class="t-title3">${t('orders')}</span></div>
          <div class="empty grow center">
            ${emptyShutter()}
            <p class="t-title3">No orders yet</p>
            <p class="t-footnote muted" style="max-width:28ch">
              Your first one gets ₹100 off with WELCOME100.
            </p>
            <button class="btn btn--primary" data-go="home">Start shopping</button>
          </div>
        </div>`,
    };
  }

  return {
    html: `
      <div class="screen">
        <div class="navbar"><span class="t-title3">${t('orders')}</span></div>
        <div class="screen__scroll gutter col gap-md" id="scroll" style="padding-top:var(--space-sm)">
          ${state.orders
            .map((order) => {
              const live = order.stage !== 'delivered' && order.stage !== 'cancelled';
              const label =
                order.stage === 'cancelled'
                  ? 'Cancelled'
                  : order.stage === 'delivered'
                    ? 'Delivered'
                    : (ORDER_STAGES.find((s) => s.id === order.stage)?.label ?? 'On the way');
              return `
                <button class="col gap-md" data-order="${order.id}"
                        style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface);width:100%;text-align:left">
                  <div class="row between">
                    <span class="chip ${live ? 'chip--on' : ''} t-caption2">${label}</span>
                    <span class="t-caption2 dim tnum">${order.id}</span>
                  </div>
                  <div class="row gap-sm">
                    ${order.lines
                      .slice(0, 4)
                      .map((line) => {
                        const product = productById.get(line.id);
                        return product
                          ? `<span style="width:40px;height:40px;border-radius:10px;background:var(--surface-sunken);display:grid;place-items:center;overflow:hidden">
                              <img src="${product.image}" alt="" style="width:84%;height:84%;object-fit:contain"/></span>`
                          : '';
                      })
                      .join('')}
                    ${order.lines.length > 4 ? `<span class="t-caption dim">+${order.lines.length - 4}</span>` : ''}
                  </div>
                  <div class="row between">
                    <span class="t-caption muted">${order.lines.length} items</span>
                    <span class="t-price-s">${rupees(order.total)}</span>
                  </div>
                  ${
                    live
                      ? `<span class="t-caption brandc">${t('trackOrder')} →</span>`
                      : `
                    <span class="row gap-sm">
                      <span class="btn btn--sm btn--secondary" data-reorder="${order.id}">Order again</span>
                    </span>`
                  }
                </button>`;
            })
            .join('')}
        </div>
      </div>`,
    mount: (root, go, ctx) => {
      root.querySelectorAll('[data-order]').forEach((card) =>
        card.addEventListener('click', (event) => {
          const order = state.orders.find((o) => o.id === card.dataset.order);
          if (event.target.closest('[data-reorder]')) {
            order.lines.forEach((line) => setQty(line.id, line.qty));
            toast(`${order.lines.length} items back in your cart`);
            ctx.rerender();
            return;
          }
          if (order.stage !== 'delivered' && order.stage !== 'cancelled') {
            state.activeOrder = order.id;
            commit();
            go('track');
            return;
          }
          // A finished order used to be a card that looked tappable and wasn't. Past orders are
          // where the receipt, the refund status and the reorder live, so they get a detail
          // sheet rather than silently swallowing the tap.
          openOrderDetail(order, ctx);
        }),
      );
    },
  };
}

/**
 * The receipt for a finished order. The refund block is the point of it: "unable to validate
 * your claim" and a five-day silence is the single most common complaint about every app in
 * this category, so a refund here shows its state, its destination and its reference number.
 */
function openOrderDetail(order, ctx) {
  const cancelled = order.stage === 'cancelled';
  const placed = new Date(order.placedAt);
  const when = `${placed.getDate()} ${placed.toLocaleString('en-IN', { month: 'short' })}, ${placed
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    .toUpperCase()}`;
  const itemTotal = order.lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const delivery = Math.max(0, order.total - itemTotal);

  sheet({
    height: '86%',
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <span class="row gap-sm">
            <span class="chip t-caption2">${cancelled ? 'Cancelled' : 'Delivered'}</span>
            <span class="t-caption2 dim tnum">${order.id}</span>
          </span>
          <h2 class="t-title2">${cancelled ? 'Order cancelled' : 'Delivered'}</h2>
          <p class="t-caption muted">${when} · ${order.address?.line ?? 'Indiranagar'}</p>
        </div>

        ${
          cancelled
            ? `<div class="banner banner--info">
                ${icon('shield', { size: 20 })}
                <span class="t-caption">
                  <b>${rupees(order.total)} refunded to source.</b> UPI refunds land in 1–3 days.
                  Reference ${order.id.replace('NK-', 'ARN')}.
                </span>
              </div>`
            : `<div class="banner banner--success">
                ${icon('check', { size: 20 })}
                <span class="t-caption">
                  Handed over at your door. You saved ${rupees(order.savings || 0)} on this order.
                </span>
              </div>`
        }

        <div class="col gap-sm">
          <p class="t-eyebrow dim">${order.lines.length} items</p>
          <div class="col">
            ${order.lines
              .map((line) => {
                const product = productById.get(line.id);
                if (!product) return '';
                return `
                  <div class="row gap-md" style="padding:var(--space-sm) 0">
                    <span class="thumb thumb--sm"><img src="${product.image}" alt="" /></span>
                    <span class="col grow" style="min-width:0">
                      <span class="t-subhead ${deva()} line-2">${product.name}</span>
                      <span class="t-caption2 dim">${product.unit} · ${line.qty} ×</span>
                    </span>
                    <span class="t-price-s tnum">${rupees(line.price * line.qty)}</span>
                  </div>`;
              })
              .join('')}
          </div>
        </div>

        <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface-sunken)">
          <div class="bill">
            <div class="bill__row"><span class="muted">Item total</span><span>${rupees(itemTotal)}</span></div>
            <div class="bill__row">
              <span class="muted">Delivery</span>
              <span class="${delivery ? '' : 'success'}">${delivery ? rupees(delivery) : 'FREE'}</span>
            </div>
            <div class="bill__row bill__row--total">
              <span>${cancelled ? 'Refunded' : 'Paid'}</span><span>${rupees(order.total)}</span>
            </div>
          </div>
          <p class="t-caption2 dim">Paid by ${order.method ?? 'UPI'}. Same price on every phone and account.</p>
        </div>
      </div>`,
    foot: `
      <div class="row gap-md">
        <button class="btn btn--secondary grow" data-invoice>Invoice</button>
        <button class="btn btn--primary grow" data-again>Order again</button>
      </div>`,
    onMount: (el) => {
      el.querySelector('[data-invoice]').addEventListener('click', () => {
        closeSheet();
        toast(`Invoice for ${order.id} sent to your email`);
      });
      el.querySelector('[data-again]').addEventListener('click', () => {
        order.lines.forEach((line) => setQty(line.id, line.qty));
        closeSheet();
        toast(`${order.lines.length} items back in your cart`);
        ctx.rerender();
      });
    },
  });
}

/* ── Account ───────────────────────────────────────────────────────────────── */

/**
 * An open shop with nothing on the shelves yet. The shutter is drawn rolled up rather than
 * down: "no orders yet" is an invitation, and a closed shutter would say the opposite.
 */
function emptyShutter() {
  return `
    <svg viewBox="0 0 160 160" width="132" height="132" aria-hidden="true">
      <path d="M22 46 38 22h84l16 24Z" fill="var(--illo-ink3)"/>
      <rect x="36" y="58" width="88" height="76" rx="5" fill="var(--illo-ink2)" opacity=".2"/>
      <g stroke="var(--illo-ink2)" stroke-width="5" stroke-linecap="round" opacity=".55">
        <path d="M50 84h60"/><path d="M50 108h60"/>
      </g>
      <rect x="28" y="44" width="104" height="15" rx="7.5" fill="var(--illo-ink2)"/>
      <path d="M24 134h112" stroke="var(--illo-ink2)" stroke-width="7" stroke-linecap="round"
            opacity=".38"/>
      <path d="M80 134v14" stroke="var(--illo-ink2)" stroke-width="6" stroke-linecap="round" opacity=".5"/>
    </svg>`;
}

export function account() {
  const summary = accountSummary();

  // Each row now goes to a real screen. They used to raise a toast saying the destination was
  // "specified in the FSD", which is a polite way of saying the tab was seven dead ends.
  const rows = [
    ['pin', 'Saved addresses', 'addresses', plural(summary.addresses, 'address', 'addresses')],
    ['wallet', 'Wallet & payments', 'wallet', rupees(summary.wallet)],
    ['gift', 'Gift cards', 'giftcards', summary.giftCards ? rupees(summary.giftCards) : ''],
    ['sparkle', 'Refer a neighbour', 'referral', 'Both get ₹100'],
    ['ticket', 'Coupons', 'coupons', `${summary.coupons} ready`],
    ['help', 'Help & support', 'help', ''],
    ['settings', 'Settings', 'settings', ''],
  ];

  return {
    html: `
      <div class="screen">
        <div class="navbar"><span class="t-title3">${t('you')}</span></div>
        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">

          <button class="row gap-md profilerow" data-profile>
            ${avatar(54)}
            <span class="col grow" style="min-width:0;text-align:left">
              <span class="t-title3 ${deva()}">${state.name || 'Aarav'}</span>
              <span class="t-caption muted tnum">+91 ${state.phone || '9880041234'}</span>
            </span>
            <span class="t-caption brandc">Edit</span>
          </button>

          ${
            state.circle
              ? `<div class="circlecard">
                  <p class="t-eyebrow" style="color:rgba(251,249,245,.7)">Nukkad Circle · active</p>
                  <p class="t-title2" style="color:#FBF9F5">You have saved ₹1,240</p>
                  <p class="t-footnote" style="color:rgba(251,249,245,.78)">
                    Since joining. If that ever drops below what you paid, we credit the difference.
                  </p>
                </div>`
              : `<button class="circlecard" data-go="circle" style="text-align:left;width:100%">
                  <p class="t-eyebrow" style="color:rgba(251,249,245,.7)">Nukkad Circle</p>
                  <p class="t-title2" style="color:#FBF9F5">Free delivery, no threshold</p>
                  <p class="t-footnote" style="color:rgba(251,249,245,.78)">From ₹29 for the first month →</p>
                </button>`
          }

          <div class="col">
            ${rows
              .map(
                ([iconName, label, route, meta]) => `
                <button class="row-item" data-go="${route}">
                  <span class="dim">${icon(iconName, { size: 20 })}</span>
                  <span class="t-headline grow">${label}</span>
                  ${meta ? `<span class="t-caption dim">${meta}</span>` : ''}
                  <span class="row-item__chev">${icon('chevron', { size: 16 })}</span>
                </button>`,
              )
              .join('')}
          </div>

          <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <p class="t-eyebrow dim">Appearance</p>
            <div class="row wrap gap-sm">
              <button class="chip ${state.theme === 'light' ? 'chip--on' : ''}" data-theme="light">Light</button>
              <button class="chip ${state.theme === 'dark' ? 'chip--on' : ''}" data-theme="dark">Dark</button>
              <button class="chip ${state.glass === 'off' ? 'chip--on' : ''}" data-glass>Reduce glass</button>
            </div>
            <p class="t-caption2 dim">
              Reduce glass turns every translucent surface opaque. It mirrors the iOS accessibility
              setting, and exists separately because most browsers do not report that setting at all.
            </p>
            <div class="row wrap gap-sm">
              <button class="chip ${state.lang === 'en' ? 'chip--on' : ''}" data-lang="en">English</button>
              <button class="chip deva ${state.lang === 'hi' ? 'chip--on' : ''}" data-lang="hi">हिन्दी</button>
            </div>
          </div>

          <p class="t-caption2 dim" style="text-align:center">
            Nukkad prototype · same price on every phone and every account
          </p>
        </div>
      </div>`,
    mount: (root, go, ctx) => {
      root.querySelector('[data-profile]')?.addEventListener('click', () => openProfile(ctx));
      root.querySelectorAll('[data-theme]').forEach((button) =>
        button.addEventListener('click', () => {
          setPref('theme', button.dataset.theme);
          ctx.rerender();
        }),
      );
      root.querySelector('[data-glass]')?.addEventListener('click', () => {
        setPref('glass', state.glass === 'off' ? 'on' : 'off');
        ctx.rerender();
      });
      root.querySelectorAll('[data-lang]').forEach((button) =>
        button.addEventListener('click', () => {
          setPref('lang', button.dataset.lang);
          ctx.rerender();
        }),
      );
    },
  };
}

/* ── Circle ────────────────────────────────────────────────────────────────── */

export function circle() {
  const benefits = [
    ['bolt', 'Free delivery on everything', 'No threshold, no minimum basket.'],
    ['sparkle', '5% off daily staples', 'Milk, atta, dal, eggs and about 1,500 more.'],
    ['clock', 'Priority when it is busy', 'Your order is picked first, not last.'],
    [
      'shield',
      'A savings guarantee',
      'Save less than you paid and we credit the difference. Automatically.',
    ],
  ];

  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Nukkad Circle</span>
        </div>
        <div class="screen__scroll gutter col gap-xl" id="scroll" style="padding-top:var(--space-sm)">

          <div class="col gap-sm">
            <h1 class="t-large-title">The regulars<br/>pay less.</h1>
            <p class="t-callout muted">
              One plan. No invite list, no tiers, and a cancel button that works in one tap.
            </p>
          </div>

          <div class="col gap-lg">
            ${benefits
              .map(
                ([iconName, title, body]) => `
                <div class="row gap-md">
                  <span class="brandc" style="flex:none">${icon(iconName, { size: 20 })}</span>
                  <div class="col gap-xs">
                    <span class="t-headline">${title}</span>
                    <span class="t-footnote muted">${body}</span>
                  </div>
                </div>`,
              )
              .join('')}
          </div>

          <div class="col gap-sm">
            ${RULES.circlePlans
              .map(
                (plan) => `
                <button class="payrow" data-plan="${plan.id}" role="radio"
                        aria-checked="${plan.best ? 'true' : 'false'}">
                  <span class="col grow">
                    <span class="t-headline">${plan.label}${plan.best ? ' · best value' : ''}</span>
                    <span class="t-caption2 muted">
                      ${rupees(Math.round(plan.price / plan.months))} a month
                    </span>
                  </span>
                  <span class="t-price-m">${rupees(plan.price)}</span>
                  <span class="payrow__radio"></span>
                </button>`,
              )
              .join('')}
          </div>

          <p class="t-caption2 dim">
            First month ₹29. Renews at the plan price, with a reminder three days before —
            never a silent charge.
          </p>
        </div>

        <div style="padding:var(--space-md) var(--layout-screen-gutter) var(--space-lg);box-shadow:inset 0 1px 0 var(--border)">
          <button class="btn btn--primary btn--block" id="join">Start for ₹29</button>
        </div>
      </div>`,
    mount: (root, go) => {
      root.querySelectorAll('[data-plan]').forEach((row) =>
        row.addEventListener('click', () => {
          root
            .querySelectorAll('[data-plan]')
            .forEach((r) => r.setAttribute('aria-checked', String(r === row)));
        }),
      );
      root.querySelector('#join').addEventListener('click', () => {
        state.circle = true;
        commit();
        toast('Welcome to the Circle · delivery is on us from here');
        go('home');
      });
    },
  };
}
