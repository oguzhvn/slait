# Mimari

Uygulamanın tamamı `index.html` içinde, tek bir IIFE olarak yazılmış düz JavaScript. Derleme adımı yoktur. Kütüphaneler depodaki `vendor/` klasöründen servis edilir (CDN yok): **pdf.js 3.11.174** (zorunlu) ve **KaTeX 0.19.1** (isteğe bağlı; yüklenemezse formüller düz metin kalır). İkisi de ilk açılışı yavaşlatmasın diye ilk ihtiyaçta yüklenir: `pdfLib()` ilk PDF açılınca, `katexLib()` ilk formül görününce (`loadScript`). `vendor/` klasörü `npm run vendor` ile `node_modules`'tan üretilir; sürümler `vendor/VERSIONS.json`'da.

**Güvenlik:** pdf.js 4.2.67'den eski sürümlerde, hazırlanmış bir PDF yazı tipiyle sayfada JavaScript çalıştırılabiliyor (GHSA-wgrm-67xf-hhpq). Bu, localStorage'daki API anahtarını riske atar. `getDocument` bu yüzden `isEvalSupported: false` ile çağrılır; pdf.js yükseltilene kadar bu seçenek kaldırılmamalı.

## Ekran düzeni

- Üst çubuk (`header.top`): logo, `#deckTitle`, Kitaplık / Ekle / Ayarlar simgeleri. Ayarlar paneli (`#set`) yalnızca açıkken görünür.
- `main#app`: solda `#slideCard` (slayt panele sığar; `setZoom` 1'de genişlik boş bırakılır, iki parmakla yakınlaştırmada genişler), sağda `#panel` (seçim çubuğu `.seg`, kayan `.pbody`, altta sabit soru kutusu `#askRow`).
- İkincil işlemler "⋯" menüsünde (`#moreMenu`); durumunu kendi metniyle gösteren düğmelerde (`exp`, `cpy`, `tts`, `flag`) menü açık kalır.
- Yerleşim: masaüstü ve yatay telefon iki sütun, her sütun kendi içinde kayar. Dik telefonda (`max-width:700px` + `portrait`) tek sütun, slayt üstte yapışkan, `#rotHint` yan çevirmeyi önerir. Alçak yatay ekranda (`max-height:500px`) boşluklar küçülür.
- Uygulama yatay açılır: `manifest.webmanifest` `orientation: landscape`, APK'da iş akışı `MainActivity`'ye `sensorLandscape` ekler.
- Eski görünümün bazı kontrolleri (`zin`, `sl`, `first`, `r5050`, `pin` …) kod bağlı kalsın diye gizli bir kapta durur.

## Akış

1. Kullanıcı dosya seçer → `saveDeck()` dosyayı IndexedDB'ye yazar → `loadDeck()` açar.
2. `show(i)` sayfayı kanvasa çizer. "Otomatik" açıksa ve sayfanın açıklaması yoksa 500 ms sonra `run('e')` çağrılır.
3. `run(kind, variant)` istemi kurar, kanvası JPEG olarak ekler, `callAI()` ile akış hâlinde cevap alır ve sonucu `S` durumuna kaydeder.
4. `follow(q)` sayfa hakkındaki soruları, sayfanın açıklamasını bağlam olarak ekleyerek sorar.

Sayfa içinde gezinme `go(i)` üzerinden yapılır; zaten açık olan sayfaya gitmek hiçbir şey yapmaz. `show(i)` yalnızca deste ilk açılırken doğrudan çağrılır.

## Yapay zekâ sağlayıcıları

| Fonksiyon | Uç nokta | Not |
|---|---|---|
| `callGemini` | `generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse` | Anahtar `x-goog-api-key` başlığında |
| `callCustom` | `{base}/chat/completions` (OpenAI uyumlu, `stream: true`) | Model görseli reddederse sayfa metniyle tekrar dener ve bunu `noVision` içinde hatırlar |

İstek iptali iki ayrı `AbortController` ile yönetilir: `ctl` (açıklama/quiz/terim) ve `qctl` (sorular). `cancelAI()` ikisini birden iptal eder; sayfa veya deste değişince çağrılır. Eski bir cevabın yanlış yere yazılmasını `tok`, `loadToken`, `docId` ve `S===state` kontrolleri önler.

## Token tasarrufu

- **Küçültülmüş görsel:** Ekrandaki kanvas 2600 piksele kadar çıkabilir; yapay zekâya giden kopyanın uzun kenarı `AI_IMG_MAX` (1536) ile sınırlanır.
- **Önbellek dostu sıra:** Görsel her istekte metinden önce gelir, ardından sabit rol metni gelir. Aynı sayfadaki açıklama, quiz, terim ve sorular böylece aynı başlangıcı paylaşır; sağlayıcı bu ortak kısmı önbellekten sayabilir.
- **Sınav önceliği:** Talimatlar ve sınav metni her sayfada birebir aynı başlangıçta (`head`), sayfa metni en sonda gönderilir.

## Model cevabını ayrıştırma

İstemler sabit etiketler ister, ama ekran modelin bunlara birebir uymasına güvenmez:

| Ne | Tanınanlar | Hiçbiri tanınmazsa |
|---|---|---|
| Açıklama (`splitHead`, `fmt`) | Büyük/küçük harf, `**`/`##`/madde işareti, iki noktasız başlık, İngilizce başlıklar (`HEADS`) | Metin tek paragraf olarak gösterilir |
| Quiz (`parseQuiz`) | `SORU`/`Question`/`Q1`, numaralı liste, aynı satırda `Cevap:`; etiketli quiz'de etiketsiz devam eden numara | `rawView` ham metni bir notla gösterir |
| Terimler (`parseGloss`) | `TERİM`/`Terim`/`Term`, `\|` yerine ` - ` ayırıcı | `rawView` |
| Sınav önceliği | `Öncelik`/`Priority`, `High/Medium/Low` | Sayfa analiz edilmemiş sayılır |

Aynı `splitHead` Word dışa aktarımında, sesli okumada ve "diğer slaytlarla bağlantı"da da kullanılır. Örnekler `tests/format.test.js`'te.

## Formüller

İstemler formülleri `\( … \)` ve `\[ … \]` ile istemeye ayarlıdır (`MATH`). `$` kullanılmaz, çünkü finans metinlerinde para birimi olarak geçer. `math(el)` cevap tamamlandıktan sonra KaTeX auto-render çalıştırır; akış sırasında ham metin görünür.

## Kartlar

`deckCards(X)` bir destenin kartlarını üretir: her quiz sorusu (`q{sayfa}.{n}`) ve sözlükteki her terim (`t:{terim}`). İlerleme `S.k[kartId] = {ef, ivl, reps, lapses, due}` içinde tutulur.

`sched(st, g, now)` SM-2 tabanlıdır; `g`: 0 Tekrar, 1 Zor, 2 İyi, 3 Kolay.

| Durum | Tekrar | Zor | İyi | Kolay |
|---|---|---|---|---|
| Yeni / öğreniliyor | 1 dk | 10 dk | 1 gün | 4 gün |
| Tekrar kartı | 10 dk (unutma sayılır) | `ivl × 1.2` | `ivl × ef` | `ivl × ef × 1.3` |

`ef` 2.5'ten başlar (en az 1.3; Zor −0.15, Kolay +0.15, Tekrar −0.2), aralık en fazla 365 gün. Bir günden kısa aralık alan kart oturumda yeniden sıraya girer. Oturum, zamanı gelen kartlar ve en fazla `NEW_LIMIT` (20) yeni karttan oluşur.

Quiz yeniden üretilince o sayfanın quiz kartlarının ilerlemesi silinir. Quiz'de "Bilemedim" o kartı hemen tekrar sırasına koyar. Kitaplıktan çalışırken açık destenin canlı durumu (`S`), diğer destelerin localStorage kaydı kullanılır (`cardDecks`).

## Veri modeli

Her destenin durumu `S` nesnesindedir ve localStorage'da JSON olarak tutulur:

| Alan | İçerik |
|---|---|
| `c[p]` | Sayfa `p` açıklaması (ham model metni) |
| `q[p]` | Quiz metni (`SORU n:` / `CEVAP:`) |
| `w[p][k]` | Quiz sorusu `k` için `'ok'` / `'bad'` |
| `g[p]` | Terimler (`TERİM: orijinal \| karşılık \| tanım`) |
| `n[p]` | Kullanıcının sayfa notu |
| `f` | 🚩 işaretli sayfalar |
| `sr[p]` | Aralıklı tekrar: `{step, due}` (`INT = [1,3,7,14,30]` gün) |
| `k[id]` | Kart ilerlemesi (aşağıda Kartlar bölümüne bak) |
| `p[p]` | Sınav önceliği: `{l: 'Yüksek'\|'Orta'\|'Düşük', r: neden}` |
| `exam`, `pex` | Sınav metni ve son analizin hangi metinle yapıldığı |

## Depolama

| Yer | Anahtar | İçerik |
|---|---|---|
| IndexedDB `slaytApp` / `decks` | otomatik `id` | `{name, course, mime, blob, added, opened, pages}` |
| localStorage | `sa:deck:{id}` | Destenin `S` durumu |
| localStorage | `sa:{ad}\|{boyut}` | Eski sürümün anahtarı (açılınca yeni anahtara taşınır) |
| localStorage | `gk gm gc gl pv cu ck cm` | Ayarlar: anahtar, model, ders, dil, sağlayıcı, özel API |
| localStorage | `pin`, `ratio` | Görünüm tercihleri |

## PWA ve Android uygulaması

**PWA:** `manifest.webmanifest` uygulamayı yüklenebilir yapar. `sw.js` uygulama kabuğunu ve `vendor/` dosyalarını önbelleğe alır (`vendor/` değişince `CACHE` adını artır): sayfa için önce ağ (güncellemeler gelsin), diğer dosyalar için önce önbellek. Yapay zekâ istekleri (POST) hiç önbelleğe girmez. Service worker yalnızca `https:` veya `localhost` üzerinde, Android uygulaması dışında kaydedilir. `sw.js` içindeki `CACHE` adı değiştirilirse eski önbellek silinir.

**Android (Capacitor 8):** `scripts/build-www.js` `index.html`, `vendor/` ve `icons/` klasörlerini `www/`'ye kopyalar ve Capacitor çalışma zamanını (`vendor/capacitor.js`) ekler. Uygulama `NATIVE` olduğunda:

| Özellik | Web | Android |
|---|---|---|
| Dosya indirme (`saveFile`) | `<a download>` / Web Share | `Filesystem.writeFile` (önbellek klasörü) + `Share.share` |
| Sesli okuma | `speechSynthesis` | `TextToSpeech.speak` (parça parça, `spk` sayacıyla durdurulur) |

Eklentiler bundler olmadan `Capacitor.registerPlugin(ad)` ile alınır (`plugin()`). `android/` klasörü depoda tutulmaz; iş akışı her derlemede `npx cap add android` ile üretir, `android-res/` simgelerini kopyalar ve `versionCode`'u çalıştırma numarasından verir. İmza için depodaki sabit `android-signing/debug.keystore` kullanılır, böylece yeni APK eskisinin üzerine kurulur.

## Yedek dosyası

`backupAll()` her desteyi `{name, course, mime, added, opened, pages, data, state}` olarak yazar: `data` dosyanın kendisi (data URL), `state` destenin `S` durumu. Dosya: `{app: 'slaity', v: 1, created, decks: [...]}`. Ayarlar ve API anahtarları dahil değildir.

Geri yüklemede aynı ad ve boyutta bir deste zaten varsa eklenmez; o destenin burada hiç kaydı yoksa yalnızca yedekteki durum yazılır.

IndexedDB çalışmazsa desteler bellekte (`memDecks`) tutulur ve kitaplıkta uyarı gösterilir. localStorage yazımı başarısız olursa (ör. kota dolduğunda) `ls()` üstte `#stWarn` uyarısını gösterir.
