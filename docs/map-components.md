# Map Components - Developer Documentation

Bu dokümantasyon, MetinAnaliz projesindeki harita bileşenlerinin kullanımını ve genişletilmesini açıklar.

---

## 1. Mimari Overview

### Component Hierarchy

```
GeoComponent (Hub)
├── MapToolsComponent
│   └── BaseMapComponent
├── EarthquakeComponent
│   └── BaseMapComponent
└── AirportsComponent
    └── BaseMapComponent
```

### Service Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    Components                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │  MapTools    │ │  Earthquake  │ │   Airports   │     │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘     │
└─────────┼────────────────┼────────────────┼─────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                     Services                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ MapLayer     │ │ Earthquake   │ │   Airport    │     │
│  │ Service      │ │ Service      │ │   Service    │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│  ┌──────────────┐                                        │
│  │ MapPlugin    │                                        │
│  │ Service      │                                        │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Component Signal → Service Method → API/Data
                                       ↓
UI Update ← Component Computed ← Service Signal
```

---

## 2. BaseMapComponent Kullanımı

### Import

```typescript
import { BaseMapComponent } from '../../../../components/map';
```

### Input/Output API

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `config` | `MapConfig` | Default config | Harita konfigürasyonu |
| `mapReady` | `EventEmitter<L.Map>` | - | Harita hazır olduğunda emit eder |
| `mapClick` | `EventEmitter<L.LatLng>` | - | Haritaya tıklandığında emit eder |

### MapConfig Interface

```typescript
interface MapConfig {
  center: [number, number];  // [lat, lng]
  zoom: number;              // Default: 6
  minZoom?: number;          // Default: 2
  maxZoom?: number;          // Default: 18
}
```

### Örnek Kullanım

```typescript
@Component({
  selector: 'app-my-map-tool',
  standalone: true,
  imports: [BaseMapComponent],
  template: `
    <app-base-map
      [config]="mapConfig"
      (mapReady)="onMapReady($event)"
      (mapClick)="onMapClick($event)">
    </app-base-map>
  `
})
export class MyMapToolComponent {
  mapConfig: MapConfig = {
    center: [39.925533, 32.866287],  // Ankara
    zoom: 6
  };

  private map: L.Map | null = null;

  onMapReady(map: L.Map): void {
    this.map = map;
    // Harita üzerinde işlemler yapabilirsiniz
  }

  onMapClick(latlng: L.LatLng): void {
    console.log('Clicked:', latlng.lat, latlng.lng);
  }
}
```

---

## 3. Layer Sistemi

### MapLayerService

```typescript
import { MapLayerService, BaseLayerName } from '../../../../services/map/map-layer.service';
```

### Mevcut Base Layers

| Name | Description | Source |
|------|-------------|--------|
| `osm` | OpenStreetMap standart harita | OpenStreetMap |
| `satellite` | Uydu görüntüsü | Esri World Imagery |
| `terrain` | Arazi/topoğrafik harita | OpenTopoMap |

### Base Layer Değiştirme

```typescript
@Component({...})
export class MyComponent {
  private mapLayerService = inject(MapLayerService);
  private map: L.Map | null = null;

  onMapReady(map: L.Map): void {
    this.map = map;
    // İlk layer'ı uygula
    this.mapLayerService.applyBaseLayer(map, 'osm');
  }

  changeToSatellite(): void {
    if (this.map) {
      this.mapLayerService.applyBaseLayer(this.map, 'satellite');
    }
  }
}
```

### UI ile Layer Seçimi (PrimeNG SelectButton)

```typescript
// Component
layerOptions = [
  { label: 'Harita', value: 'osm' },
  { label: 'Uydu', value: 'satellite' },
  { label: 'Arazi', value: 'terrain' }
];
selectedLayer = signal<BaseLayerName>('osm');

