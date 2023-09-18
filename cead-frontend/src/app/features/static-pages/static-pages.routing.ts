import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HelpPage } from './help/help.page';
import { PrivacyPage } from './privacy/privacy.page';
import { TermsPage } from './terms/terms.page';
import { StaticPagesPage } from './static-pages.page';

const routes: Routes = [
	{
		path: '',
		component: StaticPagesPage,
		children: [
			{
				path: 'help',
				component: HelpPage,
			},
			{
				path: 'privacy',
				component: PrivacyPage,
			},
			{
				path: 'terms',
				component: TermsPage,
			},
			{
				path: '**',
				redirectTo: 'help',
			},
		],
	},
	// TODO: it must redirect to 404 page
	{
		path: '**',
		redirectTo: '',
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class StaticPagesRouting {}
