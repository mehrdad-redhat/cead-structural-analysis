import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {StateHistoryPlugin} from '@datorama/akita';
import {Actions} from '@ngneat/effects-ng';
import {ConfirmationService} from 'primeng/api';
import {FormSchemaService} from '../../services/form-schema.service';
import {StructureQuery} from '../../state';
import {structureChangeSubmitted} from '../../state/structure.actions';
import {
  ACTIVE_STATUS,
  DISPLAY_TYPE,
  FormModel,
  INPUT_TYPE,
  Schema,
  SteelSupport,
  StructureData,
  StructureType,
} from '../../types';

@Component({
  selector: 'c-equipment-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  providers: [ConfirmationService],
})
export class FormComponent implements OnInit, OnChanges {

  @Input('equipmentIndex') index: number;
  @Input('newEquipment') new: boolean;
  @Input('formSubject') subject: string;

  /**
   * Importing enums for using in HTML file
   */
  INPUT_TYPE = INPUT_TYPE;
  DISPLAY_TYPE = DISPLAY_TYPE;
  ACTIVE_STATUS = ACTIVE_STATUS;

  schema: Schema;
  model: FormModel;
  structureData: StructureData;
  changeKeyTimeStamp: any;
  private structureStateHistory: StateHistoryPlugin;
  private checkList: any;

  constructor(
      private actions$: Actions,
      private schemaService: FormSchemaService,
      private structureQuery: StructureQuery,
      private confirmationService: ConfirmationService,
  ) {
  }

  ngOnInit() {
    this.getStructureStream();
    this.getFormSchema();
    this.structureStateHistory = new StateHistoryPlugin(this.structureQuery);
  }

// Methods
  ngOnChanges(changes: SimpleChanges) {
    if (changes['index'] !== undefined && this.structureData !== undefined) {
      this.model = this.structureData[this.subject][this.index];
    }
    if (changes['index'] !== undefined || changes['subject'] !== undefined)
      this.changeKeyTimeStamp = new Date().getTime();
  }

  private getStructureStream() {
    this.structureQuery.selectStructure().subscribe(
        structure => {
          if (structure !== null) {
            this.structureData = structure;
            if (this.index === undefined)
              this.model = structure[this.subject];
            else
              this.model = structure[this.subject][this.index];
          }
        },
    );
  }

  formChanged(pathToChange: string[], newValue: any, stringPath: string) {

    let prevStructureType = null;
    if ([
      StructureType.PORTAL,
      StructureType.CANTILEVER,
      StructureType.TTC].includes(newValue)) {
      prevStructureType = this.model[pathToChange[0]];
    }
    if (pathToChange.length === 1) {
      const mastBRemoveCondition = (prevStructureType ===
          StructureType.PORTAL &&
          (newValue === StructureType.TTC || newValue ===
              StructureType.CANTILEVER));
      const boomRemoveCondition = (prevStructureType === StructureType.TTC &&
          newValue === StructureType.CANTILEVER);
      if (mastBRemoveCondition || boomRemoveCondition) {// Check if boom or mastB is removed
        this.model[pathToChange[0]] = newValue;
        this.confirmationService.confirm({
          key: 'formConfirmDialog',
          message: `You\'re about to change the structure type from <strong>${prevStructureType}</strong> to <strong>${newValue}</strong>, 
                                         this will cause removing the equipments with no steelwork to attach, 
                                         are you sure?`,
          header: 'Structure Type Change Warning',
          acceptLabel: 'I\'m sure',
          rejectLabel: 'Revert',
          dismissableMask: true,
          accept: () => {
            this.removeEquipmentsWithNothingAttached(newValue);
            this.checkForDynamicOptionsCriteria(stringPath, newValue);
            this.model[pathToChange[0]] = newValue;
            this.changeStructure();
            this.actions$.dispatch(structureChangeSubmitted(
                {newStructureData: this.structureData}));
          },
          reject: () => {
            console.log('rejected');
            this.model[pathToChange[0]] = prevStructureType;
          },
        });
      } else {
        this.checkForDynamicOptionsCriteria(stringPath, newValue);
        this.model[pathToChange[0]] = newValue;
        this.changeStructure();
        this.actions$.dispatch(structureChangeSubmitted(
            {newStructureData: this.structureData}));
      }
    } else if (pathToChange.length === 2) {
      this.checkForDynamicOptionsCriteria(stringPath, newValue);
      this.model[pathToChange[0]][pathToChange[1]] = newValue;
      this.changeStructure();
      this.actions$.dispatch(structureChangeSubmitted(
          {newStructureData: this.structureData}));
    }

  }

  /**
   * Put model's data to structureData
   */
  changeStructure() {
    if (this.index === undefined)
      this.structureData[this.subject] = this.model;
    else
      this.structureData[this.subject][this.index] = this.model;
  }

  removeEquipmentsWithNothingAttached(newType: string) {
    for (let property in this.structureData) {
      if (!['info', 'basics'].includes(property)) {
        for (let index = 0; index <
        this.structureData[property].length; index++) {
          const eq = this.structureData[property][index];
          const ttcCondition = (newType === StructureType.TTC &&
              eq.steel_support === SteelSupport.MASTB);
          const cantileverCondition = (newType === StructureType.CANTILEVER &&
              (eq.steel_support === SteelSupport.MASTB || eq.steel_support ===
                  SteelSupport.BOOM));
          if (ttcCondition || cantileverCondition) {
            this.structureData[property].splice(index, 1);
            index--;
          }
        }
      }
    }
  }

  /**
   * If input has a dynamic option criteria and if their subject is changing then
   * this function will change their value based on their default value
   */
  checkForDynamicOptionsCriteria(stringPath: string, newValue: any) {
    console.log(this.checkList);
    for (let path in this.checkList) {
      if (path === stringPath) {
        const cases = this.checkList[path];
        cases.forEach(c => {
          c.defaultValuePerCase.forEach(dvpc => {
            if (dvpc.case === newValue) {
              if (['info', 'basics'].includes(c.pathToChange[0])) {
                if (c.pathToChange[1] === 'root') {
                  this.structureData[c.pathToChange[0]][c.pathToChange[2]] = dvpc.resolve;
                } else {
                  this.structureData[c.pathToChange[0]][c.pathToChange[1]][c.pathToChange[2]] = dvpc.resolve;
                }
                const newStringPath = `${c.pathToChange[0]}|${c.pathToChange[1]}|${c.pathToChange[2]}`
                if(Object.keys(this.checkList).includes(newStringPath)){
                  this.checkForDynamicOptionsCriteria(newStringPath,dvpc.resolve);
                }
              }
            }
          });
        });
      }
    }
  }

  private getFormSchema() {
    this.schemaService.getFormSchema().subscribe(
        formSchema => {
          this.schema = formSchema[this.subject];
        },
    );
    this.schemaService.getCheckListForChangingToDefault().subscribe(
        checklist => {
          if (checklist)
            this.checkList = checklist;
        },
    );
  }
}
