(function () {
  "use strict";
  var TOP = window.WE_TOP, C = window.WE_CONFIG, I = window.WE_I18N, X = window.WE_TEXTS, LANGS = window.WE_LANGS, SOC = window.WE_SOCIAL;
  var CAT_ORDER = ["health", "motivation", "family", "people", "rules", "money", "humor"];
  var PAGE = document.body.getAttribute("data-page");
  var $ = function (id) { return document.getElementById(id); };
  var lang, T, H, cards = [], cat = "all", sel = {}, cache = {};

  var ICONS = {
    fridge: '<rect x="9" y="3" width="22" height="34" rx="3"/><path d="M9 15h22M13 8v4M13 19v6"/><rect x="18" y="20" width="9" height="12" rx="1"/>',
    desk: '<path d="M4 34h32M8 34V22h24v12"/><path d="M14 22l3-12h6l3 12"/><path d="M20 10V5"/>',
    frame: '<rect x="7" y="5" width="26" height="30" rx="1"/><rect x="12" y="10" width="16" height="20"/><path d="M15 15h10M15 19h10M15 23h7"/>',
    book: '<path d="M5 8c5-2 10-2 15 1v26c-5-3-10-3-15-1z"/><path d="M35 8c-5-2-10-2-15 1v26c5-3 10-3 15-1z"/><path d="M27 6v12l2.5-2 2.5 2V7"/>',
    planner: '<rect x="8" y="5" width="25" height="31" rx="2"/><path d="M8 11h-3M8 18h-3M8 25h-3M8 32h-3"/><rect x="14" y="11" width="13" height="17"/>',
    gift: '<rect x="6" y="15" width="28" height="8"/><path d="M8 23v13h24V23M20 15v21"/><path d="M20 15c-3-6-10-7-10-3s7 3 10 3zM20 15c3-6 10-7 10-3s-7 3-10 3z"/>'
  };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function price() { return lang === "ua" ? C.PRICE_UAH : C.PRICE_USD; }
  function money(v) {
    var n = lang === "ua" ? String(Math.round(v * 100) / 100) : v.toFixed(2);
    return T.curPos === "after" ? n + " " + T.cur : T.cur + n;
  }
  function img(n) { return "cards/" + lang + "/" + (n < 10 ? "0" : "") + n + ".jpg"; }
  function catUrl(c) { return "catalog.html" + (c ? "?c=" + c : "") + "#" + lang; }

  function pickLang() {
    var h = location.hash.replace("#", "").toLowerCase();
    if (LANGS.indexOf(h) >= 0) return h;
    var s = store("we_lang"); if (LANGS.indexOf(s) >= 0) return s;
    var n = (navigator.language || "").toLowerCase();
    var map = { uk: "ua", ru: "ua", es: "es", pt: "pt", de: "de", zh: "zh", en: "en" };
    return map[n.slice(0, 2)] || "ua";
  }
  function load(l) {
    if (cache[l]) return Promise.resolve(cache[l]);
    return fetch("data/" + l + ".json").then(function (r) { return r.json(); }).then(function (d) { cache[l] = d; return d; });
  }

  /* ---------- спільне ---------- */
  function setLang(l) {
    lang = l; T = I[l]; H = X[l] || X.ua; store("we_lang", l);
    try { sel = JSON.parse(store("we_sel_" + l) || "{}") || {}; } catch (e) { sel = {}; }
    document.documentElement.lang = T.html;
    $("brandSub").textContent = T.brand;
    $("logoLink").href = "index.html#" + l;
    $("menu").innerHTML =
      '<a href="index.html#' + l + '" class="' + (PAGE === "home" ? "on" : "") + '">' + esc(H.navHome) + "</a>" +
      '<a href="' + catUrl() + '" class="' + (PAGE === "catalog" ? "on" : "") + '">' + esc(H.navCatalog) + "</a>";
    $("langs").innerHTML = LANGS.map(function (k) {
      return '<a href="#' + k + '" class="' + (k === l ? "on" : "") + '" title="' + esc(I[k].name) + '">' + esc(I[k].label) + "</a>";
    }).join("");
    $("follow").innerHTML = esc(H.footFollow) + " " + (SOC[l] || []).map(function (s) {
      return '<a href="' + s[1] + '" target="_blank" rel="noopener">' + s[0] + "</a>";
    }).join(" · ");
    $("contact").innerHTML = C.CONTACT_EMAIL ? esc(T.contact) + ' <a href="mailto:' + esc(C.CONTACT_EMAIL) + '">' + esc(C.CONTACT_EMAIL) + "</a>" : "";
    $("rights").textContent = "© " + new Date().getFullYear() + " " + T.rights;
    load(l).then(function (d) {
      cards = d;
      if (PAGE === "home") renderHome(); else renderCatalog();
      renderBar();
    });
  }

  /* ---------- головна ---------- */
  function renderHome() {
    $("kicker").textContent = T.brand;
    $("heroTitle").textContent = H.heroTitle;
    $("heroSub").textContent = H.heroSub;
    $("heroBtn").textContent = H.heroBtn; $("heroBtn").href = catUrl();
    $("heroMeta").innerHTML = H.heroMeta.map(function (m) { return "<li>" + esc(fmt(m, { n: cards.length })) + "</li>"; }).join("") +
      "<li>" + esc(T.f2) + "</li>";
    var top = TOP[lang] || TOP.ua;
    // віяло: 2-га і 3-тя по боках, 1-ша по центру (остання в DOM — зверху)
    $("fan").innerHTML = [top[1], top[2], top[0]].map(function (t) { return '<img src="' + img(t[0]) + '" alt="">'; }).join("");
    $("topTitle").textContent = H.topTitle;
    $("topSub").textContent = H.topSub;
    $("tops").innerHTML = top.slice(0, 4).map(function (t, i) {
      return '<a class="top-card" href="' + catUrl("top") + '"><img src="' + img(t[0]) + '" alt="" loading="lazy" width="540" height="810">' +
        (t[1] ? '<span class="badge">▶ ' + esc(t[1]) + " " + esc(H.views) + "</span>" : "") + '<span class="rank">' + (i + 1) + "</span></a>";
    }).join("");
    $("useTitle").textContent = H.useTitle;
    $("uses").innerHTML = H.use.map(function (u) {
      return '<div class="use"><svg viewBox="0 0 40 40">' + ICONS[u[0]] + "</svg><h3>" + esc(u[1]) + "</h3><p>" + esc(u[2]) + "</p></div>";
    }).join("");
    $("howTitle").textContent = H.howTitle;
    $("steps").innerHTML = H.how.map(function (s) { return "<li><b>" + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>"; }).join("");
    $("printTitle").textContent = H.printTitle;
    $("specs").innerHTML = H.printSpecs.map(function (s) { return '<div class="spec"><b>' + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></div>"; }).join("");
    $("print2").innerHTML = [H.printHome, H.printShop].map(function (s) { return "<div><h3>" + esc(s[0]) + "</h3><p>" + esc(s[1]) + "</p></div>"; }).join("");
    $("catsTitle").textContent = H.catsTitle;
    var first = {}, counts = {};
    cards.forEach(function (c) { counts[c.c] = (counts[c.c] || 0) + 1; if (!first[c.c]) first[c.c] = c.n; });
    $("catTiles").innerHTML = CAT_ORDER.map(function (k) {
      return '<a class="cat-tile" href="' + catUrl(k) + '"><img src="' + img(first[k]) + '" alt="" loading="lazy"><div><h3>' + esc(T.cats[k]) +
        "</h3><p>" + esc(H.catDesc[k]) + "</p><small>" + counts[k] + " " + esc(H.cardsWord) + "</small></div></a>";
    }).join("");
    $("catsBtn").textContent = H.heroBtn; $("catsBtn").href = catUrl();
    $("faqTitle").textContent = H.faqTitle;
    $("faq").innerHTML = H.faq.map(function (f) { return "<details><summary>" + esc(f[0]) + "</summary><p>" + esc(f[1]) + "</p></details>"; }).join("");
  }

  /* ---------- каталог ---------- */
  function renderCatalog() {
    var q = (location.search.match(/[?&]c=(\w+)/) || [])[1];
    if (q && (CAT_ORDER.indexOf(q) >= 0 || q === "top")) cat = q;
    $("catTitle").textContent = H.catTitle;
    $("catLead").textContent = H.catLead + (price() ? " " + money(price()) + " " + T.perCard + "." : "");
    renderCats(); renderGrid();
  }
  function renderCats() {
    var counts = {}; cards.forEach(function (c) { counts[c.c] = (counts[c.c] || 0) + 1; });
    var top = TOP[lang] || TOP.ua;
    $("cats").innerHTML = ["all", "top"].concat(CAT_ORDER).map(function (k) {
      var name = k === "all" ? T.all : k === "top" ? "★ " + H.topChip : T.cats[k];
      var n = k === "all" ? cards.length : k === "top" ? top.length : counts[k];
      return '<button data-c="' + k + '" class="' + (k === cat ? "on" : "") + '">' + esc(name) + "<i>" + n + "</i></button>";
    }).join("");
  }
  function cardHtml(c) {
    var on = sel[c.n];
    return '<article class="card' + (on ? " sel" : "") + '" data-n="' + c.n + '">' +
      '<div class="img"><img src="' + img(c.n) + '" alt="' + esc(c.t) + '" loading="lazy" width="540" height="810"><span class="chk">✓</span>' +
      (c.l.length >= 14 ? '<span class="tag">' + esc(T.small) + "</span>" : "") + "</div>" +
      '<div class="card-foot"><span class="n">№ ' + c.n + "</span>" +
      '<button class="add">' + esc(on ? T.added : T.add) + "</button></div></article>";
  }
  function renderGrid() {
    var list;
    if (cat === "top") {
      list = (TOP[lang] || TOP.ua).map(function (t) { return cards.filter(function (c) { return c.n === t[0]; })[0]; }).filter(Boolean);
    } else list = cards.filter(function (c) { return cat === "all" || c.c === cat; });
    $("grid").innerHTML = list.map(cardHtml).join("");
  }
  function zoom(n) {
    var c = cards.filter(function (x) { return x.n === n; })[0];
    $("dlg").className = "zoom";
    $("dlgBody").innerHTML = '<img src="' + img(n) + '" alt="' + esc(c.t) + '"><button class="btn" id="zAdd">' + esc(sel[n] ? T.added : T.add) + "</button>";
    $("dlg").showModal();
    $("zAdd").onclick = function () { toggle(n); this.textContent = sel[n] ? T.added : T.add; };
  }

  /* ---------- кошик ---------- */
  function selected() { return cards.filter(function (c) { return sel[c.n]; }).map(function (c) { return c.n; }); }
  function renderBar() {
    var n = selected().length, need = C.MIN_CARDS - n;
    $("bar").hidden = n === 0;
    $("barCount").textContent = T.picked + ": " + n + (price() ? " · " + money(n * price()) : "");
    $("barSub").textContent = need > 0 ? fmt(T.more, { n: need }) : fmt(T.minNote, { n: C.MIN_CARDS });
    $("barBtn").textContent = T.checkout;
    $("barBtn").disabled = need > 0;
  }
  function toggle(n) {
    if (sel[n]) delete sel[n]; else sel[n] = 1;
    store("we_sel_" + lang, JSON.stringify(sel));
    var el = document.querySelector('.card[data-n="' + n + '"]');
    if (el) { el.classList.toggle("sel", !!sel[n]); el.querySelector(".add").textContent = sel[n] ? T.added : T.add; }
    renderBar();
  }
  function orderCode() {
    var d = new Date(), p = function (x) { return (x < 10 ? "0" : "") + x; };
    var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += a[Math.floor(Math.random() * a.length)];
    return "WE-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" + r;
  }
  // QR НБУ, формат 002 (UTF-8): https://bank.gov.ua/qr/<base64url>
  function nbuLink(sum, purpose) {
    var amount = "UAH" + (Math.round(sum * 100) % 100 ? sum.toFixed(2) : String(Math.round(sum)));
    var s = ["BCD", "002", "1", "UCT", "", C.FOP_NAME, C.FOP_IBAN.replace(/\s/g, ""), amount, C.FOP_TAX_ID, "", "", purpose].join("\n");
    return "https://bank.gov.ua/qr/" + btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function qrImg(text) { var q = qrcode(0, "M"); q.addData(text); q.make(); return q.createDataURL(6, 2); }

  function openCheckout() {
    var nums = selected(), total = nums.length * price();
    $("dlg").className = "";
    $("dlgBody").innerHTML =
      (C.ORDER_URL ? "" : '<p class="warn">' + esc(T.setup) + "</p>") +
      "<h2>" + esc(T.cTitle) + "</h2>" +
      '<div class="row"><span>' + esc(T.cCards) + "</span><span>" + nums.length + "</span></div>" +
      '<p class="nums">№ ' + nums.join(", ") + "</p>" +
      (price() ? '<div class="row"><span>' + esc(T.cTotal) + "</span><span><b>" + money(total) + "</b></span></div>" : "") +
      '<label for="em">' + esc(T.cEmail) + "</label>" +
      '<input type="email" id="em" autocomplete="email" placeholder="' + esc(T.cEmailPh) + '" value="' + esc(store("we_email") || "") + '">' +
      '<p class="err" id="emErr"></p><button class="btn" id="send">' + esc(T.cSend) + "</button>";
    $("dlg").showModal();
    $("send").onclick = function () {
      var em = $("em").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { $("emErr").textContent = T.cBadEmail; return; }
      store("we_email", em);
      var order = { code: orderCode(), lang: lang, email: em, cards: nums.join(","), count: nums.length, total: total, currency: lang === "ua" ? "UAH" : "USD", ts: new Date().toISOString() };
      if (C.ORDER_URL) fetch(C.ORDER_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(order) }).catch(function () {});
      sel = {}; store("we_sel_" + lang, "{}");
      if (PAGE === "catalog") renderGrid();
      renderBar(); showDone(order);
    };
  }
  function showDone(o) {
    var h = C.ORDER_URL ? "" : '<p class="warn">' + esc(T.setup) + "</p>";
    var ready = lang === "ua" && C.FOP_NAME && C.FOP_IBAN && C.FOP_TAX_ID && o.total > 0;
    var codeRow = '<div class="row"><span>' + esc(T.pCode || "Code") + '</span><span class="code">' + esc(o.code) + "</span></div>";
    if (ready) {
      var purpose = fmt(T.purpose, { code: o.code }), link = nbuLink(o.total, purpose);
      h += "<h2>" + esc(T.pTitle) + "</h2>" + codeRow +
        '<div class="row"><span>' + esc(T.pSum) + "</span><span><b>" + money(o.total) + "</b></span></div>" +
        '<p class="note">' + esc(T.pScan) + "</p>" +
        '<div class="qr"><img alt="QR" src="' + qrImg(link) + '"></div>' +
        '<a class="btn btn-link" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(T.pOpen) + "</a>" +
        '<div class="row"><span>' + esc(T.pRecv) + "</span><span>" + esc(C.FOP_NAME) + "</span></div>" +
        '<div class="row"><span>' + esc(T.pIban) + '</span><span class="code">' + esc(C.FOP_IBAN) + "</span></div>" +
        '<div class="row"><span>' + esc(T.pTax) + "</span><span>" + esc(C.FOP_TAX_ID) + "</span></div>" +
        '<div class="row"><span>' + esc(T.pPurpose) + "</span><span>" + esc(purpose) + "</span></div>" +
        '<p class="note">' + esc(T.pOnly) + "<br>" + esc(fmt(T.pAfter, { email: o.email })) + "</p>";
    } else if (lang === "ua") {
      h += "<h2>" + esc(T.pTitle) + "</h2>" + codeRow;
    } else {
      h += "<h2>" + esc(T.oTitle) + "</h2><p>" + esc(fmt(T.oText, { email: o.email, code: o.code })) + "</p>";
    }
    $("dlgBody").innerHTML = h;
  }

  /* ---------- події ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".cats button");
    if (b) { cat = b.getAttribute("data-c"); renderCats(); renderGrid(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    var card = e.target.closest(".card");
    if (!card) return;
    var n = +card.getAttribute("data-n");
    if (e.target.closest(".add")) toggle(n); else if (e.target.closest(".img")) zoom(n);
  });
  $("barBtn").addEventListener("click", openCheckout);
  window.addEventListener("hashchange", function () { var l = pickLang(); if (l !== lang) setLang(l); });
  setLang(pickLang());
})();
