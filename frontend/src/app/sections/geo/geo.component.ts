import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent } from '../../components/shared';
import { ToolRegistryService } from '../../services/tool-registry.service';

@Component({
  selector: 'app-geo',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './geo.component.html',
  styleUrls: ['./geo.component.scss'],
})
export class GeoComponent {
  private toolRegistry = inject(ToolRegistryService);

  tools = this.toolRegistry.getToolInfoByCategory('geo');
}
