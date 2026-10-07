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
  var PACKS = C.PACKS, MAXN = PACKS[PACKS.length - 1].n;
  function needHint(n, next) {
    var prev = PACKS.filter(function (x) { return x.n < n; }).pop();
    return prev ? fmt(T.toPackOr, { k: next.n - n, n: next.n, r: n - prev.n, m: prev.n }) : fmt(T.toPack, { k: next.n - n, n: next.n });
  }
  function packFor(n) { return PACKS.filter(function (p) { return p.n === n; })[0]; }
  function packPrice(p) { return lang === "ua" ? (C.PROMO_ON ? p.promo : p.uah) : 0; }
  function packHtml() {
    if (lang !== "ua") return "";
    return '<div class="packs">' + PACKS.map(function (p) {
      return '<div class="pack"><b>' + p.n + " " + esc(T.packCards) + "</b><span>" +
        (C.PROMO_ON ? "<s>" + money(p.uah) + "</s> " : "") + "<i>" + money(packPrice(p)) + "</i></span></div>";
    }).join("") + "</div>" + (C.PROMO_ON ? '<p class="promo">' + esc(T.promo) + "</p>" : "");
  }
  function money(v) {
    var n = lang === "ua" ? String(Math.round(v * 100) / 100) : v.toFixed(2);
    return T.curPos === "after" ? n + " " + T.cur : T.cur + n;
  }
  function img(n) { return "cards/" + lang + "/" + (n < 10 ? "0" : "") + n + ".jpg"; }
  function catUrl(c) { return "catalog.html" + (c ? "?c=" + c : "") + "#" + lang; }
  // Щоденник: картинки є для мов зі списку, інші поки показують українські
  var DIARY_LANGS = ["ua", "es"];
  function dImg(k) { return "assets/diary/" + (DIARY_LANGS.indexOf(lang) >= 0 ? lang : "ua") + "-" + k + ".jpg"; }
  function dPrice() { return lang === "ua" ? C.DIARY_UAH : C.DIARY_USD; }
  function dFan() { return ["print", "day", "cover"].map(function (k) { return '<img src="' + dImg(k) + '" alt="" width="745" height="1054">'; }).join(""); }

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
    lang = l; T = Object.assign({}, I.ua, I[l]); H = X[l] || X.ua; store("we_lang", l);
    try { sel = JSON.parse(store("we_sel_" + l) || "{}") || {}; } catch (e) { sel = {}; }
    document.documentElement.lang = T.html;
    $("brandSub").textContent = T.brand;
    $("logoLink").href = "index.html#" + l;
    $("menu").innerHTML =
      '<a href="index.html#' + l + '" class="' + (PAGE === "home" ? "on" : "") + '">' + esc(H.navHome) + "</a>" +
      '<a href="' + catUrl() + '" class="' + (PAGE === "catalog" ? "on" : "") + '">' + esc(H.navCatalog) + "</a>" +
      (C.DIARY_ON ? '<a href="diary.html#' + l + '" class="' + (PAGE === "diary" ? "on" : "") + '">' + esc(H.navDiary) + "</a>" : "");
    $("langs").innerHTML = LANGS.map(function (k) {
      return '<a href="#' + k + '" class="' + (k === l ? "on" : "") + '" title="' + esc(I[k].name) + '">' + esc(I[k].label) + "</a>";
    }).join("");
    $("follow").innerHTML = esc(H.footFollow) + " " + (SOC[l] || []).map(function (s) {
      return '<a href="' + s[1] + '" target="_blank" rel="noopener">' + s[0] + "</a>";
    }).join(" · ");
    $("contact").innerHTML = C.CONTACT_EMAIL ? esc(T.contact) + ' <a href="mailto:' + esc(C.CONTACT_EMAIL) + '">' + esc(C.CONTACT_EMAIL) + "</a>" : "";
    $("rights").innerHTML = "© " + new Date().getFullYear() + " " + esc(T.rights) + ' · <a href="oferta.html">' + esc(T.offer) + "</a>";
    load(l).then(function (d) {
      cards = d;
      if (PAGE === "home") renderHome(); else if (PAGE === "diary") renderDiary(); else if (PAGE === "catalog") renderCatalog();
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
    $("heroPacks").innerHTML = packHtml();
    var D = H.diary;
    $("diaryFan").closest("section").hidden = !C.DIARY_ON;
    $("diaryFan").innerHTML = dFan();
    $("diaryKicker").textContent = D.kicker;
    $("diaryTitle").textContent = D.title;
    $("diaryLead").textContent = D.lead;
    $("diaryMeta").innerHTML = D.meta.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") +
      (dPrice() ? "<li>" + esc(money(dPrice())) + "</li>" : "");
    $("diaryBtn").textContent = D.more; $("diaryBtn").href = "diary.html#" + lang;
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

  /* ---------- щоденник ---------- */
  function renderDiary() {
    var D = H.diary;
    $("kicker").textContent = T.brand;
    $("dTitle").textContent = D.title;
    $("dLead").textContent = D.lead;
    $("dPrice").innerHTML = dPrice() ? esc(D.priceWord) + " <b>" + esc(money(dPrice())) + "</b>" : "";
    $("dBuy").textContent = $("dBuy2").textContent = D.buy;
    $("dMeta").innerHTML = D.meta.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
    $("dFan").innerHTML = dFan();
    $("dPageTitle").textContent = D.pageTitle;
    $("dPageImg").src = dImg("day");
    $("dParts").innerHTML = D.parts.map(function (s) { return "<li><b>" + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>"; }).join("");
    $("dVerTitle").textContent = D.verTitle;
    $("dVers").innerHTML = D.vers.map(function (v, i) {
      return '<figure><img src="' + dImg(i ? "print" : "day") + '" alt="" loading="lazy" width="745" height="1054"><figcaption><h3>' + esc(v[0]) + "</h3><p>" + esc(v[1]) + "</p></figcaption></figure>";
    }).join("");
    $("dSpecs").innerHTML = D.specs.map(function (s) { return '<div class="spec"><b>' + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></div>"; }).join("");
    $("dPaperTitle").textContent = D.paperTitle;
    $("dPaper").innerHTML = D.paper.map(function (s) { return "<li><b>" + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>"; }).join("");
  }

  /* ---------- каталог ---------- */
  function renderCatalog() {
    var q = (location.search.match(/[?&]c=(\w+)/) || [])[1];
    if (q && (CAT_ORDER.indexOf(q) >= 0 || q === "top")) cat = q;
    $("catTitle").textContent = H.catTitle;
    $("catLead").textContent = H.catLead;
    $("catPacks").innerHTML = packHtml();
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
  function renderBar(msg) {
    var n = selected().length, p = packFor(n), next = PACKS.filter(function (x) { return x.n > n; })[0];
    $("bar").hidden = n === 0;
    $("barCount").textContent = T.picked + ": " + n + (p && packPrice(p) ? " · " + money(packPrice(p)) : "");
    $("barSub").textContent = msg ? msg : p ? (next ? fmt(T.orMore, { k: next.n - n, n: next.n, sum: packPrice(next) ? money(packPrice(next)) : "" }) : T.packReady) :
      needHint(n, next);
    $("barBtn").textContent = T.cartBtn + " (" + n + ")";
    $("barBtn").disabled = false;
    if ($("dlg").open && $("dlg").className === "cart-dlg") renderCart();
  }
  function openCart() { $("dlg").className = "cart-dlg"; renderCart(); if (!$("dlg").open) $("dlg").showModal(); }
  function renderCart() {
    var nums = selected(), n = nums.length, p = packFor(n), next = PACKS.filter(function (x) { return x.n > n; })[0];
    var hint = p ? (next ? fmt(T.orMore, { k: next.n - n, n: next.n, sum: packPrice(next) ? money(packPrice(next)) : "" }) : T.packReady)
      : n ? needHint(n, next) : T.cartEmpty;
    $("dlgBody").innerHTML = "<h2>" + esc(T.cartTitle) + "</h2>" +
      '<div class="cart-list">' + nums.map(function (k) {
        return '<div class="cart-item" data-n="' + k + '"><img src="' + img(k) + '" alt="" loading="lazy"><span>№ ' + k +
          '</span><button class="cart-del" aria-label="' + esc(T.remove) + '">×</button></div>';
      }).join("") + "</div>" +
      '<p class="cart-hint">' + esc(hint) + "</p>" +
      (p && packPrice(p) ? '<div class="row"><span>' + esc(T.cTotal) + "</span><span><b>" + money(packPrice(p)) + "</b>" +
        (C.PROMO_ON && lang === "ua" ? " <s>" + money(p.uah) + "</s>" : "") + "</span></div>" : "") +
      '<button class="btn" id="cartGo"' + (p ? "" : " disabled") + ">" + esc(T.checkout) + "</button>" +
      '<button class="btn btn-ghost" id="cartMore">' + esc(T.cartMore) + "</button>";
    $("cartGo").onclick = function () { openCheckout(false); };
    $("cartMore").onclick = function () {
      $("dlg").close();
      if (PAGE !== "catalog") location.href = catUrl();
    };
  }
  function toggle(n) {
    if (!sel[n] && selected().length >= MAXN) { renderBar(fmt(T.maxNote, { n: MAXN })); return; }
    if (sel[n]) delete sel[n]; else sel[n] = 1;
    store("we_sel_" + lang, JSON.stringify(sel));
    var el = document.querySelector('.card[data-n="' + n + '"]');
    if (el) { el.classList.toggle("sel", !!sel[n]); el.querySelector(".add").textContent = sel[n] ? T.added : T.add; }
    renderBar();
  }
  function pad(x) { return (x < 10 ? "0" : "") + x; }
  function orderCode() {
    var d = new Date(), a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += a[Math.floor(Math.random() * a.length)];
    return "WE-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + r;
  }
  function today() { var d = new Date(); return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear(); }
  // Сума прописом (гривні, до 999 999)
  function words(sum) {
    var o = ["", "один", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять", "десять", "одинадцять", "дванадцять", "тринадцять", "чотирнадцять", "п'ятнадцять", "шістнадцять", "сімнадцять", "вісімнадцять", "дев'ятнадцять"];
    var t = ["", "", "двадцять", "тридцять", "сорок", "п'ятдесят", "шістдесят", "сімдесят", "вісімдесят", "дев'яносто"];
    var h = ["", "сто", "двісті", "триста", "чотириста", "п'ятсот", "шістсот", "сімсот", "вісімсот", "дев'ятсот"];
    function tri(x, fem) {
      var r = [h[Math.floor(x / 100)]], y = x % 100;
      if (y < 20) r.push(fem && y === 1 ? "одна" : fem && y === 2 ? "дві" : o[y]);
      else { r.push(t[Math.floor(y / 10)]); var z = y % 10; r.push(fem && z === 1 ? "одна" : fem && z === 2 ? "дві" : o[z]); }
      return r.filter(Boolean).join(" ");
    }
    function form(x, f1, f2, f5) { var y = x % 100, z = x % 10; return y > 10 && y < 20 ? f5 : z === 1 ? f1 : z > 1 && z < 5 ? f2 : f5; }
    var g = Math.floor(sum), k = Math.round((sum - g) * 100), th = Math.floor(g / 1000), u = g % 1000, r = [];
    if (th) r.push(tri(th, true), form(th, "тисяча", "тисячі", "тисяч"));
    if (u || !g) r.push(u ? tri(u, true) : "нуль");
    r.push(form(g, "гривня", "гривні", "гривень"), pad(k), form(k, "копійка", "копійки", "копійок"));
    var s = r.filter(Boolean).join(" ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function uah(v) { return v.toFixed(2).replace(".", ","); }
  // QR НБУ, формат 002 (UTF-8): https://bank.gov.ua/qr/<base64url>
  function nbuLink(sum, purpose) {
    var amount = "UAH" + (Math.round(sum * 100) % 100 ? sum.toFixed(2) : String(Math.round(sum)));
    var s = ["BCD", "002", "1", "UCT", "", C.FOP_NAME, C.FOP_IBAN.replace(/\s/g, ""), amount, C.FOP_TAX_ID, "", "", purpose].join("\n");
    return "https://bank.gov.ua/qr/" + btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function qrImg(text) { var q = qrcode(0, "M"); q.addData(text); q.make(); return q.createDataURL(6, 2); }

  function openCheckout(diary) {
    var nums = diary ? [] : selected(), p = diary ? null : packFor(nums.length);
    var total = diary ? (lang === "ua" ? C.DIARY_UAH : C.DIARY_USD) : packPrice(p);
    var ua = lang === "ua";
    $("dlg").className = "";
    $("dlgBody").innerHTML =
      (C.ORDER_URL ? "" : '<p class="warn">' + esc(T.setup) + "</p>") +
      "<h2>" + esc(T.cTitle) + "</h2>" +
      (diary ? '<div class="row"><span>' + esc(H.diary.itemLabel) + "</span><span>" + esc(H.diary.item) + "</span></div>" :
      '<div class="row"><span>' + esc(T.cCards) + "</span><span>" + nums.length + "</span></div>" +
      '<p class="nums">№ ' + nums.join(", ") + "</p>") +
      (total ? '<div class="row"><span>' + esc(T.cTotal) + "</span><span><b>" + money(total) + "</b></span></div>" : "") +
      '<label for="em">' + esc(T.cEmail) + "</label>" +
      '<input type="email" id="em" autocomplete="email" placeholder="' + esc(T.cEmailPh) + '" value="' + esc(store("we_email") || "") + '">' +
      (ua ? '<label class="agree"><input type="checkbox" id="agree"><span>' + T.cAgree + "</span></label>" : "") +
      '<p class="err" id="emErr"></p><button class="btn" id="send">' + esc(T.cSend) + "</button>";
    $("dlg").showModal();
    $("send").onclick = function () {
      var em = $("em").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { $("emErr").textContent = T.cBadEmail; return; }
      if (ua && !$("agree").checked) { $("emErr").textContent = T.cNeedAgree; return; }
      store("we_email", em);
      var code = orderCode();
      var order = { code: code, invoice: code, date: today(), lang: lang, email: em, item: diary ? "DIARY" : "PACK" + nums.length,
        cards: diary ? "" : nums.join(","), count: diary ? 1 : nums.length, total: total, currency: ua ? "UAH" : "USD",
        agree: ua, ts: new Date().toISOString() };
      order.diary = !!diary; order.nums = nums;
      function done() {
        if (!diary) {
          sel = {}; store("we_sel_" + lang, "{}");
          if (PAGE === "catalog") renderGrid();
          renderBar();
        }
        showDone(order);
      }
      if (!C.ORDER_URL) { done(); return; }
      var btn = $("send"); btn.disabled = true; btn.textContent = T.cSending; $("emErr").textContent = "";
      fetch(C.ORDER_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(order) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.ok) throw new Error("bad");
          order.invoice = d.invoice; if (d.date) order.date = d.date; done();
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = T.cSend;
          $("emErr").textContent = fmt(T.cFail, { email: C.CONTACT_EMAIL });
        });
    };
  }
  function invoiceHtml(o, purpose, link) {
    var name = fmt(T.service, { what: o.diary ? T.serviceDiary : fmt(T.serviceCards, { n: o.count }) });
    return '<div class="inv" id="inv">' +
      "<h3>" + esc(fmt(T.invTitle, { no: o.invoice, date: o.date })) + "</h3>" +
      '<div class="inv-grid"><span>' + esc(T.invSeller) + "</span><span><b>" + esc(C.FOP_FULL) + "</b><br>" + esc(C.FOP_ADDR) +
      "<br>" + esc(T.invTax) + " " + esc(C.FOP_TAX_ID) + "<br>р/р " + esc(C.FOP_IBAN) + "<br>" + esc(C.FOP_BANK) +
      "<br>тел. " + esc(C.FOP_PHONE) + " · " + esc(C.CONTACT_EMAIL) + "<br>" + esc(T.invNoVat) + "</span>" +
      "<span>" + esc(T.invBuyer) + "</span><span>" + esc(fmt(T.invBuyerTxt, { email: o.email })) + "</span></div>" +
      '<table><tr><th>№</th><th>' + esc(T.invName) + "</th><th>" + esc(T.invUnit) + '</th><th class="n">' + esc(T.invQty) +
      '</th><th class="n">' + esc(T.invPrice) + '</th><th class="n">' + esc(T.invSum) + "</th></tr>" +
      "<tr><td>1</td><td>" + esc(name) + "</td><td>" + esc(T.invUnitVal) + '</td><td class="n">1</td><td class="n">' + uah(o.total) +
      '</td><td class="n">' + uah(o.total) + "</td></tr></table>" +
      (o.diary ? "" : '<p class="inv-small">' + esc(fmt(T.invCards, { list: o.nums.join(", ") })) + "</p>") +
      '<p class="inv-total"><b>' + esc(T.invTotal) + " " + uah(o.total) + " грн</b><br>" + esc(T.invNoVat2) + "</p>" +
      '<p class="inv-words">' + esc(T.invWords) + " " + esc(words(o.total)) + ".</p>" +
      '<div class="inv-pay"><img alt="QR" src="' + qrImg(link) + '"><div><b>' + esc(T.pHow) + "</b><p>" + esc(T.pScan) + "</p><p><b>" +
      esc(T.pPurpose) + ":</b><br>" + esc(purpose) + "</p></div></div>" +
      '<p class="inv-note">' + esc(T.invNote) + "</p></div>";
  }
  function showDone(o) {
    var h = C.ORDER_URL ? "" : '<p class="warn">' + esc(T.setup) + "</p>";
    var ready = lang === "ua" && C.FOP_NAME && C.FOP_IBAN && C.FOP_TAX_ID && o.total > 0;
    if (ready) {
      var purpose = fmt(T.purpose, { no: o.invoice, date: o.date }), link = nbuLink(o.total, purpose);
      h += "<h2>" + esc(T.pTitle) + "</h2>" +
        '<div class="row"><span>' + esc(T.pSum) + "</span><span><b>" + money(o.total) + "</b></span></div>" +
        '<ol class="next">' + T.nextSteps.map(function (s) { return "<li>" + esc(fmt(s, { email: o.email })) + "</li>"; }).join("") + "</ol>" +
        '<a class="btn btn-link" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(T.pOpen) + "</a>" +
        '<button class="btn btn-ghost" id="savePdf">' + esc(T.pSave) + "</button>" +
        '<p class="note">' + esc(T.pOnly) + "</p>" +
        invoiceHtml(o, purpose, link) +
        '<button class="btn" id="doneClose">' + esc(T.close) + "</button>";
      $("dlg").className = "inv-dlg";
    } else {
      h += "<h2>" + esc(T.oTitle) + "</h2><p>" + esc(fmt(T.oText, { email: o.email, code: o.code })) + "</p>";
    }
    $("dlgBody").innerHTML = h;
    if ($("doneClose")) $("doneClose").onclick = function () { $("dlg").close(); };
    if ($("savePdf")) $("savePdf").onclick = function () { document.body.classList.add("printing"); window.print(); document.body.classList.remove("printing"); };
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
  if ($("barBtn")) $("barBtn").addEventListener("click", openCart);
  $("dlg").addEventListener("click", function (e) {
    var d = e.target.closest(".cart-del");
    if (d) toggle(+d.closest(".cart-item").getAttribute("data-n"));
  });
  if (PAGE === "diary") ["dBuy", "dBuy2"].forEach(function (id) { $(id).addEventListener("click", function () { openCheckout(true); }); });
  window.addEventListener("hashchange", function () { var l = pickLang(); if (l !== lang) setLang(l); });
  setLang(pickLang());
})();
