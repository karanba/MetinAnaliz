# AGENTS.md

Bu dosya, projede çalışan AI agentlar için kısa ve net çalışma talimatları sağlar.

## Proje özeti
- Amaç: Türkçe metinlerde cümle/kelime/hece analizi yapıp YOD değerini hesaplamak.
- Girdi: UTF-8 metin dosyası.
- Çıktı: Cümle ve kelime dökümü + özet istatistikler + YOD.

## Önemli dosyalar
- `analiz.py`: Ana CLI; metni okur, analiz eder, sonucu stdout'a yazar.
- `ornekler/`: Örnek giriş metinleri.
- `sonuclar/`: Örnek çıktı metinleri.
- `README.md`: Kullanım ve YOD formülü.

## Çalıştırma
- Windows PowerShell:
  - `python analiz.py ornekler/aa.txt > sonuclar/aa.txt`
- Kod UTF-8 varsayar; girdiler UTF-8 olmalı.

## Davranışsal notlar
- Hece sayımı sesli harf sayımıyla yapılır.
- Cümle bölme regex ile yapılır; noktalama sonrası boşluk aranır.
- Çıktı formatı test/karşılaştırma için önemlidir; satır düzenini bozmayın.

## Değişiklik yaparken
- Çıktı formatını değiştirecekseniz README'yi güncelleyin.
- Regex veya hece mantığına dokunursanız `ornekler/` ve `sonuclar/` uyumunu kontrol edin.
- Yeni örnek eklerken karşılık gelen sonuç dosyasını üretin.

## Hızlı kontrol
- `python analiz.py ornekler/aa.txt > sonuclar/aa.txt`
- Sonuçları gözle kontrol edin; özellikle toplam cümle/kelime/hece ve YOD.
