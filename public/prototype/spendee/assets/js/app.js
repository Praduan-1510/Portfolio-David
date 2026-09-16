/* Spendee prototype — shared interactions */
(function () {
  const params = new URLSearchParams(location.search);
  if (params.has('capture')) document.body.classList.add('capture');
  if (window.self !== window.top) {
    document.body.classList.add('embedded');
    const id = (location.pathname.match(/([\w-]+)\.html$/) || [])[1];
    try { window.parent.postMessage({ spendeeScreen: id }, '*'); } catch (e) {}
  }


  // Bottom tab bar component: <nav data-tabbar="home|ledger|bank|more|none"></nav>
  const TAB_ICONS = {
    home: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3.5 11.2 13 3.6l9.5 7.6v10.2a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6V11.2Z"/><path d="M10 23v-7.5h6V23"/></svg>',
    ledger: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M7.6 2.8h7.6c.8 0 1.3.3 1.9.8l4.3 4.4c.5.5.8 1.1.8 1.9v12.1a1.9 1.9 0 0 1-1.9 1.9H7.6a1.9 1.9 0 0 1-1.9-1.9V4.7a1.9 1.9 0 0 1 1.9-1.9Z"/></svg>',
    bank: '<svg viewBox="1 1 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M2.6 9.2 13 3.4l10.4 5.8H2.6Z"/><path d="M4 11.4h18M4 21.2h18M2.6 23.6h20.8"/><path d="M6.8 11.4v9.8M19.2 11.4v9.8" /><path d="M10.4 14.6v3.6M13 14.6v3.6M15.6 14.6v3.6" stroke-width="2.2"/></svg>',
    more: '<svg viewBox="0 0 26 26" fill="currentColor"><circle cx="5.6" cy="13" r="2.5"/><circle cx="13" cy="13" r="2.5"/><circle cx="20.4" cy="13" r="2.5"/></svg>'
  };
  document.querySelectorAll('[data-tabbar]').forEach((nav) => {
    const active = nav.getAttribute('data-tabbar');
    const tab = (key, label, x, href) => `<a class="tab tap" href="${href}" style="left:${x}px"${active === key ? ' aria-current="page"' : ''}>${TAB_ICONS[key]}<span>${label}</span></a>`;
    nav.classList.add('tabbar');
    nav.setAttribute('aria-label', 'Primary');
    nav.innerHTML =
      tab('home', 'Home', 44.5, 'dashboard.html') +
      tab('ledger', 'Ledger', 122.5, 'contact.html') +
      '<a class="fab" href="add-entry.html" aria-label="Add entry"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"><path d="M14 3v22M3 14h22"/></svg></a>' +
      tab('bank', 'Bank', 278, 'bank.html') +
      tab('more', 'More', 356, 'more.html') +
      '<span class="home-indicator"></span>';
  });

  // Navigation: any [data-go] element routes to another screen
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go]');
    if (!el) return;
    e.preventDefault();
    const target = el.getAttribute('data-go');
    if (target === 'back') { history.length > 1 ? history.back() : (location.href = 'dashboard.html'); return; }
    location.href = target + '.html';
  });

  // Keyboard activation for non-button tappables
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-go]:not(button):not(a), [role="switch"], [role="tab"]')) {
      e.preventDefault(); e.target.click();
    }
  });

  // Toggle switches
  document.querySelectorAll('[role="switch"]').forEach((sw) => {
    sw.tabIndex = 0;
    sw.addEventListener('click', () => sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true'));
  });

  // Segmented chips / tabs: [data-group] containers with [role=tab] children
  document.querySelectorAll('[data-group]').forEach((group) => {
    const cls = group.getAttribute('data-active-class') || 'is-active';
    group.querySelectorAll('[role="tab"]').forEach((tab) => {
      tab.tabIndex = 0;
      tab.addEventListener('click', () => {
        group.querySelectorAll('[role="tab"]').forEach((t) => { t.classList.remove(cls); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add(cls); tab.setAttribute('aria-selected', 'true');
        group.dispatchEvent(new CustomEvent('change', { detail: tab.dataset.value }));
      });
    });
  });

  // Filterable lists: chips with data-filter drive items with data-status
  document.querySelectorAll('[data-filter-target]').forEach((group) => {
    const list = document.querySelector(group.getAttribute('data-filter-target'));
    group.addEventListener('change', (e) => {
      const v = e.detail;
      list.querySelectorAll('[data-status]').forEach((item) => {
        const show = v === 'all' || item.dataset.status === v;
        item.style.display = show ? '' : 'none';
      });
    });
  });

  // Count-up numbers
  if (!document.body.classList.contains('capture') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const final = el.textContent;
      const target = parseFloat(el.dataset.count);
      const fmt = el.dataset.format || 'in';
      const prefix = el.dataset.prefix || '';
      const start = performance.now(), dur = 900;
      const format = (n) => fmt === 'in' ? Math.round(n).toLocaleString('en-IN') : Math.round(n).toString();
      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + format(target * eased);
        if (p < 1) requestAnimationFrame(step); else el.textContent = final;
      };
      requestAnimationFrame(step);
    });
  }

  // Toast helper
  window.spendeeToast = function (msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      (document.querySelector('.screen, .page') || document.body).appendChild(t);
    }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-toast]');
    if (el) window.spendeeToast(el.getAttribute('data-toast'));
  });

  /* ======================================================================
     v2 — shared behaviours for extended screens
     ====================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = (window.Spendee = window.Spendee || {});
  S.toast = window.spendeeToast;
  S.q = (k) => new URLSearchParams(location.search).get(k);
  S.store = {
    get(k, d) { try { const v = localStorage.getItem('spendee:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('spendee:' + k, JSON.stringify(v)); } catch (e) {} },
  };
  S.wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 150) : ms));
  S.go = (href) => { location.href = href; };
  S.haptic = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (e) {} };

  // Loading buttons: returns promise resolved after ms
  S.loading = async (btn, ms = 1100) => {
    if (!btn) return S.wait(ms);
    btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true');
    await S.wait(ms);
    btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy');
  };

  // ---- Bottom sheets -----------------------------------------------------
  let openSheet = null, lastFocus = null, scrim = null;
  const ensureScrim = () => {
    if (scrim) return scrim;
    scrim = document.createElement('div'); scrim.className = 'sheet-scrim'; scrim.hidden = true;
    scrim.addEventListener('click', () => S.sheet.close());
    document.body.appendChild(scrim); return scrim;
  };
  S.sheet = {
    open(id) {
      const el = typeof id === 'string' ? document.getElementById(id) : id;
      if (!el) return;
      if (openSheet && openSheet !== el) S.sheet.close(true);
      lastFocus = document.activeElement;
      const sc = ensureScrim(); sc.hidden = false;
      el.hidden = false; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      requestAnimationFrame(() => { sc.classList.add('open'); el.classList.add('open'); });
      openSheet = el;
      setTimeout(() => { const f = el.querySelector('[autofocus], input, button:not(.sheet__close), [tabindex="0"]'); f && f.focus({ preventScroll: true }); }, 60);
      el.dispatchEvent(new CustomEvent('sheet:open'));
    },
    close(instant) {
      if (!openSheet) return;
      const el = openSheet; openSheet = null;
      el.classList.remove('open'); el.style.transform = '';
      if (scrim) scrim.classList.remove('open');
      const done = () => { if (!openSheet) { if (scrim) scrim.hidden = true; } el.hidden = true; };
      instant ? done() : setTimeout(done, 300);
      el.dispatchEvent(new CustomEvent('sheet:close'));
      lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    },
  };
  $$('.sheet').forEach((el) => {
    el.hidden = true;
    if (!el.querySelector('.sheet__grab')) { const g = document.createElement('span'); g.className = 'sheet__grab'; g.setAttribute('aria-hidden', 'true'); el.prepend(g); }
    // drag-to-dismiss on the grabber / head
    let y0 = null, dy = 0;
    const start = (e) => { y0 = (e.touches ? e.touches[0] : e).clientY; dy = 0; el.classList.add('dragging'); };
    const move = (e) => { if (y0 == null) return; dy = Math.max(0, (e.touches ? e.touches[0] : e).clientY - y0); el.style.transform = `translateY(${dy}px)`; };
    const end = () => { if (y0 == null) return; y0 = null; el.classList.remove('dragging'); if (dy > 90) S.sheet.close(); else el.style.transform = ''; };
    const grab = el.querySelector('.sheet__grab');
    grab.addEventListener('pointerdown', (e) => { grab.setPointerCapture(e.pointerId); start(e); });
    grab.addEventListener('pointermove', move); grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  });
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-sheet]');
    if (open) { e.preventDefault(); S.sheet.open(open.getAttribute('data-sheet')); return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); S.sheet.close(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (dialogOpen) dialogOpen(false); else S.sheet.close(); }
    if (e.key === 'Tab' && openSheet) {
      const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]', openSheet).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // Radio-style option lists: [data-options] > .option[role=radio]
  $$('[data-options]').forEach((group) => {
    group.setAttribute('role', 'radiogroup');
    $$('.option', group).forEach((o) => {
      o.setAttribute('role', 'radio'); if (!o.hasAttribute('aria-checked')) o.setAttribute('aria-checked', 'false');
      o.addEventListener('click', () => {
        $$('.option', group).forEach((x) => x.setAttribute('aria-checked', 'false'));
        o.setAttribute('aria-checked', 'true');
        group.dispatchEvent(new CustomEvent('select', { detail: o.dataset.value || o.textContent.trim() }));
      });
    });
  });

  // ---- Dialogs -----------------------------------------------------------
  let dialogOpen = null;
  const ICONS = {
    danger: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    info: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5h.01"/></svg>',
    ok: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  };
  S.dialog = ({ title, message = '', confirm = 'Confirm', cancel = 'Cancel', tone = 'danger', icon } = {}) => new Promise((resolve) => {
    const wrap = document.createElement('div'); wrap.className = 'dialog-wrap';
    const tones = { danger: ['#452626', '#f15858', 'btn--danger'], info: ['#283845', '#5fb2f1', 'btn--primary'], ok: ['#314528', '#8df15e', 'btn--primary'] };
    const [bg, fg, cls] = tones[tone] || tones.info;
    wrap.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-m">
      <div class="dialog__icon" style="background:${bg};color:${fg}">${icon || ICONS[tone] || ICONS.info}</div>
      <p class="dialog__title" id="dlg-t">${title}</p><p class="dialog__msg" id="dlg-m">${message}</p>
      <div class="dialog__actions" ${cancel ? '' : 'style="grid-template-columns:1fr"'}>${cancel ? `<button class="btn btn--neutral" data-r="0">${cancel}</button>` : ''}<button class="btn ${cls}" data-r="1">${confirm}</button></div></div>`;
    const prev = document.activeElement;
    const close = (r) => { dialogOpen = null; wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 200); prev && prev.focus && prev.focus({ preventScroll: true }); resolve(r); };
    dialogOpen = close;
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(false); const b = e.target.closest('[data-r]'); if (b) close(b.dataset.r === '1'); });
    document.body.appendChild(wrap);
    requestAnimationFrame(() => { wrap.classList.add('open'); wrap.querySelector('[data-r="1"]').focus(); });
  });
  // Declarative confirm: <a href data-confirm="Title|Message|Confirm label|tone">
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-confirm]');
    if (!el || el.dataset.confirmed) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const [title, message, confirm, tone] = el.dataset.confirm.split('|');
    if (await S.dialog({ title, message, confirm: confirm || 'Confirm', tone: tone || 'danger' })) {
      if (el.dataset.confirmToast) S.toast(el.dataset.confirmToast);
      if (el.getAttribute('href') && el.getAttribute('href') !== '#') { await S.wait(el.dataset.confirmToast ? 700 : 0); location.href = el.getAttribute('href'); }
      else { el.dataset.confirmed = '1'; el.click(); delete el.dataset.confirmed; }
    }
  }, true);

  // ---- OTP inputs: <div class="otp" data-length="6" data-code="123456"> ----
  $$('.otp').forEach((box) => {
    const n = +box.dataset.length || 6;
    if (!box.children.length) box.innerHTML = Array.from({ length: n }, (_, i) => `<input inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" aria-label="Digit ${i + 1} of ${n}">`).join('');
    const ins = $$('input', box);
    const value = () => ins.map((i) => i.value).join('');
    const emit = () => { ins.forEach((i) => i.classList.toggle('filled', !!i.value)); box.classList.remove('is-error'); if (value().length === n) box.dispatchEvent(new CustomEvent('complete', { detail: value() })); };
    ins.forEach((inp, i) => {
      inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); emit(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) { ins[i - 1].focus(); ins[i - 1].value = ''; emit(); } });
      inp.addEventListener('paste', (e) => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, n); if (!t) return; e.preventDefault(); t.split('').forEach((c, k) => { if (ins[k]) ins[k].value = c; }); ins[Math.min(t.length, n - 1)].focus(); emit(); });
    });
    box.fill = (code) => { code.split('').forEach((c, k) => { if (ins[k]) ins[k].value = c; }); emit(); };
    box.reset = () => { ins.forEach((i) => (i.value = '')); emit(); ins[0].focus(); };
  });

  // ---- PIN keypad: <div class="keypad" data-target="dotsId" data-length="4|6"> ----
  $$('.keypad').forEach((pad) => {
    const n = +pad.dataset.length || 4;
    const dots = document.getElementById(pad.dataset.target);
    if (!pad.children.length) {
      pad.innerHTML = ['1','2','3','4','5','6','7','8','9'].map((d) => `<button type="button" data-k="${d}">${d}</button>`).join('') +
        `<button type="button" class="key-muted" data-k="bio" aria-label="Use biometrics"><svg width="24" height="24" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 5.2A10 10 0 0 1 19 5.2"/><path d="M3 9.5a10 10 0 0 1 18 0"/><path d="M4.5 17.5C4 15.8 4 14 4.5 12.5A7.8 7.8 0 0 1 19.5 12.5c.3 1.2.4 2.5.2 3.8"/><path d="M8 22c-1.3-2-2-4.3-1.7-6.7A5.7 5.7 0 0 1 17.7 15c.2 1.8.1 3.6-.4 5.3"/><path d="M11.2 23.5C9.6 21.3 9 18.6 9.3 16a2.7 2.7 0 0 1 5.4.2c.2 2-.1 3.9-.8 5.8"/></svg></button><button type="button" data-k="0">0</button><button type="button" class="key-muted" data-k="del" aria-label="Delete"><svg width="26" height="20" viewBox="0 0 26 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M8 2h15a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 23 18H8l-6.5-8L8 2Z"/><path d="m12 7 6 6M18 7l-6 6"/></svg></button>`;
    }
    if (dots && !dots.children.length) dots.innerHTML = '<i></i>'.repeat(n);
    let val = '';
    const render = () => $$('i', dots).forEach((d, i) => d.classList.toggle('on', i < val.length));
    pad.reset = () => { val = ''; render(); };
    pad.error = () => { dots.classList.add('is-error'); S.haptic(); setTimeout(() => { dots.classList.remove('is-error'); pad.reset(); }, 420); };
    const press = (k) => {
      if (k === 'bio') { pad.dispatchEvent(new CustomEvent('biometric')); return; }
      if (k === 'del') val = val.slice(0, -1); else if (val.length < n) val += k;
      render(); S.haptic();
      if (val.length === n) { const v = val; setTimeout(() => pad.dispatchEvent(new CustomEvent('complete', { detail: v })), 160); }
    };
    pad.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
    pad.addEventListener('keydown', (e) => { if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') press('del'); });
    pad.tabIndex = -1;
    document.addEventListener('keydown', (e) => { const sh = pad.closest('.sheet'); if (pad.offsetParent === null || (sh && !sh.classList.contains('open'))) return; if (/^\d$/.test(e.key) && !/input|textarea/i.test(document.activeElement.tagName)) press(e.key); if (e.key === 'Backspace' && !/input|textarea/i.test(document.activeElement.tagName)) press('del'); });
  });

  // ---- Countdown: <button data-countdown="30">Resend code</button> ----
  $$('[data-countdown]').forEach((btn) => {
    const label = btn.textContent.trim(); const secs = +btn.dataset.countdown;
    const run = () => {
      let t = secs; btn.disabled = true;
      const tick = () => { btn.textContent = `${label} in 0:${String(t).padStart(2, '0')}`; if (t-- <= 0) { btn.disabled = false; btn.textContent = label; clearInterval(h); } };
      tick(); const h = setInterval(tick, 1000);
    };
    btn.addEventListener('click', () => { if (!btn.disabled) { S.toast('New code sent'); run(); } });
    run();
  });

  // ---- Range sliders fill + live output: <input type=range class=range data-out="id" data-fmt="inr|pct|months"> ----
  const fmtIN = (n) => Math.round(n).toLocaleString('en-IN');
  $$('input.range').forEach((r) => {
    const out = r.dataset.out && document.getElementById(r.dataset.out);
    const upd = () => {
      const p = ((r.value - r.min) / (r.max - r.min)) * 100; r.style.setProperty('--p', p + '%');
      if (out) { const f = r.dataset.fmt; out.textContent = f === 'inr' ? '₹ ' + fmtIN(r.value) : f === 'months' ? r.value + ' months' : f === 'pct' ? r.value + '%' : r.value; }
      r.dispatchEvent(new CustomEvent('update'));
    };
    r.addEventListener('input', upd); upd();
  });
  S.fmtIN = fmtIN;

  // ---- Segmented controls: .segmented > button[role=tab] ----
  $$('.segmented').forEach((seg) => {
    seg.setAttribute('role', 'tablist');
    $$('button', seg).forEach((b) => { b.setAttribute('role', 'tab'); if (!b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', 'false');
      b.addEventListener('click', () => { $$('button', seg).forEach((x) => x.setAttribute('aria-selected', 'false')); b.setAttribute('aria-selected', 'true'); seg.dispatchEvent(new CustomEvent('change', { detail: b.dataset.value })); }); });
  });

  // ---- Inline validation helper: data-validate="required|email|gstin|phone|pan" on inputs inside .fg ----
  const RULES = {
    required: (v) => v.trim().length > 0 || 'This field is required',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email, e.g. name@business.com',
    phone: (v) => v.replace(/\D/g, '').length === 10 || 'Enter a 10-digit mobile number',
    gstin: (v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/i.test(v.trim()) || 'GSTIN should be 15 characters, e.g. 19AEYPA4821F1Z5',
    pan: (v) => /^[A-Z]{5}\d{4}[A-Z]$/i.test(v.trim()) || 'PAN should look like ABCDE1234F',
    amount: (v) => parseFloat(String(v).replace(/[^\d.]/g, '')) > 0 || 'Enter an amount greater than 0',
  };
  S.validate = (root = document) => {
    let first = null;
    $$('[data-validate]', root).forEach((inp) => {
      const fg = inp.closest('.fg'); if (!fg) return;
      const msgs = inp.dataset.validate.split('|').map((r) => RULES[r] && RULES[r](inp.value)).filter((m) => m !== true && m);
      fg.classList.toggle('has-error', msgs.length > 0);
      let et = fg.querySelector('.error-text');
      if (!et) { et = document.createElement('span'); et.className = 'error-text'; et.setAttribute('role', 'alert'); fg.appendChild(et); }
      et.textContent = msgs[0] || '';
      if (msgs.length && !first) first = inp;
    });
    if (first) first.focus();
    return !first;
  };
  document.addEventListener('focusout', (e) => { const inp = e.target.closest && e.target.closest('[data-validate]'); if (inp && inp.value) S.validate(inp.closest('.fg')); });
  document.addEventListener('input', (e) => { const fg = e.target.closest && e.target.closest('.fg.has-error'); if (fg) fg.classList.remove('has-error'); });

  // Deep-link a sheet open: ?sheet=id (used by the showcase gallery)
  if (S.q('sheet')) setTimeout(() => S.sheet.open(S.q('sheet')), document.body.classList.contains('capture') ? 0 : 350);
})();
