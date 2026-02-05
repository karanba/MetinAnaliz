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
    Panel
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
    { label: 'Çizgi', value: 'polyline', icon: 'pi pi-minus', tooltip: 'Çizgi çiz (mesafe ölçümü)' },
    { label: 'Alan', value: 'polygon', icon: 'pi pi-stop', tooltip: 'Alan çiz (alan ölçümü)' },
    { label: 'Daire', value: 'circle', icon: 'pi pi-circle', tooltip: 'Daire çiz' }
  ];

  // State
  selectedLayer = signal<BaseLayerName>('osm');
  selectedDrawMode = signal<DrawMode>('none');
  searchQuery = signal('');
  searchResults = signal<any[]>([]);
  isSearching = signal(false);
  showMeasurements = signal(true);

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

    // Enable draw plugin
    this.mapPluginService.enableDraw(map);

    // Enable geocoder
    this.mapPluginService.enableGeocoder(map, {
      placeholder: 'Adres veya koordinat ara...',
      errorMessage: 'Sonuç bulunamadı'
    });
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

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  resetView(): void {
    this.map?.setView([39.9334, 32.8597], 6);
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
