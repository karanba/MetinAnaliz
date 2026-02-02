import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Card } from 'primeng/card';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { ExpressionEvaluatorService } from './expression-evaluator.service';

declare const Plotly: any;

@Component({
  selector: 'app-graph3d',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputText, InputNumber, Card, Select, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="graph3d-container">
      <p-card class="controls-card">
        <div class="controls-header">
          <h3><i class="pi pi-box"></i> 3D Grafik</h3>
          <p class="meta">z = f(x, y) formatında fonksiyon girin</p>
        </div>

        <div class="controls-grid">
          <div class="field full-width">
            <label for="expression">z = f(x, y) =</label>
            <input
              id="expression"
              type="text"
              pInputText
              [(ngModel)]="expression"
              placeholder="sin(sqrt(x^2+y^2)), x^2-y^2, ..."
              (keydown.enter)="plot()"
            />
          </div>

          <div class="field">
            <label for="xMin">x Min</label>
            <p-inputNumber
              id="xMin"
              [(ngModel)]="xMin"
              [showButtons]="true"
              [step]="1"
              mode="decimal"
              [minFractionDigits]="0"
              [maxFractionDigits]="2"
            ></p-inputNumber>
          </div>

          <div class="field">
            <label for="xMax">x Max</label>
            <p-inputNumber
              id="xMax"
              [(ngModel)]="xMax"
              [showButtons]="true"
              [step]="1"
              mode="decimal"
              [minFractionDigits]="0"
              [maxFractionDigits]="2"
            ></p-inputNumber>
          </div>

          <div class="field">
            <label for="yMin">y Min</label>
            <p-inputNumber
              id="yMin"
              [(ngModel)]="yMin"
              [showButtons]="true"
              [step]="1"
              mode="decimal"
              [minFractionDigits]="0"
              [maxFractionDigits]="2"
            ></p-inputNumber>
          </div>

          <div class="field">
            <label for="yMax">y Max</label>
            <p-inputNumber
              id="yMax"
              [(ngModel)]="yMax"
              [showButtons]="true"
              [step]="1"
              mode="decimal"
              [minFractionDigits]="0"
              [maxFractionDigits]="2"
            ></p-inputNumber>
          </div>

          <div class="field">
            <label for="resolution">Çözünürlük</label>
            <p-select
              id="resolution"
              [options]="resolutionOptions"
              [(ngModel)]="resolution"
              optionLabel="label"
              optionValue="value"
            ></p-select>
          </div>

          <div class="field">
            <label for="colorscale">Renk Paleti</label>
            <p-select
              id="colorscale"
              [options]="colorscaleOptions"
              [(ngModel)]="colorscale"
              optionLabel="label"
              optionValue="value"
            ></p-select>
          </div>

          <div class="field actions">
            <p-button
              label="Çiz"
              icon="pi pi-play"
              styleClass="primary-action"
              (onClick)="plot()"
              [disabled]="!expression.trim()"
            ></p-button>
            <p-button
              label="Temizle"
              icon="pi pi-trash"
              [outlined]="true"
              severity="secondary"
              (onClick)="clear()"
            ></p-button>
          </div>
        </div>

        <div class="examples-section">
          <label>Örnekler:</label>
          <div class="example-chips">
            @for (example of examples; track example) {
              <button class="example-chip" (click)="useExample(example)">
                {{ example }}
              </button>
            }
          </div>
        </div>

        @if (error()) {
          <p-message severity="error" [text]="error()!" styleClass="error-message"></p-message>
        }
      </p-card>

      <p-card class="plot-card">
        <div #plotContainer class="plot-container"></div>
        @if (!hasPlot()) {
          <div class="empty-plot">
            <i class="pi pi-box"></i>
            <p>3D Grafik burada görünecek</p>
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .graph3d-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 1200px) {
      .graph3d-container {
        grid-template-columns: 350px 1fr;
      }
    }

    .controls-card {
      height: fit-content;
    }

    .controls-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--stroke);
    }

    .controls-header h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
      margin: 0 0 6px;
      color: var(--ink);
    }

    .controls-header h3 i {
      color: var(--accent);
    }

    .controls-header .meta {
      margin: 0;
      font-size: 0.85rem;
      color: var(--muted);
    }

    .controls-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field.full-width {
      grid-column: 1 / -1;
    }

    .field label {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--ink);
    }

    .field.actions {
      grid-column: 1 / -1;
      flex-direction: row;
      gap: 10px;
      margin-top: 8px;
    }

    :host ::ng-deep .p-inputtext {
      width: 100%;
    }

    :host ::ng-deep .p-inputnumber {
      width: 100%;
    }

    :host ::ng-deep .p-select {
      width: 100%;
    }

    .examples-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--stroke);
    }

    .examples-section label {
      display: block;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--ink);
      margin-bottom: 10px;
    }

    .example-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .example-chip {
      background: rgba(31, 122, 140, 0.08);
      border: 1px solid rgba(31, 122, 140, 0.2);
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 0.8rem;
      color: var(--accent-strong);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Source Code Pro', monospace;
    }

    .example-chip:hover {
      background: rgba(31, 122, 140, 0.15);
      border-color: var(--accent);
    }

    :host ::ng-deep .error-message {
      margin-top: 16px;
      width: 100%;
    }

    .plot-card {
      min-height: 500px;
      position: relative;
    }

    .plot-container {
      width: 100%;
      height: 600px;
    }

    .empty-plot {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      opacity: 0.5;
    }

    .empty-plot i {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .empty-plot p {
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .controls-grid {
        grid-template-columns: 1fr;
      }

      .plot-container {
        height: 400px;
      }
    }
  `],
})
export class Graph3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('plotContainer') plotContainer!: ElementRef<HTMLDivElement>;

  private readonly evaluator = inject(ExpressionEvaluatorService);
  private plotlyLoaded = false;

  expression = '';
  xMin = -5;
  xMax = 5;
  yMin = -5;
  yMax = 5;
  resolution = 50;
  colorscale = 'Viridis';

  resolutionOptions = [
    { label: 'Düşük (25)', value: 25 },
    { label: 'Orta (50)', value: 50 },
    { label: 'Yüksek (75)', value: 75 },
    { label: 'Çok Yüksek (100)', value: 100 },
  ];

  colorscaleOptions = [
    { label: 'Viridis', value: 'Viridis' },
    { label: 'Plasma', value: 'Plasma' },
    { label: 'Inferno', value: 'Inferno' },
    { label: 'Magma', value: 'Magma' },
    { label: 'Cividis', value: 'Cividis' },
    { label: 'Turbo', value: 'Turbo' },
    { label: 'Rainbow', value: 'Rainbow' },
    { label: 'Jet', value: 'Jet' },
  ];

  examples = [
    'sin(sqrt(x^2+y^2))',
    'x^2 - y^2',
    'cos(x)*sin(y)',
    'exp(-(x^2+y^2)/10)',
    'x*y',
    'sin(x)*cos(y)',
  ];

  error = signal<string | null>(null);
  hasPlot = signal(false);

  async ngAfterViewInit(): Promise<void> {
    await this.loadPlotly();
  }

  ngOnDestroy(): void {
    if (this.plotlyLoaded && this.plotContainer?.nativeElement) {
      try {
        Plotly.purge(this.plotContainer.nativeElement);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  private async loadPlotly(): Promise<void> {
    if (typeof Plotly !== 'undefined') {
      this.plotlyLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
      script.onload = () => {
        this.plotlyLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Plotly yüklenemedi'));
      document.head.appendChild(script);
    });
  }

  useExample(example: string): void {
    this.expression = example;
    this.plot();
  }

  async plot(): Promise<void> {
    if (!this.expression.trim()) {
      this.error.set('Lütfen bir fonksiyon girin');
      return;
    }

    if (this.xMin >= this.xMax) {
      this.error.set('x Min, x Max\'tan küçük olmalıdır');
      return;
    }

    if (this.yMin >= this.yMax) {
      this.error.set('y Min, y Max\'tan küçük olmalıdır');
      return;
    }

    this.error.set(null);

    try {
      await this.loadPlotly();

      const data = this.generateSurfaceData();
      this.renderPlot(data);
      this.hasPlot.set(true);
    } catch (e: any) {
      this.error.set(e.message || 'Grafik çizilirken hata oluştu');
    }
  }

  private generateSurfaceData(): { x: number[]; y: number[]; z: number[][] } {
    const xStep = (this.xMax - this.xMin) / this.resolution;
    const yStep = (this.yMax - this.yMin) / this.resolution;

    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];

    // Generate x values
    for (let i = 0; i <= this.resolution; i++) {
      x.push(this.xMin + i * xStep);
    }

    // Generate y values
    for (let j = 0; j <= this.resolution; j++) {
      y.push(this.yMin + j * yStep);
    }

    // Generate z values
    for (let j = 0; j <= this.resolution; j++) {
      const row: number[] = [];
      const yVal = y[j];

      for (let i = 0; i <= this.resolution; i++) {
        const xVal = x[i];
        const result = this.evaluator.evaluateWithTwoVariables(
          this.expression, 'x', xVal, 'y', yVal
        );

        if (result.success && result.value) {
          const zVal = result.value.toNumber();
          row.push(isFinite(zVal) ? zVal : NaN);
        } else {
          row.push(NaN);
        }
      }

      z.push(row);
    }

    return { x, y, z };
  }

  private renderPlot(data: { x: number[]; y: number[]; z: number[][] }): void {
    const trace = {
      type: 'surface',
      x: data.x,
      y: data.y,
      z: data.z,
      colorscale: this.colorscale,
      showscale: true,
      colorbar: {
        title: 'z',
        titleside: 'right',
      },
    };

    const layout = {
      title: {
        text: `z = ${this.expression}`,
        font: { family: 'Space Grotesk, sans-serif', size: 16 },
      },
      scene: {
        xaxis: { title: 'x' },
        yaxis: { title: 'y' },
        zaxis: { title: 'z' },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.2 },
        },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Source Sans 3, sans-serif' },
      margin: { t: 50, r: 30, b: 30, l: 30 },
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
    };

    Plotly.newPlot(this.plotContainer.nativeElement, [trace], layout, config);
  }

  clear(): void {
    this.expression = '';
    this.error.set(null);
    this.hasPlot.set(false);
    if (this.plotlyLoaded && this.plotContainer?.nativeElement) {
      Plotly.purge(this.plotContainer.nativeElement);
    }
  }
}
