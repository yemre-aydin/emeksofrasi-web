/* Emek Sofrası — hafif scroll giriş animasyonu (.reveal → .is-visible) */
(function () {
  "use strict";
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-visible");
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { obs.observe(el); });
})();
