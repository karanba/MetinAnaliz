import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent } from '../../components/shared';
import { ToolRegistryService } from '../../services/tool-registry.service';

@Component({
  selector: 'app-engineering',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './engineering.component.html',
  styleUrls: ['./engineering.component.scss'],
})
export class EngineeringComponent {
  private toolRegistry = inject(ToolRegistryService);

  tools = this.toolRegistry.getToolInfoByCategory('engineering');
}
