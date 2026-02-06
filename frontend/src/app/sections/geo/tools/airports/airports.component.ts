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
import { MapPluginService } from '../../../../services/map/map-plugin.service';
import { AirportService, Airport, AirportType } from '../../../../services/airport.service';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tooltip } from 'primeng/tooltip';
import { Drawer } from 'primeng/drawer';
import { Dialog } from 'primeng/dialog';
import * as L from 'leaflet';
import 'leaflet.markercluster';

interface LayerOption {
  label: string;
  value: BaseLayerName;
}

interface TypeOption {
  label: string;
  value: AirportType;
}

export type AirportSortField = 'name' | 'iata' | 'type' | 'country';
export type SortDirection = 'asc' | 'desc';

interface SortOption {
  label: string;
  value: AirportSortField;
}

@Component({
  selector: 'app-airports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    BaseMapComponent,
    Button,
    SelectButton,
    Select,
    MultiSelect,
    InputText,
    Divider,
    Tag,
    ProgressSpinner,
    Tooltip,
    Drawer,
    Dialog
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './airports.component.html',
  styleUrls: ['./airports.component.scss'],
})
export class AirportsComponent implements OnInit, OnDestroy {
  @ViewChild(BaseMapComponent) baseMap!: BaseMapComponent;

  private mapLayerService = inject(MapLayerService);
  private mapPluginService = inject(MapPluginService);
  readonly airportService = inject(AirportService);

  private map: L.Map | null = null;
  private markerCluster: L.MarkerClusterGroup | null = null;

  // Layer options
  layerOptions: LayerOption[] = [
    { label: 'Harita', value: 'osm' },
    { label: 'Uydu', value: 'satellite' },
    { label: 'Arazi', value: 'terrain' }
  ];

  // Type options
  typeOptions: TypeOption[] = [
    { label: 'Büyük Havaalanı', value: 'large_airport' },
    { label: 'Orta Havaalanı', value: 'medium_airport' },
    { label: 'Küçük Havaalanı', value: 'small_airport' },
    { label: 'Heliport', value: 'heliport' },
    { label: 'Deniz Uçağı', value: 'seaplane_base' }
  ];

  // Sort options
  sortOptions: SortOption[] = [
    { label: 'İsim', value: 'name' },
    { label: 'IATA', value: 'iata' },
    { label: 'Tip', value: 'type' },
    { label: 'Ülke', value: 'country' }
  ];

  // State
  selectedLayer = signal<BaseLayerName>('osm');
  selectedCountry = signal<string | null>(null);
  selectedTypes = signal<AirportType[]>(['large_airport', 'medium_airport']);
  searchQuery = signal<string>('');
  showList = signal<boolean>(true);
  listDrawerOpen = signal<boolean>(false);
  settingsOpen = signal<boolean>(false);
  listSearchQuery = signal<string>('');
  sortField = signal<AirportSortField>('name');
  sortDirection = signal<SortDirection>('asc');
  private userLocationMarker: L.Marker | null = null;

  // Computed
  loading = computed(() => this.airportService.loading());
  error = computed(() => this.airportService.error());
  filteredCount = computed(() => this.airportService.filteredCount());
  totalCount = computed(() => this.airportService.totalCount());
  countries = computed(() => this.airportService.countries());

