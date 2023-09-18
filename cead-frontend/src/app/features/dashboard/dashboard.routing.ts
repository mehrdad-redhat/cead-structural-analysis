import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardPage} from './dashboard.page';
import {BlankPanel} from './panels/blank/blank.panel';
import {ProfilePanel} from './panels/profile/profile.panel';
import {SAPanel} from './panels/sa/sa-panel.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage,
    children: [
      {
        path: '',
        redirectTo: 'structural-analysis',
      },
      {
        path: 'profile',
        component: ProfilePanel,
        data: {title:'Profile',route:'profile'},
      },
      {
        path: 'structural-analysis',
        component: SAPanel,
        data: {title:'Structural Analysis',route:'structural-analysis'},
      },
      {
        path: 'foundation_design',
        component: BlankPanel,
        data: {title:'Foundation Design',route:'foundation_design'},
      },
      {
        path: 'allocation_design',
        component: BlankPanel,
	      data: {title:'Allocation Design',route:'allocation_design'},
      },
      {
        path: 'wind_pressure',
        component: BlankPanel,
	      data: {title:'Wind Pressure',route:'wind_pressure'},
      },
      {
        path: '**',
        redirectTo: 'structural-analysis',
      },
    ],
  },
];

@NgModule({
            imports: [RouterModule.forChild(routes)],
            exports: [RouterModule],
          })
export class DashboardRouting {}
