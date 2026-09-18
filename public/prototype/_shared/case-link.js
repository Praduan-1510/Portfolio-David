/*
 * case-link.js: the portfolio's way back out of a prototype.
 *
 * Every playable prototype under /prototype is a static page that can be the
 * top-level document (the case study's "Open" link, a bookmark, a shared URL),
 * and none of them knows the portfolio exists. This draws one small link back
 * to the case study, and ONLY when the page is not inside a frame: the case
 * study's own demo frame embeds these pages and has its own Close, and some
 * prototypes frame their own screens.
 *
 * One tag per page, just before </head>:
 *
 *   <script defer src="/prototype/_shared/case-link.js"
 *     data-href="/work/keel" data-label="Back to the Keel case study"
 *     data-position="top-center"></script>
 *
 * data-position is a CSS-like list; later entries win wherever they match:
 *
 *   "<anchor> [y] [x] [flags]; (<condition>) <anchor> [y] [x] [flags]"
 *
 *   condition  a media condition, e.g. (max-width: 767px), or (match: <selector>),
 *            true while document.querySelector(selector) finds something: for
 *            single-file prototypes that swap shells by route (OmniStock sets
 *            body[data-shell]). Several can be joined with "and".
 *
 *   anchor   top-left | top-center | top-right | bottom-left | bottom-center | bottom-right
 *   y, x     px in from the anchored edges, before the safe-area inset (default 16).
 *            y = 0 turns the pill into a tab that hangs from that edge.
 *   short    show only the end of the label ("Case study"); it unrolls to the
 *            whole label on hover and on keyboard focus. Always on at 520px and
 *            below, where the whole label would cover too much of a phone app.
 *   compact  once the visitor starts using the page (or has had six seconds to
 *            read it), fold to the arrow alone; hover and focus unfold it. For
 *            layouts where no corner is free of the prototype's own chrome.
 *
 * ?case-link=0 in the page URL turns it off, so capture scripts shoot clean
 * stills. It renders into a shadow root, so the prototype's CSS cannot restyle
 * it and none of its CSS reaches the prototype. It never throws into the page,
 * never takes focus, and adds no key or click handling of its own.
 */
