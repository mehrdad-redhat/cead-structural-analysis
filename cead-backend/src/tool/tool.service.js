const Tool = require('../_database').Tool;

/**
 * Create a new tool
 * @param bodyTool
 * @returns {Promise<unknown>}
 */
async function createTool(bodyTool) {
	return new Promise((resolve, reject) => {
		const tool = new Tool(bodyTool);
		Tool.findOne({
			             title: bodyTool.title,
		             }).exec((err, foundTool) => {
			if (err) return reject(err);
			
			if (foundTool)
				return reject({
					              name: 'customError',
					              message: 'There is already a tool with that name',
					              code: 400,
				              });
			return resolve(tool.save());
		});
	});
}

/**
 * Get all tools
 * @returns {Promise<DocumentQuery<T[], T, QueryHelpers> & QueryHelpers>}
 */
async function getAllTools() {
	return Tool.find({});
}

/**
 * Edit a tool
 * @param toolId
 * @param bodyTool
 * @returns {Promise<unknown>}
 */
async function editTool(toolId, bodyTool) {
	return new Promise((resolve, reject) => {
		Tool.findOne({
			             slug: bodyTool.slug,
			             _id: {$ne: toolId},
		             }).exec((err, foundTool) => {
			if (err) return reject(err);
			
			if (foundTool)
				
				return reject({
					              name: 'customError',
					              message: 'There is already a tool with that name',
					              code: 400,
				              });
			
			Tool.findByIdAndUpdate(toolId, bodyTool, {returnDocument: 'after'}).exec(
					(err, updatedTool) => {
						if (err) return reject(err);
						
						if (!updatedTool)
							reject({
								       name: 'customError',
								       code: 404,
								       message: 'Tool with id ' + toolId + ' not found',
							       });
						return resolve(updatedTool);
					});
		});
		
	});
}

module.exports = {
	createTool,
	getAllTools,
	editTool,
};
