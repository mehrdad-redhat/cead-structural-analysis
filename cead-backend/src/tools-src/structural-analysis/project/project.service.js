const ROLES = require('../../../_database').ROLES;
const Project = require('../../../_database').SA_Project;

/**
 * New sa project for a user
 * @param bodyProject
 * @returns {Promise<unknown>}
 */
async function createProject(bodyProject) {
	const project = new Project(bodyProject);
	return project.save();
}

/**
 * Get all sa projects of a user
 * @returns {Promise<DocumentQuery<T[], T, QueryHelpers> & QueryHelpers>}
 */
async function getAllProjects(userId, userRole) {
	if (userRole === ROLES.ADMIN)
		return Project
				.find({})
				.populate('owner', 'email first_name last_name FullName');
	else
		return Project
				.find({owner: userId})
				.populate('structures',
				          '_id revision structure_data.info.structure_location structure_data.info.structure_type structure_data.info.structure_name preview_url updatedAt name location type')
				.select('-owner');
}

/**
 * Edit a single project by id
 * @param projectId
 * @param userId
 * @param userRole
 * @param bodyProject
 * @returns {Promise<unknown>}
 */
async function editProject(projectId, userId, userRole, bodyProject) {
	return new Promise((resolve, reject) => {
		let filter;
		if (userRole === ROLES.ADMIN)
			filter = {
				_id: projectId,
			};
		else
			filter = {
				owner: userId,
				_id: projectId,
			};
		
		Project
				.findOneAndUpdate(filter, bodyProject, {new: true})
				.exec((err, updatedProject) => {
					if (err) return reject(err);
					
					if (!updatedProject)
						reject({
							       name: 'customError',
							       code: 404,
							       message: 'Project with id ' + projectId + ' not found',
						       });
					return resolve(updatedProject);
				});
	});
}

module.exports = {
	createProject,
	getAllProjects,
	editProject,
};
