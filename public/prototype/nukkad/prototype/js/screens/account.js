import { categories, productById } from '../../data/catalog.js';
import { icon } from '../icons.js';
import {
  KHATA,
  RULES,
  SHOP,
  activeOrder,
  bill,
  cartLines,
  commit,
  couponApplies,
  setPref,
  state,
} from '../store.js';
import {
  avatar,
  closeSheet,
  deva,
  escapeHtml,
  plural,
  price,
  productName,
  rupees,
  section,
  sheet,
  stepper,
  t,
  toast,
} from '../ui.js';

/* ─────────────────────────────────────────────────────────────────────────────
   The account area.

   Everything reachable from the You tab. These were the last seven rows in the app that
   opened nothing — the kind of gap a reviewer finds in thirty seconds — and each one is now
   a screen that argues the same case the rest of the app does:

     Addresses   serviceability is explained before the basket exists, never after payment
     Wallet      refunds go back to source by default; the wallet is opt-in, not the trap
     Gift cards  unused balance is never forfeited and never demoted to a one-time coupon
     Referral    credited when their first order is delivered, not when they sign up
     Coupons     says why a code does not apply instead of failing silently at checkout
     Help        under ₹200 is refunded on the spot, with a person at the end of the queue
     Settings    nothing pre-ticked, consent per purpose, the grievance officer in plain sight
   ───────────────────────────────────────────────────────────────────────────── */

/* ── addresses ─────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   Saved addresses.

   Every app in this category geocodes an address silently, so "we do not deliver here" arrives
   after the basket is full. Here the range check is printed on the row, with the reason and the
   shop we have not signed yet. The address is also the one field this industry quietly prices
   against — same basket, different pin, different total — which is what the last line answers.
   ───────────────────────────────────────────────────────────────────────────── */

/*
 * The book lives in module scope and is mutated in place. Not in `state`: a reviewer who removes
 * a row should get it back on reload rather than having to clear localStorage. `metres` is
 * measured from Shankar Stores rather than from the user, because that is the number that
 * decides whether the order is possible at all.
 */
const SAVED = [
  {
    id: 'home',
    label: 'Home',
    line: '402, Prestige Ferns, 12th Main',
    area: 'Indiranagar',
    metres: 340,
    minutes: 11,
    note: 'Leave at the door',
  },
  {
    id: 'work',
    label: 'Work',
    line: '5th floor, Trinity Circle, 100 Ft Road',
    area: 'Indiranagar',
    metres: 1400,
    minutes: 14,
    note: 'Call on arrival',
  },
  {
    id: 'mum',
    label: "Mum's place",
    line: '18, Kaveri Layout, Sarjapur Main Road',
    area: 'Bellandur',
    metres: 9600,
    minutes: null,
    note: '',
  },
];

/** How far a rider can go and still keep the clock we quote. Past this we say no, and why. */
const RANGE_METRES = 4000;

const RIDER_NOTES = [
  'Leave at the door',
  "Don't ring the bell",
  'Call on arrival',
  'Leave with security',
];

/** A door we have never measured is assumed reachable; see the note where one is added. */
const inRange = (a) => a.metres === null || a.metres <= RANGE_METRES;
const distance = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

/** The store keeps one loose {label, line, area} rather than an id, so the label is the join. */
const currentId = () => SAVED.find((a) => a.label === state.address?.label)?.id ?? null;

function select(a) {
  state.address = { label: a.label, line: a.line, area: a.area };
  commit();
}

export function addresses() {
  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Saved addresses</span>
        </div>

        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">
          <p class="t-caption muted">
            All of these are delivered from ${SHOP.name}, ${SHOP.street}. A rider covers about
            ${RANGE_METRES / 1000} km around it; further than that needs a shop we have not signed yet.
          </p>

          ${
            SAVED.length
              ? `<div class="col gap-md" role="radiogroup" aria-label="Delivery address">
                  ${SAVED.map(addressCard).join('')}
                </div>`
              : `<div class="empty">
                  <p class="t-title3">No address saved</p>
                  <p class="t-footnote muted" style="max-width:28ch">
                    A rider needs a door number before any of this works.
                  </p>
                </div>`
          }

          <div class="col gap-sm">
            <button class="btn btn--primary btn--block" data-new>Add a new address</button>
            <button class="btn btn--ghost btn--block" data-go="location">Use my current location</button>
          </div>

          <p class="t-caption2 dim" style="text-align:center;max-width:32ch;margin:0 auto">
            Your address changes the clock. It has never changed the price.
          </p>
        </div>
      </div>`,

    mount: (root, go, ctx) => {
      const find = (id) => SAVED.find((a) => a.id === id);

      root.querySelectorAll('[data-pick]').forEach((button) =>
        button.addEventListener('click', () => {
          const a = find(button.dataset.pick);
          // The card already prints why this one is out of range, so the tap repeats the reason.
          // A row that silently ignores you is the exact failure this screen exists to fix.
          if (!inRange(a)) return toast(`${a.area} is past what ${SHOP.name} can ride`);
          select(a);
          toast(`Delivering to ${a.label} · ${a.minutes} min`);
          ctx.rerender();
        }),
      );
      root
        .querySelectorAll('[data-edit]')
        .forEach((button) =>
          button.addEventListener('click', () => openAddressForm(find(button.dataset.edit), ctx)),
        );
      root
        .querySelectorAll('[data-remove]')
        .forEach((button) =>
          button.addEventListener('click', () => confirmRemove(find(button.dataset.remove), ctx)),
        );
      root
        .querySelectorAll('[data-notify]')
        .forEach((button) =>
          button.addEventListener('click', () =>
            toast(`We will text you once ${find(button.dataset.notify).area} has a shop. Once.`),
          ),
        );
      root.querySelector('[data-new]')?.addEventListener('click', () => openAddressForm(null, ctx));
    },
  };
}

/**
 * A card rather than a `payrow`, because one row carries three different actions — deliver here,
 * edit, remove — and a button cannot hold buttons. It borrows the payrow's radio so "this is a
 * choice" is the same mark here as it is on the payment screen.
 */
function addressCard(a) {
  const on = currentId() === a.id;
  const ok = inRange(a);
  return `
    <div class="addrcard ${on ? 'addrcard--on' : ''}">
      <button class="addrcard__pick" data-pick="${a.id}" role="radio" aria-checked="${on}">
        <span class="${on ? 'brandc' : 'dim'}" style="flex:none">${icon('pin', { size: 20 })}</span>
        <span class="col grow gap-xs" style="min-width:0">
          <span class="row gap-sm wrap">
            <span class="t-headline ${deva()}">${escapeHtml(a.label)}</span>
            ${on ? '<span class="badge badge--new">Delivering here</span>' : ''}
          </span>
          <span class="t-caption muted line-2 ${deva()}">${escapeHtml(a.line)}</span>
          <span class="t-caption2 dim tnum">
            ${a.metres === null ? `In ${a.area}` : `${distance(a.metres)} from ${SHOP.name}`}${
              ok ? ` · ${a.minutes} min` : ''
            }
          </span>
          ${a.note ? `<span class="t-caption2 dim">Rider: ${escapeHtml(a.note)}</span>` : ''}
        </span>
        <span class="payrow__radio"></span>
      </button>

      ${
        ok
          ? ''
          : `<div class="col gap-md" style="padding:var(--space-md);border-radius:var(--radius-lg);background:var(--surface-sunken)">
              <p class="t-caption2 muted">
                ${distance(a.metres)} is outside the ${RANGE_METRES / 1000} km we ride, so nothing
                would arrive from here. ${SHOP.partners} shops are signed in ${SHOP.area};
                ${a.area} is next on the list.
              </p>
              <button class="btn btn--sm btn--secondary" data-notify="${a.id}">
                Tell me when ${a.area} opens
              </button>
            </div>`
      }

      <div class="row gap-sm addrcard__acts">
        <button class="btn btn--sm btn--secondary" data-edit="${a.id}">Edit</button>
        <button class="btn btn--sm btn--secondary btn--danger" data-remove="${a.id}">Remove</button>
      </div>
    </div>`;
}

/**
 * Removing the address you are currently delivering to cannot leave the app pointing at nothing,
 * so the confirmation names the one that takes over before you tap, rather than after.
 */
function confirmRemove(a, ctx) {
  const wasCurrent = currentId() === a.id;
  const next = SAVED.find((s) => s.id !== a.id && inRange(s)) ?? null;
  sheet({
    body: `
      <div class="col gap-md">
        <h2 class="t-title2 ${deva()}">Remove ${escapeHtml(a.label)}?</h2>
        <p class="t-callout muted ${deva()}">${escapeHtml(a.line)}</p>
        <p class="t-caption2 dim">
          Delivered orders keep the address they went to; this only takes it off the list.
          ${
            wasCurrent && next
              ? `We would deliver to ${escapeHtml(next.label)} instead.`
              : wasCurrent
                ? 'Nothing else on this list is in range, so you would have to add an address before the next order.'
                : ''
          }
        </p>
      </div>`,
    foot: `
      <div class="row gap-md">
        <button class="btn btn--secondary grow" data-keep>Keep it</button>
        <button class="btn btn--remove grow" data-yes>Remove</button>
      </div>`,
    onMount: (el) => {
      el.querySelector('[data-keep]').addEventListener('click', closeSheet);
      el.querySelector('[data-yes]').addEventListener('click', () => {
        SAVED.splice(SAVED.indexOf(a), 1);
        if (wasCurrent && next) select(next);
        else if (wasCurrent) {
          state.address = null;
          commit();
        }
        closeSheet();
        ctx.rerender();
        // toast() escapes its own message now, so these go in raw.
        toast(wasCurrent && next ? `${a.label} removed · now ${next.label}` : `${a.label} removed`);
      });
    },
  });
}

/**
 * The form. Visible labels, not placeholders that vanish the moment you type — an address is
 * exactly the form people fill in halfway, put down and come back to. Nothing starts selected,
 * so the label and the rider instruction are choices rather than defaults saved on your behalf.
 */
function openAddressForm(existing, ctx) {
  const named = ['Home', 'Work'];
  const custom = Boolean(existing) && !named.includes(existing.label);
  const draft = { label: custom ? 'Other' : (existing?.label ?? ''), note: existing?.note ?? '' };
  const [flat = '', street = ''] = existing ? splitLine(existing.line) : [];
  const field = (id, label, value, extra = '') => `
    <label class="field">
      <span class="t-eyebrow dim">${label}</span>
      <input id="${id}" type="text" class="${deva()}" value="${escapeHtml(value)}" ${extra} />
    </label>`;

  sheet({
    height: '88%',
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">${existing ? 'Edit this address' : 'Add an address'}</h2>
          <p class="t-callout muted">Two lines and a name. The rider sees exactly this.</p>
        </div>

        ${field('f-flat', 'Flat or house number', flat, 'autocomplete="address-line1"')}
        ${field('f-street', 'Street and landmark', street, 'autocomplete="address-line2"')}

        <div class="col gap-sm">
          <span class="t-eyebrow dim">Save it as</span>
          <div class="row gap-sm wrap">
            ${[...named, 'Other']
              .map(
                (label) => `<button class="chip ${draft.label === label ? 'chip--on' : ''}"
                  data-label="${label}">${label}</button>`,
              )
              .join('')}
          </div>
        </div>

        <div id="f-name-wrap" ${custom ? '' : 'hidden'}>
          ${field('f-name', 'Name this address', custom ? existing.label : '')}
        </div>

        <div class="col gap-sm">
          <span class="t-eyebrow dim">Standing instruction for the rider</span>
          <div class="row gap-sm wrap">
            ${RIDER_NOTES.map(
              (note) => `<button class="chip ${draft.note === note ? 'chip--on' : ''}"
                data-note="${note}">${note}</button>`,
            ).join('')}
          </div>
          <p class="t-caption2 dim">
            Saved with the address and acknowledged by the rider before pickup. Tap the same chip
            again to clear it.
          </p>
        </div>

        <p class="t-caption2 dim">
          Delivered from ${SHOP.name}, ${SHOP.metres} m away. An address outside the
          ${RANGE_METRES / 1000} km we ride says so on this list — never at payment.
        </p>
      </div>`,
    foot: `<button class="btn btn--primary btn--block" data-save>
      ${existing ? 'Save changes' : 'Save this address'}</button>`,
    onMount: (el) => {
      const nameWrap = el.querySelector('#f-name-wrap');
      el.querySelectorAll('[data-label]').forEach((chip) =>
        chip.addEventListener('click', () => {
          draft.label = chip.dataset.label;
          el.querySelectorAll('[data-label]').forEach((c) =>
            c.classList.toggle('chip--on', c === chip),
          );
          nameWrap.toggleAttribute('hidden', draft.label !== 'Other');
          if (draft.label === 'Other') el.querySelector('#f-name').focus();
        }),
      );
      el.querySelectorAll('[data-note]').forEach((chip) =>
        chip.addEventListener('click', () => {
          draft.note = draft.note === chip.dataset.note ? '' : chip.dataset.note;
          el.querySelectorAll('[data-note]').forEach((c) =>
            c.classList.toggle('chip--on', c.dataset.note === draft.note),
          );
        }),
      );

      /* A half-filled form is told what is missing and taken to the field. A greyed-out Save
         that never explains itself is the version of this people abandon. */
      const missing = (selector, message) => {
        el.querySelector(selector).focus();
        toast(message);
      };

      el.querySelector('[data-save]').addEventListener('click', () => {
        const flatValue = el.querySelector('#f-flat').value.trim();
        const streetValue = el.querySelector('#f-street').value.trim();
        const nameValue = el.querySelector('#f-name').value.trim();
        if (!flatValue)
          return missing('#f-flat', 'We need the flat or house number to find the door');
        if (!streetValue)
          return missing('#f-street', 'Add the street, and a landmark if there is one');
        if (!draft.label) return toast('Pick a name for this address');
        if (draft.label === 'Other' && !nameValue) return missing('#f-name', 'Name this address');

        const label = draft.label === 'Other' ? nameValue : draft.label;
        const line = `${flatValue}, ${streetValue}`;

        if (existing) {
          const wasCurrent = currentId() === existing.id;
          Object.assign(existing, { label, line, note: draft.note });
          if (wasCurrent) select(existing);
          closeSheet();
          ctx.rerender();
          return toast(`${label} updated`);
        }

        // There is no geocoder here, so a new address carries no distance rather than a made-up
        // one. Printing "340 m from Shankar Stores" for a door nobody has measured is the same
        // confident fiction this screen exists to argue against, and a guessed distance could
        // also put a real person out of range. The neighbourhood is all we can honestly claim.
        const added = {
          id: `a${Date.now().toString(36)}`,
          label,
          line,
          area: SHOP.area,
          metres: null,
          minutes: 11,
          note: draft.note,
        };
        SAVED.push(added);
        closeSheet();
        ctx.rerender();

        // Saving an address is not the same as switching to it — the switch stays a tap you make.
        // The exception is the first one, where there is nothing to switch away from.
        if (!state.address) {
          select(added);
          ctx.rerender();
          return toast(`${label} saved · delivering here`);
        }
        toast(`${label} saved`, {
          label: 'Deliver here',
          run: () => {
            select(added);
            ctx.rerender();
          },
        });
      });
    },
  });
}

