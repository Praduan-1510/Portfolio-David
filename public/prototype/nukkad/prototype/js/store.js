import { productById } from '../data/catalog.js';

/* ─────────────────────────────────────────────────────────────────────────────
   State and business rules.

   The fee model here is the product argument. Zepto was fined ₹7 lakh by the CCPA for drip
   pricing; a sub-₹99 basket on Blinkit or Instamart carries roughly ₹54 in stacked fees
   (delivery + handling + small-cart, before surge). Refund friction and cancellation traps
   dominate their one-star reviews.

   So Nukkad charges exactly one fee, shows it from the first cart render, prints the payable
   amount on every button, and lets you cancel free until the order is packed.
   ───────────────────────────────────────────────────────────────────────────── */

export const RULES = {
  /** One fee line. No handling, platform, small-cart, rain, surge or late-night charge. Ever. */
  deliveryFee: 3000,
  freeDeliveryAbove: 9900,
  /** Auto-applied basket tiers. Instamart's Maxxsaver lifted its AOV from ₹460 to ~₹700. */
  bachat: [
    { threshold: 49900, discount: 5000, label: 'Bachat 1' },
    { threshold: 99900, discount: 12000, label: 'Bachat 2' },
  ],
  tipPresets: [1500, 2500, 4000],
  /** Never advertise under 8 minutes. The Labour Ministry pushed the industry off "10 minutes". */
  etaNormal: [10, 14],
  etaBusy: [20, 25],
  /** Circle: free delivery on every order, no threshold. */
  circlePlans: [
    { id: 'm1', months: 1, price: 9900, label: '1 month' },
    { id: 'm3', months: 3, price: 24900, label: '3 months', best: true },
    { id: 'm12', months: 12, price: 69900, label: '12 months' },
  ],
  coupons: {
    WELCOME100: { off: 10000, min: 29900, label: '₹100 off your first order', firstOrder: true },
    SAVE50: { off: 5000, min: 29900, label: '₹50 off on ₹299' },
    CHAI15: { off: 1500, min: 9900, label: '₹15 off at Tapri', category: 'tapri' },
    OLD2025: { off: 5000, min: 0, label: 'Expired last Diwali', expired: true },
  },
};

/*
 * The shop.
 *
 * This is the part the competitors structurally cannot copy. Zepto, Blinkit and Instamart
 * deliver from an anonymous dark store — by design, because the store is a warehouse and
 * naming it would only invite complaints. Nukkad is named after the street corner, so the
 * store is a *place*: it has a name, a person behind the counter, a distance you could walk,
 * and an opinion about what came in fresh this morning.
 *
 * Everything downstream of this — your usual basket, today's shelf, the khata — only makes
 * sense because the shop is a specific shop rather than a fulfilment node.
 */
export const SHOP = {
  name: 'Shankar Stores',
  keeper: 'Shankar Reddy',
  keeperSince: 1996,
  street: '100 Ft Road, Indiranagar',
  metres: 340,
  opens: 6,
  closes: 25, // 1 AM
  /** The kirana network is the supply story, and the reason the shop can be a real shop. */
  partners: 41,
  area: 'Indiranagar',
};

/**
 * The khata — the running tab every kirana in India has kept for its regulars for a century.
 *
 * This is the one mechanic in the whole app that a dark store cannot offer, because a khata is
 * extended by a shopkeeper to a neighbour he knows, not by a platform to a user ID. No
 * interest, a hard cap, settled once a week; if it is unpaid the tab simply closes rather than
 * compounding. It is deliberately small — this is a corner shop's trust, not a credit product.
 */
export const KHATA = {
  limit: 200000,
  settlesOn: 'Sunday',
};

/** What Shankar would actually say to you, depending on when you walk in. */
export function shopNote(hour = new Date().getHours()) {
  if (hour < 11)
    return {
      en: 'Milk came in at 5. Bread is still warm.',
      hi: 'दूध पाँच बजे आया। ब्रेड अभी गरम है।',
    };
  if (hour < 16)
    return {
      en: 'Coriander and chillies just arrived from the mandi.',
      hi: 'धनिया और मिर्ची अभी मंडी से आई है।',
    };
  if (hour < 21)
    return { en: 'Chai time. Tapri has samosas going.', hi: 'चाय का टाइम। तपरी पर समोसे हैं।' };
  return {
    en: 'Open till 1. Shout if you need something.',
    hi: 'एक बजे तक खुला हूँ। ज़रूरत हो तो बता देना।',
  };
}

