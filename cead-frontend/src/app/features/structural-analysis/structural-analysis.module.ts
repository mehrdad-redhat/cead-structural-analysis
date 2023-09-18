import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {DialogModule} from 'primeng/dialog';
import {DividerModule} from 'primeng/divider';
import {DropdownModule} from 'primeng/dropdown';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputSwitchModule} from 'primeng/inputswitch';
import {InputTextModule} from 'primeng/inputtext';
import {MenuModule} from 'primeng/menu';
import {MenubarModule} from 'primeng/menubar';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {ProgressBarModule} from 'primeng/progressbar';
import {RippleModule} from 'primeng/ripple';
import {TableModule} from 'primeng/table';
import {TabViewModule} from 'primeng/tabview';
import {TooltipModule} from 'primeng/tooltip';
import {AppSharedModule} from '../../_shared/app-shared.module';
import {
  ErrorInterceptor,
  JwtInterceptor,
  UrlInterceptor,
} from '../../core/interceptors';
import {
  AnalysisResultComponent,
  EquipmentTableComponent,
  FlCaseComponent,
  FlCombComponent,
  FormComponent,
  PropertiesBarComponent,
  SteelworkFilterPipe,
  SwUtilComponent,
  WrDispComponent,
} from './components';
import {MenuBarComponent} from './components/menu-bar/menu-bar.component';
import {
  PropertiesPanel,
  RenderPanel,
  StructureEquipmentPanel,
  StructureInformationPanel,
} from './panels';
import {StructuralAnalysisPage} from './structural-analysis.page';
import {StructuralAnalysisRouting} from './structural-analysis.routing';

@NgModule({
  declarations: [
    // COMPONENTS
    StructuralAnalysisPage,
    PropertiesBarComponent,
    EquipmentTableComponent,
    FormComponent,
    AnalysisResultComponent,
    SwUtilComponent,
    WrDispComponent,
    FlCombComponent,
    FlCaseComponent,
    // PANELS
    StructureEquipmentPanel,
    StructureInformationPanel,
    PropertiesPanel,
    RenderPanel,
    //PIPE
    SteelworkFilterPipe,
    MenuBarComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    StructuralAnalysisRouting,
    ButtonModule,
    RippleModule,
    TooltipModule,
    AppSharedModule,
    InputTextModule,
    FormsModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    TableModule,
    TabViewModule,
    ProgressBarModule,
    InputSwitchModule,
    DividerModule,
    OverlayPanelModule,
    ConfirmPopupModule,
    MenubarModule,
    MenuModule,
    ConfirmDialogModule,
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
    // StructuralAnalysisService,
    // StructuralAnalysisGateway,
    // StructureStore,
    // StructureQuery,
    // FormSchemaService,
    // ExcelService
  ],
})
export class StructuralAnalysisModule {
}
