import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Tag],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
