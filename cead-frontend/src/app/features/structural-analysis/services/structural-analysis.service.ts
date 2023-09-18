import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {
  DISPLAY_TYPE,
  Equipment,
  StructureData,
  StructureFormSchema,
} from '../types';
import {FormSchemaService} from './form-schema.service';
import {StructuralAnalysisGateway} from './structural-analysis.gateway';

@Injectable({
  providedIn: 'root',
})
export class StructuralAnalysisService {

  schema: StructureFormSchema;
  screenshotRequest = new BehaviorSubject<string>('');

  constructor(
      private schemaService$: FormSchemaService,
      private saGateway: StructuralAnalysisGateway) {
    this.getFormSchema();
  }

// Methods
  private getFormSchema() {
    this.schemaService$.getFormSchema().subscribe(
        formSchema => {
          this.schema = formSchema;
        },
    );
  }

  makeNewStructure(
      name?: string, type?: string, location?: string): StructureData {
    let structureData: StructureData = {
      info: {
        structure_location: location || '',
        structure_name: name || '',
        structure_type: type || '',
      },
      basics: {},
      wire_runs: [],
      ancillary_wires: [],
      anchors: [],
      ties: [],
      switches: [],
      construction_loads: [],
    };
    const basicsSchema = this.schema['basics'];
    basicsSchema.forEach(group => {
      structureData.basics[group.name] = {};
      group.children.forEach((child) => {
        if (child.defaultCriteria) {
          const ptc = child.defaultCriteria.pathToCheck;
          const valueToCheck = ptc[1] === 'root' ?
              structureData[ptc[0]][ptc[2]] :
              structureData[ptc[0]][ptc[1]][ptc[2]];
          for (let criteria of child.defaultCriteria.defaultValuePerCase) {
            if (valueToCheck === criteria.case) {
              if (group.displayType !== DISPLAY_TYPE.ROOT) {
                structureData.basics[group.name][child.name] = criteria.resolve;
              } else {
                structureData.basics[child.name] = criteria.resolve;
              }
              break;
            }
          }
        } else {
          structureData.basics[group.name][child.name] = child.default;
        }
      });
    });

    return structureData;
  }

  makeNewEquipment(name: string, id: number): Equipment {
    let eqSchema = this.schema[name];
    let newEquipment: Equipment = {};
    newEquipment.id = id;
    eqSchema.forEach(s => {
      s.children.forEach(c => {
        if (s.displayType === DISPLAY_TYPE.ROOT) {
          newEquipment[c.name] = c.autoIncrement ?
              `${c.default}${id}` : c.default;
        } else {
          if (!newEquipment.hasOwnProperty(c.groupName))
            newEquipment[c.groupName] = {};
          newEquipment[c.groupName][c.name] = c.autoIncrement ?
              `${c.default}${id}` : c.default;
        }
      });
    });
    return newEquipment;
  }

  solveModel(structureId) {
    return this.saGateway.solveModel(structureId);
  }

  requestForSavingScreenshot() {
    this.screenshotRequest.next('Take Screenshot');
  }

  watchForScreenshot(): Observable<string> {
    return this.screenshotRequest.asObservable();
  }

  saveThumbnail(thumbnail: string, id: number) {
    return this.saGateway.setStructureThumbnail(thumbnail, id);
  }

}
