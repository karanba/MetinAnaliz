import { Component, ChangeDetectionStrategy, inject, computed, signal, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, ToolCardComponent, ToolInfo } from '../../components/shared';
import { ToolRegistryService } from '../../services/tool-registry.service';
import { ToolFavoritesService } from '../../services/tool-favorites.service';

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
export class ToolsComponent implements AfterViewInit {
  private toolRegistry = inject(ToolRegistryService);
  private favoritesService = inject(ToolFavoritesService);
  private platformId = inject(PLATFORM_ID);
  private adPushed = false;

  searchQuery = signal('');

  isSearching = computed(() => this.searchQuery().trim().length > 0);

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

  searchResults = computed<ToolInfo[]>(() => {
    const query = this.searchQuery().trim();
    if (!query) return [];
    return this.toolRegistry.searchTools(query).map(tool => ({
      title: tool.title,
      description: tool.description,
      icon: 'pi-' + tool.icon,
      route: tool.route,
      color: tool.color
    }));
  });

  favoriteTools = computed<ToolInfo[]>(() => {
    const favRoutes = this.favoritesService.favorites();
    return this.toolRegistry.allTools()
      .filter(tool => favRoutes.has(tool.route))
      .map(tool => ({
        title: tool.title,
        description: tool.description,
        icon: 'pi-' + tool.icon,
        route: tool.route,
        color: tool.color
      }));
  });

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        try {
          if (!this.adPushed) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            this.adPushed = true;
          }
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }, 100);
    }
  }
}