onLayerChange(layer: BaseLayerName): void {
  if (this.map && layer) {
    this.selectedLayer.set(layer);
    this.mapLayerService.applyBaseLayer(this.map, layer);
  }
}
```

```html
<!-- Template -->
<p-selectbutton
  [options]="layerOptions"
  [ngModel]="selectedLayer()"
  (ngModelChange)="onLayerChange($event)"
  optionLabel="label"
  optionValue="value">
</p-selectbutton>
```

### Custom Tile Provider Ekleme

`map-layer.service.ts` dosyasındaki `baseLayers` Map'ine yeni provider ekleyebilirsiniz:

```typescript
private baseLayers: Map<BaseLayerName, L.TileLayer> = new Map([
  // Mevcut layer'lar...
  ['custom', L.tileLayer('https://your-tile-server/{z}/{x}/{y}.png', {
    attribution: 'Your Attribution',
    maxZoom: 19
  })]
]);
```

---

## 4. Plugin Entegrasyonu

### MapPluginService

```typescript
import { MapPluginService, DrawResult } from '../../../../services/map/map-plugin.service';
```

### Mevcut Plugin'ler

| Plugin | Description | Leaflet Library |
|--------|-------------|-----------------|
| `draw` | Şekil çizimi (marker, polyline, polygon, circle, rectangle) | leaflet-geoman |
| `measure` | Mesafe ve alan ölçümü | leaflet-geoman |
| `geocoder` | Adres arama | leaflet-control-geocoder |
| `coordinates` | Mouse koordinat gösterimi | Custom |

### Draw Plugin Kullanımı

```typescript
@Component({...})
export class MyComponent {
  private mapPluginService = inject(MapPluginService);

  onMapReady(map: L.Map): void {
    // Draw plugin'i başlat
    this.mapPluginService.setupDrawPlugin(map, {
      onDrawComplete: (result: DrawResult) => {
        console.log('Çizim tamamlandı:', result);
        // result.type: 'marker' | 'polyline' | 'polygon' | 'circle' | 'rectangle'
        // result.layer: L.Layer
        // result.geoJSON: GeoJSON.Feature
      }
    });
  }

  // Çizim modunu başlat
  startDrawing(type: 'Marker' | 'Line' | 'Polygon' | 'Circle' | 'Rectangle'): void {
    this.mapPluginService.enableDrawMode(type);
  }

  // Çizim modunu durdur
  stopDrawing(): void {
    this.mapPluginService.disableDrawMode();
  }
}
```

### Geocoder Plugin Kullanımı

```typescript
onMapReady(map: L.Map): void {
  this.mapPluginService.setupGeocoderPlugin(map, {
    position: 'topright',
    onResult: (result) => {
      console.log('Bulunan konum:', result);
    }
  });
}
```

### Coordinates Plugin Kullanımı

```typescript
// Signals
mouseCoordinates = this.mapPluginService.mouseCoordinates;

onMapReady(map: L.Map): void {
  this.mapPluginService.setupCoordinatesPlugin(map);
}
```

```html
<!-- Template -->
<div class="coordinates">
  {{ mouseCoordinates().lat.toFixed(6) }}, {{ mouseCoordinates().lng.toFixed(6) }}
