import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../components/shared';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
})
export class ToolsComponent {
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
