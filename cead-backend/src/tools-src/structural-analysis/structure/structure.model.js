const {
	jsonBatchLoad,
	swapValue,
	getMaxKey,
	removeNullKeys,
	changeKeysToString,
} = require('../../../_helpers/utils');
const {WireRun, Ancillary, Anchor, Tie, Switch, ConstructionLoad} = require(
		'./models');
const PI = 3.141592653;
// Fraction Digits number for results
const FD = 3;
const BridgeIdOffset = 500;
const MastBIdOffset = 1000;
const SWNames = {
	MASTA: 'masta',
	MASTB: 'mastb',
	BOOM: 'boom',
	TIEA: 'tiea',
	TIEB: 'tieb',
	WIRE_RUN: 'wireRun',
	ANCILLARY: 'ancillary',
	ANCHOR: 'anchor',
	TIE: 'tie',
	SWITCH: 'switch',
	CONSTRUCTION_LOAD: 'constructionLoad',
};
// Define Wind Loading Constants
const gWr = 1, gAw = 1.05, gAnchor = 1, gSwitch = 1.05, cSwitch = 1.2;

class Structure {
	skycivModel = {
		nodes: {},
		members: {},
		sections: {},
		materials: {},
		supports: {},
		point_loads: {},
		distributed_loads: {},
		moments: {},
		self_weight: {},
		load_combinations: {},
		plates: {},
		meshed_plates: {},
	};
	
	constructor(structure,alf) {
		this.nodesSWGuide = {};
		this.membersSWGuide = {};
		this.wiringGuide = {
			wireRun: [],
			ancillary: [],
			anchor: [],
			tie: [],
			switch: [],
			constructionLoad: [],
		};
		this.userStructure = structure;
		this.structureInfo = structure['info'];
		this.structureBasics = structure['basics'];
		this.alf = alf * 0.01 + 1;
		this.structureType = this.structureInfo['structure_type'];
		this.wireRuns = structure['wire_runs'];
		this.ancillaryWires = structure['ancillary_wires'];
		this.anchors = structure['anchors'];
		this.ties = structure['ties'];
		this.switches = structure['switches'];
		this.constructionLoads = structure['construction_loads'];
	}
	
	get guides() {
		return {
			nodes: this.nodesSWGuide,
			members: this.membersSWGuide,
			wires: this.wiringGuide,
		};
	}
	
	get drafts() {
		return {
			structureType: this.structureType,
			windFactors: this.windFactors,
			steelworks: this.steelworks,
			steelworkIds: this.steelworkIds,
		};
	}
	
	_wireRuns = [];
	
	get wireRuns() {
		return this._wireRuns;
	}
	
	set wireRuns(arr) {
		if (arr && arr.length >= 0) {
			arr.forEach(wr => this._wireRuns.push(new WireRun(wr)));
		} else {
			this._wireRuns = [];
		}
	}
	
	_ancillaryWires = [];
	
	get ancillaryWires() {
		return this._ancillaryWires;
	}
	
	set ancillaryWires(arr) {
		if (arr && arr.length >= 0) {
			arr.forEach(aw => this._ancillaryWires.push(new Ancillary(aw)));
		} else {
			this._ancillaryWires = [];
		}
	}
	
	_anchors = [];
	
	get anchors() {
		return this._anchors;
	}
	
	set anchors(arr) {
		if (arr && arr.length >= 0) {
			arr.forEach(an => this._anchors.push(new Anchor(an)));
		} else {
			this._anchors = [];
		}
	}
	
	_ties = [];
	
	get ties() {
		return this._ties;
	}
	
	set ties(arr) {
		if (arr && arr.length >= 0) {
			arr.forEach(tie => this._ties.push(new Tie(tie)));
		} else {
			this._ties = [];
		}
	}
	
	_switches = [];
	
	get switches() {
		return this._switches;
	}
	
	set switches(arr) {
		if (arr && arr.length >= 0) {
			arr.forEach(sw => this._switches.push(new Switch(sw)));
		} else {
			this._switches = [];
		}
	}
	
	_constructionLoads = [];
	
	get constructionLoads() {
		return this._constructionLoads;
	}
	
	set constructionLoads(arr) {
		if (arr && arr.length >= 0) {
			arr.forEach(cl => this._constructionLoads.push(new ConstructionLoad(cl)));
		} else {
			this._constructionLoads = [];
		}
	}
	
	isBoomExist(){
		return this.structureType === 'Portal' || this.structureType === 'TTC'
	}
	
	isMastBExist(){
		return this.structureType === 'Portal'
	}
	
	get iceLoad() {
		let hA = this.steelworks.mastA.length;
		let iceMassA = this.steelworksLoads.masta['Ice_Mass'];
		let steelMassA = this.steelworksLoads.masta['Steel_Mass'];
		let hB=0;
		let iceMassB=0;
		let steelMassB=0;
		let hO=0;
		let iceMassO=0;
		let steelMassO=0;
		if(this.isMastBExist()){
			hB = this.steelworks.mastB.length;
			iceMassB = this.steelworksLoads.mastb['Ice_Mass'];
			steelMassB = this.steelworksLoads.mastb['Steel_Mass'];
		}
		if(this.isBoomExist()){
			hO = this.steelworks.boom.length;
			iceMassO = this.steelworksLoads.boom['Ice_Mass'];
			steelMassO = this.steelworksLoads.boom['Steel_Mass'];
		}
		return +(
				-(hA * iceMassA + hO * iceMassO + hB * iceMassB) /
				(hA * steelMassA + hO * steelMassO + hB * steelMassB).toFixed(FD)
		);
	}
	
	static getWindsStuff(windData, swLoads) {
		// Quartering Wind Factor
		const ROOT2HALF = Math.sqrt(2) / 2;
		let winds = windData;
		let qpLeft = winds['qp_left'];
		let qpRight = winds['qp_right'];
		let qpHigh = winds['qp_high'];
		let qpLow = winds['qp_low'];
		let qpLeftHigh = Math.sqrt(
				(qpLeft ** 2 * qpHigh ** 2) / (qpLeft ** 2 + qpHigh ** 2),
		);
		let qpLeftLow = Math.sqrt(
				(qpLeft ** 2 * qpLow ** 2) / (qpLeft ** 2 + qpLow ** 2),
		);
		let qpRightHigh = Math.sqrt(
				(qpRight ** 2 * qpHigh ** 2) / (qpRight ** 2 + qpHigh ** 2),
		);
		let qpRightLow = Math.sqrt(
				(qpRight ** 2 * qpLow ** 2) / (qpRight ** 2 + qpLow ** 2),
		);
		let swWinds = {};
		if (swLoads)
			for (let sw in swLoads) {
				
				if(swLoads[sw]!==null){
					swWinds[sw] = {
						left: qpLeft * swLoads[sw]['X_wind'] * swLoads[sw]['G_X'] *
						      swLoads[sw]['C_X'],
						right: -1 * qpRight * swLoads[sw]['X_wind'] * swLoads[sw]['G_X'] *
						       swLoads[sw]['C_X'],
						high: qpHigh * swLoads[sw]['Z_wind'] * swLoads[sw]['G_Z'] *
						      swLoads[sw]['C_Z'],
						low: -1 * qpLow * swLoads[sw]['Z_wind'] * swLoads[sw]['G_Z'] *
						     swLoads[sw]['C_Z'],
					};
				}
			}
		return {
			windFactors: {
				leftHigh: qpLeftHigh * ROOT2HALF,
				leftLow: qpLeftLow * ROOT2HALF,
				rightHigh: qpRightHigh * ROOT2HALF,
				rightLow: qpRightLow * ROOT2HALF,
				leftHighLeft: qpLeftHigh / qpLeft,
				leftHighHigh: qpLeftHigh / qpHigh,
				leftLowLeft: qpLeftLow / qpLeft,
				leftLowLow: qpLeftLow / qpLow,
				rightHighRight: qpRightHigh / qpRight,
				rightHighHigh: qpRightHigh / qpHigh,
				rightLowRight: qpRightLow / qpRight,
				rightLowLow: qpRightLow / qpLow,
			},
			dualWinds: {
				qpLeftHigh,
				qpLeftLow,
				qpRightHigh,
				qpRightLow,
			},
			swWinds,
			winds: {qpLeft, qpRight, qpHigh, qpLow},
		};
	}
	
	async convertToSkycivModel() {
		return new Promise((resolve, reject) => {
			this.loadReferences()
			     .then((jsons) => {
				this.StructureLoads = jsons[0];
				this.LoadCombinations = jsons[1];
				this.StructureNodes = jsons[2];
				this.StructureMembers = jsons[3];
				this.WireRunNodes = jsons[4];
				this.WireRunMembers = jsons[5];
				this.AncillaryNodes = jsons[6];
				this.AncillaryMembers = jsons[7];
				this.AnchorNodes = jsons[8];
				this.AnchorMembers = jsons[9];
				this.TieNodes = jsons[10];
				this.TieMembers = jsons[11];
				this.SwitchNodes = jsons[12];
				this.SwitchMembers = jsons[13];
				this.Sections = jsons[14];
				this.Materials = jsons[15];
				
				this.steelworkIds = this.getSteelworkId();
				this.makeDraft();
				this.doTheCalculations();
				resolve(this.skycivModel);
			})
			     .catch((err) => reject(err));
		});
	}
	
