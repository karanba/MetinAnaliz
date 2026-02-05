# Harita Tool'ları - Adım Adım Prompt Listesi

Bu dosya, harita tabanlı tool'ların geliştirilmesi için adım adım çalıştırılabilir prompt'ları içerir.
Her prompt bağımsız bir session'da çalıştırılabilir.

---

## PHASE 1: ALTYAPI

### Prompt 1.1: Leaflet Kurulumu

```
Frontend'e Leaflet ve gerekli paketleri kur:
- leaflet, @types/leaflet
- @asymmetrik/ngx-leaflet
- leaflet.markercluster, @types/leaflet.markercluster
- @geoman-io/leaflet-geoman-free
- leaflet-control-geocoder
- papaparse, @types/papaparse

angular.json'a CSS dosyalarını ekle (leaflet.css, leaflet.draw.css, geoman.css).
Leaflet marker icon fix'i uygula (webpack icon path sorunu).
Test için basit bir harita göster.
```

---

### Prompt 1.2: Reusable Map Components

```
components/map/ altında reusable map component'leri oluştur:

1. map.models.ts - Interface tanımları:
   - MapConfig (center, zoom, minZoom, maxZoom)
   - LayerConfig (name, url, attribution, type)
   - MapState (initialized, center, zoom, bounds)

2. base-map.component.ts - Temel harita wrapper:
   - @Input() config: MapConfig
   - @Output() mapReady: EventEmitter<L.Map>
   - @Output() mapClick: EventEmitter<L.LatLng>
   - ViewChild ile map container
   - ngAfterViewInit'te map init
   - ngOnDestroy'da cleanup

3. base-map.service.ts - Map instance yönetimi:
   - initializeMap(container, config)
   - destroy()
   - Signals: state, bounds, isInitialized

Mevcut HistoryService pattern'ini takip et (Signals kullan).
Standalone component olarak yap.
```

---

### Prompt 1.3: Map Layer Service

```
services/map/map-layer.service.ts oluştur:

1. Base Layers:
   - OSM (OpenStreetMap)
   - Satellite (Esri World Imagery - ücretsiz)
   - Terrain (OpenTopoMap)

2. Signals:
   - baseLayers: signal<Map<string, L.TileLayer>>
   - activeBaseLayer: signal<string>
   - overlays: signal<Map<string, L.LayerGroup>>
   - visibleOverlays: signal<Set<string>>

3. Metodlar:
   - setBaseLayer(name: string)
   - addOverlay(name, layer)
   - toggleOverlay(name)
   - isOverlayVisible(name)

Injectable providedIn: 'root'.
```

---

### Prompt 1.4: Map Plugin Service

```
services/map/map-plugin.service.ts oluştur:

Plugin tipleri: 'draw' | 'measure' | 'geocoder' | 'coordinates'

1. Signals:
   - activePlugins: signal<Set<PluginType>>

2. Metodlar:
   - enablePlugin(map: L.Map, type: PluginType, options?)
   - disablePlugin(type: PluginType)
   - isPluginActive(type: PluginType)
   - getPluginInstance<T>(type: PluginType)

3. Plugin kurulumları:
   - setupDrawPlugin: leaflet-geoman ile çizim
   - setupMeasurePlugin: mesafe/alan ölçümü
   - setupGeocoderPlugin: OSM Nominatim arama
   - setupCoordinatesPlugin: mouse koordinat gösterimi

Lazy loading pattern - plugin sadece enable edildiğinde yüklensin.
```

---

## PHASE 2: GEO SECTION

### Prompt 2.1: Geo Section Oluşturma

```
Yeni "Harita Araçları" section'ı oluştur:

1. tool.models.ts'e 'geo' kategorisi ekle:
   ToolCategory = 'language' | 'engineering' | 'design' | 'geo'

2. tool-registry.service.ts'e geo section ekle:
   - id: 'geo'
   - title: 'Harita Araçları'
   - description: 'Coğrafi analiz ve görselleştirme araçları'
   - icon: 'map'
   - tools: [map-tools, earthquake, airports]

3. sections/geo/ oluştur:
   - geo.component.ts/html/scss (hub sayfası)
   - Mevcut engineering.component pattern'ini kullan

4. app.routes.ts'e route'ları ekle:
   - /tools/geo -> GeoComponent
   - /tools/geo/map-tools -> MapToolsComponent
   - /tools/geo/earthquake -> EarthquakeComponent
   - /tools/geo/airports -> AirportsComponent

5. app.component'e navigation dropdown ekle (Design gibi).
```

---

### Prompt 2.2: Map Tools Component (Temel Harita)

