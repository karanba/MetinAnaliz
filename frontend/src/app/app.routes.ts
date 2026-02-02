import { Routes } from '@angular/router';
import { AnalyzePageComponent } from './analyze.page';
import { HelpPageComponent } from './help.page';
import { HelpOverviewPageComponent } from './help-overview.page';
import { HelpUsagePageComponent } from './help-usage.page';
import { HelpFaqPageComponent } from './help-faq.page';
import { CalculatorPageComponent } from './calculator/calculator-page.component';
import { GraphPageComponent } from './tools/engineering/graph-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tools/language/text-analysis', pathMatch: 'full' },

  // Language Tools
  { path: 'tools/language/text-analysis', component: AnalyzePageComponent },

  // Engineering Tools
  { path: 'tools/engineering/calculator', component: CalculatorPageComponent },
  { path: 'tools/engineering/graph', component: GraphPageComponent },

  // Help
  {
    path: 'help',
    component: HelpPageComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: HelpOverviewPageComponent },
      { path: 'usage', component: HelpUsagePageComponent },
      { path: 'faq', component: HelpFaqPageComponent },
    ],
  },

  // Redirects for old routes
  { path: 'text-analyze', redirectTo: 'tools/language/text-analysis', pathMatch: 'full' },
  { path: 'calc', redirectTo: 'tools/engineering/calculator', pathMatch: 'full' },

  { path: '**', redirectTo: 'tools/language/text-analysis' }
];
