import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Graph2dComponent } from './graph2d/graph2d.component';
import { Graph3dComponent } from './graph3d/graph3d.component';
import { PageHeaderComponent } from '../../../../components/shared';

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [
    CommonModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Graph2dComponent,
    Graph3dComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
})
export class GraphComponent {}
