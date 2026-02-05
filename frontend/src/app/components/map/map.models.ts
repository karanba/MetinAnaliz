/**
 * Map Component Type Definitions
 * Harita bileşenleri için type-safe interface'ler
 */
import * as L from 'leaflet';

/** Harita yapılandırması */
export interface MapConfig {
  /** Başlangıç merkez koordinatları [lat, lng] */
  center: [number, number];
  /** Başlangıç zoom seviyesi */
  zoom: number;
  /** Minimum zoom seviyesi */
  minZoom?: number;
  /** Maximum zoom seviyesi */
  maxZoom?: number;
  /** Zoom kontrolü göster */
  zoomControl?: boolean;
  /** Attribution kontrolü göster */
  attributionControl?: boolean;
}

/** Tile layer yapılandırması */
export interface TileLayerConfig {
  /** Layer ismi */
  name: string;
  /** Tile URL template */
  url: string;
  /** Attribution metni */
  attribution: string;
  /** Maximum zoom */
  maxZoom?: number;
  /** Subdomains (varsa) */
  subdomains?: string[];
}

/** Harita state'i */
export interface MapState {
  /** Harita başlatıldı mı */
  initialized: boolean;
  /** Mevcut merkez koordinatları */
  center: [number, number];
  /** Mevcut zoom seviyesi */
  zoom: number;
  /** Görünür alan sınırları */
  bounds: L.LatLngBounds | null;
  /** Yükleniyor durumu */
  loading: boolean;
}

/** Layer tipi */
export type LayerType = 'base' | 'overlay';

/** Layer yapılandırması */
export interface LayerConfig {
  /** Benzersiz ID */
  id: string;
  /** Görüntülenecek isim */
  name: string;
  /** Layer tipi */
  type: LayerType;
  /** Leaflet layer instance */
  layer: L.Layer;
  /** Varsayılan olarak görünür mü */
  visible?: boolean;
  /** Sıralama önceliği */
  order?: number;
}

/** Marker yapılandırması */
export interface MarkerConfig {
  /** Koordinatlar */
  position: L.LatLngExpression;
  /** Popup içeriği (opsiyonel) */
  popupContent?: string;
  /** Tooltip içeriği (opsiyonel) */
  tooltipContent?: string;
  /** Özel icon (opsiyonel) */
  icon?: L.Icon;
  /** Ek veri (opsiyonel) */
  data?: unknown;
}

/** Harita event'leri */
export interface MapEvents {
  /** Harita tıklandığında */
  click?: (latlng: L.LatLng, event: L.LeafletMouseEvent) => void;
  /** Zoom değiştiğinde */
  zoomChange?: (zoom: number) => void;
  /** Merkez değiştiğinde */
  moveEnd?: (center: L.LatLng, bounds: L.LatLngBounds) => void;
  /** Mouse hareket ettiğinde */
  mouseMove?: (latlng: L.LatLng) => void;
}

/** Ölçüm sonucu */
export interface MeasurementResult {
  /** Ölçüm tipi */
  type: 'distance' | 'area';
  /** Değer (metre veya metrekare) */
  value: number;
  /** Formatlanmış değer */
  formatted: string;
  /** Koordinatlar */
  coordinates: L.LatLng[];
}

/** Çizim sonucu */
export interface DrawResult {
  /** Çizim tipi */
  type: 'marker' | 'polyline' | 'polygon' | 'circle' | 'rectangle';
  /** Leaflet layer */
  layer: L.Layer;
  /** GeoJSON formatı */
  geoJSON: GeoJSON.Feature;
}

/** Default değerler */
export const DEFAULT_MAP_STATE: MapState = {
  initialized: false,
  center: [39.9334, 32.8597], // Ankara
  zoom: 6,
  bounds: null,
  loading: false
};

export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: [39.9334, 32.8597],
  zoom: 6,
  minZoom: 2,
  maxZoom: 18,
  zoomControl: true,
  attributionControl: true
};
