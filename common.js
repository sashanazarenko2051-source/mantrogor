// Общая часть всех страниц: данные, шапка, подвал, фон.
(function () {
  const STORE_KEY = "mantrogor-data";

  // Изменения из admin.html (в этом браузере) важнее файла data.js.
  let data = window.MANTROGOR_DATA;
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) data = JSON.parse(saved);
  } catch (_) {}

  const fmt = n => "$" + Number(n || 0).toLocaleString("en-US");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const minPrice = svc => svc.tiers.length ? Math.min(...svc.tiers.map(t => Number(t.price) || 0)) : 0;

  function copy(text, btn) {
    const old = btn.textContent;
    const done = () => { btn.textContent = "Скопировано"; setTimeout(() => btn.textContent = old, 1500); };
    const fail = () => { btn.textContent = "Выделите и скопируйте вручную"; };
    try { navigator.clipboard.writeText(text).then(done, fail); } catch (_) { fail(); }
  }

  const PAGES = [
    ["index.html", "главная"],
    ["services.html", "услуги"],
    ["prices.html", "цены"],
    ["calc.html", "калькулятор"],
    ["contacts.html", "контакты"]
  ];

  function header() {
    const el = document.getElementById("site-header");
    if (!el) return;
    const here = document.body.dataset.page;
    el.className = "top";
    el.innerHTML = `
      <div class="wrap">
        <a class="logo" href="index.html"><span class="logo-mark"></span>MANTROGOR</a>
        <button class="menu-btn" type="button" id="menuBtn" aria-expanded="false" aria-controls="siteNav">меню</button>
        <nav class="links" id="siteNav" aria-label="Страницы">
          ${PAGES.map(([href, name]) => `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${name}</a>`).join("")}
        </nav>
        <a class="btn small" href="contacts.html">Заказать</a>
      </div>`;
    const btn = document.getElementById("menuBtn"), nav = document.getElementById("siteNav");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  function footer() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "bottom";
    el.innerHTML = `
      <div class="wrap">
        <span>© 2026 MANTROGOR · сайты · боты · программы</span>
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
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const horizon = h * 0.62, off = still ? 0 : (t / 40) % 40;
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

  window.M = { data, fmt, esc, copy, minPrice, STORE_KEY };
  header(); footer(); grid();
})();