	async loadReferences() {
		let referenceFiles = [
			'../_references/structural_analysis/structure-loads.json',// 0
			'../_references/structural_analysis/load-combinations.json',// 1
			'../_references/structural_analysis/structure-nodes.json',// 2
			'../_references/structural_analysis/structure-members.json',// 3
			'../_references/structural_analysis/wire-run-nodes.json',// 4
			'../_references/structural_analysis/wire-run-members.json',// 5
			'../_references/structural_analysis/ancillary-nodes.json',// 6
			'../_references/structural_analysis/ancillary-members.json',// 7
			'../_references/structural_analysis/anchor-nodes.json',// 8
			'../_references/structural_analysis/anchor-members.json',// 9
			'../_references/structural_analysis/tie-nodes.json',// 10
			'../_references/structural_analysis/tie-members.json',// 11
			'../_references/structural_analysis/switch-nodes.json',// 12
			'../_references/structural_analysis/switch-members.json',// 13
			'../_references/structural_analysis/sections.json',// 14
			'../_references/structural_analysis/materials.json',// 15
		];
		return jsonBatchLoad(referenceFiles);
	}
	
	doTheCalculations() {
		this.calculateLoadCases();
		this.calculateStructureGeometry();
		this.calculateStructureLoads();
		if (this.userStructure['wire_runs'].length > 0) {
			this.calculateWireRunsGeometry();
			this.calculateWireRunsLoads();
		}
		if (this.userStructure['ancillary_wires'].length > 0) {
			this.calculateAncillaryWiresGeometry();
			this.calculateAncillaryWiresLoads();
		}
		if (this.userStructure['anchors'].length > 0) {
			this.calculateAnchorsGeometry();
			this.calculateAnchorsLoads();
		}
		if (this.userStructure['ties'].length > 0) {
			this.calculateTiesGeometry();
			this.calculateTiesLoads();
		}
		if (this.userStructure['switches'].length > 0) {
			this.calculateSwitchesGeometry(this.switches, SWNames.SWITCH);
			this.calculateSwitchesLoads();
		}
		if (this.userStructure['construction_loads'].length > 0) {
			this.calculateConstructionGeometry();
			this.calculateConstructionLoads();
		}
		removeNullKeys(this.skycivModel.members);
		changeKeysToString(this.skycivModel.members,
		                   ['node_A', 'node_B', 'section_id']);
		// Adding Materials
		this.skycivModel.materials = this.Materials;
		// Adding Sections
		this.skycivModel.sections = this.Sections;
		
	}
	
	makeDraft() {
		this.steelworksLoads = this.getSteelworkLoads();
		let windData = this.structureBasics['wind_pressure'];
		let windStuff = Structure.getWindsStuff(windData, this.steelworksLoads);
		this.windFactors = windStuff.windFactors;
		this.steelworksWinds = windStuff.swWinds;
		this.winds = windStuff.winds;
		this.steelworks = this.getSteelworksStuff(this.structureBasics);
	}
	
	getSteelworksStuff(structureBasics) {
		let mastA = structureBasics['mast_a'];
		let mastB = structureBasics['mast_b'];
		let boom = structureBasics['boom'];
		
		let mastASW = {
			steelwork: mastA['steelwork'],
			ffl: mastA['foundation_level'],
			length: mastA['length'],
			foundation_type: mastA['foundation_type'],
			beta_angle: mastA['beta_angle'],
		};
		let mastBSW = {
			steelwork: mastB['steelwork'],
			ffl: mastB['foundation_level'],
			length: mastB['length'],
			foundation_type: mastB['foundation_type'],
		};
		let boomSW = {
			steelwork: boom['steelwork'],
			length: boom['length'],
			ttc_direction: boom['direction'],
			level: undefined,
		};

		// calculating boom level
		if(this.isBoomExist()){
			let boomLevel;
			let boomSWID = this.steelworkIds.withoutLength.boom;
			if (this.StructureLoads.hasOwnProperty(boomSWID))
				boomLevel = this.StructureLoads[boomSWID]['Boom_level'];
			else
				throw new Error(`There is no structure load property for boom with this steelwork ID -> "${boomSWID}"`);
			
			if (mastA['steelwork'] === 'Series 1')
				boomSW.level = boom['level'] + boomLevel;
			else
				boomSW.level = mastA['length'] + boomLevel;
		}
		
		
		
		return {
			mastA: mastASW,
			boom: this.isBoomExist() ? boomSW : null,
			mastB: this.isMastBExist() ? mastBSW :null
		};
	}
	
	getSteelworkLoads() {
		let getLoads = (steelSupport,swId, betaAngle) => {
			let loads;
			if (this.StructureLoads.hasOwnProperty(swId)) {
				loads = {...this.StructureLoads[swId]};
			} else {
				throw new Error(
						`There is no structure load property for ${steelSupport} with this steelwork ID -> "${swId}"`);
			}
			
			if (steelSupport==='mast A' && betaAngle && betaAngle > 45) {
				swapValue(loads, 'X_wind', 'Z_wind');
				swapValue(loads, 'X_Ice_Factor', 'Z_Ice_Factor');
				swapValue(loads, 'G_X', 'G_Z');
				swapValue(loads, 'C_X', 'C_Z');
				swapValue(loads, 'Wind_Left_No', 'Wind_High_No');
				swapValue(loads, 'Wind_Right_No', 'Wind_Low_No');
			}
			return loads;
		};
		let mastASWID = this.steelworkIds.withoutLength.mastA;
		let mastBSWID = this.steelworkIds.withoutLength.mastB;
		let boomSWID = this.steelworkIds.withoutLength.boom;
		return {
			masta: getLoads(
					'mast A',
					mastASWID,
					this.structureBasics['mast_a']['beta_angle']
			),
			boom: this.isBoomExist() ? getLoads('boom',boomSWID) : null,
			mastb: this.isMastBExist() ? getLoads('mast B',mastBSWID) : null,
		};
	}
	
	getSteelworkId() {
		let structureType = this.structureInfo['structure_type'];
		let mastASW = this.structureBasics['mast_a']['steelwork'];
		let mastBSW = this.structureBasics['mast_b']['steelwork'];
		let boomSW = this.structureBasics['boom']['steelwork'];
		let mastALen = this.structureBasics['mast_a']['length'];
		let mastBLen = this.structureBasics['mast_b']['length'];
		let boomLen = this.structureBasics['boom']['length'];
		let mastAIdArray = [structureType, 'Mast', mastASW];
		let mastBIdArray = [structureType, 'Mast', mastBSW];
		let boomIdArray = [structureType, 'Boom', boomSW];
		let steelworkIds = {
			mastA: undefined,
			mastB: undefined,
			boom: undefined,
			withoutLength: {
				mastA: undefined,
				mastB: undefined,
				boom: undefined,
			},
		};
		// MAST A
		if (
				!(
						mastASW.substring(0, 2) === 'UC' ||
						mastASW.substring(0, 3) === 'SHS' ||
						mastASW.substring(0, 3) === 'RHS'
				)
		) {
			steelworkIds.mastA = [...mastAIdArray, mastALen].join('_');
			steelworkIds.withoutLength.mastA = mastAIdArray.join('_');
		} else {
			steelworkIds.mastA = mastAIdArray.join('_');
			steelworkIds.withoutLength.mastA = mastAIdArray.join('_');
		}
		
		// MAST B
		if (
				!(
						mastBSW.substring(0, 2) === 'UC' ||
						mastBSW.substring(0, 3) === 'SHS' ||
						mastBSW.substring(0, 3) === 'RHS'
				)
		) {
			steelworkIds.mastB = [...mastBIdArray, mastBLen].join('_');
			steelworkIds.withoutLength.mastB = mastBIdArray.join('_');
		} else {
			steelworkIds.mastB = mastBIdArray.join('_');
			steelworkIds.withoutLength.mastB = mastBIdArray.join('_');
		}
		
		// BOOM
		steelworkIds.boom = [...boomIdArray, boomLen].join('_');
		steelworkIds.withoutLength.boom = boomIdArray.join('_');
		return steelworkIds;
	}
	
	calculateLoadCases() {
		//Check if  Accidental Loads Apply
		let accidental;
		this.anchors.forEach((anchor) => {
			if (anchor['tension']['accidental_load_case'] === 'Yes')
				accidental = true;
		});
		let alf = this.alf;
		let windFactors = this.windFactors;
		let lcFactors = this.LoadCombinations['factors'];
		
		let putLoadCombs = (loadcombs) => {
			loadcombs.forEach((lc) => {
				this.skycivModel.load_combinations[lc['id']] = {};
				this.skycivModel.load_combinations[lc['id']]['name'] = lc['name'];
				let affected = [];
				lc['affected'].forEach((aff) => {
					affected.push(aff['factor']);
					this.skycivModel['load_combinations'][lc.id][aff['factor']] = +(
							alf *
							aff['alfCoefficient'] *
							(aff['windFactors'] ? windFactors[aff['windFactors']] : 1)
					).toFixed(FD);
				});
				//Put not affected factors to 0
				let notAffected = lcFactors.filter((x) => !affected.includes(x));
				notAffected.forEach((na) => {
					this.skycivModel.load_combinations[lc.id][na] = 0;
				});
			});
		};
		putLoadCombs(this.LoadCombinations['regular']);
		if (accidental)
			putLoadCombs(this.LoadCombinations['accidental']);
		
	}
	
	// Structure
	calculateStructureGeometry() {
		this.calculateMastAGeometry();
		
		if (this.isBoomExist()) 
			this.calculateBoomGeometry();
		
		if (this.isMastBExist()) 
			this.calculateMastBGeometry();
		
	}
	
