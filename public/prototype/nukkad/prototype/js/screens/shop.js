import { categories, products, productById } from '../../data/catalog.js';
import { icon } from '../icons.js';
import {
  KHATA,
  RULES,
  SHOP,
  addToCart,
  bill,
  commit,
  eta,
  qtyOf,
  setQty,
  shopIsOpen,
  shopNote,
  state,
  usualBasket,
  usualIsYours,
} from '../store.js';
import {
  deva,
  dietMark,
  price,
  priceWithMrp,
  productCard,
  productName,
  rupees,
  section,
  sheet,
  avatar,
  stepper,
  t,
  toast,
} from '../ui.js';

/* ── Header pieces shared by the shopping screens ──────────────────────────── */

export function appHeader({ search = true } = {}) {
  const [low, high] = eta();
  const address = state.address ?? { label: 'Home', line: 'Indiranagar, Bengaluru' };
  return `
    <header class="appbar" id="appbar">
      <div class="row between gap-md">
        <div class="row gap-sm">
          <span class="eta-pill glass glass--pill ${state.busy ? 'eta-pill--busy' : ''}">
            <span class="eta-pill__bolt">${icon('bolt', { size: 16 })}</span>
            <span class="t-eta">${low}–${high}</span>
            <span class="t-caption muted">${t('min')}</span>
          </span>
        </div>
        <button class="row gap-xs appbar__avatar" data-go="account" aria-label="Your account">
          ${avatar(34)}
        </button>
      </div>

      <button class="addr" data-go="location">
        <span class="col" style="min-width:0">
          <span class="t-caption2 dim">${t('deliverTo')}</span>
          <span class="row gap-xs">
            <span class="t-subhead addr__text">${address.label} · ${address.line}</span>
            <span class="dim">${icon('chevronDown', { size: 16 })}</span>
          </span>
        </span>
      </button>

      ${
        search
          ? `<button class="searchfield glass" data-go="search">
              ${icon('search', { size: 20 })}
              <span class="t-callout rotator grow" aria-hidden="true" data-rotator>
                <span>Search "doodh"</span>
              </span>
              <span class="sr-only">Search</span>
              <span class="dim">${icon('mic', { size: 20 })}</span>
            </button>`
          : ''
      }

      ${
        state.busy
          ? `<div class="banner">
              ${icon('clock', { size: 20 })}
              <span class="t-caption">Busy right now, so the clock is longer. We never add a surge fee.</span>
            </div>`
          : ''
      }
    </header>`;
}

/**
 * The shop, at the top of the home screen where the marketing headline used to be.
 *
 * The headline said "the corner shop, open right now" and then showed a category grid — which
 * is a claim, and reviewers discount claims. This is the claim made concrete: a shop with a
 * name, a keeper, a walkable distance, and something he wants to tell you today. It is the
 * one thing on this screen a dark-store app cannot put on its own.
 */
function shopHeader() {
  const note = shopNote();
  const open = shopIsOpen();
  return `
    <button class="shopcard" data-shop>
      <span class="shopcard__row">
        <span class="shopcard__mark">${shopfront()}</span>
        <span class="col grow" style="min-width:0">
          <span class="row gap-sm" style="align-items:baseline">
            <span class="t-title3">${SHOP.name}</span>
            <span class="t-caption2 ${open ? 'success' : 'muted'}">${open ? 'Open' : 'Closed'}</span>
          </span>
          <span class="t-caption2 dim">
            ${SHOP.street} · ${SHOP.metres} m · till ${SHOP.closes - 24} AM
          </span>
        </span>
        <span class="dim">${icon('chevron', { size: 16 })}</span>
      </span>
      <span class="shopcard__note ${deva()}">
        <span class="shopcard__quote">${state.lang === 'hi' ? note.hi : note.en}</span>
        <span class="t-caption2 dim">— ${SHOP.keeper}, behind the counter since ${SHOP.keeperSince}</span>
      </span>
    </button>`;
}

