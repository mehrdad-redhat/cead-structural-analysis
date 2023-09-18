import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {STRUCTURE_FORM_SCHEMA} from '../schemas/form-schema.resource';
import {StructureQuery} from '../state';
import {
  ACTIVE_STATUS,
  PropertyName,
  StructureData,
  StructureFormSchema,
  StructureInput,
  StructureType,
} from '../types';

@Injectable()
export class FormSchemaService {

  currentSchema: StructureFormSchema;
  schemasWithActiveCriteria = [];
  schemasWithDynamicPossibleValues = [];
  private _schema$ = new BehaviorSubject<StructureFormSchema>(
      STRUCTURE_FORM_SCHEMA);
  private _checkList$ = new BehaviorSubject<any>({});
  private currentStructure = this.structureQuery.selectStructure();

  constructor(private structureQuery: StructureQuery) {
    this.prepareListOfSchemasDynamicCriteria();
    this.updateFormSchemaOnStructureChange();
  }

// Methods
  /**
   * Returns an observable of schema for components to use
   */
  public getFormSchema(): Observable<StructureFormSchema> {
    return this._schema$.asObservable();
  }

  /**
   * Returns an Observable of checklist for changing to default
   */
  public getCheckListForChangingToDefault(): Observable<any> {
    return this._checkList$.asObservable();
  }

  /**
   * Watches the structure changes to make the necessary changes on the schema
   */
  private updateFormSchemaOnStructureChange() {
    this.currentStructure.subscribe((structureData: StructureData) => {
      if (structureData) {
        this.updateInputActiveStates(structureData);
        this.updateInputsPossibleValueList(structureData);
        this._schema$.next(this.currentSchema);
      }
    });
  }

  /**
   * Updates visibility of inputs based on the amount of other inputs
   * and the conditions for which it is intended.
   * @param structureData
   * @private
   */
  private updateInputActiveStates(structureData: StructureData) {
    this.currentSchema = this._schema$.value;
    switch (structureData.info.structure_type) {
      case StructureType.PORTAL:
        this.currentSchema.basics[1].activeStatus = ACTIVE_STATUS.ACTIVE;// MAST B
        this.currentSchema.basics[2].activeStatus = ACTIVE_STATUS.ACTIVE;// BOOM
        break;
      case StructureType.TTC:
        this.currentSchema.basics[1].activeStatus = ACTIVE_STATUS.INACTIVE;// MAST B
        this.currentSchema.basics[2].activeStatus = ACTIVE_STATUS.ACTIVE;// BOOM
        break;
      case StructureType.CANTILEVER:
        this.currentSchema.basics[1].activeStatus = ACTIVE_STATUS.INACTIVE;// MAST B
        this.currentSchema.basics[2].activeStatus = ACTIVE_STATUS.INACTIVE;// BOOM
        break;
    }
    this.schemasWithActiveCriteria.forEach(criteria => {
      const ptc = criteria.pathToCheck;
      if (ptc[0] === PropertyName.STRUCTURE_BASIC || // Check if we're looking into equipments or non-equipments
          ptc[0] === PropertyName.STRUCTURE_INFO) {  // because equipments are not single, and they have index in StructureData 
        const criteriaSubjectValue = ptc[1] === 'root' ?
            structureData[ptc[0]][ptc[2]] :
            structureData[ptc[0]][ptc[1]][ptc[2]];
        const isAllowed = criteria.allowedValues.includes(criteriaSubjectValue);
        this.currentSchema[criteria.schemaAddress[0]]
            [criteria.schemaAddress[1]]
            ['children']
            [criteria.schemaAddress[2]]
            ['activeStatus'] = isAllowed ?
            ACTIVE_STATUS.ACTIVE :
            ACTIVE_STATUS.INACTIVE;
      } else {
        structureData[ptc[0]].forEach((equipment, eqIndex) => {
          const criteriaSubjectValue = ptc[1] === 'root' ?
              equipment[ptc[2]] :
              equipment[ptc[1]][ptc[2]];

          const isAllowed = criteria.allowedValues.includes(
              criteriaSubjectValue);
          this.currentSchema[criteria.schemaAddress[0]]
              [criteria.schemaAddress[1]]
              ['children']
              [criteria.schemaAddress[2]]
              ['activeStatus'][eqIndex] = isAllowed ?
              ACTIVE_STATUS.ACTIVE :
              ACTIVE_STATUS.INACTIVE;
        });
      }
    });

  }

