import { Injectable, signal } from '@angular/core';

export interface HistoryEntry {
  id: number;
  expression: string;
  result: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly MAX_ENTRIES = 50;
  private nextId = 1;

  readonly entries = signal<HistoryEntry[]>([]);

  addEntry(expression: string, result: string): void {
    const entry: HistoryEntry = {
      id: this.nextId++,
      expression: expression.trim(),
      result,
      timestamp: new Date(),
    };

    this.entries.update(entries => {
      const newEntries = [entry, ...entries];
      // Keep only the last MAX_ENTRIES
      return newEntries.slice(0, this.MAX_ENTRIES);
    });
  }

  clearHistory(): void {
    this.entries.set([]);
    this.nextId = 1;
  }

  removeEntry(id: number): void {
    this.entries.update(entries => entries.filter(e => e.id !== id));
  }

  getEntryByIndex(index: number): HistoryEntry | undefined {
    return this.entries()[index];
  }
}
