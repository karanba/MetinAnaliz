import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../components/shared';

@Component({
  selector: 'app-design',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design.component.html',
  styleUrls: ['./design.component.scss'],
})
export class DesignComponent {
  tools: ToolInfo[] = [
    {
      title: 'Renk Dönüştürücü',
      description: 'Renk formatları arası dönüşüm, palet oluşturma ve kontrast kontrolü',
      icon: 'pi-palette',
      route: '/tools/design/color-converter',
      color: 'sun'
    }
  ];
}
