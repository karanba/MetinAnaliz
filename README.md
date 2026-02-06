# MetinAnaliz

Türkçe metin analizi ve PDF işleme platformu.

## Hızlı Başlangıç

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Tarayıcıda: <http://localhost:4200>

## Özellikler

- **Metin Analizi**: Türkçe metinlerin okunabilirlik analizi (YOD, Ateşman, Çetinkaya-Uzun)
- **PDF Araçları**: PDF → Word dönüştürme, PDF birleştirme
- **Deprem Verileri**: USGS, Kandilli, EMSC kaynaklarından canlı deprem verileri
- **Harita Araçları**: İnteraktif haritalar, mesafe ve alan ölçümü

## Proje Yapısı

```text
MetinAnaliz/
├── backend/        # FastAPI backend (Python)
├── frontend/       # Angular SPA (TypeScript)
├── docs/           # Dokümantasyon
├── .env.example    # Environment değişkenleri şablonu
└── LICENSE.txt     # MIT Lisansı
```

## Dokümantasyon

- [Detaylı Kullanım](docs/README.md)
- [Güvenlik](docs/SECURITY.md)
- [API Referansı](backend/README.md)

## Lisans

MIT License - detaylar için [LICENSE.txt](LICENSE.txt) dosyasına bakın.
