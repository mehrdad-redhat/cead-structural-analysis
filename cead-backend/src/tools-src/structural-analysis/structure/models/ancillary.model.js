class Ancillary{
	id;
	wire_name;
	steel_support;
	geometry= {
		wire_height:undefined,
		offset_from_mast_centre:undefined,
		reach:undefined,
		drag_factor:undefined
	};
	registration= {
		weight_of_support:undefined,
		area_of_support:undefined
	};
	equipment= {
		weight_of_equipment:undefined,
		weight_of_ice_on_equipment:undefined
	};
	radial_loads= {
		radial_load_at_18:undefined,
		radial_load_at_5:undefined,
		radial_load_at_10:undefined
	};
	wind_loads= {
		wind_load_from_left:undefined,
		wind_load_from_right:undefined,
		wind_load_from_left_with_ice:undefined,
		wind_load_from_right_with_ice:undefined
	}
	constructor(json) {
		Object.assign(this,json);
		
	}
}



module.exports = Ancillary;
