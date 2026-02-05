import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, ToolCardComponent } from '../../components/shared';
import { ToolRegistryService } from '../../services/tool-registry.service';

@Component({
  selector: 'app-file',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
})
export class FileComponent {
  private toolRegistry = inject(ToolRegistryService);

  tools = this.toolRegistry.getToolInfoByCategory('file');
}
