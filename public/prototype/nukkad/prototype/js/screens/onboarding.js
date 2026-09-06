import { icon } from '../icons.js';
import { state, commit, setPref } from '../store.js';
import { deva, t } from '../ui.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Getting in. Zepto gets a first-time user to their first order in under three minutes;
   the sequence below is deliberately the same shape — permission asked in context, address
   filled from GPS, OTP auto-filled — with the dark patterns left out.
   ───────────────────────────────────────────────────────────────────────────── */

export function splash() {
  return {
    html: `
      <div class="screen" style="background:var(--brand)">
        <div class="col center grow gap-lg">
          <div class="splash-mark">
            <img src="../brand/logo/nukkad-mark-onBrand.svg" alt="Nukkad" width="92" height="92" />
          </div>
          <div class="col center gap-xs">
            <p class="t-title1" style="color:#FBF9F5">nukkad</p>
            <p class="t-footnote" style="color:rgba(251,249,245,.72)">Everything, a corner away</p>
          </div>
        </div>
        <p class="t-caption2" style="color:rgba(251,249,245,.5);text-align:center;padding-bottom:34px">
          Made for India
        </p>
      </div>
      <style>
        .splash-mark { animation: mark-in 620ms cubic-bezier(.22,1,.36,1); }
        @keyframes mark-in {
          from { opacity: 0; transform: translateY(14px) scale(.86); }
          to { opacity: 1; transform: none; }
        }
      </style>`,
    mount: (_, go) => setTimeout(() => go(state.signedIn ? 'home' : 'onboarding'), 1400),
  };
}

const SLIDES = [
  {
    art: 'shop',
    title: 'Your corner shop,\nopen at app speed',
    titleHi: 'आपका नुक्कड़,\nऐप की रफ़्तार पर',
    body: 'Around three thousand things people actually run out of, from the store closest to you.',
    bodyHi: 'तीन हज़ार चीज़ें जो सच में ख़त्म होती हैं — आपके सबसे पास की दुकान से।',
  },
  {
    art: 'bill',
    title: 'One fee.\nOn every button.',
    titleHi: 'एक ही फ़ीस।\nहर बटन पर।',
    body: 'No handling fee, no surge, no rain fee, no small-cart fee. The amount you see is the amount you pay.',
    bodyHi: 'कोई हैंडलिंग, सर्ज, बारिश या छोटे कार्ट की फ़ीस नहीं। जो दिखता है, वही देना है।',
  },
  {
    art: 'clock',
    title: 'An honest clock',
    titleHi: 'सच्ची घड़ी',
    body: 'We quote a range we can keep, and credit you ₹25 if we miss it by more than fifteen minutes.',
    bodyHi: 'हम वही समय बताते हैं जो निभा सकें। पंद्रह मिनट से ज़्यादा देर हुई तो ₹25 वापस।',
  },
];

export function onboarding() {
  return {
    html: `
      <div class="screen">
        <div class="topbar">
          <div class="row gap-sm">
            <button class="chip ${state.lang === 'en' ? 'chip--on' : ''}" data-lang="en"
                    aria-pressed="${state.lang === 'en'}">EN</button>
            <button class="chip deva ${state.lang === 'hi' ? 'chip--on' : ''}" data-lang="hi"
                    aria-pressed="${state.lang === 'hi'}">हिं</button>
          </div>
          <button class="t-caption muted tap-44 ${deva()}" data-go="phone">${t('skip')}</button>
        </div>

        <div class="grow col" style="overflow:hidden">
          <div class="row" id="slides" style="height:100%;transition:transform 420ms cubic-bezier(.22,1,.36,1)">
            ${SLIDES.map(
              (slide) => `
              <div class="col center gap-lg gutter" style="min-width:100%;text-align:center">
                ${slideArt(slide.art)}
                <h1 class="t-large-title ${deva()}" style="white-space:pre-line">
                  ${state.lang === 'hi' ? slide.titleHi : slide.title}
                </h1>
                <p class="t-callout muted ${deva()}" style="max-width:30ch">
                  ${state.lang === 'hi' ? slide.bodyHi : slide.body}
                </p>
              </div>`,
            ).join('')}
          </div>
        </div>

        <div class="col gap-lg gutter" style="padding-bottom:32px">
          <div class="row center gap-xs" id="dots">
            ${SLIDES.map((_, i) => `<span class="dot" data-i="${i}"></span>`).join('')}
          </div>
          <button class="btn btn--primary btn--block ${deva()}" id="next">${t('getStarted')}</button>
        </div>
      </div>
      <style>
        .dot { width:6px;height:6px;border-radius:3px;background:var(--border-strong);transition:all 280ms cubic-bezier(.22,1,.36,1); }
        .dot[data-on] { width:20px;background:var(--brand); }
      </style>`,
    mount: (root, go) => {
      let index = 0;
      const slides = root.querySelector('#slides');
      const dots = [...root.querySelectorAll('.dot')];
      const paint = () => {
        slides.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => dot.toggleAttribute('data-on', i === index));
        root.querySelector('#next').textContent =
          index === SLIDES.length - 1 ? t('getStarted') : t('next');
      };
      paint();
      root.querySelector('#next').addEventListener('click', () => {
        if (index < SLIDES.length - 1) {
          index += 1;
          paint();
        } else go('phone');
      });
      root.querySelectorAll('[data-lang]').forEach((button) =>
        button.addEventListener('click', () => {
          setPref('lang', button.dataset.lang);
          go('onboarding');
        }),
      );
    },
  };
}

