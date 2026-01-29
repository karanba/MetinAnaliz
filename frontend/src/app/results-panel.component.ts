import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Statistics } from './models';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-results-panel',
  standalone: true,
  imports: [CommonModule, Card, Tag],
  templateUrl: './results-panel.component.html',
  styleUrls: ['./results-panel.component.scss']
})
export class ResultsPanelComponent {
  @Input() statistics: Statistics | null = null;
}
