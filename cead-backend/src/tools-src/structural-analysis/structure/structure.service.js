const Structure = require('./structure.model');
const ROLES = require('../../../_database').ROLES;
const SA_Structure = require('../../../_database').SA_Structure;
const Project = require('../../../_database').SA_Project;


/**
 * Create a structure under project id
 * @param structure
 * @param ownerId
 * @param projectId
 * @returns {Promise<void>}
 */
async function createStructure(structure,projectId,ownerId) {
	return new Promise((resolve, reject) => {
		Project.findOne({owner: ownerId, _id: projectId}).then(project => {
			if (!project)
				return reject({
					name: 'customError',
					code: 404,
					message: `Project with id ${projectId} not found for you`,
				});
			const newStructure = new SA_Structure(structure);
			newStructure['owner'] = ownerId;
			let structureModel = new Structure(structure['structure_data'], 0);
			structureModel.convertToSkycivModel().then(skycivModel => {
				newStructure['skyciv_model'] = skycivModel;
				newStructure['structure_guide'] = structureModel.guides;
				newStructure['structure_drafts'] = structureModel.drafts;
				newStructure.save().then(newStruct => {
					project.structures.push(newStruct._id);
					project.save();
					resolve(newStruct);
				});
			});

		}).catch(() => reject);
	});
}


/**
 * Get a single structure
 * @param structureId
 * @param userId
 * @param userRole
 * @returns {Promise<unknown>}
 */
async function getStructure(structureId, userId, userRole) {
	const filter = ((userRole === ROLES.ADMIN) ?
			{_id: structureId} :
			{_id: structureId, owner: userId});
	return new Promise((resolve, reject) => {
		SA_Structure.findOne(filter).
				select('-preview_url -structure_drafts -structure_guide').then(structure => {
			if (!structure)
				return reject({
					name: 'customError',
					code: 404,
					message: `Structure with id ${structureId} not found for you`,
				});

			return resolve(structure);
		}).catch(() => reject);
	});
}


/**
 * Get Skyciv model
 * @param structureId
 * @param userId
 * @returns {Promise<void>}
 */
async function getSkycivModel(structureId, userId) {
	return new Promise((resolve, reject) => {
		SA_Structure.findOne({_id: structureId, owner: userId}).then(structure => {
			if (!structure)
				return reject({
					name: 'customError',
					code: 404,
					message: `Structure with id ${structureId} not found for you`,
				});

			return resolve({
				structureType: structure.type,
				skycivModel: structure.skyciv_model,
				guides: structure.structure_guide,
				drafts: structure.structure_drafts,
			});
		}).catch(() => reject);
	});
}


/**
 * Get solved data
 * @param structureId
 * @param userId
 * @returns {Promise<void>}
 */
async function getAnalyseResult(structureId, userId) {
	return new Promise((resolve, reject) => {
		SA_Structure.findOne({_id: structureId, owner: userId}).then(structure => {
			if (!structure)
				return reject({
					name: 'customError',
					code: 404,
					message: `Structure with id ${structureId} not found for you`,
				});

			return resolve(structure.analyzed_data);
		}).catch(() => reject);
	});
}


/**
 * Edit basic information of structure
 * @param name
 * @param location
 * @param revision
 * @param structureId
 * @param userId
 * @param userRole
 * @returns {Promise<void>}
 */
async function basicStructureEdit(name,location,revision, structureId, userId, userRole) {
	let filter;
	if (userRole === ROLES.ADMIN)
		filter = {
			_id: structureId,
		};
	else
		filter = {
			owner: userId,
			_id: structureId,
		};

	return new Promise((resolve, reject) => {
		SA_Structure.findOne(filter).then(struct => {
			if (!struct)
				return reject({
					name: 'customError',
					code: 404,
					message: 'Structure with id ' + structureId +
							' not found',
				});

			let tempStructureData = {...struct['structure_data']};

			const type = tempStructureData['info']['structure_type'];
			tempStructureData.info= {
				structure_name: name,
				structure_location: location,
				structure_type: type
			};
			struct['structure_data'] = tempStructureData;
			struct['revision'] = revision;
			return resolve(struct.save());
		}).catch(() => reject);
	});

}


/**
 * Edit structure data
 * @param fields
 * @param dataArray
 * @param structureId
 * @param userId
 * @param userRole
 * @returns {Promise<unknown[]>}
 */
async function advanceStructureEdit(
		fields, dataArray, structureId, userId, userRole) {
	let filter;
	if (userRole === ROLES.ADMIN)
		filter = {
			_id: structureId,
		};
	else
		filter = {
			owner: userId,
			_id: structureId,
		};
	let promises = [];

	let edit = (field, data) => {
		return new Promise((resolve, reject) => {
			SA_Structure.findOne(filter).then(struct => {
				if (!struct)
					return reject({
						name: 'customError',
						code: 404,
						message: 'Structure with id ' + structureId +
								' not found',
					});

				struct[field] = data;
				return resolve(struct.save());
			}).catch(() => reject);
		});
	};
	for (let [index, field] of fields.entries())
		promises.push(edit(field, dataArray[index]));

	return Promise.all(promises);
}


module.exports = {
	createStructure,
	getStructure,
	basicStructureEdit,
	advanceStructureEdit,
	getSkycivModel,
	getAnalyseResult
};
