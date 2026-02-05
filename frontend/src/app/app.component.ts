import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';
import { Menu } from 'primeng/menu';
import { ToolRegistryService } from './services/tool-registry.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, Tag, Button, Dialog, Tooltip, Menu],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private toolRegistry = inject(ToolRegistryService);

  infoDialogVisible = false;
  mobileMenuVisible = false;

  // Navigation menus from central registry
  languageTools = this.toolRegistry.getMenuItems('language');
  engineeringTools = this.toolRegistry.getMenuItems('engineering');
  designTools = this.toolRegistry.getMenuItems('design');
  geoTools = this.toolRegistry.getMenuItems('geo');
  fileTools = this.toolRegistry.getMenuItems('file');

  // Section data for mobile nav and info dialog
  sections = this.toolRegistry.sections;

  showInfoDialog(): void {
    this.infoDialogVisible = true;
  }

  toggleMobileMenu(): void {
    this.mobileMenuVisible = !this.mobileMenuVisible;
  }

  closeMobileMenu(): void {
    this.mobileMenuVisible = false;
  }

  isLanguageActive(): boolean {
    return this.toolRegistry.isSectionActive('language');
  }

  isEngineeringActive(): boolean {
    return this.toolRegistry.isSectionActive('engineering');
  }

  isDesignActive(): boolean {
    return this.toolRegistry.isSectionActive('design');
  }

  isGeoActive(): boolean {
    return this.toolRegistry.isSectionActive('geo');
  }

  isFileActive(): boolean {
    return this.toolRegistry.isSectionActive('file');
  }
}