</div>
```

### Yeni Plugin Ekleme

`map-plugin.service.ts` dosyasına yeni bir setup metodu ekleyin:

```typescript
setupMyCustomPlugin(map: L.Map, options?: MyPluginOptions): void {
  // Plugin kurulumu
  const plugin = new MyLeafletPlugin(options);
  plugin.addTo(map);

  // State güncelle
  this.activePlugins.update(set => {
    set.add('myCustomPlugin');
    return new Set(set);
  });
}
```

---

## 5. Yeni Tool Ekleme Rehberi

### Adım 1: Tool Registry'ye Ekle

`services/tool-registry.service.ts`:

```typescript
{
  id: 'my-new-tool',
  name: 'Yeni Tool Adı',
  description: 'Tool açıklaması',
  icon: 'pi-map',  // PrimeIcons
  route: '/tools/geo/my-new-tool'
}
```

### Adım 2: Component Oluştur

```
sections/geo/tools/my-new-tool/
├── my-new-tool.component.ts
├── my-new-tool.component.html
└── my-new-tool.component.scss
```

### Template Component

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  ViewChild,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../components/shared';
import { BaseMapComponent } from '../../../../components/map';
import { MapLayerService, BaseLayerName } from '../../../../services/map/map-layer.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-my-new-tool',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    BaseMapComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-new-tool.component.html',
  styleUrls: ['./my-new-tool.component.scss']
})
export class MyNewToolComponent implements OnDestroy {
  @ViewChild(BaseMapComponent) baseMap!: BaseMapComponent;

  private mapLayerService = inject(MapLayerService);
  private map: L.Map | null = null;

  // State signals
  selectedLayer = signal<BaseLayerName>('osm');
  loading = signal<boolean>(false);

  ngOnDestroy(): void {
    // Cleanup
  }

  onMapReady(map: L.Map): void {
    this.map = map;
    this.mapLayerService.applyBaseLayer(map, this.selectedLayer());

    // Custom initialization
  }

  onLayerChange(layer: BaseLayerName): void {
    if (this.map && layer) {
      this.selectedLayer.set(layer);
      this.mapLayerService.applyBaseLayer(this.map, layer);
    }
  }
}
```

### Template HTML

```html
<div class="my-tool-page">
  <app-page-header
    title="Yeni Tool"
    [breadcrumb]="['Araçlar', 'Harita Araçları', 'Yeni Tool']">
  </app-page-header>

  <div class="my-tool-container">
    <div class="toolbar">
      <!-- Toolbar içeriği -->
    </div>

    <div class="map-area">
      <app-base-map (mapReady)="onMapReady($event)"></app-base-map>
    </div>
  </div>
</div>
```

### Adım 3: Route Ekle

`app.routes.ts`:

```typescript
import { MyNewToolComponent } from './sections/geo/tools/my-new-tool/my-new-tool.component';

export const routes: Routes = [
  // ... diğer route'lar
  { path: 'tools/geo/my-new-tool', component: MyNewToolComponent },
];
```

---

## 6. API Referansı

### MapLayerService

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getBaseLayer` | `name: BaseLayerName` | `L.TileLayer \| undefined` | Base layer instance döner |
| `applyBaseLayer` | `map: L.Map, name: BaseLayerName` | `void` | Haritaya base layer uygular |

**Types:**
```typescript
type BaseLayerName = 'osm' | 'satellite' | 'terrain';
```

### MapPluginService

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setupDrawPlugin` | `map: L.Map, options?: DrawPluginOptions` | `void` | Çizim plugin'ini başlatır |
| `setupGeocoderPlugin` | `map: L.Map, options?: GeocoderOptions` | `void` | Geocoder plugin'ini başlatır |
| `setupCoordinatesPlugin` | `map: L.Map` | `void` | Koordinat takibi başlatır |
| `enableDrawMode` | `shape: DrawShape` | `void` | Çizim modunu aktif eder |
| `disableDrawMode` | - | `void` | Çizim modunu devre dışı bırakır |
| `clearDrawnItems` | - | `void` | Tüm çizilenleri temizler |
| `exportToGeoJSON` | - | `GeoJSON.FeatureCollection` | Çizimleri GeoJSON olarak export eder |

**Signals:**
```typescript
drawnItems: Signal<DrawResult[]>      // Çizilen şekillerin listesi
measureResult: Signal<MeasureResult>  // Ölçüm sonucu
mouseCoordinates: Signal<{lat, lng}>  // Mouse koordinatları
```

### EarthquakeService

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `fetchEarthquakes` | `params: EarthquakeParams` | `void` | Deprem verilerini çeker |
| `startAutoRefresh` | `intervalMs: number` | `void` | Otomatik yenilemeyi başlatır |
| `stopAutoRefresh` | - | `void` | Otomatik yenilemeyi durdurur |
| `getMagnitudeColor` | `magnitude: number` | `string` | Magnitude'a göre renk döner |
| `getMagnitudeRadius` | `magnitude: number` | `number` | Magnitude'a göre radius döner |

