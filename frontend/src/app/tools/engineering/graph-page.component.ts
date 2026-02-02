import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Graph2dComponent } from '../../calculator/graph2d.component';
import { Graph3dComponent } from '../../calculator/graph3d.component';

@Component({
  selector: 'app-graph-page',
  standalone: true,
  imports: [
    CommonModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Graph2dComponent,
    Graph3dComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="graph-page">
      <div class="page-header">
        <h1>Grafik Çizimi</h1>
        <p class="meta">Matematiksel fonksiyonları 2D ve 3D olarak görselleştirin</p>
      </div>

      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">
            <i class="pi pi-chart-line"></i>
            <span>2D Grafik</span>
          </p-tab>
          <p-tab value="1">
            <i class="pi pi-box"></i>
            <span>3D Grafik</span>
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel value="0">
            <app-graph2d></app-graph2d>
          </p-tabpanel>

          <p-tabpanel value="1">
            <app-graph3d></app-graph3d>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .graph-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      margin-bottom: 8px;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--ink);
      margin: 0 0 8px;
    }

    .page-header .meta {
      margin: 0;
      color: var(--muted);
      font-size: 0.95rem;
    }

    :host ::ng-deep {
      .p-tablist {
        border-bottom: 1px solid var(--stroke);
        margin-bottom: 24px;
      }

      .p-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        font-weight: 600;
        color: var(--muted);
        transition: all 0.2s ease;

        &:hover {
          color: var(--ink);
        }

        &[data-p-active="true"] {
          color: var(--accent);
          border-bottom: 2px solid var(--accent);
        }

        i {
          font-size: 1.1rem;
        }
      }
    }

    @media (max-width: 768px) {
      .page-header h1 {
        font-size: 1.4rem;
      }

      :host ::ng-deep .p-tab {
        padding: 10px 12px;
        font-size: 0.9rem;

        span {
          display: none;
        }

        i {
          font-size: 1.2rem;
        }
      }
    }
  `],
})
export class GraphPageComponent {}
