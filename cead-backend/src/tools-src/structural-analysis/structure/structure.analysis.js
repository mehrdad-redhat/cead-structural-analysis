const Skyciv = require('skyciv');
const skycivUN = process.env.SKYCIV_USERNAME;
const skycivKey = process.env.SKYCIV_KEY;
const auth = {
  username: skycivUN,
  key: skycivKey,
};
const {jsonBatchLoad, readJson, getMax} = require('../../../_helpers/utils');
const {SectionProperty, MemberAnalysis, MemberUtilisation} = require(
    './models');
const FD = 3;
const PI = 3.141592653;
const fs = require('fs');
let draft = {};

class StructureAnalyzer {
  #skycivSolveResult = {};
  
  #analyzeResult = {
    memberForces: [],
    memberAnalysis: [],
    memberUtilisation: [],
    steelworkUtilisation: {
      masta: {
        value: null,
        lcName: '',
      },
      boom: {
        value: null,
        lcName: '',
      },
      mastb: {
        value: null,
        lcName: '',
      },
      tiea: {
        value: null,
        lcName: '',
      },
      tieb: {
        value: null,
        lcName: '',
      },
    },
    nodeDisplacements: [],
    nodeReactions: [],
    foundationLoadsCombinations: [],
    foundationLoadsCases: [],
  };
  #wiringGuide = {
    wireRun: [],
    ancillary: [],
    anchor: [],
    tie: [],
    switch: [],
    constructionLoad: [],
  };
  #foundations = {};
  
  #_sectionProperties = {};

  constructor(structureId, skycivStructureModel, structureType, guides, draft) {
    this.skycivStructureModel = {...skycivStructureModel};
    this.structureType = structureType;
    this.structureId = structureId;
    this.nodesGuide = guides.nodes;
    this.memberGuide = guides.members;
    this.#wiringGuide = guides.wires;
    this.windFactors = draft.windFactors;
    this.steelworks = draft.steelworks;
    this.steelworkIds = draft.steelworkIds;
  }
  
  get #sectionProperties() {
    return this.#_sectionProperties;
  }
  
  set #sectionProperties(obj) {
    for (let spRef in obj) {
      if (obj.hasOwnProperty(spRef))
        this.#_sectionProperties[spRef] = new SectionProperty(obj[spRef]);
    }
  }
  
  static #setDraftValues(sectionProperty, memberForce) {
    const sp = sectionProperty;
    let mf = memberForce;
    if (sp.type.toLowerCase() === 'angle') {
      // Bending
      if (mf.My_Ed === 0 || mf.Mz_Ed === 0) {
        mf.My_Ed = (mf.My_Ed + mf.Mz_Ed) * Math.sqrt(2) / 2;
        mf.Mz_Ed = (mf.My_Ed + mf.Mz_Ed) * Math.sqrt(2) / 2;
      } else {
        mf.My_Ed = 0;
        mf.Mz_Ed = 0;
      }

      // My
      if (mf.Min_My_Ed > 0 && mf.Max_My_Ed > 0) {
        mf.My_Ed = mf.My_Ed + mf.Max_My_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed - mf.Max_My_Ed * Math.sqrt(2) / 2;
      } else if (mf.Min_My_Ed < 0 && mf.Max_My_Ed < 0) {
        mf.My_Ed = mf.My_Ed + mf.Min_My_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed - mf.Min_My_Ed * Math.sqrt(2) / 2;
      } else if (mf.Min_My_Ed < 0 && mf.Max_My_Ed >= 0 &&
          Math.abs(mf.Min_My_Ed) < mf.Max_My_Ed) {
        mf.My_Ed = mf.My_Ed + mf.Max_My_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed - mf.Max_My_Ed * Math.sqrt(2) / 2;
      } else if (mf.Min_My_Ed < 0 && mf.Max_My_Ed >= 0 &&
          Math.abs(mf.Min_My_Ed) > mf.Max_My_Ed) {
        mf.My_Ed = mf.My_Ed + mf.Min_My_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed - mf.Min_My_Ed * Math.sqrt(2) / 2;
      }

      // Mz
      if (mf.Min_Mz_Ed > 0 && mf.Max_Mz_Ed > 0) {
        mf.My_Ed = mf.My_Ed + mf.Max_Mz_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed + mf.Max_Mz_Ed * Math.sqrt(2) / 2;
      } else if (mf.Min_Mz_Ed < 0 && mf.Max_Mz_Ed < 0) {
        mf.My_Ed = mf.My_Ed + mf.Min_Mz_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed + mf.Min_Mz_Ed * Math.sqrt(2) / 2;
      } else if (mf.Min_Mz_Ed < 0 && mf.Max_Mz_Ed >= 0 &&
          Math.abs(mf.Min_Mz_Ed) < mf.Max_Mz_Ed) {
        mf.My_Ed = mf.My_Ed + mf.Max_Mz_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed + mf.Max_Mz_Ed * Math.sqrt(2) / 2;
      } else if (mf.Min_Mz_Ed < 0 && mf.Max_Mz_Ed >= 0 &&
          Math.abs(mf.Min_Mz_Ed) > mf.Max_Mz_Ed) {
        mf.My_Ed = mf.My_Ed + mf.Min_Mz_Ed * Math.sqrt(2) / 2;
        mf.Mz_Ed = mf.Mz_Ed + mf.Min_Mz_Ed * Math.sqrt(2) / 2;
      }

      // Absolute values
      mf.My_Ed = Math.abs(mf.My_Ed);
      mf.Mz_Ed = Math.abs(mf.Mz_Ed);

      // Start values
      if ((mf.Start_My_Ed === 0) || (mf.Start_Mz_Ed === 0)) {
        mf.Start_My_Ed = (mf.Start_My_Ed + mf.Start_Mz_Ed) * Math.sqrt(2) / 2;
        mf.Start_Mz_Ed = (mf.Start_My_Ed + mf.Start_Mz_Ed) * Math.sqrt(2) / 2;
      } else {
        mf.Start_My_Ed = (mf.Start_My_Ed + mf.Start_Mz_Ed) * Math.sqrt(2) / 2;
        mf.Start_Mz_Ed = (-mf.Start_My_Ed + mf.Start_Mz_Ed) * Math.sqrt(2) / 2;
      }

      // End values
      if (mf.End_My_Ed === 0 || mf.End_Mz_Ed === 0) {
        mf.End_My_Ed = (mf.End_My_Ed + mf.End_Mz_Ed) * Math.sqrt(2) / 2;
        mf.End_Mz_Ed = (mf.End_My_Ed + mf.End_Mz_Ed) * Math.sqrt(2) / 2;
      } else {
        mf.End_My_Ed = (mf.End_My_Ed + mf.End_Mz_Ed) * Math.sqrt(2) / 2;
        mf.End_Mz_Ed = (-mf.End_My_Ed + mf.End_Mz_Ed) * Math.sqrt(2) / 2;
      }

      // Vy
      if (mf.Vy_Ed_Min > 0 && mf.Vy_Ed_Max > 0) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vy_Ed_Max * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed - mf.Vy_Ed_Max * Math.sqrt(2) / 2;
      } else if (mf.Vy_Ed_Min < 0 && mf.Vy_Ed_Max < 0) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vy_Ed_Min * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed - mf.Vy_Ed_Min * Math.sqrt(2) / 2;
      } else if (mf.Vy_Ed_Min < 0 && mf.Vy_Ed_Max >= 0 &&
          Math.abs(mf.Vy_Ed_Min) < mf.Vy_Ed_Max) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vy_Ed_Max * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed - mf.Vy_Ed_Max * Math.sqrt(2) / 2;
      } else if (mf.Vy_Ed_Min < 0 && mf.Vy_Ed_Max >= 0 &&
          Math.abs(mf.Vy_Ed_Min) > mf.Vy_Ed_Max) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vy_Ed_Min * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed - mf.Vy_Ed_Min * Math.sqrt(2) / 2;
      }

      // Vz
      if (mf.Vz_Ed_Min > 0 && mf.Vz_Ed_Max > 0) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vz_Ed_Max * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed + mf.Vz_Ed_Max * Math.sqrt(2) / 2;
      } else if (mf.Vz_Ed_Min < 0 && mf.Vz_Ed_Max < 0) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vz_Ed_Min * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed + mf.Vz_Ed_Min * Math.sqrt(2) / 2;
      } else if (mf.Vz_Ed_Min < 0 && mf.Vz_Ed_Max >= 0 &&
          Math.abs(mf.Vz_Ed_Min) < mf.Vz_Ed_Max) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vz_Ed_Max * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed + mf.Vz_Ed_Max * Math.sqrt(2) / 2;
      } else if (mf.Vz_Ed_Min < 0 && mf.Vz_Ed_Max >= 0 &&
          Math.abs(mf.Vz_Ed_Min) > mf.Vz_Ed_Max) {
        mf.Vy_Ed = mf.Vy_Ed + mf.Vz_Ed_Min * Math.sqrt(2) / 2;
        mf.Vz_Ed = mf.Vz_Ed + mf.Vz_Ed_Min * Math.sqrt(2) / 2;
      }
    }

    draft.memberForce = {
      length: mf['length'],
      memberId: mf['memberId'],
      Start_N_Ed: mf['startFx'], // Start Axial
      Start_Vy_Ed: mf['startFy'],  // Start Shear
      Start_Vz_Ed: mf['startFz'],  // Start Shear
      Start_My_Ed: mf['startMy'],  // Start Bending
      Start_Mz_Ed: mf['startMz'],  // Start Bending

      End_N_Ed: mf['endFx'], // End Axial
      End_Vy_Ed: mf['endFy'],  // End Shear
      End_Vz_Ed: mf['endFz'],  // End Shear
      End_My_Ed: mf['endMy'],  // End Bending
      End_Mz_Ed: mf['endMz'],  // End Bending

      N_Ed_Min: mf['fxMin'], // Min Axial
      N_Ed_Max: mf['fxMax'], // Max Axial
      N_Ed: mf['fx'], // Axial

      Vy_Ed_Min: mf['fyMin'],  // Min Shear
      Vy_Ed_Max: mf['fyMax'],  // Max Shear
      Vy_Ed: mf['fy'],  // Shear
      
      Vz_Ed_Min: mf['fzMin'],  // Min Shear
      Vz_Ed_Max: mf['fzMax'],  // Max Shear
      Vz_Ed: mf['fz'],  // Shear
      
      Min_My_Ed: mf['myMin'],  // Min Bending
      Max_My_Ed: mf['myMax'],  // Max Bending
      My_Ed: mf['my'],  // Bending
      
      Min_Mz_Ed: mf['mzMin'],  // Min Bending
      Max_Mz_Ed: mf['mzMax'],  // Max Bending
      Mz_Ed: mf['mz'],  // Bending
    };
    draft.sectionProperty = {
      section: sp.type,  // Type of Cross Section (UC, SHS, etc.)
      cross_section: sp.cross_section,  // 1 if to be considered 0 if it does not
      compression: sp.compression,  // 1 if to be considered 0 if it does not
      shear: sp.shear,  // 1 if to be considered 0 if it does not
      bending: sp.bending,  // 1 if to be considered 0 if it does not
      bending_axial: sp.bending_axial,  // 1 if to be considered 0 if it does not
      biaxial_bending: sp.biaxial_bending,  // 1 if to be considered 0 if it does not
      buckling: sp.buckling, // 1 if to be considered 0 if it does not
      flexural_buckling: sp.flexural_buckling,  // 1 if to be considered 0 if it does not
      torsional_buckling: sp.torsional_buckling, // 1 if to be considered 0 if it does not
      torsional_f_Buckling: sp.torsional_f_buckling, // 1 if to be considered 0 if it does not
      lateral_buckling: sp.lateral_buckling, // 1 if to be considered 0 if it does not

      A: sp.A,  // Area of Section
      a_Lt: sp.a_Lt, // Imperfection Factor for LTB
      a_y: sp.a_y,  // Imperfection Factor for Compression Buckling
      a_z: sp.a_z,  // Imperfection Factor for Compression Buckling
      Ay: sp.Ay, // Shear Area y-y
      Az: sp.Az, // Shear Area z-z
      b: sp.b,  // Section Breath
      class: sp.class,  // Member Class
      cout: sp.cout, // Outstand of Flange
      d: sp.d,  // Depth of Web
      e: sp.e,  // Epsilon (Section Classification)
      ESEC3: sp.ESEC3,  // Modulus of Elasticity
      Fy: sp.Fy, // Yield Strength
      G: sp.G,  // Shear Modulus
      h: sp.h,  // Section Depth
      hw: sp.hw, // Height of Web
      i_y: sp.i_y,  // Radius of gyration about y-y
      i_z: sp.i_z,  // Radius of gyration about z-z
      It: sp.It, // Torsion Constant
      Iw: sp.Iw, // Wrapping Constant
      Iy: sp.Iy, // Second Moment of Area about y-y
      Iz: sp.Iz, // Second Moment of Area about z-z
      t: sp.t,  // Nominal Thickness
      tf: sp.tf, // Thickness of Flange
      tw: sp.tw, // Thickness of Web
      v: sp.v,  // Poisson's Ratio
      W_el_Rd_y: sp.W_el_Rd_y,  // Elastic Section Modules about y-y
      W_el_Rd_z: sp.W_el_Rd_z,  // Elastic Section Modules about z-z
      W_pl_y: sp.W_pl_y, // Plastic Section Modules about y-y
      W_pl_z: sp.W_pl_z, // Plastic Section Modules about z-z
      y0: sp.y0, // Distance from shear centre to centroid in y-axis
      YM0: sp.YM0,  // Resistance of Cross-Section
      YM1: sp.YM1,  // Resistance of Member to Instability
      YM2: sp.YM2,  // Resistance of tensile members to fracture
      z0: sp.z0, // Distance from shear centre to centroid in z-axis
    };
    draft.compression = {
      N_c_Rd: sp.A * sp.Fy / sp.YM0,  // Compression Resistance
      N_pl_Rd: sp.A * sp.Fy / sp.YM0,  // Plastic Resistance
    };
    draft.shear = {
      V_b_Rd: sp.hw / sp.tw < 72 * sp.e ? 'Ignored' : 'Cannot Ignore',  // Shear Buckling Resistance
      V_c_y_Rd: sp.Ay * (sp.Fy / Math.sqrt(3)) / sp.YM0,  // Shear Resistance
      V_pl_y_Rd: sp.Ay * (sp.Fy / Math.sqrt(3)) / sp.YM0,  // Plastic Shear Resistance
      V_c_z_Rd: sp.Az * (sp.Fy / Math.sqrt(3)) / sp.YM0,  // Shear Resistance
      V_pl_z_Rd: sp.Az * (sp.Fy / Math.sqrt(3)) / sp.YM0,  // Plastic Shear Resistance
    };
    draft.bending = {
      Wy: sp.class === 1 || sp.class === 2 ? sp.W_pl_y : sp.W_el_Rd_y,  // Section Modulus
      M_c_y_Rd: undefined,  // Bending Resistance
      M_Pl_y_Rd: undefined,  // Plastic Bending Resistance
      Wz: sp.class === 1 || sp.class === 2 ? sp.W_pl_z : sp.W_el_Rd_z,  // Section modulus
      M_c_z_Rd: undefined,  // Bending Resistance
      M_Pl_z_Rd: undefined,  // Plastic Bending Resistance
    };
    draft.bendingAxial = {
      n: draft.memberForce.N_Ed / draft.compression.N_pl_Rd,  // Normal force to plastic resistance force ratio
      M_N_y_Rd: undefined,  // Reduced plastic moment resistance
      M_N_z_Rd: undefined,  // Reduced plastic moment resistance
      eq_6_2: undefined,  // Equation 6.2 if M_N_y_Rd and M_N_z_Rd are not calculated
    };
    draft.lateralRestraints = { // Lateral restraints for buckling
      Ly: undefined, // Distance between major axis restraints
      Lz: undefined, // Distance between minor axis restraints
    };
    draft.momentFactors = { // Equivalent uniform moment factors - Taken from EC3 Table B.3
      Yy: undefined, // Ratio of end moments in y-y
      Yz: undefined, // Ratio of end moments in z-z
      Cmy: undefined,  // Equivalent uniform moment factors
      Cmz: undefined,  // Equivalent uniform moment factors
      CmLt: undefined, // Equivalent uniform moment factors
    };
    draft.flexuralBuckling = {
      y_y: undefined,  // Slenderness Ratio
      y_z: undefined,  // Slenderness Ratio
      X_y: undefined,  // Buckling reduction factor - eq 6.49
      X_z: undefined,  // Buckling reduction factor - eq 6.49
      N_b_y_Rd: undefined,  // Flexural Buckling Resistance
      N_b_z_Rd: undefined,  // Flexural Buckling Resistance
      N_cr_y: undefined,  // Critical Buckling Force
    };
    draft.torsionalBuckling = {
      N_cr_T: undefined, // Critical Buckling Force
    };
    draft.lateralTorsionalBuckling = {
      X_Lt: undefined,  // LTB reduction factor eq 6.57
      O_Lt: undefined,
    };
    draft.utilisation = {
      Utilisation: {},
      Utilisation_LC: [],
    };
  }
  
  /**
   * Beginning the process of analysis
   * @returns {Promise<{}>}
   */
  async analyze() {
    let startTime = new Date();
    let skycivRes = await this.#getSolvedDataFromSkyciv();
    let endTime = new Date();
    let elapsedTime = endTime.getTime() - startTime.getTime();
    console.log('SKYCIV RESULTS HAS GOT IN ' + elapsedTime / 1000 + 's');
    console.log(skycivRes.response.msg);
    const resStatus = skycivRes['response']['status'];
    const resMsg = skycivRes['response']['msg'];
    if (resStatus === 1) {
      throw new Error(resMsg.split(',<a')[0]);
    }
    // Uncomment if you want cache a response for development purpose
    // fs.writeFile('cached-response.json', JSON.stringify(skycivRes),
    //     function(err) {
    //       if (err) {
    //         throw new Error(err);
    //       }
    //     });
    this.#skycivSolveResult = skycivRes['response']['data'];
    startTime = new Date();
    this.#extractResults();
    endTime = new Date();
    elapsedTime = endTime.getTime() - startTime.getTime();
    console.log('EXTRACTING RESULTS COMPLETED IN ', elapsedTime + 'ms');
    let referenceFiles = [
      '../_references/structural_analysis/section-property.json', //0
    ];
    let sp;
    [sp] = await jsonBatchLoad(referenceFiles);
    this.#sectionProperties = sp;
    return this.#generateAnalysisResult();
  }

  /**
   * Send structure data to Skyciv API to solving it
   * @returns {Promise<unknown>}
   */
  async #getSolvedDataFromSkyciv(cache = false) {
    let apiObject = {
      auth,
      options: {
        'response_data_only': true,
      },
      functions: [],
    };
    apiObject.functions.push({function: 'S3D.session.start', arguments: {}});
    apiObject.functions.push({
      function: 'S3D.model.set',
                               arguments: {
                                 s3d_model: {
                                   settings: {
                                     units: {
                                       length: 'm',
                                       section_length: 'mm',
                                       material_strength: 'MPa',
                                       density: 'kg/m^3',
                                       force: 'kN',
                                       moment: 'kN-m',
                                       pressure: 'kPa',
                                       mass: 'kg',
                                       translation: 'mm',
                                       stress: 'MPa',
                                     },
                                     evaluation_points: '5',
                                     auto_stabilize_model: false,
                                     member_offsets_axis: 'global',
                                   },
                                   ...this.skycivStructureModel,
                                 },
                               },
    });
    const currentTime = new Date().getTime();

    apiObject.functions.push({
      'function': 'S3D.file.save',
      'arguments': {
        'name': `${this.structureId} - ${currentTime}`,
        'path': 'cead/test/',
        'public_share': true,
      },
    });
    apiObject.functions.push({
      function: 'S3D.model.solve',
      arguments: {
        analysis_type: 'linear',
        repair_model: false,
        format: 'json',
        result_filter: [
          'reactions',
          'member_displacements',
          'member_forces',
          'member_lengths',
          'member_minimums',
          'member_maximums',
        ],
      },
    });

    if (process.env.NODE_ENV === 'development' && cache === true)
      return readJson('../../cached-response.json');
    else
      return Skyciv.requestPromise(apiObject);

  }
  
  /**
   * Beginning of extraction data from Skyciv solve result process
   */
  #extractResults() {
    let ssr = this.#skycivSolveResult;
    for (let ssrId in ssr) {
      if (ssr.hasOwnProperty(ssrId)) {
        const data = ssr[ssrId];
        const lcName = data.name;
        
        // REACTIONS
        this.#extractReactions(data, lcName);
        
        // MEMBER FORCES
        this.#extractMemberForces(data, lcName);
        
        // Member Displacements
        this.#extractMemberDisplacement(data, lcName);
        
      }
    }
    /**
     * Find number of foundations
     */
    this.#analyzeResult.nodeReactions.forEach((nr, i) => {
      if (!this.#foundations.hasOwnProperty(nr['steelwork']))
        this.#foundations[nr['steelwork']] = i;
    });
    
    this.#extractFoundationLoadCombinations(ssr);
    this.#extractFoundationLoadCases();
    
  }
  
  /**
   * Extract Reactions from Skyciv solve result
   * @param data
   * @param lcName
   */
  #extractReactions(data, lcName) {
    if (!(lcName.startsWith('ULS') || lcName.startsWith('SLS') ||
          lcName.startsWith('Envelope'))) {
      for (let nodeId in data['reactions']) {
        let reaction = data['reactions'][nodeId];
        this.#analyzeResult.nodeReactions.push({
                                                 steelwork: this.nodesGuide[nodeId],
                                                 lcName,
                                                 nodeId,
                                                 ...reaction,
                                               });
      }
    }
  }
  
  /**
   * Extract Member Forces from Skyciv solve result
   * @param data
   * @param lcName
   */
  #extractMemberForces(data, lcName) {
    if (lcName.startsWith('ULS')) {
      for (let memberId in data['member_forces']['axial_force']) {
        let memberProperty = this.skycivStructureModel.members[memberId]['section_id'];
        if (memberProperty !== '11') {
          const axialForce = data['member_forces']['axial_force'][memberId],
              shearZForce = data['member_forces']['shear_force_z'][memberId],
              shearYForce = data['member_forces']['shear_force_y'][memberId],
              bendingZMoment = data['member_forces']['bending_moment_z'][memberId],
              bendingYMoment = data['member_forces']['bending_moment_y'][memberId],
              memberMinAxialForce = data['member_minimums']['axial_force'][memberId],
              memberMaxAxialForce = data['member_maximums']['axial_force'][memberId],
              memberMinShearZForce = data['member_minimums']['shear_force_z'][memberId],
              memberMaxShearZForce = data['member_maximums']['shear_force_z'][memberId],
              memberMinShearYForce = data['member_minimums']['shear_force_y'][memberId],
              memberMaxShearYForce = data['member_maximums']['shear_force_y'][memberId],
              memberMinBendingZMoment = data['member_minimums']['bending_moment_z'][memberId],
              memberMaxBendingZMoment = data['member_maximums']['bending_moment_z'][memberId],
              memberMinBendingYMoment = data['member_minimums']['bending_moment_y'][memberId],
              memberMaxBendingYMoment = data['member_maximums']['bending_moment_y'][memberId];
          
          this.#analyzeResult.memberForces.push({
                                                  memberId,
                                                  propertyRef: memberProperty,
                                                  length: data['member_lengths'][memberId],
                                                  lcName,
                                                  startFx: axialForce['0.0'],
                                                  endFx: axialForce['100.0'],
                                                  startFy: shearZForce['0.0'],
                                                  endFy: shearZForce['100.0'],
                                                  startFz: shearYForce['0.0'],
                                                  endFz: shearYForce['100.0'],
                                                  startMy: bendingZMoment['0.0'],
                                                  endMy: bendingZMoment['100.0'],
                                                  startMz: bendingYMoment['0.0'],
                                                  endMz: bendingYMoment['100.0'],
                                                  fxMin: memberMinAxialForce,
                                                  fxMax: memberMaxAxialForce,
                                                  fx: Math.max(
                                                      Math.abs(
                                                          memberMinAxialForce) ||
                                                      0,
                                                      Math.abs(
                                                          memberMaxAxialForce) ||
                                                      0,
                                                  ),
                                                  fyMin: memberMinShearZForce,
                                                  fyMax: memberMaxShearZForce,
                                                  fy: Math.max(
                                                      Math.abs(
                                                          memberMinShearZForce) ||
                                                      0,
                                                      Math.abs(
                                                          memberMaxShearZForce) ||
                                                      0,
                                                  ),
                                                  fzMin: memberMinShearYForce,
                                                  fzMax: memberMaxShearYForce,
                                                  fz: Math.max(
                                                      Math.abs(
                                                          memberMinShearYForce) ||
                                                      0,
                                                      Math.abs(
                                                          memberMaxShearYForce) ||
                                                      0,
                                                  ),
                                                  myMin: memberMinBendingZMoment,
                                                  myMax: memberMaxBendingZMoment,
                                                  my: Math.max(
                                                      Math.abs(
                                                          memberMinBendingZMoment) ||
                                                      0,
                                                      Math.abs(
                                                          memberMaxBendingZMoment) ||
                                                      0,
                                                  ),
                                                  mzMin: memberMinBendingYMoment,
                                                  mzMax: memberMaxBendingYMoment,
                                                  mz: Math.max(
                                                      Math.abs(
                                                          memberMinBendingYMoment) ||
                                                      0,
                                                      Math.abs(
                                                          memberMaxBendingYMoment) ||
                                                      0,
                                                  ),
                                                });
        }
      }
    }
  }
  
  /**
   * Extract Member Displacement from Skyciv solve result
   * @param data
   * @param lcName
   */
  #extractMemberDisplacement(data, lcName) {
    let displacements = {};
    this.#wiringGuide.wireRun.forEach(wr => {
      let key = wr.conMember === 0 ? wr.catMember : wr.conMember;
      displacements[key] = wr.wireRunNumber;
    });
    if (lcName.startsWith('SLS')) {
      for (let memberId in data['member_displacements']['displacement_x']) {
        if (displacements.hasOwnProperty(memberId)) {
          const displacementX = data['member_displacements']['displacement_x'][memberId];
          const displacementZ = data['member_displacements']['displacement_z'][memberId];
          this.#analyzeResult.nodeDisplacements.push({
                                                       wireRun: displacements[memberId],
                                                       lcName,
                                                       memberId,
                                                       // Displacement X
                                                       acrossTrackDisplacement: displacementX['0.0'],
                                                       // Displacement X Status
                                                       acrossTrackStatus:
                                                           Math.abs(displacementX['0.0']) > 50 ? 'Fail' : 'Pass',
                                                       // Displacement Z
                                                       alongTrackDisplacement: displacementZ['0.0'],
                                                       // Displacement Z Status
                                                       alongTrackStatus:
                                                           Math.abs(displacementZ['0.0']) > 100 ?
                                                           'Fail' :
                                                           'Pass',
            
                                                     });
        }
      }
    }
  }
  
  /**
   * Extract Foundation Loads (Combinations) from Skyciv solve result
   * @param skycivRes
   */
  #extractFoundationLoadCombinations(skycivRes) {
    // List all foundations and their load cases
    for (let ssrId in skycivRes) {
      const data = skycivRes[ssrId];
      const lcName = data.name;
      
      if (lcName.startsWith('ULS'))
        for (let found in this.#foundations) {
          this.#analyzeResult.foundationLoadsCombinations.push({
                                                                 steelwork: found,
                                                                 lcName,
                                                                 axialPermanent: 0,
                                                                 shearAlongPermanent: 0,
                                                                 shearAcrossPermanent: 0,
                                                                 momentAlongPermanent: 0,
                                                                 momentAcrossPermanent: 0,
                                                                 torsionPermanent: 0,
                                                                 axialVariable: 0,
                                                                 shearAlongVariable: 0,
                                                                 shearAcrossVariable: 0,
                                                                 momentAlongVariable: 0,
                                                                 momentAcrossVariable: 0,
                                                                 torsionVariable: 0,
                                                                 resultantMoment: 0,
                                                               });
        }
    }
    
    // Add Loads
    this.#analyzeResult.nodeReactions.forEach(nr => {
      this.#analyzeResult.foundationLoadsCombinations.forEach(flComb => {
        // 'SW1 , Steel_Other, Dead_18_Wiring, Dead_10_Wiring, Dead_5_Wiring
        let conditions = [];
        conditions[0] = nr.lcName === 'Steel_Other' || nr.lcName === 'SW1';
        conditions[1] = nr.lcName === 'Dead_18_Wiring' &&
                        flComb.lcName.startsWith('ULS_A');
        conditions[2] = nr.lcName === 'Dead_10_Wiring' &&
                        flComb.lcName.startsWith('ULS_B');
        conditions[3] = nr.lcName === 'Dead_5_Wiring' &&
                        flComb.lcName.startsWith('ULS_D');
        conditions[4] = nr.lcName === 'Dead_5_Wiring' &&
                        flComb.lcName.startsWith('ULS_F');
        let CONDITION = conditions[0] || conditions[1] || conditions[2] ||
                        conditions[3] || conditions[4];
        
        if (flComb.steelwork === nr.steelwork && CONDITION) {
          flComb.axialPermanent += nr['Fy'];
          flComb.shearAlongPermanent += nr['Fz'];
          flComb.shearAcrossPermanent += nr['Fx'];
          flComb.momentAlongPermanent += nr['Mx'];
          flComb.momentAcrossPermanent += nr['Mz'];
          flComb.torsionPermanent += nr['My'];
        }
        
        // ICE_Other , SW2, Construction, Accidental
        conditions = [];
        conditions[0] = (nr.lcName === 'ICE_Other' || nr.lcName === 'SW2') &&
                        (flComb.lcName.startsWith('ULS_A') ||
                         flComb.lcName.startsWith('ULS_D'));
        conditions[1] = nr.lcName === 'Construction' &&
                        (flComb.lcName.startsWith('ULS_A') ||
                         flComb.lcName.startsWith('ULS_B') ||
                         flComb.lcName.startsWith('ULS_D'));
        conditions[2] = nr.lcName === 'Accidental' &&
                        flComb.lcName.startsWith('ULS_F');
        
        CONDITION = conditions[0] || conditions[1] || conditions[2];
        if (flComb.steelwork === nr.steelwork && CONDITION) {
          flComb.axialVariable += nr['Fy'];
          flComb.shearAlongVariable += nr['Fz'];
          flComb.shearAcrossVariable += nr['Fx'];
          flComb.momentAlongVariable += nr['Mx'];
          flComb.momentAcrossVariable += nr['Mz'];
          flComb.torsionVariable += nr['My'];
        }
        
        // Wind
        conditions = [];
        conditions[0] = nr.lcName === 'Wind_Left' &&
                        (flComb.lcName === 'ULS_B1' || flComb.lcName === 'ULS_B5' ||
                         flComb.lcName === 'ULS_B6');
        conditions[1] = nr.lcName === 'Wind_Left' &&
                        (flComb.lcName === 'ULS_F1' || flComb.lcName === 'ULS_F5' ||
                         flComb.lcName === 'ULS_F6');
        conditions[2] = nr.lcName === 'Wind_Right' &&
                        (flComb.lcName === 'ULS_B2' || flComb.lcName === 'ULS_B7' ||
                         flComb.lcName === 'ULS_B8');
        conditions[3] = nr.lcName === 'Wind_Right' &&
                        (flComb.lcName === 'ULS_F2' || flComb.lcName === 'ULS_F7' ||
                         flComb.lcName === 'ULS_F8');
        conditions[4] = nr.lcName === 'Wind_High' &&
                        (flComb.lcName === 'ULS_B3' || flComb.lcName === 'ULS_B5' ||
                         flComb.lcName === 'ULS_B7');
        conditions[5] = nr.lcName === 'Wind_High' &&
                        (flComb.lcName === 'ULS_F3' || flComb.lcName === 'ULS_F5' ||
                         flComb.lcName === 'ULS_F7');
        conditions[6] = nr.lcName === 'Wind_Low' &&
                        (flComb.lcName === 'ULS_B4' || flComb.lcName === 'ULS_B6' ||
                         flComb.lcName === 'ULS_B8');
        conditions[7] = nr.lcName === 'Wind_Low' &&
                        (flComb.lcName === 'ULS_F4' || flComb.lcName === 'ULS_F6' ||
                         flComb.lcName === 'ULS_F8');
        conditions[8] = nr.lcName === 'Wind_Left_Ice' &&
                        (flComb.lcName === 'ULS_D1' || flComb.lcName === 'ULS_D5' ||
                         flComb.lcName === 'ULS_D6');
        conditions[9] = nr.lcName === 'Wind_Right_Ice' &&
                        (flComb.lcName === 'ULS_D2' || flComb.lcName === 'ULS_D7' ||
                         flComb.lcName === 'ULS_D8');
        conditions[10] = nr.lcName === 'Wind_High_Ice' &&
                         (flComb.lcName === 'ULS_D3' || flComb.lcName === 'ULS_D5' ||
                          flComb.lcName === 'ULS_D7');
        conditions[11] = nr.lcName === 'Wind_Low_Ice' &&
                         (flComb.lcName === 'ULS_D4' || flComb.lcName === 'ULS_D6' ||
                          flComb.lcName === 'ULS_D8');
        
        CONDITION = conditions[0] || conditions[1] || conditions[2] ||
                    conditions[3] || conditions[4] || conditions[5] || conditions[6] ||
                    conditions[7] || conditions[8] || conditions[9] || conditions[10] ||
                    conditions[11];
        if (flComb.steelwork === nr.steelwork && CONDITION) {
          let tempFactor;
          switch (true) {
            case nr.lcName.startsWith('Wind_Left') &&
                 flComb.lcName.endsWith('5'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_Left') &&
                 flComb.lcName.endsWith('6'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_Right') &&
                 flComb.lcName.endsWith('7'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_Right') &&
                 flComb.lcName.endsWith('8'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_High') &&
                 flComb.lcName.endsWith('5'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_High') &&
                 flComb.lcName.endsWith('7'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_Low') &&
                 flComb.lcName.endsWith('6'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_Low') &&
                 flComb.lcName.endsWith('8'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            default:
              tempFactor = 1; // 1 for non-diagonal wind directions
          }
          
          // 50% wind for Accidental cases
          if (flComb.lcName.startsWith('ULS_F'))
            tempFactor *= 0.5;
          
          flComb.axialVariable += nr['Fy'] * tempFactor;
          flComb.shearAlongVariable += nr['Fz'] * tempFactor;
          flComb.shearAcrossVariable += nr['Fx'] * tempFactor;
          flComb.momentAlongVariable += nr['My'] * tempFactor;
          flComb.momentAcrossVariable += nr['Mz'] * tempFactor;
          flComb.torsionVariable += nr['Mx'] * tempFactor;
          
        }
        
        // Resultant Moment
        flComb['resultantMoment'] = Math.sqrt(
            ((flComb.momentAlongPermanent + flComb.momentAlongVariable) ** 2) +
            ((flComb.momentAcrossPermanent + flComb.momentAcrossVariable) **
             2));
      });
    });
    
  }
  
  /**
   * Extract Foundation Loads (Cases) from Skyciv solve result
   */
  #extractFoundationLoadCases() {
    const LoadCases = [
      'Dead Loads (-18)',
      'Dead Loads (10)',
      'Dead Loads (-5)',
      'Ice Loads',
      'Wind Left',
      'Wind Right',
      'Wind High',
      'Wind Low',
      'Wind Left and High',
      'Wind Left and Low',
      'Wind Right and High',
      'Wind Right and Low',
      'Wind Left (Ice)',
      'Wind Right (Ice)',
      'Wind High (Ice)',
      'Wind Low (Ice)',
      'Wind Left and High (Ice)',
      'Wind Left and Low (Ice)',
      'Wind Right and High (Ice)',
      'Wind Right and Low (Ice)',
      'Construction',
      'Accidental',
    ];
    // List all foundations and their load cases
    for (let found in this.#foundations) {
      for (let lc of LoadCases) {
        this.#analyzeResult.foundationLoadsCases.push({
                                                        steelwork: found,
                                                        loadCase: lc,
                                                        axial: 0,
                                                        shearAlong: 0,
                                                        shearAcross: 0,
                                                        momentAlong: 0,
                                                        momentAcross: 0,
                                                        torsion: 0,
                                                      });
      }
    }
    
    // Add Loads
    this.#analyzeResult.nodeReactions.forEach(nr => {
      this.#analyzeResult.foundationLoadsCases.forEach(flCase => {
        // SW1 , Steel_Other, Dead_18_Wiring, Dead_10_Wiring, Dead_5_Wiring
        let conditions = [];
        conditions[0] = (nr.lcName === 'SW1' || nr.lcName === 'Steel_Other' ||
                         nr.lcName === 'Dead_18_Wiring') && flCase.loadCase ===
                        'Dead Loads (-18)';
        conditions[1] = (nr.lcName === 'SW1' || nr.lcName === 'Steel_Other' ||
                         nr.lcName === 'Dead_10_Wiring') && flCase.loadCase ===
                        'Dead Loads (10)';
        conditions[2] = (nr.lcName === 'SW1' || nr.lcName === 'Steel_Other' ||
                         nr.lcName === 'Dead_5_Wiring') && flCase.loadCase ===
                        'Dead Loads (-5)';
        let CONDITION = conditions[0] || conditions[1] || conditions[2];
        if (nr.steelwork === flCase.steelwork && CONDITION) {
          flCase.axial += nr['Fy'];
          flCase.shearAlong += nr['Fz'];
          flCase.shearAcross += nr['Fx'];
          flCase.momentAlong += nr['Mx'];
          flCase.momentAcross += nr['Mz'];
          flCase.torsion += nr['My'];
        }
        
        // ICE_Other , SW2, Construction, Accidental
        conditions = [];
        conditions[0] = (nr.lcName === 'ICE_Other' || nr.lcName === 'SW2') &&
                        flCase.loadCase === 'Ice Loads';
        conditions[1] = nr.lcName === 'Construction' && flCase.loadCase ===
                        'Construction';
        conditions[2] = nr.lcName === 'Accidental' && flCase.loadCase ===
                        'Accidental';
        CONDITION = conditions[0] || conditions[1] || conditions[2];
        if (nr.steelwork === flCase.steelwork && CONDITION) {
          flCase.axial += nr['Fy'];
          flCase.shearAlong += nr['Fz'];
          flCase.shearAcross += nr['Fx'];
          flCase.momentAlong += nr['Mx'];
          flCase.momentAcross += nr['Mz'];
          flCase.torsion += nr['My'];
        }
        
        // Wind
        conditions = [];
        conditions[0] = nr.lcName === 'Wind_Left' &&
                        (flCase.loadCase === 'Wind Left' || flCase.loadCase ===
                         'Wind Left and High' || flCase.loadCase ===
                         'Wind Left and Low');
        conditions[1] = nr.lcName === 'Wind_Right' &&
                        (flCase.loadCase === 'Wind Right' || flCase.loadCase ===
                         'Wind Right and High' || flCase.loadCase ===
                         'Wind Right and Low');
        conditions[2] = nr.lcName === 'Wind_High' &&
                        (flCase.loadCase === 'Wind High' || flCase.loadCase ===
                         'Wind Left and High' || flCase.loadCase ===
                         'Wind Right and High');
        conditions[3] = nr.lcName === 'Wind_Low' &&
                        (flCase.loadCase === 'Wind Low' || flCase.loadCase ===
                         'Wind Left and Low' || flCase.loadCase ===
                         'Wind Right and Low');
        conditions[4] = nr.lcName === 'Wind_Left_Ice' &&
                        (flCase.loadCase === 'Wind Left (Ice)' || flCase.loadCase ===
                         'Wind Left and High (Ice)' || flCase.loadCase ===
                         'Wind Left and Low (Ice)');
        conditions[5] = nr.lcName === 'Wind_Right_Ice' &&
                        (flCase.loadCase === 'Wind Right (Ice)' || flCase.loadCase ===
                         'Wind Right and High (Ice)' || flCase.loadCase ===
                         'Wind Right and Low (Ice)');
        conditions[6] = nr.lcName === 'Wind_High_Ice' &&
                        (flCase.loadCase === 'Wind High (Ice)' || flCase.loadCase ===
                         'Wind Left and High (Ice)' || flCase.loadCase ===
                         'Wind Right and High (Ice)');
        conditions[7] = nr.lcName === 'Wind_Low_Ice' &&
                        (flCase.loadCase === 'Wind Low (Ice)' || flCase.loadCase ===
                         'Wind Left and Low (Ice)' || flCase.loadCase ===
                         'Wind Right and Low (Ice)');
        CONDITION = conditions[0] || conditions[1] || conditions[2] ||
                    conditions[3] || conditions[4] || conditions[5] || conditions[6] ||
                    conditions[7];
        if (nr.steelwork === flCase.steelwork && CONDITION) {
          let tempFactor;
          switch (true) {
            case nr.lcName.startsWith('Wind_Left') &&
                 flCase.loadCase.startsWith('Wind Left and High'):
              tempFactor = this.windFactors.leftHighLeft;
              break;
            case nr.lcName.startsWith('Wind_Left') &&
                 flCase.loadCase.startsWith('Wind Left and Low'):
              tempFactor = this.windFactors.leftLowLeft;
              break;
            case nr.lcName.startsWith('Wind_Right') &&
                 flCase.loadCase.startsWith('Wind Right and High'):
              tempFactor = this.windFactors.rightHighRight;
              break;
            case nr.lcName.startsWith('Wind_Right') &&
                 flCase.loadCase.startsWith('Wind Right and Low'):
              tempFactor = this.windFactors.rightLowRight;
              break;
            case nr.lcName.startsWith('Wind_High') &&
                 flCase.loadCase.startsWith('Wind Left and High'):
              tempFactor = this.windFactors.leftHighHigh;
              break;
            case nr.lcName.startsWith('Wind_High') &&
                 flCase.loadCase.startsWith('Wind Right and High'):
              tempFactor = this.windFactors.rightHighHigh;
              break;
            case nr.lcName.startsWith('Wind_Low') &&
                 flCase.loadCase.startsWith('Wind Left and Low'):
              tempFactor = this.windFactors.leftLowLow;
              break;
            case nr.lcName.startsWith('Wind_Low') &&
                 flCase.loadCase.startsWith('Wind Right and Low'):
              tempFactor = this.windFactors.rightLowLow;
              break;
            default:
              tempFactor = 1; // 1 for non-diagonal wind directions
          }
          
          flCase.axial += nr['Fy'] * tempFactor;
          flCase.shearAlong += nr['Fz'] * tempFactor;
          flCase.shearAcross += nr['Fx'] * tempFactor;
          flCase.momentAlong += nr['Mx'] * tempFactor;
          flCase.momentAcross += nr['Mz'] * tempFactor;
          flCase.torsion += nr['My'] * tempFactor;
        }
        
      });
    });
    
  }
  
  /**
   * Fixing analysis result's number fraction digit
   * @param keys
   * @param fractionDigits
   */
  #fixFractionDigits(keys, fractionDigits) {
    for (let key of keys) {
      if (this.#analyzeResult.hasOwnProperty(key))
        for (let group of this.#analyzeResult[key]) {
          for (let property in group) {
            if (group.hasOwnProperty(property) && typeof group[property] ===
                'number')
              group[property] = +(group[property]).toFixed(fractionDigits);
          }
        }
    }
  }
  
  #setAnalysisResult(factor, index, key, value) {
    if (this.#analyzeResult.hasOwnProperty(factor)) {
      if (!this.#analyzeResult[factor][index])
        this.#analyzeResult[factor][index] = {};
      this.#analyzeResult[factor][index][key] = value;
    }
  };
  
  /**
   * Generate final analysis result
   */
  #generateAnalysisResult() {
    let startTime = new Date();
    let memberForces = this.#analyzeResult.memberForces;
    memberForces.forEach((memberForce, index) => {
      let sectionProperty = this.#sectionProperties[memberForce.propertyRef];
      StructureAnalyzer.#setDraftValues(sectionProperty, memberForce);
      this.#analyzeResult.memberAnalysis[index] = new MemberAnalysis();
      this.#analyzeResult.memberUtilisation[index] = new MemberUtilisation();
      // Cross-Section Check
      if (sectionProperty.cross_section === 1) {
        this.#compressionTensionCalculation(index);
        this.#shearCalculation(index);
        this.#bendingCalculation(index);
        this.#bendingAxialCalculation(index);
        this.#biAxialBendingCalculation(index);
      }
      
      // Stability Check
      if (sectionProperty.buckling === 1 && memberForce['fxMin'] >= 0 && memberForce['fxMax'] >= 0) {
        // Lateral restraints for buckling
        draft.lateralRestraints.Ly = Math.max(draft.memberForce.length || 0,
            this.memberGuide[memberForce.memberId]['Ly'] || 0);
        draft.lateralRestraints.Lz = Math.max(draft.memberForce.length || 0,
            this.memberGuide[memberForce.memberId]['Lz'] || 0);
        this.#momentFactorsCalculation(index);
        this.#flexuralBucklingCalculation(index);
        this.#torsionalBucklingCalculation(index);
        this.#torsionalFBucklingCalculation(index);
        this.#ltbCalculation(index);
        this.#combinedCalculation(index);
      }
      
      // Design - Final Steelwork Utilisation
      this.#utilisationCalculation(index);
    });
    
    // Fixing analysis result's number fraction digit
    this.#fixFractionDigits(
        [
          'memberUtilisation',
          'foundationLoadsCombinations',
          'foundationLoadsCases',
          'memberAnalysis',
        ], FD);
    // Fixing Steelwork Utilisation fraction digits
    for (let sw in this.#analyzeResult.steelworkUtilisation) {
      if (this.#analyzeResult.steelworkUtilisation[sw].value !== null) {
        this.#analyzeResult.steelworkUtilisation[sw].value =
            +(this.#analyzeResult.steelworkUtilisation[sw].value).toFixed(FD);
      }
    }
    let endTime = new Date();
    let elapsedTime = endTime.getTime() - startTime.getTime();
    console.log('ANALYZE COMPLETED IN ' + elapsedTime + 'ms');
    return this.#analyzeResult;
  }
  
  /**
   * Design - Compression/Tension - Section 6.2.4 (ALL MEMBERS)
   */
  #compressionTensionCalculation(index) {
    if (draft.sectionProperty.compression === 0) return;
    
    const set = this.#setAnalysisResult.bind(this);
    let co = draft.compression,
        mf = draft.memberForce;
    
    set('memberAnalysis', index, 'N_c_Rd', co.N_c_Rd);
    set('memberAnalysis', index, 'N_pl_Rd', co.N_pl_Rd);
    set('memberUtilisation', index, 'N_c_Rd', mf.N_Ed / co.N_c_Rd);
    set('memberUtilisation', index, 'N_pl_Rd', mf.N_Ed / co.N_pl_Rd);
    
  }
  
  /**
   * Design - Shear - Section 6.2.6 (ALL MEMBERS)
   */
  #shearCalculation(index) {
    if (draft.sectionProperty.shear === 0) return;
    
    const set = this.#setAnalysisResult.bind(this);
    let mf = draft.memberForce,
        sh = draft.shear;
    
    // Design - Shear buckling - Section 6.2.6
    set('memberAnalysis', index, 'V_b_Rd', sh.V_b_Rd);
    set('memberUtilisation', index, 'V_b_Rd', sh.V_b_Rd === 'Ignored' ? 0 : 1);
    
    // Design - Shear y-y - Section 6.2.6
    set('memberAnalysis', index, 'V_c_y_Rd', sh.V_c_y_Rd);
    set('memberAnalysis', index, 'V_pl_y_Rd', sh.V_pl_y_Rd);
    set('memberUtilisation', index, 'V_c_y_Rd', mf.Vy_Ed / sh.V_c_y_Rd);
    set('memberUtilisation', index, 'V_pl_y_Rd', mf.Vy_Ed / sh.V_pl_y_Rd);
    
    // Design - Shear z-z - Section 6.2.6
    set('memberAnalysis', index, 'V_c_z_Rd', sh.V_c_z_Rd);
    set('memberAnalysis', index, 'V_pl_z_Rd', sh.V_pl_z_Rd);
    set('memberUtilisation', index, 'V_c_z_Rd', mf.Vz_Ed / sh.V_c_z_Rd);
    set('memberUtilisation', index, 'V_pl_z_Rd', mf.Vz_Ed / sh.V_pl_z_Rd);
    
  }
  
  /**
   * Design - Bending (Including Bending And Shear) - Section 6.2.5 (ALL MEMBERS)
   */
  #bendingCalculation(index) {
    if (draft.sectionProperty.bending === 0) return;
    
    const set = this.#setAnalysisResult.bind(this);
    let sp = draft.sectionProperty,
        mf = draft.memberForce,
        be = draft.bending,
        sh = draft.shear;
    
    // Bending including bending and shear
    
    // Design - Bending y-y - Section 6.2.5
    
    /**
     * Reduction Factor - 6.2.10(3)
     */
    const Pv_y = mf.Vy_Ed > 0.5 * sh.V_pl_y_Rd ?
                 ((2 * mf.Vy_Ed / sh.V_pl_y_Rd) - 1) ** 2 :
                 0;
    
    be.M_c_y_Rd = be.Wy * (1 - Pv_y) * sp.Fy / sp.YM0;
    be.M_Pl_y_Rd = be.M_c_y_Rd;
    set('memberAnalysis', index, 'M_c_y_Rd', be.M_c_y_Rd);
    set('memberAnalysis', index, 'M_Pl_y_Rd', be.M_Pl_y_Rd);
    set('memberUtilisation', index, 'M_c_y_Rd', mf.My_Ed / be.M_c_y_Rd);
    set('memberUtilisation', index, 'M_Pl_y_Rd', mf.My_Ed / be.M_Pl_y_Rd);
    
    // Design - Bending z-z - Section 6.2.5
    /**
     * Reduction Factor - 6.2.10(3)
     */
    const Pv_z = mf.Vz_Ed > 0.5 * sh.V_pl_z_Rd ?
                 ((2 * mf.Vz_Ed / sh.V_pl_z_Rd) - 1) ** 2 :
                 0;
    be.M_c_z_Rd = be.Wz * (1 - Pv_z) * sp.Fy / sp.YM0;
    be.M_Pl_z_Rd = be.M_c_z_Rd;
    set('memberAnalysis', index, 'M_c_z_Rd', be.M_c_z_Rd);
    set('memberAnalysis', index, 'M_Pl_z_Rd', be.M_Pl_z_Rd);
    set('memberUtilisation', index, 'M_c_z_Rd', mf.Mz_Ed / be.M_c_z_Rd);
    set('memberUtilisation', index, 'M_Pl_z_Rd', mf.Mz_Ed / be.M_Pl_z_Rd);
  }
  
  /**
   * Design - Combined bending and axial force - Section 6.2.9 (5) (ALL MEMBERS)
   */
  #bendingAxialCalculation(index) {
    if (draft.sectionProperty.bending_axial === 0) return;
    
    const set = this.#setAnalysisResult.bind(this);
    let sp = draft.sectionProperty,
        mf = draft.memberForce,
        ba = draft.bendingAxial,
        be = draft.bending,
        co = draft.compression;
    
    // Class 1 and 2
    if (sp.class === 1 || sp.class === 2) {
      let otherSectionFlag = false;
      switch (sp.type) {
        case 'UC':// UC Sections
                  //Check if allowance needs to be made for effect of axial force on plastic moment resistance in y-y
                  // (eq 6.33 and 6.34)
          const N_y_lim = Math.min(
              (0.25 * co.N_pl_Rd) || 0,
              0.5 * sp.hw * sp.tw * sp.Fy / sp.YM0 || 0,
          );

          // Calculate 'a' in formula 6.38 - 'Web area to gross area ratio
          const a_6_38 = Math.min(((sp.A - 2 * sp.b * sp.tf) / sp.A) || 0, 0.5);

          // Reduced major plastic moment resistance y-y (eq 6.36)
          ba.M_N_y_Rd = mf.N_Ed > N_y_lim ?
              be.M_Pl_y_Rd *
              Math.min(((1 - ba.n) / (1 - 0.5 * a_6_38)) || 0, 1) :
              be.M_Pl_y_Rd;
          
          // Reduced minor plastic moment resistance z-z (eq 6.38)
          // Check if allowance needs to be made for effect of axial force on plastic moment resistance in z-z (eq 6.35)
          const N_z_lim = sp.hw * sp.tw * sp.Fy / sp.YM0;
          if (mf.N_Ed > N_z_lim)
            if (ba.n > a_6_38)
              ba.M_N_z_Rd = be.M_Pl_z_Rd *
                            (1 - ((ba.n - a_6_38) / (1 - a_6_38)) ** 2);
            else
              ba.M_N_z_Rd = be.M_c_z_Rd;
          else
            ba.M_N_z_Rd = be.M_Pl_z_Rd;
          
          // Check if values are below 0 (to avoid complex number in 6.2.9 (6)
          ba.M_N_y_Rd = ba.M_N_y_Rd < 0 ? 'Erroneous Data' : ba.M_N_y_Rd;
          ba.M_N_z_Rd = ba.M_N_z_Rd < 0 ? 'Erroneous Data' : ba.M_N_z_Rd;
          break;
        
        case 'SHS': // Rectangular Hollow Sections
        case 'RHS':
          const aw = Math.min(((sp.A - 2 * sp.b * sp.t) / sp.A) || 0, 0.5),
              af = Math.min(((sp.A - 2 * sp.h * sp.t) / sp.A) || 0, 0.5);

          ba.M_N_y_Rd = Math.min(
              (be.M_Pl_y_Rd * (1 - ba.n) / (1 - 0.5 * aw)) || 0,
              be.M_Pl_y_Rd || 0,
          );
          ba.M_N_z_Rd = Math.min(
              ((be.M_Pl_z_Rd * (1 - ba.n) / (1 - 0.5 * af))) || 0,
              be.M_Pl_z_Rd || 0,
          );
          break;

        case 'CHS':// Circular Hollow Sections
          ba.M_N_y_Rd = be.M_Pl_y_Rd * Math.min(1, (1 - ba.n ** 1.7) || 0);
          ba.M_N_z_Rd = be.M_Pl_z_Rd * Math.min(1, (1 - ba.n ** 1.7) || 0);
          break;
        
        default: //Any other sections - Section 6.2.1 - Equation 6.2
          otherSectionFlag = true;
          ba.M_N_y_Rd = 'Not Calculated';
          ba.M_N_z_Rd = 'Not Calculated';
          ba.eq_6_2 = (mf.N_Ed / co.N_c_Rd) + (mf.My_Ed / be.M_c_y_Rd) +
                      (mf.Mz_Ed / be.M_c_z_Rd);
      }
      set('memberAnalysis', index, 'M_N_y_Rd', ba.M_N_y_Rd);
      set('memberAnalysis', index, 'M_N_z_Rd', ba.M_N_z_Rd);
      if (!otherSectionFlag) {
        
        set('memberUtilisation', index, 'M_N_y_Rd', mf.My_Ed / ba.M_N_y_Rd);
        set('memberUtilisation', index, 'M_N_z_Rd', mf.Mz_Ed / ba.M_N_z_Rd);
      } else {
        set('memberUtilisation', index, 'M_N_y_Rd', ba.eq_6_2);
        set('memberUtilisation', index, 'M_N_z_Rd', ba.eq_6_2);
      }
    }
    
  }
  
  /**
   * Design - BiAxial bending - Section 6.2.9 (6) (ALL MEMBERS)
   */
  #biAxialBendingCalculation(index) {
    if (draft.sectionProperty.biaxial_bending === 0) return;
    
    const set = this.#setAnalysisResult.bind(this);
    let sp = draft.sectionProperty,
        mf = draft.memberForce,
        ba = draft.bendingAxial;
    
    // Design - biaxial bending - Section 6.2.9 (6)
    if (ba.M_N_y_Rd === 'Erroneous Data' || ba.M_N_z_Rd === 'Erroneous Data') {
      set('memberAnalysis', index, 'eq_6_41', 'Erroneous Data');
      set('memberUtilisation', index, 'eq_6_41', 1);
      return;
    }
    
    // Find a_bi and B_bi depending on Section Type:
    let a_bi;
    let B_bi;
    // Class 1 and 2
    if (sp.class === 1 || sp.class === 2) {

      switch (sp.type) {
        case 'UC': // UC Sections
          a_bi = 2; // Parameter for 6.41 formula
          B_bi = Math.min((5 * ba.n) || 0, 1); // Parameter for 6.41 formula
          break;
        case 'SHS':
        case 'RHS': // Rectangular Hollow Sections
          a_bi = Math.min((1.66 / (1 - 1.13 * ba.n * ba.n)) || 0, 6); // Parameter for 6.41 formula
          B_bi = a_bi; // Parameter for 6.41 formula
          break;
        case 'CHS':
          a_bi = 2; // Parameter for 6.41 formula
          B_bi = 2; // Parameter for 6.41 formula
          break;
      }
    }
    if ((sp.class === 1 || sp.class === 2) &&
        (sp.type === 'UC' || sp.type === 'SHS' || sp.type === 'RHS' ||
            sp.type === 'CHS')) {
      const eq_6_41 = (mf.My_Ed / ba.M_N_y_Rd) ** a_bi +
          (mf.Mz_Ed / ba.M_N_z_Rd) ** B_bi;

      set('memberAnalysis', index, 'eq_6_41', eq_6_41);
      set('memberUtilisation', index, 'eq_6_41', eq_6_41);
    } else {
      set('memberAnalysis', index, 'eq_6_41', ba.eq_6_2);
      set('memberUtilisation', index, 'eq_6_41', ba.eq_6_2);
    }
    
  }
  
  /**
   * Equivalent uniform moment factors - Taken from EC3 Table B.3
   */
  #momentFactorsCalculation = () => {
    
    let mf = draft.memberForce,
        mo = draft.momentFactors;
    // Assume linear and uniform moment distribution for worst case
    if (mf.Start_My_Ed === 0 || mf.End_My_Ed === 0)
      mo.Yy = 0;
    else if (Math.abs(mf.Start_My_Ed) <= Math.abs(mf.End_My_Ed))
      mo.Yy = mf.Start_My_Ed / mf.End_My_Ed;
    else
      mo.Yy = mf.End_My_Ed / mf.Start_My_Ed;

    // Assume linear and uniform moment distribution for worst case
    if (mf.Start_Mz_Ed === 0 || mf.End_Mz_Ed === 0)
      mo.Yz = 0;
    else if (Math.abs(mf.Start_Mz_Ed) <= Math.abs(mf.End_Mz_Ed))
      mo.Yz = mf.Start_Mz_Ed / mf.End_Mz_Ed;
    else
      mo.Yz = mf.End_Mz_Ed / mf.Start_Mz_Ed;

    // Assume linear and uniform moment distribution for worst case
    mo.Cmy = Math.max((0.6 + 0.4 * mo.Yy) || 0, 0.4);
    mo.Cmz = Math.max((0.6 + 0.4 * mo.Yz) || 0, 0.4);
    mo.CmLt = Math.max((0.6 + 0.4 * mo.Yy) || 0, 0.4);
  };
  
  /**
   * Design - Flexural Buckling (ALL MEMBERS)
   */
  #flexuralBucklingCalculation(index) {
    if (draft.sectionProperty.flexural_buckling === 0) return;
    const set = this.#setAnalysisResult.bind(this);
    let mf = draft.memberForce,
        sp = draft.sectionProperty,
        fb = draft.flexuralBuckling,
        lr = draft.lateralRestraints;

    if (draft.sectionProperty.flexural_buckling === 1) {
      // Design - Flexural Buckling y-y
      const Ky = this.memberGuide[mf.memberId]['Ky'];// Length Factors for Flexural Buckling
      const L_cr_y = lr.Ly * Ky; // Critical buckling length
      fb.N_cr_y = PI ** 2 * sp.ESEC3 * sp.Iy / L_cr_y ** 2;// Critical buckling force
      fb.y_y = Math.sqrt(sp.A * sp.Fy / fb.N_cr_y); // Slenderness ratio for buckling - eq 6.50

      if ((fb.y_y <= 0.2) || (mf.N_Ed / fb.N_cr_y <= 0.04)) {
        fb.X_y = 1;
      } else {
        // Design resistance for buckling - Section 6.3.1.1.
        const Oy = 0.5 * (1 + sp.a_y * (fb.y_y - 0.2) + fb.y_y ** 2); // Buckling reduction determination factor
        fb.X_y = Math.min((1 / (Oy + Math.sqrt(Oy ** 2 - fb.y_y ** 2))) || 0,
            1);  // Buckling reduction factor - eq 6.49
      }
      
      // Design - Flexural Buckling z-z
      const Kz = this.memberGuide[mf.memberId]['Kz'];// Length Factors for Flexural Buckling
      const L_cr_z = lr.Lz * Kz;// Critical buckling length
      fb.N_cr_z = PI ** 2 * sp.ESEC3 * sp.Iz / L_cr_z ** 2;// Critical buckling force
      fb.y_z = Math.sqrt(sp.A * sp.Fy / fb.N_cr_z); // Slenderness ratio for buckling - e1 6.50
      
      if ((fb.y_z <= 0.2) || (mf.N_Ed / fb.N_cr_z <= 0.04)) {
        fb.X_z = 1;
      } else {
        // Design resistance for buckling - Section 6.3.1.1.
        const Oz = 0.5 * (1 + sp.a_z * (fb.y_z - 0.2) + fb.y_z ** 2); // Buckling reduction determination factor
        fb.X_z = Math.min((1 / (Oz + Math.sqrt(Oz ** 2 - fb.y_z ** 2))) || 0,
            1);  // Buckling reduction factor - eq 6.49
      }
    }
    // Design - Flexural Buckling y-y
    fb.N_b_y_Rd = fb.X_y * sp.A * sp.Fy / sp.YM0;
    set('memberAnalysis', index, 'N_b_y_Rd', fb.N_b_y_Rd);
    set('memberUtilisation', index, 'N_b_y_Rd', mf.N_Ed / fb.N_b_y_Rd);
    
    // Design - Flexural Buckling z-z
    fb.N_b_z_Rd = fb.X_z * sp.A * sp.Fy / sp.YM0;
    set('memberAnalysis', index, 'N_b_z_Rd', fb.N_b_z_Rd);
    set('memberUtilisation', index, 'N_b_z_Rd', mf.N_Ed / fb.N_b_z_Rd);
  }
  
  /**
   * Design - Torsional Buckling 6.3.1.4, NCCI SN001a (ALL MEMBERS)
   */
  #torsionalBucklingCalculation(index) {
    const set = this.#setAnalysisResult.bind(this);
    let mf = draft.memberForce,
        sp = draft.sectionProperty,
        tb = draft.torsionalBuckling,
        lr = draft.lateralRestraints;
    if (draft.sectionProperty.torsional_buckling === 0) {
      set('memberAnalysis', index, 'N_b_T_Rd', 0);
      set('memberUtilisation', index, 'N_b_T_Rd', 0);
      return;
    }
    let X_T;
    //Design - Torsional Buckling 6.3.1.4
    if (draft.sectionProperty.torsional_buckling === 1) {
      const L_cr_T = Math.max(lr.Ly || 0, lr.Lz || 0); // Torsional buckling length
      const io = Math.sqrt(sp.i_y ** 2 + sp.i_z ** 2 + sp.y0 ** 2 + sp.z0 ** 2); // Polar Radius of gyration
      tb.N_cr_T = (1 / io ** 2) *
          (sp.G * sp.It + PI ** 2 * sp.ESEC3 * sp.Iw / L_cr_T ** 2); // Elastic critical torsional buckling
                                                                     // force
      const y_T = Math.sqrt(sp.A * sp.Fy / tb.N_cr_T);

      // Design resistance for buckling - Section 6.3.1.1.
      const O_T = 0.5 * (1 + sp.a_z * (y_T - 0.2) + y_T ** 2); // Buckling reduction determination factor
      X_T = Math.min((1 / (O_T + Math.sqrt(O_T ** 2 - y_T ** 2))) || 0, 1); // Buckling reduction factor - eq 6.49
    }
    
    const N_b_T_Rd = X_T * sp.A * sp.Fy / sp.YM1;
    set('memberAnalysis', index, 'N_b_T_Rd', N_b_T_Rd);
    set('memberUtilisation', index, 'N_b_T_Rd', mf.N_Ed / N_b_T_Rd);
  }
  
  /**
   * Design - Torsional Flexural Buckling 6.3.1.4, NCCI SN001a
   */
  #torsionalFBucklingCalculation(index) {
    const set = this.#setAnalysisResult.bind(this);
    let mf = draft.memberForce,
        sp = draft.sectionProperty,
        tb = draft.torsionalBuckling,
        fb = draft.flexuralBuckling;

    if (draft.sectionProperty.torsional_f_buckling === 0) {
      set('memberAnalysis', index, 'N_b_TF_Rd', 0);
      set('memberUtilisation', index, 'N_b_TF_Rd', 0);
      return;
    }
    
    // Design - Torsional Flexural Buckling 6.3.1.4
    if (draft.sectionProperty.torsional_f_buckling === 1) {
      const io = Math.sqrt(sp.i_y ** 2 + sp.i_z ** 2 + sp.y0 ** 2 + sp.z0 ** 2); // Polar Radius of gyration
      const N_b_TF_Rd = (fb.N_cr_y / (2 * (1 - (sp.y0 / io) ** 2))) *
          (1 + tb.N_cr_T / fb.N_cr_y - Math.sqrt(
              (1 - tb.N_cr_T / fb.N_cr_y) ** 2 + 4 * (sp.y0 / io) ** 2 *
              (tb.N_cr_T / fb.N_cr_y))); // 1993-1-3 eq 6.35,
      set('memberAnalysis', index, 'N_b_TF_Rd', N_b_TF_Rd);
      set('memberUtilisation', index, 'N_b_TF_Rd', mf.N_Ed / N_b_TF_Rd);
    }
  }
  
  /**
   * Design - Lateral Torsional Buckling 6.3.2.1
   */
  #ltbCalculation(index) {
    /**
     * Slenderness for LTB
     * Critical Moment Mcr in accordance with "NCCI SN 003b - Elastic Critical Moment for Lateral Torsional Buckling"
     * LTB is only likely when the section has significantly different values of second moment of area and is subjected
     * to bending in stronger plane. Uniform moments create worst case scenarios; this used to calculate Mcr
     */
    const set = this.#setAnalysisResult.bind(this);
    let sp = draft.sectionProperty,
        mf = draft.memberForce,
        lt = draft.lateralTorsionalBuckling,
        lb = draft.lateralRestraints,
        mo = draft.momentFactors,
        be = draft.bending;
    let M_b_Rd;
    // SHS and CHS are not susceptible to LTB:
    if (sp.lateral_buckling === 0) {
      lt.X_Lt = 1;
      M_b_Rd = be.M_c_y_Rd;
    } else if (sp.lateral_buckling > 0) { // If LTB applies
      const Zg = sp.h / 2; // Conservative distance between point of load application and shear centre conservatively
                           // taken
      const L = lb.Ly; // Beam length between lateral restrains
      const Kc = 1 / (1.33 - 0.33 * mo.Yy); // Moment Distribution Correction Factor (Table 6.6)
      const C2 = 0; // Assume Uniform Moment Distribution For Worst Case
      const C1 = 1 / Kc ** 2; // Assume Uniform Moment Distribution For Worst Case
      const Mcr = C1 * PI ** 2 * sp.ESEC3 * sp.Iz / L ** 2 * (Math.sqrt(
          sp.Iw / sp.Iz + (L ** 2 * sp.G * sp.It) /
          (PI ** 2 * sp.ESEC3 * sp.Iz) + (C2 * Zg) ** 2) - C2 * Zg); // Elastic Critical Moment
      const y_Lt0 = 0.4; // Limiting slenderness ratio from UK NA
      const y_Lt = Math.sqrt(be.Wy * sp.Fy / Mcr); // Slenderness ratio for LTB
      
      // Check if LTB can be ignored
      if (y_Lt < y_Lt0) {
        lt.X_Lt = 1;
        M_b_Rd = be.M_c_y_Rd;
      } else if (sp.lateral_buckling === 1) { // If Method 1 Applies
        const B_Lt = 0.75; // Correction factor for rolled sections from UK NA
        lt.O_Lt = 0.5 * (1 + sp.a_Lt * (y_Lt - y_Lt0) + B_Lt * y_Lt ** 2); // LTB reduction determination factor
        lt.X_Lt = Math.min(
            (1 / (lt.O_Lt + Math.sqrt(lt.O_Lt ** 2 - B_Lt * y_Lt ** 2))) || 0,
            1,
            (1 / y_Lt ** 2) || 0,
        ); // LTB reduction factor eq 6.57
        const f = Math.min(
            (1 - 0.5 * (1 - Kc) * (1 - 2 * (y_Lt - 0.8) ** 2)) || 0, 1); // Modification factor
        const X_Lt_Mod = Math.min((lt.X_Lt / f) || 0, 1, (1 / y_Lt ** 2) || 0); // Modified LTB reduction factor eq 6.58
        M_b_Rd = X_Lt_Mod * be.Wy * sp.Fy / sp.YM1; // Design buckling resistance moment eq 6.55
      } else if (sp.lateral_buckling === 2) { // If Method 2 Applies
        lt.O_Lt = 0.5 * (1 + sp.a_Lt * (y_Lt - 0.2) + y_Lt ** 2); // LTB reduction determination factor
        lt.X_Lt = Math.min(
            (1 / (lt.O_Lt + Math.sqrt(lt.O_Lt ** 2 - y_Lt ** 2))) || 0,
            1,
        ); // LTB reduction factor eq 6.57
        M_b_Rd = lt.X_Lt * be.Wy * sp.Fy / sp.YM1; // Design buckling resistance moment eq 6.55
      }
    }
    
    set('memberAnalysis', index, 'M_b_Rd', M_b_Rd);
    set('memberUtilisation', index, 'M_b_Rd', mf.My_Ed / M_b_Rd);
  }
  
  /**
   * Design - Combined bending and compression 6.3.3
   */
  #combinedCalculation(index) {
    const set = this.#setAnalysisResult.bind(this);
    let sp = draft.sectionProperty,
        mf = draft.memberForce,
        lt = draft.lateralTorsionalBuckling,
        fb = draft.flexuralBuckling,
        mo = draft.momentFactors,
        be = draft.bending;
    
    const N_Rk = sp.A * sp.Fy; // Characteristic resistance to normal force
    const My_Rk = be.Wy * sp.Fy; // Characteristic moment resistance
    const Mz_Rk = be.Wz * sp.Fy; // Characteristic moment resistance
    
    // Interaction factors
    
    // Kyy & Kzz & Kyz & Kzy
    let Kyy, Kzz, Kyz, Kzy;
    if (sp.class < 3) {
      Kyy = mo.Cmy * (1 + Math.min((fb.y_y - 0.2) || 0, 0.8) * mf.N_Ed /
          (fb.X_y * N_Rk / sp.YM1));

      if (sp.type === 'SHS' || sp.type === 'RHS') {
        Kzz = mo.Cmz * (1 + Math.min((fb.y_z - 0.2) || 0, 0.8) * mf.N_Ed /
            (fb.X_z * N_Rk / sp.YM1));
        Kzy = 0.6 * Kyy;
      } else {
        Kzz = mo.Cmz * (1 + Math.min((2 * fb.y_z - 0.6) || 0, 1.4) * mf.N_Ed /
            (fb.X_z * N_Rk / sp.YM1));
        if (fb.y_z < 0.4)
          Kzy = Math.min((0.6 + fb.y_z) || 0,
              (1 - (0.1 * fb.y_z * mf.N_Ed) /
                  ((mo.CmLt - 0.25) * (fb.X_z * N_Rk / sp.YM1))) || 0);
        else
          Kzy = 1 - 0.1 * Math.min(fb.y_z || 0, 1) * mf.N_Ed /
              ((mo.CmLt - 0.25) * (fb.X_z * N_Rk / sp.YM1));
      }
    } else {
      Kyy = mo.Cmy * (1 + Math.min((0.6 * fb.y_y) || 0, 0.6) * mf.N_Ed /
          (fb.X_y * N_Rk / sp.YM1));
      Kzz = mo.Cmz * (1 + Math.min((0.6 * fb.y_z) || 0, 0.6) * mf.N_Ed /
          (fb.X_z * N_Rk / sp.YM1));
      if (sp.type === 'SHS' || sp.type === 'RHS')
        Kzy = 0.8 * Kyy;
      else
        Kzy = 1 - 0.05 * Math.min(fb.y_z || 0, 1) * mf.N_Ed /
            ((mo.CmLt - 0.25) * (fb.X_z * N_Rk / sp.YM1));
    }
    Kyz = 0.6 * Kzz;
    
    // Interaction Formulas
    const eq_6_61 = mf.N_Ed / (fb.X_y * N_Rk / sp.YM1) + Kyy * mf.My_Ed /
                    (lt.X_Lt * My_Rk / sp.YM1) + Kyz * mf.Mz_Ed / (Mz_Rk / sp.YM1);
    const eq_6_62 = mf.N_Ed / (fb.X_z * N_Rk / sp.YM1) + Kzy * mf.My_Ed /
                    (lt.X_Lt * My_Rk / sp.YM1) + Kzz * mf.Mz_Ed / (Mz_Rk / sp.YM1);
    set('memberAnalysis', index, 'eq_6_61', eq_6_61);
    set('memberAnalysis', index, 'eq_6_62', eq_6_62);
    set('memberUtilisation', index, 'eq_6_61', eq_6_61);
    set('memberUtilisation', index, 'eq_6_62', eq_6_62);
  }
  
  /**
   * Design - Final Steelwork Utilisation
   */
  #utilisationCalculation(index) {
    if (!this.#analyzeResult.memberUtilisation[index]) return;
    let steelwork = this.memberGuide[draft.memberForce.memberId]['sw'];
    
    draft.utilisation.Utilisation[steelwork] = this.#analyzeResult.steelworkUtilisation[steelwork].value;
    let maxMemberUtilisation = getMax(
        Object.values(this.#analyzeResult.memberUtilisation[index]));
    if (draft.utilisation.Utilisation[steelwork] < maxMemberUtilisation) {
      draft.utilisation.Utilisation[steelwork] = maxMemberUtilisation;
      this.#analyzeResult.steelworkUtilisation[steelwork].value = draft.utilisation.Utilisation[steelwork];
      this.#analyzeResult.steelworkUtilisation[steelwork].lcName = this.#analyzeResult.memberForces[index].lcName;
    }
    
  }
  
}

module.exports = StructureAnalyzer;
