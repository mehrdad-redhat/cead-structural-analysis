import {Injectable} from '@angular/core';
import readXlsxFile, {Row} from 'read-excel-file';
import {take} from 'rxjs';
import {utils as XLSXUtils, WorkBook, WorkSheet} from 'xlsx-js-style';
import {Tools} from '../../../core/utils';
import {StructureQuery} from '../state';
import {
  DISPLAY_TYPE,
  INPUT_TYPE,
  PropertyName,
  SA_EXPORT_EXCEL_SCHEMA,
  SA_IMPORT_EXCEL_SCHEMA,
  StructureData,
  StructureFormSchema,
} from '../types';
import {FormSchemaService} from './form-schema.service';

const SHEET_LABELS = {
  info: 'Structure',
  basics: 'Structure',
  wire_runs: 'Wire Runs',
  ancillary_wires: 'Ancillary Wires',
  anchors: 'Anchors',
  ties: 'Ties',
  switches: 'Switches',
  construction_loads: 'Construction Loads',
};

const EXCEL_STYLES = {
  LEVEL1: {},
  LEVEL2: {},
  LEVEL3: {
    EMPTY: {},
    NOT_EMPTY: {},
  },
};

@Injectable()
export class ExcelService {
  structureData: StructureData;
  structureSchema: StructureFormSchema;
  excelImportSchema: SA_IMPORT_EXCEL_SCHEMA = {
    info: {
      sheet_name: SHEET_LABELS.info,
      schema: [],
    },
    wire_runs: {
      sheet_name: SHEET_LABELS.wire_runs,
      schema: {},
    },
    ancillary_wires: {
      sheet_name: SHEET_LABELS.ancillary_wires,
      schema: {},
    },
    anchors: {
      sheet_name: SHEET_LABELS.anchors,
      schema: {},
    },
    ties: {
      sheet_name: SHEET_LABELS.ties,
      schema: {},
    },
    switches: {
      sheet_name: SHEET_LABELS.switches,
      schema: {},
    },
    construction_loads: {
      sheet_name: SHEET_LABELS.construction_loads,
      schema: {},
    },
  };
  excelExportSchema: SA_EXPORT_EXCEL_SCHEMA = {
    info: {
      sheet_name: SHEET_LABELS.info,
      prop: [],
      merge: [],
    },
    wire_runs: {
      sheet_name: SHEET_LABELS.wire_runs,
      prop: PropertyName.WIRE_RUNS,
      merge: [],
    },
    ancillary_wires: {
      sheet_name: SHEET_LABELS.ancillary_wires,
      prop: PropertyName.ANCILLARY_WIRES,
      merge: [],
    },
    anchors: {
      sheet_name: SHEET_LABELS.anchors,
      prop: PropertyName.ANCHORS,
      merge: [],
    },
    ties: {
      sheet_name: SHEET_LABELS.ties,
      prop: PropertyName.TIES,
      merge: [],
    },
    switches: {
      sheet_name: SHEET_LABELS.switches,
      prop: PropertyName.SWITCHES,
      merge: [],
    },
    construction_loads: {
      sheet_name: SHEET_LABELS.construction_loads,
      prop: PropertyName.CONSTRUCTION_LOADS,
      merge: [],
    },
  };

  constructor(
      private schemaService: FormSchemaService,
      private structureQuery: StructureQuery) {
    this.schemaService.getFormSchema().pipe(
        take(1),
    ).subscribe(schema => {
      this.structureSchema = schema;
      this.generateExcelImportSchema();
      this.structureQuery.selectStructure().subscribe(
          structureData => {
            if (structureData !== null) {
              this.structureData = structureData;
              this.generateExcelExportSchema();
            }
          },
      );
    });
  }

// Methods
  // IMPORT METHODS
  private generateExcelImportSchema() {
    for (let property in this.structureSchema) {
      const section = this.structureSchema[property];
      if (['info', 'basics'].includes(<PropertyName>property)) {
        section.forEach(group => {
          group.children.forEach(input => {
            if (input.alternative !== true) {
              if (group.displayType === DISPLAY_TYPE.ROOT) {
                this.excelImportSchema.info.schema.push(
                    [input.sectionName, input.name],
                );
              } else {
                this.excelImportSchema.info.schema.push(
                    [input.sectionName, input.groupName, input.name],
                );
              }
            }
          });
        });
      } else {
        section.forEach(group => {
          group.children.forEach(input => {
            if (input.alternative !== true) {
              if (group.displayType === DISPLAY_TYPE.ROOT) {
                this.excelImportSchema[input.sectionName].schema[input.excelLabel] = {
                  prop: input.name,
                  type: (input.inputType === INPUT_TYPE.TEXT ||
                      input.inputType === INPUT_TYPE.DROPDOWN) ?
                      String : Number,
                };
              } else {
                if (!this.excelImportSchema[input.sectionName].schema.hasOwnProperty(
                    group.excelLabel)) {
                  this.excelImportSchema[input.sectionName].schema[group.excelLabel] = {
                    prop: group.name,
                    type: {},
                  };
                }
                this.excelImportSchema[input.sectionName].schema[group.excelLabel]['type'][input.excelLabel] = {
                  prop: input.name,
                  type: (input.inputType === INPUT_TYPE.TEXT ||
                      input.inputType === INPUT_TYPE.DROPDOWN) ?
                      String : Number,
                };
              }
            }
          });
        });
      }
    }
  }

