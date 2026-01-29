import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentenceInfo } from './models';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-sentence-list',
  standalone: true,
  imports: [CommonModule, Card, Chip, Tag],
  templateUrl: './sentence-list.component.html',
  styleUrls: ['./sentence-list.component.scss']
})
export class SentenceListComponent {
  @Input() sentences: SentenceInfo[] | null = null;
}
