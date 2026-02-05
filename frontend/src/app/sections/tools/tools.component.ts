import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../components/shared';
import { ToolRegistryService } from '../../services/tool-registry.service';

interface CatalogSection {
  section: string;
  description: string;
  icon: string;
  route: string;
  tools: ToolInfo[];
}

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
})
export class ToolsComponent {
  private toolRegistry = inject(ToolRegistryService);

  // Transform sections to catalog format for template compatibility
  toolsCatalog = computed<CatalogSection[]>(() =>
    this.toolRegistry.sections().map(section => ({
      section: section.title,
      description: section.description,
      icon: 'pi-' + section.icon,
      route: section.route,
      tools: section.tools.map(tool => ({
        title: tool.title,
        description: tool.description,
        icon: 'pi-' + tool.icon,
        route: tool.route,
        color: tool.color
      }))
    }))
  );
}
