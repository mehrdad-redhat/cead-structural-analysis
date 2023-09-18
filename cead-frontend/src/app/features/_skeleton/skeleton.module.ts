import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {KnobModule} from 'primeng/knob';
import {RippleModule} from 'primeng/ripple';
import {TooltipModule} from 'primeng/tooltip';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { UnitSystemComponent } from './footer/unit-system/unit-system.component';
import { AppSharedModule } from '../../_shared/app-shared.module';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
	declarations: [FooterComponent, HeaderComponent, UnitSystemComponent],
            imports: [
              CommonModule, AppSharedModule, RouterModule, InputTextModule, TooltipModule, ButtonModule,
              RippleModule, KnobModule, FormsModule,
            ],

	exports: [FooterComponent, HeaderComponent],
})
export class SkeletonModule {}
