/* ==========================================================================
   Emek Sofrası — Menü sayfası
   - Kapalı menü kitabı → tıkla → açık menü görünümü
   - 7 gün butonu (Pazartesi–Pazar) + önceki/sonraki oklar
   - Tek "açık kitap" sahnesi: SOL = HTML menü metni, SAĞ = o günün yemek
     görseli (gorselYemek) — tek kaynak, altta tekrar eden ikinci blok yok
   - 3D görseller hazır olunca sadece menu-data.js'teki "gorselYemek" değişir
   ========================================================================== */
(function () {
  "use strict";

  var DATA = window.MENU_DATA || {};
  var days = (DATA.gunler || []).slice();
  if (DATA.pazar) days.push(DATA.pazar);
  var fixed = DATA.sabitAnaYemekler || [];

  var closed = document.querySelector("[data-menu-closed]");
  var open = document.querySelector("[data-menu-open]");
  var trigger = document.querySelector("[data-menu-trigger]");
  var img = document.querySelector("[data-menu-image]");
  var textPanel = document.querySelector("[data-menu-text]");
  var tabsWrap = document.querySelector("[data-menu-tabs]");
  var prevBtn = document.querySelector("[data-menu-prev]");
  var nextBtn = document.querySelector("[data-menu-next]");
  var weekLabel = document.querySelector("[data-menu-week]");
  var noteEl = document.querySelector("[data-menu-note]");

  if (!open || !days.length) return;

  var activeIndex = 0;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (weekLabel && DATA.hafta) weekLabel.textContent = DATA.hafta;
  if (noteEl && DATA.not) noteEl.textContent = DATA.not;

  /* ---- Gün sekmeleri ---- */
  var tabs = days.map(function (d, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "day-tab";
    b.textContent = d.ad;
    b.setAttribute("data-day", d.id);
    b.addEventListener("click", function () { setActiveDay(i); });
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); setActiveDay(activeIndex + 1, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setActiveDay(activeIndex - 1, true); }
    });
    tabsWrap.appendChild(b);
    return b;
  });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function listHtml(items) {
    return items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
  }

  function group(title, items) {
    if (!items || !items.length) return "";
    return '<section class="menu-group"><h3>' + esc(title) + "</h3><ul>" + listHtml(items) + "</ul></section>";
  }

  function renderText(day) {
    if (!textPanel) return;
    if (day.kapali) {
      var msgs = (day.mesajlar || []).map(function (m) {
        return '<section class="menu-group"><h3>' + esc(m.baslik) + "</h3><p>" + esc(m.metin) + "</p></section>";
      }).join("");
      textPanel.innerHTML =
        '<header class="menu-text__head"><span class="menu-text__day">' + esc(day.ad) + "</span>" +
        '<span class="menu-text__sub">Günün Menüsü</span></header>' +
        msgs +
        '<p class="menu-text__closed">' + esc(day.kapanis || "") + "</p>";
      return;
    }
    var anaYemekler = [day.anaYemek].concat(fixed).filter(Boolean);
    textPanel.innerHTML =
      '<header class="menu-text__head"><span class="menu-text__day">' + esc(day.ad) + "</span>" +
      '<span class="menu-text__sub">Günün Menüsü</span></header>' +
      group("Günün Çorbası", [day.corba]) +
      group("Ana Yemekler", anaYemekler) +
      group("Yan Ürünler", day.yanUrunler) +
      group("İçecek", [day.icecek]);
  }

  function setActiveDay(index, keepFocus) {
    if (index < 0 || index >= days.length) return;
    activeIndex = index;
    var day = days[index];

    if (img) {
      img.classList.remove("is-in");
      var apply = function () {
        img.src = day.gorsel || day.gorselYemek;
        img.alt = day.ad + " günü menüsü";
        requestAnimationFrame(function () { img.classList.add("is-in"); });
      };
      if (reduce) apply();
      else setTimeout(apply, 160);
    }

    renderText(day);

    tabs.forEach(function (t, i) {
      var on = i === index;
      t.classList.toggle("is-active", on);
      if (on) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === days.length - 1;

    if (keepFocus && tabs[index]) tabs[index].focus();
  }

  if (prevBtn) prevBtn.addEventListener("click", function () { setActiveDay(activeIndex - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { setActiveDay(activeIndex + 1); });

  /* ---- Kitabı aç ---- */
  function openBook() {
    if (closed) {
      closed.classList.add("is-opening");
      var reveal = function () {
        closed.hidden = true;
        open.hidden = false;
        setActiveDay(0);
        var h = open.querySelector(".day-tab") || open.querySelector("[data-menu-next]");
        if (h) h.focus({ preventScroll: true });
        /* Açık menü zaten ilk ekranda tam görünüyor — sayfayı kaydırma.
           Yalnızca kullanıcı menü bölümünün altındaysa yukarı getir. */
        var top = (document.querySelector(".menu-section") || open).getBoundingClientRect().top;
        if (top < -20 || top > window.innerHeight * 0.5) {
          document.querySelector(".menu-section").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
      };
      if (reduce) reveal();
      else setTimeout(reveal, 650);
    } else {
      open.hidden = false;
      setActiveDay(0);
    }
  }

  if (trigger) {
    trigger.addEventListener("click", openBook);
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBook(); }
    });
  }

  /* Sekme yoksa (JS erken) yine de ilk günü hazırla */
  if (!closed) setActiveDay(0);
})();
