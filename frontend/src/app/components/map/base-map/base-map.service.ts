import { Injectable, signal, computed, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { MapConfig, MapState, DEFAULT_MAP_STATE, MarkerConfig } from '../map.models';
import { TILE_LAYERS } from '../../../config/leaflet.config';

/**
 * Base Map Service
 * Tek bir harita instance'ını yönetir.
 * Her BaseMapComponent kendi service instance'ına sahip olur (providedIn component).
 */
@Injectable()
export class BaseMapService {
  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup = L.layerGroup();
  private currentBaseLayer: L.TileLayer | null = null;

  // State management with Signals
  private readonly _state = signal<MapState>({ ...DEFAULT_MAP_STATE });

  // Public readonly signals
  readonly state = this._state.asReadonly();
  readonly isInitialized = computed(() => this._state().initialized);
  readonly currentCenter = computed(() => this._state().center);
  readonly currentZoom = computed(() => this._state().zoom);
  readonly bounds = computed(() => this._state().bounds);
  readonly isLoading = computed(() => this._state().loading);

  // Mouse position signal (updated frequently)
  private readonly _mousePosition = signal<L.LatLng | null>(null);
  readonly mousePosition = this._mousePosition.asReadonly();

  constructor(private ngZone: NgZone) {}

  /**
   * Haritayı başlatır
   */
  initializeMap(container: HTMLElement, config: MapConfig): L.Map {
    if (this.map) {
      console.warn('Map already initialized');
      return this.map;
    }

    this._state.update(s => ({ ...s, loading: true }));

    // Create map instance
    this.map = L.map(container, {
      center: config.center,
      zoom: config.zoom,
      minZoom: config.minZoom ?? 2,
      maxZoom: config.maxZoom ?? 18,
      zoomControl: config.zoomControl ?? true,
      attributionControl: config.attributionControl ?? true
    });

    // Add default base layer (OSM)
    this.setBaseLayer('osm');

    // Add markers layer
    this.markersLayer.addTo(this.map);

    // Setup event listeners
    this.setupEventListeners();

    // Update state
    this._state.update(s => ({
      ...s,
      initialized: true,
      center: config.center,
      zoom: config.zoom,
      loading: false
    }));

    return this.map;
  }

  /**
   * Event listener'ları kurar
   */
  private setupEventListeners(): void {
    if (!this.map) return;

    // Move end event
    this.map.on('moveend', () => {
      this.ngZone.run(() => {
        const center = this.map?.getCenter();
        const zoom = this.map?.getZoom();
        const bounds = this.map?.getBounds();

        if (center && zoom !== undefined) {
          this._state.update(s => ({
            ...s,
            center: [center.lat, center.lng],
            zoom,
            bounds: bounds ?? null
          }));
        }
      });
    });

    // Mouse move event (run outside Angular for performance)
    this.ngZone.runOutsideAngular(() => {
      this.map?.on('mousemove', (e: L.LeafletMouseEvent) => {
        this._mousePosition.set(e.latlng);
      });

      this.map?.on('mouseout', () => {
        this._mousePosition.set(null);
      });
    });
  }

  /**
   * Base layer değiştirir
   */
  setBaseLayer(layerKey: 'osm' | 'satellite' | 'terrain'): void {
    if (!this.map) return;

    const layerConfig = TILE_LAYERS[layerKey];
    if (!layerConfig) {
      console.warn(`Unknown layer: ${layerKey}`);
      return;
    }

    // Remove current base layer
    if (this.currentBaseLayer) {
      this.map.removeLayer(this.currentBaseLayer);
    }

    // Add new base layer
    this.currentBaseLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom
    });

    this.currentBaseLayer.addTo(this.map);
  }

  /**
   * Marker ekler
   */
  addMarker(config: MarkerConfig): L.Marker {
    const marker = L.marker(config.position, {
      icon: config.icon
    });

    if (config.popupContent) {
      marker.bindPopup(config.popupContent);
    }

    if (config.tooltipContent) {
      marker.bindTooltip(config.tooltipContent);
    }

    if (config.data) {
      (marker as any)._customData = config.data;
    }

    marker.addTo(this.markersLayer);
    return marker;
  }

  /**
   * Tüm marker'ları temizler
   */
  clearMarkers(): void {
    this.markersLayer.clearLayers();
  }

  /**
   * Belirli koordinatlara pan yapar
   */
  panTo(latlng: L.LatLngExpression, options?: L.PanOptions): void {
    this.map?.panTo(latlng, options);
  }

  /**
   * Belirli koordinatlara zoom yapar
   */
  setView(center: L.LatLngExpression, zoom: number, options?: L.ZoomPanOptions): void {
    this.map?.setView(center, zoom, options);
  }

  /**
   * Bounds'a fit yapar
   */
  fitBounds(bounds: L.LatLngBoundsExpression, options?: L.FitBoundsOptions): void {
    this.map?.fitBounds(bounds, options);
  }

  /**
   * Zoom seviyesini ayarlar
   */
  setZoom(zoom: number, options?: L.ZoomOptions): void {
    this.map?.setZoom(zoom, options);
  }

  /**
   * Map instance'ını döndürür
   */
  getMap(): L.Map | null {
    return this.map;
  }

  /**
   * Map instance'ını döndürür (hata fırlatır eğer null ise)
   */
  getMapOrThrow(): L.Map {
    if (!this.map) {
      throw new Error('Map not initialized. Call initializeMap first.');
    }
    return this.map;
  }

  /**
   * Layer ekler
   */
  addLayer(layer: L.Layer): void {
    layer.addTo(this.getMapOrThrow());
  }

  /**
   * Layer kaldırır
   */
  removeLayer(layer: L.Layer): void {
    this.map?.removeLayer(layer);
  }

  /**
   * Haritayı yok eder ve temizler
   */
  destroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }

    this.markersLayer.clearLayers();
    this.currentBaseLayer = null;

    this._state.set({ ...DEFAULT_MAP_STATE });
    this._mousePosition.set(null);
  }

  /**
   * Event listener ekler
   */
  on(event: string, handler: L.LeafletEventHandlerFn): void {
    this.map?.on(event, handler);
  }

  /**
   * Event listener kaldırır
   */
  off(event: string, handler?: L.LeafletEventHandlerFn): void {
    this.map?.off(event, handler);
  }
}
