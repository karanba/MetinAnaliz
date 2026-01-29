import { Routes } from '@angular/router';
import { AnalyzePageComponent } from './analyze.page';

export const routes: Routes = [
  { path: '', component: AnalyzePageComponent },
  { path: '**', redirectTo: '' }
];
