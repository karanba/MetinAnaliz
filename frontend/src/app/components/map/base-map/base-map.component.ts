import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { BaseMapService } from './base-map.service';
import { MapConfig, DEFAULT_MAP_CONFIG } from '../map.models';

/**
 * Base Map Component
 * Reusable harita wrapper component'i.
 *
 * Kullanım:
 * ```html
 * <app-base-map
 *   [config]="mapConfig"
 *   (mapReady)="onMapReady($event)"
 *   (mapClick)="onMapClick($event)">
 * </app-base-map>
 * ```
 */
@Component({
  selector: 'app-base-map',
  standalone: true,
  imports: [CommonModule],
  providers: [BaseMapService], // Her component kendi service instance'ına sahip
  template: `
    <div class="map-wrapper">
      <div #mapContainer class="map-container"></div>

      @if (showCoordinates && mapService.mousePosition()) {
        <div class="coordinates-display">
          <span class="coord-label">Lat:</span>
          <span class="coord-value">{{ mapService.mousePosition()!.lat.toFixed(5) }}</span>
          <span class="coord-label">Lng:</span>
          <span class="coord-value">{{ mapService.mousePosition()!.lng.toFixed(5) }}</span>
        </div>
      }

      @if (mapService.isLoading()) {
        <div class="map-loading">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
      }
    </div>
  `,
  styles: [`
    .map-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }

    .map-container {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .coordinates-display {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.95);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: 'Fira Code', monospace;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .coord-label {
      color: var(--muted, #6b7280);
      font-weight: 500;
    }

    .coord-value {
      color: var(--ink, #1f2937);
      font-weight: 600;
    }

    .map-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 20px;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;

      i {
        font-size: 2rem;
        color: var(--accent, #1f7a8c);
      }
    }

    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  /** Harita yapılandırması */
  @Input() config: MapConfig = DEFAULT_MAP_CONFIG;

  /** Koordinat gösterimi */
  @Input() showCoordinates = true;

  /** Harita hazır olduğunda */
  @Output() mapReady = new EventEmitter<L.Map>();

  /** Harita tıklandığında */
  @Output() mapClick = new EventEmitter<L.LatLng>();

  /** Zoom değiştiğinde */
  @Output() zoomChange = new EventEmitter<number>();

  /** Görünüm değiştiğinde (pan/zoom sonrası) */
  @Output() viewChange = new EventEmitter<{ center: L.LatLng; zoom: number; bounds: L.LatLngBounds }>();

  readonly mapService = inject(BaseMapService);

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
  }

  private initializeMap(): void {
    const map = this.mapService.initializeMap(
      this.mapContainer.nativeElement,
      this.config
    );

    // Setup event handlers
    this.setupEventHandlers(map);

    // Emit ready event
    this.mapReady.emit(map);
  }

  private setupEventHandlers(map: L.Map): void {
    // Click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClick.emit(e.latlng);
    });

    // Zoom change handler
    map.on('zoomend', () => {
      const zoom = map.getZoom();
      this.zoomChange.emit(zoom);
    });

    // View change handler (move end)
    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      this.viewChange.emit({ center, zoom, bounds });
    });
  }

  /**
   * Base layer değiştirir
   */
  setBaseLayer(layer: 'osm' | 'satellite' | 'terrain'): void {
    this.mapService.setBaseLayer(layer);
  }

  /**
   * Belirli koordinatlara pan yapar
   */
  panTo(latlng: L.LatLngExpression): void {
    this.mapService.panTo(latlng);
  }

  /**
   * Bounds'a fit yapar
   */
  fitBounds(bounds: L.LatLngBoundsExpression): void {
    this.mapService.fitBounds(bounds);
  }

  /**
   * MapService'e erişim sağlar
   */
  getService(): BaseMapService {
    return this.mapService;
  }
}
