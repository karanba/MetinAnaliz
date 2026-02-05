import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  inject,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Card } from 'primeng/card';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { ExpressionEvaluatorService } from '../../../../../services/expression-evaluator.service';

declare const Plotly: any;

@Component({
  selector: 'app-graph3d',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputText, InputNumber, Card, Select, Message, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph3d.component.html',
  styleUrls: ['./graph3d.component.scss'],
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

  isFullscreen = signal(false);

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

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isFullscreen()) {
      this.isFullscreen.set(false);
      this.resizePlot();
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
    setTimeout(() => this.resizePlot(), 50);
  }

  private resizePlot(): void {
    if (this.plotlyLoaded && this.plotContainer?.nativeElement) {
      Plotly.Plots.resize(this.plotContainer.nativeElement);
    }
  }

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