function slideArt(kind) {
  // Paper-cut scenes: flat shapes, four inks, no faces. Same language as the empty states.
  const scenes = {
    shop: `
      <svg viewBox="0 0 200 150" width="196" height="147" aria-hidden="true">
        <rect x="18" y="46" width="164" height="86" rx="10" fill="var(--illo-ink1)"/>
        <path d="M10 46 26 18h148l16 28Z" fill="var(--illo-ink2)"/>
        <g fill="var(--illo-ink3)">
          <path d="M26 18h24l-6 28H20Z"/><path d="M74 18h24l-2 28H72Z"/><path d="M122 18h24l4 28h-26Z"/>
        </g>
        <rect x="34" y="60" width="60" height="10" rx="5" fill="var(--illo-ink2)" opacity=".45"/>
        <rect x="34" y="78" width="42" height="10" rx="5" fill="var(--illo-ink2)" opacity=".3"/>
        <path d="M112 132V96a22 22 0 0 1 44 0v36Z" fill="var(--illo-ink4)"/>
        <circle cx="146" cy="114" r="4" fill="var(--illo-ink2)"/>
      </svg>`,
    bill: `
      <svg viewBox="0 0 200 150" width="196" height="147" aria-hidden="true">
        <path d="M46 14h108v122l-13-9-14 9-13-9-14 9-13-9-14 9-13-9-14 9Z" fill="var(--illo-ink1)"/>
        <rect x="64" y="34" width="72" height="9" rx="4.5" fill="var(--illo-ink2)"/>
        <rect x="64" y="54" width="52" height="7" rx="3.5" fill="var(--illo-ink2)" opacity=".35"/>
        <rect x="64" y="70" width="60" height="7" rx="3.5" fill="var(--illo-ink2)" opacity=".35"/>
        <rect x="64" y="94" width="72" height="12" rx="6" fill="var(--illo-ink4)"/>
        <circle cx="150" cy="112" r="24" fill="var(--illo-ink2)"/>
        <path d="m140 112 7 7 14-14" stroke="var(--illo-ink1)" stroke-width="5" fill="none"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    clock: `
      <svg viewBox="0 0 200 150" width="196" height="147" aria-hidden="true">
        <circle cx="100" cy="76" r="54" fill="var(--illo-ink1)"/>
        <circle cx="100" cy="76" r="42" fill="var(--illo-ink2)" opacity=".16"/>
        <path d="M100 44v34l22 14" stroke="var(--illo-ink2)" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M154 30c8 0 14 6 14 14s-6 14-14 14" fill="var(--illo-ink4)"/>
        <path d="M36 118c-8 0-14-6-14-14s6-14 14-14" fill="var(--illo-ink3)"/>
      </svg>`,
  };
  return scenes[kind] ?? '';
}

export function phone() {
  return {
    html: `
      <div class="screen">
        <div class="navbar"><button class="navbar__back" data-back>${icon('back')}</button></div>
        <div class="grow col gap-xl gutter" style="padding-top:12px">
          <div class="col gap-sm">
            <h1 class="t-large-title">Enter your number</h1>
            <p class="t-callout muted">We will text a code to confirm it is you.</p>
          </div>

          <div class="col gap-md">
            <label class="rowcard rowcard--sunken">
              <span class="t-headline dim">+91</span>
              <span style="width:1px;height:22px;background:var(--border)"></span>
              <input id="num" inputmode="numeric" maxlength="10" placeholder="98xxx xxxxx" autocomplete="tel"
                     style="flex:1;border:0;background:none;outline:0;font:inherit;font-size:17px;letter-spacing:.04em;color:var(--text)" />
            </label>
            <p class="t-caption2 dim">
              By continuing you agree to our Terms and Privacy Policy. We ask for consent per purpose,
              and you can withdraw it any time under the DPDP Act.
            </p>
          </div>

          <button class="btn btn--primary btn--block" id="go" disabled>Get OTP</button>

          <div class="row gap-md center">
            <span style="flex:1;height:1px;background:var(--border)"></span>
            <span class="t-caption2 dim">or</span>
            <span style="flex:1;height:1px;background:var(--border)"></span>
          </div>
          <button class="btn btn--secondary btn--block" data-quick>Continue with WhatsApp</button>
        </div>
      </div>`,
    mount: (root, go) => {
      const input = root.querySelector('#num');
      const button = root.querySelector('#go');
      input.focus();
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '');
        button.disabled = input.value.length !== 10;
      });
      const submit = () => {
        state.phone = input.value || '9880041234';
        commit();
        go('otp');
      };
      button.addEventListener('click', submit);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !button.disabled) submit();
      });
      root.querySelector('[data-quick]').addEventListener('click', () => {
        input.value = '9880041234';
        submit();
      });
    },
  };
}

export function otp() {
  return {
    html: `
      <div class="screen">
        <div class="navbar"><button class="navbar__back" data-back>${icon('back')}</button></div>
        <div class="grow col gap-xl gutter" style="padding-top:12px">
          <div class="col gap-sm">
            <h1 class="t-large-title">Enter the code</h1>
            <p class="t-callout muted">Sent to +91 ${state.phone || '98800 41234'} ·
              <button class="brandc t-callout" data-back>Edit</button></p>
          </div>

          <div class="col gap-md">
            <div class="otp" id="otp">
              ${[0, 1, 2, 3].map(() => '<input inputmode="numeric" maxlength="1" />').join('')}
            </div>
            <p class="t-caption dim" id="hint">Auto-filling from your messages…</p>
          </div>

          <button class="btn btn--primary btn--block" id="verify" disabled>Verify</button>
          <p class="t-caption2 dim">Prototype: any four digits will do.</p>
        </div>
      </div>`,
    mount: (root, go, ctx) => {
      const inputs = [...root.querySelectorAll('.otp input')];
      const verify = root.querySelector('#verify');
      const sync = () => {
        verify.disabled = inputs.some((input) => !input.value);
      };

      inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
          input.value = input.value.replace(/\D/g, '');
          if (input.value && index < inputs.length - 1) inputs[index + 1].focus();
          sync();
        });
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Backspace' && !input.value && index > 0) inputs[index - 1].focus();
        });
      });

      inputs[0].focus();
      // Android reads the code straight out of the SMS; iOS offers it from the keyboard. Both
      // mean a user should almost never type this, so the prototype fills it in too.
      //
      // The timer has to be cancelled on the way out. Tapping Back or Edit inside this window
      // left it running against a screen the router had already replaced, and it threw on the
      // first thing it touched — a hard crash on the two most likely taps on this screen.
      const autofill = setTimeout(() => {
        '4821'.split('').forEach((digit, i) => {
          inputs[i].value = digit;
        });
        root.querySelector('#hint').textContent = 'Code filled from your messages';
        sync();
      }, 900);
      ctx.onLeave(() => clearTimeout(autofill));

      const submit = () => {
        state.signedIn = true;
        state.name = state.name || 'Aarav';
        commit();
        go(state.address ? 'home' : 'location');
      };
      verify.addEventListener('click', submit);
    },
  };
}

const AREAS = [
  {
    id: 'indiranagar',
    name: 'Indiranagar',
    detail: '100 Ft Road, Bengaluru',
    eta: '11 min',
    ok: true,
  },
  {
    id: 'koramangala',
    name: 'Koramangala 5th Block',
    detail: 'Bengaluru',
    eta: '13 min',
    ok: true,
  },
  { id: 'hsr', name: 'HSR Layout Sector 2', detail: 'Bengaluru', eta: '16 min', ok: true },
  { id: 'mysuru', name: 'Vijayanagar, Mysuru', detail: 'Not here yet', eta: null, ok: false },
];

export function location() {
  return {
    html: `
      <div class="screen">
        <div class="navbar"><button class="navbar__back" data-back>${icon('back')}</button></div>
        <div class="grow col gap-lg gutter" style="padding-top:12px">
          <div class="col gap-sm">
            <h1 class="t-large-title">Where are we<br/>delivering?</h1>
            <p class="t-callout muted">Your location decides the store, the shelf and the clock.</p>
          </div>

          <button class="rowcard rowcard--brand" data-detect>
            <span class="brandc">${icon('pin')}</span>
            <span class="col grow">
              <span class="t-headline brandc">Use my current location</span>
              <span class="t-caption2 muted">Fastest way in</span>
            </span>
          </button>

          <div class="col">
            <p class="t-eyebrow dim" style="padding-bottom:10px">Or pick an area</p>
            ${AREAS.map(
              (area) => `
              <button class="row-item" data-area="${area.id}" ${area.ok ? '' : 'style="opacity:.55"'}>
                <span class="dim">${icon('pin', { size: 20 })}</span>
                <span class="col grow">
                  <span class="t-headline">${area.name}</span>
                  <span class="t-caption2 muted">${area.detail}</span>
                </span>
                ${
                  area.ok
                    ? `<span class="chip chip--on t-caption2">${area.eta}</span>`
                    : '<span class="chip t-caption2">Notify me</span>'
                }
              </button>`,
            ).join('')}
          </div>
        </div>
      </div>`,
    mount: (root, go, { toast }) => {
      const pick = (area) => {
        if (!area.ok) {
          toast('We will text you when Nukkad reaches Mysuru');
          return;
        }
        state.address = {
          label: 'Home',
          line: `402, Prestige Ferns · ${area.name}`,
          area: area.name,
        };
        commit();
        go('home');
      };
      root.querySelector('[data-detect]').addEventListener('click', () => pick(AREAS[0]));
      root
        .querySelectorAll('[data-area]')
        .forEach((button) =>
          button.addEventListener('click', () =>
            pick(AREAS.find((a) => a.id === button.dataset.area)),
          ),
        );
    },
  };
}