/** A shutter half up, in the illustration set's four inks. Small enough to sit in a row. */
function shopfront() {
  return `
    <svg viewBox="0 0 64 64" width="46" height="46" aria-hidden="true">
      <path d="M8 22 15 9h34l7 13Z" fill="var(--illo-ink3)"/>
      <rect x="14" y="26" width="36" height="28" rx="3" fill="var(--illo-ink2)" opacity=".2"/>
      <g stroke="var(--illo-ink2)" stroke-width="3" stroke-linecap="round" opacity=".55">
        <path d="M21 35h22"/><path d="M21 44h22"/>
      </g>
      <rect x="10" y="19" width="44" height="7" rx="3.5" fill="var(--illo-ink2)"/>
      <path d="M9 54h46" stroke="var(--illo-ink2)" stroke-width="3.5" stroke-linecap="round" opacity=".38"/>
    </svg>`;
}

/**
 * Your usual, in the slot a category grid normally occupies.
 *
 * This is the actual gesture a kirana makes: he knows the order and packs it. Every app in
 * this category buries reorder behind an Orders tab, because their store has no memory of
 * you — it is a warehouse. Falls back to what the neighbourhood buys so a first-time user
 * gets the same gesture rather than an empty state.
 */
function usualBlock() {
  const items = usualBasket();
  if (!items.length) return '';
  const total = items.reduce((sum, p) => sum + p.price, 0);
  const yours = usualIsYours();
  return `
    <section class="section">
      <div class="section__head">
        <h2 class="t-title3">${yours ? 'Your usual' : 'What this street buys'}</h2>
        <span class="t-caption2 dim">${items.length} items</span>
      </div>
      <div class="usual">
        <div class="usual__items">
          ${items
            .map(
              (product) => `
              <button class="usual__item" data-open="${product.id}" aria-label="${product.name}">
                <span class="thumb"><img src="${product.image}" alt="" loading="lazy" /></span>
              </button>`,
            )
            .join('')}
        </div>
        <button class="btn btn--primary btn--block" data-usual>
          <span>${yours ? 'Pack it again' : 'Pack this basket'}</span>
          <span class="t-price-m">${rupees(total)}</span>
        </button>
      </div>
    </section>`;
}

/** Who runs the shop, and the network behind it. */
function openShopSheet() {
  sheet({
    body: `
      <div class="col gap-lg">
        <div class="row gap-md">
          <span class="shopcard__mark">${shopfront()}</span>
          <div class="col grow">
            <h2 class="t-title2">${SHOP.name}</h2>
            <p class="t-caption muted">${SHOP.street} · ${SHOP.metres} m from you</p>
          </div>
        </div>

        <p class="t-callout">
          ${SHOP.keeper} has run this shop since ${SHOP.keeperSince}. Your order is picked off his
          shelves by someone who works here, not out of a warehouse on the edge of the city.
        </p>

        <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface-sunken)">
          <div class="row between">
            <span class="t-headline">${SHOP.partners} shops</span>
            <span class="t-caption2 dim">in ${SHOP.area}</span>
          </div>
          <p class="t-caption muted">
            Nukkad does not build dark stores. We stock the kirana shops that are already on your
            street, take the orders, and share the margin. The shop keeps its customers, we keep
            the ten minutes, and nobody has to pretend a warehouse is a neighbourhood.
          </p>
        </div>

        <div class="col gap-sm">
          <p class="t-eyebrow dim">Your khata</p>
          <div class="row between">
            <span class="t-title3">${rupees(state.khata)}</span>
            <span class="t-caption2 dim">settles ${KHATA.settlesOn} · limit ${rupees(KHATA.limit)}</span>
          </div>
          <p class="t-caption muted">
            The running tab every kirana has kept for its regulars for a hundred years. No
            interest, and if it goes unpaid the tab closes rather than growing. A warehouse
            cannot offer you this; a shopkeeper who knows you can.
          </p>
        </div>

        <div class="col gap-sm">
          <p class="t-eyebrow dim">Hours</p>
          <p class="t-callout">${SHOP.opens} AM to ${SHOP.closes - 24} AM, every day.</p>
        </div>
      </div>`,
  });
}

/**
 * A shelf tile. `fan` shows three packs from the shelf rather than one, which is what stops a
 * category reading as whichever product happened to be first in the array.
 */
