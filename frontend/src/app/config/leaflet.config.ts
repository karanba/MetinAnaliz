/**
 * Leaflet Configuration
 * Webpack ile Leaflet marker icon path sorununu çözer
 */
import * as L from 'leaflet';

export function initLeafletIcons(): void {
  // Webpack bundling sırasında Leaflet icon path'leri bozuluyor
  // Bu fix, icon'ları doğru path'e yönlendirir
  const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
  const iconUrl = 'assets/leaflet/marker-icon.png';
  const shadowUrl = 'assets/leaflet/marker-shadow.png';

  L.Marker.prototype.options.icon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });
}

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  center: [39.9334, 32.8597] as [number, number], // Ankara, Türkiye
  zoom: 6,
  minZoom: 2,
  maxZoom: 18
};

// Tile layer providers
export const TILE_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 18
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17
  }
};
