# Slaity

Ders slaytlarını (PDF veya görsel) yapay zekâ ile sayfa sayfa açıklayan, tek dosyalık bir web uygulaması. Sunucu, hesap veya kurulum gerektirmez: `index.html` dosyasını tarayıcıda açman yeterli.

## Özellikler

- **Sayfa açıklaması:** Her sayfa için ANA FİKİR / AÇIKLAMA / ÖRNEK / AKILDA TUT düzeninde açıklama. "Daha basit anlat" ve "Daha fazla örnek" seçenekleri.
- **Quiz:** Her sayfa için 3 soru. "Bildim / Bilemedim" işaretleri kaydedilir; bilemediklerin kitaplıkta "Zayıf noktalar" olarak listelenir.
- **Terimler:** Sayfadaki terimler, karşılıkları ve kısa tanımları. Tüm sayfalardan derlenen bir sözlük.
- **Soru sor:** O sayfa hakkında serbest soru, "Sayılarla çöz" ve "Diğer slaytlarla bağlantı kur".
- **Aralıklı tekrar:** 🚩 ile işaretlenen sayfalar 1, 3, 7, 14 ve 30 gün sonra "Bugün tekrar" listesine düşer.
- **Sınav önceliği:** Çıkmış soruları veya hocanın vurgularını yapıştır; tüm sayfalar Yüksek / Orta / Düşük olarak etiketlenir.
- **Kişisel notlar, sesli okuma, dışa aktarma:** Notlar Word, metin veya Markdown olarak indirilebilir ya da kopyalanabilir.
- **Kartlar:** Quiz soruları ve terimler otomatik olarak çalışma kartına dönüşür. Kart önce soruyu gösterir, sonra cevabı; Tekrar / Zor / İyi / Kolay değerlendirmesine göre bir sonraki tekrar zamanı belirlenir (1 dk'dan aylara). Quiz'de "Bilemedim" dediğin soru hemen tekrar sırasına girer. Kitaplıkta destelere göre bekleyen kartlar listelenir. Klavye: Boşluk = cevabı göster, 1-4 = değerlendir.
- **Formüller:** Açıklamalardaki formüller KaTeX ile düzgün gösterilir.
- **Kitaplık:** Eklenen dosyalar cihazda saklanır, sonra kaldığın yerden açılır.
- **Yedekle / Geri yükle:** Kitaplıktaki tüm slaytlar, açıklamalar, notlar, quiz'ler ve kart ilerlemesi tek bir `slaity-yedek-….json` dosyasına alınır; başka bir cihazda veya adreste geri yüklenir. API anahtarları yedeğe girmez.
- **Mobil uyumlu:** Kaydırarak sayfa geçme, iki parmakla yakınlaştırma, sabitlenebilen slayt paneli.
- **Uygulama olarak:** Ana ekrana yüklenebilir (PWA) ve internetsiz açılır; Android için APK'sı da var (aşağıya bak).
- **7 dil:** Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Rusça, Arapça.

## Kullanım

1. `index.html` dosyasını tarayıcıda aç (veya GitHub Pages ile yayınla, aşağıya bak).
2. **⚙︎ Ayarlar**'dan sağlayıcıyı seç:
   - **Gemini:** [aistudio.google.com](https://aistudio.google.com) adresinden ücretsiz bir API anahtarı al.
   - **Özel API:** OpenAI uyumlu herhangi bir servis (ör. OpenRouter). Adres, anahtar ve model adını gir. Model görsel desteklemiyorsa PDF sayfasının metni gönderilir.
3. **+ Slayt Ekle** ile bir PDF veya görsel seç.

> API anahtarın yalnızca bu tarayıcıda (localStorage) saklanır ve doğrudan seçtiğin sağlayıcıya gönderilir. Paylaşılan bir cihazda kullandıktan sonra anahtarı ayarlardan sil.

### Yayınlama (GitHub Pages)

Repo ayarlarında **Settings → Pages → Deploy from a branch → `main` / root** seç. Uygulama `https://<kullanıcı>.github.io/slait/` adresinde açılır. iPhone'da Safari'den "Ana Ekrana Ekle" ile uygulama gibi kullanılabilir.

## Uygulama olarak kullanma

**Android (APK):** [slaity.apk](https://github.com/oguzhvn/slait/releases/download/apk/slaity.apk) dosyasını telefonda indirip aç. İlk seferde tarayıcıya "bilinmeyen uygulamaları yükleme" izni vermen gerekir. Her `main` güncellemesinde GitHub Actions yeni bir APK üretir; yenisini kurmak eskisinin üzerine yazar, verilerin kalır. Uygulama pdf.js ve KaTeX'i içinde taşır, internetsiz açılır (yapay zekâ özellikleri internet ister).

**Ana ekrana yükleme (PWA):** Siteyi açtıktan sonra Android'de Chrome menüsü → **Uygulamayı yükle**, iPhone'da Safari → Paylaş → **Ana Ekrana Ekle**. Bir kez açıldıktan sonra internetsiz de açılır.

> APK ile site ayrı yerlerdir; birinde oluşturduğun notlar diğerinde görünmez. Taşımak için **Yedekle / Yedeği geri yükle** kullan.

### Verileri başka bir yere taşıma

Tarayıcı verileri **açtığın adrese** bağlıdır: `index.html`'i başka bir adresten (ör. GitHub Pages) açarsan önceki kitaplığın orada görünmez. Taşımak için:

1. Uygulamanın yeni sürümünü, eski verilerinin olduğu **aynı yerde** aç (aynı dosya/aynı adres; eski dosyanın içeriğini yenisiyle değiştirmek yeterli). Eski sürümün kayıtları otomatik tanınır.
2. **📚 Kitaplığım → 💾 Yedekle** ile yedek dosyasını kaydet.
3. Yeni adreste **📚 Kitaplığım → 📥 Yedeği geri yükle** ile o dosyayı seç. Aynı slayt zaten varsa tekrar eklenmez.

### Yerelde çalıştırma

```bash
npm start          # http://localhost:3000
```

`file://` ile açmak da çalışır, ancak bazı tarayıcılarda kalıcı depolama daha güvenilmez olur. Uygulamadaki **🩺 Tanılama** düğmesi cihazda neyin çalıştığını gösterir.

## Geliştirme

```bash
npm install
npx playwright install chromium   # ilk seferde
npm test
npm run build:www                 # Android için www/ (yerelde APK: npx cap add android && cd android && ./gradlew assembleDebug)
```

`tests/smoke.test.js` gerçek bir yapay zekâ servisine bağlanmaz: API'yi taklit eder ve pdf.js'i `node_modules`'tan sunar.

## Proje yapısı

```
index.html                 Uygulamanın tamamı (HTML + CSS + JS)
manifest.webmanifest, sw.js  PWA: ana ekrana yükleme ve çevrimdışı açılış
icons/, android-res/       Web ve Android simgeleri (scripts/gen-icons.js ile üretilir)
capacitor.config.json      Android uygulaması (Capacitor) ayarları
scripts/build-www.js       Android için www/ klasörünü hazırlar (kütüphaneler yerel)
android-signing/           APK imzalama anahtarı (güncellemeler üst üste kurulabilsin diye sabit)
.github/workflows/android.yml  APK'yı derler ve "apk" sürümü olarak yayınlar
tests/smoke.test.js        Tarayıcı testi (Playwright)
docs/ARCHITECTURE.md       Kodun yapısı, veri modeli, depolama anahtarları
CHANGELOG.md               Değişiklik geçmişi
```
