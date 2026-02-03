import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Statistics } from '../../../../models/models';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-results-panel',
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: './results-panel.component.html',
  styleUrls: ['./results-panel.component.scss']
})
export class ResultsPanelComponent {
  @Input() statistics: Statistics | null = null;

  getScoreLabel(): string {
    if (!this.statistics) {
      return 'YOD Değeri';
    }

    switch (this.statistics.analysis_type) {
      case 'yod':
        return 'YOD Değeri';
      case 'atesman':
        return 'Ateşman Skoru';
      case 'cetinkaya':
        return 'Çetinkaya-Uzun';
      default:
        return 'Okunabilirlik Skoru';
    }
  }
}
