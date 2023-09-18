class Anchor{
	id;
	anchor_name;
	steel_support;
	"geometry"= {
		anchor_height:undefined,
		direction:undefined,
		offset_from_mast_centre:undefined,
		track_level_difference:undefined,
		angle:undefined,
		drag_factor:undefined,
	};
	"registration"= {
		weight_of_support:undefined,
		area_of_support:undefined,
	};
	"equipment"= {
		weight_of_equipment:undefined,
		weight_of_ice_on_equipment:undefined,
	};
	"tension"= {
		equipment_type:undefined,
		tension_at_18:undefined,
		tension_at_5:undefined,
		tension_at_10:undefined,
		accidental_load_case:undefined,
		accidental_tension:undefined,
	};
	"wind_loads"= {
		wind_load_from_left:undefined,
		wind_load_from_right:undefined,
		wind_load_from_left_with_ice:undefined,
		wind_load_from_right_with_ice:undefined,
	};
	constructor(json) {
		Object.assign(this,json);
		
	}
}



module.exports = Anchor;
