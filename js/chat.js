/* ==========================================================================
   Emek Sofrası — Sohbet Asistanı (kural-tabanlı, backend gerektirmez)
   --------------------------------------------------------------------------
   - Sık sorulan soruları anında yanıtlar (menü, saat, adres, kart, kurumsal…)
   - Sipariş / rezervasyon / kurumsal taleplerde adım adım bilgi toplar
   - Toplanan talebi CHAT_CONFIG.webhookUrl'e POST eder;
     adres boşsa ya da hata olursa WhatsApp'a hazır mesajla düşer
   - Tüm konuşma transcript'i webhook payload'ına eklenir (ileride DB için)

   GERÇEK AI (Claude) ENTEGRASYONU: bkz. chat/MIMARI.md — şu an planlanmadı.
   ========================================================================== */
(function () {
  "use strict";

  /* ====================== AYARLAR ====================== */
  var CFG = window.CHAT_CONFIG || {};
  var WEBHOOK   = CFG.webhookUrl   || "";              // n8n webhook (boşsa WhatsApp'a düşer)
  var WA_NUMBER = CFG.whatsappNumber || "905310219976";
  var PHONE     = CFG.phone         || "+905310219976";
  var PHONE_HUMAN = "0531 021 99 76";

  /* ====================== BİLGİ TABANI ======================
     Her giriş: anahtar kelimeler + yanıt + (opsiyonel) sonraki çipler.
     Yanıt metnini serbestçe güncelleyebilirsin.                        */
  var KB = [
    {
      id: "saat",
      keys: ["saat", "kaçta aç", "kaça kadar", "açık mı", "kapanış", "ne zaman açık", "pazar açık"],
      answer:
        "Çalışma saatlerimiz:\n• Pazartesi–Cumartesi: 08:30 – 19:00\n• Pazar: KAPALI",
      chips: ["Adres / yol tarifi", "Menü"]
    },
    {
      id: "adres",
      keys: ["adres", "nerede", "konum", "yol tarif", "nasıl gel", "harita", "maslak nerede"],
      answer:
        "Maslak Mah. Dere Boyu 2. Cad. No:8 E Blok, 34475 Sarıyer / İstanbul.\n\nYol tarifi: https://www.google.com/maps/search/?api=1&query=Emek+Sofras%C4%B1+Maslak+Dere+Boyu+2.+Cadde+No+8",
      chips: ["Çalışma saatleri", "Rezervasyon"]
    },
    {
      id: "kart",
      keys: ["kart", "yemek kart", "sodexo", "multinet", "setcard", "edenred", "ticket", "metropol", "pluxee", "tokenflex", "ödeme"],
      answer:
        "Geçerli yemek kartları: Edenred / Ticket Restaurant, Setcard, Multinet, Metropol Card, Pluxee (eski Sodexo), Tokenflex.",
      chips: ["Menü", "Adres"]
    },
    {
      id: "menu",
      keys: ["menü", "menu", "bugün ne var", "ne piş", "yemek ne", "çorba", "haftanın menü", "günün yemeğ", "listede ne"],
      answerFn: function () {
        var base =
          "Menümüz her hafta değişir; her sabah taze pişer. Her hafta menüde bir vejetaryen yemek olur.";
        var today = todaysDish();
        if (today) base += "\n\nBugün öne çıkan: " + today + ".";
        base += "\n\nHaftanın menüsünün tamamı: /menu.html";
        return base;
      },
      chips: ["Fiyat bilgisi", "Rezervasyon", "Vejetaryen"]
    },
    {
      id: "vejetaryen",
      keys: ["vejetaryen", "vegan", "etsiz", "et yok", "zeytinyağ"],
      answer:
        "Her hafta menümüzde sabit olarak bir vejetaryen yemek bulunur (zeytinyağlılar, sebze yemekleri vb.). Güncel vejetaryen seçenek için menü sayfamıza bakabilir veya bize sorabilirsiniz.",
      chips: ["Menü", "Rezervasyon"]
    },
    {
      id: "fiyat",
      keys: ["fiyat", "kaç para", "kaça", "ne kadar", "ücret", "tl", "₺"],
      answer:
        "Fiyat bilgisini buradan paylaşmıyoruz — güncel fiyatlar için lütfen bizi arayın: " +
        PHONE_HUMAN + ". Menü haftalık değiştiği için en doğru bilgiyi telefonda alırsınız.",
      chips: ["Bizi ara", "WhatsApp'tan yaz"]
    },
    {
      id: "paket",
      keys: ["paket", "eve gel", "sipariş getir", "yemeksepeti", "getir", "trendyol", "kurye", "teslimat"],
      answer:
        "Paket servisimiz çok yakında başlıyor — Yemeksepeti, Getir ve Trendyol Yemek üzerinden. Başladığında sitemizde ve Instagram'da duyuracağız.\n\nOfise düzenli/toplu sipariş için kurumsal hizmetimizi konuşabiliriz.",
      chips: ["Kurumsal sipariş", "Rezervasyon"]
    },
    {
      id: "hakkimizda",
      keys: ["kim", "hakkında", "usta", "gültekin", "mengen", "hikaye", "nasıl bir yer"],
      answer:
        "Emek Sofrası, Maslak'ta çalışanların her gün gelebileceği bir ev sofrası. Mutfağın başında Bolu Mengen geleneğinden gelen 30 yıllık ustamız Gültekin Usta var. Yemekler her sabah tazeden, tencerede pişer.",
      chips: ["Menü", "Rezervasyon"]
    }
  ];

  /* ====================== AKIŞLAR (bilgi toplama) ====================== */
  var FLOWS = {
    rezervasyon: {
      label: "Rezervasyon",
      intro: "Rezervasyon talebinizi alalım. Birkaç kısa soru soracağım 🙂",
      steps: [
        { key: "name",   q: "Adınız soyadınız?" },
        { key: "phone",  q: "Size ulaşabileceğimiz telefon numarası?", validate: "phone" },
        { key: "people", q: "Kaç kişi olacaksınız?" },
        { key: "datetime", q: "Hangi gün ve saat için? (ör. 12 Mart Çarşamba 12:30)" },
        { key: "note",   q: "Eklemek istediğiniz bir not var mı? (yoksa 'yok' yazın)" }
      ]
    },
    kurumsal: {
      label: "Kurumsal sipariş",
      intro: "Kurumsal / toplu sipariş talebinizi alalım (min. 20 kişi). Birkaç bilgi:",
      steps: [
        { key: "company", q: "Firma adı?" },
        { key: "name",    q: "Yetkili adı soyadı?" },
        { key: "phone",   q: "Telefon numarası?", validate: "phone" },
        { key: "people",  q: "Yaklaşık kaç kişilik?" },
        { key: "freq",    q: "Ne sıklıkta? (tek seferlik / haftalık / günlük)" },
        { key: "datetime", q: "İlk teslim için hedef gün ve saat?" },
        { key: "note",    q: "Özel istek / not? (yoksa 'yok')" }
      ]
    },
    siparis: {
      label: "Sipariş talebi",
      intro:
        "Paket servisimiz henüz platformlarda aktif değil; şimdilik siparişi talep olarak alıp size dönüyoruz.",
      steps: [
        { key: "name",    q: "Adınız soyadınız?" },
        { key: "phone",   q: "Telefon numarası?", validate: "phone" },
        { key: "address", q: "Teslimat adresi (semt / bina / kat)?" },
        { key: "items",   q: "Ne sipariş etmek istersiniz? (yemek adları / kişi sayısı)" },
        { key: "time",    q: "Hangi saat için?" },
        { key: "note",    q: "Not? (yoksa 'yok')" }
      ]
    }
  };

  /* ====================== DURUM ====================== */
  var sessionId = getSession();
  var transcript = loadTranscript();
  var flow = null;       // { type, def, i, data }
  var els = {};

  /* ====================== YARDIMCILAR ====================== */
  function getSession() {
    try {
      var s = localStorage.getItem("es_chat_sid");
      if (!s) { s = "s-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8); localStorage.setItem("es_chat_sid", s); }
      return s;
    } catch (e) { return "s-" + Date.now(); }
  }
  function loadTranscript() {
    try { return JSON.parse(localStorage.getItem("es_chat_log") || "[]"); } catch (e) { return []; }
  }
  function saveTranscript() {
    try { localStorage.setItem("es_chat_log", JSON.stringify(transcript.slice(-60))); } catch (e) {}
  }
  function todaysDish() {
    var d = window.WEEKLY_DAYS;
    if (!d || !d.gunler) return null;
    var idx = (new Date().getDay() + 6) % 7; // 0=Pzt
    if (idx > 5) return null;                // Pazar
    var g = d.gunler[idx];
    return (g && g.dish) ? g.dish : null;
  }
  function isPhone(t) { return (t.replace(/[^0-9]/g, "").length >= 10); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function linkify(s) {
    return esc(s)
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">bağlantı</a>')
      .replace(/(^|\s)(\/[a-z0-9\-]+\.html)/g, '$1<a href="$2">$2</a>');
  }

  /* ====================== UI ====================== */
  function build() {
    var root = document.createElement("div");
    root.className = "es-chat";
    root.innerHTML =
      '<button class="es-chat__launcher" aria-label="Sohbet asistanını aç">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zM7 9h10v2H7zm0 4h7v2H7z"/></svg>' +
        '<span>Yardımcı olalım</span>' +
        '<span class="es-chat__launcher-dot"></span>' +
      '</button>' +
      '<div class="es-chat__panel" role="dialog" aria-label="Emek Sofrası sohbet asistanı">' +
        '<div class="es-chat__header">' +
          '<img src="images/emek_sofrasi_logo.png" alt="">' +
          '<div><div class="es-chat__title">Emek Sofrası</div><div class="es-chat__status">Genelde birkaç dakikada döneriz</div></div>' +
          '<button class="es-chat__close" aria-label="Kapat">✕</button>' +
        '</div>' +
        '<div class="es-chat__body" data-body></div>' +
        '<div class="es-chat__chips" data-chips></div>' +
        '<form class="es-chat__input" data-form>' +
          '<input type="text" placeholder="Sorunuzu yazın…" autocomplete="off" data-input aria-label="Mesaj">' +
          '<button type="submit" class="es-chat__send" aria-label="Gönder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button>' +
        '</form>' +
        '<div class="es-chat__foot">Emek Sofrası dijital asistanı · Otomatik yanıtlar</div>' +
      '</div>';
    document.body.appendChild(root);

    els.root = root;
    els.body = root.querySelector("[data-body]");
    els.chips = root.querySelector("[data-chips]");
    els.form = root.querySelector("[data-form]");
    els.input = root.querySelector("[data-input]");

    root.querySelector(".es-chat__launcher").addEventListener("click", open);
    root.querySelector(".es-chat__close").addEventListener("click", close);
    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = els.input.value.trim();
      if (!v) return;
      els.input.value = "";
      handleUser(v);
    });
  }

  function open() {
    els.root.classList.add("is-open");
    if (!transcript.length) greet();
    else { transcript.forEach(function (m) { addMsg(m.role, m.text, true); }); defaultChips(); }
    els.input.focus();
    scrollDown();
  }
  function close() { els.root.classList.remove("is-open"); }

  function greet() {
    botSay(
      "Merhaba! Emek Sofrası dijital asistanıyım 🍲\nMenü, saatler, adres, yemek kartları, rezervasyon veya kurumsal sipariş konusunda yardımcı olabilirim."
    );
    defaultChips();
  }

  function addMsg(role, text, silent) {
    var el = document.createElement("div");
    el.className = "es-msg es-msg--" + (role === "user" ? "user" : "bot");
    el.innerHTML = linkify(text);
    els.body.appendChild(el);
    if (!silent) {
      transcript.push({ role: role, text: text, ts: new Date().toISOString() });
      saveTranscript();
    }
    scrollDown();
  }
  function botSay(text, delay) {
    typing(true);
    setTimeout(function () { typing(false); addMsg("bot", text); }, delay || 450);
  }
  function typing(on) {
    var ex = els.body.querySelector(".es-msg--typing");
    if (on && !ex) {
      var t = document.createElement("div");
      t.className = "es-msg es-msg--bot es-msg--typing";
      t.innerHTML = "<span></span><span></span><span></span>";
      els.body.appendChild(t); scrollDown();
    } else if (!on && ex) { ex.remove(); }
  }
  function scrollDown() { els.body.scrollTop = els.body.scrollHeight; }

  function setChips(list) {
    els.chips.innerHTML = "";
    (list || []).forEach(function (c) {
      var b = document.createElement("button");
      b.className = "es-chip" + (c.wa ? " es-chip--wa" : "");
      b.textContent = c.label;
      b.addEventListener("click", function () { c.onClick(); });
      els.chips.appendChild(b);
    });
  }
  function defaultChips() {
    setChips([
      { label: "Haftanın menüsü", onClick: function () { handleUser("menü"); } },
      { label: "Çalışma saatleri", onClick: function () { handleUser("çalışma saatleri"); } },
      { label: "Rezervasyon", onClick: function () { startFlow("rezervasyon"); } },
      { label: "Kurumsal sipariş", onClick: function () { startFlow("kurumsal"); } },
      { label: "Adres / yol tarifi", onClick: function () { handleUser("adres"); } },
      { label: "WhatsApp'tan yaz", wa: true, onClick: waHandoff }
    ]);
  }
  function chipsFrom(labels) {
    setChips((labels || []).map(function (l) {
      if (/whatsapp/i.test(l)) return { label: l, wa: true, onClick: waHandoff };
      if (/bizi ara/i.test(l)) return { label: l, onClick: function () { location.href = "tel:" + PHONE; } };
      if (/rezervasyon/i.test(l)) return { label: l, onClick: function () { startFlow("rezervasyon"); } };
      if (/kurumsal/i.test(l)) return { label: l, onClick: function () { startFlow("kurumsal"); } };
      return { label: l, onClick: function () { handleUser(l); } };
    }).concat([{ label: "Ana menü", onClick: defaultChips }]));
  }

  /* ====================== MESAJ İŞLEME ====================== */
  function handleUser(text) {
    addMsg("user", text);
    if (flow) return flowNext(text);

    var low = text.toLocaleLowerCase("tr");

    // Akış tetikleyicileri
    if (/rezervasyon|masa ayır|yer ayır/.test(low)) return startFlow("rezervasyon");
    if (/kurumsal|toplu sipariş|faturalı|ofise yemek|catering/.test(low)) return startFlow("kurumsal");
    if (/sipariş ver|sipariş etmek|paket sipariş/.test(low)) return startFlow("siparis");
    if (/insan|yetkili|canlı|müşteri temsilc|birine bağla/.test(low)) return waHandoff();

    // Bilgi tabanı eşleştirme (anahtar kelime skoru)
    var best = null, bestScore = 0;
    KB.forEach(function (item) {
      var score = 0;
      item.keys.forEach(function (k) { if (low.indexOf(k) !== -1) score += k.length; });
      if (score > bestScore) { bestScore = score; best = item; }
    });

    if (best && bestScore > 0) {
      var ans = best.answerFn ? best.answerFn() : best.answer;
      botSay(ans);
      setTimeout(function () { chipsFrom(best.chips); }, 500);
      return;
    }

    // Anlaşılamadı
    botSay(
      "Bunu tam anlayamadım. Şunlardan biriyle yardımcı olabilirim ya da sizi yetkilimize bağlayabilirim:"
    );
    setTimeout(function () {
      setChips([
        { label: "Menü", onClick: function () { handleUser("menü"); } },
        { label: "Saatler", onClick: function () { handleUser("saat"); } },
        { label: "Adres", onClick: function () { handleUser("adres"); } },
        { label: "Rezervasyon", onClick: function () { startFlow("rezervasyon"); } },
        { label: "WhatsApp'tan yaz", wa: true, onClick: waHandoff },
        { label: "Bizi ara (" + PHONE_HUMAN + ")", onClick: function () { location.href = "tel:" + PHONE; } }
      ]);
    }, 500);
  }

  /* ====================== AKIŞLAR ====================== */
  function startFlow(type) {
    var def = FLOWS[type];
    if (!def) return;
    flow = { type: type, def: def, i: 0, data: {} };
    botSay(def.intro);
    setTimeout(function () {
      addMsg("bot", def.steps[0].q);
      setChips([{ label: "Vazgeç", onClick: cancelFlow }]);
    }, 500);
  }
  function cancelFlow() {
    flow = null;
    botSay("Tamam, iptal ettim. Başka bir konuda yardımcı olayım mı?");
    setTimeout(defaultChips, 450);
  }
  function flowNext(text) {
    var step = flow.def.steps[flow.i];
    if (step.validate === "phone" && !isPhone(text)) {
      botSay("Telefon numarası eksik görünüyor — lütfen alan koduyla tekrar yazın.");
      return;
    }
    flow.data[step.key] = text;
    flow.i++;
    if (flow.i < flow.def.steps.length) {
      var nx = flow.def.steps[flow.i];
      botSay(nx.q);
    } else {
      finishFlow();
    }
  }
  function finishFlow() {
    var d = flow.data, def = flow.def, type = flow.type;
    var lines = def.steps.map(function (s) { return "• " + labelFor(s.key) + ": " + (d[s.key] || "-"); }).join("\n");
    botSay("Aldım, teşekkürler! Özet:\n\n" + lines + "\n\nTalebi iletiyorum…");
    var payload = {
      type: type,
      kind: def.label,
      site: location.hostname,
      page: location.pathname,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      data: d,
      transcript: transcript.slice(-40)
    };
    setTimeout(function () { submit(payload, lines); }, 700);
    flow = null;
  }
  function labelFor(k) {
    return ({
      name: "Ad Soyad", phone: "Telefon", people: "Kişi sayısı", datetime: "Gün/Saat",
      time: "Saat", note: "Not", company: "Firma", freq: "Sıklık", address: "Adres", items: "Sipariş"
    })[k] || k;
  }

  /* ====================== GÖNDERİM ====================== */
  function submit(payload, summary) {
    var waText =
      "Merhaba, " + payload.kind + " talebi:\n" + summary +
      "\n\n(emeksofrasi.com asistanı üzerinden)";
    var waUrl = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(waText);

    function fallback() {
      botSay("Talebinizi hızlıca iletmek için aşağıdan WhatsApp'a gönderebilirsiniz:");
      setTimeout(function () {
        setChips([
          { label: "WhatsApp'ta gönder", wa: true, onClick: function () { window.open(waUrl, "_blank"); } },
          { label: "Bizi ara", onClick: function () { location.href = "tel:" + PHONE; } },
          { label: "Ana menü", onClick: defaultChips }
        ]);
      }, 400);
    }

    if (!WEBHOOK) return fallback();

    typing(true);
    fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        typing(false);
        if (!r.ok) throw new Error("http " + r.status);
        botSay("Talebiniz iletildi ✅ En kısa sürede " + (payload.data.phone || "sizinle") + " üzerinden dönüş yapacağız.");
        setTimeout(defaultChips, 500);
      })
      .catch(function () {
        typing(false);
        fallback();
      });
  }

  function waHandoff() {
    var recent = transcript.slice(-6).map(function (m) {
      return (m.role === "user" ? "Ben: " : "Asistan: ") + m.text;
    }).join("\n");
    var url = "https://wa.me/" + WA_NUMBER + "?text=" +
      encodeURIComponent("Merhaba, siteden yazıyorum.\n\n" + recent);
    window.open(url, "_blank");
  }

  /* ====================== BAŞLAT ====================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else { build(); }
})();