  public convertXLSFileToStructure(xls: File) {
    return new Promise<StructureData>((resolve) => {
      let importedStructure: StructureData = {
        info: {},
        basics: {},
        wire_runs: [],
        ancillary_wires: [],
        anchors: [],
        ties: [],
        switches: [],
        construction_loads: [],
      };
      ExcelService.batchExcelSheetRead(xls, this.excelImportSchema).
          then(data => {
            let extractedStructureInfo = this.extractStructureInfo(data[0]);
            importedStructure.info = extractedStructureInfo['info'];
            importedStructure.basics = extractedStructureInfo['basics'];
            importedStructure.wire_runs = data[1].rows;
            importedStructure.ancillary_wires = data[2].rows;
            importedStructure.anchors = data[3].rows;
            importedStructure.ties = data[4].rows;
            importedStructure.switches = data[5].rows;
            importedStructure.construction_loads = data[6].rows;
            importedStructure = this.putEquipmentIds(importedStructure);
            resolve(importedStructure);
          });
    });
  }

  private static async batchExcelSheetRead(
      file: File, schema: SA_IMPORT_EXCEL_SCHEMA) {
    let promises = [];
    for (let sheet in schema) {
      const sheetName = schema[sheet].sheet_name;
      if (sheet === 'info') {
        promises.push(readXlsxFile(file, {sheet: sheetName}));
      } else {
        const sheetSchema = schema[sheet].schema;
        promises.push(readXlsxFile(file, {
          'transformData': (data) => {
            data.shift();
            return data;
          }, sheet: sheetName, schema: sheetSchema,
        }));
      }
    }
    return Promise.all(promises);
  }

  private extractStructureInfo(rows: Row[]) {
    let structureInfo = {
      info: {},
      basics: {
        mast_a: {},
        mast_b: {},
        boom: {},
        wind_pressure: {},
      },
    };

    for (let rowIndex in this.excelImportSchema.info.schema) {
      const path = this.excelImportSchema.info.schema[rowIndex];
      if (path.length === 2)
        structureInfo[path[0]][path[1]] = rows[rowIndex][2];
      else
        structureInfo[path[0]][path[1]][path[2]] = rows[rowIndex][2];
    }
    return structureInfo;
  }

  private putEquipmentIds(importedStructure: StructureData) {
    for (let sectionName in importedStructure) {
      if (!['basics', 'info'].includes(sectionName)) {
        const section = importedStructure[sectionName];
        section.forEach((eq, i) => {
          eq.id = i + 1;
        });
      }
    }
    return importedStructure;
  }

  //EXPORT METHODS
  private generateExcelExportSchema() {
    // Info sheet schema
    this.excelImportSchema.info.schema.forEach(row => {
      if (row.length === 2) {
        this.excelExportSchema.info.prop.push([
          Tools.snakeCaseToCapitalize(row[0]),
          Tools.snakeCaseToCapitalize(row[1])]);
      } else {
        this.excelExportSchema.info.prop.push([
          Tools.snakeCaseToCapitalize(row[1]),
          Tools.snakeCaseToCapitalize(row[2])]);
      }
    });

    // Cells merge schema
    let row = 0;
    let col = 0;
    for (let sectionName in this.structureSchema) {
      const section = this.structureSchema[sectionName];
      if (['info', 'basics'].includes(sectionName)) {
        section.forEach(group => {
          let start = row;
          let end = row + group.children.length -
              (group.name === 'mast_a' ? 3 : 1);
          this.excelExportSchema.info.merge.push({
            s: {r: start, c: 0}, e: {r: end, c: 0},
          });
          row = end + 1;
        });
      } else {
        col = 0;
        section.forEach(group => {
          let start = col;
          let end = col + group.children.length - 1;
          this.excelExportSchema[sectionName].merge.push({
            s: {c: start, r: 0}, e: {c: end, r: 0},
          });
          col = end + 1;
        });
      }
    }
  }

