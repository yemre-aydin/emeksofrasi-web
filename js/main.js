/* ==========================================================================
   Emek Sofrası — Arayüz etkileşimleri
   - Mobil menü aç/kapa
   - Haftalık menü kartları (js/menu-data.js → WEEKLY_MENU)
   - Görsel kaydırıcı (carousel) + tanıtım videosu sesi
   - 3D menü videosu popup'ı
   ========================================================================== */
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- Mobil navigasyon (iç sayfalar) ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Ana sayfa header (mobil) ---------- */
  var hBurger = document.querySelector(".nav-burger");
  var hMobileNav = document.getElementById("mnav");
  if (hBurger && hMobileNav) {
    hBurger.addEventListener("click", function () {
      var open = hMobileNav.classList.toggle("is-open");
      hBurger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    hMobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        hMobileNav.classList.remove("is-open");
        hBurger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Tanıtım videosu: ses aç/kapa ---------- */
  document.querySelectorAll("[data-video-sound]").forEach(function (btn) {
    var frame = btn.closest(".home-intro__frame") || document;
    var video = frame.querySelector("video");
    if (!video) return;
    var iMuted = btn.querySelector("[data-icon-muted]");
    var iOn = btn.querySelector("[data-icon-on]");
    btn.addEventListener("click", function () {
      video.muted = !video.muted;
      if (!video.muted && video.paused) video.play().catch(function () {});
      if (iMuted) iMuted.hidden = !video.muted;
      if (iOn) iOn.hidden = video.muted;
      btn.setAttribute("aria-label", video.muted ? "Sesi aç" : "Sesi kapat");
    });
  });

  /* ---------- Haftalık menü kartları ---------- */
  (function renderMenu() {
    var host = document.querySelector("[data-menu-grid]");
    var m = window.WEEKLY_MENU || {};
    var list = m.menuler || [];

    var week = document.querySelector("[data-menu-week]");
    if (week) week.textContent = (m.hafta && m.hafta.trim()) ? m.hafta.trim() : "Bu hafta";
    var note = document.querySelector("[data-menu-note]");
    if (note && m.not) note.textContent = m.not;

    if (!host) return;
    if (!list.length) {
      host.innerHTML =
        '<p class="menu-empty">Bu haftanın menüsü henüz yayınlanmadı. ' +
        'Güncel menü için bizi arayabilir ya da Instagram sayfamıza bakabilirsiniz.</p>';
      return;
    }
    host.innerHTML = list.map(function (menu) {
      var items = (menu.kalemler || []).map(function (k) {
        return "<li>" + esc(k) + "</li>";
      }).join("");
      return (
        '<article class="menu-card">' +
          '<div class="menu-card__head">Menü ' + esc(menu.no) + "</div>" +
          '<ul class="menu-card__body">' + items + "</ul>" +
        "</article>"
      );
    }).join("");
  })();

  /* ---------- 3D menü videosu popup ---------- */
  (function menuVideo() {
    var modal = document.querySelector("[data-video-modal]");
    var trigger = document.querySelector("[data-menu-video]");
    if (!modal || !trigger) return;
    var video = modal.querySelector("video");
    var last = null;

    function open() {
      last = document.activeElement;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      if (video) { try { video.currentTime = 0; video.play(); } catch (e) {} }
      var c = modal.querySelector("[data-video-close]");
      if (c) c.focus();
    }
    function close() {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      if (video) video.pause();
      if (last) last.focus();
    }
    trigger.addEventListener("click", open);
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.hasAttribute("data-video-close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  })();

  /* ---------- Görsel kaydırıcı (carousel) ---------- */
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector("[data-carousel-track]");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel__slide"));
    var dotsWrap = root.querySelector("[data-carousel-dots]");
    var prev = root.querySelector("[data-carousel-prev]");
    var next = root.querySelector("[data-carousel-next]");
    if (!track || slides.length < 2) return;

    var index = 0;
    var interval = parseInt(root.getAttribute("data-interval"), 10) || 4500;
    var timer = null;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", (i + 1) + ". görsele git");
      b.addEventListener("click", function () { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function render() {
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === index); });
    }
    function go(i) { index = (i + slides.length) % slides.length; render(); }
    function start() {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { go(index + 1); }, interval);
    }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    if (prev) prev.addEventListener("click", function () { go(index - 1); restart(); });
    if (next) next.addEventListener("click", function () { go(index + 1); restart(); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    render();
    start();
  });

  /* ---- Hero görsel geçişi (fade carousel) ---- */
  document.querySelectorAll("[data-hero-carousel]").forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero__slide"));
    var dotsWrap = root.querySelector("[data-hero-dots]");
    if (slides.length < 2) return;
    var i = 0, timer = null;
    var interval = parseInt(root.getAttribute("data-interval"), 10) || 5500;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var dots = slides.map(function (_, n) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", (n + 1) + ". görsel");
      b.addEventListener("click", function () { go(n); restart(); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function render() {
      slides.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
      dots.forEach(function (d, n) { d.classList.toggle("is-active", n === i); });
    }
    function go(n) { i = (n + slides.length) % slides.length; render(); }
    function start() { if (reduce || timer) return; timer = setInterval(function () { go(i + 1); }, interval); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    render();
    start();
  });
})();
