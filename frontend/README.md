# MetinAnaliz Frontend

Angular 21 tabanlı tek sayfa uygulama (SPA).

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm start
```

Uygulama `http://localhost:4200` adresinde çalışır ve API isteklerini `proxy.conf.json` üzerinden backend'e yönlendirir.

## Build

```bash
npm run build
```

Çıktı: `dist/metin-analiz-ui/`

## Test

```bash
# Unit testler
npm test

# E2E testler (Playwright)
npm run e2e
```

## Yapı

```text
frontend/src/
├── app/
│   ├── components/     # Paylaşılan UI bileşenleri
│   ├── sections/       # Ana uygulama bölümleri
│   │   ├── language/   # Dil araçları
│   │   ├── engineering/# Mühendislik araçları
│   │   ├── design/     # Tasarım araçları
│   │   ├── geo/        # Harita araçları
│   │   └── file/       # Dosya araçları
│   ├── services/       # API ve iş mantığı servisleri
│   └── models/         # TypeScript modelleri
├── environments/       # Ortam yapılandırmaları
└── assets/            # Statik dosyalar
```

## Teknolojiler

- **Framework**: Angular 21 (Standalone Components)
- **UI**: PrimeNG 21, TailwindCSS 4
- **Haritalar**: Leaflet, Leaflet Geoman
- **3D**: Three.js
- **Grafikler**: Plotly.js
