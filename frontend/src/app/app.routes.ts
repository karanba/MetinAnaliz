import { Routes } from '@angular/router';
import { AnalyzePageComponent } from './analyze.page';
import { HelpPageComponent } from './help.page';

export const routes: Routes = [
  { path: '', redirectTo: 'text-analyze', pathMatch: 'full' },
  { path: 'text-analyze', component: AnalyzePageComponent },
  { path: 'help', component: HelpPageComponent },
  { path: '**', redirectTo: 'text-analyze' }
];
