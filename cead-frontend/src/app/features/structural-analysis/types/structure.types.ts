import {
  Direction,
  EquipmentType,
  FoundationType,
  SteelSupport,
} from './basic.types';
import {SkycivAnalysisResults, SkycivModel} from './skyciv.types';

export interface StructureData {
  info: StructureInfo;
  basics?: StructureBasic;
  wire_runs?: WireRun[];
  ancillary_wires?: AncillaryWire[];
  anchors?: Anchor[];
  ties?: Tie[];
  switches?: Switch[];
  construction_loads?: ConstructionLoad[];
}

export interface BasicStructure {
  _id?: number;
  preview_url?: string;
  revision?: string;
  updatedAt?: Date;
}

export interface Structure extends BasicStructure {
  structure_data: StructureData;
  skyciv_model?: SkycivModel;
  analyzed_data?: SkycivAnalysisResults;
}

export interface StructureInfo {
  structure_name?: string;
  structure_location?: string;
  structure_type?: string;
}

export interface StructureBasic {
  mast_a?: {
    steelwork?: string;
    foundation_level?: number;
    length?: number;
    foundation_type?: string;
    beta_angle?: number;
  };
  mast_b?: {
    steelwork?: string;
    foundation_level?: number;
    length?: number;
    foundation_type?: FoundationType;
  };
  boom?: {
    steelwork?: string;
    level?: number;
    length?: number;
    direction?: Direction;
  };
  wind_pressure?: {
    qp_left?: number;
    qp_right?: number;
    qp_high?: number;
    qp_low?: number;
  };
}

export interface WireRun {
  id?: string | number;
  wire_run_number?: string;
  equipment_type?: EquipmentType;
  steel_support?: SteelSupport;
  geometry?: {
    contact_height?: number;
    catenary_height?: number;
    stagger?: number;
    reach?: number;
    recos?: number;
    track_level_difference?: number;
    drag_factor?: number;
  };
  registration?: {
    weight_of_registration?: number;
    area_of_registration?: number;
  };
  equipment?: {
    weight_of_equipment?: number;
    weight_of_ice_on_equipment?: number;
  };
  radial_loads?: {
    contact_at_18?: number;
    catenary_at_18?: number;
    contact_at_5?: number;
    catenary_at_5?: number;
    contact_at_10?: number;
    catenary_at_10?: number;
  };
  wind_loads?: {
    contact_from_left?: number;
    contact_from_right?: number;
    catenary_from_left?: number;
    catenary_from_right?: number;
    contact_from_left_with_ice?: number;
    contact_from_right_with_ice?: number;
    catenary_from_left_with_ice?: number;
    catenary_from_right_with_ice?: number;
  };
}

export interface AncillaryWire {
  id?: string | number;
  wire_name?: string;
  steel_support?: SteelSupport;
  geometry?: {
    wire_height?: number;
    offset_from_mast_centre?: number;
    reach?: number;
    drag_factor?: number;
  };
  registration?: {
    weight_of_support?: number;
    area_of_support?: number;
  };
  equipment?: {
    weight_of_equipment?: number;
    weight_of_ice_on_equipment?: number;
  };
  radial_loads?: {
    radial_load_at_18?: number;
    radial_load_at_5?: number;
    radial_load_at_10?: number;
  };
  wind_loads?: {
    wind_load_from_left?: number;
    wind_load_from_right?: number;
    wind_load_from_left_with_ice?: number;
    wind_load_from_right_with_ice?: number;
  };
}

export interface Anchor {
  id?: string | number;
  anchor_name?: string;
  steel_support?: SteelSupport;
  geometry?: {
    anchor_height?: number;
    direction?: Direction;
    offset_from_mast_centre?: number;
    track_level_difference?: number;
    angle?: number;
    drag_factor?: number;
  };
  registration?: {
    weight_of_support?: number;
    area_of_support?: number;
  };
  equipment?: {
    weight_of_equipment?: number;
    weight_of_ice_on_equipment?: number;
  };
  tension?: {
    equipment_type?: EquipmentType;
    tension_at_18?: number;
    tension_at_5?: number;
    tension_at_10?: number;
    accidental_load_case?: boolean;
    accidental_tension?: number;
  };
  wind_loads?: {
    wind_load_from_left?: number;
    wind_load_from_right?: number;
    wind_load_from_left_with_ice?: number;
    wind_load_from_right_with_ice?: number;
  };
}

export interface Tie {
  id?: string | number;
  steel_support?: SteelSupport;
  type?: string;
  tie_height?: number;
  tie_spacing?: number;
  foundation_level?: number;
}

export interface Switch {
  id?: string | number;
  steel_support?: SteelSupport;
  height?: number;
  offset_from_mast_a?: number;
  direction?: Direction;
  weight?: number;
  along_track_area?: number;
  across_track_area?: number;
}

export interface ConstructionLoad {
  id?: string | number;
  steel_support?: SteelSupport;
  height?: number;
  offset_from_mast_a?: number;
  direction_relative_to_mast?: Direction;
  construction_load?: number;
}

export type Equipment = WireRun | AncillaryWire | Anchor | Tie | Switch | ConstructionLoad;
export type FormModel = StructureInfo | StructureBasic | Equipment;