(function () {
  "use strict";

  var ANCHORS = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
  var SETTLE_AFTER_MS = 6000;
  var EXPO = "cubic-bezier(.16,1,.3,1)";
  var QUAD = "cubic-bezier(.25,1,.5,1)";

  /* The portfolio's own colours (src/app/globals.css), written out as values
     because nothing from the site is loaded here: graphite-900 ground, bone
     type and hairline, flame for the arrow and the focus ring. Sizes are px,
     never rem: a prototype's root font-size is its own business. */
  var BASE_CSS =
    ":host{all:initial!important;position:fixed!important;z-index:2147483647!important;display:block!important;" +
    "width:max-content!important;max-width:calc(100vw - 24px)!important;height:auto!important;" +
    "margin:0!important;padding:0!important;visibility:visible!important;pointer-events:auto!important;" +
    "contain:layout style!important;--cl-from:6px}" +
    "@media print{:host{display:none!important}}" +
    "nav{display:flex;margin:0;padding:0}" +
    ".pill{--h:36px;box-sizing:border-box;display:flex;align-items:center;height:var(--h);padding:0 10px;margin:0;" +
    "border:1px solid rgba(247,240,228,.18);border-radius:999px;" +
    "background:rgba(13,13,16,.9);-webkit-backdrop-filter:blur(12px) saturate(140%);backdrop-filter:blur(12px) saturate(140%);" +
    "box-shadow:inset 0 1px 0 rgba(247,240,228,.07),0 10px 28px -12px rgba(0,0,0,.65),0 2px 6px -2px rgba(0,0,0,.45);" +
    "color:#ccc3b1;text-decoration:none;cursor:pointer;" +
    'font:500 11px/1 ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono","DejaVu Sans Mono",monospace;' +
    "letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;font-variant-ligatures:none;" +
    "-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;touch-action:manipulation;" +
    "-webkit-user-select:none;user-select:none;" +
    "opacity:0;transform:translateY(var(--cl-from));" +
    "transition:opacity .4s " + EXPO + " .35s,transform .6s " + EXPO + " .35s," +
    "border-color .2s " + QUAD + ",color .2s " + QUAD + ",background-color .2s " + QUAD + "}" +
    ".pill.is-in{opacity:1;transform:none}" +
    ".arrow{display:block;flex:none;width:16px;height:16px;color:#fb7b20;transition:transform .2s " + QUAD + "}" +
    ".lbl{display:grid;grid-template-columns:1fr;transition:grid-template-columns .45s " + EXPO + "}" +
    ".lbl-in{display:flex;align-items:center;min-width:0;overflow:hidden;transition:opacity .25s " + QUAD + "}" +
    ".rule{flex:none;width:1px;height:14px;margin:0 10px;background:rgba(247,240,228,.2)}" +
    // The short label is the whole label's own tail ("case study"): the head
    // before it sits in a grid column that folds to nothing, clipped from its
    // left (the rtl wrapper), so unrolling it reads back from the tail.
    ".head{display:grid;grid-template-columns:1fr;transition:grid-template-columns .45s " + EXPO + "}" +
    ".head-clip{min-width:0;overflow:hidden;direction:rtl}" +
    ".head-clip>span,.tail{display:block;padding-top:1px;direction:ltr;unicode-bidi:isolate;white-space:pre}" +
    "@media (pointer:coarse){.pill{--h:44px;padding:0 14px;font-size:12px}}" +
    "@media (hover:hover){.pill:hover{border-color:rgba(251,123,32,.75);color:#f7f0e4}.pill:hover .arrow{transform:translateX(-2px)}}" +
    ".pill:active{background-color:rgba(7,7,8,.94)}" +
    ".pill:focus{outline:none}" +
    /* The ring is the site's own (2px flame, 2px offset), sandwiched in graphite
       so it holds well over 3:1 on Keel's cream and CareBridge's white as well
       as on the dark prototypes. */
    ".pill:focus-visible{outline:2px solid #fb7b20;outline-offset:2px;color:#f7f0e4;border-color:rgba(251,123,32,.75);" +
    "box-shadow:0 0 0 2px #0d0d10,0 0 0 6px #0d0d10,0 10px 28px -12px rgba(0,0,0,.65)}" +
    "@media (prefers-reduced-transparency:reduce){.pill{background-color:#0d0d10;-webkit-backdrop-filter:none;backdrop-filter:none}}" +
    "@media (forced-colors:active){.pill{background:Canvas;color:LinkText;border-color:LinkText;box-shadow:none;" +
    "-webkit-backdrop-filter:none;backdrop-filter:none}.arrow{color:LinkText}.rule{background:LinkText}" +
    ".pill:focus-visible{outline-color:Highlight}}";

  /* After the entries: phones always get the short label, and hover or focus
     unfolds everything. Under reduced motion nothing moves (no entrance, no
     fold, no nudge); the states still change, instantly. */
  var H = ":host([data-when]) ";
  var TAIL_CSS =
    "@media (max-width:520px){" + H + ".pill .head{grid-template-columns:0fr}}" +
    "@media (hover:hover){" + H + ".pill:hover .head{grid-template-columns:1fr}" +
    H + ".pill.is-settled:hover .lbl{grid-template-columns:1fr}" + H + ".pill.is-settled:hover .lbl-in{opacity:1}}" +
    H + ".pill:focus-visible .head{grid-template-columns:1fr}" +
    H + ".pill.is-settled:focus-visible .lbl{grid-template-columns:1fr}" + H + ".pill.is-settled:focus-visible .lbl-in{opacity:1}" +
    "@media (prefers-reduced-motion:reduce){.pill,.arrow,.lbl,.lbl-in,.head{transition:none!important}" +
    ".pill,.pill:hover .arrow{transform:none!important}}";

  var ARROW =
    '<svg class="arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">' +
    '<path d="M13.25 8H3.5M7.75 3.5 3.25 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var script = document.currentScript;
  var href, label, entries;

  try {
    if (!script) return;
    var isTop = false;
    try {
      isTop = window.self === window.top;
    } catch (e) {
      isTop = false; // a parent we are not allowed to look at is still a parent
    }
    if (!isTop) return;
    if (new URLSearchParams(location.search).get("case-link") === "0") return;

    href = script.getAttribute("data-href") || "";
    label = (script.getAttribute("data-label") || "").trim();
    // Same-site paths only: a data attribute must never become a javascript: URL.
    if (!/^\/(?!\/)/.test(href) || !label) return;
    entries = parse(script.getAttribute("data-position") || "");

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { safely(mount); }, { once: true });
    } else {
      safely(mount);
    }
  } catch (e) {
    /* never break the page this sits on */
  }

  function safely(fn) {
    try {
      fn();
    } catch (e) {
      /* see above */
    }
  }

  function parse(spec) {
    var out = [];
    spec.split(";").forEach(function (raw) {
      var s = raw.trim(), media = [], match = [];
      // Leading conditions: balanced (...) groups, optionally joined by "and".
      while (s.charAt(0) === "(") {
        var depth = 0, i = 0;
        for (; i < s.length; i++) {
          if (s.charAt(i) === "(") depth++;
          else if (s.charAt(i) === ")" && --depth === 0) break;
        }
        if (depth) return; // unbalanced: drop the entry rather than guess
        var inner = s.slice(1, i).trim();
        if (/^match\s*:/i.test(inner)) {
          var sel = inner.replace(/^match\s*:/i, "").trim();
          try { document.querySelector(sel); } catch (e) { return; } // not a selector: drop it
          match.push(sel);
        } else {
          media.push("(" + inner.replace(/[{}<>;@]/g, "") + ")");
        }
        s = s.slice(i + 1).replace(/^\s*and\s+/i, "").trim();
      }
      var t = s.split(/\s+/);
      if (ANCHORS.indexOf(t[0]) < 0) return;
      var nums = t.slice(1).filter(function (v) { return /^\d{1,4}(\.\d+)?$/.test(v); }).map(Number);
      out.push({
        media: media.join(" and "),
        match: match,
        anchor: t[0],
        y: nums.length > 0 ? nums[0] : 16,
        x: nums.length > 1 ? nums[1] : 16,
        short: t.indexOf("short") > 0,
        compact: t.indexOf("compact") > 0,
      });
    });
    if (!out.length || out[0].media || out[0].match.length) {
      out.unshift({ media: "", match: [], anchor: "bottom-left", y: 16, x: 16, short: false, compact: false });
    }
    return out;
  }

  /* One entry: placement, shape, label length and fold. Every entry sets all
     of them, so a later match replaces an earlier one instead of mixing. Every
     entry's selectors carry the same weight (a (match:) entry keys off its own
     index in the host's data-when), so source order alone decides. */
  function entryCSS(e, k) {
    var side = e.anchor.split("-"), v = side[0], h = side[1];
    var tab = e.y === 0, inset = "env(safe-area-inset-" + v + ",0px)";
    var host = e.match.length ? ':host([data-when~="' + k + '"])' : ":host([data-when])", H = host + " ";
    var css = host + "{";
    css += v + ":" + (tab ? "0" : "calc(" + e.y + "px + " + inset + ")") + "!important;" +
      (v === "top" ? "bottom" : "top") + ":auto!important;" +
      "--cl-from:" + (v === "top" ? "-" : "") + (tab ? "100%" : "6px") + ";";
    if (h === "center") {
      css += "left:0!important;right:0!important;margin-left:auto!important;margin-right:auto!important;";
    } else {
      var far = h === "left" ? "right" : "left";
      css += h + ":calc(" + e.x + "px + env(safe-area-inset-" + h + ",0px))!important;" + far + ":auto!important;" +
        "margin-left:0!important;margin-right:0!important;";
    }
    css += "}";
    // A tab keeps its flat side on the edge and grows into the safe area, so it
    // stays attached to the glass while its content stays clear of the notch.
    css += tab
      ? H + ".pill{border-radius:0;border-" + (v === "top" ? "bottom" : "top") + "-left-radius:calc(var(--h) / 2);" +
        "border-" + (v === "top" ? "bottom" : "top") + "-right-radius:calc(var(--h) / 2);border-width:1px;border-" + v + "-width:0;" +
        "height:calc(var(--h) + " + inset + ");padding-" + v + ":" + inset + ";padding-" + (v === "top" ? "bottom" : "top") + ":0}"
      : H + ".pill{border-radius:999px;border-width:1px;height:var(--h);padding-top:0;padding-bottom:0}";
    css += H + ".pill .head{grid-template-columns:" + (e.short ? "0fr" : "1fr") + "}";
    css += e.compact
      ? H + ".pill.is-settled .lbl{grid-template-columns:0fr}" + H + ".pill.is-settled .lbl-in{opacity:0}"
      : H + ".pill.is-settled .lbl{grid-template-columns:1fr}" + H + ".pill.is-settled .lbl-in{opacity:1}";
    return e.media ? "@media " + e.media + "{" + css + "}" : css;
  }

  /* Which (match:) entries hold right now, as indices on the host. Routers put
     their state on <html>/<body> or in the hash, so those are what is watched,
     and at most once a frame. */
  function watchMatches(host) {
    var queued = false;
    function sync() {
      queued = false;
      var on = [];
      entries.forEach(function (e, k) {
        if (e.match.length && e.match.every(function (m) { return !!document.querySelector(m); })) on.push(k);
      });
      var v = on.join(" ");
      if (host.getAttribute("data-when") !== v) host.setAttribute("data-when", v);
    }
    function queue() {
      if (!queued) { queued = true; requestAnimationFrame(function () { safely(sync); }); }
    }
    sync();
    if (!entries.some(function (e) { return e.match.length; })) return;
    var mo = new MutationObserver(queue);
    mo.observe(document.documentElement, { attributes: true });
    if (document.body) mo.observe(document.body, { attributes: true });
    window.addEventListener("hashchange", queue);
    window.addEventListener("popstate", queue);
  }

  function mount() {
    if (document.querySelector("case-study-link")) return;

    var host = document.createElement("case-study-link");
    var root = host.attachShadow({ mode: "open" });
    root.innerHTML =
      "<style>" + BASE_CSS + entries.map(entryCSS).join("") + TAIL_CSS + "</style>" +
      '<nav lang="en" dir="ltr" aria-label="Portfolio"><a class="pill">' + ARROW +
      '<span class="lbl"><span class="lbl-in"><span class="rule"></span>' +
      '<span class="head"><span class="head-clip"><span></span></span></span><span class="tail"></span>' +
      "</span></span></a></nav>";

    var link = root.querySelector("a");
    link.setAttribute("href", href);
    link.setAttribute("aria-label", label);
    // The short form is the label's own last words when it ends "case study";
    // any other label has no short form and always shows whole.
    var cut = /case study$/i.test(label) ? label.length - 10 : 0;
    root.querySelector(".head-clip>span").textContent = label.slice(0, cut);
    root.querySelector(".tail").textContent = label.slice(cut);

    // A child of <html>, just before <body>: first in the tab order the way a
    // skip link is, and outside anything a prototype re-renders, counts, or
    // selects with body > * or :nth-child. Fixed, so it takes no room in the flow.
    host.setAttribute("data-when", "");
    var html = document.documentElement;
    if (document.body && document.body.parentNode === html) html.insertBefore(host, document.body);
    else html.appendChild(host);
    watchMatches(host);

    // Two frames, so the hidden state paints before the entrance transition starts.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { link.classList.add("is-in"); });
    });

    if (entries.some(function (e) { return e.compact; })) settleOnFirstUse(host, link);
  }

  /* "Settled" = the visitor has started using the prototype, or has had long
     enough to read the label. Only real input counts (never a scroll event, and
     never an event a prototype dispatches itself): the prototypes scroll on
     load and on every route. The six seconds run only while the page is loaded
     and visible, so a heavy page still painting, or a tab opened in the
     background, keeps its label for when someone is actually looking. Every
     listener is passive and on the capture phase, so nothing here can delay,
     cancel or reorder the page's own handling. */
  function settleOnFirstUse(host, link) {
    var kinds = ["pointerdown", "keydown", "wheel", "touchmove"];
    var opts = { capture: true, passive: true };
    var left = SETTLE_AFTER_MS, since = 0, timer = 0, done = false;
    var loaded = document.readyState === "complete";
    function onInput(e) {
      if (e.isTrusted && e.target !== host) settle(); // using the link itself is not "moving on"
    }
    function onBlur() {
      // Focus moving into a same-page iframe (Spendee's phone) is use. Focus
      // leaving the window (another tab, another app) is not.
      setTimeout(function () {
        var a = document.activeElement;
        if (a && a.tagName === "IFRAME") settle();
      }, 0);
    }
    function start() {
      if (done || since || !loaded || document.visibilityState === "hidden") return;
      since = Date.now();
      timer = setTimeout(settle, Math.max(0, left));
    }
    function pause() {
      if (!since) return;
      clearTimeout(timer);
      left -= Date.now() - since;
      since = 0;
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") pause();
      else start();
    }
    function onLoad() {
      loaded = true;
      start();
    }
    function settle() {
      if (done) return;
      done = true;
      kinds.forEach(function (k) { document.removeEventListener(k, onInput, opts); });
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("load", onLoad);
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(timer);
      link.classList.add("is-settled");
    }
    kinds.forEach(function (k) { document.addEventListener(k, onInput, opts); });
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    if (!loaded) window.addEventListener("load", onLoad, { once: true });
    start();
  }
})();