	calculateMastAGeometry() {
		// Putting Nodes
		let mastANodes;
		if (this.StructureNodes.hasOwnProperty(this.steelworkIds.mastA)) {
			mastANodes = {...this.StructureNodes[this.steelworkIds.mastA]};
		} else {
			throw new Error(
					`There is no structure node data for mast A with this steelwork ID -> "${this.steelworkIds.mastA}"`);
		}
		mastANodes['nodes'].forEach((node) => {
			// Adding nodeId reference for further use
			this.nodesSWGuide[node['id']] = SWNames.MASTA;
			// Modify X and Z for TTC
			if (
					this.structureType === 'TTC' &&
					this.steelworks.boom.ttc_direction === 'left'
			) {
				node['x'] *= -1;
				node['z'] *= -1;
			}
			// Adding node with its ID as key
			let {id, ...nodeWithoutId} = node;
			this.skycivModel.nodes[node['id']] = nodeWithoutId;
		});
		
		// Putting Supports
		if (mastANodes['supports'].length > 0) {
			mastANodes['supports'].forEach((support) => {
				// Adding support with its ID as key
				let {id, ...supportWithoutId} = support;
				this.skycivModel.supports[support['id']] = supportWithoutId;
			});
		}
		
		// Putting Members
		let mastAMembers;
		if (this.StructureMembers.hasOwnProperty(this.steelworkIds.mastA)) {
			mastAMembers = [...this.StructureMembers[this.steelworkIds.mastA]];
		} else {
			throw new Error(
					`There is no structure member data for mast A with this steelwork ID -> "${this.steelworkIds.mastA}"`);
		}
		mastAMembers.forEach((member) => {
			// Modify for TTC
			if (
					this.structureType === 'TTC' &&
					this.steelworks.boom.ttc_direction === 'left'
			) {
				member = this.modifyMember({...member});
			}
			// Adding memberId reference for further use
			this.membersSWGuide[member['id']] = {
				sw: SWNames.MASTA,
				Wind_ID: member['Wind_ID'],
				Ky: member['Ky'] ? member['Ky'] : 0,
				Kz: member['Kz'] ? member['Kz'] : 0,
				Ly: member['Ly'] ? member['Ly'] : 0 ,
				Lz: member['Lz'] ? member['Lz'] : 0,
			};
			// Adding member with its ID as key
			let {
				id,
				Wind_ID,
				Ky,
				Kz,
				Ly,
				Lz,
				...memberWithoutUnneeded
			} = member;
			this.skycivModel.members[member['id']] = memberWithoutUnneeded;
		});
		
		// Height and orientation of UC and SHS masts
		let mastASW = this.steelworks.mastA.steelwork;
		if (
				mastASW.substring(0, 2) === 'UC' ||
				mastASW.substring(0, 3) === 'SHS' ||
				mastASW.substring(0, 3) === 'RHS'
		) {
			this.skycivModel.nodes['2']['y'] = +this.steelworks.mastA.length;
			this.skycivModel.members['1']['rotation_angle'] =
					+this.steelworks.mastA.beta_angle;
		}
	}
	
	calculateBoomGeometry() {
		// Putting Nodes
		let boomNodes;
		if (this.StructureNodes.hasOwnProperty(this.steelworkIds.boom)) {
			boomNodes = {...this.StructureNodes[this.steelworkIds.boom]};
		} else {
			throw new Error(
					`There is no structure node data for boom with this steelwork ID -> "${this.steelworkIds.boom}"`);
		}
		boomNodes['nodes'].forEach((node) => {
			// Mark boom nodes by adding a constant number
			node['id'] += BridgeIdOffset;
			// Adding nodeId reference for further use
			this.nodesSWGuide[node['id']] = SWNames.BOOM;
			// Modify X and Z for TTC
			if (
					this.structureType === 'TTC' &&
					this.steelworks.boom.ttc_direction === 'left'
			) {
				node['x'] *= -1;
				node['z'] *= -1;
			}
			// Modify Y level
			node['y'] += this.steelworks?.boom?.level || 0;
			// Adding node with its ID as key
			let {id, ...nodeWithoutId} = node;
			this.skycivModel.nodes[node['id']] = nodeWithoutId;
		});
		
		// Putting Members
		let boomMembers;
		if (this.StructureMembers.hasOwnProperty(this.steelworkIds.boom)) {
			boomMembers = [...this.StructureMembers[this.steelworkIds.boom]];
		} else {
			throw new Error(
					`There is no structure member data for boom with this steelwork ID -> "${this.steelworkIds.boom}"`);
		}
		boomMembers.forEach((member) => {
			// Mark boom members and their nodes by adding a constant number
			member['id'] += BridgeIdOffset;
			member['node_A'] += BridgeIdOffset;
			member['node_B'] += BridgeIdOffset;
			
			// Modify for TTC
			if (
					this.structureType === 'TTC' &&
					this.steelworks.boom.ttc_direction === 'left'
			) {
				member = this.modifyMember({...member});
			}
			// Adding memberId reference for further use
			this.membersSWGuide[member['id']] = {
				sw: SWNames.BOOM,
				Wind_ID: member['Wind_ID'],
				Ky: member['Ky'] ? member['Ky'] : 0,
				Kz: member['Kz'] ? member['Kz'] : 0,
				Ly: member['Ly'] ? member['Ly'] : 0,
				Lz: member['Lz'] ? member['Lz'] : 0,
			};
			// Adding member with its ID as key
			let {
				id,
				Wind_ID,
				Ky,
				Kz,
				Ly,
				Lz,
				...memberWithoutUnneeded
			} = member;
			this.skycivModel.members[member['id']] = memberWithoutUnneeded;
		});
	}
	
	calculateMastBGeometry() {
		// Putting Nodes
		let mastBNodes;
		if (this.StructureNodes.hasOwnProperty(this.steelworkIds.mastB)) {
			mastBNodes = {...this.StructureNodes[this.steelworkIds.mastB]};
		} else {
			throw new Error(
					`There is no structure node data for mast B with this steelwork ID -> "${this.steelworkIds.mastB}"`);
		}
		mastBNodes['nodes'].forEach((node) => {
			// Mark boom nodes by adding a constant number
			node['id'] += MastBIdOffset;
			// Adding nodeId reference for further use
			this.nodesSWGuide[node['id']] = SWNames.MASTB;
			// Change X Level and Mirror
			node['x'] = (this.isBoomExist() ? this.steelworks?.boom?.length : 0) - node['x'];
			// Modify Y level
			node['y'] += -this.steelworks.mastA.ffl + this.steelworks.mastB.ffl;
			// Mirror Z
			node['z'] *= -1;
			// Adding node with its ID as key
			let {id, ...nodeWithoutId} = node;
			this.skycivModel.nodes[node['id']] = nodeWithoutId;
		});
		
		// Putting Supports
		if (mastBNodes['supports'].length > 0) {
			mastBNodes['supports'].forEach((support) => {
				// Mark boom nodes by adding a constant number
				support['id'] += MastBIdOffset;
				support['node'] += MastBIdOffset;
				// Adding support with its ID as key
				let {id, ...supportWithoutId} = support;
				this.skycivModel.supports[support['id']] = supportWithoutId;
			});
		}
		
		// Putting Members
		let mastBMembers;
		if (this.StructureMembers.hasOwnProperty(this.steelworkIds.mastB)) {
			mastBMembers = [...this.StructureMembers[this.steelworkIds.mastB]];
		} else {
			throw new Error(
					`There is no structure member data for mast B with this steelwork ID -> "${this.steelworkIds.mastB}"`);
		}
		mastBMembers.forEach((member) => {
			// Mark boom members and their nodes by adding a constant number
			member['id'] += MastBIdOffset;
			member['node_A'] += MastBIdOffset;
			member['node_B'] += MastBIdOffset;
			
			// Modify member
			member = this.modifyMember({...member});
			// Adding memberId reference for further use
			this.membersSWGuide[member['id']] = {
				sw: SWNames.MASTB,
				Wind_ID: member['Wind_ID'],
				Ky: member['Ky'] ? member['Ky'] : 0,
				Kz: member['Kz'] ? member['Kz'] : 0,
				Ly: member['Ly'] ? member['Ly'] : 0,
				Lz: member['Lz'] ? member['Lz'] : 0,
			};
			// Adding member with its ID as key
			let {
				id,
				Wind_ID,
				Ky,
				Kz,
				Ly,
				Lz,
				...memberWithoutUnneeded
			} = member;
			this.skycivModel.members[member['id']] = memberWithoutUnneeded;
		});
		
		this.removeDuplicateNodes();
	}
	
	modifyMember(member) {
		// Rotation if X and Z of both nodes is the same
		let nodeA = this.skycivModel.nodes[member['node_A']];
		let nodeB = this.skycivModel.nodes[member['node_B']];
		if (nodeA['x'] === nodeB['x'] && nodeA['z'] === nodeB['z']) {
			member['rotation_angle'] += 180;
		}
		// X and Z Offset
		member['offset_Ax'] *= -1;
		member['offset_Az'] *= -1;
		member['offset_Bx'] *= -1;
		member['offset_Bz'] *= -1;
		// Wind_ID modify
		if (member['Wind_ID']) {
			let temp = String(member['Wind_ID']).split('');
			member['Wind_ID'] = +[temp[1], temp[0], temp[3], temp[2]].join('');
		}
		return member;
	}
	
	removeDuplicateNodes() {
		let nodes = this.skycivModel.nodes;
		let members = this.skycivModel.members;
		for (let nodeAId in nodes) {
			if (this.nodesSWGuide[nodeAId] === SWNames.BOOM) {
				for (let nodeBId in nodes) {
					if (JSON.stringify(nodes[nodeAId]) ===
							JSON.stringify(nodes[nodeBId]) &&
							this.nodesSWGuide[nodeBId] !== SWNames.BOOM) {
						let candidateNodeId = +nodeAId;
						delete this.skycivModel.nodes[nodeAId];
						for (let memberId in members) {
							if (members[memberId]['node_A'] === candidateNodeId) {
								members[memberId]['node_A'] = nodeBId;
							}
							if (members[memberId]['node_B'] === candidateNodeId) {
								members[memberId]['node_B'] = nodeBId;
							}
						}
					}
				}
			}
		}
	}
	
