const toolService = require('./tool.service');

/**
 * Create new tool
 */
function createTool(req, res, next) {
	const tool = {
		title: req.body.title,
		status: req.body.status,
		icon: req.body.icon,
		new: req.body.new,
	};
	toolService.createTool(tool).then(() => {
		return res.status(201).send({message: 'Tool successfully created'});
	}).catch(next);
}

/**
 * Get all tools
 */
function getAllTools(req, res, next) {
	toolService.getAllTools().then(data => {
		return res.status(200).send({data});
	}).catch(next);
}

/**
 * Edit a tool
 */
function editTool(req, res, next) {
	let editedTool = {
		title: req.body.title,
		status: req.body.status,
		icon_url: req.body.icon_url,
		new: req.body.new,
		slug: req.body.title.toLowerCase().replaceAll(' ', '-'),
	};
	
	toolService.editTool(req.params.id, editedTool).then(editedTool => {
		return res.status(200).send(
				{message: 'Tool successfully updated', data: editedTool});
	}).catch(next);
}

module.exports = {
	createTool,
	getAllTools,
	editTool,
};
