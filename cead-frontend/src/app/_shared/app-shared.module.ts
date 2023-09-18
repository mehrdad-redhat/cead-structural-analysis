import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {SharedModule} from 'primeng/api';
import {InplaceModule} from 'primeng/inplace';
import {InputTextModule} from 'primeng/inputtext';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {
  BreadcrumbComponent,
  ModalComponent,
  StatusComponent,
  TabelComponent,
} from './components';
import {
  CloseByOutsideClickDirective,
} from './directives/close-by-outside-click.directive';
import {FixedSizeDirective} from './directives/fixed-size.directive';
import {NgModelDebounced} from './directives/input-debounce.directive';
import {
  OnlyNumbersAllowedDirective,
} from './directives/only-numbers-allowed.directive';
import {PipesModule} from './pipes/pipes.module';



@NgModule({
            imports: [
              CommonModule, PipesModule, ProgressSpinnerModule, RouterModule, InplaceModule,
              InputTextModule, FormsModule, SharedModule,
            ],
            declarations: [
              OnlyNumbersAllowedDirective,
              BreadcrumbComponent,
              TabelComponent,
              ModalComponent,
              StatusComponent,
              FixedSizeDirective,
              CloseByOutsideClickDirective,
              NgModelDebounced
            ],
            exports: [
              PipesModule,
              OnlyNumbersAllowedDirective,
              BreadcrumbComponent,
              TabelComponent,
              ModalComponent,
              StatusComponent,
              FixedSizeDirective,
              CloseByOutsideClickDirective,
              NgModelDebounced
            ],
            providers: [],
          })
export class AppSharedModule {}