	calculateStructureLoads() {
		let swWinds = this.steelworksWinds;
		let swLoads = this.steelworksLoads;
		
		// Add self weight of steelwork and ice on steelwork
		this.skycivModel.self_weight['1'] = {x: 0, y: -1, z: -0, LG: 'SW1'};
		this.skycivModel.self_weight['2'] = {
			x: 0,
			y: this.iceLoad,
			z: 0,
			LG: 'SW2',
		};
		// Add Wind Loads
		let members = this.skycivModel.members;
		let windLoads = [];
		let windNames = ['Wind_Left', 'Wind_Right', 'Wind_High', 'Wind_Low'];
		let xFactor;
		let zFactor;
		let loadSuffix = ['', '_Ice'];
		for (let id in members) {
			if (this.membersSWGuide[id]['Wind_ID']) {
				let windIds = String(this.membersSWGuide[id]['Wind_ID']).split('');
				windIds.forEach((wind, index) => {
					if (wind === '1') {
						let sw = this.membersSWGuide[id]['sw'];
						windLoads[0] = swWinds[sw].left / swLoads[sw]['Wind_Left_No'];
						windLoads[1] = swWinds[sw].right / swLoads[sw]['Wind_Right_No'];
						windLoads[2] = swWinds[sw].high / swLoads[sw]['Wind_High_No'];
						windLoads[3] = swWinds[sw].low / swLoads[sw]['Wind_Low_No'];
						if (index === 1 || index === 0) {
							zFactor = [0, 0];
							xFactor = [1, swLoads[sw]['X_Ice_Factor'] * 0.5];
						} else {
							xFactor = [0, 0];
							zFactor = [1, swLoads[sw]['Z_Ice_Factor'] * 0.5];
						}
						let dl = this.skycivModel.distributed_loads;
						let dlCount = Object.values(dl).length;
						for (let n = 0; n <= 1; n++) {
							dl[String(dlCount + 1 + n)] = {
								member: id,
								x_mag_A: +(windLoads[index] * xFactor[n]).toFixed(FD),
								y_mag_A: 0,
								z_mag_A: +(windLoads[index] * zFactor[n]).toFixed(FD),
								x_mag_B: +(windLoads[index] * xFactor[n]).toFixed(FD),
								y_mag_B: 0,
								z_mag_B: +(windLoads[index] * zFactor[n]).toFixed(FD),
								position_A: 0,
								position_B: 100,
								load_group: windNames[index] + loadSuffix[n],
								axes: 'global',
							};
						}
					}
				});
			}
		}

		// Add weight of mast base-plates
		let supports = this.skycivModel.supports;
		let i = 1;
		for (let id in supports) {
			let pl = this.skycivModel.point_loads;
			pl[i] = {
				type: 'n',
				node: id,
				x_mag: 0,
				y_mag: +((-9.81 * 0.001 * swLoads[this.nodesSWGuide[id]]['Base_Mass']) /
						swLoads[this.nodesSWGuide[id]]['Base_Mass_No']).toFixed(FD),
				z_mag: 0,
				load_group: 'Steel_Other',
			};
			i++;
		}
	}

	addNodesAndMembersForWires(newNodeCoordinates, resourceMembers, data) {
		// Add Nodes
		let newNodeIds = [];
		newNodeCoordinates.forEach((node, i) => {
			if (i > 0) {
				// Search for similar nodes in existing nodes
				for (let id in this.skycivModel.nodes) {
					if (JSON.stringify(this.skycivModel.nodes[id]) ===
							JSON.stringify(node)) {
						newNodeIds[i] = id;
					}
				}
				// if(there isn't add new node with new id
				if (!newNodeIds[i]) {
					let newNodeId = getMaxKey(this.skycivModel.nodes) + 1;
					
					// Check additional condition for switches
					if (data &&
							(data['equipment'] === SWNames.SWITCH ||
									data['equipment'] === SWNames.CONSTRUCTION_LOAD)) {
						if (data['tempDirection'][i - 1] === 1) {
							newNodeIds[i] = newNodeId;
							this.skycivModel.nodes[newNodeId] = node;
						}
						// Default case
					} else {
						newNodeIds[i] = newNodeId;
						this.skycivModel.nodes[newNodeId] = node;
					}
					// Just for ties
					if (i === 1 && data && data['equipment'] === SWNames.TIE) {
						this.skycivModel.supports[newNodeId] = {
							node: newNodeId,
							restraint_code: 'FFFFRR',
						};
						if (data['steelSupport'].replaceAll(' ', '').toLowerCase() ===
								SWNames.MASTA)
							this.nodesSWGuide[newNodeId] = SWNames.TIEA;
						else if (data['steelSupport'].replaceAll(' ', '').toLowerCase() ===
								SWNames.MASTB)
							this.nodesSWGuide[newNodeId] = SWNames.TIEB;
					}
				}
			}
		});
		
		// Set wire's node information for further use
		if (data && data['equipment'] && data.hasOwnProperty('equipmentId')) {
			let wireData;
			switch (data['equipment']) {
				case SWNames.WIRE_RUN:
					wireData = {
						conNode: newNodeIds[1],
						catNode: newNodeIds[2],
						catNodeSteel: newNodeIds[3],
						wireRunNumber: data['wireRunNumber'],
					};
					break;
				case SWNames.ANCILLARY:
					wireData = {
						wireNode: newNodeIds[1],
						steelNode: newNodeIds[2],
						wireName: data['wireName'],
					};
					break;
				case SWNames.ANCHOR:
					if (data['steelSupport'] === SWNames.BOOM) {
						wireData = {
							wireNode: newNodeIds[1],
							steelNode: newNodeIds[1],
							anchorName: data['anchorName'],
						};
					} else {
						wireData = {
							wireNode: newNodeIds[1],
							steelNode: newNodeIds[2],
							anchorName: data['anchorName'],
						};
					}
					break;
				case SWNames.TIE:
					wireData = {
						foundationNode: newNodeIds[1],
						tieNode: newNodeIds[2],
					};
					break;
				case SWNames.SWITCH:
				case SWNames.CONSTRUCTION_LOAD:
					if (data['steelSupport'] === SWNames.BOOM) {
						wireData = {
							wireNode: newNodeIds[1],
						};
					} else {
						for (let j = 0; j < 4; j++)
							if (data['tempDirection'][j] === 1)
								wireData = {wireNode: newNodeIds[j + 1]};
					}
					break;
			}
			this.wiringGuide[data['equipment']][data['equipmentId']] = wireData;
		}
		
		// Add Members
		let newMemberIds = [];
		resourceMembers.forEach((member, i) => {
			// Search for similar members in existing members
			for (let id in this.skycivModel.members) {
				let wrMemberNodes = [
					newNodeIds[member['node_A']],
					newNodeIds[member['node_B']]];
				let existingMemberNodes = [
					this.skycivModel.members[id]['node_A'],
					this.skycivModel.members[id]['node_B']];
				if (existingMemberNodes.join('_') === wrMemberNodes.join('-') ||
						existingMemberNodes.join('_') ===
						[...wrMemberNodes].reverse().join('-')) {
					newMemberIds[i] = id;
				}
			}
			// if(there isn't add new member with new id
			if (!newMemberIds[i]) {
				let newMemberId = getMaxKey(this.skycivModel.members) + 1;
				newMemberIds[i] = newMemberId;
				
				// Just for ties
				if (data && data['equipment'] === SWNames.TIE) {
					if (data['steelSupport'].replaceAll(' ', '').toLowerCase() ===
							SWNames.MASTA)
						this.membersSWGuide[newMemberId] = {sw: SWNames.TIEA};
					else if (data['steelSupport'].replaceAll(' ', '').toLowerCase() ===
							SWNames.MASTB)
						this.membersSWGuide[newMemberId] = {sw: SWNames.TIEB};
					if (i === 0) {
						this.skycivModel.members[newMemberId] = {
							node_A: newNodeIds[member['node_A']],
							node_B: newNodeIds[member['node_B']],
							type: 'normal',
							section_id: 12,
							fixity_A: 'FFFFRR',
							fixity_B: 'FFFFRR',
						};
					} else {
						this.skycivModel.members[newMemberId] = {
							node_A: newNodeIds[member['node_A']],
							node_B: newNodeIds[member['node_B']],
							type: 'normal',
							section_id: 11,
							fixity_A: 'FFFFFF',
							fixity_B: 'FFFFFF',
						};
					}
					// Check additional condition for switches
				} else if (data &&
						(data['equipment'] === SWNames.SWITCH || data['equipment'] ===
								SWNames.CONSTRUCTION_LOAD)) {
					if (data['tempDirection'][i] === 1) {
						this.skycivModel.members[newMemberId] = {
							node_A: newNodeIds[member['node_A']],
							node_B: newNodeIds[member['node_B']],
							type: 'normal',
							section_id: 11,
							fixity_A: 'FFFFFF',
							fixity_B: 'FFFFFF',
						};
					}
					// Default case
				} else {
					this.skycivModel.members[newMemberId] = {
						node_A: newNodeIds[member['node_A']],
						node_B: newNodeIds[member['node_B']],
						type: 'normal',
						section_id: 11,
						fixity_A: 'FFFFFF',
						fixity_B: 'FFFFFF',
					};
				}
			}
			
		});
		// Set wire's member information for further use
		if (data && data['equipment'] && data.hasOwnProperty('equipmentId')) {
			let wireData;
			switch (data['equipment']) {
				case SWNames.WIRE_RUN:
					wireData = {
						conMember: newMemberIds[0],
						catMember: newMemberIds[1],
					};
					break;
				case SWNames.ANCILLARY:
					wireData = {
						wireMember: newMemberIds[0],
					};
					break;
				case SWNames.TIE:
					wireData = {
						wireMember: newMemberIds[0],
					};
					break;
				default:
					wireData = {};
			}
			this.wiringGuide[data['equipment']][data['equipmentId']] = {
				...this.wiringGuide[data['equipment']][data['equipmentId']],
				...wireData,
			};
			
		}
	}
	
