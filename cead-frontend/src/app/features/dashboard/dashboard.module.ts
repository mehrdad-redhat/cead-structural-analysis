import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {DropdownModule} from 'primeng/dropdown';
import {FieldsetModule} from 'primeng/fieldset';
import {InputTextModule} from 'primeng/inputtext';
import {KnobModule} from 'primeng/knob';
import {PanelModule} from 'primeng/panel';
import {PasswordModule} from 'primeng/password';
import {RippleModule} from 'primeng/ripple';
import {SelectButtonModule} from 'primeng/selectbutton';
import {TableModule} from 'primeng/table';
import {AppSharedModule} from '../../_shared/app-shared.module';
import {
	ErrorInterceptor,
	JwtInterceptor,
	UrlInterceptor,
} from '../../core/interceptors';
import {SkeletonModule} from '../_skeleton/skeleton.module';
import {UserService} from '../user/user.service';
import {NewBarComponent} from './components/new-bar/new-bar.component';
import {NewEditComponent} from './components/new-edit/new-edit.component';
import {
	ProjectsListComponent,
} from './components/projects-list/projects-list.component';
import {SidebarComponent} from './components/sidebar/sidebar.component';
import {DashboardGateway} from './dashboard.gateway';
import {DashboardPage} from './dashboard.page';

import {DashboardRouting} from './dashboard.routing';
import {DashboardService} from './dashboard.service';
import {BlankPanel} from './panels/blank/blank.panel';
import {ProfilePanel} from './panels/profile/profile.panel';
import {SAPanel} from './panels/sa/sa-panel.component';

@NgModule({
	declarations: [
		SidebarComponent,
		NewBarComponent,
		ProjectsListComponent,
		DashboardPage,
		NewEditComponent,
		SAPanel,
		ProfilePanel,
		BlankPanel,
	],
            imports: [
              CommonModule,
              HttpClientModule,
              DashboardRouting,
              SkeletonModule,
              KnobModule,
              FormsModule,
              TableModule,
              ButtonModule,
              RippleModule,
              DialogModule,
              InputTextModule,
              DropdownModule,
              SelectButtonModule,
              AppSharedModule,
              PasswordModule,
              PanelModule,
              FieldsetModule,
            ],
	providers: [
		{
			provide: HTTP_INTERCEPTORS,
			useClass: UrlInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: JwtInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: ErrorInterceptor,
			multi: true,
		},
		DashboardService, DashboardGateway, UserService,
	],
})
export class DashboardModule {}
