import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Tag, Button, Dialog, Tooltip],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  infoDialogVisible = false;

  showInfoDialog(): void {
    this.infoDialogVisible = true;
  }
}