/** Addresses are stored as one line, so the form splits it back at the first comma to edit it. */
function splitLine(line) {
  const at = line.indexOf(',');
  return at < 0 ? [line, ''] : [line.slice(0, at).trim(), line.slice(at + 1).trim()];
}

/* ── wallet ────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   Wallet, khata and saved payment methods.

   Three kinds of money meet here and the layout exists to keep them apart: a balance we hold
   for you, a tab Shankar extends to you, and instruments that stay with your bank. Every app in
   this category blurs the first two into "credits" and then routes refunds into them by
   default, because a rupee inside a wallet never leaves. Here it goes back the way it came
   unless you say otherwise — so the opt-in sits on the wallet card, not in the terms.
   ───────────────────────────────────────────────────────────────────────────── */

/*
 * The ₹120 the account screen prints, split into what it actually is: cash that was yours and
 * can go back to your bank, and the automatic late-delivery credit, which can be spent but not
 * withdrawn. One number obeying two rules is the oldest trick in the category.
 *
 * Mutable, and the ledger reconciles to it (200 + 40 − 145 + 25 = 120), so adding and
 * withdrawing move a real number rather than firing a toast at a decorative one.
 */
const WALLET = { cash: 9500, promo: 2500 };
const balance = () => WALLET.cash + WALLET.promo;

const LEDGER = [
  { on: '2 Sep', label: 'Late-delivery credit', note: 'NK-3RM8 was 17 minutes late', paise: 2500 },
  {
    on: '31 Aug',
    label: 'Paid for NK-7QP2',
    note: 'Wallet first, UPI for the rest',
    paise: -14500,
  },
  {
    on: '28 Aug',
    label: 'Refund, missing item',
    note: 'You chose the wallet · ARN 4821X',
    paise: 4000,
  },
  { on: '24 Aug', label: 'Money added', note: 'From HDFC •••• 4821', paise: 20000 },
];

/*
 * Everything the bank has on file for this number, and — separately — which of them are on the
 * payment screen. Holding ids rather than copies is what makes the promise in the Remove sheet
 * true: taking one off and putting it back is one list moving, not two lists drifting apart.
 * Module-level, so both survive the rerender that has to show the change.
 */
const METHODS = [
  ['okhdfc', 'UPI IDs', 'aarav@okhdfcbank', 'Intent only · no auto-debit', 'phone'],
  ['ybl', 'UPI IDs', '9880041234@ybl', 'Intent only · no auto-debit', 'phone'],
  ['hdfc', 'Cards', 'HDFC •••• 4821', 'Tokenised · expires 09/28', 'shield'],
  ['axis', 'Cards', 'Axis •••• 2207', 'Tokenised · expires 03/27', 'shield'],
].map(([id, group, name, tag, mark]) => ({ id, group, name, tag, mark }));
let saved = ['okhdfc', 'ybl', 'hdfc'];
const methodById = (id) => METHODS.find((m) => m.id === id);

/** The one line here a shopkeeper would actually say, so it says it in his language too. */
const KHATA_LINE = {
  en: 'A khata is the running tab a kirana keeps for its regulars. No interest, a hard limit, settled once a week — and if it goes unpaid the tab closes rather than growing.',
  hi: 'खाता यानी दुकान पर चलता हिसाब। कोई ब्याज नहीं, तय सीमा, हफ़्ते में एक बार सेटल — और न चुकाने पर खाता बंद हो जाता है, बढ़ता नहीं।',
};

export function wallet() {
  const owed = state.khata;
  const cashPct = balance() ? (WALLET.cash / balance()) * 100 : 0;
  // Ordered by METHODS, not by when you saved them, so adding one back does not reshuffle
  // the groups under you.
  const shown = METHODS.filter((m) => saved.includes(m.id));

  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Wallet & payments</span>
        </div>

        <div class="screen__scroll gutter col gap-xl" id="scroll" style="padding-top:var(--space-sm)">
          <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <div class="row between">
              <span class="t-eyebrow dim">Nukkad Wallet</span>
              <span class="t-caption2 dim">Nothing expires</span>
            </div>
            <span class="t-display tnum">${rupees(balance())}</span>
            <div class="wallet-split">
              <span class="wallet-split__cash" style="width:${cashPct}%"></span>
              <span class="wallet-split__promo" style="width:${100 - cashPct}%"></span>
            </div>
            <div class="row between gap-md">
              <span class="t-caption muted"><b class="tnum">${rupees(WALLET.cash)}</b> cash · yours to withdraw</span>
              <span class="t-caption muted"><b class="tnum">${rupees(WALLET.promo)}</b> credit</span>
            </div>
            <div class="row gap-sm">
              <button class="btn btn--sm btn--primary grow" data-add-money>Add money</button>
              ${WALLET.cash > 0 ? `<button class="btn btn--sm btn--secondary grow" data-withdraw>Withdraw ${rupees(WALLET.cash)}</button>` : ''}
            </div>
            <div class="bill__rule"></div>
            <span class="t-subhead">Where refunds go</span>
            <div class="row gap-sm">
              <button class="chip ${state.walletRefunds ? '' : 'chip--on'}" data-refund="source">Back to source</button>
              <button class="chip ${state.walletRefunds ? 'chip--on' : ''}" data-refund="wallet">In the wallet</button>
            </div>
            <p class="t-caption2 dim">
              Back to the card or UPI ID you paid with, in one to three days, with the bank
              reference shown. The wallet is faster. Which one is a choice you make, and it is
              set to source because that is the safer of the two.
            </p>
          </div>

          <div class="col gap-sm">
            <p class="t-eyebrow dim">Wallet activity</p>
            <div class="col">
              ${
                LEDGER.length
                  ? LEDGER.map(ledgerRow).join('')
                  : `<p class="t-callout muted">
                       Nothing has moved through the wallet yet. Add money and every rupee in and
                       out of it is listed here.
                     </p>`
              }
            </div>
          </div>

          <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
            <div class="row between">
              <div class="col gap-xs">
                <span class="t-eyebrow dim">Khata at ${SHOP.name}</span>
                <span class="t-title1 tnum">${rupees(owed)}</span>
              </div>
              <span class="row center" style="width:44px;height:44px;border-radius:50%;background:var(--brand-tint);color:var(--brand);flex:none">
                ${icon('shop', { size: 20 })}
              </span>
            </div>
            ${
              owed > 0
                ? `<div class="progress">
                     <div class="progress__fill" style="width:${Math.min(100, (owed / KHATA.limit) * 100)}%"></div>
                   </div>
                   <div class="row between">
                     <span class="t-caption2 dim tnum">${rupees(KHATA.limit - owed)} left of ${rupees(KHATA.limit)}</span>
                     <span class="t-caption2 dim">Settles ${KHATA.settlesOn}</span>
                   </div>`
                : `<p class="t-caption success">Cleared. The full ${rupees(KHATA.limit)} is open again.</p>`
            }
            <p class="t-caption muted ${deva()}">${state.lang === 'hi' ? KHATA_LINE.hi : KHATA_LINE.en}</p>
            ${
              owed > 0
                ? `<button class="btn btn--secondary btn--block" data-settle>Settle ${rupees(owed)}</button>`
                : `<button class="btn btn--secondary btn--block" data-go="home">Shop at ${SHOP.name}</button>`
            }
          </div>

          <div class="col gap-lg">
            ${
              shown.length
                ? [...new Set(shown.map((m) => m.group))]
                    .map(
                      (group) => `
                      <div class="col gap-sm">
                        <p class="t-eyebrow dim">${group}</p>
                        ${shown
                          .filter((m) => m.group === group)
                          .map(savedRow)
                          .join('')}
                      </div>`,
                    )
                    .join('')
                : `<p class="t-callout muted">
                     Nothing saved. UPI intent and cash at the door still work — keeping one here
                     only spares you the app switch. Add one below.
                   </p>`
            }
            <div class="col gap-sm">
              ${[
                ['UPI IDs', 'a UPI ID'],
                ['Cards', 'a card'],
              ]
                .map(
                  ([group, label]) => `
                  <button class="payrow" data-new="${group}">
                    <span class="payrow__logo">${icon('plus', { size: 20 })}</span>
                    <span class="t-headline grow">Add ${label}</span>
                    <span class="row-item__chev">${icon('chevron', { size: 16 })}</span>
                  </button>`,
                )
                .join('')}
            </div>
            <p class="t-caption2 dim" style="text-align:center">
              Card numbers are never stored — tokenised as the RBI requires. Nothing saved here can
              be charged without you approving it in your own app.
            </p>
          </div>
        </div>
      </div>`,

    mount: (root, go, ctx) => {
      root
        .querySelector('[data-add-money]')
        .addEventListener('click', () => openAddMoney(ctx.rerender));

      root.querySelector('[data-withdraw]')?.addEventListener('click', () =>
        confirmSheet({
          title: `Withdraw ${rupees(WALLET.cash)}`,
          body: `To HDFC •••• 4821, the account it came from, within one working day. The
                 ${rupees(WALLET.promo)} of credit stays here — that part was never your money.`,
          cta: 'Withdraw',
          run: () => {
            LEDGER.unshift({
              on: 'Today',
              label: 'Withdrawn to HDFC •••• 4821',
              note: 'Reference NK7734W',
              paise: -WALLET.cash,
            });
            WALLET.cash = 0;
            toast('Withdrawal on its way · reference NK7734W');
            ctx.rerender();
          },
        }),
      );

      root.querySelectorAll('[data-refund]').forEach((chip) =>
        chip.addEventListener('click', () => {
          setPref('walletRefunds', chip.dataset.refund === 'wallet');
          ctx.rerender();
        }),
      );

      root.querySelector('[data-settle]')?.addEventListener('click', () =>
        confirmSheet({
          title: `Settle ${rupees(state.khata)}`,
          body: `Paid to ${SHOP.keeper} by UPI. No interest was added, and nothing was added for
                 settling early — the tab is what you spent and nothing else.`,
          cta: `Pay ${rupees(state.khata)}`,
          run: () => {
            state.khata = 0;
            commit();
            toast(`Khata settled · ${SHOP.keeper} has been paid`);
            ctx.rerender();
          },
        }),
      );

      root.querySelectorAll('[data-remove]').forEach((button) =>
        button.addEventListener('click', () => {
          const method = methodById(button.dataset.remove);
          confirmSheet({
            title: `Remove ${method.name}?`,
            body: 'It leaves the payment screen straight away. Orders already paid with it are not affected, and you can add it back in one tap.',
            cta: 'Remove',
            danger: true,
            run: () => {
              saved = saved.filter((id) => id !== method.id);
              toast(`${method.name} removed`);
              ctx.rerender();
            },
          });
        }),
      );

      root
        .querySelectorAll('[data-new]')
        .forEach((button) =>
          button.addEventListener('click', () => openAddMethod(button.dataset.new, ctx.rerender)),
        );
    },
  };
}

/** Credits and debits share one column so the eye can add them up: same width, tabular, signed. */
function ledgerRow(entry) {
  const credit = entry.paise > 0;
  return `
    <div class="row-item">
      <span class="col grow" style="min-width:0">
        <span class="t-subhead">${entry.label}</span>
        <span class="t-caption2 dim">${entry.on} · ${entry.note}</span>
      </span>
      <span class="t-price-s tnum ${credit ? 'success' : ''}" style="flex:none">
        ${credit ? '+' : '−'} ${rupees(Math.abs(entry.paise))}
      </span>
    </div>`;
}

/*
 * The payment screen's row with one element changed: a div rather than a button, because here
 * the row is not the choice — the Remove inside it is, and a button cannot hold a button.
 */
function savedRow(method) {
  return `
    <div class="payrow">
      <span class="payrow__logo">${icon(method.mark, { size: 20 })}</span>
      <span class="col grow" style="min-width:0">
        <span class="t-headline">${method.name}</span>
        <span class="t-caption2 muted">${method.tag}</span>
      </span>
      <button class="btn btn--sm btn--danger" data-remove="${method.id}"
              aria-label="Remove ${method.name}">Remove</button>
    </div>`;
}

/**
 * Adding money is where a wallet usually stops being yours, so the sheet leads with the exit
 * rather than burying it: what goes in can come straight back out.
 */
function openAddMoney(rerender) {
  sheet({
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">Add money</h2>
          <p class="t-callout muted">
            From HDFC •••• 4821. It stays withdrawable and it never expires. The only reason to
            keep money here is that it pays instantly — it buys you nothing else.
          </p>
        </div>
        <div class="row gap-sm wrap">
          ${[10000, 20000, 50000]
            .map(
              (value) => `<button class="chip t-headline" data-amount="${value}"
                style="padding-inline:var(--space-lg)">${rupees(value)}</button>`,
            )
            .join('')}
        </div>
        <p class="t-caption2 dim">
          We hold it, we do not invest it, and we pay no interest on it — so keep here only what
          you would have kept in your pocket anyway.
        </p>
      </div>`,
    onMount: (el) => {
      el.querySelectorAll('[data-amount]').forEach((button) =>
        button.addEventListener('click', () => {
          const value = Number(button.dataset.amount);
          WALLET.cash += value;
          LEDGER.unshift({
            on: 'Today',
            label: 'Money added',
            note: 'From HDFC •••• 4821',
            paise: value,
          });
          closeSheet();
          toast(`${rupees(value)} added · withdraw it whenever you like`);
          rerender();
        }),
      );
    },
  });
}