function catTile(category, { fan = false } = {}) {
  const picks = products.filter((p) => p.categoryId === category.id).slice(0, 3);
  const label = state.lang === 'hi' && category.nameHi ? category.nameHi : category.name;
  const art =
    fan && picks.length >= 3
      ? ['a', 'b', 'c']
          .map(
            (slot, i) =>
              `<img class="cattile__fan cattile__fan--${slot}" src="${picks[i].image}" alt="" loading="lazy" />`,
          )
          .join('')
      : picks[0]
        ? `<img src="${picks[0].image}" alt="" loading="lazy" />`
        : '';
  return `
    <button class="cattile" data-cat="${category.id}">
      <span class="cattile__art">${art}</span>
      <span class="cattile__name ${deva()}">${label}</span>
    </button>`;
}

/* ── Home ──────────────────────────────────────────────────────────────────── */

const pick = (n, filter) => products.filter(filter).slice(0, n);

/** Everything this account has ordered before, most recent order first, de-duplicated. */
function reorderable() {
  const seen = new Set();
  return state.orders
    .flatMap((order) => order.lines.map((line) => line.id))
    .filter((id) => !seen.has(id) && seen.add(id))
    .map((id) => productById.get(id))
    .filter(Boolean);
}

export function home() {
  const bestsellers = pick(10, (p) => p.bestseller);
  const deals = pick(10, (p) => p.discount >= 10);
  const tapri = pick(8, (p) => p.categoryId === 'tapri');
  const mandi = pick(8, (p) => p.categoryId === 'fruits-veg');
  const shelves = categories.filter((c) => c.group !== 'services').slice(0, 8);

  // Placed between two product sections rather than under the shelf grid: an upsell reads as
  // an interstitial there, and it gives the page a non-product beat between the rail and grid.
  const circle = state.circle
    ? ''
    : `<div class="circlecard">
        <p class="t-eyebrow" style="color: rgba(251, 249, 245, 0.7)">Nukkad Circle</p>
        <p class="t-title2" style="color: #fbf9f5">Free delivery on everything</p>
        <p class="t-footnote" style="color: rgba(251, 249, 245, 0.78); max-width: 32ch">
          No threshold, 5% off on daily staples, and a written promise: if you do not save more
          than you paid, we credit the difference.
        </p>
        <button class="btn btn--sm" data-go="circle"
                style="background: #fbf9f5; color: var(--peacock-700); align-self: flex-start">
          From ₹29 for a month
        </button>
      </div>`;

  return {
    html: `
      <div class="screen">
        ${appHeader()}
        <div class="screen__scroll" id="scroll">
          ${shopHeader()}

          <div class="gutter col gap-xl">
            ${usualBlock()}

            ${section(
              'On the shelf today',
              `
              <p class="t-footnote muted" style="margin-top:-6px">
                Photographed at ${SHOP.name} this morning. Best-before is on every listing.
              </p>
              <div class="rail">${mandi.map(productCard).join('')}</div>`,
            )}

            ${section(
              'Shop by shelf',
              `
              <div class="grid4">
                ${shelves.map((category) => catTile(category)).join('')}
              </div>`,
              { to: 'categories', label: 'All shelves' },
            )}

            ${circle}

            ${
              /*
               * A grid, not another rail. This is the section people arrive already intending
               * to buy from, so it should show everything at once rather than make them swipe —
               * and four carousels stacked in a row is the thing that makes a home screen read
               * as generated. Grid, rail, card, grid, rail, band gives the page a rhythm.
               */
              section(
                'People here keep buying',
                `<div class="grid2">${bestsellers.slice(0, 4).map(productCard).join('')}</div>`,
                { to: 'categories', label: 'Browse all' },
              )
            }

            ${section('Deals worth the trip', `<div class="rail">${deals.map(productCard).join('')}</div>`)}

            <section class="band band--tapri">
              <div class="band__inner col gap-md">
                <div class="col gap-xs">
                  <p class="t-eyebrow" style="color:var(--kulhad-600)">Nukkad Tapri</p>
                  <h2 class="t-title2">Chai, and something<br/>to go with it.</h2>
                </div>
                <div class="rail">${tapri.map(productCard).join('')}</div>
              </div>
            </section>

            <div class="col gap-sm" style="padding:var(--space-lg) 0 var(--space-xxl)">
              <img src="../brand/logo/nukkad-mark.svg" alt="" width="30" height="30" style="opacity:.35" />
              <p class="t-caption2 dim" style="max-width:36ch">
                ${SHOP.name} is one of ${SHOP.partners} kirana shops Nukkad works with in
                ${SHOP.area}. We stock their shelves and share the margin — the shop stays the
                shop. A prototype; prices are illustrative.
              </p>
            </div>
          </div>
        </div>
      </div>`,
    mount: (root, go, ctx) => {
      root.querySelector('[data-shop]')?.addEventListener('click', openShopSheet);
      root.querySelector('[data-usual]')?.addEventListener('click', () => {
        const items = usualBasket();
        items.forEach((product) => setQty(product.id, Math.max(1, qtyOf(product.id))));
        commit();
        toast(`${items.length} items packed · ${rupees(bill().total)}`, {
          label: 'View cart',
          run: () => go('cart'),
        });
        ctx.rerender();
      });
    },
  };
}

