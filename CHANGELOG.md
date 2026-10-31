# Değişiklik geçmişi

## 2026-10-31 (2)

- **Biçim dayanıklılığı:** Model istenen etiketlere uymasa da ekran bozulmuyor. Küçük harf, Markdown (`**`, `##`, madde işareti), İngilizce başlıklar, numaralı quiz'ler, küçük harfli "Terim:" ve "Öncelik:" tanınıyor; hiçbir yapı yoksa cevap boş kalmak yerine düz metin olarak gösteriliyor.
- **Düzeltme:** Görsel desteklemeyen bir modelde açıklama ve soru aynı anda gönderilince ikincisi metne geçmek yerine hata veriyordu.

## 2026-10-31

- **Güvenlik:** Kötü niyetli bir PDF'in sayfada kod çalıştırabildiği pdf.js açığı (GHSA-wgrm-67xf-hhpq) `isEvalSupported: false` ile kapatıldı. KaTeX 0.16.9 → 0.19.1 (6 güvenlik uyarısı giderildi).
- **CDN yok:** pdf.js ve KaTeX artık sitenin kendisinden (`vendor/`) yükleniyor; üçüncü taraf sunucuya istek gitmiyor.
- **Hız ve erişilebilirlik** (Lighthouse, telefon): performans 86 → 93, erişilebilirlik 88 → 100, en iyi uygulamalar 96 → 100, SEO 90 → 100. İlk görüntü 3,2 sn → 1,2 sn. Açılır menülere ekran okuyucu etiketi, sayfa açıklaması ve simge eklendi.

## 2026-10-30 (4)

- **Android uygulaması:** Capacitor ile APK; GitHub Actions her `main` güncellemesinde derleyip "apk" sürümü olarak yayınlıyor. İndirme/paylaşma ve sesli okuma Android eklentileriyle çalışıyor; pdf.js ve KaTeX uygulamanın içinde.
- **PWA:** Ana ekrana yüklenebiliyor, bir kez açıldıktan sonra internetsiz açılıyor. Yeni uygulama simgesi.

## 2026-10-30 (3)

- Kitaplığa **💾 Yedekle** ve **📥 Yedeği geri yükle** eklendi: slaytlar, açıklamalar, notlar ve kart ilerlemesi tek dosyayla başka bir adrese veya cihaza taşınabiliyor. İlk sürümün kayıtları da yedeğe giriyor.

## 2026-10-30 (2)

- Uygulamanın adı **Slaity** oldu.
- Yapay zekâya giden slayt görseli küçültülüyor (uzun kenar en fazla 1536 piksel) ve isteğin başına konuyor; sınav önceliği analizinde sabit kısım her sayfada aynı başlangıçta gönderiliyor. Amaç daha az görsel token'ı ve sağlayıcı önbelleğinden yararlanmak.
- Uygulama içi kart sistemi (🃏 Kartları çalış): quiz soruları ve terimler, Tekrar / Zor / İyi / Kolay değerlendirmeli aralıklı tekrar kartlarına dönüşüyor. Kitaplıkta bekleyen kartlar listeleniyor.
- "Notları indir" artık `.txt` dosyası veriyor (telefonlarda da açılır).
- Formüller KaTeX ile gösteriliyor.

## 2026-10-30

### Düzeltmeler
- Not ve sınav kutularında, açılır menülerde ve kitaplık/tanılama ekranında ok tuşları artık sayfa değiştirmiyor.
- Zaten açık olan sayfaya gitmek (ör. son sayfada →) devam eden açıklamayı iptal etmiyor.
- Açıklama gelirken soru sormak açıklamayı iptal etmiyor; "Durdur" kayıtlı açıklamayı geri getiriyor.
- Görsel desteklemeyen özel API modellerine PDF sayfasının metni gönderiliyor.
- 50:50 / 60:40 oranları telefonda düzeni bozmuyor ve hatırlanıyor.
- Depolama dolduğunda kayıt başarısız olursa uyarı gösteriliyor.
- "Diğer slaytlarla bağlantı" açık desteyi adına göre değil kimliğine göre dışlıyor.

### Eklenenler
- README, mimari belgesi, tarayıcı testi (`npm test`).

## developmentv1
- `slaity.html` → `index.html` olarak yeniden adlandırıldı.