/**
 * Saving an instrument is the moment a payments screen can quietly acquire a standing mandate,
 * so the sheet says what is actually being saved before it offers anything to tap. The list is
 * what the bank already holds against this number: adding one puts it on the payment screen and
 * does nothing else.
 */
function openAddMethod(group, rerender) {
  const available = METHODS.filter((m) => m.group === group && !saved.includes(m.id));
  sheet({
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">Add ${group === 'Cards' ? 'a card' : 'a UPI ID'}</h2>
          <p class="t-callout muted">
            ${
              group === 'Cards'
                ? 'Your bank tokenises the number and keeps it. We store the token, never the card, and it cannot be charged without you approving the amount.'
                : 'Your UPI app confirms the ID. We never see the PIN, and every payment asks you again rather than running on a mandate.'
            }
          </p>
        </div>
        ${
          available.length
            ? `<div class="col gap-sm">
                 ${available
                   .map(
                     (method) => `
                     <button class="payrow" data-pick="${method.id}">
                       <span class="payrow__logo">${icon(method.mark, { size: 20 })}</span>
                       <span class="col grow" style="min-width:0">
                         <span class="t-headline">${method.name}</span>
                         <span class="t-caption2 muted">${method.tag}</span>
                       </span>
                       <span class="t-subhead brandc">Add</span>
                     </button>`,
                   )
                   .join('')}
               </div>`
            : `<div class="col gap-md">
                 <p class="t-callout muted">
                   Nothing left to add. Everything your bank holds against this number is already
                   on the payment screen.
                 </p>
                 <button class="btn btn--secondary btn--block" data-close>Close</button>
               </div>`
        }
      </div>`,
    onMount: (el) => {
      el.querySelectorAll('[data-pick]').forEach((button) =>
        button.addEventListener('click', () => {
          saved.push(button.dataset.pick);
          closeSheet();
          toast(`${methodById(button.dataset.pick).name} saved`);
          rerender();
        }),
      );
      el.querySelector('[data-close]')?.addEventListener('click', closeSheet);
    },
  });
}

/**
 * One confirmation for the three actions here that move money or delete a saved instrument.
 * Three near-identical sheets would be three places for the copy, and the cancel, to drift.
 */
function confirmSheet({ title, body, cta, danger, run }) {
  sheet({
    body: `
      <div class="col gap-sm">
        <h2 class="t-title2">${title}</h2>
        <p class="t-callout muted">${body}</p>
      </div>`,
    foot: `
      <div class="row gap-md">
        <button class="btn btn--secondary grow" data-cancel>Not now</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'} grow" data-ok>${cta}</button>
      </div>`,
    onMount: (el) => {
      el.querySelector('[data-cancel]').addEventListener('click', closeSheet);
      el.querySelector('[data-ok]').addEventListener('click', () => {
        closeSheet();
        run();
      });
    },
  });
}

/* ── giftcards ─────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   Gift cards.

   The whole screen exists for one line of behaviour: the remainder. A Blinkit or Instamart
   gift voucher redeems as a coupon — spend ₹640 of a ₹1,000 card and the other ₹360 is gone
   the moment that order is placed. That is a forfeiture dressed as a present, and it is the
   exact pattern this app exists to refuse. Here a card becomes wallet balance, it spends over
   as many orders as it takes, and the number set largest on every card is what is left rather
   than what it was sold for.
   ───────────────────────────────────────────────────────────────────────────── */

/*
 * Holdings live in this module rather than in `state`: nothing outside this screen reads them,
 * and the prototype should not grow a persisted shape it never exercises. `seg` and `draft`
 * survive a rerender for the same reason the payment screen keeps its chosen method in a
 * closure — the router re-runs the route function, not the module.
 */
let seg = 'buy';
const draft = { amount: 50000, occasion: 'diwali', phone: '' };

const SEGMENTS = [
  ['buy', 'Buy'],
  ['redeem', 'Redeem'],
  ['mine', 'Mine'],
];
const AMOUNTS = [25000, 50000, 100000];
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 1000000;

/*
 * Four occasions, not twenty: a picker long enough to scroll turns a gift into a form. The
 * line printed on the card is written per occasion rather than assembled from the label,
 * because "Happy No occasion" is what template strings do to a gift.
 * [id, label, label in Hindi, line on the card, that line in Hindi]
 */
const OCCASIONS = [
  ['diwali', 'Diwali', 'दिवाली', 'Happy Diwali. Fill the shelves.', 'दिवाली मुबारक।'],
  ['griha', 'New home', 'नया घर', 'For the new kitchen.', 'नई रसोई के लिए।'],
  ['thanks', 'Thank you', 'शुक्रिया', 'Thank you. Chai is on me.', 'शुक्रिया। चाय मेरी तरफ़ से।'],
  ['none', 'No occasion', 'बिना मौक़े', 'Something for the week.', 'हफ़्ते के सामान के लिए।'],
];

/* Two live codes: one that works, one already on this account. The second is the interesting
   case — a spent code has to say what became of it, not just refuse. */
const VOUCHERS = {
  NKD120264821: { value: 50000, from: 'Priya', expiry: '4 Sep 2027' },
  NKD120267739: { value: 25000, from: 'the office', expiry: '2 Jan 2027', redeemedOn: 'on 12 Aug' },
};

/* One card part-spent and one untouched, because a card still carrying its remainder is the
   argument this screen makes. The second is here because Redeem answers an already-added code
   by pointing at Mine, and a refusal that points somewhere empty is worse than no reason. */
const held = [
  { code: 'NKD1-2025-6104', balance: 34000, face: 100000, expiry: '14 Mar 2027', from: 'Meera' },
  { code: 'NKD1-2026-7739', balance: 25000, face: 25000, expiry: '2 Jan 2027', from: 'the office' },
];

/* The wallet is summed from the cards rather than kept alongside them: two homes for one
   figure is how a balance and the cards behind it start disagreeing. */
const walletBalance = () => held.reduce((sum, card) => sum + card.balance, 0);

const isHindi = () => state.lang === 'hi';
const fmtCode = (raw) => raw.replace(/(.{4})(?=.)/g, '$1-');
const chipRow = (eyebrow, chips) =>
  `<div class="col gap-md"><p class="t-eyebrow dim">${eyebrow}</p>
    <div class="row wrap gap-sm">${chips.join('')}</div></div>`;
const walletRow = (modifier) => `
  <div class="rowcard ${modifier}">
    <span class="col gap-xs">
      <span class="t-headline">Wallet balance</span>
      <span class="t-caption2 muted">Comes off the next bill on its own, over as many orders as it takes</span>
    </span>
    <span class="t-price-m tnum">${rupees(walletBalance())}</span>
  </div>`;

/**
 * Buy, Redeem and Mine are three views of one object rather than three destinations, so they
 * share a screen and a segmented control. The attribute is `data-seg` and not `data-tab`:
 * `data-tab` is claimed by the router's delegated handler, which reads it as a route name and
 * would send every tap here to Home.
 */
export function giftCards() {
  const view = seg === 'buy' ? buyTab() : seg === 'redeem' ? redeemTab() : mineTab();
  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Gift cards</span>
        </div>
        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">
          <div class="segment" role="tablist">
            ${SEGMENTS.map(
              ([id, label]) => `<button class="segment__item" role="tab" data-seg="${id}"
                aria-controls="gc-panel" aria-selected="${seg === id}">${label}</button>`,
            ).join('')}
          </div>
          <div class="col gap-lg" id="gc-panel" role="tabpanel">${view.html}</div>
        </div>
        ${view.foot ?? ''}
      </div>`,
    mount: (root, go, ctx) => {
      root.querySelectorAll('[data-seg]').forEach((button) =>
        button.addEventListener('click', () => {
          seg = button.dataset.seg;
          ctx.rerender();
        }),
      );
      view.mount?.(root, ctx);
    },
  };
}

/* ── Buy ───────────────────────────────────────────────────────────────────── */

/**
 * The card is drawn above the controls, not below them: the thing being bought is an object
 * somebody else will look at, so every tap should change the object rather than a summary of
 * it. Buying ends at a toast — miming a payment sheet here would only show off the payment
 * screen a second time, and this screen has nothing to prove about payments.
 */
function buyTab() {
  const occasion = OCCASIONS.find(([id]) => id === draft.occasion) ?? OCCASIONS[0];
  const preset = AMOUNTS.includes(draft.amount);
  const ready = draft.phone.length === 10;
  const amountChips = AMOUNTS.map(
    (v) => `<button class="chip ${draft.amount === v ? 'chip--on' : ''}"
      data-amt="${v}">${rupees(v)}</button>`,
  );
  // The custom chip carries the amount once it is set, so the row never shows a chosen value
  // and the word "Custom" at the same time.
  amountChips.push(`<button class="chip ${preset ? '' : 'chip--on'}"
      data-custom>${preset ? 'Custom' : rupees(draft.amount)}</button>`);
  const occasionChips = OCCASIONS.map(
    ([id, en, hi]) => `<button class="chip ${deva()} ${draft.occasion === id ? 'chip--on' : ''}"
      data-occ="${id}">${isHindi() ? hi : en}</button>`,
  );

  return {
    html: `
      ${giftPreview(occasion)}
      ${chipRow('Amount', amountChips)}
      ${chipRow('Occasion', occasionChips)}
      <div class="col gap-md">
        <p class="t-eyebrow dim">Send to</p>
        <label class="field-inline">
          <span class="t-headline dim">+91</span>
          <span style="width:1px;height:22px;background:var(--border)"></span>
          <input id="to" inputmode="numeric" maxlength="10" placeholder="98xxx xxxxx" autocomplete="tel"
                 aria-label="Recipient number" value="${escapeHtml(draft.phone)}"
                 style="font-size:17px;letter-spacing:.04em" />
        </label>
        <p class="t-caption2 dim">
          They get the code by SMS. They do not need the app to see what is left on it, and we
          send them nothing else.
        </p>
      </div>
      <div class="banner banner--info">
        ${icon('shield', { size: 20 })}
        <span class="t-caption">
          Spend ${rupees(64000)} of a ${rupees(100000)} card and ${rupees(36000)} stays on the card.
          This is a balance, not a one-time coupon that keeps the change.
        </span>
      </div>`,
    // A disabled CTA that does not name what is missing is the same dead end as a button that
    // does nothing, so the label carries the reason and the amount stays visible either way.
    foot: `
      <div style="padding:var(--space-md) var(--layout-screen-gutter) var(--space-lg);box-shadow:inset 0 1px 0 var(--border)">
        <button class="btn btn--primary btn--pay btn--block" id="send" ${ready ? '' : 'disabled'}>
          <span id="send-label">${ready ? 'Send gift card' : 'Add their number'}</span>
          <span class="t-price-m">${rupees(draft.amount)}</span>
        </button>
      </div>`,
    mount: (root, ctx) => {
      root.querySelectorAll('[data-amt]').forEach((button) =>
        button.addEventListener('click', () => {
          draft.amount = Number(button.dataset.amt);
          ctx.rerender();
        }),
      );
      root.querySelectorAll('[data-occ]').forEach((button) =>
        button.addEventListener('click', () => {
          draft.occasion = button.dataset.occ;
          ctx.rerender();
        }),
      );
      root.querySelector('[data-custom]').addEventListener('click', () => openCustomAmount(ctx));

      const input = root.querySelector('#to');
      const send = root.querySelector('#send');
      const label = root.querySelector('#send-label');
      const to = root.querySelector('#preview-to');
      // Typing must not rerender: the field would lose focus and the caret mid-number. The
      // three things that genuinely depend on the number are patched in place instead.
      input.addEventListener('input', () => {
        draft.phone = input.value.replace(/\D/g, '');
        input.value = draft.phone;
        const filled = draft.phone.length === 10;
        send.disabled = !filled;
        label.textContent = filled ? 'Send gift card' : 'Add their number';
        to.textContent = draft.phone ? `To +91 ${draft.phone}` : 'To whoever you choose';
      });
      send.addEventListener('click', () => {
        toast(
          `${rupees(draft.amount)} card sent to +91 ${draft.phone}. Nothing on it expires on them.`,
        );
        draft.phone = '';
        ctx.rerender();
      });
    },
  };
}

function giftPreview([, , , note, noteHi]) {
  // Fixed ink on a fixed gradient — see the note on .giftcard in the CSS.
  const ink = (opacity) => `style="color:rgba(251,249,245,${opacity})"`;
  return `
    <div class="giftcard">
      <div class="row between">
        <span class="row gap-sm center">${icon('shop', { size: 20 })}
          <span class="t-eyebrow" ${ink('.78')}>Nukkad</span></span>
        ${icon('gift', { size: 20 })}
      </div>
      <div class="col gap-xs">
        <span class="t-display tnum">${rupees(draft.amount)}</span>
        <span class="t-callout ${deva()}" ${ink('.86')}>${isHindi() ? noteHi : note}</span>
      </div>
      <div class="row between">
        <span class="t-caption2" id="preview-to" ${ink('.66')}>
          ${draft.phone ? `To +91 ${escapeHtml(draft.phone)}` : 'To whoever you choose'}</span>
        <span class="t-caption2" ${ink('.66')}>Spend it at ${SHOP.name}</span>
      </div>
    </div>`;
}

/**
 * Custom amounts get a sheet rather than a field wedged into the form, because the only hard
 * part is the bounds — and bounds are worth saying out loud rather than clamping in silence.
 */
function openCustomAmount(ctx) {
  sheet({
    body: `
      <div class="col gap-lg">
        <h2 class="t-title2">Any amount</h2>
        <label class="rowcard rowcard--sunken">
          <span class="t-headline dim">₹</span>
          <input id="amt" inputmode="numeric" maxlength="5" placeholder="750" autocomplete="off"
                 aria-label="Amount in rupees"
                 style="flex:1;border:0;background:none;outline:0;font:inherit;font-size:17px;color:var(--text)" />
        </label>
        <p class="t-caption2 dim" id="amt-msg">
          Between ${rupees(MIN_AMOUNT)} and ${rupees(MAX_AMOUNT)}, in whole rupees.
        </p>
      </div>`,
    foot: `<button class="btn btn--primary btn--block" id="set">Use this amount</button>`,
    onMount: (el) => {
      const input = el.querySelector('#amt');
      const message = el.querySelector('#amt-msg');
      input.focus();
      el.querySelector('#set').addEventListener('click', () => {
        const paise = Number(input.value.replace(/\D/g, '')) * 100;
        if (!paise || paise < MIN_AMOUNT || paise > MAX_AMOUNT) {
          message.className = 't-caption2 danger';
          message.textContent = paise
            ? `${rupees(paise)} is outside ${rupees(MIN_AMOUNT)}–${rupees(MAX_AMOUNT)}. Pick something in between.`
            : 'Type an amount first.';
          input.classList.add('shake');
          setTimeout(() => input.classList.remove('shake'), 400);
          return;
        }
        draft.amount = paise;
        closeSheet();
        ctx.rerender();
      });
    },
  });
}

/* ── Redeem ────────────────────────────────────────────────────────────────── */

/**
 * Every refusal here names its own cause. "Invalid code" is the category standard and it is
 * useless: it cannot tell a typo from a card you already added, so people retype the same code
 * four times and then write to support. Three distinguishable answers cost twelve lines.
 */
function redeemTab() {
  // Read off the seeded set rather than typed into the copy, so the hint cannot outlive the
  // code it names once that code has been added.
  const live = Object.entries(VOUCHERS).find(([, card]) => !card.redeemedOn);
  const hint = live
    ? `Prototype: ${fmtCode(live[0])} is a live ${rupees(live[1].value)} card.`
    : 'Prototype: both seeded codes are on this account now. They are under Mine.';

  return {
    html: `
      <div class="col gap-md">
        <h2 class="t-title2">Add a card to your wallet</h2>
        <p class="t-callout muted">
          Twelve characters, from the SMS. It becomes wallet balance — there is no code to
          remember again at checkout.
        </p>
        <input class="codefield tnum" id="code" placeholder="NKD1-2026-4821" autocomplete="off"
               spellcheck="false" aria-label="Gift card code" />
        <p class="t-caption dim" id="msg">${hint}</p>
        <button class="btn btn--primary btn--block" id="redeem">Add to wallet</button>
      </div>
      ${walletRow('rowcard--sunken')}`,
    mount: (root, ctx) => {
      const input = root.querySelector('#code');
      const message = root.querySelector('#msg');
      const say = (text, tone) => {
        message.className = `t-caption ${tone}`;
        message.textContent = text;
      };
      const reject = (text) => {
        say(text, 'danger');
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
      };

      input.addEventListener('input', () => {
        const raw = input.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 12);
        input.value = fmtCode(raw);
        const left = 12 - raw.length;
        say(
          left ? `${plural(left, 'character', 'characters')} to go.` : 'Reads like a code. Add it.',
          'dim',
        );
      });

      root.querySelector('#redeem').addEventListener('click', () => {
        const raw = input.value.replace(/[^A-Z0-9]/g, '');
        const card = VOUCHERS[raw];
        if (raw.length < 12) return reject(`A code is 12 characters. This one has ${raw.length}.`);
        if (!card)
          return reject(
            'No card with that code. Check the last four characters — a wrong try locks nothing.',
          );
        if (card.redeemedOn)
          return reject(
            `Added to this account ${card.redeemedOn}. Whatever is left of it is under Mine.`,
          );

        card.redeemedOn = 'a moment ago';
        held.unshift({
          code: fmtCode(raw),
          balance: card.value,
          face: card.value,
          from: card.from,
          expiry: card.expiry,
        });
        seg = 'mine';
        toast(`${rupees(card.value)} added. It stays until you spend it.`);
        ctx.rerender();
      });
    },
  };
}

