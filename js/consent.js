/* ==========================================================================
   Emek Sofrası — Çerez onayı + izne bağlı takip (Meta Pixel / Google Analytics)
   --------------------------------------------------------------------------
   KVKK: pazarlama/analitik çerezleri YALNIZCA "Kabul Et" sonrası yüklenir.
   Kullanıcı seçimi localStorage'da: es_cookie_consent = "accepted" | "rejected".
     - accepted  → sonraki ziyaretlerde banner çıkmaz, takip hemen yüklenir
     - rejected  → hiçbir takip yüklenmez
     - (seçim yok) → ilk ziyarette banner gösterilir
   YENİ KİMLİK geldiğinde SADECE aşağıdaki CONFIG doldurulur, gerisi aynı kalır.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    pixelId: "1627919535723501",   /* Meta Pixel ID */
    gaId: "G-1KFMR5JS1X"           /* GA4 Ölçüm Kimliği */
  };

  var KEY = "es_cookie_consent";
  var POLICY_URL = "cerez-politikasi.html";

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  /* ---------- Meta Pixel ---------- */
  function loadPixel() {
    if (!CONFIG.pixelId || window.fbq) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", CONFIG.pixelId);
    window.fbq("track", "PageView");
  }

  /* ---------- Google Analytics 4 ---------- */
  function loadGA() {
    if (!CONFIG.gaId || window.gtag) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", CONFIG.gaId);
  }

  function enableTracking() { loadPixel(); loadGA(); }

  /* ---------- Onay bandı ---------- */
  function injectStyles() {
    if (document.getElementById("es-consent-style")) return;
    var st = document.createElement("style");
    st.id = "es-consent-style";
    st.textContent = [
      '#es-consent{position:fixed;left:18px;bottom:18px;z-index:2147483000;',
      'width:min(390px,calc(100vw - 36px));background:#04210f;color:#fdf9ef;',
      'border:1px solid rgba(224,192,124,.35);border-radius:14px;',
      'box-shadow:0 18px 46px rgba(0,0,0,.45);padding:18px 18px 16px;',
      'font-family:"Mulish",system-ui,sans-serif;font-size:.9rem;line-height:1.5;',
      'max-height:80vh;overflow-y:auto;animation:es-consent-in .35s ease both}',
      '@keyframes es-consent-in{from{opacity:0;transform:translateY(14px)}}',
      '#es-consent p{margin:0 0 12px}',
      '#es-consent a{color:#e0c07c}',
      '#es-consent .es-consent-row{display:flex;gap:10px;flex-wrap:wrap}',
      '#es-consent button{flex:1 1 130px;cursor:pointer;font-family:inherit;',
      'font-weight:800;font-size:.86rem;border-radius:9px;padding:11px 14px;',
      'border:1px solid transparent;transition:transform .15s ease}',
      '#es-consent button:hover{transform:translateY(-1px)}',
      '#es-consent .es-consent-accept{background:#e0c07c;color:#04210f}',
      '#es-consent .es-consent-reject{background:transparent;color:#fdf9ef;',
      'border-color:rgba(253,249,239,.4)}',
      '#es-consent button:focus-visible{outline:3px solid #e0c07c;outline-offset:2px}',
      '@media (max-width:480px){#es-consent{left:12px;right:12px;bottom:12px;width:auto}}',
      '@media (prefers-reduced-motion:reduce){#es-consent{animation:none}}',
      /* onay kutusu açıkken sohbet balonunu gizle (üst üste binmesin) */
      'html.es-consent-open .es-chat{display:none!important}'
    ].join("");
    document.head.appendChild(st);
  }

  function showBanner() {
    if (document.getElementById("es-consent")) return;
    injectStyles();
    var box = document.createElement("div");
    box.id = "es-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Çerez tercihi");
    box.innerHTML =
      '<p>Bu sitede deneyiminizi iyileştirmek ve ziyaret istatistiklerini ölçmek için ' +
      'çerezler kullanıyoruz. Ayrıntılar için <a href="' + POLICY_URL + '">Çerez Politikası</a>.</p>' +
      '<div class="es-consent-row">' +
      '<button type="button" class="es-consent-accept">Kabul Et</button>' +
      '<button type="button" class="es-consent-reject">Reddet</button>' +
      '</div>';
    document.body.appendChild(box);
    document.documentElement.classList.add("es-consent-open");
    function close() {
      box.remove();
      document.documentElement.classList.remove("es-consent-open");
    }
    box.querySelector(".es-consent-accept").addEventListener("click", function () {
      set("accepted"); close(); enableTracking();
    });
    box.querySelector(".es-consent-reject").addEventListener("click", function () {
      set("rejected"); close();
    });
  }

  var state = get();
  if (state === "accepted") {
    enableTracking();
  } else if (state !== "rejected") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBanner);
    } else {
      showBanner();
    }
  }
})();