**Signals:**
```typescript
earthquakes: Signal<EarthquakeFeature[]>  // Deprem listesi
loading: Signal<boolean>                   // Yükleniyor durumu
error: Signal<string | null>               // Hata mesajı
lastUpdated: Signal<Date | null>           // Son güncelleme zamanı
```

### AirportService

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loadAirports` | - | `void` | Havaalanı verilerini yükler |
| `filterByCountry` | `country: string \| null` | `void` | Ülkeye göre filtreler |
| `filterByTypes` | `types: AirportType[]` | `void` | Tipe göre filtreler |
| `setSearchQuery` | `query: string` | `void` | Arama sorgusu ayarlar |
| `resetFilters` | - | `void` | Tüm filtreleri sıfırlar |
| `getTypeColor` | `type: AirportType` | `string` | Tipe göre renk döner |
| `getMarkerRadius` | `type: AirportType` | `number` | Tipe göre marker boyutu döner |

**Signals:**
```typescript
airports: Signal<Airport[]>           // Tüm havaalanları
filteredAirports: Signal<Airport[]>   // Filtrelenmiş havaalanları
loading: Signal<boolean>              // Yükleniyor durumu
error: Signal<string | null>          // Hata mesajı
countries: Signal<CountryOption[]>    // Ülke listesi
totalCount: Signal<number>            // Toplam sayı
filteredCount: Signal<number>         // Filtrelenmiş sayı
```

---

## 7. Troubleshooting

### Bilinen Sorunlar ve Çözümleri

#### 1. Leaflet Marker Icon Sorunu

**Problem:** Marker'lar görünmüyor veya broken image gösteriyor.

**Çözüm:** `angular.json`'da icon yollarını kontrol edin:

```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  {
    "glob": "**/*",
    "input": "node_modules/leaflet/dist/images",
    "output": "/assets/leaflet"
  }
]
```

Ve default icon'u ayarlayın:

```typescript
import * as L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png'
});
```

#### 2. MarkerCluster CSS Eksik

**Problem:** Cluster'lar düzgün görünmüyor.

**Çözüm:** `angular.json`'a CSS ekleyin:

```json
"styles": [
  "node_modules/leaflet/dist/leaflet.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css"
]
```

#### 3. Proxy 404 Hatası

**Problem:** Backend API çağrıları 404 dönüyor.

**Çözüm:** `proxy.conf.json` dosyasını kontrol edin:

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

**Önemli:** `pathRewrite` kullanmayın, backend zaten `/api` prefix'i bekliyor.

#### 4. CORS Hatası

**Problem:** Backend'den CORS hatası alıyorsunuz.

**Çözüm:** Backend `main.py`'da CORS ayarlarını kontrol edin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Performance Tips

#### Çok Sayıda Marker için

1. **MarkerClusterGroup kullanın:**
```typescript
import 'leaflet.markercluster';

const cluster = L.markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 50,
  disableClusteringAtZoom: 12
});
```

2. **CircleMarker kullanın (Marker yerine):**
```typescript
// Daha performanslı
L.circleMarker([lat, lng], { radius: 8 });

// Daha yavaş
L.marker([lat, lng]);
```

3. **Marker sayısını sınırlayın:**
```typescript
const maxMarkers = 5000;
const markersToShow = airports.slice(0, maxMarkers);
```

#### Memory Yönetimi

1. **ngOnDestroy'da temizlik yapın:**
```typescript
ngOnDestroy(): void {
  if (this.markerCluster) {
    this.markerCluster.clearLayers();
  }
  if (this.map) {
    this.map.remove();
  }
}
```

2. **Auto-refresh'i durdurun:**
```typescript
ngOnDestroy(): void {
  this.earthquakeService.stopAutoRefresh();
}
```

---

## Ek Kaynaklar

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Leaflet-Geoman](https://geoman.io/docs)
- [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- [PrimeNG Components](https://primeng.org/components)
- [Angular Signals](https://angular.dev/guide/signals)
