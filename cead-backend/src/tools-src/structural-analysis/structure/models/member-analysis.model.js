class MemberAnalysis {
	N_c_Rd = null;
	N_pl_Rd = null;
	V_b_Rd = null;
	V_c_y_Rd = null;
	V_pl_y_Rd = null;
	V_c_z_Rd = null;
	V_pl_z_Rd = null;
	M_c_y_Rd = null;
	M_Pl_y_Rd = null;
	M_c_z_Rd = null;
	M_Pl_z_Rd = null;
	M_N_y_Rd = null;
	M_N_z_Rd = null;
	eq_6_41 = null;
	N_b_y_Rd = null;
	N_b_z_Rd = null;
	N_b_T_Rd = null;
	N_b_TF_Rd = null;
	M_b_Rd = null;
	eq_6_61 = null;
	eq_6_62 = null;
	
	constructor(obj) {
		if (obj)
			Object.assign(this, obj);
	}
}

module.exports = MemberAnalysis;