```
sections/geo/tools/map-tools/ oluştur:

1. map-tools.component.ts:
   - BaseMapComponent kullan
   - MapLayerService inject
   - MapPluginService inject

2. UI Bileşenleri:
   - Toolbar (üstte):
     - Layer selector (OSM/Satellite/Terrain) - PrimeNG SelectButton
     - Ölçüm butonları (mesafe, alan) - PrimeNG Button
     - Çizim butonları (marker, polyline, polygon) - PrimeNG Button
     - Temizle butonu

   - Sol panel (opsiyonel):
     - Ölçüm sonuçları
     - Çizilen şekillerin listesi

   - Sağ alt köşe:
     - Koordinat gösterimi (mouse move)

   - Üst arama:
     - Geocoder input (PrimeNG InputText + AutoComplete)

3. Özellikler:
   - Harita görüntüleme
   - Layer değişimi
   - Mesafe ölçümü (km/m)
   - Alan ölçümü (km²/m²)
   - Koordinat arama
   - Marker ekleme
   - Çizim (polygon, polyline, circle)
   - Çizimleri GeoJSON export

PageHeaderComponent kullan (breadcrumb: Araçlar > Harita Araçları > Harita).
```

---

## PHASE 3: DEPREM SİSTEMİ

### Prompt 3.1: Backend - Earthquake Router

```
Backend'e deprem API endpoint'leri ekle:

1. routers/earthquake.py oluştur:

   GET /api/earthquakes
   Query params:
   - start_time: datetime (ISO8601, default: 24 saat önce)
   - end_time: datetime (ISO8601, default: şimdi)
   - min_magnitude: float (default: 2.5)
   - max_magnitude: float (optional)
   - limit: int (default: 1000, max: 5000)

2. USGS API çağrısı:
   - Base URL: https://earthquake.usgs.gov/fdsnws/event/1/query
   - Format: geojson
   - httpx ile async request

3. Response: USGS GeoJSON'u direkt forward et

4. main.py'a router'ı ekle:
   app.include_router(earthquake_router, prefix="/api")

5. CORS ayarlarını kontrol et.
```

---

### Prompt 3.2: Backend - Cache Service

```
services/earthquake_cache.py oluştur:

1. EarthquakeCache class:
   - TTLCache(maxsize=20, ttl=60) - 60 saniye cache
   - httpx.AsyncClient instance

2. Metodlar:
   - async get_earthquakes(params: dict) -> dict
   - _build_cache_key(params) -> str
   - async _fetch_from_usgs(params) -> dict

3. Cache stratejisi:
   - params hash'i ile cache key oluştur
   - Cache hit: direkt dön
   - Cache miss: USGS'ten çek, cache'le, dön

4. APScheduler entegrasyonu (opsiyonel):
   - Her 15 saniyede popüler sorguları prefetch
   - Configurable interval (environment variable)

5. Error handling:
   - USGS timeout: son cache'i dön
   - Rate limit: retry with backoff

6. router'da kullan:
   cache = EarthquakeCache()

   @router.get("/earthquakes")
   async def get_earthquakes(...):
       return await cache.get_earthquakes(params)
```

---

### Prompt 3.3: Frontend - Earthquake Service

```
services/earthquake.service.ts oluştur:

1. Interface'ler:
   - EarthquakeFeature (GeoJSON Feature)
   - EarthquakeProperties (mag, place, time, url, ...)
   - EarthquakeQueryParams

2. Signals:
   - earthquakes: signal<EarthquakeFeature[]>
   - loading: signal<boolean>
   - error: signal<string | null>
   - lastUpdated: signal<Date | null>

3. Metodlar:
   - fetchEarthquakes(params: EarthquakeQueryParams): void
   - getEarthquakesByMagnitude(min, max): computed
   - startAutoRefresh(intervalMs: number): void
   - stopAutoRefresh(): void

4. HttpClient ile backend API çağrısı:
   - GET /api/earthquakes
   - Error handling
   - Loading state

Injectable providedIn: 'root'.
```

---

### Prompt 3.4: Earthquake Component

```
sections/geo/tools/earthquake/ oluştur:

1. earthquake.component.ts:
   - BaseMapComponent kullan
   - EarthquakeService inject

2. UI - Üst Toolbar:
   - Preset butonları: [Son 1 Saat] [Bugün] [Dün] [Son 7 Gün] [Son 30 Gün]
   - PrimeNG SelectButton kullan

3. UI - Tarih Slider:
   - PrimeNG Slider (range mode)
   - Min: 30 gün önce, Max: bugün
   - Değer değiştiğinde debounce ile API çağrısı

4. UI - Filtreler:
   - Magnitude slider (0-10)
   - Auto-refresh toggle (PrimeNG InputSwitch)
   - Refresh interval dropdown (15s, 30s, 60s)

5. Harita:
   - Deprem marker'ları:
     - Boyut: magnitude'a göre (2.5: küçük, 5: orta, 7+: büyük)
     - Renk: magnitude'a göre (yeşil -> sarı -> kırmızı)
   - Popup: magnitude, yer, tarih, derinlik, USGS linki

6. Sağ Panel (opsiyonel):
   - Son depremler listesi
   - Click'te haritada göster

7. Alt bilgi:
   - Toplam deprem sayısı
   - Son güncelleme zamanı
```

