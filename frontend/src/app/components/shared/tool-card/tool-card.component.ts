import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToolInfo } from '../../../models/tool.models';
import { ToolFavoritesService } from '../../../services/tool-favorites.service';

// Re-export ToolInfo for backward compatibility
export { ToolInfo } from '../../../models/tool.models';

@Component({
  selector: 'app-tool-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [routerLink]="tool().route" class="tool-card" [class.sun]="tool().color === 'sun'">
      <div class="tool-icon">
        <i [class]="'pi ' + tool().icon"></i>
      </div>
      <div class="tool-content">
        <h3>{{ tool().title }}</h3>
        <p>{{ tool().description }}</p>
      </div>
      <button
        class="tool-favorite"
        [class.active]="isFavorite()"
        (click)="toggleFavorite($event)"
      >
        <i [class]="isFavorite() ? 'pi pi-star-fill' : 'pi pi-star'"></i>
      </button>
      <div class="tool-arrow">
        <i class="pi pi-arrow-right"></i>
      </div>
    </a>
  `,
  styles: [`
    .tool-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid var(--stroke);
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;
      height: 100%;
      min-height: 80px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(31, 122, 140, 0.12);
        border-color: var(--accent);

        .tool-icon {
          transform: scale(1.05);
        }

        .tool-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .tool-favorite i {
          color: var(--muted);
        }
      }

      &.sun:hover {
        box-shadow: 0 8px 24px rgba(246, 170, 28, 0.15);
        border-color: var(--sun);
      }
    }

    .tool-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, rgba(31, 122, 140, 0.1) 0%, rgba(31, 122, 140, 0.05) 100%);
      border-radius: 12px;
      flex-shrink: 0;
      transition: transform 0.3s ease;

      i {
        font-size: 1.25rem;
        color: var(--accent);
      }

      .sun & {
        background: linear-gradient(135deg, rgba(246, 170, 28, 0.15) 0%, rgba(246, 170, 28, 0.05) 100%);

        i {
          color: var(--sun);
        }
      }
    }

    .tool-content {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--ink);
        margin: 0 0 2px;
      }

      p {
        font-size: 0.85rem;
        color: var(--muted);
        margin: 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .tool-favorite {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 50%;
      flex-shrink: 0;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0;

      i {
        font-size: 0.9rem;
        color: var(--stroke);
        transition: color 0.2s ease;
      }

      &:hover {
        background: rgba(246, 170, 28, 0.1);

        i {
          color: #f6aa1c;
        }
      }

      &.active i {
        color: #f6aa1c;
      }
    }

    .tool-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(31, 122, 140, 0.08);
      border-radius: 50%;
      flex-shrink: 0;
      opacity: 0;
      transform: translateX(-8px);
      transition: all 0.3s ease;

      i {
        font-size: 0.875rem;
        color: var(--accent);
      }

      .sun & {
        background: rgba(246, 170, 28, 0.1);

        i {
          color: var(--sun);
        }
      }
    }

    @media (max-width: 768px) {
      .tool-card {
        padding: 14px 16px;
        gap: 12px;
      }

      .tool-icon {
        width: 40px;
        height: 40px;

        i {
          font-size: 1.1rem;
        }
      }

      .tool-content {
        h3 {
          font-size: 0.95rem;
        }

        p {
          font-size: 0.8rem;
        }
      }

      .tool-favorite {
        width: 28px;
        height: 28px;

        i {
          font-size: 0.8rem;
        }
      }

      .tool-arrow {
        display: none;
      }
    }
  `]
})
export class ToolCardComponent {
  tool = input.required<ToolInfo>();

  private favoritesService = inject(ToolFavoritesService);

  isFavorite = computed(() => this.favoritesService.isFavorite(this.tool().route));

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.toggleFavorite(this.tool().route);
  }
}
