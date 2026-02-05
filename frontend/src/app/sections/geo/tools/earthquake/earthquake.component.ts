import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  ViewChild,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../components/shared';
import { BaseMapComponent } from '../../../../components/map';
import { MapLayerService, BaseLayerName } from '../../../../services/map/map-layer.service';
import { EarthquakeService, EarthquakeFeature, TimePreset } from '../../../../services/earthquake.service';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Slider } from 'primeng/slider';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { Divider } from 'primeng/divider';
import { Panel } from 'primeng/panel';
import { Tag } from 'primeng/tag';
import { ProgressSpinner } from 'primeng/progressspinner';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import * as L from 'leaflet';

interface TimePresetOption {
  label: string;
  value: TimePreset;
}

interface LayerOption {
  label: string;
  value: BaseLayerName;
}

export type EarthquakeSortField = 'time' | 'magnitude' | 'depth';
export type SortDirection = 'asc' | 'desc';

interface SortOption {
  label: string;
  value: EarthquakeSortField;
}

@Component({
  selector: 'app-earthquake',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    BaseMapComponent,
    Button,
    SelectButton,
    Slider,
    ToggleSwitch,
    Tooltip,
    Divider,
    Panel,
    Tag,
    ProgressSpinner,
    InputText,
    Select
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './earthquake.component.html',
  styleUrls: ['./earthquake.component.scss'],
})
export class EarthquakeComponent implements OnInit, OnDestroy {
  @ViewChild(BaseMapComponent) baseMap!: BaseMapComponent;

  private mapLayerService = inject(MapLayerService);
  readonly earthquakeService = inject(EarthquakeService);

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup = L.layerGroup();

  // Time preset options
  timePresets: TimePresetOption[] = [
    { label: 'Son 1 Saat', value: 'hour' },
    { label: 'Bugün', value: 'today' },
    { label: 'Son 7 Gün', value: 'week' },
    { label: 'Son 30 Gün', value: 'month' }
  ];

  // Layer options
  layerOptions: LayerOption[] = [
    { label: 'Harita', value: 'osm' },
    { label: 'Uydu', value: 'satellite' },
    { label: 'Arazi', value: 'terrain' }
  ];

  // Sort options
  sortOptions: SortOption[] = [
    { label: 'Zaman', value: 'time' },
    { label: 'Büyüklük', value: 'magnitude' },
    { label: 'Derinlik', value: 'depth' }
  ];

  // State
  selectedPreset = signal<TimePreset>('today');
  selectedLayer = signal<BaseLayerName>('osm');
  minMagnitude = signal<number>(2.5);
  autoRefresh = signal<boolean>(false);
  showList = signal<boolean>(true);
  listSearchQuery = signal<string>('');
  sortField = signal<EarthquakeSortField>('time');
  sortDirection = signal<SortDirection>('desc');
  private userLocationMarker: L.Marker | null = null;

  // Computed
  loading = computed(() => this.earthquakeService.loading());
  error = computed(() => this.earthquakeService.error());
  count = computed(() => this.earthquakeService.count());
  lastUpdated = computed(() => this.earthquakeService.lastUpdated());
  maxMagnitude = computed(() => this.earthquakeService.maxMagnitude());

  // Filtered and sorted earthquakes for the list
  filteredEarthquakes = computed(() => {
    let quakes = [...this.earthquakeService.earthquakes()];
    const query = this.listSearchQuery().toLowerCase().trim();

    // Filter by search query
    if (query) {
      quakes = quakes.filter(q =>
        q.properties.place?.toLowerCase().includes(query) ||
        q.properties.mag.toString().includes(query)
      );
    }

    // Sort
    const field = this.sortField();
    const direction = this.sortDirection();
    quakes.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'time':
          comparison = a.properties.time - b.properties.time;
          break;
        case 'magnitude':
          comparison = a.properties.mag - b.properties.mag;
          break;
        case 'depth':
          comparison = a.geometry.coordinates[2] - b.geometry.coordinates[2];
          break;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return quakes;
  });

  earthquakes = computed(() => this.earthquakeService.earthquakes());

  ngOnInit(): void {
    // Initial fetch
    this.earthquakeService.fetchPreset('today', this.minMagnitude());
  }

  ngOnDestroy(): void {
    this.earthquakeService.stopAutoRefresh();
    this.markersLayer.clearLayers();
  }

  onMapReady(map: L.Map): void {
    this.map = map;

    // Apply initial base layer
    this.mapLayerService.applyBaseLayer(map, this.selectedLayer());

    // Add markers layer
    this.markersLayer.addTo(map);

    // Set initial view to show the world
    map.setView([20, 0], 2);

    // Watch for earthquake updates
    this.updateMarkers();
  }

