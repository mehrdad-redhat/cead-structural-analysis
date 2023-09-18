import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaticPagesRouting } from './static-pages.routing';
import { PrivacyPage } from './privacy/privacy.page';
import { TermsPage } from './terms/terms.page';
import { HelpPage } from './help/help.page';
import { StaticPagesPage } from './static-pages.page';
import { SkeletonModule } from '../_skeleton/skeleton.module';

@NgModule({
	declarations: [PrivacyPage, TermsPage, HelpPage, StaticPagesPage],
	imports: [CommonModule, StaticPagesRouting, SkeletonModule],
})
export class StaticPagesModule {}
