import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../components/shared';

@Component({
  selector: 'app-language',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss'],
})
export class LanguageComponent {
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
