import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentenceInfo } from './models';

@Component({
  selector: 'app-sentence-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sentence-list.component.html',
  styleUrls: ['./sentence-list.component.scss']
})
export class SentenceListComponent {
  @Input() sentences: SentenceInfo[] | null = null;
}