  // Filtered and sorted airports for the list
  sortedAirports = computed(() => {
    let airports = [...this.airportService.filteredAirports()];
    const query = this.listSearchQuery().toLowerCase().trim();

    // Filter by list search query
    if (query) {
      airports = airports.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.iata_code?.toLowerCase().includes(query) ||
        a.ident.toLowerCase().includes(query) ||
        a.municipality?.toLowerCase().includes(query)
      );
    }

    // Sort
    const field = this.sortField();
    const direction = this.sortDirection();
    airports.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'iata':
          comparison = (a.iata_code || 'ZZZ').localeCompare(b.iata_code || 'ZZZ');
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'country':
          comparison = a.iso_country.localeCompare(b.iso_country);
          break;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return airports;
  });

  filteredAirports = computed(() => this.airportService.filteredAirports());

  ngOnInit(): void {
    // Load airport data
    this.airportService.loadAirports();
  }

  ngOnDestroy(): void {
    if (this.markerCluster) {
      this.markerCluster.clearLayers();
    }
    if (this.map) {
      this.mapPluginService.disableAll(this.map);
    }
    this.mapPluginService.reset();
  }

  onMapReady(map: L.Map): void {
    this.map = map;

    // Apply initial base layer
    this.mapLayerService.applyBaseLayer(map, this.selectedLayer());

    // Enable draw toolbar
    this.mapPluginService.enableDraw(map);

    // Initialize marker cluster
    this.markerCluster = L.markerClusterGroup({
      chunkedLoading: true,
      chunkProgress: (processed, total) => {
        // Progress callback if needed
      },
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 12
    });

    map.addLayer(this.markerCluster);

    // Set initial view to show the world
    map.setView([20, 0], 2);
  }

  onLayerChange(layer: BaseLayerName): void {
    if (this.map && layer) {
      this.selectedLayer.set(layer);
      this.mapLayerService.applyBaseLayer(this.map, layer);
    }
  }

  onCountryChange(country: string | null): void {
    this.selectedCountry.set(country);
    this.airportService.filterByCountry(country);
    this.updateMarkers();

    // Zoom to country if selected
    if (country && this.map) {
      const countryAirports = this.filteredAirports();
      if (countryAirports.length > 0) {
        const bounds = L.latLngBounds(
          countryAirports.map(a => [a.latitude, a.longitude] as L.LatLngTuple)
        );
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }

  onTypesChange(types: AirportType[]): void {
    this.selectedTypes.set(types);
    this.airportService.filterByTypes(types);
    this.updateMarkers();
  }

  onSearchChange(): void {
    this.airportService.setSearchQuery(this.searchQuery());
    this.updateMarkers();
  }

  resetFilters(): void {
    this.selectedCountry.set(null);
    this.selectedTypes.set(['large_airport', 'medium_airport']);
    this.searchQuery.set('');
    this.airportService.resetFilters();
    this.updateMarkers();

    if (this.map) {
      this.map.setView([20, 0], 2);
    }
  }

  private updateMarkers(): void {
    if (!this.markerCluster) return;

    this.markerCluster.clearLayers();

    const airports = this.filteredAirports();

    // Limit markers to prevent browser freeze
    const maxMarkers = 5000;
    const airportsToShow = airports.slice(0, maxMarkers);

    const markers = airportsToShow.map(airport => this.createMarker(airport));
    this.markerCluster.addLayers(markers);
  }

  private createMarker(airport: Airport): L.CircleMarker {
    const marker = L.circleMarker([airport.latitude, airport.longitude], {
      radius: this.airportService.getMarkerRadius(airport.type),
      fillColor: this.airportService.getTypeColor(airport.type),
      color: '#ffffff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    });

    // Popup content
    const popupContent = `
      <div class="airport-popup">
        <h4>${airport.name}</h4>
        <div class="popup-details">
          ${airport.iata_code ? `<p><strong>IATA:</strong> ${airport.iata_code}</p>` : ''}
          <p><strong>ICAO:</strong> ${airport.ident}</p>
          <p><strong>Tip:</strong> ${this.airportService.getTypeLabel(airport.type)}</p>
          ${airport.municipality ? `<p><strong>Şehir:</strong> ${airport.municipality}</p>` : ''}
          <p><strong>Ülke:</strong> ${airport.iso_country}</p>
          ${airport.elevation_ft ? `<p><strong>Yükseklik:</strong> ${airport.elevation_ft} ft</p>` : ''}
        </div>
        ${airport.wikipedia_link ? `<a href="${airport.wikipedia_link}" target="_blank" rel="noopener">Wikipedia</a>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent);

    // Tooltip
    const tooltipText = airport.iata_code
      ? `${airport.iata_code} - ${airport.name}`
      : `${airport.ident} - ${airport.name}`;

    marker.bindTooltip(tooltipText, {
      direction: 'top',
      offset: [0, -5]
    });

    return marker;
  }

  // Zoom to airport on list click
  zoomToAirport(airport: Airport): void {
    if (!this.map) return;

    this.map.setView([airport.latitude, airport.longitude], 12);

    // Create temporary marker with popup
    const marker = this.createMarker(airport);
    marker.addTo(this.map);
    marker.openPopup();

    // Remove after popup closed
    marker.on('popupclose', () => {
      this.map?.removeLayer(marker);
    });
  }

  // Get tag severity based on type
  getTypeSeverity(type: AirportType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (type) {
      case 'large_airport': return 'danger';
      case 'medium_airport': return 'warn';
      case 'small_airport': return 'success';
      default: return 'info';
    }
  }

  // Track by function
  trackByAirportId(index: number, airport: Airport): number {
    return airport.id;
  }

  // Toggle sort direction
  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  // Change sort field
  onSortFieldChange(field: AirportSortField): void {
    if (this.sortField() === field) {
      this.toggleSortDirection();
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
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