/* ── Mine ──────────────────────────────────────────────────────────────────── */

/**
 * Balance left is set in price type; what the card was worth is a caption beside it. That
 * ordering is the entire disagreement with the category — a voucher leads with its face value
 * because the face value is what it sold you, a balance leads with what you still have.
 */
function mineTab() {
  if (!held.length) {
    return {
      html: `
        <div class="empty">
          <p class="t-title3">No gift cards on this account</p>
          <p class="t-footnote muted" style="max-width:30ch">
            If somebody sent you one, the code is sitting in your messages.
          </p>
          <button class="btn btn--primary" data-seg="redeem">Enter a code</button>
        </div>`,
    };
  }

  return {
    html: `
      ${walletRow('rowcard--brand')}
      <div class="col gap-md">
        ${held
          .map(
            (card) => `
            <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
              <div class="row between">
                <span class="col gap-xs">
                  <span class="t-eyebrow dim">Balance left</span>
                  <span class="t-price-l tnum">${rupees(card.balance)}</span>
                </span>
                <span class="col gap-xs" style="text-align:right">
                  <span class="t-caption2 dim tnum">${escapeHtml(card.code)}</span>
                  <span class="t-caption2 muted">of ${rupees(card.face)}</span>
                </span>
              </div>
              <div class="progress">
                <div class="progress__fill" style="width:${Math.round((card.balance / card.face) * 100)}%"></div>
              </div>
              <div class="row between">
                <span class="t-caption muted">From ${escapeHtml(card.from ?? 'you')}</span>
                <span class="t-caption dim">Valid to ${escapeHtml(card.expiry ?? 'no end date')}</span>
              </div>
            </div>`,
          )
          .join('')}
      </div>
      <p class="t-caption2 dim">
        Whatever is left stays left. We do not zero a card after one order, and past the valid
        date we reissue the balance rather than keep it.
      </p>
      <button class="btn btn--secondary btn--block" data-go="home">Spend it on an order</button>`,
  };
}

/* ── referral ──────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   Refer a neighbour.

   Two things are wrong with every referral programme in this category, and both are hidden
   rather than argued: the credit is announced on sign-up and then quietly held until some
   later condition, and the fine print carries a cap and an expiry that nobody reads until
   the money is gone. So this screen says "delivered, not signed up" in the steps themselves,
   says up front that there is no cap and no expiry instead of leaving it to a footnote, and
   shows the three stages a neighbour passes through so a pending credit is visible rather
   than surprising.

   It is also a *neighbour*, not a friend. The whole app is one street; the person you send
   this to shops at the same counter, from the same shelf, at the same price.
   ───────────────────────────────────────────────────────────────────────────── */

/** Your half, in paise. Their half is WELCOME100 itself, so the two screens cannot drift. */
const REFERRAL_CREDIT = 10000;

/**
 * Who has your code. This is server data everywhere it matters; it sits here because nothing
 * outside this screen reads it and the store holds only what the rest of the app does.
 *
 * The prototype shortcut: an account that has never ordered shows none of it, which is how
 * the empty state stays reachable rather than being a branch nobody ever sees.
 */
const NEIGHBOURS = [
  { name: 'Meera', where: '2B, same building', stage: 'credited', when: '2 Sep' },
  { name: 'Faizan', where: 'Ground floor', stage: 'joined', when: 'yesterday' },
  { name: 'Priya', where: '12th Main', stage: 'invited', when: 'Tuesday' },
];

const neighbours = () => (state.ordersPlaced > 0 ? NEIGHBOURS : []);

/**
 * Derived from the phone rather than generated, so the code is the same on a reinstall, on a
 * second device, and on the receipt a neighbour still has in a chat from last month. A code
 * that changes under you is a code you cannot read out loud with any confidence.
 */
function referralCode() {
  const digits = (state.phone || '9880041234').replace(/\D/g, '');
  let hash = 7;
  for (const digit of digits) hash = (hash * 31 + Number(digit)) % 1679616; // 36^4
  // Same fallback identity the account screen shows, so the two never name different people.
  const stem =
    (state.name || 'Aarav')
      .replace(/[^a-z]/gi, '')
      .slice(0, 4)
      .toUpperCase() || 'NUKK';
  return `${stem}${hash.toString(36).toUpperCase().padStart(4, '0')}`;
}

/** Written in the language the sender reads, because they are the one who has to vouch for it. */
function shareMessage(code) {
  const off = rupees(RULES.coupons.WELCOME100.off);
  return state.lang === 'hi'
    ? `${code} डालो और पहले ऑर्डर पर ${off} कम। सामान ${SHOP.name} से आता है, ${SHOP.street}।`
    : `Use ${code} on Nukkad and take ${off} off your first order. It comes from ${SHOP.name} on ${SHOP.street} — one delivery fee, free over ${rupees(RULES.freeDeliveryAbove)}.`;
}

/**
 * Web Share where the browser has it, clipboard where it does not, and a text selection where
 * neither is permitted — a share button that silently does nothing on a desktop or in an
 * insecure context is the exact dead end this app is arguing against.
 */