  /**
   * Updates dropdown input's option based on the amount of other inputs
   * and the conditions for which it is intended.
   * @param structureData
   * @private
   */
  private updateInputsPossibleValueList(structureData: StructureData) {
    this.currentSchema = this._schema$.value;
    this.schemasWithDynamicPossibleValues.forEach(criteria => {
      const ptc = criteria.pathToCheck;
      if (ptc[0] === PropertyName.STRUCTURE_BASIC || // Check if we're looking into equipments or non-equipments
          ptc[0] === PropertyName.STRUCTURE_INFO) { // because equipments are not single, and they have index in StructureData
        const criteriaSubjectValue = ptc[1] === 'root' ?
            structureData[ptc[0]][ptc[2]] :
            structureData[ptc[0]][ptc[1]][ptc[2]];
        for (let c of criteria.cases) {
          if (criteriaSubjectValue === c.case) {
            this.currentSchema[criteria.schemaAddress[0]]
                [criteria.schemaAddress[1]]
                ['children']
                [criteria.schemaAddress[2]]
                ['possibleValues'] = c.resolve;

            break;
          }
        }
      } else {
        structureData[ptc[0]].forEach((equipment, eqIndex) => {
          const criteriaSubjectValue = ptc[1] === 'root' ?
              equipment[ptc[2]] :
              equipment[ptc[1]][ptc[2]];

          for (let c of criteria.cases) {
            if (criteriaSubjectValue === c.case) {
              this.currentSchema[criteria.schemaAddress[0]]
                  [criteria.schemaAddress[1]]
                  ['children']
                  [criteria.schemaAddress[2]]
                  ['possibleValues'][eqIndex] = c.resolve;
              break;
            }
          }
        });
      }
    });

  }

  /**
   * For better performance we prepare a list of schemas with dynamic
   * criteria and from there on, with every change, we only check them
   * @private
   */
  private prepareListOfSchemasDynamicCriteria() {
    this.schemasWithActiveCriteria = [];
    this.schemasWithDynamicPossibleValues = [];
    let checkList = {};
    this.forEachSchema((input, address) => {
      if (input.activeCriteria) {
        this.schemasWithActiveCriteria.push({
          pathToCheck: input.activeCriteria.pathToCheck,
          allowedValues: input.activeCriteria.allowedValues,
          schemaAddress: address,
        });
      }
      if (input.possibleValuesCriteria) {
        this.schemasWithDynamicPossibleValues.push({
          pathToCheck: input.possibleValuesCriteria.pathToCheck,
          cases: input.possibleValuesCriteria.possibleValuesPerCase,
          schemaAddress: address,
        });
      }
      if (input.defaultCriteria) {
        const stringPathToCheck = input.defaultCriteria.pathToCheck.join('|');
        if (!checkList.hasOwnProperty(stringPathToCheck))
          checkList[stringPathToCheck] = [];

        checkList[stringPathToCheck].push({
          pathToChange: [input.sectionName, input.groupName, input.name],
          defaultValuePerCase: input.defaultCriteria.defaultValuePerCase,
        });

      }
    });
    this._checkList$.next(checkList);
  }

  /**
   * Run the callback for each of schemas
   * @param callback
   * @private
   */
  private forEachSchema(callback: (
      inputSchema: StructureInput,
      address?,
      index?: number,
  ) => void) {
    let schema = this._schema$.value;
    let index = 0;
    for (let sectionName in schema) {
      let section = schema[sectionName];
      section.forEach((group, groupIndex) => {
        let children = group.children;
        children.forEach((input: StructureInput, inputIndex) => {
          let address = [input.sectionName, groupIndex, inputIndex];
          callback(input, address, index);
          index++;
        });
      });
    }
  }

}
