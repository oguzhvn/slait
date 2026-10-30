# Mimari

Uygulamanın tamamı `index.html` içinde, tek bir IIFE olarak yazılmış düz JavaScript. Derleme adımı yoktur. Dış bağımlılıklar cdnjs'den yüklenir: **pdf.js 3.11.174** (zorunlu) ve **KaTeX 0.16.9** (isteğe bağlı; yüklenemezse formüller düz metin kalır).

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

**PWA:** `manifest.webmanifest` uygulamayı yüklenebilir yapar. `sw.js` uygulama kabuğunu ve cdnjs'deki pdf.js/KaTeX dosyalarını önbelleğe alır: sayfa için önce ağ (güncellemeler gelsin), diğer dosyalar için önce önbellek. Yapay zekâ istekleri (POST) hiç önbelleğe girmez. Service worker yalnızca `https:` veya `localhost` üzerinde, Android uygulaması dışında kaydedilir. `sw.js` içindeki `CACHE` adı değiştirilirse eski önbellek silinir.

**Android (Capacitor 8):** `scripts/build-www.js` `index.html`'i `www/`'ye kopyalar, cdnjs adreslerini `vendor/` altındaki yerel kopyalarla değiştirir ve Capacitor çalışma zamanını (`vendor/capacitor.js`) ekler. Uygulama `NATIVE` olduğunda:

| Özellik | Web | Android |
|---|---|---|
| Dosya indirme (`saveFile`) | `<a download>` / Web Share | `Filesystem.writeFile` (önbellek klasörü) + `Share.share` |
| Sesli okuma | `speechSynthesis` | `TextToSpeech.speak` (parça parça, `spk` sayacıyla durdurulur) |

Eklentiler bundler olmadan `Capacitor.registerPlugin(ad)` ile alınır (`plugin()`). `android/` klasörü depoda tutulmaz; iş akışı her derlemede `npx cap add android` ile üretir, `android-res/` simgelerini kopyalar ve `versionCode`'u çalıştırma numarasından verir. İmza için depodaki sabit `android-signing/debug.keystore` kullanılır, böylece yeni APK eskisinin üzerine kurulur.

## Yedek dosyası

`backupAll()` her desteyi `{name, course, mime, added, opened, pages, data, state}` olarak yazar: `data` dosyanın kendisi (data URL), `state` destenin `S` durumu. Dosya: `{app: 'slaity', v: 1, created, decks: [...]}`. Ayarlar ve API anahtarları dahil değildir.

Geri yüklemede aynı ad ve boyutta bir deste zaten varsa eklenmez; o destenin burada hiç kaydı yoksa yalnızca yedekteki durum yazılır.

IndexedDB çalışmazsa desteler bellekte (`memDecks`) tutulur ve kitaplıkta uyarı gösterilir. localStorage yazımı başarısız olursa (ör. kota dolduğunda) `ls()` üstte `#stWarn` uyarısını gösterir.