/* ── Shelves index ─────────────────────────────────────────────────────────── */

export function categoriesScreen() {
  const groups = [
    { id: 'grocery', label: 'Everyday' },
    { id: 'snacks', label: 'Snacks & drinks' },
    { id: 'care', label: 'Care' },
    { id: 'household', label: 'Home' },
    { id: 'services', label: 'Nukkad services' },
  ];
  return {
    html: `
      <div class="screen">
        ${appHeader()}
        <div class="screen__scroll" id="scroll">
          <div class="gutter col gap-xl" style="padding-top:var(--space-sm)">
            ${groups
              .map((group) => {
                const list = categories.filter((c) => c.group === group.id);
                if (!list.length) return '';
                return section(
                  group.label,
                  `
                  <div class="grid3">
                    ${list.map((category) => catTile(category, { fan: true })).join('')}
                  </div>`,
                );
              })
              .join('')}
          </div>
        </div>
      </div>`,
  };
}

/* ── One shelf ─────────────────────────────────────────────────────────────── */

export function category(params) {
  const cat = categories.find((c) => c.id === params.id) ?? categories[0];
  const sub = params.sub ?? cat.subcategories[0].id;
  const list = products.filter((p) => p.categoryId === cat.id && p.subcategoryId === sub);

  return {
    html: `
      <div class="screen screen--flush">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <div class="col grow">
            <span class="t-title3 ${deva()}">${
              state.lang === 'hi' && cat.nameHi ? cat.nameHi : cat.name
            }</span>
            <span class="t-caption2 dim">${products.filter((p) => p.categoryId === cat.id).length} items</span>
          </div>
          <button class="navbar__icon" data-go="search" aria-label="Search">${icon('search', { size: 20 })}</button>
        </div>

        <div class="catalog">
          <nav class="catalog__rail" aria-label="Sub-shelves">
            ${cat.subcategories
              .map((s) => {
                const sample = products.find((p) => p.subcategoryId === s.id);
                return `
                  <button data-sub="${s.id}" aria-current="${s.id === sub}">
                    <span class="thumb thumb--sm">
                      ${sample ? `<img src="${sample.image}" alt="" loading="lazy"/>` : ''}
                    </span>
                    <span>${s.name}</span>
                  </button>`;
              })
              .join('')}
          </nav>

          <div class="catalog__grid" id="scroll">
            ${
              list.length
                ? `<div class="grid2">${list.map(productCard).join('')}</div>`
                : `<div class="empty">
                     <p class="t-title3">Nothing on this shelf yet</p>
                     <p class="t-footnote muted">We stock what the neighbourhood asks for. Tell us what is missing.</p>
                   </div>`
            }
          </div>
        </div>
      </div>`,
    mount: (root, go) => {
      root
        .querySelectorAll('[data-sub]')
        .forEach((button) =>
          button.addEventListener('click', () =>
            go('category', { id: cat.id, sub: button.dataset.sub }),
          ),
        );
    },
  };
}

/* ── Search ────────────────────────────────────────────────────────────────── */

/**
 * Hinglish is how people actually search an Indian grocery app: "doodh", not "milk".
 * Zepto runs a language model over the query to handle this; a synonym table gets a prototype
 * most of the way and shows the intent.
 */