export const shopIsOpen = (hour = new Date().getHours()) =>
  hour >= SHOP.opens || hour < SHOP.closes - 24;

/**
 * Your usual. A kirana does not make you browse a category grid — he knows what you buy and
 * packs it. Falls back to what this neighbourhood buys, so a first-time user gets the same
 * gesture rather than an empty state.
 */
const NEIGHBOURHOOD_USUAL = [
  'amul-taaza-500',
  'aashirvaad-atta-5kg',
  'farm-eggs-6',
  'tata-salt-1kg',
];

export function usualBasket() {
  const last = state.orders[0];
  const ids = last?.lines.length ? last.lines.map((line) => line.id) : NEIGHBOURHOOD_USUAL;
  const seen = new Set();
  return ids
    .filter((id) => !seen.has(id) && seen.add(id))
    .map((id) => productById.get(id))
    .filter(Boolean)
    .slice(0, 6);
}

/** True when the usual comes from this account's own history rather than the neighbourhood. */
export const usualIsYours = () => Boolean(state.orders[0]?.lines.length);

const listeners = new Set();
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('nukkad') ?? '{}');
  } catch {
    return {};
  }
})();

export const state = {
  screen: 'splash',
  params: {},
  lang: saved.lang ?? 'en',
  theme: saved.theme ?? 'light',
  glass: saved.glass ?? 'on',
  signedIn: saved.signedIn ?? false,
  name: saved.name ?? '',
  phone: saved.phone ?? '',
  address: saved.address ?? null,
  circle: saved.circle ?? false,
  cart: saved.cart ?? {},
  coupon: saved.coupon ?? null,
  tip: saved.tip ?? 0,
  instructions: saved.instructions ?? [],
  orders: saved.orders ?? [],
  activeOrder: saved.activeOrder ?? null,
  busy: false,
  orderSpeed: 1,
  history: [],
  ordersPlaced: saved.ordersPlaced ?? 0,
  /** Paise currently on the tab at the shop. */
  khata: saved.khata ?? 34000,
  /** Optional, and asked for one purpose each — see the profile sheet. */
  email: saved.email ?? '',
  dob: saved.dob ?? '',
  /**
   * A 256px WebP data URL, or '' for the monogram. Kept in the same localStorage blob as
   * everything else, which is the honest version of what this prototype can promise: the
   * photo never leaves the device because there is nowhere for it to go.
   */
  avatar: saved.avatar ?? '',
};

