class ConstructionLoad {
	id;
	steel_support;
	height;
	offset_from_mast_a;
	direction_relative_to_mast;
	construction_load;
	
	constructor(json) {
		Object.assign(this, json);
		
	}
}

module.exports = ConstructionLoad;
