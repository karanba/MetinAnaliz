import { Component, ChangeDetectionStrategy, input, AfterViewChecked, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header-wrapper" [class.with-ad]="showAd()">
      <div class="page-header">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          @for (item of breadcrumbs(); track item.label; let last = $last) {
            @if (item.route && !last) {
              <a [routerLink]="item.route" class="breadcrumb-link">{{ item.label }}</a>
              <span class="separator">/</span>
            } @else {
              <span class="breadcrumb-current">{{ item.label }}</span>
            }
          }
        </nav>
        <h1>{{ title() }}</h1>
        @if (description()) {
          <p class="meta">{{ description() }}</p>
        }
      </div>

      <!-- AdSense Banner - Right Side -->
      @if (showAd()) {
        <div class="ad-container" #adContainer>
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="ca-pub-7885050453788342"
               [attr.data-ad-slot]="adSlot()"
               data-ad-format="horizontal"
               data-full-width-responsive="true"></ins>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 8px;
    }

    .header-wrapper {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }

    .header-wrapper.with-ad .page-header {
      flex: 1;
      min-width: 0;
    }

    .page-header {
      margin-bottom: 4px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 0.8rem;
    }

    .breadcrumb-link {
      color: var(--muted);
      text-decoration: none;
      transition: color 0.2s ease;

      &:hover {
        color: var(--accent);
      }
    }

    .separator {
      color: var(--muted);
      opacity: 0.5;
    }

    .breadcrumb-current {
      color: var(--ink);
      font-weight: 500;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ink);
      margin: 0 0 4px;
      line-height: 1.2;
    }

    .meta {
      color: var(--muted);
      font-size: 0.875rem;
      margin: 0;
    }

    .ad-container {
      flex-shrink: 0;
      width: 728px;
      max-width: 100%;
      min-height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Tablet - smaller ad */
    @media (max-width: 1024px) {
      .ad-container {
        width: 468px;
        min-height: 60px;
      }
    }

    /* Mobile - stack vertically */
    @media (max-width: 768px) {
      .header-wrapper {
        flex-direction: column;
        gap: 12px;
      }

      .ad-container {
        width: 100%;
        min-height: 50px;
      }

      h1 {
        font-size: 1.25rem;
      }

      .meta {
        font-size: 0.8rem;
      }

      .breadcrumb {
        font-size: 0.75rem;
      }
    }
  `]
})
export class PageHeaderComponent implements AfterViewChecked {
  title = input.required<string>();
  description = input<string>();
  breadcrumbs = input<BreadcrumbItem[]>([]);
  showAd = input<boolean>(false);
  adSlot = input<string>('8441819013');

  @ViewChild('adContainer') adContainer?: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private adPushed = false;

  ngAfterViewChecked(): void {
    if (this.showAd() && !this.adPushed && this.adContainer) {
      this.loadAd();
    }
  }

  private loadAd(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        this.adPushed = true;
      }
    } catch (e) {
      console.warn('AdSense error:', e);
    }
  }
}
