import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Actions} from '@ngneat/effects-ng';
import * as Luxon from 'luxon';
import {MenuItem, MessageService} from 'primeng/api';
import {Subscription} from 'rxjs';
import {writeFile as XLSXWriteFile} from 'xlsx-js-style';
import {CentralService, StatusService} from '../../../../core/services';
import {ExcelService} from '../../services/excel.service';
import {
  StructuralAnalysisService,
} from '../../services/structural-analysis.service';
import {StructureQuery, StructureStore} from '../../state';
import {structureChangeSubmitted} from '../../state/structure.actions';
import {StructureData} from '../../types';

@Component({
  selector: 'c-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss'],
})
export class MenuBarComponent implements OnInit {

  // SELECTING FILE INPUT TAG
  @ViewChild('importFileInput')
  importFileInput!: ElementRef;

  resultModalToggle: boolean = false;
  analysisResults: any;
  solving: boolean = false;
  solvingProgress: number = 0;
  limited: boolean = false;
  alf: number;
  structureMenuItems: MenuItem[];

  private structureData: StructureData;
  private solveSub: Subscription;
  private solveTimer;

  constructor(
      private _centralService: CentralService,
      private structureQuery: StructureQuery,
      private actions$: Actions,
      private messageService: MessageService,
      private _statusService: StatusService,
      private excelService: ExcelService,
      private _saService: StructuralAnalysisService,
      private structureStore$: StructureStore,
  ) {
  }

  ngOnInit(): void {
    this.getCurrentUserStream();
    this.makeStructureMenuItems();
    this.getStructureStream();
    this.getAnalysisResults();
    this.alf = +localStorage.getItem('alf') || 0;
  }

// Methods
  solveModel() {
    if (this.limited) return;
    this.solving = true;
    this.solvingProgress = 0;
    this.solveTimer = setInterval(() => {
      if (this.solvingProgress > 98.62) {
        this.solvingProgress = 99;
        clearInterval(this.solveTimer);
      } else
        this.solvingProgress += 1.38;
    }, 1000);
    this._statusService.setStatus({
      text: 'Solving model',
      ready: false,
      error: false,
    });
    const structureId = Number(localStorage.getItem('structureId'));
    this.solveSub = this._saService.solveModel(structureId).subscribe({
      next: (data) => {
        if (data) {

          this._statusService.setStatus({
            text: 'Ready',
            ready: true,
            error: false,
          });
          // update api usage condition
          this._centralService.getUserFromServer();
          this.structureStore$.update(state => ({
            ...state,
            analysisResults: data,
          }));
          clearInterval(this.solveTimer);
          this.solvingProgress = 100;
          setTimeout(() => {
            this.resultModalToggle = !this.resultModalToggle;
            this.solving = false;
          }, 1500);
        }
      },
      error: (error) => {
        this._statusService.setStatus({
          text: 'Model not solved',
          ready: true,
          error: true,
        });
        this.solving = false;
        clearInterval(this.solveTimer);
        console.error(error);
      },
    });
  }

  cancelSolving() {
    this.solveSub.unsubscribe();
    clearInterval(this.solveTimer);
    this._statusService.setStatus({
      text: 'Ready',
      ready: true,
      error: false,
    });
    this.solving = false;
  }

  showResults() {
    if (!this.analysisResults) return;
    this.resultModalToggle = !this.resultModalToggle;
  }

  private getAnalysisResults() {
    this.structureQuery.selectAnalysisResults().subscribe({
      next: (data) => {
        this.analysisResults = data;
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  private getCurrentUserStream() {
    this._centralService.getCurrentUserStream().subscribe(user => {
      if (user)
        this.limited = user.notallowed_api;
    });
  }

  private makeStructureMenuItems() {
    this.structureMenuItems = [
      {
        label: 'Import',
        icon: 'pi pi-fw pi-folder-open',
        command: () => {
          this.importFileInput.nativeElement.click();
        },
      },
      {
        label: 'Export',
        icon: 'pi pi-fw pi-upload',
        command: () => {
          this.exportStructure();
        },
      },
    ];
  }

  private getStructureStream() {
    this.structureQuery.selectStructure().subscribe(
        structureData => {
          if (structureData)
            this.structureData = structureData;
          // if(!this.skycivModel&&this.structureData?.basics?.mast_a?.steelwork){
          //   this.updateModel();
          // }
        },
    );
  }

  /* IMPORT - EXPORT FROM EXCEL */

  importFile() {
    const inputFile = this.importFileInput.nativeElement.files[0];
    this.excelService.convertXLSFileToStructure(inputFile).
        then((structure: StructureData) => {
          this.importFileInput.nativeElement.value = null;
          this.actions$.dispatch(structureChangeSubmitted(
              {newStructureData: structure}));
        });

  }

  private exportStructure() {
    const workBook = this.excelService.convertStructureToXLSWorkBook();
    const DateTime = Luxon.DateTime;
    const currentDate = DateTime.fromJSDate(new Date()).
        toFormat('yyyy-MM-dd-H-mm-ss');
    XLSXWriteFile(
        workBook,
        `${this.structureData.info.structure_name}-${currentDate}.xlsx`,
        {bookType: 'xlsx', type: 'file'},
    );
  }

  saveScreenshot() {
    this._saService.requestForSavingScreenshot();
  }

  alfChanged($event: any) {
    console.log($event);
    localStorage.setItem('alf', $event);
  }
}
