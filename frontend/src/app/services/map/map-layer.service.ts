import { Injectable, signal, computed } from '@angular/core';
import * as L from 'leaflet';
import { TILE_LAYERS } from '../../config/leaflet.config';

/** Base layer isimleri */
export type BaseLayerName = 'osm' | 'satellite' | 'terrain';

/** Layer bilgisi */
export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  layer: L.Layer;
}

/**
 * Map Layer Service
 * Base ve overlay layer'ları yönetir.
 * Global service - tüm harita component'leri tarafından paylaşılabilir.
 */
@Injectable({
  providedIn: 'root'
})
export class MapLayerService {
  // Base layers
  private readonly _baseLayers = signal<Map<BaseLayerName, L.TileLayer>>(new Map());
  private readonly _activeBaseLayer = signal<BaseLayerName>('osm');

  // Overlay layers
  private readonly _overlays = signal<Map<string, L.LayerGroup>>(new Map());
  private readonly _visibleOverlays = signal<Set<string>>(new Set());

  // Public readonly signals
  readonly baseLayers = this._baseLayers.asReadonly();
  readonly activeBaseLayer = this._activeBaseLayer.asReadonly();
  readonly overlays = this._overlays.asReadonly();
  readonly visibleOverlays = this._visibleOverlays.asReadonly();

  // Computed
  readonly baseLayerNames = computed(() => Array.from(this._baseLayers().keys()));
  readonly overlayNames = computed(() => Array.from(this._overlays().keys()));
  readonly visibleOverlayCount = computed(() => this._visibleOverlays().size);

  constructor() {
    this.initializeBaseLayers();
  }

  /**
   * Base layer'ları başlatır
   */
  private initializeBaseLayers(): void {
    const layers = new Map<BaseLayerName, L.TileLayer>();

    // OSM
    layers.set('osm', L.tileLayer(TILE_LAYERS.osm.url, {
      attribution: TILE_LAYERS.osm.attribution,
      maxZoom: TILE_LAYERS.osm.maxZoom
    }));

    // Satellite
    layers.set('satellite', L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
      maxZoom: TILE_LAYERS.satellite.maxZoom
    }));

    // Terrain
    layers.set('terrain', L.tileLayer(TILE_LAYERS.terrain.url, {
      attribution: TILE_LAYERS.terrain.attribution,
      maxZoom: TILE_LAYERS.terrain.maxZoom
    }));

    this._baseLayers.set(layers);
  }

  /**
   * Base layer'ı haritaya uygular
   */
  applyBaseLayer(map: L.Map, layerName: BaseLayerName): void {
    const layers = this._baseLayers();
    const currentActive = this._activeBaseLayer();

    // Mevcut layer'ı kaldır
    const currentLayer = layers.get(currentActive);
    if (currentLayer && map.hasLayer(currentLayer)) {
      map.removeLayer(currentLayer);
    }

    // Yeni layer'ı ekle
    const newLayer = layers.get(layerName);
    if (newLayer) {
      newLayer.addTo(map);
      this._activeBaseLayer.set(layerName);
    }
  }

  /**
   * Base layer'ı değiştirir (aktif harita olmadan)
   */
  setActiveBaseLayer(layerName: BaseLayerName): void {
    this._activeBaseLayer.set(layerName);
  }

  /**
   * Belirli bir base layer'ı döndürür
   */
  getBaseLayer(name: BaseLayerName): L.TileLayer | undefined {
    return this._baseLayers().get(name);
  }

  /**
   * Aktif base layer'ı döndürür
   */
  getActiveBaseLayer(): L.TileLayer | undefined {
    return this._baseLayers().get(this._activeBaseLayer());
  }

  // ============ OVERLAY METHODS ============

  /**
   * Overlay layer ekler
   */
  addOverlay(id: string, layer: L.LayerGroup, visible = false): void {
    this._overlays.update(overlays => {
      const newOverlays = new Map(overlays);
      newOverlays.set(id, layer);
      return newOverlays;
    });

    if (visible) {
      this._visibleOverlays.update(set => {
        const newSet = new Set(set);
        newSet.add(id);
        return newSet;
      });
    }
  }

  /**
   * Overlay layer'ı kaldırır
   */
  removeOverlay(id: string): void {
    this._overlays.update(overlays => {
      const newOverlays = new Map(overlays);
      newOverlays.delete(id);
      return newOverlays;
    });

    this._visibleOverlays.update(set => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
  }

  /**
   * Overlay görünürlüğünü toggle eder
   */
  toggleOverlay(id: string, map?: L.Map): void {
    const isVisible = this._visibleOverlays().has(id);
    const layer = this._overlays().get(id);

    if (isVisible) {
      // Gizle
      this._visibleOverlays.update(set => {
        const newSet = new Set(set);
        newSet.delete(id);
        return newSet;
      });

      if (map && layer) {
        map.removeLayer(layer);
      }
    } else {
      // Göster
      this._visibleOverlays.update(set => {
        const newSet = new Set(set);
        newSet.add(id);
        return newSet;
      });

      if (map && layer) {
        layer.addTo(map);
      }
    }
  }

  /**
   * Overlay görünür mü kontrol eder
   */
  isOverlayVisible(id: string): boolean {
    return this._visibleOverlays().has(id);
  }

  /**
   * Overlay'ı döndürür
   */
  getOverlay(id: string): L.LayerGroup | undefined {
    return this._overlays().get(id);
  }

  /**
   * Tüm görünür overlay'ları haritaya ekler
   */
  applyVisibleOverlays(map: L.Map): void {
    const overlays = this._overlays();
    const visible = this._visibleOverlays();

    visible.forEach(id => {
      const layer = overlays.get(id);
      if (layer && !map.hasLayer(layer)) {
        layer.addTo(map);
      }
    });
  }

  /**
   * Tüm overlay'ları haritadan kaldırır
   */
  removeAllOverlays(map: L.Map): void {
    const overlays = this._overlays();
    overlays.forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
  }

  /**
   * Layer bilgilerini döndürür (UI için)
   */
  getLayerInfo(): { baseLayers: LayerInfo[]; overlays: LayerInfo[] } {
    const baseLayerInfo: LayerInfo[] = [
      { id: 'osm', name: 'OpenStreetMap', visible: this._activeBaseLayer() === 'osm', layer: this._baseLayers().get('osm')! },
      { id: 'satellite', name: 'Uydu', visible: this._activeBaseLayer() === 'satellite', layer: this._baseLayers().get('satellite')! },
      { id: 'terrain', name: 'Arazi', visible: this._activeBaseLayer() === 'terrain', layer: this._baseLayers().get('terrain')! }
    ];

    const overlayInfo: LayerInfo[] = [];
    this._overlays().forEach((layer, id) => {
      overlayInfo.push({
        id,
        name: id,
        visible: this._visibleOverlays().has(id),
        layer
      });
    });

    return { baseLayers: baseLayerInfo, overlays: overlayInfo };
  }

  /**
   * Tüm state'i sıfırlar
   */
  reset(): void {
    this._activeBaseLayer.set('osm');
    this._overlays.set(new Map());
    this._visibleOverlays.set(new Set());
  }
}