	addPointLoads(type, id, position, x_mag, y_mag, z_mag, load_group) {
		let newId = getMaxKey(this.skycivModel.point_loads) + 1;
		if (type === 'n')
			this.skycivModel.point_loads[newId] = {
				type,
				node: id,
				x_mag: +(x_mag).toFixed(FD),
				y_mag: +(y_mag).toFixed(FD),
				z_mag: +(z_mag).toFixed(FD),
				load_group,
			};
		else if (type === 'm')
			this.skycivModel.point_loads[newId] = {
				type,
				member: id,
				position,
				x_mag: +(x_mag).toFixed(FD),
				y_mag: +(y_mag).toFixed(FD),
				z_mag: +(z_mag).toFixed(FD),
				load_group,
			};
	}
	
	addDistributedLoads(member, x_mag_A, y_mag_A, z_mag_A, load_group) {
		let newId = getMaxKey(this.skycivModel.distributed_loads) + 1;
		this.skycivModel.distributed_loads[newId] = {
			member,
			x_mag_A: +(x_mag_A).toFixed(FD),
			y_mag_A: +(y_mag_A).toFixed(FD),
			z_mag_A: +(z_mag_A).toFixed(FD),
			x_mag_B: +(x_mag_A).toFixed(FD),
			y_mag_B: +(y_mag_A).toFixed(FD),
			z_mag_B: +(z_mag_A).toFixed(FD),
			position_A: 0,
			position_B: 100,
			load_group,
			axes: 'global',
		};
	}
	
