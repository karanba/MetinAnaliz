import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../components/shared';

@Component({
  selector: 'app-engineering',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './engineering.component.html',
  styleUrls: ['./engineering.component.scss'],
})
export class EngineeringComponent {
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
