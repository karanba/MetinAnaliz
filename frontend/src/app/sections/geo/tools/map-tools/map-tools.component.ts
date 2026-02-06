import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  ViewChild,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../components/shared';
import { BaseMapComponent } from '../../../../components/map';
import { MapLayerService, BaseLayerName } from '../../../../services/map/map-layer.service';
import { MapPluginService, DrawMode } from '../../../../services/map/map-plugin.service';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Tooltip } from 'primeng/tooltip';
import { Divider } from 'primeng/divider';
import { Panel } from 'primeng/panel';
import { Drawer } from 'primeng/drawer';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import * as L from 'leaflet';

interface LayerOption {
  label: string;
  value: BaseLayerName;
  icon: string;
}

interface DrawOption {
  label: string;
  value: DrawMode;
  icon: string;
  tooltip: string;
}

@Component({
  selector: 'app-map-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    BaseMapComponent,
    Button,
    SelectButton,
    Tooltip,
    Divider,
    Panel,
    Drawer,
    Dialog,
    InputText
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map-tools.component.html',
  styleUrls: ['./map-tools.component.scss'],
})
export class MapToolsComponent implements OnDestroy {
  @ViewChild(BaseMapComponent) baseMap!: BaseMapComponent;

  private mapLayerService = inject(MapLayerService);
  private mapPluginService = inject(MapPluginService);

  private map: L.Map | null = null;

  // Layer options
  layerOptions: LayerOption[] = [
    { label: 'Harita', value: 'osm', icon: 'pi pi-map' },
    { label: 'Uydu', value: 'satellite', icon: 'pi pi-image' },
    { label: 'Arazi', value: 'terrain', icon: 'pi pi-mountains' }
  ];

  // Draw options
  drawOptions: DrawOption[] = [
    { label: 'Marker', value: 'marker', icon: 'pi pi-map-marker', tooltip: 'Nokta ekle' },
    { label: 'Çizgi', value: 'polyline', icon: 'pi pi-minus', tooltip: 'Çizgi çiz (mesafe ölçümü)' }
  ];

  // State
  selectedLayer = signal<BaseLayerName>('osm');
  selectedDrawMode = signal<DrawMode>('none');
  searchQuery = signal('');
  searchResults = signal<any[]>([]);
  isSearching = signal(false);
  showMeasurements = signal(true);
  measurementsDrawerOpen = signal(false);
  settingsOpen = signal(false);

  // Computed
  measurements = computed(() => this.mapPluginService.measurements());
  drawnItems = computed(() => this.mapPluginService.drawnItems());
  totalMeasurements = computed(() => this.measurements().length);
  isDrawActive = computed(() => this.mapPluginService.isDrawActive());

  ngOnDestroy(): void {
    if (this.map) {
      this.mapPluginService.disableAll(this.map);
    }
    this.mapPluginService.reset();
  }

  onMapReady(map: L.Map): void {
    this.map = map;

    // Apply initial base layer
    this.mapLayerService.applyBaseLayer(map, this.selectedLayer());

    // Enable draw plugin (full Geoman toolbar on map)
    this.mapPluginService.enableDraw(map);
  }

  onLayerChange(layer: BaseLayerName): void {
    if (this.map && layer) {
      this.selectedLayer.set(layer);
      this.mapLayerService.applyBaseLayer(this.map, layer);
    }
  }

  onDrawModeChange(mode: DrawMode): void {
    if (!this.map) return;

    if (mode === this.selectedDrawMode()) {
      // Toggle off if same mode selected
      this.mapPluginService.stopDraw(this.map);
      this.selectedDrawMode.set('none');
    } else {
      this.selectedDrawMode.set(mode);
      this.mapPluginService.startDraw(this.map, mode);
    }
  }

  clearDrawings(): void {
    this.mapPluginService.clearDrawings();
    this.selectedDrawMode.set('none');
  }

  async searchAddress(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query || !this.map) return;

    // Try parsing as coordinates (e.g. "41.0082, 28.9784")
    const coords = this.parseCoordinates(query);
    if (coords) {
      this.map.setView([coords.lat, coords.lng], 14);
      L.marker([coords.lat, coords.lng])
        .addTo(this.map)
        .bindPopup(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
        .openPopup();
      this.searchResults.set([]);
      return;
    }

    // Nominatim address search
    this.isSearching.set(true);

    try {
      const results = await this.mapPluginService.searchAddress(query);
      this.searchResults.set(results);

      if (results.length > 0) {
        const first = results[0];
        this.map.setView([first.center.lat, first.center.lng], 14);
      }
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      this.isSearching.set(false);
    }
  }

  private parseCoordinates(input: string): { lat: number; lng: number } | null {
    const match = input.match(/^(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)$/);
    if (!match) return null;
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchAddress();
    }
  }

  goToResult(result: any): void {
    if (this.map && result.center) {
      this.map.setView([result.center.lat, result.center.lng], 16);

      // Add marker at location
      L.marker([result.center.lat, result.center.lng])
        .addTo(this.map)
        .bindPopup(result.name)
        .openPopup();
    }
    this.searchResults.set([]);
  }

  exportGeoJSON(): void {
    const geoJSON = this.mapPluginService.exportToGeoJSON();
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawings.geojson';
    a.click();
    URL.revokeObjectURL(url);
  }

  async copyGeoJSON(): Promise<void> {
    const geoJSON = this.mapPluginService.exportToGeoJSON();
    try {
      await navigator.clipboard.writeText(JSON.stringify(geoJSON, null, 2));
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  }

  locateMe(): void {
    if (!this.map) return;

    this.map.locate({ setView: true, maxZoom: 16 });

    this.map.once('locationfound', (e: L.LocationEvent) => {
      L.marker(e.latlng)
        .addTo(this.map!)
        .bindPopup('Konumunuz')
        .openPopup();

      L.circle(e.latlng, { radius: e.accuracy }).addTo(this.map!);
    });

    this.map.once('locationerror', () => {
      console.error('Konum bulunamadı');
    });
  }
}
