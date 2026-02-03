import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../shared';

@Component({
  selector: 'app-engineering-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="engineering-page">
      <app-page-header
        title="Mühendislik Araçları"
        description="Hesaplama ve görselleştirme araçları"
        [breadcrumbs]="[
          { label: 'Araçlar', route: '/tools' },
          { label: 'Mühendislik' }
        ]"
      />

      <div class="tools-grid">
        @for (tool of tools; track tool.route) {
          <app-tool-card [tool]="tool" />
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .engineering-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    @media (max-width: 768px) {
      .tools-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }
  `]
})
export class EngineeringPageComponent {
  tools: ToolInfo[] = [
    {
      title: 'Hesap Makinesi',
      description: 'Bilimsel hesaplamalar ve matematiksel ifadeler için gelişmiş hesap makinesi',
      icon: 'pi-calculator',
      route: '/tools/engineering/calculator',
      color: 'accent'
    },
    {
      title: 'Grafik Çizimi',
      description: 'Matematiksel fonksiyonları 2D ve 3D olarak görselleştirin',
      icon: 'pi-chart-line',
      route: '/tools/engineering/graph',
      color: 'sun'
    },
    {
      title: 'STL Görüntüleyici',
      description: '3D STL dosyalarını görüntüleyin, ölçün ve analiz edin',
      icon: 'pi-box',
      route: '/tools/engineering/stl-viewer',
      color: 'accent'
    }
  ];
}
