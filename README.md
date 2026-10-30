# Slayt Açıklayıcı

Ders slaytlarını (PDF veya görsel) yapay zekâ ile sayfa sayfa açıklayan, tek dosyalık bir web uygulaması. Sunucu, hesap veya kurulum gerektirmez: `index.html` dosyasını tarayıcıda açman yeterli.

## Özellikler

- **Sayfa açıklaması:** Her sayfa için ANA FİKİR / AÇIKLAMA / ÖRNEK / AKILDA TUT düzeninde açıklama. "Daha basit anlat" ve "Daha fazla örnek" seçenekleri.
- **Quiz:** Her sayfa için 3 soru. "Bildim / Bilemedim" işaretleri kaydedilir; bilemediklerin kitaplıkta "Zayıf noktalar" olarak listelenir.
- **Terimler:** Sayfadaki terimler, karşılıkları ve kısa tanımları. Tüm sayfalardan derlenen bir sözlük.
- **Soru sor:** O sayfa hakkında serbest soru, "Sayılarla çöz" ve "Diğer slaytlarla bağlantı kur".
- **Aralıklı tekrar:** 🚩 ile işaretlenen sayfalar 1, 3, 7, 14 ve 30 gün sonra "Bugün tekrar" listesine düşer.
- **Sınav önceliği:** Çıkmış soruları veya hocanın vurgularını yapıştır; tüm sayfalar Yüksek / Orta / Düşük olarak etiketlenir.
- **Kişisel notlar, sesli okuma, dışa aktarma:** Notlar Word, metin veya Markdown olarak indirilebilir ya da kopyalanabilir.
- **Kitaplık:** Eklenen dosyalar cihazda saklanır, sonra kaldığın yerden açılır.
- **Mobil uyumlu:** Kaydırarak sayfa geçme, iki parmakla yakınlaştırma, sabitlenebilen slayt paneli, ana ekrana eklenebilir.
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
```

`tests/smoke.test.js` gerçek bir yapay zekâ servisine bağlanmaz: API'yi taklit eder ve pdf.js'i `node_modules`'tan sunar.

## Proje yapısı

```
index.html                 Uygulamanın tamamı (HTML + CSS + JS)
tests/smoke.test.js        Tarayıcı testi (Playwright)
docs/ARCHITECTURE.md       Kodun yapısı, veri modeli, depolama anahtarları
scripts/claude-base-setup.sh  Claude Code için temel token tasarrufu kurulumu
CLAUDE.md, .claude/        Bu repoda çalışan Claude Code oturumları için kurallar
CHANGELOG.md               Değişiklik geçmişi
```

## Claude Code ile çalışma

Bu repo, Claude Code oturumlarında token tasarrufu için iki açık kaynak projeyi temel olarak kullanır:

- [drona23/claude-token-efficient](https://github.com/drona23/claude-token-efficient): `CLAUDE.md` içindeki kısa kurallar.
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) (Apache-2.0): `.claude/skills/caveman/`, sohbet cevaplarını kısaltır; kod ve commit'ler normal yazılır. Kapatmak için oturumda "stop caveman" yaz.

Bu ikisini **tüm projelerinde ve her yeni oturumda** kullanmak için `scripts/claude-base-setup.sh` betiğini çalıştır; `~/.claude/` altına kurar:

- **Kendi bilgisayarında:** `bash scripts/claude-base-setup.sh` (bir kez).
- **Claude Code bulut oturumlarında:** Oturum başlığındaki ortam menüsü → **Edit** → **Setup script** alanına betiğin içeriğini yapıştır. Her yeni oturum başlarken çalışır.
