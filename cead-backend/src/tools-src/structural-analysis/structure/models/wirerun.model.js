class WireRun{
	id;
	wire_run_number;
	equipment_type;
	steel_support;
	geometry= {
		contact_height:undefined,
		catenary_height:undefined,
		stagger:undefined,
		reach:undefined,
		recos:undefined,
		track_level_difference:undefined,
		drag_factor:undefined,
	};
	registration= {
		weight_of_registration:undefined,
		area_of_registration:undefined,
	};
	equipment= {
		weight_of_equipment:undefined,
		weight_of_ice_on_equipment:undefined,
	};
	radial_loads= {
		contact_at_18:undefined,
		catenary_at_18:undefined,
		contact_at_5:undefined,
		catenary_at_5:undefined,
		contact_at_10:undefined,
		catenary_at_10:undefined,
	};
	wind_loads= {
		contact_from_left:undefined,
		contact_from_right:undefined,
		catenary_from_left:undefined,
		catenary_from_right:undefined,
		contact_from_left_with_ice:undefined,
		contact_from_right_with_ice:undefined,
		catenary_from_left_with_ice:undefined,
		catenary_from_right_with_ice:undefined,
	}
	constructor(json) {
		Object.assign(this,json);
		
	}
}



module.exports = WireRun;
