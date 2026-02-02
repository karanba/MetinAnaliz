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

interface PlotData {
  x: number[];
  y: number[];
}

@Component({
  selector: 'app-graph2d',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputText, InputNumber, Card, Select, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="graph2d-container">
      <p-card class="controls-card">
        <div class="controls-header">
          <h3><i class="pi pi-chart-line"></i> 2D Grafik</h3>
          <p class="meta">f(x) formatında fonksiyon girin</p>
        </div>

        <div class="controls-grid">
          <div class="field full-width">
            <label for="expression">f(x) =</label>
            <input
              id="expression"
              type="text"
              pInputText
              [(ngModel)]="expression"
              placeholder="sin(x), x^2, exp(-x^2), ..."
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
            <label for="samples">Çözünürlük</label>
            <p-select
              id="samples"
              [options]="sampleOptions"
              [(ngModel)]="samples"
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
            <i class="pi pi-chart-line"></i>
            <p>Grafik burada görünecek</p>
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

    .graph2d-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 1200px) {
      .graph2d-container {
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
      font-size: 0.85rem;
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
      min-height: 400px;
      position: relative;
    }

    .plot-container {
      width: 100%;
      height: 500px;
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
        height: 350px;
      }
    }
  `],
})
export class Graph2dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('plotContainer') plotContainer!: ElementRef<HTMLDivElement>;

  private readonly evaluator = inject(ExpressionEvaluatorService);
  private plotlyLoaded = false;

  expression = '';
  xMin = -10;
  xMax = 10;
  samples = 500;

  sampleOptions = [
    { label: 'Düşük (100)', value: 100 },
    { label: 'Orta (500)', value: 500 },
    { label: 'Yüksek (1000)', value: 1000 },
    { label: 'Çok Yüksek (2000)', value: 2000 },
  ];

  examples = [
    'sin(x)',
    'x^2',
    'cos(x)*exp(-x^2/10)',
    '1/x',
    'tan(x)',
    'sqrt(abs(x))',
    'sin(x)/x',
    'x^3 - 3x',
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

    this.error.set(null);

    try {
      await this.loadPlotly();

      const data = this.generatePlotData();
      if (data.x.length === 0) {
        this.error.set('Geçerli veri noktası üretilemedi');
        return;
      }

      this.renderPlot(data);
      this.hasPlot.set(true);
    } catch (e: any) {
      this.error.set(e.message || 'Grafik çizilirken hata oluştu');
    }
  }

  private generatePlotData(): PlotData {
    const step = (this.xMax - this.xMin) / this.samples;
    const x: number[] = [];
    const y: number[] = [];

    let prevY: number | null = null;
    const discontinuityThreshold = 1000;

    for (let i = 0; i <= this.samples; i++) {
      const xVal = this.xMin + i * step;
      const result = this.evaluator.evaluateWithVariable(this.expression, 'x', xVal);

      if (result.success && result.value) {
        const yVal = result.value.toNumber();

        // Check for discontinuities
        if (isFinite(yVal)) {
          // If there's a huge jump, insert NaN to break the line
          if (prevY !== null && Math.abs(yVal - prevY) > discontinuityThreshold) {
            x.push(xVal);
            y.push(NaN);
          }
          x.push(xVal);
          y.push(yVal);
          prevY = yVal;
        } else {
          // Insert NaN for infinite values to break the line
          x.push(xVal);
          y.push(NaN);
          prevY = null;
        }
      } else {
        // Insert NaN for errors to break the line
        x.push(xVal);
        y.push(NaN);
        prevY = null;
      }
    }

    return { x, y };
  }

  private renderPlot(data: PlotData): void {
    const trace = {
      x: data.x,
      y: data.y,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#1f7a8c',
        width: 2,
      },
      name: `f(x) = ${this.expression}`,
      connectgaps: false,
    };

    const layout = {
      title: {
        text: `f(x) = ${this.expression}`,
        font: { family: 'Space Grotesk, sans-serif', size: 16 },
      },
      xaxis: {
        title: 'x',
        gridcolor: 'rgba(0,0,0,0.1)',
        zerolinecolor: 'rgba(0,0,0,0.3)',
        zerolinewidth: 2,
      },
      yaxis: {
        title: 'y',
        gridcolor: 'rgba(0,0,0,0.1)',
        zerolinecolor: 'rgba(0,0,0,0.3)',
        zerolinewidth: 2,
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(255,255,255,0.8)',
      font: { family: 'Source Sans 3, sans-serif' },
      margin: { t: 50, r: 30, b: 50, l: 60 },
      hovermode: 'closest',
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
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
