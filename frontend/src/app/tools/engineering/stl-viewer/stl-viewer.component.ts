import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PageHeaderComponent } from '../../../shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { SelectButton } from 'primeng/selectbutton';
import { Slider } from 'primeng/slider';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ColorPicker } from 'primeng/colorpicker';
import { Tooltip } from 'primeng/tooltip';
import { Message } from 'primeng/message';

interface ModelStats {
  triangles: number;
  vertices: number;
  boundingBox: { x: number; y: number; z: number };
  volume: number;
  surfaceArea: number;
}

@Component({
  selector: 'app-stl-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    Button,
    Card,
    SelectButton,
    Slider,
    ToggleSwitch,
    ColorPicker,
    Tooltip,
    Message,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stl-viewer-page">
      <app-page-header
        title="STL Görüntüleyici"
        description="3D STL dosyalarını görüntüleyin, ölçün ve analiz edin"
        [breadcrumbs]="[
          { label: 'Araçlar', route: '/tools' },
          { label: 'Mühendislik', route: '/tools/engineering' },
          { label: 'STL Görüntüleyici' }
        ]"
      />

      <div class="viewer-layout">
        <!-- 3D Viewer -->
        <div class="viewer-section">
          <div
            class="viewer-container"
            #viewerContainer
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.drag-over]="isDragOver"
            [class.has-model]="hasModel()"
          >
            <canvas #canvas></canvas>

            @if (!hasModel()) {
              <div class="upload-overlay">
                <div class="upload-content">
                  <i class="pi pi-cloud-upload"></i>
                  <h3>STL Dosyası Yükleyin</h3>
                  <p>Dosyayı sürükleyip bırakın veya</p>
                  <p-button
                    label="Dosya Seçin"
                    icon="pi pi-folder-open"
                    (onClick)="fileInput.click()"
                  ></p-button>
                  <input
                    type="file"
                    #fileInput
                    accept=".stl"
                    (change)="onFileSelected($event)"
                    hidden
                  />
                </div>
              </div>
            }

            @if (loading()) {
              <div class="loading-overlay">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Yükleniyor...</span>
              </div>
            }
          </div>

          <!-- Viewer Controls -->
          @if (hasModel()) {
            <div class="viewer-toolbar">
              <p-button
                icon="pi pi-refresh"
                [outlined]="true"
                [rounded]="true"
                pTooltip="Görünümü sıfırla"
                (onClick)="resetView()"
              ></p-button>
              <p-button
                icon="pi pi-arrows-alt"
                [outlined]="true"
                [rounded]="true"
                pTooltip="Modeli ortala"
                (onClick)="centerModel()"
              ></p-button>
              <p-button
                icon="pi pi-camera"
                [outlined]="true"
                [rounded]="true"
                pTooltip="Ekran görüntüsü al"
                (onClick)="takeScreenshot()"
              ></p-button>
              <p-button
                icon="pi pi-trash"
                [outlined]="true"
                [rounded]="true"
                severity="danger"
                pTooltip="Modeli kaldır"
                (onClick)="clearModel()"
              ></p-button>
            </div>
          }
        </div>

        <!-- Controls Panel -->
        <div class="controls-section">
          @if (error()) {
            <p-message severity="error" [text]="error()!"></p-message>
          }

          <!-- Model Info -->
          @if (hasModel() && stats()) {
            <p-card class="info-card">
              <div class="card-title">
                <i class="pi pi-info-circle"></i>
                <span>Model Bilgileri</span>
              </div>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">Üçgenler</span>
                  <span class="stat-value">{{ stats()!.triangles | number }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Köşeler</span>
                  <span class="stat-value">{{ stats()!.vertices | number }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Boyut X</span>
                  <span class="stat-value">{{ stats()!.boundingBox.x | number:'1.2-2' }} mm</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Boyut Y</span>
                  <span class="stat-value">{{ stats()!.boundingBox.y | number:'1.2-2' }} mm</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Boyut Z</span>
                  <span class="stat-value">{{ stats()!.boundingBox.z | number:'1.2-2' }} mm</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Hacim</span>
                  <span class="stat-value">{{ stats()!.volume | number:'1.2-2' }} mm³</span>
                </div>
                <div class="stat-item full-width">
                  <span class="stat-label">Yüzey Alanı</span>
                  <span class="stat-value">{{ stats()!.surfaceArea | number:'1.2-2' }} mm²</span>
                </div>
              </div>
            </p-card>
          }

          <!-- Display Options -->
          <p-card class="options-card">
            <div class="card-title">
              <i class="pi pi-sliders-h"></i>
              <span>Görünüm Ayarları</span>
            </div>

            <div class="option-group">
              <label>Görünüm Modu</label>
              <p-selectButton
                [options]="viewModeOptions"
                [(ngModel)]="viewMode"
                (onChange)="updateViewMode()"
                optionLabel="label"
                optionValue="value"
              ></p-selectButton>
            </div>

            <div class="option-group">
              <label>Model Rengi</label>
              <div class="color-row">
                <p-colorPicker
                  [(ngModel)]="modelColor"
                  (onChange)="updateModelColor()"
                ></p-colorPicker>
                <span class="color-value">{{ modelColor }}</span>
              </div>
            </div>

            <div class="option-group">
              <label>Arka Plan</label>
              <div class="color-row">
                <p-colorPicker
                  [(ngModel)]="backgroundColor"
                  (onChange)="updateBackgroundColor()"
                ></p-colorPicker>
                <span class="color-value">{{ backgroundColor }}</span>
              </div>
            </div>

            <div class="option-row">
              <label>Izgara</label>
              <p-toggleSwitch
                [(ngModel)]="showGrid"
                (onChange)="toggleGrid()"
              ></p-toggleSwitch>
            </div>

            <div class="option-row">
              <label>Eksenler</label>
              <p-toggleSwitch
                [(ngModel)]="showAxes"
                (onChange)="toggleAxes()"
              ></p-toggleSwitch>
            </div>

            <div class="option-row">
              <label>Otomatik Döndür</label>
              <p-toggleSwitch
                [(ngModel)]="autoRotate"
                (onChange)="toggleAutoRotate()"
              ></p-toggleSwitch>
            </div>
          </p-card>

          <!-- Upload New -->
          @if (hasModel()) {
            <p-button
              label="Yeni Dosya Yükle"
              icon="pi pi-upload"
              styleClass="upload-btn"
              [outlined]="true"
              (onClick)="fileInput.click()"
            ></p-button>
            <input
              type="file"
              #fileInput
              accept=".stl"
              (change)="onFileSelected($event)"
              hidden
            />
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .stl-viewer-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .viewer-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 1024px) {
      .viewer-layout {
        grid-template-columns: 1fr 280px;
      }
    }

    .viewer-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .viewer-container {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      background: #1a1a2e;
      border-radius: 14px;
      overflow: hidden;
      border: 2px dashed transparent;
      transition: all 0.3s ease;

      &.drag-over {
        border-color: var(--accent);
        background: rgba(31, 122, 140, 0.1);
      }

      &.has-model {
        border: 1px solid var(--stroke);
      }

      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    }

    .upload-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(26, 26, 46, 0.95);
    }

    .upload-content {
      text-align: center;
      color: #ffffff;

      i {
        font-size: 3rem;
        color: var(--accent);
        margin-bottom: 16px;
      }

      h3 {
        font-size: 1.25rem;
        margin: 0 0 8px;
      }

      p {
        color: rgba(255, 255, 255, 0.6);
        margin: 0 0 16px;
        font-size: 0.9rem;
      }
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(26, 26, 46, 0.9);
      color: #ffffff;
      gap: 12px;

      i {
        font-size: 2rem;
        color: var(--accent);
      }
    }

    .viewer-toolbar {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .controls-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-card, .options-card {
      :host ::ng-deep .p-card-body {
        padding: 16px;
      }
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--ink);
      margin-bottom: 12px;
      font-size: 0.95rem;

      i {
        color: var(--accent);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px;
      background: rgba(31, 122, 140, 0.05);
      border-radius: 8px;

      &.full-width {
        grid-column: span 2;
      }
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--muted);
    }

    .stat-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--ink);
      font-family: 'Source Code Pro', monospace;
    }

    .option-group {
      margin-bottom: 14px;

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--ink);
        margin-bottom: 6px;
      }
    }

    .option-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--stroke);

      &:last-child {
        border-bottom: none;
      }

      label {
        font-size: 0.85rem;
        color: var(--ink);
      }
    }

    .color-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .color-value {
      font-size: 0.8rem;
      font-family: 'Source Code Pro', monospace;
      color: var(--muted);
    }

    :host ::ng-deep {
      .p-selectbutton .p-button {
        padding: 6px 12px;
        font-size: 0.8rem;
      }

      .upload-btn {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .viewer-container {
        aspect-ratio: 1/1;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-item.full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class StlViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewerContainer') containerRef!: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  // Three.js objects
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private mesh: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private axesHelper: THREE.AxesHelper | null = null;
  private animationId: number | null = null;

  // State
  hasModel = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  stats = signal<ModelStats | null>(null);
  isDragOver = false;

  // Options
  viewMode: 'solid' | 'wireframe' = 'solid';
  viewModeOptions = [
    { label: 'Katı', value: 'solid' },
    { label: 'Tel Kafes', value: 'wireframe' },
  ];
  modelColor = '#1f7a8c';
  backgroundColor = '#1a1a2e';
  showGrid = true;
  showAxes = true;
  autoRotate = false;

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.animate();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer?.dispose();
  }

  private initThreeJS(): void {
    const container = this.containerRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    this.camera.position.set(100, 100, 100);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    this.scene.add(directionalLight2);

    // Grid
    this.gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x333333);
    this.scene.add(this.gridHelper);

    // Axes
    this.axesHelper = new THREE.AxesHelper(50);
    this.scene.add(this.axesHelper);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.autoRotate && this.mesh) {
      this.mesh.rotation.y += 0.005;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    const container = this.containerRef.nativeElement;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.loadFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.loadFile(input.files[0]);
      input.value = '';
    }
  }

  private loadFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.stl')) {
      this.error.set('Lütfen geçerli bir STL dosyası seçin.');
      this.cdr.markForCheck();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result;
      if (contents) {
        this.loadSTL(contents as ArrayBuffer);
      }
    };
    reader.onerror = () => {
      this.error.set('Dosya okunurken bir hata oluştu.');
      this.loading.set(false);
      this.cdr.markForCheck();
    };
    reader.readAsArrayBuffer(file);
  }

  private loadSTL(buffer: ArrayBuffer): void {
    try {
      // Remove existing mesh
      if (this.mesh) {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
      }

      const loader = new STLLoader();
      const geometry = loader.parse(buffer);

      // Center geometry
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox!.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      // Create material
      const material = new THREE.MeshPhongMaterial({
        color: this.modelColor,
        specular: 0x111111,
        shininess: 50,
        wireframe: this.viewMode === 'wireframe',
      });

      // Create mesh
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      // Calculate stats
      this.calculateStats(geometry);

      // Fit camera to model
      this.fitCameraToModel();

      this.hasModel.set(true);
      this.loading.set(false);
      this.cdr.markForCheck();
    } catch (err) {
      this.error.set('STL dosyası işlenirken bir hata oluştu.');
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  private calculateStats(geometry: THREE.BufferGeometry): void {
    const positions = geometry.attributes['position'];
    const triangles = positions.count / 3;
    const vertices = positions.count;

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);

    // Calculate volume and surface area
    let volume = 0;
    let surfaceArea = 0;

    for (let i = 0; i < positions.count; i += 3) {
      const v1 = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i + 1),
        positions.getY(i + 1),
        positions.getZ(i + 1)
      );
      const v3 = new THREE.Vector3(
        positions.getX(i + 2),
        positions.getY(i + 2),
        positions.getZ(i + 2)
      );

      // Signed volume
      volume += v1.dot(v2.cross(v3)) / 6;

      // Triangle area
      const edge1 = v2.clone().sub(v1);
      const edge2 = v3.clone().sub(v1);
      surfaceArea += edge1.cross(edge2).length() / 2;
    }

    this.stats.set({
      triangles,
      vertices,
      boundingBox: { x: size.x, y: size.y, z: size.z },
      volume: Math.abs(volume),
      surfaceArea,
    });
  }

  private fitCameraToModel(): void {
    if (!this.mesh) return;

    const box = new THREE.Box3().setFromObject(this.mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;

    this.camera.position.set(distance, distance, distance);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resetView(): void {
    this.fitCameraToModel();
  }

  centerModel(): void {
    if (this.mesh) {
      this.mesh.position.set(0, 0, 0);
      this.mesh.rotation.set(0, 0, 0);
    }
  }

  clearModel(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.mesh = null;
    }
    this.hasModel.set(false);
    this.stats.set(null);
    this.error.set(null);
    this.cdr.markForCheck();
  }

  takeScreenshot(): void {
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'stl-screenshot.png';
    link.href = dataUrl;
    link.click();
  }

  updateViewMode(): void {
    if (this.mesh) {
      (this.mesh.material as THREE.MeshPhongMaterial).wireframe =
        this.viewMode === 'wireframe';
    }
  }

  updateModelColor(): void {
    if (this.mesh) {
      (this.mesh.material as THREE.MeshPhongMaterial).color.set(this.modelColor);
    }
  }

  updateBackgroundColor(): void {
    this.scene.background = new THREE.Color(this.backgroundColor);
  }

  toggleGrid(): void {
    if (this.gridHelper) {
      this.gridHelper.visible = this.showGrid;
    }
  }

  toggleAxes(): void {
    if (this.axesHelper) {
      this.axesHelper.visible = this.showAxes;
    }
  }

  toggleAutoRotate(): void {
    // Auto-rotate is handled in animate loop
  }
}
