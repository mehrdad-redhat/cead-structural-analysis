import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StructuralAnalysisPage } from './structural-analysis.page';

const routes: Routes = [
	{
		path: ':struct_id',
		component: StructuralAnalysisPage,
		data:{title:'Structural Analysis',route:'structural-analysis-inner'}
	},
	{
		path: '',
		redirectTo: '/dashboard/structural-analysis',
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class StructuralAnalysisRouting {}