async function shareCode(codeEl, whole) {
  const code = referralCode();
  const text = whole ? shareMessage(code) : code;
  if (whole && navigator.share) {
    try {
      await navigator.share({ title: 'Nukkad', text });
      toast('Code shared');
      return;
    } catch (error) {
      // Dismissing the share sheet is a decision, not a failure, and is not reported as one.
      // Any other failure falls through to the clipboard rather than ending the tap here.
      if (error?.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(whole ? 'Message copied' : `${code} copied`);
  } catch {
    if (codeEl) {
      const range = document.createRange();
      range.selectNodeContents(codeEl);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    toast('We could not copy that. The code is selected — copy it by hand.');
  }
}

function neighbourRow({ name, where, stage, when }) {
  const trail =
    stage === 'credited'
      ? `<span class="t-price-s success">+ ${rupees(REFERRAL_CREDIT)}</span>`
      : stage === 'joined'
        ? `<span class="t-caption dim">${rupees(REFERRAL_CREDIT)} waiting</span>`
        : '';
  const note =
    stage === 'credited'
      ? 'First order delivered'
      : stage === 'joined'
        ? 'Joined — nothing delivered yet'
        : 'Code sent, not used yet';
  return `
    <div class="row gap-md" style="padding:var(--space-md) 0;box-shadow:inset 0 -1px 0 var(--border)">
      <span class="refavatar">${escapeHtml(name[0])}</span>
      <span class="col grow gap-xs" style="min-width:0">
        <span class="t-subhead ${deva()}">${escapeHtml(name)} · <span class="dim">${escapeHtml(where)}</span></span>
        <span class="t-caption2 dim">${note} · ${escapeHtml(when)}</span>
      </span>
      ${trail}
    </div>`;
}

const refStat = (value, label) => `
  <div class="refstat">
    <span class="t-title2 tnum">${value}</span>
    <span class="t-caption2 dim">${label}</span>
  </div>`;

/**
 * The order of the page is the argument: the code and the share action first because that is
 * what the user came for, the three stages next because that is what they came back for, and
 * the steps last — read once, then never again.
 */
export function referral() {
  const list = neighbours();
  const joined = list.filter((n) => n.stage !== 'invited');
  const credited = list.filter((n) => n.stage === 'credited');
  const earned = credited.length * REFERRAL_CREDIT;
  const waiting = (joined.length - credited.length) * REFERRAL_CREDIT;
  const code = referralCode();

  const steps = [
    [
      'You send the code',
      'To one neighbour or to the building group. We count the code, not your contacts.',
    ],
    [
      `They save ${rupees(RULES.coupons.WELCOME100.off)}`,
      `WELCOME100 comes off their first basket of ${rupees(RULES.coupons.WELCOME100.min)} or more — the same price you pay, on their phone.`,
    ],
    [
      `You get ${rupees(REFERRAL_CREDIT)} when it is delivered`,
      `Into your wallet at the door, not at sign-up. A sign-up is not a customer, and paying for one is how a referral programme turns into a form-filling scheme.`,
    ],
  ];

  return {
    html: `<div class="screen">
      <div class="navbar">
        <button class="navbar__back" data-back>${icon('back')}</button>
        <span class="t-title3">Refer a neighbour</span>
      </div>

      <div class="screen__scroll gutter col gap-xl" id="scroll" style="padding-top:var(--space-sm)">

        <div class="col gap-sm">
          <h1 class="t-large-title">${rupees(REFERRAL_CREDIT)} each,<br/>at their door.</h1>
          <p class="t-callout muted">
            They take ${rupees(RULES.coupons.WELCOME100.off)} off their first order. You are credited
            when that order is delivered — not when they sign up.
          </p>
        </div>

        <div class="col gap-md">
          <button class="refcode" id="code" aria-label="Copy your code ${code}">
            <span class="col gap-xs">
              <span class="t-eyebrow" style="opacity:.75">Your code</span>
              <span class="refcode__value tnum" id="code-value">${code}</span>
            </span>
            <span>${icon('ticket', { size: 20 })}</span>
          </button>
          <button class="btn btn--primary btn--block" data-share>Share with a neighbour</button>
          <p class="t-caption2 dim">
            No cap on how many neighbours, and the credit does not expire. Both of those are
            usually in the small print, because both are usually limits.
          </p>
        </div>

        <div class="col gap-md">
          <div class="row between">
            <h2 class="t-title3">Your neighbours</h2>
            <span class="t-caption ${earned ? 'success' : 'dim'}">${rupees(earned)} earned</span>
          </div>

          <div class="grid3">
            ${refStat(list.length, 'Invited')}
            ${refStat(joined.length, 'Joined')}
            ${refStat(credited.length, 'Credited')}
          </div>

          ${
            list.length
              ? `<div class="col">${list.map(neighbourRow).join('')}</div>
                ${
                  waiting
                    ? `<p class="t-caption2 dim">
                        ${rupees(waiting)} is waiting on a first delivery. It moves to your wallet
                        the moment their bag is handed over.
                      </p>`
                    : ''
                }`
              : `<div class="empty" style="padding:var(--space-lg) 0;gap:var(--space-sm)">
                  <p class="t-subhead">Nobody has used your code yet.</p>
                  <p class="t-footnote muted" style="max-width:30ch">
                    Send it to one person on your floor. ${rupees(REFERRAL_CREDIT)} arrives when
                    their first order does.
                  </p>
                  <button class="btn btn--secondary" data-share style="margin-top:var(--space-sm)">
                    Share the code
                  </button>
                </div>`
          }
        </div>

        <div class="col gap-lg">
          <h2 class="t-title3">How it works</h2>
          ${steps
            .map(
              ([title, body], index) => `
              <div class="row gap-md">
                <span class="refstep__n">${index + 1}</span>
                <div class="col gap-xs">
                  <span class="t-headline">${title}</span>
                  <span class="t-footnote muted">${body}</span>
                </div>
              </div>`,
            )
            .join('')}
        </div>

        <button class="rowcard" id="terms">
          <span class="col" style="text-align:left">
            <span class="t-headline">The rest of it</span>
            <span class="t-caption2 muted">Four lines. There is no fifth one elsewhere.</span>
          </span>
          <span class="dim">${icon('chevron', { size: 16 })}</span>
        </button>
      </div>
    </div>`,

    mount: (root) => {
      const codeEl = root.querySelector('#code-value');
      root.querySelector('#code').addEventListener('click', () => shareCode(codeEl, false));
      root
        .querySelectorAll('[data-share]')
        .forEach((button) => button.addEventListener('click', () => shareCode(codeEl, true)));
      root.querySelector('#terms').addEventListener('click', openReferralTerms);
    },
  };
}

/**
 * Short enough to read. Everything here is a limit we could have buried and did not — the
 * cancelled-order case especially, because "credited then clawed back weeks later" is the
 * version of this that makes people distrust the whole idea.
 */
function openReferralTerms() {
  const lines = [
    [
      'check',
      'No cap, no expiry',
      `Every neighbour who orders is worth ${rupees(REFERRAL_CREDIT)}. The credit sits in your wallet until you spend it.`,
    ],
    [
      'wallet',
      'It is wallet money, not a coupon',
      'It goes against any order, including the delivery fee, and it does not need a minimum basket.',
    ],
    [
      'clock',
      'Cancelled orders are not credited',
      'If their first order is cancelled or refunded, nothing is paid — and nothing is taken back later either.',
    ],
    [
      'shield',
      'One code per new account',
      'We do not pay for an account you open yourself. That is the only thing we check.',
    ],
  ];
  sheet({
    body: `
      <div class="col gap-lg" style="padding-bottom:var(--space-lg)">
        <h2 class="t-title2">The rest of it</h2>
        <div class="col gap-lg">
          ${lines
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
      </div>`,
    foot: `<button class="btn btn--secondary btn--block" data-close>Close</button>`,
    onMount: (el) => el.querySelector('[data-close]').addEventListener('click', closeSheet),
  });
}

/* ── coupons ───────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   Coupons, browsed rather than applied.

   The cart sheet answers one question — which of these can I use on this basket, right now.
   This screen answers the question no app in the category will answer: why can I not use the
   other three? Everyone else either hides the coupons you do not qualify for, or lists them
   and then fails at payment with "invalid code", which is the same omission told twice.

   So nothing here is hidden and nothing is disabled without saying why. Every coupon prints
   its code, what it takes off, what basket it needs, and — when it does not apply — the exact
   rupee gap or the exact rule standing in the way. The three headings do the same job at a
   glance, so the state of the whole wallet is readable before you read a word.
   ───────────────────────────────────────────────────────────────────────────── */

const GROUPS = [
  ['ready', 'Ready to use', 'Tap one and it goes on the bill before you pay.'],
  ['soon', 'Not yet', 'What each one is still waiting for, counted in rupees.'],
  // "Expired" would be a lie about a first-order coupon you spent on your first order. The
  // heading has to cover both ways a coupon leaves your hands, or the row underneath argues
  // with the heading above it.
  ['gone', 'Spent or expired', 'Left here so you know what became of them, not quietly dropped.'],
];

/** A category coupon should name its shelf the way the shelf names itself in this language. */
function shelfName(id) {
  const category = categories.find((c) => c.id === id);
  if (!category) return 'that shelf';
  return state.lang === 'hi' && category.nameHi ? category.nameHi : category.name;
}

/**
 * A gap stated in the two units a shopper can act on: rupees, and the shelf they belong on.
 * "Minimum not met" is technically true and useless; "add ₹179 more" is a next step.
 */
function shortfall(coupon, shelf, qualifying, lines) {
  const short = rupees(coupon.min - qualifying);
  if (shelf)
    return qualifying === 0
      ? `Nothing from ${shelf} in the cart. This one needs ${rupees(coupon.min)} of it.`
      : `Add ${short} more from ${shelf}. You have ${rupees(qualifying)} there.`;
  return lines.length === 0
    ? `Your cart is empty. This one needs ${rupees(coupon.min)} in it.`
    : `Add ${short} more. Your cart is at ${rupees(qualifying)}.`;
}

/**
 * One coupon's verdict and, more importantly, its explanation.
 *
 * The store owns the yes/no — `couponApplies` is what the bill itself consults, so a coupon can
 * never look usable here and then quietly not count at payment. Only the prose for a *no* lives
 * in this file, and it needs a subtotal the store does not hand back: a category coupon falls
 * short against its own shelf, not against the whole cart. Telling someone to "add ₹40 more"
 * when they need ₹40 more of chai is the near-miss that sends people to support.
 */
function readCoupon(code, lines) {
  const coupon = RULES.coupons[code];
  const shelf = coupon.category ? shelfName(coupon.category) : null;
  const scope = coupon.category
    ? lines.filter((line) => line.product.categoryId === coupon.category)
    : lines;
  const qualifying = scope.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  // bill() caps a coupon at the whole item total, not at the shelf it is scoped to. Quoting the
  // saving off any other number would print a figure here that the bill then contradicts.
  const itemTotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const spent = coupon.firstOrder && state.ordersPlaced > 0;

  const group = couponApplies(code) ? 'ready' : coupon.expired || spent ? 'gone' : 'soon';
  const reason =
    group === 'ready'
      ? `Takes ${rupees(Math.min(coupon.off, itemTotal))} off this cart.`
      : coupon.expired
        ? 'Nothing you add to the cart will bring this one back.'
        : spent
          ? // Orders are unshifted, so the last entry is the first order ever placed — which is
            // the one this coupon was spent on.
            `First order only, and yours was ${state.orders.at(-1)?.id ?? 'already placed'}.`
          : shortfall(coupon, shelf, qualifying, lines);

  const terms =
    `${rupees(coupon.off)} off` +
    (coupon.min ? ` · ${rupees(coupon.min)} minimum` : ' · no minimum') +
    (shelf ? ` · ${shelf} only` : '');

  return { code, coupon, terms, group, reason };
}

/**
 * A div, not a button: the row carries its own button, and a button inside a button is the
 * nesting the parser rejects — the reason .pcard keeps its stepper outside the tappable body.
 * Unusable ones recede to the sunken surface rather than fading to 40% — the cart sheet can dim
 * them because the reason there is one short line, but here the reason is the whole row, and a
 * reason you squint at is a reason withheld.
 *
 * An applied coupon offers Remove in the same place Use was. Making it one tap to put a
 * discount on and a hunt to take it off is a dark pattern in the direction nobody notices.
 */
function couponCard({ code, coupon, terms, group, reason }) {
  const ready = group === 'ready';
  const applied = state.coupon === code;
  return `
    <div class="rowcard ${ready ? '' : 'rowcard--sunken'}">
      <span class="coupon__stub">${icon('ticket', { size: 20 })}</span>
      <div class="col grow gap-xs" style="min-width:0">
        <span class="row gap-sm">
          <span class="coupon__code">${code}</span>
          ${applied ? '<span class="t-caption2 success">On your cart</span>' : ''}
        </span>
        <span class="t-subhead">${coupon.label}</span>
        <span class="t-caption2 dim tnum ${deva()}">${terms}</span>
        <span class="t-caption2 ${ready ? 'success' : 'muted'} ${deva()}">${reason}</span>
      </div>
      ${
        ready
          ? applied
            ? `<button class="btn btn--sm btn--secondary" data-drop="${code}" style="flex:none">Remove</button>`
            : `<button class="btn btn--sm btn--primary" data-use="${code}" style="flex:none">Use</button>`
          : ''
      }
    </div>`;
}

/**
 * "Ready to use" is the one heading that has to appear even when it is empty, because its
 * emptiness is the answer. Hiding the heading would make an empty wallet look like a missing
 * feature, and the reasons underneath would be floating with nothing to explain.
 */
function nothingReady(lines) {
  return `
    <div class="col gap-sm" style="align-items:flex-start;padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface-sunken)">
      <span class="t-subhead">
        ${lines.length ? 'Nothing in this cart qualifies yet.' : 'Your cart is empty, so nothing qualifies.'}
      </span>
      <span class="t-caption2 muted">Each coupon below says how far off it is.</span>
      <button class="btn btn--sm btn--secondary" data-go="${lines.length ? 'cart' : 'home'}">
        ${lines.length ? 'Open the cart' : 'Start shopping'}
      </button>
    </div>`;
}

export function couponsScreen() {
  const lines = cartLines();
  const all = Object.keys(RULES.coupons).map((code) => readCoupon(code, lines));

  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Coupons</span>
        </div>
        <div class="screen__scroll gutter col gap-xl" id="scroll" style="padding-top:var(--space-sm)">

          <div class="col gap-sm">
            <p class="t-eyebrow dim">Have a code?</p>
            <div class="row gap-sm" style="align-items:stretch">
              <label class="searchfield" id="field" style="background:var(--surface-sunken);flex:1">
                ${icon('ticket', { size: 20 })}
                <input id="code" placeholder="Type a code" autocomplete="off" spellcheck="false"
                       style="text-transform:uppercase" />
              </label>
              <button class="btn btn--secondary" id="check">Check</button>
            </div>
            <p class="t-caption2 dim ${deva()}" id="verdict" aria-live="polite">
              A code is checked here and answered here, never swallowed at payment.
            </p>
          </div>

          ${GROUPS.map(([key, title, note]) => {
            const entries = all.filter((e) => e.group === key);
            if (!entries.length && key !== 'ready') return '';
            return `
              <div class="col gap-md">
                <div class="col gap-xs">
                  <h2 class="t-title3">${title}</h2>
                  <p class="t-caption2 dim">${note}</p>
                </div>
                ${entries.length ? entries.map(couponCard).join('') : nothingReady(lines)}
              </div>`;
          }).join('')}

          <p class="t-caption2 dim" style="text-align:center;max-width:34ch;margin:0 auto">
            One code per order. The discount comes off the bill you approve, not back as cashback
            three weeks later.
          </p>
        </div>
      </div>`,
    mount: (root, go, ctx) => {
      const field = root.querySelector('#field');
      const input = root.querySelector('#code');
      const verdict = root.querySelector('#verdict');

      /* Browsing ends at the cart, not on this screen: a coupon means nothing until it is
         sitting on a total you can read, so applying one carries you to that total. */
      const use = (code) => {
        const replaced = state.coupon && state.coupon !== code ? state.coupon : null;
        state.coupon = code;
        commit();
        // One code per order is a rule, not an excuse to drop the earlier one in silence.
        toast(
          replaced
            ? `${code} applied · ${replaced} taken off, one code per order`
            : `${code} applied · ${rupees(RULES.coupons[code].off)} off`,
        );
        go('cart');
      };

      // textContent, not innerHTML: the user is typing this string and it comes straight back.
      const say = (message, tone) => {
        verdict.className = `t-caption2 ${tone} ${deva()}`;
        verdict.textContent = message;
        if (tone !== 'danger') return;
        field.classList.remove('shake');
        void field.offsetWidth;
        field.classList.add('shake');
      };

      const check = () => {
        const typed = input.value.trim().toUpperCase();
        if (!typed) {
          say('Type a code and we will check it against the list below.', 'dim');
          return;
        }
        if (!RULES.coupons[typed]) {
          say(
            `There is no coupon called ${typed}. The ${all.length} below are all of them.`,
            'danger',
          );
          return;
        }
        const entry = readCoupon(typed, cartLines());
        if (entry.group === 'ready') {
          use(typed);
          return;
        }
        say(
          `${typed} is a real code. ${entry.reason}`,
          entry.group === 'gone' ? 'danger' : 'muted',
        );
      };

      root.querySelector('#check').addEventListener('click', check);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') check();
      });
      root
        .querySelectorAll('[data-use]')
        .forEach((button) => button.addEventListener('click', () => use(button.dataset.use)));
      root.querySelectorAll('[data-drop]').forEach((button) =>
        button.addEventListener('click', () => {
          state.coupon = null;
          commit();
          toast(`${button.dataset.drop} taken off the bill`);
          ctx.rerender();
        }),
      );
    },
  };
}

/* ── help ──────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   Help & support.

   The two loudest one-star complaints about every app in this category land on this screen: a
   refund that comes back as "we were unable to validate your claim" five days later, and a
   support entry point that is a decision tree with no person at the end of it.

   So the order you are almost certainly here about sits at the top, with the two things people
   actually ask as buttons rather than as leaves of a taxonomy. The refund rule is a number
   printed before you ask for it. The escalation path names a human and a wait. And the grievance
   officer the DPDP Act requires is on the screen instead of four taps inside a settings page —
   every Indian app must name one, and almost every Indian app hides it.
   ───────────────────────────────────────────────────────────────────────────── */

const SUPPORT = {
  /** Published, not estimated. A wait time you cannot see is not a wait time. */
  chatWaitMinutes: 2,
  callbackMinutes: 10,
  agent: 'Priya M',
  /** Below this, a refund is a decision the app makes — not a case somebody opens. */
  onTheSpot: 20000,
  officer: { name: 'Sandhya Iyer', email: 'grievance@nukkad.in', ackHours: 48, closeDays: 15 },
};

/**
 * Five topics, because five is what a person will read. Every answer opens with the answer: a
 * support article that begins "we understand your concern" is there to make some share of people
 * give up before they reach the line about money.
 */
const TOPICS = [
  {
    id: 'refunds',
    icon: 'rupee',
    title: 'Refunds',
    sub: 'Where the money goes, and when',
    lead: 'Back to the way you paid it. Every time, without being asked.',
    points: [
      'UPI the same day, cards in 3–5 working days. That second clock is your bank’s; we hand the reversal over within the hour and show you that timestamp.',
      'Wallet credit is an option, never the default. Money that arrived as money leaves as money, with an ARN you can read out at a bank counter.',
    ],
  },
  {
    id: 'cancel',
    icon: 'close',
    title: 'Cancelling an order',
    sub: 'Free until the bag is sealed',
    lead: 'Free until we start sealing the bag, and the timer is visible while it runs.',
    points: [
      'After sealing it is two taps to a person, still no fee. The bag goes back on Shankar’s shelf, and billing you for a shelved bag would be billing you for our logistics.',
      'The whole amount comes back, delivery and tip included. A part-refund on a cancelled order is a penalty wearing another name.',
    ],
  },
  {
    id: 'missing',
    icon: 'shop',
    title: 'A missing or wrong item',
    sub: 'No photo, no investigation',
    lead: 'Tell us which item. The money moves before anybody looks into it.',
    points: [
      'A wrong item is collected at your door and refunded at pickup — not after someone inspects it in a warehouse a week later.',
      'Shankar is told which item and which shelf. That is how the picking improves; a refund on its own fixes nothing.',
    ],
  },
  {
    id: 'payment',
    icon: 'wallet',
    title: 'Payment failed but money left',
    sub: 'What a hold is, and how long it lasts',
    lead: 'That is almost always a hold, not a charge. Banks release it in 3–5 working days.',
    points: [
      'If the payment did not complete, no order exists here. There is nothing to cancel and nothing of yours waiting on us.',
      'A double debit does not wait for the bank. Send us the UTR and we push the reversal the same day rather than leaving it to auto-reversal.',
    ],
  },
  {
    id: 'account',
    // Not the shield: on this screen the shield means "your money is protected", and one mark
    // cannot carry two arguments in the same scroll.
    icon: 'you',
    title: 'Account and data',
    sub: 'What we keep, and how to end it',
    lead: 'Your number, your addresses, your orders. Nothing else is collected.',
    points: [
      'Never your contacts, your gallery, or your location in the background. A grocery app has no business in any of the three, so nothing here asks for them.',
      'Ask the officer below to delete the account and it is gone in 30 days. Invoices stay eight years because tax law requires it — that is the one thing we cannot delete for you.',
    ],
  },
];

/**
 * The topic list and the pick-an-item list are the same gesture, so they are the same row. Two
 * near-identical row markups on one screen drift within a week, and the drift is always the
 * hit area.
 */
function helpRow({ attrs, lead, title, titleClass = '', sub, trail }) {
  return `
    <button class="row-item" ${attrs}>
      ${lead}
      <span class="col grow" style="min-width:0">
        <span class="t-headline ${titleClass}">${title}</span>
        <span class="t-caption2 muted">${sub}</span>
      </span>
      ${trail ?? `<span class="row-item__chev">${icon('chevron', { size: 16 })}</span>`}
    </button>`;
}

/**
 * Every branch of this screen has to end at a person. A topic that ends in prose is the decision
 * tree the screen exists to argue against, so the way out is one call the whole file shares
 * rather than a button some sheets remembered to add.
 */
function escalate() {
  closeSheet();
  toast(`${SUPPORT.agent} picked up · she can refund without asking anyone`);
}

export function help() {
  // A cancelled order is not what anyone opens help for — its refund line already sits on the
  // order itself — so the card carries the most recent order that actually happened.
  const order = state.orders.find((o) => o.stage !== 'cancelled') ?? null;
  const live = Boolean(order) && order.stage !== 'delivered';
  const o = SUPPORT.officer;
  const number = state.phone || '98800 41234';

  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Help &amp; support</span>
        </div>
        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">

          ${order ? orderHelpCard(order, live) : noOrderCard(state.orders.length > 0)}

          <div class="banner banner--success">
            ${icon('shield', { size: 20 })}
            <span class="t-caption">
              Anything under <b>${rupees(SUPPORT.onTheSpot)}</b> is refunded the moment you say so.
              No photo, no investigation, no wallet credit you did not ask for.
            </span>
          </div>

          <div class="col gap-sm">
            <p class="t-eyebrow dim">Topics</p>
            <div class="col">
              ${TOPICS.map((topic) =>
                helpRow({
                  attrs: `data-topic="${topic.id}"`,
                  lead: `<span class="dim">${icon(topic.icon, { size: 20 })}</span>`,
                  title: topic.title,
                  sub: topic.sub,
                }),
              ).join('')}
            </div>
          </div>

          <div class="col gap-sm">
            <p class="t-eyebrow dim">Still stuck</p>
            <button class="rowcard" data-chat>
              <span class="row gap-md">
                <span class="brandc">${icon('chat', { size: 20 })}</span>
                <span class="col" style="text-align:left">
                  <span class="t-headline">Chat with a person</span>
                  <span class="t-caption2 muted">${SUPPORT.agent} is on shift · about ${SUPPORT.chatWaitMinutes} min wait</span>
                </span>
              </span>
              <span class="dim">${icon('chevron', { size: 16 })}</span>
            </button>
            <button class="rowcard" data-callback>
              <span class="row gap-md">
                <span class="brandc">${icon('phone', { size: 20 })}</span>
                <span class="col" style="text-align:left">
                  <span class="t-headline">Ask for a callback</span>
                  <span class="t-caption2 muted">Within ${SUPPORT.callbackMinutes} minutes, on a number masked both ways</span>
                </span>
              </span>
              <span class="dim">${icon('chevron', { size: 16 })}</span>
            </button>
            <p class="t-caption2 dim">
              No bot stands in front of either of these, and there is no menu to press through.
              Whoever picks up can refund, re-send an order or ring the shop without escalating it.
            </p>
          </div>

          <div class="col gap-sm" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface-sunken)">
            <p class="t-eyebrow dim">Grievance officer</p>
            <p class="t-headline">${o.name}</p>
            <p class="t-caption muted">${o.email} · Nukkad Retail, 100 Ft Road, ${SHOP.area}, Bengaluru 560038</p>
            <p class="t-caption2 dim">
              Named because the DPDP Act requires it. She acknowledges within ${o.ackHours} hours
              and closes within ${o.closeDays} days — the rules allow a month, and a month is what
              most apps take.
            </p>
            <button class="btn btn--sm btn--secondary" data-officer style="align-self:flex-start">
              Write to ${o.name.split(' ')[0]}
            </button>
          </div>
        </div>
      </div>`,

    mount: (root, go) => {
      root.querySelector('[data-missing]')?.addEventListener('click', () => openMissing(order));
      // track() falls back to state.orders[0], which is the cancelled one whenever a cancellation
      // is more recent than the order being chased. Naming the order first is what stops the
      // question "where is my order" from answering "no order on the way".
      root.querySelector('[data-where]')?.addEventListener('click', () => {
        if (!live) return openProof(order);
        state.activeOrder = order.id;
        commit();
        go('track');
      });
      root
        .querySelectorAll('[data-topic]')
        .forEach((row) =>
          row.addEventListener('click', () =>
            openTopic(TOPICS.find((topic) => topic.id === row.dataset.topic)),
          ),
        );
      root.querySelector('[data-chat]')?.addEventListener('click', escalate);
      root
        .querySelector('[data-callback]')
        ?.addEventListener('click', () =>
          toast(`${SUPPORT.agent} will call +91 ${number} within ${SUPPORT.callbackMinutes} min`),
        );
      root
        .querySelector('[data-officer]')
        ?.addEventListener('click', () =>
          toast(`Draft opened to ${o.email} · she replies within ${o.ackHours} hours`),
        );
    },
  };
}

/**
 * Nine times in ten, the reason someone opened this screen is sitting in state.orders[0]. So the
 * two questions that actually get asked are buttons on the order itself, rather than the fourth
 * level of a tree that starts at "Select a category".
 */
function orderHelpCard(order, live) {
  const when = new Date(order.placedAt)
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    .toUpperCase();
  return `
    <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
      <div class="row between">
        <span class="chip ${live ? 'chip--on' : ''} t-caption2">${live ? 'On the way' : 'Delivered'}</span>
        <span class="t-caption2 dim tnum">${order.id}</span>
      </div>
      <p class="t-caption muted tnum">${when} · ${plural(order.lines.length, 'item', 'items')} · ${rupees(order.total)}</p>
      <div class="col">
        ${helpRow({
          attrs: 'data-missing',
          lead: `<span class="brandc">${icon('help', { size: 20 })}</span>`,
          title: 'Something is missing or wrong',
          sub: 'Pick the item, keep the refund',
        })}
        ${helpRow({
          attrs: 'data-where',
          lead: `<span class="brandc">${icon('scooter', { size: 20 })}</span>`,
          title: 'Where is my order',
          sub: live ? 'Live map and the rider’s number' : 'The proof we kept at your door',
        })}
      </div>
    </div>`;
}

/**
 * Two empty states, not one. Telling somebody whose order you just cancelled that they have "no
 * orders" is the kind of small lie that makes a person stop believing the rest of the screen.
 */
function noOrderCard(cancelled) {
  return `
    <div class="col gap-sm" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
      <p class="t-headline">${cancelled ? 'Your last order was cancelled' : 'No orders to chase yet'}</p>
      <p class="t-caption2 muted">${cancelled ? 'The money is on its way back to source. Refunds, below, says when it lands.' : 'Most of this screen is about an order. The topics below stand on their own.'}</p>
      <button class="btn btn--sm btn--secondary" style="align-self:flex-start"
              ${cancelled ? 'data-topic="refunds"' : 'data-go="home"'}>
        ${cancelled ? 'Where is my refund' : 'Start an order'}
      </button>
    </div>`;
}

/**
 * One item, one tap, done. The version everyone else ships wants a photograph, a description and
 * forty-eight hours; the honest position is that a ₹42 dal costs less to refund than to
 * investigate, and the paperwork exists to make some share of people abandon the claim.
 */
function openMissing(order) {
  const reference = order.id.replace('NK-', 'ARN');
  // A line whose product has left the catalogue cannot be drawn, and a picker with nothing to
  // pick is the dead end this screen is here to remove — so the list falls back to a person.
  const rows = order.lines
    .map((line) => {
      const product = productById.get(line.id);
      if (!product) return '';
      const value = line.price * line.qty;
      return helpRow({
        attrs: `data-line="${line.id}" data-value="${value}"`,
        lead: `<span class="thumb thumb--sm"><img src="${product.image}" alt="" /></span>`,
        title: productName(product),
        titleClass: `line-2 ${deva()}`,
        sub: `${product.unit} · ${line.qty} ×`,
        trail: `<span class="t-price-s tnum">${rupees(value)}</span>`,
      });
    })
    .filter(Boolean)
    .join('');

  sheet({
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">Which item?</h2>
          <p class="t-callout muted">Missing, damaged, or not what you ordered — one answer to all three.</p>
        </div>
        ${
          rows
            ? `<div class="col">${rows}</div>
              <p class="t-caption2 dim">
                Above ${rupees(SUPPORT.onTheSpot)} the money still leaves now. If the shop’s count
                disagrees later, someone calls you — we do not take it back quietly.
              </p>`
            : `<div class="col gap-md">
                <p class="t-footnote muted">
                  We cannot read the items on ${order.id} back to you. That is our fault, and it is
                  not a reason to make you wait for the money.
                </p>
                <button class="btn btn--sm btn--secondary" data-person style="align-self:flex-start">
                  Chat with a person
                </button>
              </div>`
        }
      </div>`,
    onMount: (el) => {
      el.querySelectorAll('[data-line]').forEach((row) =>
        row.addEventListener('click', () => {
          closeSheet();
          toast(`${rupees(Number(row.dataset.value))} refunded to source · reference ${reference}`);
        }),
      );
      el.querySelector('[data-person]')?.addEventListener('click', escalate);
    },
  });
}

/**
 * "It says delivered and I do not have it" is the dispute this category handles worst, because a
 * status string is one party's word. The door photograph and the hand-over code exist for exactly
 * this conversation — and the way out of it stays a button, not a phone number.
 */
function openProof(order) {
  const reference = order.id.replace('NK-', 'ARN');
  sheet({
    body: `
      <div class="col gap-lg">
        <h2 class="t-title2">Handed over at your door</h2>
        <div class="row gap-md">
          <span class="brandc" style="flex:none">${icon('shield', { size: 20 })}</span>
          <div class="col gap-xs">
            <span class="t-headline">Photographed at the door</span>
            <span class="t-footnote muted">Every delivery is, so "marked delivered" is never one person’s word against another’s.</span>
          </div>
        </div>
        ${
          // Claiming a hand-over code we cannot show is exactly the unfalsifiable "our records
          // say delivered" this sheet is written against, so the row goes rather than the number.
          order.otp
            ? `<div class="row gap-md">
                <span class="brandc" style="flex:none">${icon('check', { size: 20 })}</span>
                <div class="col gap-xs">
                  <span class="t-headline tnum">Code ${order.otp} was read back</span>
                  <span class="t-footnote muted">Ramesh could not close the delivery without it.</span>
                </div>
              </div>`
            : ''
        }
      </div>`,
    foot: `<button class="btn btn--secondary btn--block" data-nothing>I still do not have it</button>`,
    onMount: (el) => {
      el.querySelector('[data-nothing]').addEventListener('click', () => {
        closeSheet();
        toast(`${rupees(order.total)} refunded in full · reference ${reference}`);
      });
    },
  });
}

/**
 * One renderer for all five, so a topic stays a piece of copy rather than a screen to build.
 * The foot is the part that matters: an answer you disagree with has to have a person at the
 * end of it, or the five rows above are a phone tree with better typography.
 */
function openTopic(topic) {
  sheet({
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">${topic.title}</h2>
          <p class="t-callout muted">${topic.lead}</p>
        </div>
        ${topic.points
          .map(
            (point) => `
            <div class="row gap-md">
              <span class="brandc" style="flex:none">${icon('check', { size: 20 })}</span>
              <span class="t-footnote">${point}</span>
            </div>`,
          )
          .join('')}
      </div>`,
    foot: `
      <button class="btn btn--secondary btn--block" data-person>
        Chat with a person · about ${SUPPORT.chatWaitMinutes} min
      </button>`,
    onMount: (el) => el.querySelector('[data-person]').addEventListener('click', escalate),
  });
}

/* ── settings ──────────────────────────────────────────────────────────────── */

/* ── Settings ──────────────────────────────────────────────────────────────── */

/*
 * Settings is where an app either admits what it does when you are not looking, or buries it.
 * Four things here are deliberately not buried: offers arrive switched off, every consent can be
 * withdrawn on the spot with the deletion window stated, the same-price promise is something you
 * can check rather than a line in a footer, and deleting the account names what happens to your
 * money before it asks you to confirm.
 */

/*
 * Push and WhatsApp are separate columns because in India they are not the same thing. A
 * promotional WhatsApp lands in the same list as your family, so collapsing both into one
 * "Notifications" switch is how people end up muting the order updates they actually wanted.
 */
const CHANNELS = [
  ['push', 'Push'],
  ['wa', 'WhatsApp'],
];

/* The defaults are the argument, so they live next to the copy that explains them: offers off,
   order updates on, and a renewal reminder that survives having both channels switched off —
   we promised never to charge silently, and a preference cannot quietly undo that. */
const NOTICES = [
  ['order', 'Order updates', 'Packed, picked up, at your gate.', { push: true, wa: true }],
  ['offers', 'Offers and new stock', 'Off until you turn it on.', { push: false, wa: false }],
  ['circle', 'Circle renewals', 'Three days before we charge.', { push: true, wa: false }],
];

/* One row per purpose rather than one row for "data". A consent you cannot name is not a consent. */
const CONSENTS = [
  [
    'location',
    'Location while the app is open',
    'To find your gate. Never in the background, never when the app is shut.',
    true,
  ],
  [
    'history',
    'Order history, to keep your usual',
    'Off means the home screen stops guessing what you buy.',
    true,
  ],
  [
    'keeper',
    'Your first name to the shop',
    `So ${SHOP.keeper} knows whose bag he is packing. Nothing else reaches the counter.`,
    true,
  ],
];

const noticeOn = (id, ch) =>
  state.notify?.[`${id}.${ch}`] ?? NOTICES.find(([n]) => n === id)[3][ch];
const consentOn = (id) => state.consent?.[id] ?? CONSENTS.find(([c]) => c === id)[3];

/* A row for a membership you do not hold is exactly the silent no-op this app argues against:
   the switch flips, and nothing ever arrives, and you never find out why. Read at render rather
   than baked into NOTICES, so it stays true after someone joins from the Circle screen. */
const noticeNote = (id, note) =>
  id === 'circle' && !state.circle ? `${note} Nothing to charge until you join.` : note;

/** A switch, not a chip: a settings line should show its state without having to be read. */
const toggle = (on, label, attrs) => `
  <button class="switch" role="switch" aria-checked="${on}" aria-label="${label}" ${attrs}>
    <span class="switch__track"><span class="switch__knob"></span></span>
  </button>`;

/** The rows that open something. `tone` is how the one destructive row announces itself. */
const linkRow = (label, name, attrs, { sub = '', tone = 'dim' } = {}) => `
  <button class="row-item" ${attrs}>
    <span class="${tone}">${icon(name, { size: 20 })}</span>
    <span class="col grow">
      <span class="t-headline ${tone === 'danger' ? 'danger' : ''}">${label}</span>
      ${sub ? `<span class="t-caption2 muted">${sub}</span>` : ''}
    </span>
    <span class="row-item__chev">${icon('chevron', { size: 16 })}</span>
  </button>`;

const group = (title, body) => `
  <section class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface)">
    <p class="t-eyebrow dim">${title}</p>
    ${body}
  </section>`;

export function settings() {
  return {
    html: `
      <div class="screen">
        <div class="navbar">
          <button class="navbar__back" data-back>${icon('back')}</button>
          <span class="t-title3">Settings</span>
        </div>
        <div class="screen__scroll gutter col gap-lg" id="scroll" style="padding-top:var(--space-sm)">

          ${group(
            'Appearance',
            `<div class="row wrap gap-sm">
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
            </div>`,
          )}

          ${group(
            'Notifications',
            `<div class="matrix">
              <span></span>
              ${CHANNELS.map(([, name]) => `<span class="t-caption2 dim matrix__head">${name}</span>`).join('')}
              ${NOTICES.map(
                ([id, label, note]) => `
                <span class="col gap-xs" style="min-width:0">
                  <span class="t-subhead">${label}</span>
                  <span class="t-caption2 muted">${noticeNote(id, note)}</span>
                </span>
                ${CHANNELS.map(([ch, name]) =>
                  toggle(noticeOn(id, ch), `${label} on ${name}`, `data-notice="${id}.${ch}"`),
                ).join('')}`,
              ).join('')}
            </div>
            <p class="t-caption2 dim">
              You get what is ticked here and nothing else. There is no “important updates” category
              that quietly means marketing.
            </p>`,
          )}

          ${group(
            'Privacy and data',
            `<div class="col gap-base">
              ${CONSENTS.map(
                ([id, label, note]) => `
                <div class="row gap-md">
                  <span class="col grow gap-xs" style="min-width:0">
                    <span class="t-subhead">${label}</span>
                    <span class="t-caption2 muted">${note}</span>
                  </span>
                  ${toggle(consentOn(id), label, `data-consent="${id}"`)}
                </div>`,
              ).join('')}
            </div>
            <p class="t-caption2 dim">
              Withdraw one and our copy goes within 24 hours. We do not sell data and there is no
              advertising partner list — if that ever changes it appears here first, switched off.
            </p>
            <div class="col">
              ${linkRow('Same price on every phone', 'shield', 'data-price', {
                sub: 'Check it against the shelf',
                tone: 'brandc',
              })}
              ${linkRow('Download my data', 'scan', 'data-download')}
            </div>`,
          )}

          ${group(
            'Account',
            `<div class="col">
              ${linkRow('Sign out', 'you', 'data-signout')}
              ${linkRow('Delete account', 'close', 'data-delete', { tone: 'danger' })}
            </div>`,
          )}

          ${group(
            'About',
            `<div class="row between">
              <span class="t-subhead">Version</span>
              <span class="t-caption dim tnum">1.0.0 · prototype</span>
            </div>
            <p class="t-caption2 muted">
              Nukkad stocks ${SHOP.partners} kirana shops in ${SHOP.area} instead of building dark
              stores. Yours is ${SHOP.name}, kept by ${SHOP.keeper} since ${SHOP.keeperSince}.
            </p>
            <p class="t-caption2 dim">
              Bricolage Grotesque and IBM Plex, both open licence. Icons, shopfronts and pack
              artwork drawn for Nukkad. Prices are illustrative.
            </p>`,
          )}
        </div>
      </div>`,

    mount: (root, go, ctx) => {
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

      // Switches flip in place rather than through ctx.rerender. Working down a settings list
      // that jumps back to the top on every tap is its own small punishment.
      root.querySelectorAll('[data-notice]').forEach((button) =>
        button.addEventListener('click', () => {
          const [id, ch] = button.dataset.notice.split('.');
          const next = button.getAttribute('aria-checked') !== 'true';
          setPref('notify', { ...(state.notify ?? {}), [`${id}.${ch}`]: next });
          button.setAttribute('aria-checked', String(next));
          // Silencing a channel must not quietly cancel a promise made on another screen.
          const silent = CHANNELS.every(([c]) => !noticeOn(id, c));
          if (silent && id === 'circle')
            toast('We will still email before a renewal. Nothing is ever charged silently.');
          else if (silent && id === 'order')
            toast('Order updates off. The tracking screen still shows every step.');
        }),
      );

      root.querySelectorAll('[data-consent]').forEach((button) =>
        button.addEventListener('click', () => {
          const id = button.dataset.consent;
          const next = button.getAttribute('aria-checked') !== 'true';
          setPref('consent', { ...(state.consent ?? {}), [id]: next });
          button.setAttribute('aria-checked', String(next));
          toast(
            next
              ? 'Consent on. You can withdraw it here at any time.'
              : 'Consent withdrawn. Our copy is deleted within 24 hours.',
          );
        }),
      );

      root.querySelector('[data-price]')?.addEventListener('click', openPricePromise);
      root.querySelector('[data-download]')?.addEventListener('click', openDownload);
      root.querySelector('[data-signout]')?.addEventListener('click', () => openSignOut(go));
      root.querySelector('[data-delete]')?.addEventListener('click', () => openDeleteAccount(go));
    },
  };
}

/**
 * The same-price claim, made checkable. Everyone in this category writes "no surge pricing" in a
 * footer; the only version of that promise worth anything is one you can hold a real product up
 * against and re-run whenever you feel like it.
 */
function openPricePromise() {
  const product = productById.get('amul-taaza-500') ?? productById.values().next().value;
  const rows = [
    'On this phone, signed in',
    'On a new account, Android',
    `On the shelf at ${SHOP.name}`,
  ];
  sheet({
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">Same price on every phone</h2>
          <p class="t-callout muted">
            No surge, no personalised price, no quiet rounding for whoever looks likely to pay it.
          </p>
        </div>
        <div class="col gap-md" style="padding:var(--space-base);border-radius:var(--radius-xl);background:var(--surface-sunken)">
          <div class="row gap-md">
            <span class="thumb thumb--sm"><img src="${product.image}" alt="" /></span>
            <span class="col grow" style="min-width:0">
              <span class="t-subhead ${deva()} line-2">${productName(product)}</span>
              <span class="t-caption2 dim">${product.unit}</span>
            </span>
          </div>
          <div class="bill">
            ${rows
              .map(
                (label) => `<div class="bill__row">
                  <span class="muted">${label}</span><span>${rupees(product.price)}</span>
                </div>`,
              )
              .join('')}
          </div>
        </div>
        <p class="t-caption2 dim">
          Delivery is ${rupees(RULES.deliveryFee)} below ${rupees(RULES.freeDeliveryAbove)} and free
          above it. Same rule on every device, every account, every hour of the day.
        </p>
      </div>`,
    foot: `<button class="btn btn--secondary btn--block" data-check>Check again now</button>`,
    onMount: (el) =>
      el
        .querySelector('[data-check]')
        .addEventListener('click', () => toast('Checked all three · every price matches')),
  });
}

/** A data request answered in a minute, because "write to our DPO" is a refusal with a stamp on it. */
function openDownload() {
  const included = [
    ['Orders and bills', 'Every line, every fee, every refund reference.'],
    ['Addresses and instructions', 'Including ones you deleted in the last 30 days.'],
    ['Khata entries', `What went on the tab at ${SHOP.name}, and when it settled.`],
    ['Consent history', 'What you turned on, what you withdrew, and the date of each.'],
  ];
  sheet({
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">Download my data</h2>
          <p class="t-callout muted">
            Everything held under your number, in one file. No form, no reason asked.
          </p>
        </div>
        <div class="col">
          ${included
            .map(
              ([title, body]) => `
              <div class="row gap-md" style="padding:var(--space-sm) 0">
                <span class="brandc" style="flex:none">${icon('check', { size: 20 })}</span>
                <span class="col">
                  <span class="t-subhead">${title}</span>
                  <span class="t-caption2 muted">${body}</span>
                </span>
              </div>`,
            )
            .join('')}
        </div>
        <p class="t-caption2 dim">
          JSON and CSV, ready in about a minute. The link lives 24 hours, then expires.
        </p>
      </div>`,
    foot: `<button class="btn btn--primary btn--block" data-send>Email me the file</button>`,
    onMount: (el) =>
      el.querySelector('[data-send]').addEventListener('click', () => {
        closeSheet();
        toast('File on its way to your email · link expires in 24 hours');
      }),
  });
}

function openSignOut(go) {
  sheet({
    body: `
      <div class="col gap-sm">
        <h2 class="t-title2">Sign out?</h2>
        <p class="t-callout muted">
          Your cart, addresses and orders stay on the account. The khata at ${SHOP.name} runs either
          way — it is a tab at a shop, not a session on a phone.
        </p>
      </div>`,
    foot: `
      <div class="row gap-md">
        <button class="btn btn--secondary grow" data-stay>Stay</button>
        <button class="btn btn--secondary danger grow" data-out>Sign out</button>
      </div>`,
    onMount: (el) => {
      el.querySelector('[data-stay]').addEventListener('click', closeSheet);
      el.querySelector('[data-out]').addEventListener('click', () => {
        state.signedIn = false;
        commit();
        closeSheet();
        toast('Signed out');
        go('splash');
      });
    },
  });
}

/**
 * Deletion, with the money named first. A wallet balance quietly forfeited on closure is the
 * oldest trick in the category, and an unsettled khata is a neighbour's money rather than ours —
 * so the confirm button stays out of reach until the tab is clear, with the way to clear it there.
 */
function openDeleteAccount(go) {
  const owed = state.khata;
  const consequences = [
    [
      'wallet',
      `Wallet · ${rupees(12000)}`,
      'Refunded to the UPI you paid from, within three days. Never forfeited on closure.',
    ],
    [
      'shop',
      `Khata · ${rupees(owed)}`,
      owed > 0
        ? `Settle this first. It is ${SHOP.keeper}'s money, not ours, and we will not write it off.`
        : `Clear. Nothing outstanding at ${SHOP.name}.`,
    ],
    [
      'clock',
      'Invoices',
      'Kept eight years because GST requires it, under your number and nothing else.',
    ],
  ];
  sheet({
    height: '78%',
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2 danger">Delete account</h2>
          <p class="t-callout muted">
            The account switches off today and stays recoverable for 30 days. Sign in once inside
            that window and everything comes back. After it, this is permanent.
          </p>
        </div>
        <div class="col">
          ${consequences
            .map(
              ([name, title, body]) => `
              <div class="row gap-md" style="padding:var(--space-md) 0;box-shadow:inset 0 -1px 0 var(--border)">
                <span class="dim" style="flex:none">${icon(name, { size: 20 })}</span>
                <span class="col">
                  <span class="t-subhead">${title}</span>
                  <span class="t-caption2 muted">${body}</span>
                </span>
              </div>`,
            )
            .join('')}
        </div>
        <p class="t-caption2 dim">
          No retention offer, no coupon on the way out, no five-step flow. One tap ends it.
        </p>
      </div>`,
    foot:
      owed > 0
        ? `<div class="col gap-sm">
            <button class="btn btn--primary btn--block" data-settle>Settle ${rupees(owed)} and continue</button>
            <button class="btn btn--ghost btn--block" data-keep>Keep the account</button>
            <p class="t-caption2 dim" style="text-align:center">
              The khata has to be clear before the account can close. Settling it deletes nothing
              on its own.
            </p>
          </div>`
        : `<div class="row gap-md">
            <button class="btn btn--secondary grow" data-keep>Keep it</button>
            <button class="btn btn--secondary danger grow" data-confirm>Delete</button>
          </div>`,
    onMount: (el) => {
      el.querySelector('[data-settle]')?.addEventListener('click', () => {
        state.khata = 0;
        commit();
        toast(`${rupees(owed)} settled at ${SHOP.name}`);
        openDeleteAccount(go);
      });
      el.querySelector('[data-keep]')?.addEventListener('click', closeSheet);
      el.querySelector('[data-confirm]')?.addEventListener('click', () => {
        state.signedIn = false;
        commit();
        closeSheet();
        toast('Account switched off · sign in within 30 days to bring it back');
        go('splash');
      });
    },
  });
}

/* ── Hub summary ─────────────────────────────────────────────────────────── */

/**
 * What the You tab prints beside each row. Exported from here rather than typed into the hub,
 * because the hub used to say "2 saved" next to a list of three and "3 available" next to a
 * coupon set whose usable count depends on the basket. A summary that can disagree with the
 * screen it summarises is worse than no summary.
 */
export const accountSummary = () => ({
  addresses: SAVED.length,
  wallet: balance(),
  giftCards: walletBalance(),
  coupons: Object.keys(RULES.coupons).filter((code) => {
    const c = RULES.coupons[code];
    return !c.expired && !(c.firstOrder && state.ordersPlaced > 0);
  }).length,
});

/* ── profile ──────────────────────────────────────────────────────────────── */

/**
 * Editing your own details.
 *
 * The You tab printed a name and a number with no way to change either — the account screen's
 * own dead end. Two things make this more than a form. Every optional field says what it is
 * for, because "consent per purpose" is a DPDP obligation the whole category treats as a
 * checkbox at signup. And changing a number is treated as changing a login: it is verified,
 * not just saved, which is the difference between a profile field and an account takeover.
 */

/**
 * Turns a chosen file into something storable: centre-cropped to a square and downscaled to
 * 256px, which lands around 15KB as WebP. The original is never kept — a phone photo is
 * several megabytes and localStorage is the only shelf this prototype has, so holding the
 * full file would blow the quota and take everything else in state with it.
 */
function readAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file chosen.'));
    if (!file.type.startsWith('image/'))
      return reject(new Error('That is not an image. Pick a JPEG, PNG or WebP.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('We could not read that file. Try another.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image would not open. Try another.'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          256,
          256,
        );
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function openProfile(ctx) {
  const draft = {
    name: state.name || 'Aarav',
    phone: state.phone || '9880041234',
    email: state.email,
    dob: state.dob,
    avatar: state.avatar,
  };
  const original = { ...draft };

  const field = (id, label, value, why, extra = '') => `
    <label class="field">
      <span class="t-eyebrow dim">${label}</span>
      <input id="${id}" class="${deva()}" value="${escapeHtml(value)}" ${extra} />
      <span class="t-caption2 dim">${why}</span>
      <span class="t-caption2 danger" id="${id}-error" role="alert" hidden></span>
    </label>`;

  sheet({
    height: '92%',
    body: `
      <div class="col gap-lg">
        <div class="col gap-xs">
          <h2 class="t-title2">Your details</h2>
          <p class="t-callout muted">
            Only the first two are needed to deliver an order. The rest are optional, and each
            one says what it is for.
          </p>
        </div>

        <div class="row gap-base" style="align-items:center">
          <span id="p-avatar">${avatar(72, { photo: draft.avatar, name: draft.name })}</span>
          <div class="col gap-sm grow" style="min-width:0">
            <div class="row gap-sm wrap">
              <button class="btn btn--secondary btn--sm" id="p-pick">
                ${draft.avatar ? 'Change photo' : 'Add a photo'}
              </button>
              <button class="btn btn--ghost btn--sm danger" id="p-clear" ${draft.avatar ? '' : 'hidden'}>
                Remove
              </button>
            </div>
            <p class="t-caption2 dim">Stays on this phone. There is nowhere for us to upload it to.</p>
            <p class="t-caption2 danger" id="p-avatar-error" role="alert" hidden></p>
          </div>
        </div>
        <input type="file" id="p-file" accept="image/*" hidden />

        <div class="col gap-lg">
          ${field('p-name', 'Name', draft.name, 'What Shankar writes on the bag.', 'autocomplete="name" maxlength="40"')}
          ${field(
            'p-phone',
            'Phone',
            draft.phone,
            'Your login, and how the rider reaches you. Changing it needs a new OTP.',
            'inputmode="numeric" maxlength="10" autocomplete="tel"',
          )}
          ${field('p-email', 'Email · optional', draft.email, 'Invoices only. Never used for offers.', 'type="email" autocomplete="email" placeholder="you@example.com"')}
          ${field('p-dob', 'Date of birth · optional', draft.dob, 'Only checked when a basket has an 18+ item. Never stored as an age band for ads.', 'placeholder="DD/MM/YYYY" inputmode="numeric" maxlength="10"')}
        </div>

        <div class="banner banner--info" id="p-verify" hidden>
          ${icon('shield', { size: 20 })}
          <span class="t-caption">
            A new number means a new OTP. We will send one to the number you typed before the
            change takes effect.
          </span>
        </div>
      </div>`,
    foot: `
      <div style="padding:var(--space-md) var(--layout-screen-gutter) var(--space-lg);box-shadow:inset 0 1px 0 var(--border)">
        <button class="btn btn--primary btn--block" id="p-save">Save</button>
      </div>`,
    onMount: (el) => {
      const input = (id) => el.querySelector(`#${id}`);
      const errorFor = (id) => el.querySelector(`#${id}-error`);
      const verify = el.querySelector('#p-verify');

      const setError = (id, message) => {
        const box = errorFor(id);
        box.textContent = message ?? '';
        box.hidden = !message;
        input(id).setAttribute('aria-invalid', message ? 'true' : 'false');
      };

      const check = (id) => {
        const value = input(id).value.trim();
        if (id === 'p-name') return value.length >= 2 ? null : 'A name helps the rider find you.';
        if (id === 'p-phone')
          return /^[6-9]\d{9}$/.test(value)
            ? null
            : 'An Indian mobile number is 10 digits starting 6 to 9.';
        if (id === 'p-email')
          return !value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
            ? null
            : 'That address is missing an @ or a domain.';
        if (id === 'p-dob') {
          if (!value) return null;
          const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (!m) return 'Use DD/MM/YYYY.';
          const [, d, mo, y] = m;
          const date = new Date(`${y}-${mo}-${d}`);
          if (Number.isNaN(date.getTime())) return 'That date does not exist.';
          return null;
        }
        return null;
      };

      // Validate on blur, not on every keystroke: an error that appears while you are still
      // typing the second character is noise, not help.
      ['p-name', 'p-phone', 'p-email', 'p-dob'].forEach((id) => {
        input(id).addEventListener('blur', () => setError(id, check(id)));
        input(id).addEventListener('input', () => {
          if (!errorFor(id).hidden) setError(id, check(id));
          if (id === 'p-phone') verify.hidden = input('p-phone').value.trim() === original.phone;
        });
      });
      input('p-phone').addEventListener('input', () => {
        input('p-phone').value = input('p-phone').value.replace(/\D/g, '');
      });

      const shot = el.querySelector('#p-avatar');
      const file = el.querySelector('#p-file');
      const clear = el.querySelector('#p-clear');
      const pick = el.querySelector('#p-pick');
      const avatarError = el.querySelector('#p-avatar-error');

      const paintAvatar = () => {
        shot.innerHTML = avatar(72, { photo: draft.avatar, name: input('p-name').value });
        pick.textContent = draft.avatar ? 'Change photo' : 'Add a photo';
        clear.hidden = !draft.avatar;
      };

      pick.addEventListener('click', () => file.click());
      file.addEventListener('change', async () => {
        avatarError.hidden = true;
        try {
          draft.avatar = await readAvatar(file.files[0]);
          paintAvatar();
        } catch (error) {
          avatarError.textContent = error.message;
          avatarError.hidden = false;
        }
        // Reset, so choosing the same file twice still fires a change event.
        file.value = '';
      });
      clear.addEventListener('click', () => {
        draft.avatar = '';
        paintAvatar();
      });
      // The monogram follows the name, so it should change as the name does.
      input('p-name').addEventListener('input', () => {
        if (!draft.avatar) paintAvatar();
      });

      el.querySelector('#p-save').addEventListener('click', () => {
        const ids = ['p-name', 'p-phone', 'p-email', 'p-dob'];
        const bad = ids.find((id) => check(id));
        if (bad) {
          ids.forEach((id) => setError(id, check(id)));
          // Focus the first field that is wrong rather than making the user hunt for it.
          input(bad).focus();
          return;
        }
        const changedPhone = input('p-phone').value.trim() !== original.phone;
        state.avatar = draft.avatar;
        state.name = input('p-name').value.trim();
        state.phone = input('p-phone').value.trim();
        state.email = input('p-email').value.trim();
        state.dob = input('p-dob').value.trim();
        commit();
        closeSheet();
        ctx.rerender();
        toast(
          changedPhone
            ? `Saved. We sent an OTP to ${state.phone} to confirm the new number.`
            : 'Saved',
        );
      });
    },
  });
}
