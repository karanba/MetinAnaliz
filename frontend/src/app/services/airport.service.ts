import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';

/**
 * Airport type enumeration
 */
export type AirportType = 'large_airport' | 'medium_airport' | 'small_airport' | 'heliport' | 'seaplane_base' | 'closed';

/**
 * Airport interface matching OurAirports CSV structure
 */
export interface Airport {
  id: number;
  ident: string;           // ICAO code
  type: AirportType;
  name: string;
  latitude: number;
  longitude: number;
  elevation_ft: number | null;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: boolean;
  gps_code: string;
  iata_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
}

/**
 * Country info for dropdown
 */
export interface CountryInfo {
  code: string;
  name: string;
  count: number;
}

/**
 * Airport type info for dropdown
 */
export interface AirportTypeInfo {
  type: AirportType;
  label: string;
  count: number;
}

/**
 * Filter state
 */
export interface AirportFilters {
  country: string | null;
  types: AirportType[];
  searchQuery: string;
}

// OurAirports CSV URL (GitHub raw)
const AIRPORTS_CSV_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

// Type labels in Turkish
const TYPE_LABELS: Record<AirportType, string> = {
  'large_airport': 'Büyük Havaalanı',
  'medium_airport': 'Orta Havaalanı',
  'small_airport': 'Küçük Havaalanı',
  'heliport': 'Heliport',
  'seaplane_base': 'Deniz Uçağı Üssü',
  'closed': 'Kapalı'
};

/**
 * Airport Service
 * OurAirports verilerini yönetir.
 */
@Injectable({
  providedIn: 'root'
})
export class AirportService {
  private http = inject(HttpClient);

  // State signals
  private readonly _airports = signal<Airport[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal<boolean>(false);

  // Filter signals
  private readonly _filters = signal<AirportFilters>({
    country: null,
    types: ['large_airport', 'medium_airport'],
    searchQuery: ''
  });

  // Public readonly signals
  readonly airports = this._airports.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly filters = this._filters.asReadonly();

  // Computed - filtered airports
  readonly filteredAirports = computed(() => {
    const all = this._airports();
    const filters = this._filters();

    let filtered = all;

    // Filter by country
    if (filters.country) {
      filtered = filtered.filter(a => a.iso_country === filters.country);
    }

    // Filter by type
    if (filters.types.length > 0) {
      filtered = filtered.filter(a => filters.types.includes(a.type));
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.iata_code?.toLowerCase().includes(query) ||
        a.ident.toLowerCase().includes(query) ||
        a.municipality?.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  // Computed - count
  readonly totalCount = computed(() => this._airports().length);
  readonly filteredCount = computed(() => this.filteredAirports().length);

  // Computed - countries list
  readonly countries = computed<CountryInfo[]>(() => {
    const all = this._airports();
    const countryMap = new Map<string, number>();

    all.forEach(a => {
      const count = countryMap.get(a.iso_country) || 0;
      countryMap.set(a.iso_country, count + 1);
    });

    return Array.from(countryMap.entries())
      .map(([code, count]) => ({
        code,
        name: code, // Could be enhanced with country names
        count
      }))
      .sort((a, b) => b.count - a.count);
  });

  // Computed - type stats
  readonly typeStats = computed<AirportTypeInfo[]>(() => {
    const all = this._airports();
    const typeMap = new Map<AirportType, number>();

    all.forEach(a => {
      const count = typeMap.get(a.type) || 0;
      typeMap.set(a.type, count + 1);
    });

    return Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        label: TYPE_LABELS[type] || type,
        count
      }))
      .sort((a, b) => b.count - a.count);
  });

  /**
   * Load airports from CSV
   */
  loadAirports(): void {
    if (this._loaded() || this._loading()) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.http.get(AIRPORTS_CSV_URL, { responseType: 'text' }).subscribe({
      next: (csvText) => {
        this.parseCSV(csvText);
      },
      error: (err) => {
        console.error('Airport data fetch error:', err);
        this._error.set('Havaalanı verileri yüklenemedi');
        this._loading.set(false);
      }
    });
  }

  /**
   * Parse CSV text to Airport objects
   */
  private parseCSV(csvText: string): void {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const airports: Airport[] = results.data
          .filter((row: any) => row.type && row.latitude_deg && row.longitude_deg)
          .map((row: any) => ({
            id: parseInt(row.id) || 0,
            ident: row.ident || '',
            type: row.type as AirportType,
            name: row.name || '',
            latitude: parseFloat(row.latitude_deg) || 0,
            longitude: parseFloat(row.longitude_deg) || 0,
            elevation_ft: row.elevation_ft ? parseInt(row.elevation_ft) : null,
            continent: row.continent || '',
            iso_country: row.iso_country || '',
            iso_region: row.iso_region || '',
            municipality: row.municipality || '',
            scheduled_service: row.scheduled_service === 'yes',
            gps_code: row.gps_code || '',
            iata_code: row.iata_code || '',
            local_code: row.local_code || '',
            home_link: row.home_link || '',
            wikipedia_link: row.wikipedia_link || '',
            keywords: row.keywords || ''
          }));

        this._airports.set(airports);
        this._loaded.set(true);
        this._loading.set(false);

        console.log(`Loaded ${airports.length} airports`);
      },
      error: (error: any) => {
        console.error('CSV parse error:', error);
        this._error.set('Havaalanı verileri işlenemedi');
        this._loading.set(false);
      }
    });
  }

  /**
   * Filter by country
   */
  filterByCountry(isoCode: string | null): void {
    this._filters.update(f => ({ ...f, country: isoCode }));
  }

  /**
   * Filter by types
   */
  filterByTypes(types: AirportType[]): void {
    this._filters.update(f => ({ ...f, types }));
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this._filters.update(f => ({ ...f, searchQuery: query }));
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this._filters.set({
      country: null,
      types: ['large_airport', 'medium_airport'],
      searchQuery: ''
    });
  }

  /**
   * Search by name/code
   */
  searchByName(query: string): Airport[] {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    return this._airports()
      .filter(a =>
        a.name.toLowerCase().includes(lowerQuery) ||
        a.iata_code?.toLowerCase().includes(lowerQuery) ||
        a.ident.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20);
  }

  /**
   * Get airport by IATA code
   */
  getAirportByIata(iata: string): Airport | undefined {
    return this._airports().find(a => a.iata_code === iata.toUpperCase());
  }

  /**
   * Get airport by ICAO code
   */
  getAirportByIcao(icao: string): Airport | undefined {
    return this._airports().find(a => a.ident === icao.toUpperCase());
  }

  /**
   * Get airports by country
   */
  getAirportsByCountry(isoCountry: string): Airport[] {
    return this._airports().filter(a => a.iso_country === isoCountry);
  }

  /**
   * Get type label
   */
  getTypeLabel(type: AirportType): string {
    return TYPE_LABELS[type] || type;
  }

  /**
   * Get marker color based on type
   */
  getTypeColor(type: AirportType): string {
    switch (type) {
      case 'large_airport': return '#dc2626'; // red
      case 'medium_airport': return '#f59e0b'; // amber
      case 'small_airport': return '#22c55e'; // green
      case 'heliport': return '#8b5cf6'; // violet
      case 'seaplane_base': return '#0ea5e9'; // sky
      case 'closed': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  }

  /**
   * Get marker radius based on type
   */
  getMarkerRadius(type: AirportType): number {
    switch (type) {
      case 'large_airport': return 8;
      case 'medium_airport': return 6;
      case 'small_airport': return 4;
      default: return 4;
    }
  }
}
