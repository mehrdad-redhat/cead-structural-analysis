export enum StructureType {
  CANTILEVER = 'Cantilever',
  TTC = 'TTC',
  PORTAL = 'Portal',
}

export enum SteelSupport {
  BOOM = 'Boom',
  MASTA = 'MastA',
  MASTB = 'MastB',
}

export enum Direction {
  LEFT = 'Left',
  RIGHT = 'Right',
  // HIGH = 'High',
  // LOW = 'Low',
  HIGH_CHAINAGE = 'High Chainage',
  // LOW_CHAINAGE = 'Low Chainage',
}

export enum FoundationType {
  BOLTED = 'Bolted',
  // HINGED = 'Hinged',
}

export enum EquipmentType {
  AT = 'AT',
  FT = 'FT',
}

export enum PropertyName {
  STRUCTURE_INFO = 'info',
  STRUCTURE_BASIC = 'basics',
  WIRE_RUNS = 'wire_runs',
  ANCILLARY_WIRES = 'ancillary_wires',
  ANCHORS = 'anchors',
  TIES = 'ties',
  SWITCHES = 'switches',
  CONSTRUCTION_LOADS = 'construction_loads',
}
