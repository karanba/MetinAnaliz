import { Injectable, signal, computed, NgZone } from '@angular/core';
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet-control-geocoder';
import { MeasurementResult, DrawResult } from '../../components/map/map.models';

/** Plugin tipleri */
export type PluginType = 'draw' | 'measure' | 'geocoder';

/** Draw mode tipleri */
export type DrawMode = 'marker' | 'polyline' | 'polygon' | 'circle' | 'rectangle' | 'none';

/** Ölçüm birimi */
export type MeasureUnit = 'metric' | 'imperial';

/**
 * Map Plugin Service
 * Draw, measure ve geocoder plugin'lerini yönetir.
 */
@Injectable({
  providedIn: 'root'
})
export class MapPluginService {
  // Active plugins state
  private readonly _activePlugins = signal<Set<PluginType>>(new Set());
  private readonly _drawMode = signal<DrawMode>('none');
  private readonly _measurements = signal<MeasurementResult[]>([]);
  private readonly _drawnItems = signal<DrawResult[]>([]);

  // Plugin instances
  private geocoderControl: L.Control | null = null;
  private drawnItemsLayer: L.FeatureGroup | null = null;

  // Public readonly signals
  readonly activePlugins = this._activePlugins.asReadonly();
  readonly drawMode = this._drawMode.asReadonly();
  readonly measurements = this._measurements.asReadonly();
  readonly drawnItems = this._drawnItems.asReadonly();

  // Computed
  readonly isDrawActive = computed(() => this._activePlugins().has('draw'));
  readonly isMeasureActive = computed(() => this._activePlugins().has('measure'));
  readonly isGeocoderActive = computed(() => this._activePlugins().has('geocoder'));
  readonly totalMeasurements = computed(() => this._measurements().length);

  constructor(private ngZone: NgZone) {}

  /**
   * Plugin'in aktif olup olmadığını kontrol eder
   */
  isPluginActive(type: PluginType): boolean {
    return this._activePlugins().has(type);
  }

  // ============ DRAW PLUGIN (Geoman) ============

