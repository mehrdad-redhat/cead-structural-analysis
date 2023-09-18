class Tie {
	id;
	steel_support;
	type;
	tie_height;
	tie_spacing;
	foundation_level;
	
	constructor(json) {
		Object.assign(this, json);
		
	}
}

module.exports = Tie;
