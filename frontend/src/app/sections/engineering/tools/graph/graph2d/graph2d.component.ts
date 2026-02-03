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

interface PlotData {
  x: number[];
  y: number[];
}

@Component({
  selector: 'app-graph2d',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputText, InputNumber, Card, Select, Message, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph2d.component.html',
  styleUrls: ['./graph2d.component.scss'],
})
export class Graph2dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('plotContainer') plotContainer!: ElementRef<HTMLDivElement>;

  private readonly evaluator = inject(ExpressionEvaluatorService);
  private plotlyLoaded = false;

  expression = '';
  xMin = -10;
  xMax = 10;
  samples = 500;

  isFullscreen = signal(false);

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

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isFullscreen()) {
      this.isFullscreen.set(false);
      this.resizePlot();
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
    // Give time for DOM to update before resizing
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