---

## PHASE 4: HAVAALANLARI

### Prompt 4.1: Airport Data Service

```
services/airport.service.ts oluştur:

1. Airport interface:
   - id, ident (ICAO), type, name
   - latitude, longitude, elevation_ft
   - continent, iso_country, iso_region
   - municipality, iata_code

2. Veri kaynağı:
   - OurAirports CSV: airports.csv
   - Ya assets/data/ altına koy
   - Ya da GitHub raw URL'den çek

3. Signals:
   - airports: signal<Airport[]>
   - filteredAirports: computed (filters'a göre)
   - loading: signal<boolean>
   - countries: computed (unique ülke listesi)

4. Metodlar:
   - loadAirports(): void (CSV parse)
   - filterByCountry(isoCode: string): void
   - filterByType(type: AirportType): void
   - searchByName(query: string): Airport[]
   - getAirportByCode(iata: string): Airport

5. PapaParse ile CSV parsing:
   - HttpClient ile CSV indir
   - Papa.parse ile parse et

Injectable providedIn: 'root'.
```

---

### Prompt 4.2: Airports Component

```
sections/geo/tools/airports/ oluştur:

1. airports.component.ts:
   - BaseMapComponent kullan
   - AirportService inject
   - MarkerClusterGroup kullan (40K+ marker)

2. UI - Filtre Paneli (sol veya üst):
   - Ülke dropdown (PrimeNG Dropdown)
   - Tip filtresi (large, medium, small, heliport) - MultiSelect
   - Arama input (isim, IATA, ICAO)

3. Harita:
   - MarkerCluster ile tüm havaalanları
   - Zoom'a göre cluster/marker görünümü
   - Marker icon: havaalanı tipi'ne göre farklı
   - Popup:
     - Havaalanı adı
     - IATA / ICAO kodu
     - Şehir, Ülke
     - Yükseklik
     - Tip

4. Performance:
   - Lazy loading: sadece viewport'taki marker'lar
   - chunkedLoading: true
   - Debounce filter changes

5. Sağ Panel (opsiyonel):
   - Filtrelenmiş havaalanı listesi
   - Click'te haritada göster ve zoom
```

---

## PHASE 5: DOKÜMANTASYON

### Prompt 5.1: Developer Docs

```
docs/map-components.md oluştur:

1. Mimari Overview
   - Component hierarchy diagram
   - Service relationships
   - Data flow

2. BaseMapComponent Kullanımı
   - Input/Output API
   - Örnek kullanım
   - Config options

3. Layer Sistemi
   - Base layers ekleme
   - Overlay layers ekleme
   - Custom tile providers

4. Plugin Entegrasyonu
   - Mevcut plugin'ler
   - Yeni plugin ekleme
   - Plugin options

5. Yeni Tool Ekleme Rehberi
   - Adım adım guide
   - Template component
   - ToolRegistry entegrasyonu

6. API Referansı
   - MapLayerService
   - MapPluginService
   - EarthquakeService
   - AirportService

7. Troubleshooting
   - Bilinen sorunlar
   - Icon fix
   - Performance tips
```

---

## ÇALIŞMA SIRASI

1. ✅ Phase 1.1 - Leaflet kurulumu (TAMAMLANDI)
2. ✅ Phase 1.2 - Reusable map components (TAMAMLANDI)
3. ✅ Phase 1.3 - Layer service (TAMAMLANDI)
4. ✅ Phase 1.4 - Plugin service (TAMAMLANDI)
5. ✅ Phase 2.1 - Geo section (TAMAMLANDI)
6. ✅ Phase 2.2 - Map tools component (TAMAMLANDI)
7. ✅ Phase 3.1 - Backend earthquake router (TAMAMLANDI)
8. ✅ Phase 3.2 - Backend cache service (TAMAMLANDI)
9. ✅ Phase 3.3 - Frontend earthquake service (TAMAMLANDI)
10. ✅ Phase 3.4 - Earthquake component (TAMAMLANDI)
11. ✅ Phase 4.1 - Airport service (TAMAMLANDI)
12. ✅ Phase 4.2 - Airports component (TAMAMLANDI)
13. ✅ Phase 5.1 - Documentation (TAMAMLANDI)

---

## NOTLAR

- Her prompt sonrası `ng build` ile test et
- Mobile responsive kontrol et
- Accessibility (a11y) göz önünde bulundur
- Error handling ekle
- Loading states göster
