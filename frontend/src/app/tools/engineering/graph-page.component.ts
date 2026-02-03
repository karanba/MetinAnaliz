import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Graph2dComponent } from '../../component/graph2d/graph2d.component';
import { Graph3dComponent } from '../../component/graph3d/graph3d.component';
import { PageHeaderComponent } from '../../shared';

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
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="graph-page">
      <app-page-header
        title="Grafik Çizimi"
        description="Matematiksel fonksiyonları 2D ve 3D olarak görselleştirin"
        [breadcrumbs]="[
          { label: 'Araçlar', route: '/tools' },
          { label: 'Mühendislik', route: '/tools/engineering' },
          { label: 'Grafik Çizimi' }
        ]"
      />

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
      gap: 16px;
    }

    :host ::ng-deep {
      .p-tablist {
        border-bottom: 1px solid var(--stroke);
        margin-bottom: 16px;
      }

      .p-tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
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