  onPresetChange(preset: TimePreset): void {
    this.selectedPreset.set(preset);
    this.earthquakeService.fetchPreset(preset, this.minMagnitude());
  }

  onLayerChange(layer: BaseLayerName): void {
    if (this.map && layer) {
      this.selectedLayer.set(layer);
      this.mapLayerService.applyBaseLayer(this.map, layer);
    }
  }

  onMagnitudeChange(): void {
    // Debounce could be added here
    this.earthquakeService.fetchPreset(this.selectedPreset(), this.minMagnitude());
  }

  onAutoRefreshChange(): void {
    if (this.autoRefresh()) {
      this.earthquakeService.startAutoRefresh(60000); // 1 minute
    } else {
      this.earthquakeService.stopAutoRefresh();
    }
  }

  refresh(): void {
    this.earthquakeService.fetchPreset(this.selectedPreset(), this.minMagnitude());
  }

  private updateMarkers(): void {
    // This will be called when earthquakes signal changes
    // Using effect would be better, but for simplicity we call it after fetch
    const quakes = this.earthquakes();
    this.markersLayer.clearLayers();

    quakes.forEach(quake => {
      const marker = this.createMarker(quake);
      marker.addTo(this.markersLayer);
    });
  }

  private createMarker(quake: EarthquakeFeature): L.CircleMarker {
    const [lng, lat, depth] = quake.geometry.coordinates;
    const mag = quake.properties.mag;

    const marker = L.circleMarker([lat, lng], {
      radius: this.earthquakeService.getMarkerRadius(mag),
      fillColor: this.earthquakeService.getMagnitudeCssColor(mag),
      color: '#ffffff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    });

    // Popup content
    const popupContent = `
      <div class="earthquake-popup">
        <h4>${quake.properties.title}</h4>
        <div class="popup-details">
          <p><strong>Büyüklük:</strong> ${mag.toFixed(1)} ${quake.properties.magType}</p>
          <p><strong>Derinlik:</strong> ${this.earthquakeService.formatDepth(depth)}</p>
          <p><strong>Zaman:</strong> ${this.earthquakeService.formatTimeAgo(quake.properties.time)}</p>
          <p><strong>Konum:</strong> ${quake.properties.place}</p>
        </div>
        <a href="${quake.properties.url}" target="_blank" rel="noopener">USGS Detay</a>
      </div>
    `;

    marker.bindPopup(popupContent);

    // Tooltip
    marker.bindTooltip(`M${mag.toFixed(1)} - ${quake.properties.place}`, {
      direction: 'top',
      offset: [0, -10]
    });

    return marker;
  }

  // Called when earthquake data changes
  onEarthquakesChange(): void {
    this.updateMarkers();
  }

  // Zoom to earthquake on list click
  zoomToQuake(quake: EarthquakeFeature): void {
    if (!this.map) return;

    const [lng, lat] = quake.geometry.coordinates;
    this.map.setView([lat, lng], 8);

    // Find and open popup
    this.markersLayer.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        const layerLatLng = layer.getLatLng();
        if (layerLatLng.lat === lat && layerLatLng.lng === lng) {
          layer.openPopup();
        }
      }
    });
  }

  // Get magnitude tag severity
  getMagnitudeSeverity(mag: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (mag >= 7) return 'danger';
    if (mag >= 6) return 'danger';
    if (mag >= 5) return 'warn';
    if (mag >= 4) return 'info';
    return 'success';
  }

  // Track by function for ngFor
  trackByQuakeId(index: number, quake: EarthquakeFeature): string {
    return quake.id;
  }

  // Toggle sort direction
  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  // Change sort field
  onSortChange(field: EarthquakeSortField): void {
    if (this.sortField() === field) {
      this.toggleSortDirection();
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
  }

  // Find user's location
  findMyLocation(): void {
    if (!this.map) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Remove existing marker
          if (this.userLocationMarker) {
            this.map!.removeLayer(this.userLocationMarker);
          }

          // Add user location marker
          this.userLocationMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div class="pulse-marker"><div class="pulse-ring"></div><div class="pulse-dot"></div></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(this.map!);

          this.userLocationMarker.bindPopup('Konumunuz').openPopup();

          // Zoom to location
          this.map!.setView([latitude, longitude], 8);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Konum alınamadı. Lütfen konum izinlerini kontrol edin.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Tarayıcınız konum özelliğini desteklemiyor.');
    }
  }
}
