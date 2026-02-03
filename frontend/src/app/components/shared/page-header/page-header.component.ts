import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  `,
  styles: [`
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

    @media (max-width: 768px) {
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
export class PageHeaderComponent {
  title = input.required<string>();
  description = input<string>();
  breadcrumbs = input<BreadcrumbItem[]>([]);
}
