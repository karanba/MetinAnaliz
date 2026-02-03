import { Routes } from '@angular/router';
import { AnalyzeComponent } from './sections/language/tools/analyze/analyze.component';
import { HelpComponent } from './help/help.component';
import { HelpOverviewComponent } from './help/help-overview.component';
import { HelpUsageComponent } from './help/help-usage.component';
import { HelpFaqComponent } from './help/help-faq.component';
import { CalculatorComponent } from './sections/engineering/tools/calculator/calculator.component';
import { GraphComponent } from './sections/engineering/tools/graph/graph.component';
import { StlViewerComponent } from './sections/engineering/tools/stl-viewer/stl-viewer.component';
import { ToolsComponent } from './sections/tools/tools.component';
import { EngineeringComponent } from './sections/engineering/engineering.component';
import { LanguageComponent } from './sections/language/language.component';
import { DesignComponent } from './sections/design/design.component';
import { ColorConverterComponent } from './sections/design/tools/color-converter/color-converter.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tools', pathMatch: 'full' },

  // Tools Landing
  { path: 'tools', component: ToolsComponent },

  // Language Tools
  { path: 'tools/language', component: LanguageComponent },
  { path: 'tools/language/text-analysis', component: AnalyzeComponent },

  // Engineering Tools
  { path: 'tools/engineering', component: EngineeringComponent },
  { path: 'tools/engineering/calculator', component: CalculatorComponent },
  { path: 'tools/engineering/graph', component: GraphComponent },
  { path: 'tools/engineering/stl-viewer', component: StlViewerComponent },

  // Design Tools
  { path: 'tools/design', component: DesignComponent },
  { path: 'tools/design/color-converter', component: ColorConverterComponent },

  // Help
  {
    path: 'help',
    component: HelpComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: HelpOverviewComponent },
      { path: 'usage', component: HelpUsageComponent },
      { path: 'faq', component: HelpFaqComponent },
    ],
  },

  // Redirects for old routes
  { path: 'text-analyze', redirectTo: 'tools/language/text-analysis', pathMatch: 'full' },
  { path: 'calc', redirectTo: 'tools/engineering/calculator', pathMatch: 'full' },

  { path: '**', redirectTo: 'tools' }
];
