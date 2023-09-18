class Switch {
	id;
	steel_support;
	height;
	offset_from_mast_a;
	direction;
	weight;
	along_track_area;
	across_track_area;
	
	constructor(json) {
		Object.assign(this, json);
		
	}
}

module.exports = Switch;
