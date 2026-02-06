# MetinAnaliz Backend

Türkçe metin analizi ve PDF işleme için FastAPI backend servisi.

## Kurulum

```bash
cd backend
pip install -r requirements.txt
```

## Geliştirme

```bash
# Geliştirme bağımlılıklarını yükle
pip install -r requirements-dev.txt

# Development server başlat
uvicorn app.main:app --reload --port 8000
```

## Test

```bash
pytest tests/ -v
```

## API Endpoint'leri

### Metin Analizi
- `POST /analyze` - Türkçe metin analizi
- `POST /export` - Analiz sonuçlarını dışa aktar (CSV, TXT, PDF)
- `GET /health` - Sağlık kontrolü

### Deprem Verileri
- `GET /earthquakes` - Deprem verilerini sorgula
- `GET /earthquakes/presets/today` - Son 24 saat
- `GET /earthquakes/presets/week` - Son 7 gün
- `GET /earthquakes/presets/month` - Son 30 gün

### PDF İşlemleri
- `POST /pdf/validate` - PDF doğrulama
- `POST /pdf/convert-to-word` - PDF'i Word'e dönüştür
- `POST /pdf/merge` - PDF'leri birleştir
- `GET /pdf/download/{file_id}` - Dosya indir
- `GET /pdf/config` - Yapılandırma bilgisi

## Yapı

```
backend/
├── app/           # Ana uygulama modülü
│   ├── main.py    # FastAPI entry point
│   └── config.py  # Yapılandırma
├── routers/       # API router'ları
├── services/      # İş mantığı servisleri
├── middleware/    # Güvenlik middleware'leri
├── tests/         # Test dosyaları
├── fonts/         # PDF export için fontlar
└── examples/      # Örnek dosyalar
```
