import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ServiceWorkerModule} from '@angular/service-worker';
import {AkitaNgDevtools} from '@datorama/akita-ngdevtools';
import {EffectsNgModule} from '@ngneat/effects-ng';
import {MessageService} from 'primeng/api';
import {InplaceModule} from 'primeng/inplace';
import {ToastModule} from 'primeng/toast';
import {environment} from '../environments/environment';
import {AppComponent} from './app.component';

import {AppRouting} from './app.routing';
import {
  ErrorInterceptor,
  JwtInterceptor,
  UrlInterceptor,
} from './core/interceptors';
import {SkeletonModule} from './features/_skeleton/skeleton.module';
import {
  ExcelService,
} from './features/structural-analysis/services/excel.service';
import {
  FormSchemaService,
} from './features/structural-analysis/services/form-schema.service';
import {
  StructuralAnalysisGateway,
} from './features/structural-analysis/services/structural-analysis.gateway';
import {
  StructuralAnalysisService,
} from './features/structural-analysis/services/structural-analysis.service';
import {
  StructureQuery,
  StructureStore,
} from './features/structural-analysis/state';
import {
  StructureEffects,
} from './features/structural-analysis/state/structure.effects';
import {UserModule} from './features/user/user.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRouting,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    environment.production ? [] : AkitaNgDevtools.forRoot({maxAge: 20}),
    EffectsNgModule.forRoot([StructureEffects]),

    UserModule,
    SkeletonModule,
    ToastModule,
    InplaceModule,
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
              MessageService,
              StructuralAnalysisService,
              StructuralAnalysisGateway,
              StructureStore,
              StructureQuery,
              FormSchemaService,
              ExcelService,
            ],
            bootstrap: [AppComponent],
          })
export class AppModule {}

// TODO: check for unused Primeng modules in other modules
