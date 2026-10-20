// Общая часть всех страниц: данные, язык, шапка, подвал, фон.
(function () {
  const STORE_KEY = "mantrogor-data";
  const LANG_KEY = "mantrogor-lang";
  const LANGS = window.MANTROGOR_LANGS;
  const codes = LANGS.map(l => l.code);

  // Изменения из admin.html (в этом браузере) важнее файла data.js. Старый формат без переводов игнорируем.
  let data = window.MANTROGOR_DATA;
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && saved.v === 2) data = saved;
  } catch (_) {}

  // Язык: ?lang=xx в адресе → выбор посетителя → язык браузера → чешский.
  function detectLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (codes.includes(q)) { try { localStorage.setItem(LANG_KEY, q); } catch (_) {} return q; }
    try { const s = localStorage.getItem(LANG_KEY); if (codes.includes(s)) return s; } catch (_) {}
    for (const l of navigator.languages || [navigator.language || ""]) {
      const c = l.toLowerCase().slice(0, 2);
      if (codes.includes(c)) return c;
    }
    return "cs";
  }
  const lang = detectLang();
  document.documentElement.lang = lang;
  const dict = window.I18N[lang], en = window.I18N.en;

  const t = (key, vars) => {
    let s = dict[key] ?? en[key] ?? key;
    if (vars) Object.keys(vars).forEach(k => s = s.replace("{" + k + "}", vars[k]));
    return s;
  };
  // Текст из data.js: объект {ru: ..., en: ...} или просто строка/массив.
  const isLoc = v => v && typeof v === "object" && !Array.isArray(v);
  const tr = v => {
    if (!isLoc(v)) return v ?? "";
    return v[lang] ?? v.en ?? v.ru ?? Object.values(v)[0] ?? "";
  };
  const plural = new Intl.PluralRules(lang);
  const days = n => {
    const forms = t("days");
    return "~" + n + " " + (forms[plural.select(n)] || forms.other);
  };

  const fmt = n => "$" + Number(n || 0).toLocaleString("en-US");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const minPrice = svc => svc.tiers.length ? Math.min(...svc.tiers.map(x => Number(x.price) || 0)) : 0;

  function copy(text, btn) {
    const old = btn.textContent;
    const done = () => { btn.textContent = t("copied"); setTimeout(() => btn.textContent = old, 1500); };
    const fail = () => { btn.textContent = t("copy_fail"); };
    try { navigator.clipboard.writeText(text).then(done, fail); } catch (_) { fail(); }
  }

  function setLang(code) {
    try { localStorage.setItem(LANG_KEY, code); } catch (_) {}
    const u = new URL(location.href);
    u.searchParams.delete("lang");
    location.href = u.toString();
  }

  // Статичные тексты страницы: data-i18n (текст), data-i18n-html (с разметкой), data-i18n-ph (подсказка в поле).
  function apply() {
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll("[data-i18n-html]").forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
    document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh));
    const tk = document.body.dataset.title;
    if (tk) document.title = tk === "home" ? "MANTROGOR — " + t("tagline") : t(tk) + " · MANTROGOR";
  }

  const PAGES = [
    ["index.html", "nav_home"],
    ["services.html", "nav_services"],
    ["projects.html", "nav_projects"],
    ["prices.html", "nav_prices"],
    ["calc.html", "nav_calc"],
    ["contacts.html", "nav_contacts"]
  ];

  function langPicker() {
    const cur = LANGS.find(l => l.code === lang);
    return `
      <div class="lang">
        <button class="lang-btn" type="button" id="langBtn" aria-haspopup="true" aria-expanded="false" aria-controls="langList" title="${esc(t("lang"))}">${cur.label} ▾</button>
        <div class="lang-list" id="langList" hidden>
          ${LANGS.map(l => `<button type="button" data-lang="${l.code}"${l.code === lang ? ' aria-current="true"' : ""}><b>${l.label}</b>${esc(l.name)}</button>`).join("")}
        </div>
      </div>`;
  }

  function wireLangPicker() {
    const btn = document.getElementById("langBtn"), list = document.getElementById("langList");
    if (!btn) return;
    const close = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", e => {
      e.stopPropagation();
      list.hidden = !list.hidden;
      btn.setAttribute("aria-expanded", String(!list.hidden));
    });
    list.addEventListener("click", e => { const b = e.target.closest("[data-lang]"); if (b) setLang(b.dataset.lang); });
    document.addEventListener("click", e => { if (!e.target.closest(".lang")) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  function header() {
    const el = document.getElementById("site-header");
    if (!el) return;
    const here = document.body.dataset.page;
    el.className = "top";
    el.innerHTML = `
      <div class="wrap">
        <a class="logo" href="index.html"><span class="logo-mark"></span>MANTROGOR</a>
        <nav class="links" id="siteNav" aria-label="${esc(t("menu"))}">
          ${PAGES.map(([href, key]) => `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${esc(t(key))}</a>`).join("")}
        </nav>
        <div class="head-right">
          ${langPicker()}
          <button class="menu-btn" type="button" id="menuBtn" aria-expanded="false" aria-controls="siteNav">${esc(t("menu"))}</button>
          <a class="btn small" href="contacts.html">${esc(t("order"))}</a>
        </div>
      </div>`;
    const btn = document.getElementById("menuBtn"), nav = document.getElementById("siteNav");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    wireLangPicker();
  }

  function footer() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "bottom";
    el.innerHTML = `
      <div class="wrap">
        <span>© 2026 MANTROGOR · ${esc(t("tagline"))}</span>
        <span>${esc(data.contacts.telegram)} · ${esc(data.contacts.email)}</span>
      </div>`;
  }

  function grid() {
    const cv = document.createElement("canvas");
    cv.id = "grid-bg"; cv.setAttribute("aria-hidden", "true");
    document.body.prepend(cv);
    const ctx = cv.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h;
    function size() { const r = window.devicePixelRatio || 1; w = innerWidth; h = innerHeight; cv.width = w * r; cv.height = h * r; ctx.setTransform(r, 0, 0, r, 0, 0); }
    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      const horizon = h * 0.62, off = still ? 0 : (time / 40) % 40;
      ctx.lineWidth = 1;
      for (let i = 0; i < 26; i++) {
        const y = horizon + Math.pow((i * 40 + off) / 1040, 2) * (h - horizon + 200);
        if (y > h) break;
        ctx.strokeStyle = `rgba(46,242,255,${0.05 + (y - horizon) / h * 0.35})`;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let i = -20; i <= 20; i++) {
        ctx.strokeStyle = "rgba(255,43,214,0.14)";
        ctx.beginPath(); ctx.moveTo(w / 2 + i * 18, horizon); ctx.lineTo(w / 2 + i * 160, h); ctx.stroke();
      }
      if (!still) requestAnimationFrame(draw);
    }
    size();
    addEventListener("resize", () => { size(); if (still) draw(0); });
    still ? draw(0) : requestAnimationFrame(draw);
  }

  // Карточка проекта для главной и страницы «Проекты».
  const projectCard = p => {
    const svc = data.services.find(s => s.id === p.cat);
    const isBot = p.cat === "bot";
    return `
    <article class="proj" data-cat="${esc(p.cat || "")}">
      <a class="proj-shot" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="${esc(p.title)}">
        <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" width="800" height="500">
        <span class="proj-host">${esc(p.host)}</span>
        ${isBot ? `<span class="proj-sample">${esc(t("proj_sample"))}</span>` : ""}
      </a>
      <div class="proj-body">
        ${p.status ? `<span class="proj-status st-${esc(p.status)}">${esc(t("st_" + p.status))}</span>` : ""}
        ${svc ? `<span class="label">${esc(svc.code)} · ${esc(tr(svc.title))}</span>` : ""}
        <h3>${esc(p.title)}</h3>
        <p>${esc(tr(p.desc))}</p>
        <div class="proj-tags">${(p.tags || []).map(x => `<span>${esc(x)}</span>`).join("")}</div>
        ${p.host === "Render" ? `<div class="proj-wake">${esc(t("proj_wake"))}</div>` : ""}
        <div class="cta-row">
          <a class="btn small" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t(isBot ? "proj_bot_site" : p.cat === "app" ? "proj_open_app" : "proj_open"))} ↗</a>
          ${p.repo ? `<a class="btn small ghost" href="${esc(p.repo)}" target="_blank" rel="noopener">${esc(t("proj_code"))}</a>` : ""}
        </div>
      </div>
    </article>`;
  };

  window.M = { data, fmt, esc, copy, minPrice, STORE_KEY, t, tr, days, lang, LANGS, isLoc, projectCard };
  header(); footer(); apply(); grid();
})();