  /**
   * Draw plugin'i etkinleştirir
   */
  enableDraw(map: L.Map, options?: any): void {
    if (this.isPluginActive('draw')) return;

    // Initialize drawn items layer
    if (!this.drawnItemsLayer) {
      this.drawnItemsLayer = new L.FeatureGroup();
      map.addLayer(this.drawnItemsLayer);
    }

    // Add Geoman controls
    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawPolyline: true,
      drawPolygon: true,
      drawCircle: true,
      drawRectangle: true,
      drawCircleMarker: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
      ...options
    });

    // Setup event listeners
    this.setupDrawEvents(map);

    this._activePlugins.update(set => {
      const newSet = new Set(set);
      newSet.add('draw');
      return newSet;
    });
  }

  /**
   * Draw plugin'i devre dışı bırakır
   */
  disableDraw(map: L.Map): void {
    if (!this.isPluginActive('draw')) return;

    map.pm.removeControls();
    map.pm.disableDraw();

    this._activePlugins.update(set => {
      const newSet = new Set(set);
      newSet.delete('draw');
      return newSet;
    });

    this._drawMode.set('none');
  }

  /**
   * Draw event listener'larını kurar
   */
  private setupDrawEvents(map: L.Map): void {
    // Layer created event
    map.on('pm:create', (e: any) => {
      this.ngZone.run(() => {
        const layer = e.layer;
        const shape = e.shape;

        // Add to drawn items layer
        this.drawnItemsLayer?.addLayer(layer);

        // Get draw type (excluding 'none')
        const drawType = this.shapeToDrawResultType(shape);
        if (drawType) {
          // Create draw result
          const result: DrawResult = {
            type: drawType,
            layer,
            geoJSON: layer.toGeoJSON()
          };

          this._drawnItems.update(items => [...items, result]);
        }

        // Auto calculate measurement for polygons and polylines
        if (shape === 'Polygon' || shape === 'Rectangle') {
          const area = this.calculateArea(layer);
          this._measurements.update(m => [...m, area]);
          this.bindMeasurementTooltip(layer, area.formatted);
        } else if (shape === 'Line') {
          const distance = this.calculateDistance(layer);
          this._measurements.update(m => [...m, distance]);
          this.bindMeasurementTooltip(layer, distance.formatted);
        }
      });
    });

    // Draw mode change
    map.on('pm:drawstart', (e: any) => {
      this._drawMode.set(this.shapeToDrawType(e.shape));
    });

    map.on('pm:drawend', () => {
      this._drawMode.set('none');
    });
  }

  /**
   * Geoman shape'i draw type'a dönüştürür
   */
  private shapeToDrawType(shape: string): DrawMode {
    const mapping: Record<string, DrawMode> = {
      'Marker': 'marker',
      'Line': 'polyline',
      'Polygon': 'polygon',
      'Circle': 'circle',
      'Rectangle': 'rectangle'
    };
    return mapping[shape] || 'none';
  }

  /**
   * Geoman shape'i DrawResult type'a dönüştürür (none hariç)
   */
  private shapeToDrawResultType(shape: string): DrawResult['type'] | null {
    const mapping: Record<string, DrawResult['type']> = {
      'Marker': 'marker',
      'Line': 'polyline',
      'Polygon': 'polygon',
      'Circle': 'circle',
      'Rectangle': 'rectangle'
    };
    return mapping[shape] || null;
  }

  /**
   * Belirli bir draw modunu aktifleştirir
   */
  startDraw(map: L.Map, mode: DrawMode): void {
    if (mode === 'none') {
      map.pm.disableDraw();
      return;
    }

    const modeMapping: Record<DrawMode, string> = {
      'marker': 'Marker',
      'polyline': 'Line',
      'polygon': 'Polygon',
      'circle': 'Circle',
      'rectangle': 'Rectangle',
      'none': ''
    };

    map.pm.enableDraw(modeMapping[mode]);
    this._drawMode.set(mode);
  }

  /**
   * Draw modunu durdurur
   */
  stopDraw(map: L.Map): void {
    map.pm.disableDraw();
    this._drawMode.set('none');
  }

  /**
   * Tüm çizimleri temizler
   */
  clearDrawings(): void {
    this.drawnItemsLayer?.clearLayers();
    this._drawnItems.set([]);
    this._measurements.set([]);
  }

  // ============ MEASURE FUNCTIONS ============

  /**
   * Mesafe hesaplar (polyline için)
   */
  calculateDistance(layer: L.Polyline): MeasurementResult {
    const latlngs = layer.getLatLngs() as L.LatLng[];
    let totalDistance = 0;

    for (let i = 0; i < latlngs.length - 1; i++) {
      totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    return {
      type: 'distance',
      value: totalDistance,
      formatted: this.formatDistance(totalDistance),
      coordinates: latlngs
    };
  }

  /**
   * Alan hesaplar (polygon için)
   */
  calculateArea(layer: L.Polygon): MeasurementResult {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];

    // Shoelace formula ile alan hesaplama
    let area = 0;
    const n = latlngs.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // Convert to approximate meters
      const lat1 = latlngs[i].lat * Math.PI / 180;
      const lat2 = latlngs[j].lat * Math.PI / 180;
      const lng1 = latlngs[i].lng * Math.PI / 180;
      const lng2 = latlngs[j].lng * Math.PI / 180;

      area += lng1 * Math.sin(lat2) - lng2 * Math.sin(lat1);
    }

    // Earth radius squared
    const earthRadius = 6371000; // meters
    area = Math.abs(area * earthRadius * earthRadius / 2);

    return {
      type: 'area',
      value: area,
      formatted: this.formatArea(area),
      coordinates: latlngs
    };
  }

  /**
   * Mesafeyi formatlar
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(1)} m`;
  }

  /**
   * Alanı formatlar
   */
  formatArea(sqMeters: number): string {
    if (sqMeters >= 1000000) {
      return `${(sqMeters / 1000000).toFixed(2)} km²`;
    }
    if (sqMeters >= 10000) {
      return `${(sqMeters / 10000).toFixed(2)} ha`;
    }
    return `${sqMeters.toFixed(1)} m²`;
  }

  private bindMeasurementTooltip(layer: L.Layer, text: string): void {
    if (!text) return;
    const anyLayer = layer as any;
    if (anyLayer.bindTooltip) {
      anyLayer.bindTooltip(text, {
        permanent: true,
        direction: 'center',
        className: 'measure-tooltip',
        opacity: 0.95
      });
    }
  }

  // ============ GEOCODER PLUGIN ============

  /**
   * Geocoder plugin'i etkinleştirir
   */
  enableGeocoder(map: L.Map, options?: any): void {
    if (this.isPluginActive('geocoder')) return;

    // @ts-ignore - leaflet-control-geocoder types
    this.geocoderControl = (L.Control as any).geocoder({
      defaultMarkGeocode: true,
      position: 'topright',
      placeholder: 'Adres ara...',
      errorMessage: 'Sonuç bulunamadı',
      ...options
    });

    if (this.geocoderControl) {
      this.geocoderControl.addTo(map);
    }

    this._activePlugins.update(set => {
      const newSet = new Set(set);
      newSet.add('geocoder');
      return newSet;
    });
  }

  /**
   * Geocoder plugin'i devre dışı bırakır
   */
  disableGeocoder(map: L.Map): void {
    if (!this.isPluginActive('geocoder')) return;

    if (this.geocoderControl) {
      map.removeControl(this.geocoderControl);
      this.geocoderControl = null;
    }

    this._activePlugins.update(set => {
      const newSet = new Set(set);
      newSet.delete('geocoder');
      return newSet;
    });
  }

  /**
   * Adres arar (programmatic)
   */
  async searchAddress(query: string): Promise<any[]> {
    return new Promise((resolve) => {
      // @ts-ignore
      const geocoder = (L.Control as any).Geocoder.nominatim();
      geocoder.geocode(query, (results: any[]) => {
        resolve(results);
      });
    });
  }

  // ============ GENERAL METHODS ============

  /**
   * Tüm plugin'leri devre dışı bırakır
   */
  disableAll(map: L.Map): void {
    if (this.isPluginActive('draw')) this.disableDraw(map);
    if (this.isPluginActive('geocoder')) this.disableGeocoder(map);
  }

  /**
   * State'i sıfırlar
   */
  reset(): void {
    this._activePlugins.set(new Set());
    this._drawMode.set('none');
    this._measurements.set([]);
    this._drawnItems.set([]);
    this.drawnItemsLayer?.clearLayers();
  }

  /**
   * Çizimleri GeoJSON olarak export eder
   */
  exportToGeoJSON(): GeoJSON.FeatureCollection {
    const features = this._drawnItems().map(item => item.geoJSON);
    return {
      type: 'FeatureCollection',
      features
    };
  }
}
