class SectionProperty {
	property_ref;
	type;
	cross_section;
	compression;
	shear;
	bending;
	bending_axial;
	biaxial_bending;
	buckling;
	flexural_buckling;
	torsional_buckling;
	torsional_f_buckling;
	lateral_buckling;
	YM0;
	YM1;
	YM2;
	Fy;
	ESEC3;
	G;
	v;
	class;
	h;
	b;
	cout;
	tf;
	tw;
	hw;
	t;
	d;
	A;
	Ay;
	Az;
	Iy;
	Iz;
	i_y;
	i_z;
	W_pl_y;
	W_pl_z;
	W_el_Rd_y;
	W_el_Rd_z;
	Iw;
	It;
	e;
	a_y;
	a_z;
	a_Lt;
	y0;
	z0;
	buckling_curve_y_y;
	buckling_curve_z_z;
	buckling_curve_ltb;
	
	constructor(json) {
		Object.assign(this, json);
		
	}
}

module.exports = SectionProperty;
