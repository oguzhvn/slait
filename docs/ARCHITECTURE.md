# Mimari

Uygulamanın tamamı `index.html` içinde, tek bir IIFE olarak yazılmış düz JavaScript. Derleme adımı yoktur. Tek dış bağımlılık cdnjs'den yüklenen **pdf.js 3.11.174**'tür.

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

IndexedDB çalışmazsa desteler bellekte (`memDecks`) tutulur ve kitaplıkta uyarı gösterilir. localStorage yazımı başarısız olursa (ör. kota dolduğunda) `ls()` üstte `#stWarn` uyarısını gösterir.
