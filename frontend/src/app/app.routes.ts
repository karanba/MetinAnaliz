import { Routes } from '@angular/router';
import { AnalyzePageComponent } from './analyze.page';
import { HelpPageComponent } from './help.page';
import { HelpOverviewPageComponent } from './help-overview.page';
import { HelpUsagePageComponent } from './help-usage.page';
import { HelpFaqPageComponent } from './help-faq.page';
import { CalculatorPageComponent } from './calculator/calculator-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'text-analyze', pathMatch: 'full' },
  { path: 'text-analyze', component: AnalyzePageComponent },
  { path: 'calc', component: CalculatorPageComponent },
  {
    path: 'help',
    component: HelpPageComponent,
    children: [
      { path: '', redirectTo: 'genel', pathMatch: 'full' },
      { path: 'genel', component: HelpOverviewPageComponent },
      { path: 'kullanim', component: HelpUsagePageComponent },
      { path: 'sss', component: HelpFaqPageComponent },
    ],
  },
  { path: '**', redirectTo: 'text-analyze' }
];
