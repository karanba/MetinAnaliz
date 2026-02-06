import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToolFavoritesService {
  private readonly STORAGE_KEY = 'tool-favorites';
  private readonly _favorites = signal<Set<string>>(this.loadFavorites());

  readonly favorites = this._favorites.asReadonly();
  readonly count = computed(() => this._favorites().size);

  isFavorite(route: string): boolean {
    return this._favorites().has(route);
  }

  toggleFavorite(route: string): void {
    const current = new Set(this._favorites());
    if (current.has(route)) {
      current.delete(route);
    } else {
      current.add(route);
    }
    this._favorites.set(current);
    this.saveFavorites(current);
  }

  private loadFavorites(): Set<string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveFavorites(favorites: Set<string>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...favorites]));
  }
}
