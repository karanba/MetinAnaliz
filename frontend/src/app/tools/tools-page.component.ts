import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../shared';

@Component({
  selector: 'app-tools-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tools-page">
      <app-page-header
        title="Araçlar"
        description="Metin analizi ve mühendislik araçlarına göz atın"
        [breadcrumbs]="[{ label: 'Araçlar' }]"
      />

      <div class="tools-grid">
        @for (category of categories; track category.route) {
          <app-tool-card [tool]="category" />
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .tools-page {
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
export class ToolsPageComponent {
  categories: ToolInfo[] = [
    {
      title: 'Dil Araçları',
      description: 'Metin analizi ve dil işleme araçları',
      icon: 'pi-language',
      route: '/tools/language',
      color: 'accent'
    },
    {
      title: 'Mühendislik Araçları',
      description: 'Hesaplama ve görselleştirme araçları',
      icon: 'pi-cog',
      route: '/tools/engineering',
      color: 'sun'
    }
  ];
}
