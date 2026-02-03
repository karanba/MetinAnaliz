import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../components/shared';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
})
export class ToolsComponent {
  // Tools catalog grouped by section
  toolsCatalog = [
    {
      section: 'Dil Araçları',
      description: 'Metin analizi ve dil işleme araçları',
      icon: 'pi-language',
      route: '/tools/language',
      tools: [
        {
          title: 'Metin Analizi',
          description: 'Metinlerin okunabilirlik ve karmaşıklık analizini yapın',
          icon: 'pi-file-edit',
          route: '/tools/language/text-analysis',
          color: 'accent' as const
        }
      ]
    },
    {
      section: 'Mühendislik Araçları',
      description: 'Hesaplama ve görselleştirme araçları',
      icon: 'pi-cog',
      route: '/tools/engineering',
      tools: [
        {
          title: 'Hesap Makinesi',
          description: 'Bilimsel hesaplamalar ve matematiksel ifadeler',
          icon: 'pi-calculator',
          route: '/tools/engineering/calculator',
          color: 'sun' as const
        },
        {
          title: 'Grafik Çizimi',
          description: 'Matematiksel fonksiyonları 2D ve 3D görselleştirin',
          icon: 'pi-chart-line',
          route: '/tools/engineering/graph',
          color: 'sun' as const
        },
        {
          title: 'STL Görüntüleyici',
          description: '3D STL dosyalarını görüntüleyin ve analiz edin',
          icon: 'pi-box',
          route: '/tools/engineering/stl-viewer',
          color: 'sun' as const
        }
      ]
    },
    {
      section: 'Tasarım Araçları',
      description: 'Renk, tipografi ve görsel tasarım araçları',
      icon: 'pi-palette',
      route: '/tools/design',
      tools: [
        {
          title: 'Renk Dönüştürücü',
          description: 'Renk formatları, palet ve kontrast kontrolü',
          icon: 'pi-palette',
          route: '/tools/design/color-converter',
          color: 'accent' as const
        }
      ]
    }
  ];
}
