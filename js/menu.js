/* ==========================================================================
   Emek Sofrası — Menü sayfası
   - Kapalı kitap (kapak) → tıkla → aynı component içinde AÇIK kitap
   - Açık kitap: SOL sayfa = HTML menü metni, SAĞ sayfa = o günün onaylı yemek
     görseli (food-*.png). 3D yemek görseline dokunulmaz.
   - 7 gün: Pazartesi–Cumartesi + Pazar (özel kapalı gün)
   - Ana yemek grubu: günün ana yemeği + "7 Kekikli Izgara Tavuk" + "8 Izgara Köfte"
   - Yan lezzetler grubu: günün özel pilavı (varsa) + Pilav vb.
   - Çorba her gün YALNIZCA "Günün Çorbası"
   - Gün değiştirme: sağ/sol ok · alt gün sekmeleri · sağ/sol sayfaya tıklama · ok tuşları
   - HER HAFTA sadece js/menu-data.js güncellenir.
   ========================================================================== */
(function () {
  "use strict";

  var DATA = window.MENU_DATA || {};
  var days = (DATA.gunler || []).slice();
  if (DATA.pazar) days.push(DATA.pazar);
  var fixed = DATA.sabitAnaYemekler || [];

  var closed  = document.querySelector("[data-menu-closed]");
  var open    = document.querySelector("[data-menu-open]");
  var trigger = document.querySelector("[data-menu-trigger]");
  var book    = document.querySelector("[data-menu-book]");
  var leftEl  = document.querySelector("[data-menu-left]");
  var img     = document.querySelector("[data-menu-image]");
  var video   = document.querySelector("[data-menu-video]");
  var tabsWrap= document.querySelector("[data-menu-tabs]");
  var prevBtn = document.querySelector("[data-menu-prev]");
  var nextBtn = document.querySelector("[data-menu-next]");
  var weekEl  = document.querySelector("[data-menu-week]");

  if (!open || !days.length) return;

  var activeIndex = 0;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (weekEl && DATA.hafta) weekEl.textContent = DATA.hafta;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function li(items) {
    return items.filter(Boolean).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
  }

  /* ---- Sol sayfa: normal gün ---- */
  function leftNormal(day) {
    var mainsHtml = "<li>" + esc(day.anaYemek) + "</li>" +
      fixed.map(function (m) {
        return "<li>" + esc(m) + "</li>";
      }).join("");

    return (
      '<h2 class="menu-page__day">' + esc(day.ad) + "</h2>" +
      '<p class="menu-page__sub">Günün Menüsü</p>' +
      ornSvg() +
      '<div class="menu-page__body">' +
        '<section class="menu-grp menu-grp--line">' +
          '<span class="menu-grp__ico" aria-hidden="true">' + icoSoup() + "</span>" +
          "<ul><li>" + esc(day.corba || "Günün Çorbası") + "</li></ul>" +
        "</section>" +
        '<section class="menu-grp">' +
          "<h3>Ana Yemekler</h3><ul>" + mainsHtml + "</ul>" +
        "</section>" +
        '<section class="menu-grp">' +
          "<h3>Yan Lezzetler</h3><ul>" + li(day.yanUrunler || []) + "</ul>" +
        "</section>" +
        '<section class="menu-grp menu-grp--line">' +
          '<span class="menu-grp__ico" aria-hidden="true">' + icoDrink() + "</span>" +
          "<ul><li>" + esc(day.icecek || "Meşrubat") + "</li></ul>" +
        "</section>" +
      "</div>"
    );
  }

  /* ---- Sol sayfa: Pazar (özel kapalı gün) ---- */
  function leftSunday(day) {
    var msgs = (day.mesajlar || []).map(function (m) {
      return '<section class="menu-grp"><h3>' + esc(m.baslik) + "</h3><p>" + esc(m.metin) + "</p></section>";
    }).join("");
    return (
      '<h2 class="menu-page__day">' + esc(day.ad) + "</h2>" +
      '<p class="menu-page__sub">Günün Menüsü</p>' +
      ornSvg() +
      '<div class="menu-page__body menu-page__body--sunday">' +
        msgs +
        '<p class="menu-page__closed">' + esc(day.kapanis || "Pazar günleri kapalıyız.") + "</p>" +
      "</div>"
    );
  }

  function ornSvg() {
    return '<span class="menu-page__orn" aria-hidden="true"><svg viewBox="0 0 90 12">' +
      '<g stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M6 6h24M60 6h24"/></g>' +
      '<g fill="currentColor"><path d="M45 1.5c-2 1.7-2.9 3.8-2.9 5.8 2 0 3.6-1.6 4.1-3.7L45 1.5zM45 1.5c2 1.7 2.9 3.8 2.9 5.8-2 0-3.6-1.6-4.1-3.7L45 1.5z"/>' +
      '<circle cx="37" cy="6" r="1.2"/><circle cx="53" cy="6" r="1.2"/></g></svg></span>';
  }
  function icoSoup() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16M5 11a7 7 0 0 0 14 0"/><path d="M8 7c0-1.2 1-1.8 1-3M12 7c0-1.2 1-1.8 1-3M16 7c0-1.2 1-1.8 1-3"/></svg>';
  }
  function icoDrink() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10l-1 15a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z"/><path d="M7.5 9h9"/></svg>';
  }

  /* ---- Gün render ---- */
  function renderDay(index) {
    var day = days[index];
    if (!day) return;
    activeIndex = index;

    if (leftEl) leftEl.innerHTML = day.kapali ? leftSunday(day) : leftNormal(day);

    var altTxt = day.ad + (day.kapali ? " — pazar günü" : " günü yemekleri");

    if (day.video && video) {
      /* 3D menü videosu olan gün */
      if (img) { img.hidden = true; img.classList.remove("is-in"); img.removeAttribute("src"); }
      video.hidden = false;
      video.muted = true;                 /* autoplay için şart */
      video.setAttribute("aria-label", day.ad + " günü 3D menü videosu");
      if (video.getAttribute("src") !== day.video) {
        video.setAttribute("src", day.video);
        video.load();
      }
      video.currentTime = 0;
      var tryPlay = function () {
        var pr = video.play();
        if (pr && pr.then) pr.then(function () {
          video.classList.add("is-in");
        }).catch(function () {
          /* autoplay engellendi — yine de kareyi göster */
          video.classList.add("is-in");
        });
        else video.classList.add("is-in");
      };
      tryPlay();
      video.addEventListener("loadeddata", tryPlay, { once: true });
    } else if (img) {
      if (video) { try { video.pause(); } catch (e) {} video.hidden = true; video.classList.remove("is-in"); video.removeAttribute("src"); }
      var apply = function () {
        img.src = day.gorselYemek || day.gorsel;
        img.alt = altTxt;
        img.hidden = false;
        requestAnimationFrame(function () { img.classList.add("is-in"); });
      };
      img.classList.remove("is-in");
      if (reduce) apply(); else setTimeout(apply, 150);
    }

    tabs.forEach(function (t, i) {
      var on = i === index;
      t.classList.toggle("is-active", on);
      if (on) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
    });
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === days.length - 1;
  }

  function go(index, focusTab) {
    if (index < 0 || index >= days.length) return;
    renderDay(index);
    if (focusTab && tabs[index]) tabs[index].focus();
  }

  /* ---- Gün sekmeleri ---- */
  var tabs = days.map(function (d, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "day-tab";
    b.textContent = d.ad;
    b.setAttribute("role", "tab");
    b.addEventListener("click", function () { go(i); });
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(activeIndex + 1, true); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); go(activeIndex - 1, true); }
    });
    if (tabsWrap) tabsWrap.appendChild(b);
    return b;
  });

  if (prevBtn) prevBtn.addEventListener("click", function () { go(activeIndex - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { go(activeIndex + 1); });

  /* ---- Sayfaya tıklayarak çevirme ---- */
  if (book) {
    var lp = book.querySelector(".menu-page--left");
    var rp = book.querySelector(".menu-page--right");
    if (lp) { lp.addEventListener("click", function () { go(activeIndex - 1); }); lp.title = "Önceki gün"; }
    if (rp) { rp.addEventListener("click", function () { go(activeIndex + 1); }); rp.title = "Sonraki gün"; }
  }

  /* ---- Klavye ---- */
  open.addEventListener("keydown", function (e) {
    if (e.target.classList && e.target.classList.contains("day-tab")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(activeIndex + 1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); go(activeIndex - 1); }
  });

  /* ---- Kitabı aç ---- */
  function openBook() {
    if (closed) {
      closed.classList.add("is-opening");
      var reveal = function () {
        closed.hidden = true;
        open.hidden = false;
        renderDay(0);
        var h = open.querySelector(".day-tab");
        if (h) h.focus({ preventScroll: true });
        var top = (document.querySelector(".menu-section") || open).getBoundingClientRect().top;
        if (top < -20 || top > window.innerHeight * 0.5) {
          document.querySelector(".menu-section").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
      };
      if (reduce) reveal(); else setTimeout(reveal, 550);
    } else {
      open.hidden = false;
      renderDay(0);
    }
  }

  if (trigger) {
    trigger.addEventListener("click", openBook);
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBook(); }
    });
  }
  if (!closed) renderDay(0);
})();
