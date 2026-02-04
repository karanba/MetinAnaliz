import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent } from '../../components/shared';
import { ToolRegistryService } from '../../services/tool-registry.service';

@Component({
  selector: 'app-language',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss'],
})
export class LanguageComponent {
  private toolRegistry = inject(ToolRegistryService);

  tools = this.toolRegistry.getToolInfoByCategory('language');
}