	// WireRuns
	calculateWireRunsGeometry() {
		this.wireRuns.forEach((wr, wrID) => {
			let wrNodes, wrMembers, tempMast, tempSpan, tempReach;
			const tempRecos = wr.geometry.recos > 0 ? 1 : -1;
			const steelSupport = wr.steel_support.replaceAll(' ', '').toLowerCase();
			switch (steelSupport) {
				case SWNames.MASTA:
					if (this.WireRunNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						wrNodes = [...this.WireRunNodes[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no wire run node data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					
					if (this.WireRunMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						wrMembers = [...this.WireRunMembers[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no wire run member data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					tempMast = 1;
					tempSpan = 0;
					tempReach = 0;
					break;
				case SWNames.MASTB:
					if (this.WireRunNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						wrNodes = [...this.WireRunNodes[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no wire run node data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					
					if (this.WireRunMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						wrMembers = [...this.WireRunMembers[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no wire run member data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					
					tempMast = tempRecos;
					tempSpan = this.steelworks?.boom?.length || 0;
					tempReach = 0;
					break;
				case SWNames.BOOM:
					if (this.WireRunNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						wrNodes = [...this.WireRunNodes[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no wire run node data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					
					if (this.WireRunMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						wrMembers = [...this.WireRunMembers[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no wire run member data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					
					tempMast = 0;
					tempSpan = 0;
					tempReach = 1;
					break;
			}
			// Calculate Node Coordinates
			// 0->central node 1-> contact 2->catenary ...
			let nodeCords = [];
			nodeCords[1] = {
				x: +(tempSpan + wr.geometry.recos + tempRecos * 0.718 +
						wr.geometry.stagger).toFixed(FD),
				y: +(wr.geometry.contact_height
						- this.steelworks.mastA.ffl -
						wr.geometry.track_level_difference).toFixed(FD),
				z: 0,
			};
			nodeCords[2] = {
				x: nodeCords[1].x,
				y: +(wr.geometry.catenary_height
						- this.steelworks.mastA.ffl
						- wr.geometry.track_level_difference).toFixed(FD),
				z: 0,
			};
			nodeCords[0] = {
				x: +(tempSpan + tempReach *
						(nodeCords[2].x - wr.geometry.reach)).toFixed(FD),
				y:
						+((tempMast * tempMast * nodeCords[2].y) +
								(tempReach * this.isBoomExist()?this.steelworks.boom.level : 0)).toFixed(FD),
				z: 0,
			};
			nodeCords[3] = {
				x: +(nodeCords[0].x + wrNodes[0].x * tempRecos * tempMast).toFixed(FD),
				y: nodeCords[2].y,
				z: 0,
			};
			if (wrNodes.length > 1) {
				wrNodes.forEach((wrNode, i) => {
					if (i > 0) {
						nodeCords.push({
							               x: +(nodeCords[0].x + wrNode.x * tempRecos *
									               tempMast).toFixed(FD),
							               y: +(nodeCords[0].y + wrNode.y).toFixed(FD),
							               z: +(nodeCords[0].z + wrNode.z).toFixed(FD),
						               });
					}
				});
				
				
			}
			this.addNodesAndMembersForWires(nodeCords, wrMembers, {
				equipment: SWNames.WIRE_RUN,
				equipmentId: wrID,
				wireRunNumber: wr.wire_run_number,
			});
		});
	}
	
	calculateWireRunsLoads() {
		this.wireRuns.forEach((wr, wrID) => {
			// Export factors from user input
			const conNode = this.wiringGuide.wireRun[wrID].conNode
					, catNode = this.wiringGuide.wireRun[wrID].catNode
					, catSteelNode = this.wiringGuide.wireRun[wrID].catNodeSteel
					, catMember = this.wiringGuide.wireRun[wrID].catMember
					, cWr = wr.geometry.drag_factor
					, vlReg = wr.registration.weight_of_registration
					, areaReg = wr.registration.area_of_registration
					, areaRegIce = areaReg * 1.2
					, vlRegIce = 4 * areaReg * 0.0095 * 9.81 * 0.917
					, vl = wr.equipment.weight_of_equipment
					, vlIce = wr.equipment.weight_of_ice_on_equipment
					, rlCon18 = wr.radial_loads.contact_at_18
					, rlCat18 = wr.radial_loads.catenary_at_18
					, rlCon5 = wr.radial_loads.contact_at_5
					, rlCat5 = wr.radial_loads.catenary_at_5
					, rlCon10 = wr.radial_loads.contact_at_10
					, rlCat10 = wr.radial_loads.catenary_at_10
					, wlConLeft = wr.wind_loads.contact_from_left
					, wlConRight = wr.wind_loads.contact_from_right
					, wlCatLeft = wr.wind_loads.catenary_from_left
					, wlCatRight = wr.wind_loads.catenary_from_right
					, wlConLeftIce = wr.wind_loads.contact_from_left_with_ice
					, wlConRightIce = wr.wind_loads.contact_from_right_with_ice
					, wlCatLeftIce = wr.wind_loads.catenary_from_left_with_ice
					, wlCatRightIce = wr.wind_loads.catenary_from_right_with_ice;
			
			// Putting loads on final result
			let group = 'Dead_18_Wiring';
			this.addPointLoads('n', conNode, 0, rlCon18, 0, 0, group);
			this.addPointLoads('n', catNode, 0, rlCat18, 0, 0, group);
			this.addPointLoads('n', catNode, 0, 0, -1 * vl, 0, group);
			this.addPointLoads('m', catMember, 50, 0, -1 * vlReg, 0, group);
			
			group = 'Dead_10_Wiring';
			this.addPointLoads('n', conNode, 0, rlCon10, 0, 0, group);
			this.addPointLoads('n', catNode, 0, rlCat10, 0, 0, group);
			this.addPointLoads('n', catNode, 0, 0, -1 * vl, 0, group);
			this.addPointLoads('m', catMember, 50, 0, -1 * vlReg, 0, group);
			
			group = 'Dead_5_Wiring';
			this.addPointLoads('n', conNode, 0, rlCon5, 0, 0, group);
			this.addPointLoads('n', catNode, 0, rlCat5, 0, 0, group);
			this.addPointLoads('n', catNode, 0, 0, -1 * vl, 0, group);
			this.addPointLoads('m', catMember, 50, 0, -1 * vlReg, 0, group);
			
			group = 'Wind_Left';
			this.addPointLoads('n', conNode, 0, wlConLeft, 0, 0, group);
			this.addPointLoads('n', catNode, 0, wlCatLeft, 0, 0, group);
			
			group = 'Wind_Right';
			this.addPointLoads('n', conNode, 0, -1 * wlConRight, 0, 0, group);
			this.addPointLoads('n', catNode, 0, -1 * wlCatRight, 0, 0, group);
			
			group = 'Wind_High';
			this.addPointLoads('n', catSteelNode, 0, 0, 0,
			                   gWr * cWr * areaReg * this.winds.qpHigh, group);
			
			group = 'Wind_Low';
			this.addPointLoads('n', catSteelNode, 0, 0, 0,
			                   -1 * gWr * cWr * areaReg * this.winds.qpLow, group);
			
			group = 'Wind_Left_Ice';
			this.addPointLoads('n', conNode, 0, wlConLeftIce, 0, 0, group);
			this.addPointLoads('n', catNode, 0, wlCatLeftIce, 0, 0, group);
			
			group = 'Wind_Right_Ice';
			this.addPointLoads('n', conNode, 0, -1 * wlConRightIce, 0, 0, group);
			this.addPointLoads('n', catNode, 0, -1 * wlCatRightIce, 0, 0, group);
			
			group = 'Wind_High_Ice';
			this.addPointLoads('n', catSteelNode, 0, 0, 0,
			                   0.5 * gWr * cWr * areaRegIce * this.winds.qpHigh,
			                   group);
			
			group = 'Wind_Low_Ice';
			this.addPointLoads('n', catSteelNode, 0, 0, 0,
			                   -0.5 * gWr * cWr * areaRegIce * this.winds.qpLow,
			                   group);
			
			group = 'ICE_Other';
			this.addPointLoads('n', catNode, 0, 0, -1 * vlIce, 0, group);
			this.addPointLoads('m', catMember, 50, 0, -1 * vlRegIce, 0, group);
		});
	}
	
	// AncillaryWires
	calculateAncillaryWiresGeometry() {
		this.ancillaryWires.forEach((aw, awID) => {
			let awNodes, awMembers, tempMast, tempSpan, tempReach, tempBridge;
			const hO = this.steelworks?.boom?.length || 0;
			const levelO = this.steelworks?.boom?.level || 0;
			const fflA = this.steelworks.mastA.ffl;
			const hAW = aw.geometry.wire_height;
			const hOAW = aw.geometry.offset_from_mast_centre;
			const reach = aw.geometry.reach;
			const steelSupport = aw.steel_support.replaceAll(' ', '').toLowerCase();
			switch (steelSupport) {
				case SWNames.MASTA:
					if (this.AncillaryNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						awNodes = [...this.AncillaryNodes[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no ancillary node data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					
					if (this.AncillaryMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						awMembers = [...this.AncillaryMembers[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no ancillary member data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					tempMast = hOAW > 0 ? 1 : -1;
					tempSpan = 0;
					tempReach = 0;
					tempBridge = 0;
					break;
				case SWNames.MASTB:
					if (this.AncillaryNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						awNodes = [...this.AncillaryNodes[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no ancillary node data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					
					if (this.AncillaryMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						awMembers = [...this.AncillaryMembers[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no ancillary member data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					tempMast = hOAW > hO ? 1 : -1;
					tempSpan = hO;
					tempReach = 0;
					tempBridge = 0;
					break;
				case SWNames.BOOM:
					if (this.AncillaryNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						awNodes = [...this.AncillaryNodes[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no ancillary node data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					
					if (this.AncillaryMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						awMembers = [...this.AncillaryMembers[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no ancillary member data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					tempMast = 0;
					tempSpan = 0;
					tempReach = 1;
					tempBridge = ((hAW - fflA) <= levelO) ? 1 : -1;
					break;
			}
			let nodeCords = [];
			nodeCords[1] = {
				x: +(tempSpan + hOAW).toFixed(FD),
				y: +(hAW - fflA).toFixed(FD),
				z: 0,
			};
			nodeCords[2] = {
				x: +(tempMast * awNodes[0].x + tempSpan + tempReach *
						(nodeCords[1].x - reach)).toFixed(FD),
				y: nodeCords[1].y,
				z: 0,
			};
			nodeCords[0] = {
				x: +(tempSpan + tempReach * (nodeCords[1].x - reach)).toFixed(FD),
				y: +((tempMast * tempMast * nodeCords[1].y) +
						(tempReach * levelO)).toFixed(FD),
				z: 0,
			};
			if (awNodes.length > 1) {
				awNodes.forEach((awNode, i) => {
					if (i > 0) {
						nodeCords.push({
							               x: +(nodeCords[0].x + awNode.x * tempMast).toFixed(
									               FD),
							               y: +(nodeCords[0].y + awNode.y *
									               tempBridge).toFixed(FD),
							               z: nodeCords[0].z + awNode.z,
						               });
					}
				});
				
			}
			this.addNodesAndMembersForWires(nodeCords, awMembers, {
				equipment: SWNames.ANCILLARY,
				equipmentId: awID,
				wireName: aw.wire_name,
			});
		});
	}
	
	calculateAncillaryWiresLoads() {
		this.ancillaryWires.forEach((aw, awID) => {
			
			// Export factors from user input
			const awNode = this.wiringGuide.ancillary[awID].wireNode
					, awMember = this.wiringGuide.ancillary[awID].wireMember
					, cAw = aw.geometry.drag_factor
					, vlAwReg = aw.registration.weight_of_support
					, areaAw = aw.registration.area_of_support
					, areaAwIce = areaAw * 1.2
					, vlAwRegIce = 4 * areaAw * 0.0095 * 9.81 * 0.917
					, vlAw = aw.equipment.weight_of_equipment
					, vlAwIce = aw.equipment.weight_of_ice_on_equipment
					, rlAw18 = aw.radial_loads.radial_load_at_18
					, rlAw5 = aw.radial_loads.radial_load_at_5
					, rlAw10 = aw.radial_loads.radial_load_at_10
					, wlAwLeft = aw.wind_loads.wind_load_from_left
					, wlAwRight = aw.wind_loads.wind_load_from_right
					, wlAwLeftIce = aw.wind_loads.wind_load_from_left_with_ice
					, wlAwRightIce = aw.wind_loads.wind_load_from_right_with_ice;
			
			// Putting loads on final result
			let group = 'Dead_18_Wiring';
			this.addPointLoads('n', awNode, 0, rlAw18, 0, 0, group);
			this.addPointLoads('n', awNode, 0, 0, -1 * vlAw, 0, group);
			this.addPointLoads('m', awMember, 50, 0, -1 * vlAwReg, 0, group);
			
			group = 'Dead_10_Wiring';
			this.addPointLoads('n', awNode, 0, rlAw10, 0, 0, group);
			this.addPointLoads('n', awNode, 0, 0, -1 * vlAw, 0, group);
			this.addPointLoads('m', awMember, 50, 0, -1 * vlAwReg, 0, group);
			
			group = 'Dead_5_Wiring';
			this.addPointLoads('n', awNode, 0, rlAw5, 0, 0, group);
			this.addPointLoads('n', awNode, 0, 0, -1 * vlAw, 0, group);
			this.addPointLoads('m', awMember, 50, 0, -1 * vlAwReg, 0, group);
			
			group = 'Wind_Left';
			this.addPointLoads('n', awNode, 0, 1 * wlAwLeft, 0, 0, group);
			
			group = 'Wind_Right';
			this.addPointLoads('n', awNode, 0, -1 * wlAwRight, 0, 0, group);
			
			group = 'Wind_High';
			this.addPointLoads('m', awMember, 50, 0, 0, gAw * cAw * areaAw, group);
			
			group = 'Wind_Low';
			this.addPointLoads('m', awMember, 50, 0, 0,
			                   -1 * gAw * cAw * areaAw * this.winds.qpLow, group);
			
			group = 'Wind_Left_Ice';
			this.addPointLoads('n', awNode, 0, 1 * wlAwLeftIce, 0, 0, group);
			
			group = 'Wind_Right_Ice';
			this.addPointLoads('n', awNode, 0, -1 * wlAwRightIce, 0, 0, group);
			
			group = 'Wind_High_Ice';
			this.addPointLoads('m', awMember, 50, 0, 0,
			                   0.5 * gAw * cAw * areaAwIce * this.winds.qpHigh,
			                   group);
			
			group = 'Wind_Low_Ice';
			this.addPointLoads('m', awMember, 50, 0, 0,
			                   -0.5 * gAw * cAw * areaAwIce * this.winds.qpLow,
			                   group);
			
			group = 'ICE_Other';
			this.addPointLoads('n', awNode, 0, 0, -1 * vlAwIce, 0, group);
			this.addPointLoads('m', awMember, 50, 0, -1 * vlAwRegIce, 0, group);
			
		});
	}
	
	// Anchors
	calculateAnchorsGeometry() {
		this.anchors.forEach((an, anID) => {
			let anNodes, anMembers, tempMast, tempSpan, tempBridge;
			const hO = this.steelworks?.boom?.length || 0;
			const fflA = this.steelworks.mastA.ffl;
			const levelO = this.steelworks?.boom?.level || 0;
			const hAnchor = an.geometry.anchor_height;
			const direction = an.geometry.direction;
			const hOAN = an.geometry.offset_from_mast_centre;
			const tld = an.geometry.track_level_difference;
			const steelSupport = an.steel_support.replaceAll(' ', '').toLowerCase();
			switch (steelSupport) {
				case SWNames.MASTA:
					if (this.AnchorNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						anNodes = [...this.AnchorNodes[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no anchor node data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					
					if (this.AnchorMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						anMembers = [...this.AnchorMembers[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no anchor member data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					tempMast = direction === 'High Chainage' ? 1 : -1;
					tempSpan = 0;
					tempBridge = 0;
					break;
				case SWNames.MASTB:
					if (this.AnchorNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						anNodes = [...this.AnchorNodes[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no anchor node data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					
					if (this.AnchorMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						anMembers = [...this.AnchorMembers[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no anchor member data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					tempMast = direction === 'High Chainage' ? 1 : -1;
					tempSpan = hO;
					tempBridge = 0;
					break;
				case SWNames.BOOM:
					if (this.AnchorNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						anNodes = [...this.AnchorNodes[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no anchor node data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					
					if (this.AnchorMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						anMembers = [...this.AnchorMembers[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no anchor member data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					tempMast = 0;
					tempSpan = 0;
					tempBridge = direction === 'High Chainage' ? 1 : -1;
					break;
			}
			let nodeCords = [];
			//0 (Central Node)
			nodeCords[0] = {
				x: +(tempSpan + tempBridge * tempBridge * hOAN).toFixed(FD),
				y: +((tempMast * tempMast * (hAnchor - fflA - tld)) +
						(tempBridge * tempBridge * levelO)).toFixed(FD),
				z: 0,
			};
			nodeCords[1] = {
				x: nodeCords[0].x,
				y: +(hAnchor - fflA - tld + tempBridge * 0.001).toFixed(FD),
				z: +(anNodes[0].z * tempMast + anNodes[0].z * tempBridge).toFixed(FD),
			};
			if (anNodes.length > 1) {
				anNodes.forEach((awNode, i) => {
					if (i > 0) {
						nodeCords.push({
							               x: nodeCords[0].x + awNode.x,
							               y: nodeCords[0].y + awNode.y,
							               z: nodeCords[0].z + awNode.z * tempMast +
									               awNode.z * tempBridge,
						               });
					}
				});
			}
			
			this.addNodesAndMembersForWires(nodeCords, anMembers, {
				equipment: SWNames.ANCHOR,
				equipmentId: anID,
				steelSupport,
				anchorName: an.anchor_name,
			});
			
		});
	}
	
	calculateAnchorsLoads() {
		this.anchors.forEach((an, anID) => {
			const anchorNode = this.wiringGuide.anchor[anID].wireNode
					, anchorNodeSteel = this.wiringGuide.anchor[anID].steelNode
					, directionAnchor = an.geometry.direction
					, hoAnchor = an.geometry.offset_from_mast_centre
					, angleAnchor = an.geometry.angle
					, tempAngle = directionAnchor === 'High Chainage' ? -1 : 1
					, cAnchor = an.geometry.drag_factor
					, vlAnchorReg = an.registration.weight_of_support
					, vlAnchorRegIce = 4 * vlAnchorReg * 0.0095 * 9.81 * 0.917
					, areaAnchor = an.registration.area_of_support
					, areaAnchorIce = areaAnchor * 1.2
					, vlAnchor = an.equipment.weight_of_equipment
					, vlAnchorIce = an.equipment.weight_of_ice_on_equipment
					, tAnchor18 = an.tension.tension_at_18
					, tAnchor5 = an.tension.tension_at_5
					, tAnchor10 = an.tension.tension_at_10
					, anchorAccidental = an.tension.accidental_load_case === 'Yes'
					, tAnchorAccidental = an.tension.accidental_tension
					, wlAnchorLeft = an.wind_loads.wind_load_from_left
					, wlAnchorRight = an.wind_loads.wind_load_from_right
					// , wlAnchorLeftIce = an.wind_loads.wind_load_from_left_with_ice
					, wlAnchorRightIce = an.wind_loads.wind_load_from_right_with_ice;
			
			// Clockwise Degree positive, anticlockwise degree negative, looking towards direction of anchor
			let group = 'Dead_18_Wiring';
			this.addPointLoads('n', anchorNode, 0, 0, -1 * vlAnchor, 0, group);
			this.addPointLoads('n',
			                   anchorNodeSteel,
			                   0,
			                   tAnchor18 * tempAngle *
					                   Math.sin(-1 * angleAnchor * PI / 180),
			                   0,
			                   tAnchor18 * tempAngle *
					                   Math.cos(angleAnchor * PI / 180),
			                   group);
			
			group = 'Dead_10_Wiring';
			this.addPointLoads('n', anchorNode, 0, 0, -1 * vlAnchor, 0, group);
			this.addPointLoads('n',
			                   anchorNodeSteel,
			                   0,
			                   tAnchor10 * tempAngle *
					                   Math.sin(-1 * angleAnchor * PI / 180),
			                   0,
			                   tAnchor10 * tempAngle *
					                   Math.cos(angleAnchor * PI / 180),
			                   group);
			
			group = 'Dead_5_Wiring';
			this.addPointLoads('n', anchorNode, 0, 0, -1 * vlAnchor, 0, group);
			this.addPointLoads('n',
			                   anchorNodeSteel,
			                   0,
			                   tAnchor5 * tempAngle *
					                   Math.sin(-1 * angleAnchor * PI / 180),
			                   0,
			                   tAnchor5 * tempAngle *
					                   Math.cos(angleAnchor * PI / 180),
			                   group);
			
			group = 'Accidental';
			if (anchorAccidental)
				this.addPointLoads('n',
				                   anchorNodeSteel,
				                   0,
				                   1.5 * tAnchorAccidental * tempAngle *
						                   Math.sin(-1 * angleAnchor * PI / 180),
				                   0,
				                   1.5 * tAnchorAccidental * tempAngle *
						                   Math.cos(angleAnchor * PI / 180),
				                   group);
			
			group = 'Wind_Left';
			this.addPointLoads('n', anchorNode, 0, 1 * wlAnchorLeft, 0, 0, group);
			this.addPointLoads('n', anchorNode, 0,
			                   gAnchor * cAnchor * areaAnchor * this.winds.qpLeft, 0,
			                   0, group);
			
			group = 'Wind_Right';
			this.addPointLoads('n', anchorNode, 0, -1 * wlAnchorRight, 0, 0, group);
			this.addPointLoads('n',
			                   anchorNode,
			                   0,
			                   -1 * gAnchor * cAnchor * areaAnchor *
					                   this.winds.qpRight,
			                   0,
			                   0,
			                   group);
			
			if (hoAnchor !== 0) {
				group = 'Wind_High';
				this.addPointLoads('n', anchorNode, 0, 0, 0,
				                   gAnchor * cAnchor * areaAnchor * this.winds.qpHigh,
				                   group);
				
				group = 'Wind_Low';
				this.addPointLoads('n',
				                   anchorNode,
				                   0,
				                   0,
				                   0,
				                   -1 * gAnchor * cAnchor * areaAnchor *
						                   this.winds.qpLow,
				                   group);
				
				group = 'Wind_High_Ice';
				this.addPointLoads('n',
				                   anchorNode,
				                   0,
				                   0,
				                   0,
				                   0.5 * gAnchor * cAnchor * areaAnchorIce *
						                   this.winds.qpHigh,
				                   group);
				
				group = 'Wind_Low_Ice';
				this.addPointLoads('n',
				                   anchorNode,
				                   0,
				                   0,
				                   0,
				                   -0.5 * gAnchor * cAnchor * areaAnchorIce *
						                   this.winds.qpLow,
				                   group);
			}
			
			// TODO : Is it a mistake? about using 'wlAnchorRightIce' and 'wlAnchorRight
			group = 'Wind_Left_Ice';
			this.addPointLoads('n', anchorNode, 0, wlAnchorRightIce, 0, 0, group);
			this.addPointLoads('n',
			                   anchorNode,
			                   0,
			                   0.5 * gAnchor * cAnchor * areaAnchorIce *
					                   this.winds.qpLeft,
			                   0,
			                   0,
			                   group);
			
			group = 'Wind_Right_Ice';
			this.addPointLoads('n', anchorNode, 0, -1 * wlAnchorRight, 0, 0, group);
			this.addPointLoads('n',
			                   anchorNode,
			                   0,
			                   -0.5 * gAnchor * cAnchor * areaAnchorIce *
					                   this.winds.qpRight,
			                   0,
			                   0,
			                   group);
			
			group = 'ICE_Other';
			this.addPointLoads('n', anchorNode, 0, 0, -1 * vlAnchorIce, 0, group);
			this.addPointLoads('n', anchorNode, 0, 0, -1 * vlAnchorRegIce, 0, group);
		});
	}
	
	// Ties
	calculateTiesGeometry() {
		this.ties.forEach((tie, tieID) => {
			let tieNodes, tieMembers, tempMast, tempSpan;
			const hO = this.steelworks?.boom?.length || 0;
			const fflA = this.steelworks.mastA.ffl;
			const hTie = tie.tie_height;
			const sTie = tie.tie_spacing;
			const fflTie = tie.foundation_level;
			const steelSupport = tie.steel_support.replaceAll(' ', '').toLowerCase();
			switch (steelSupport) {
				case SWNames.MASTA:
					if (this.TieNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						tieNodes = [...this.TieNodes[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no tie node data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					
					if (this.TieMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						tieMembers = [...this.TieMembers[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no tie member data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					tempMast = sTie > 0 ? 1 : -1;
					tempSpan = 0;
					break;
				case SWNames.MASTB:
					if (this.TieNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						tieNodes = [...this.TieNodes[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no tie node data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					
					if (this.TieMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						tieMembers = [...this.TieMembers[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no tie member data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					tempMast = sTie > 0 ? 1 : -1;
					tempSpan = hO;
					break;
			}
			let nodeCords = [];
			// 0 (Central Node)
			nodeCords[0] = {
				x: +(tempSpan).toFixed(FD),
				y: +(fflA - hTie).toFixed(FD),
				z: 0,
			};
			// 1 (Foundation Node)
			nodeCords[1] = {
				x: nodeCords[0].x,
				y: +(fflTie - fflA).toFixed(FD),
				z: -1 * sTie,
			};
			tieNodes.forEach((tieNode) => {
				nodeCords.push({
					               x: nodeCords[0].x + tieNode.x,
					               y: nodeCords[0].y + tieNode.y,
					               z: nodeCords[0].z + tieNode.z * tempMast,
				               });
			});
			
			this.addNodesAndMembersForWires(
					nodeCords,
					tieMembers,
					{
						equipment: SWNames.TIE,
						equipmentId: tieID,
						steelSupport: tie.steel_support,
					});
			
		});
	}
	
	calculateTiesLoads() {
		this.ties.forEach((tie, tieID) => {
			const tieFoundationNode = this.wiringGuide.tie[tieID].foundationNode
					, tieMember = this.wiringGuide.tie[tieID].wireMember
					, typeTie = 'Tie_' + tie.type.replaceAll(' ', '_');
			let steelMass, baseMass, iceMass, xWind, zWind, xIceFactor, zIceFactor,
					gX, gZ, cX, cZ;
			if (this.StructureLoads.hasOwnProperty(typeTie)) {
				steelMass = this.StructureLoads[typeTie]['Steel_Mass'];
				baseMass = this.StructureLoads[typeTie]['Base_Mass'];
				iceMass = this.StructureLoads[typeTie]['Ice_Mass'];
				xWind = this.StructureLoads[typeTie]['X_wind'];
				zWind = this.StructureLoads[typeTie]['Z_wind'];
				xIceFactor = this.StructureLoads[typeTie]['X_Ice_Factor'];
				zIceFactor = this.StructureLoads[typeTie]['Z_Ice_Factor'];
				gX = this.StructureLoads[typeTie]['G_X'];
				gZ = this.StructureLoads[typeTie]['G_Z'];
				cX = this.StructureLoads[typeTie]['C_X'];
				cZ = this.StructureLoads[typeTie]['C_Z'];
			} else {
				throw new Error(`There is no structure load with this Tie type in the library -> "${typeTie}"`);
			}
			
			let group = 'Steel_Other';
			this.addPointLoads('n', tieFoundationNode, 0, 0,
			                   -1 * baseMass * 9.81 * 0.001, 0, group);
			this.addDistributedLoads(tieMember, 0, -1 * steelMass * 9.81 * 0.001, 0,
			                         group);
			
			group = 'Wind_Left';
			this.addDistributedLoads(tieMember, gX * cX * xWind * this.winds.qpLeft,
			                         0, 0, group);
			
			group = 'Wind_Right';
			this.addDistributedLoads(tieMember,
			                         -1 * gX * cX * xWind * this.winds.qpRight, 0, 0,
			                         group);
			
			group = 'Wind_High';
			this.addDistributedLoads(tieMember, 0, 0,
			                         gZ * cZ * zWind * this.winds.qpHigh, group);
			
			group = 'Wind_Low';
			this.addDistributedLoads(tieMember, 0, 0,
			                         -1 * gZ * cZ * zWind * this.winds.qpLow, group);
			
			group = 'Wind_Left_Ice';
			this.addDistributedLoads(tieMember, 0.5 * xIceFactor * gX * cX * xWind *
					this.winds.qpLeft, 0, 0, group);
			
			group = 'Wind_Right_Ice';
			this.addDistributedLoads(tieMember, -0.5 * xIceFactor * gX * cX * xWind *
					this.winds.qpRight, 0, 0, group);
			
			group = 'Wind_High_Ice';
			this.addDistributedLoads(tieMember, 0, 0,
			                         0.5 * zIceFactor * gZ * cZ * zWind *
					                         this.winds.qpHigh, group);
			
			group = 'Wind_Low_Ice';
			this.addDistributedLoads(tieMember, 0, 0,
			                         -0.5 * zIceFactor * gZ * cZ * zWind *
					                         this.winds.qpLow, group);
			
			group = 'ICE_Other';
			this.addDistributedLoads(tieMember, 0, -1 * iceMass * 9.81 * 0.001, 0,
			                         group);
		});
	}
	
	// Switches
	calculateSwitchesGeometry(reference, eqName) {
		reference.forEach((sw, swID) => {
			let switchNodes, switchMembers, tempMast, tempSpan, tempBridge,
					tempDirection = [];
			const hSwitch = sw.height;
			const hoSwitch = sw.offset_from_mast_a;
			const direction = sw.direction || sw.direction_relative_to_mast;
			const hO = this.steelworks?.boom?.length || 0;
			const fflA = this.steelworks.mastA.ffl;
			const levelO = this.steelworks?.boom?.level || 0;
			const steelSupport = sw.steel_support.replaceAll(' ', '').toLowerCase();
			switch (steelSupport) {
				case SWNames.MASTA:
					if (this.SwitchNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						switchNodes = [...this.SwitchNodes[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no switch node data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					
					if (this.SwitchMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastA))
						switchMembers = [...this.SwitchMembers[this.steelworkIds.withoutLength.mastA]];
					else
						throw new Error(
								`There is no switch member data for mast A with this steelwork ID -> "${this.steelworkIds.withoutLength.mastA}"`);
					tempMast = 1;
					tempSpan = 0;
					tempBridge = 0;
					break;
				case SWNames.MASTB:
					if (this.SwitchNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						switchNodes = [...this.SwitchNodes[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no switch node data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					
					if (this.SwitchMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.mastB))
						switchMembers = [...this.SwitchMembers[this.steelworkIds.withoutLength.mastB]];
					else
						throw new Error(
								`There is no switch member data for mast B with this steelwork ID -> "${this.steelworkIds.withoutLength.mastB}"`);
					tempMast = 1;
					tempSpan = hO;
					tempBridge = 0;
					break;
				case SWNames.BOOM:
					if (this.SwitchNodes.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						switchNodes = [...this.SwitchNodes[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no switch node data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					
					if (this.SwitchMembers.hasOwnProperty(
							this.steelworkIds.withoutLength.boom))
						switchMembers = [...this.SwitchMembers[this.steelworkIds.withoutLength.boom]];
					else
						throw new Error(
								`There is no switch member data for boom with this steelwork ID -> "${this.steelworkIds.withoutLength.boom}"`);
					tempMast = 0;
					tempSpan = 0;
					tempBridge = 1;
					break;
			}
			// TODO : ask about lines between 1092:A4 1112:A4 in his code .> redundant loop?!?what is he doing here?!!!
			if (steelSupport === SWNames.BOOM) {
				tempDirection = [1, 1, 1, 1];
			} else {
				switch (direction) {
					case 'High':
						tempDirection[0] = 1;
						break;
					case 'Right':
						tempDirection[1] = 1;
						break;
					case 'Low':
						tempDirection[2] = 1;
						break;
					case 'Left':
						tempDirection[3] = 1;
						break;
				}
			}
			for (let i = 4; i < switchNodes.length; i++)
				tempDirection[i] = 1;
			
			let nodeCords = [];
			// 0 (Central Node)
			nodeCords[0] = {
				x: +(tempSpan + tempBridge * hoSwitch).toFixed(FD),
				y: +(tempMast * (hSwitch - fflA) + (tempBridge * levelO)).toFixed(FD),
				z: 0,
			};
			switchNodes.forEach((switchNode) => {
				nodeCords.push({
					               x: nodeCords[0].x + switchNode.x,
					               y: nodeCords[0].y + switchNode.y,
					               z: nodeCords[0].z + switchNode.z,
				               });
			});
			
			this.addNodesAndMembersForWires(
					nodeCords,
					switchMembers,
					{equipment: eqName, equipmentId: swID, tempDirection, steelSupport});
			
		});
	}
	
	calculateSwitchesLoads() {
		this.switches.forEach((sw, swID) => {
			const switchNode = this.wiringGuide.switch[swID].wireNode
					, vlSwitch = sw.weight
					, areaSwitchAlong = sw.along_track_area
					, areaSwitchAlongIce = areaSwitchAlong * 1.2
					, areaSwitchAcross = sw.across_track_area
					, areaSwitchAcrossIce = areaSwitchAcross * 1.2
					, vlSwitchIce = Math.max(areaSwitchAlong, areaSwitchAcross) * 4 *
					0.0095 * 9.81 * 0.917;
			
			let group = 'Dead_18_Wiring';
			this.addPointLoads('n', switchNode, 0, 0, -1 * vlSwitch, 0, group);
			
			group = 'Dead_10_Wiring';
			this.addPointLoads('n', switchNode, 0, 0, -1 * vlSwitch, 0, group);
			
			group = 'Dead_5_Wiring';
			this.addPointLoads('n', switchNode, 0, 0, -1 * vlSwitch, 0, group);
			
			group = 'Wind_Left';
			this.addPointLoads('n',
			                   switchNode,
			                   0,
			                   gSwitch * cSwitch * areaSwitchAcross *
					                   this.winds.qpLeft,
			                   0,
			                   0,
			                   group);
			
			group = 'Wind_Right';
			this.addPointLoads('n',
			                   switchNode,
			                   0,
			                   -1 * gSwitch * cSwitch * areaSwitchAcross *
					                   this.winds.qpRight,
			                   0,
			                   0,
			                   group);
			
			group = 'Wind_High';
			this.addPointLoads('n', switchNode, 0, 0, 0,
			                   gSwitch * cSwitch * areaSwitchAlong *
					                   this.winds.qpHigh, group);
			
			group = 'Wind_Low';
			this.addPointLoads('n',
			                   switchNode,
			                   0,
			                   0,
			                   0,
			                   -1 * gSwitch * cSwitch * areaSwitchAlong *
					                   this.winds.qpLow,
			                   group);
			
			group = 'Wind_Left_Ice';
			this.addPointLoads('n',
			                   switchNode,
			                   0,
			                   0.5 * gSwitch * cSwitch * areaSwitchAcrossIce *
					                   this.winds.qpLeft,
			                   0,
			                   0,
			                   group);
			
			group = 'Wind_Right_Ice';
			this.addPointLoads('n',
			                   switchNode,
			                   0,
			                   -0.5 * gSwitch * cSwitch * areaSwitchAcrossIce *
					                   this.winds.qpRight,
			                   0,
			                   0,
			                   group);
			
			group = 'Wind_High_Ice';
			this.addPointLoads('n',
			                   switchNode,
			                   0,
			                   0,
			                   0,
			                   0.5 * gSwitch * cSwitch * areaSwitchAlongIce *
					                   this.winds.qpHigh,
			                   group);
			
			group = 'Wind_Low_Ice';
			this.addPointLoads('n',
			                   switchNode,
			                   0,
			                   0,
			                   0,
			                   -0.5 * gSwitch * cSwitch * areaSwitchAlongIce *
					                   this.winds.qpLow,
			                   group);
			
			group = 'ICE_Other';
			this.addPointLoads('n', switchNode, 0, 0, -1 * vlSwitchIce, 0, group);
		});
	}
	
	// Construction
	calculateConstructionGeometry() {
		this.calculateSwitchesGeometry(this.constructionLoads,
				SWNames.CONSTRUCTION_LOAD);
	}
	
	calculateConstructionLoads() {
		this.constructionLoads.forEach((cl, clID) => {
			const constructionNode = this.wiringGuide.constructionLoad[clID].wireNode
					, vlConstruction = cl.construction_load;
			
			this.addPointLoads('n', constructionNode, 0, 0, -1 * vlConstruction, 0,
			                   'Construction');
		});
	}
	
}

module.exports = Structure;
