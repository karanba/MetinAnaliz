import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../shared';

@Component({
  selector: 'app-language-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="language-page">
      <app-page-header
        title="Dil Araçları"
        description="Metin analizi ve dil işleme araçları"
        [breadcrumbs]="[
          { label: 'Araçlar', route: '/tools' },
          { label: 'Dil' }
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

    .language-page {
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
export class LanguagePageComponent {
  tools: ToolInfo[] = [
    {
      title: 'Metin Analizi',
      description: 'Metinlerin okunabilirlik ve karmaşıklık analizini yapın. Kelime, cümle ve hece sayılarını hesaplayın.',
      icon: 'pi-file-edit',
      route: '/tools/language/text-analysis',
      color: 'accent'
    }
  ];
}
