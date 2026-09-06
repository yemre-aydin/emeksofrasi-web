/* ==========================================================================
   EMEK SOFRASI — HAFTALIK MENÜ VERİSİ
   --------------------------------------------------------------------------
   HER HAFTA SADECE BU DOSYA GÜNCELLENİR:
   1) "hafta" alanına tarih aralığını yaz.
   2) Pazartesi–Cumartesi için: "anaYemek", "yanUrunler", "gorselYemek" alanlarını
      o haftanın menüsüne göre değiştir.  (çorba ve içecek genelde sabittir)
   3) 3D görseller hazır olduğunda sadece "gorselYemek" yollarını değiştir —
      kodun geri kalanına dokunmaya gerek yok.

   GÖRSEL ALANLARI
   - gorselYemek: açık kitabın SAĞ sayfası — sadece yemek görseli (aktif, Seçenek 2)
   - gorsel:      açık kitabın TAMAMI — sol yazı + sağ yemek, tek parça görsel
                  (yedek — Seçenek 1'e dönülürse kullanılır, menu.js şu an
                  bunu okumuyor ama silinmedi)

   KURALLAR
   - Sitede FİYAT gösterilmez.
   - "Kekikli Izgara Tavuk" ve "Izgara Köfte" her gün sabittir (sabitAnaYemekler).
     Bunları günlük listeye TEKRAR yazma; kod otomatik ekler.
   - Pazar günü işletme kapalıdır; menü yerine karşılama mesajları gösterilir.
   ========================================================================== */

window.MENU_DATA = {
  hafta: "Bu hafta",

  /* Pazartesi – Cumartesi */
  gunler: [
    {
      id: "pazartesi", ad: "Pazartesi",
      gorselYemek: "images/menu/food-pazartesi.png",
      gorsel: "images/menu/gun-pazartesi.png",
      video: "images/menu/Food_commercial_pazartesi.mp4",   /* 3D menü videosu */
      corba: "Günün Çorbası",
      anaYemek: "Tavuklu Pilav",
      yanUrunler: ["Mevsim Salatası"],
      icecek: "Meşrubat"
    },
    {
      id: "sali", ad: "Salı",
      gorselYemek: "images/menu/food-sali.png",
      gorsel: "images/menu/gun-sali.png",
      video: "images/menu/Menu_book_sali.mp4",   /* 3D menü videosu */
      corba: "Günün Çorbası",
      anaYemek: "Bostan Kebap",
      yanUrunler: ["Makarna"],
      icecek: "Meşrubat"
    },
    {
      id: "carsamba", ad: "Çarşamba",
      gorselYemek: "images/menu/food-carsamba.png",
      gorsel: "images/menu/gun-carsamba.png",
      corba: "Günün Çorbası",
      anaYemek: "Taze Fasulye",
      yanUrunler: ["Pilav"],
      icecek: "Meşrubat"
    },
    {
      id: "persembe", ad: "Perşembe",
      gorselYemek: "images/menu/food-persembe.png",
      gorsel: "images/menu/gun-persembe.png",
      corba: "Günün Çorbası",
      anaYemek: "Mantı",
      yanUrunler: ["Mevsim Salatası"],
      icecek: "Meşrubat"
    },
    {
      id: "cuma", ad: "Cuma",
      gorselYemek: "images/menu/food-cuma.png",
      gorsel: "images/menu/gun-cuma.png",
      corba: "Günün Çorbası",
      anaYemek: "Köri Soslu Tavuk",
      yanUrunler: ["Pilav"],
      icecek: "Meşrubat"
    },
    {
      id: "cumartesi", ad: "Cumartesi",
      gorselYemek: "images/menu/food-cumartesi.png",
      gorsel: "images/menu/gun-cumartesi.png",
      video: "images/menu/menu_dishes_cumartesi.mp4",   /* 3D menü videosu */
      corba: "Günün Çorbası",
      anaYemek: "Dana Ciğer",
      yanUrunler: ["Pilav"],
      icecek: "Meşrubat"
    }
  ],

  /* Her gün sunulan sabit ana yemek seçenekleri */
  sabitAnaYemekler: ["Kekikli Izgara Tavuk", "Izgara Köfte"],

  /* Pazar — restoran kapalı */
  pazar: {
    id: "pazar", ad: "Pazar",
    gorselYemek: "images/menu/food-pazar.png",
    gorsel: "images/menu/gun-pazar.png",
    kapali: true,
    mesajlar: [
      { baslik: "Günün Dileği", metin: "Güzel bir pazar geçirin." },
      { baslik: "Günün Tadı", metin: "Sevdiklerinizle keyfini çıkarın." },
      { baslik: "Haftanın Daveti", metin: "Yeni haftada soframıza bekleriz." }
    ],
    kapanis: "Pazar günleri kapalıyız."
  },

  not: "Kekikli Izgara Tavuk ve Izgara Köfte her gün servis edilir. Menülerimiz günlük olarak değişiklik gösterebilir."
};
