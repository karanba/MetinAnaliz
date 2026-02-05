import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent } from '../../components/shared';
import { ToolRegistryService } from '../../services/tool-registry.service';

@Component({
  selector: 'app-design',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design.component.html',
  styleUrls: ['./design.component.scss'],
})
export class DesignComponent {
  private toolRegistry = inject(ToolRegistryService);

  tools = this.toolRegistry.getToolInfoByCategory('design');
}
