import {PropertyName} from './basic.types';

export interface Criteria {
  allowedValues?: string[] | number[] | boolean[];
  pathToCheck: string[];
  possibleValuesPerCase?: PossibleValuesPerValue[];
  defaultValuePerCase?: DefaultValuePerCase[];
}

export interface PossibleValuesPerValue {
  case: string | number | boolean;
  resolve: string[] | boolean[] | number[];
}

export interface DefaultValuePerCase {
  case: string | number | boolean;
  resolve: string | boolean | number;
}

export enum INPUT_TYPE {
  TEXT = 'TEXT',
  DROPDOWN = 'DROPDOWN',
  NUMBER = 'number',
}

export enum DISPLAY_TYPE {
  ROOT = 'ROOT',
  GROUP = 'GROUP',
  INPUT = 'INPUT',
}

export enum ACTIVE_STATUS {
  INACTIVE = 'inactive',
  ACTIVE = 'active'
}

export interface StructureInput {
  name?: string;
  label?: string;
  excelLabel?: string;
  activeStatus?: string | string[];
  activeCriteria?: Criteria;
  possibleValuesCriteria?: Criteria;
  possibleValues?: any[];
  default?: number | string | boolean;
  defaultCriteria?: Criteria;
  inputType?: INPUT_TYPE;
  alternative?: boolean,
  max?: number;
  min?: number;
  autoIncrement?: boolean;
  hintText?: string;
  unit?: string;
  displayType?: DISPLAY_TYPE;
  groupName?: string;
  sectionName?: PropertyName;
  children?: Schema;
}

export type Schema = StructureInput[];

export interface StructureFormSchema {
  info: Schema,
  basics: Schema,
  wire_runs: Schema,
  ancillary_wires: Schema,
  anchors: Schema,
  ties: Schema,
  switches: Schema,
  construction_loads: Schema,
}
