/* ==========================================================================
   Emek Sofrası — Menü sayfası
   - Kapalı kitap (kapak) → tıkla → AÇIK kitap
   - Açık kitap: dikey kaydırmalı çoklu sayfa (gün / sekme YOK)
       Sayfa 1 → SOL: Menü 1-2   SAĞ: Menü 3-4
       Sayfa 2 → SOL: Menü 5-6   SAĞ: Menü 7-8
       Yan Ürünler bandı
       Pazar → SOL: karşılama mesajları   SAĞ: "kapalıyız" + tencere görseli
   - Mobilde sayfalar tek sütun halinde alt alta akar; Pazar'da sadece sağ taraf.
   - HER HAFTA sadece js/menu-data.js güncellenir.
   ========================================================================== */
(function () {
  "use strict";

  var DATA = window.MENU_DATA || {};
  var menuler = (DATA.menuler || []).slice();

  var closed  = document.querySelector("[data-menu-closed]");
  var open    = document.querySelector("[data-menu-open]");
  var trigger = document.querySelector("[data-menu-trigger]");
  var book    = document.querySelector("[data-menu-book]");
  var weekEl  = document.querySelector("[data-menu-week]");

  if (!open || !book || menuler.length < 8) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var built = false;

  if (weekEl && DATA.hafta) weekEl.textContent = DATA.hafta;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function items(list) {
    return (list || []).filter(Boolean).map(function (x) {
      return "<li>" + esc(x) + "</li>";
    }).join("");
  }
  function card(m) {
    return '<article class="menu-card">' +
      '<h3 class="menu-card__no">Menü ' + esc(m.no) + '</h3>' +
      "<ul>" + items(m.kalemler) + "</ul>" +
      "</article>";
  }
  function spread(leftHtml, rightHtml, extra) {
    return '<div class="menu-spread' + (extra ? " " + extra : "") + '">' +
      '<div class="menu-page menu-page--left">'  + leftHtml  + "</div>" +
      '<div class="menu-page menu-page--right">' + rightHtml + "</div>" +
      "</div>";
  }

  function build() {
    if (built) return;
    var html = "";

    html += spread(card(menuler[0]) + card(menuler[1]),
                   card(menuler[2]) + card(menuler[3]));
    html += spread(card(menuler[4]) + card(menuler[5]),
                   card(menuler[6]) + card(menuler[7]));

    if (DATA.yanUrunler && DATA.yanUrunler.length) {
      html += '<div class="menu-extra"><h3>Yan Ürünler</h3><ul>' +
        items(DATA.yanUrunler) + "</ul></div>";
    }

    var p = DATA.pazar;
    if (p) {
      var msgs = (p.mesajlar || []).map(function (m) {
        return '<section class="menu-grp"><h4>' + esc(m.baslik) + "</h4><p>" + esc(m.metin) + "</p></section>";
      }).join("");
      var left = '<div class="menu-sunday__msgs">' +
        '<h2 class="menu-sunday__title">' + esc(p.baslik || "Pazar") + "</h2>" +
        msgs + "</div>";
      var right = '<div class="menu-sunday__closed">' +
        (p.gorsel ? '<img src="' + esc(p.gorsel) + '" alt="Emek Sofrası — Pazar günü kapalı" loading="lazy">' : "") +
        '<p class="menu-page__closed">' + esc(p.kapanis || "Pazar günleri kapalıyız.") + "</p>" +
        "</div>";
      html += spread(left, right, "menu-spread--sunday");
    }

    book.innerHTML = html;
    built = true;
  }

  function openBook() {
    build();
    if (closed) {
      closed.classList.add("is-opening");
      var reveal = function () {
        closed.hidden = true;
        open.hidden = false;
        var sec = document.querySelector(".menu-section");
        if (sec) {
          var top = sec.getBoundingClientRect().top;
          if (top < -20 || top > window.innerHeight * 0.5) {
            sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          }
        }
      };
      if (reduce) reveal(); else setTimeout(reveal, 500);
    } else {
      open.hidden = false;
    }
  }

  if (trigger) {
    trigger.addEventListener("click", openBook);
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBook(); }
    });
  }
  if (!closed) { build(); open.hidden = false; }
})();