  public convertStructureToXLSWorkBook(): WorkBook {
    const workBook: WorkBook = XLSXUtils.book_new();
    for (let sheet in this.excelExportSchema) {
      const eq = this.excelExportSchema[sheet];
      let workSheet: WorkSheet;
      if (sheet === 'info') {
        const aoa = this.getStructureInfoAOA();
        workSheet = XLSXUtils.aoa_to_sheet(aoa);
        workSheet['!merges'] = eq.merge;
        for (let i in workSheet) {
          if (typeof (workSheet[i]) != 'object') continue;
          let cell = XLSXUtils.decode_cell(i);
          switch (cell.c) {
            case 0:
              workSheet[i].s = EXCEL_STYLES.LEVEL1;
              break;
            case 1:
              workSheet[i].s = EXCEL_STYLES.LEVEL2;
              break;
            default:
              workSheet[i].s = workSheet[i].v !== '' ?
                  EXCEL_STYLES.LEVEL3.NOT_EMPTY :
                  EXCEL_STYLES.LEVEL3.EMPTY;
          }
        }
      } else {
        const aoa = this.getStructureEquipmentsAOA(eq.prop);
        workSheet = XLSXUtils.aoa_to_sheet(aoa);
        workSheet['!merges'] = eq.merge;
        for (let i in workSheet) {
          if (typeof (workSheet[i]) != 'object') continue;
          let cell = XLSXUtils.decode_cell(i);
          switch (cell.r) {
            case 0:
              workSheet[i].s = EXCEL_STYLES.LEVEL1;
              break;
            case 1:
              workSheet[i].s = EXCEL_STYLES.LEVEL2;
              break;
            default:
              workSheet[i].s = workSheet[i].v !== '' ?
                  EXCEL_STYLES.LEVEL3.NOT_EMPTY :
                  EXCEL_STYLES.LEVEL3.EMPTY;
          }
        }
      }
      XLSXUtils.book_append_sheet(workBook, workSheet, eq.sheet_name);
    }
    return workBook;

  }

  private getStructureInfoAOA() {
    let aoa = [];
    let exportSchema = this.excelExportSchema.info.prop;
    let importSchema = this.excelImportSchema.info.schema;

    exportSchema.forEach((row, index) => {
      aoa.push([]);
      row.forEach(prop => {
        aoa[index].push(prop);
      });
      let val;
      if (importSchema[index].length === 2)
        val = this.structureData[importSchema[index][0]][importSchema[index][1]];
      else
        val = this.structureData[importSchema[index][0]][importSchema[index][1]][importSchema[index][2]];
      aoa[index].push(val === undefined || val === null ? '' : val);
    });
    return aoa;
  }

  private getStructureEquipmentsAOA(sectionName) {
    let aoa = [[], []];
    const recipe = this.structureSchema[sectionName];
    recipe.forEach(group => {
      if (group.displayType !== DISPLAY_TYPE.ROOT) {
        aoa[0].push(group.excelLabel);
        group.children.forEach(child => {
          aoa[0].push('');
          aoa[1].push(child.excelLabel);
          this.structureData[sectionName].forEach((eq, i) => {
            if (!Array.isArray(aoa[i + 2]))
              aoa[i + 2] = [];
            aoa[i + 2].push(eq[child.groupName][child.name]);
          });
        });
        aoa[0].pop();
      } else {
        aoa[0].push('info');
        group.children.forEach(child => {
          aoa[0].push('');
          aoa[1].push(child.excelLabel);
          this.structureData[sectionName].forEach((eq, i) => {
            if (!Array.isArray(aoa[i + 2]))
              aoa[i + 2] = [];
            aoa[i + 2].push(eq[child.name]);
          });
        });
        aoa[0].pop();
      }
    });
    return aoa;
  }
}

EXCEL_STYLES.LEVEL1 = {
  fill: {
    patternType: 'solid',
    bgColor: {rgb: 'a6a6a6'},
    fgColor: {rgb: 'a6a6a6'},
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center',
  },
  border: {
    top: {
      style: 'medium',
    },
    bottom: {
      style: 'medium',
    },
    left: {
      style: 'medium',
    },
    right: {
      style: 'medium',
    },
  },
};
EXCEL_STYLES.LEVEL2 = {
  fill: {
    patternType: 'solid',
    bgColor: {rgb: 'f2f2f2'},
    fgColor: {rgb: 'f2f2f2'},
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center',
    wrapText: 'true',
  },
  border: {
    top: {
      style: 'medium',
    },
    bottom: {
      style: 'medium',
    },
    left: {
      style: 'medium',
    },
    right: {
      style: 'medium',
    },
  },
};
EXCEL_STYLES.LEVEL3 = {
  EMPTY: {
    fill: { // background color
      patternType: 'solid',
      bgColor: {rgb: 'd8e4bc'},
      fgColor: {rgb: 'd8e4bc'},
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
    border: {
      top: {
        style: 'medium',
      },
      bottom: {
        style: 'medium',
      },
      left: {
        style: 'medium',
      },
      right: {
        style: 'medium',
      },
    },
  },
  NOT_EMPTY: {
    fill: { // background color
      patternType: 'solid',
      bgColor: {rgb: 'a9d08e'},
      fgColor: {rgb: 'a9d08e'},
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
    border: {
      top: {
        style: 'medium',
      },
      bottom: {
        style: 'medium',
      },
      left: {
        style: 'medium',
      },
      right: {
        style: 'medium',
      },
    },
  },
};
