import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * USGS Earthquake GeoJSON Feature Properties
 */
export interface EarthquakeProperties {
  /** Magnitude */
  mag: number;
  /** Location description */
  place: string;
  /** Unix timestamp (ms) */
  time: number;
  /** Last updated timestamp (ms) */
  updated: number;
  /** Timezone offset */
  tz: number | null;
  /** USGS event page URL */
  url: string;
  /** USGS detail API URL */
  detail: string;
  /** Felt reports count */
  felt: number | null;
  /** Community Determined Intensity */
  cdi: number | null;
  /** Modified Mercalli Intensity */
  mmi: number | null;
  /** Alert level (green, yellow, orange, red) */
  alert: string | null;
  /** Review status */
  status: string;
  /** Tsunami flag (1 = yes) */
  tsunami: number;
  /** Significance (0-1000) */
  sig: number;
  /** Network ID */
  net: string;
  /** Event code */
  code: string;
  /** Event IDs */
  ids: string;
  /** Data sources */
  sources: string;
  /** Product types */
  types: string;
  /** Number of stations */
  nst: number | null;
  /** Minimum distance to station */
  dmin: number | null;
  /** Root mean square travel time */
  rms: number | null;
  /** Azimuthal gap */
  gap: number | null;
  /** Magnitude type (ml, mb, mw, etc.) */
  magType: string;
  /** Event type (earthquake, explosion, etc.) */
  type: string;
  /** Title for display */
  title: string;
  /** Data source label */
  source?: 'USGS' | 'Kandilli' | string;
  /** Match group for duplicates across sources */
  match_group?: string;
}

/**
 * GeoJSON Feature for earthquake
 */
export interface EarthquakeFeature {
  type: 'Feature';
  properties: EarthquakeProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
  id: string;
}

/**
 * GeoJSON FeatureCollection response
 */
export interface EarthquakeResponse {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
    sources?: Record<string, { ok: boolean; error?: string }>;
  };
  features: EarthquakeFeature[];
  bbox?: number[];
}

/**
 * Query parameters for earthquake API
 */
export interface EarthquakeQueryParams {
  start_time?: string;
  end_time?: string;
  min_magnitude?: number;
  max_magnitude?: number;
  limit?: number;
}

/**
 * Preset time ranges
 */
export type TimePreset = 'hour' | 'today' | 'week' | 'month';

/**
 * Earthquake Service
 * USGS deprem verilerini backend API üzerinden çeker.
 */
@Injectable({
  providedIn: 'root'
})
export class EarthquakeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // State signals
  private readonly _earthquakes = signal<EarthquakeFeature[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<Date | null>(null);
  private readonly _currentPreset = signal<TimePreset>('today');
  private readonly _sourceStatus = signal<Record<string, { ok: boolean; error?: string }>>({});

  // Auto-refresh
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Public readonly signals
  readonly earthquakes = this._earthquakes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();
  readonly currentPreset = this._currentPreset.asReadonly();
  readonly sourceStatus = this._sourceStatus.asReadonly();

  // Computed signals
  readonly count = computed(() => this._earthquakes().length);

  readonly earthquakesByMagnitude = computed(() => {
    const quakes = this._earthquakes();
    return {
      minor: quakes.filter(q => q.properties.mag < 4),
      light: quakes.filter(q => q.properties.mag >= 4 && q.properties.mag < 5),
      moderate: quakes.filter(q => q.properties.mag >= 5 && q.properties.mag < 6),
      strong: quakes.filter(q => q.properties.mag >= 6 && q.properties.mag < 7),
      major: quakes.filter(q => q.properties.mag >= 7),
    };
  });

  readonly maxMagnitude = computed(() => {
    const quakes = this._earthquakes();
    if (quakes.length === 0) return 0;
    return Math.max(...quakes.map(q => q.properties.mag));
  });

  readonly significantQuakes = computed(() =>
    this._earthquakes().filter(q => q.properties.sig >= 600)
  );

  /**
   * Fetch earthquakes with custom parameters
   */
  fetchEarthquakes(params: EarthquakeQueryParams = {}): void {
    this._loading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();

    if (params.start_time) {
      httpParams = httpParams.set('start_time', params.start_time);
    }
    if (params.end_time) {
      httpParams = httpParams.set('end_time', params.end_time);
    }
    if (params.min_magnitude !== undefined) {
      httpParams = httpParams.set('min_magnitude', params.min_magnitude.toString());
    }
    if (params.max_magnitude !== undefined) {
      httpParams = httpParams.set('max_magnitude', params.max_magnitude.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    this.http.get<EarthquakeResponse>(`${this.apiUrl}/earthquakes`, { params: httpParams })
      .subscribe({
        next: (response) => {
          this._earthquakes.set(response.features);
          this._lastUpdated.set(new Date());
          this._sourceStatus.set(response.metadata?.sources ?? {});
          this._loading.set(false);
        },
        error: (err) => {
          console.error('Earthquake fetch error:', err);
          this._error.set(err.message || 'Deprem verileri alınamadı');
          this._loading.set(false);
        }
      });
  }

  /**
   * Fetch using preset time ranges
   */
  fetchPreset(preset: TimePreset, minMagnitude: number = 2.5): void {
    this._currentPreset.set(preset);
    this._loading.set(true);
    this._error.set(null);

    const now = new Date();
    let startTime: Date;

    switch (preset) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'today':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    this.fetchEarthquakes({
      start_time: startTime.toISOString(),
      end_time: now.toISOString(),
      min_magnitude: minMagnitude,
      limit: 5000,
    });
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh(intervalMs: number = 60000): void {
    this.stopAutoRefresh();

    this.refreshInterval = setInterval(() => {
      const preset = this._currentPreset();
      this.fetchPreset(preset);
    }, intervalMs);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Get magnitude color class
   */
  getMagnitudeColor(magnitude: number): string {
    if (magnitude >= 7) return 'magnitude-major';
    if (magnitude >= 6) return 'magnitude-strong';
    if (magnitude >= 5) return 'magnitude-moderate';
    if (magnitude >= 4) return 'magnitude-light';
    return 'magnitude-minor';
  }

  /**
   * Get magnitude CSS color
   */
  getMagnitudeCssColor(magnitude: number): string {
    if (magnitude >= 7) return '#dc2626'; // red-600
    if (magnitude >= 6) return '#ea580c'; // orange-600
    if (magnitude >= 5) return '#f59e0b'; // amber-500
    if (magnitude >= 4) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  }

  /**
   * Get marker radius based on magnitude
   */
  getMarkerRadius(magnitude: number): number {
    // Exponential scale for visibility
    return Math.max(4, Math.pow(magnitude, 1.5) * 2);
  }

  /**
   * Format time ago
   */
  formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Az önce';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dk önce`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
    return `${Math.floor(seconds / 86400)} gün önce`;
  }

  /**
   * Format depth
   */
  formatDepth(depthKm: number): string {
    return `${depthKm.toFixed(1)} km`;
  }

  /**
   * Clear earthquakes
   */
  clear(): void {
    this._earthquakes.set([]);
    this._error.set(null);
  }
}
