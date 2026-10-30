# Değişiklik geçmişi

## 2026-10-30 (2)

- Uygulamanın adı **Slaity** oldu.
- Yapay zekâya giden slayt görseli küçültülüyor (uzun kenar en fazla 1536 piksel) ve isteğin başına konuyor; sınav önceliği analizinde sabit kısım her sayfada aynı başlangıçta gönderiliyor. Amaç daha az görsel token'ı ve sağlayıcı önbelleğinden yararlanmak.
- Quiz soruları ve terimler Anki'ye aktarılabiliyor (🃏 Anki'ye aktar).
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
