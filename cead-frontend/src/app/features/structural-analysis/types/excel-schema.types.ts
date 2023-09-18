import {Schema} from 'read-excel-file/types';

export interface SA_IMPORT_EXCEL_SCHEMA {
  info: {
    sheet_name: string,
    schema?: any
  };
  wire_runs: SA_IMPORT_EXCEL_SHEET_SCHEMA;
  ancillary_wires: SA_IMPORT_EXCEL_SHEET_SCHEMA;
  anchors: SA_IMPORT_EXCEL_SHEET_SCHEMA;
  ties: SA_IMPORT_EXCEL_SHEET_SCHEMA;
  switches: SA_IMPORT_EXCEL_SHEET_SCHEMA;
  construction_loads: SA_IMPORT_EXCEL_SHEET_SCHEMA;
}

export interface SA_IMPORT_EXCEL_SHEET_SCHEMA {
  sheet_name: string;
  schema?: Schema;
}

export interface SA_EXPORT_EXCEL_SCHEMA {
  info: SA_EXPORT_EXCEL_SHEET_SCHEMA;
  wire_runs: SA_EXPORT_EXCEL_SHEET_SCHEMA;
  ancillary_wires: SA_EXPORT_EXCEL_SHEET_SCHEMA;
  anchors: SA_EXPORT_EXCEL_SHEET_SCHEMA;
  ties: SA_EXPORT_EXCEL_SHEET_SCHEMA;
  switches: SA_EXPORT_EXCEL_SHEET_SCHEMA;
  construction_loads: SA_EXPORT_EXCEL_SHEET_SCHEMA;
}

export interface SA_EXPORT_EXCEL_SHEET_SCHEMA {
  sheet_name: string;
  prop: any,
  merge: any
}
