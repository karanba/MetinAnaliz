import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, Tag, Button, Dialog, Tooltip, Menu],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  infoDialogVisible = false;
  mobileMenuVisible = false;

  engineeringTools: MenuItem[] = [
    {
      label: 'Hesap Makinesi',
      icon: 'pi pi-calculator',
      command: () => this.router.navigate(['/tools/engineering/calculator'])
    },
    {
      label: 'Grafik Çizimi',
      icon: 'pi pi-chart-line',
      command: () => this.router.navigate(['/tools/engineering/graph'])
    },
    {
      label: 'STL Görüntüleyici',
      icon: 'pi pi-box',
      command: () => this.router.navigate(['/tools/engineering/stl-viewer'])
    }
  ];

  languageTools: MenuItem[] = [
    {
      label: 'Metin Analizi',
      icon: 'pi pi-file-edit',
      command: () => this.router.navigate(['/tools/language/text-analysis'])
    }
  ];

  constructor(private router: Router) {}

  showInfoDialog(): void {
    this.infoDialogVisible = true;
  }

  toggleMobileMenu(): void {
    this.mobileMenuVisible = !this.mobileMenuVisible;
  }

  closeMobileMenu(): void {
    this.mobileMenuVisible = false;
  }

  isEngineeringActive(): boolean {
    return this.router.url.startsWith('/tools/engineering');
  }

  isLanguageActive(): boolean {
    return this.router.url.startsWith('/tools/language');
  }
}
