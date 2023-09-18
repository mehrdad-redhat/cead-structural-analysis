export interface SkycivModelProperty{
  [key:number]:{
    [key:string]:any
  }
}

export interface SkycivModel {
  nodes: SkycivModelProperty;
  members: SkycivModelProperty;
  sections: SkycivModelProperty;
  materials: SkycivModelProperty;
  supports: SkycivModelProperty;
  point_loads: SkycivModelProperty;
  distributed_loads: SkycivModelProperty;
  moments: SkycivModelProperty;
  self_weight: SkycivModelProperty;
  load_combinations: SkycivModelProperty;
  plates: SkycivModelProperty;
  meshed_plates: SkycivModelProperty;
}

export interface SkycivAnalysisResults {
  memberForces:{[key:string]:any}[];
  memberAnalysis:{[key:string]:any}[];
  memberUtilisation:{[key:string]:any}[];
  steelworkUtilisation:{[ket:string]:{value:any,lcName:string}};
  nodeDisplacements:{[key:string]:any}[];
  nodeReactions:{[key:string]:any}[];
  foundationLoadsCombinations:{[key:string]:any}[];
  foundationLoadsCases:{[key:string]:any}[];
}
