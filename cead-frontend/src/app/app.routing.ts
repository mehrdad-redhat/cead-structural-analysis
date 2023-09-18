import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from './core/guards/app.guard';
import {
	ForgotPassComponent,
} from './features/user/components/forgot-pass/forgot-pass.component';
import {LoginComponent} from './features/user/components/login/login.component';
import {SignupComponent} from './features/user/components/signup/signup.component';
import {UserPage} from './features/user/user.page';



const routes: Routes = [
	// User routes
	{
		path: 'user',
		component: UserPage,
		children: [
			{
				path: 'login',
				component: LoginComponent,
			},
			{
				path: 'signup',
				component: SignupComponent,
			},
			{
				path: 'forgot-pass',
				component: ForgotPassComponent,
			},
			{
				path: '**',
				redirectTo: 'login',
			},
		],
	},

	// LAZY LOADS

	{
		path: 'dashboard',
		loadChildren: () =>
			import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
		canActivate: [AuthGuard]
	},

	// TOOLS
	{
		path: 'platform',
		children: [
			// STRUCTURAL ANALYSIS
			{
				path: 'structural-analysis',
				loadChildren: () =>
					import('./features/structural-analysis/structural-analysis.module').then(
						(m) => m.StructuralAnalysisModule
					),
			}
		],canActivate: [AuthGuard]
	},

	// Static pages
	{
		path: 'public',
		loadChildren: () =>
			import('./features/static-pages/static-pages.module').then(
				(m) => m.StaticPagesModule
			),
	},
	{
		path: '**',
		redirectTo: '/dashboard/structural-analysis'
	},
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes),
	],
	exports: [RouterModule]
})
export class AppRouting {}
