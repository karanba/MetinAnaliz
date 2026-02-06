# AGENTS.md

Bu dosya, projede çalışan AI agentlar için kısa ve net çalışma talimatları sağlar.

## Proje özeti
- Amaç: Türkçe metinlerde cümle/kelime/hece analizi yapıp YOD değerini hesaplamak.
- Backend: FastAPI ile `/analyze` endpointi JSON analiz çıktısı döner.
- Frontend: Angular SPA (standalone) backend ile `/api/analyze` üzerinden konuşur.

## Önemli dosyalar
- `main.py`: FastAPI uygulaması.
- `analiz.py`: Eski CLI (örnek/geriye dönük kullanım).
- `frontend/`: Angular SPA kaynakları.
- `ornekler/`: Örnek giriş metinleri.
- `sonuclar/`: Örnek çıktı metinleri.
- `README.md`: Kullanım ve YOD formülü.

## Çalıştırma
- Backend (PowerShell):
  - `uvicorn main:app --reload`
- Frontend (PowerShell):
  - `cd frontend`
  - `npm install`
  - `npm run start`
- Kod UTF-8 varsayar; girdiler UTF-8 olmalı.

## Davranışsal notlar
- Hece sayımı sesli harf sayımıyla yapılır.
- Cümle bölme regex ile yapılır; noktalama sonrası boşluk aranır.
- API sözleşmesini (JSON alan adları ve tipler) değiştirmemeye dikkat edin.

## Değişiklik yaparken
- API sözleşmesi veya frontend ekranı değişirse README'yi güncelleyin.
- Regex veya hece mantığına dokunursanız `ornekler/` ve `sonuclar/` uyumunu kontrol edin.
- Yeni örnek eklerken karşılık gelen sonuç dosyasını üretin.

## Hızlı kontrol
- Backend:
  - `uvicorn main:app --reload`
  - `Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/analyze -ContentType "application/json" -Body '{"text":"Merhaba dünya!"}'`
- Frontend:
  - `cd frontend`
  - `npm run start`