function persist() {
  const { screen, params, history, busy, orderSpeed, ...keep } = state;
  try {
    localStorage.setItem('nukkad', JSON.stringify(keep));
  } catch {
    /* private window */
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function commit() {
  persist();
  listeners.forEach((fn) => fn());
}

/* ── Cart ──────────────────────────────────────────────────────────────────── */

export const cartLines = () =>
  Object.entries(state.cart)
    .map(([id, qty]) => ({ product: productById.get(id), qty }))
    .filter((line) => line.product);

export const cartCount = () => Object.values(state.cart).reduce((n, q) => n + q, 0);

export function setQty(id, qty) {
  const product = productById.get(id);
  if (!product) return;
  const capped = Math.max(0, Math.min(qty, product.maxQty));
  if (capped === 0) delete state.cart[id];
  else state.cart[id] = capped;
  // A coupon that no longer qualifies is dropped rather than silently ignored at pay time.
  if (state.coupon && !couponApplies(state.coupon)) state.coupon = null;
  commit();
}

export const addToCart = (id) => setQty(id, (state.cart[id] ?? 0) + 1);
export const qtyOf = (id) => state.cart[id] ?? 0;

export function clearCart() {
  state.cart = {};
  state.coupon = null;
  state.tip = 0;
  commit();
}

/* ── The bill ──────────────────────────────────────────────────────────────── */

function couponApplies(code) {
  const coupon = RULES.coupons[code];
  if (!coupon || coupon.expired) return false;
  if (coupon.firstOrder && state.ordersPlaced > 0) return false;
  const lines = cartLines();
  const base = coupon.category
    ? lines.filter((l) => l.product.categoryId === coupon.category)
    : lines;
  const total = base.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  return total >= coupon.min;
}

export { couponApplies };

/**
 * The whole bill, computed in one place. Every surface that shows an amount reads from here,
 * which is how the number on the button can be guaranteed to match the number in the summary.
 */
export function bill() {
  const lines = cartLines();
  const itemTotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + l.product.mrp * l.qty, 0);
  const mrpSavings = mrpTotal - itemTotal;

  const freeDelivery = state.circle || itemTotal >= RULES.freeDeliveryAbove;
  const delivery = freeDelivery ? 0 : RULES.deliveryFee;

  // Highest tier the basket has already cleared.
  const tier = [...RULES.bachat].reverse().find((t) => itemTotal >= t.threshold) ?? null;
  const bachat = tier?.discount ?? 0;

  const coupon = state.coupon && couponApplies(state.coupon) ? RULES.coupons[state.coupon] : null;
  const couponOff = coupon ? Math.min(coupon.off, itemTotal) : 0;

  const total = Math.max(0, itemTotal + delivery - bachat - couponOff + state.tip);

  // What the same basket would cost on a competitor's fee stack. Used by the bill explainer.
  const rivalFees = itemTotal >= 19900 ? 900 : 3000 + 2000 + 900;

  const nextTier = RULES.bachat.find((t) => itemTotal < t.threshold);
  const toFreeDelivery = freeDelivery ? 0 : RULES.freeDeliveryAbove - itemTotal;

  return {
    lines,
    itemTotal,
    mrpSavings,
    delivery,
    freeDelivery,
    bachat,
    tier,
    coupon,
    couponCode: coupon ? state.coupon : null,
    couponOff,
    tip: state.tip,
    total,
    rivalFees,
    nextTier,
    toFreeDelivery,
    savings: mrpSavings + bachat + couponOff + (freeDelivery ? RULES.deliveryFee : 0),
  };
}

export const eta = () => (state.busy ? RULES.etaBusy : RULES.etaNormal);

/* ── Orders ────────────────────────────────────────────────────────────────── */

/**
 * Order lifecycle. Cancellation is free right up to `packed` and the timer is visible — the
 * opposite of a window that closes silently within seconds of paying.
 */
export const ORDER_STAGES = [
  {
    id: 'placed',
    label: 'Order placed',
    hi: 'ऑर्डर मिल गया',
    seconds: 4,
    note: 'We have your order',
  },
  {
    id: 'packing',
    label: 'Packing your order',
    hi: 'पैक हो रहा है',
    seconds: 18,
    note: 'Picking from the shelf nearest you',
  },
  {
    id: 'packed',
    label: 'Packed and sealed',
    hi: 'पैक हो गया',
    seconds: 8,
    note: 'Sealed with a tamper tag',
  },
  {
    id: 'picked',
    label: 'Rider picked it up',
    hi: 'राइडर निकल गया',
    seconds: 8,
    note: 'Ramesh is on the way',
  },
  { id: 'onway', label: 'On the way', hi: 'रास्ते में', seconds: 28, note: 'Taking 100 Ft Road' },
  {
    id: 'near',
    label: 'Rider is 200 m away',
    hi: '200 मीटर दूर',
    seconds: 12,
    note: 'Almost at your gate',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    hi: 'पहुँच गया',
    seconds: 0,
    note: 'Handed over at the door',
  },
];

export function placeOrder(method) {
  const b = bill();
  const order = {
    id: `NK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    placedAt: Date.now(),
    lines: b.lines.map((l) => ({ id: l.product.id, qty: l.qty, price: l.product.price })),
    total: b.total,
    savings: b.savings,
    method,
    address: state.address,
    stage: 'placed',
    etaMinutes: eta()[1],
    rider: { name: 'Ramesh K', rating: 4.9, vehicle: 'EV scooter · KA 01 EV 4482' },
    otp: String(1000 + Math.floor(Math.random() * 8999)),
  };
  state.orders.unshift(order);
  state.activeOrder = order.id;
  state.ordersPlaced += 1;
  clearCart();
  return order;
}

export const activeOrder = () => state.orders.find((o) => o.id === state.activeOrder) ?? null;

export function advanceOrder(orderId, stage) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  order.stage = stage;
  if (stage === 'delivered') order.deliveredAt = Date.now();
  commit();
}

export function cancelOrder(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  order.stage = 'cancelled';
  order.cancelledAt = Date.now();
  if (state.activeOrder === orderId) state.activeOrder = null;
  commit();
}

/** Free until packed. After that it goes to support rather than charging a fee by surprise. */
export const canCancelFree = (order) => order && ['placed', 'packing'].includes(order.stage);

/* ── Preferences ───────────────────────────────────────────────────────────── */

export function setPref(key, value) {
  state[key] = value;
  if (key === 'theme') document.documentElement.dataset.theme = value;
  if (key === 'glass') document.documentElement.dataset.glass = value;
  commit();
}