const SYNONYMS = {
  doodh: 'milk',
  dudh: 'milk',
  atta: 'atta flour',
  chawal: 'rice',
  chini: 'sugar',
  cheeni: 'sugar',
  namak: 'salt',
  anda: 'egg',
  ande: 'egg',
  pyaz: 'onion',
  pyaaz: 'onion',
  aloo: 'potato',
  tamatar: 'tomato',
  dhaniya: 'coriander',
  mirch: 'chilli',
  adrak: 'ginger',
  chai: 'tea',
  paani: 'water',
  biscuit: 'biscuits',
  sabun: 'soap',
  tel: 'oil',
  dahi: 'curd',
  makkhan: 'butter',
  kela: 'banana',
  seb: 'apple',
  nimbu: 'lemon',
  dawai: 'medicine',
  bread: 'bread',
};

const TRENDING = ['doodh', 'Maggi', 'atta', 'chai', 'eggs', 'Dettol'];

function searchProducts(query) {
  const raw = query.trim().toLowerCase();
  if (!raw) return [];
  const expanded = raw
    .split(/\s+/)
    .map((word) => SYNONYMS[word] ?? word)
    .join(' ');
  const terms = expanded.split(/\s+/).filter(Boolean);

  return products
    .map((product) => {
      const haystack =
        `${product.name} ${product.brand} ${product.unit} ${product.nameHi ?? ''}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (haystack.startsWith(term)) score += 5;
        else if (haystack.includes(term)) score += 3;
        else if (haystack.includes(term.slice(0, Math.max(3, term.length - 1)))) score += 1;
      }
      // Only nudge a product that already matched. Applied unconditionally, this half-point
      // put every bestseller above the `score > 0` filter, so a query matching nothing at all
      // still returned 19 "results" and the no-results state could never be reached.
      if (score > 0 && product.bestseller) score += 0.5;
      return { product, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((hit) => hit.product);
}

export function search() {
  return {
    html: `
      <div class="screen screen--flush">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <label class="searchfield" style="background:var(--surface-sunken);flex:1">
            ${icon('search', { size: 20 })}
            <input id="q" placeholder="Search for doodh, atta, chai…" autocomplete="off" />
          </label>
        </div>
        <div class="screen__scroll gutter" id="scroll" style="padding-top:var(--space-sm)">
          <div id="results">
            <div class="col gap-xl">
              <div class="col gap-md">
                <p class="t-eyebrow dim">Trending on this corner</p>
                <div class="row wrap gap-sm">
                  ${TRENDING.map((term) => `<button class="chip" data-term="${term}">${term}</button>`).join('')}
                </div>
                <p class="t-caption2 dim">
                  Type in Hindi if it is quicker — doodh, aloo, dhaniya all work.
                </p>
              </div>

              ${
                // An empty search screen is a wasted screen: the fastest path to a basket is
                // usually the thing you bought last week, not a query you have to type out.
                reorderable().length
                  ? section(
                      'You have bought these before',
                      `<div class="grid2">${reorderable().slice(0, 4).map(productCard).join('')}</div>`,
                    )
                  : ''
              }

              ${section(
                'Selling fast right now',
                `<div class="grid2">${pick(4, (p) => p.bestseller)
                  .map(productCard)
                  .join('')}</div>`,
              )}
            </div>
          </div>
        </div>
      </div>`,
    mount: (root, go, { rerender }) => {
      const input = root.querySelector('#q');
      const results = root.querySelector('#results');
      input.focus();

      const paint = () => {
        const query = input.value;
        if (!query.trim()) {
          rerender();
          return;
        }
        const hits = searchProducts(query);
        const matched = SYNONYMS[query.trim().toLowerCase()];
        results.innerHTML = hits.length
          ? `<div class="col gap-md">
              <p class="t-caption muted">
                ${hits.length} result${hits.length === 1 ? '' : 's'}
                ${matched ? ` · reading "<b>${query.trim()}</b>" as ${matched}` : ''}
              </p>
              <div class="grid2">${hits.map(productCard).join('')}</div>
            </div>`
          : `<div class="empty">
              <p class="t-title3">Nothing for "${query.trim()}"</p>
              <p class="t-footnote muted" style="max-width:30ch">
                Try the Hindi word, or tell us to stock it — we read every request.
              </p>
              <button class="btn btn--secondary btn--sm" data-request>Request this item</button>
            </div>`;
      };

      input.addEventListener('input', paint);
      root.querySelectorAll('[data-term]').forEach((button) =>
        button.addEventListener('click', () => {
          input.value = button.dataset.term;
          paint();
        }),
      );

      // The no-results state is rendered by `paint`, so its button does not exist at mount
      // time. Delegating means the request actually goes somewhere instead of being a button
      // that looks live and does nothing.
      results.addEventListener('click', (event) => {
        if (!event.target.closest('[data-request]')) return;
        const wanted = input.value.trim();
        toast(`Noted — we will look for "${wanted}"`, {
          label: 'Undo',
          run: () => toast('Request withdrawn'),
        });
        input.value = '';
        rerender();
      });
    },
  };
}

/* ── Product detail ────────────────────────────────────────────────────────── */

/**
 * Opened as a sheet so the shelf stays visible behind it — a decision that should take five
 * seconds, not a page load. The details block is the differentiator: shelf life, origin and the
 * FSSAI line are legally required on the pack and quietly missing from most apps.
 */
export function openProduct(id, onChange) {
  const product = productById.get(id);
  if (!product) return;
  const [low, high] = eta();

  const el = sheet({
    height: '82%',
    body: `
      <div class="col gap-lg">
        <div style="aspect-ratio:1.3;border-radius:var(--radius-xl);background:var(--surface-sunken);display:grid;place-items:center;overflow:hidden">
          <img src="${product.image}" alt="${product.name}" style="width:82%;height:92%;object-fit:contain" />
        </div>

        <div class="col gap-sm">
          <div class="row gap-sm">
            ${dietMark(product.diet)}
            <span class="t-caption2 dim">${product.brand}</span>
            ${product.discount >= 10 ? `<span class="badge badge--deal">${product.discount}% OFF</span>` : ''}
          </div>
          <h2 class="t-title2 ${deva()}">${productName(product)}</h2>
          <p class="t-callout muted">${product.unit}</p>
        </div>

        <div class="row between">
          ${priceWithMrp(product.price, product.mrp, 't-price-l')}
          <span class="eta-pill glass glass--pill">
            <span class="eta-pill__bolt">${icon('bolt', { size: 16 })}</span>
            <span class="t-caption">${low}–${high} ${t('min')}</span>
          </span>
        </div>
        <p class="t-caption2 dim" style="margin-top:-10px">Inclusive of all taxes</p>

        ${
          product.shelfLifeDays
            ? `<div class="banner banner--success">
                ${icon('leaf', { size: 20 })}
                <span class="t-caption">
                  Best before ${product.shelfLifeDays} day${product.shelfLifeDays === 1 ? '' : 's'} from today.
                  We will not send you anything past a third of its life.
                </span>
              </div>`
            : ''
        }

        <div class="col gap-md">
          <h3 class="t-title3">Details</h3>
          <div class="bill">
            <div class="bill__row"><span class="muted t-footnote">Brand</span><span class="t-footnote">${product.brand}</span></div>
            <div class="bill__row"><span class="muted t-footnote">Net quantity</span><span class="t-footnote">${product.unit}</span></div>
            <div class="bill__row"><span class="muted t-footnote">Country of origin</span><span class="t-footnote">India</span></div>
            <div class="bill__row"><span class="muted t-footnote">Marketed by</span><span class="t-footnote">${product.brand} India Ltd.</span></div>
            <div class="bill__row"><span class="muted t-footnote">FSSAI licence</span><span class="t-footnote tnum">10012011000${product.id.length}23</span></div>
          </div>
          <p class="t-caption2 dim">
            Legal Metrology and FSSAI require this block on the pack. We print it here too, so you
            do not have to wait for the box to arrive to read it.
          </p>
        </div>
      </div>`,
    foot: `
      <div class="row between gap-md">
        <div class="col">
          ${priceWithMrp(product.price, product.mrp, 't-price-m')}
          <span class="t-caption2 dim">${product.unit}</span>
        </div>
        <div id="pdp-stepper" style="min-width:132px">
          ${
            qtyOf(product.id) === 0
              ? `<button class="btn btn--primary" style="width:100%" data-add="${product.id}">Add to cart</button>`
              : stepper(product)
          }
        </div>
      </div>`,
  });

  el.addEventListener('click', (event) => {
    const target = event.target.closest('[data-add],[data-inc],[data-dec]');
    if (target) setTimeout(() => onChange?.(), 0);
  });
}
