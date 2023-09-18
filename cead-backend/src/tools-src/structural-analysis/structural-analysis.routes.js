const router = require('express').Router();
const structureController = require('./structure/structure.controller');
const projectController = require('./project/project.controller');
const {authorization} = require('../../_middleware');
const DIR = {
	PROJECT: '/project',
	STRUCTURE: '/structure',
};

router.get('/test', (req, res) => {
	res.status(200).json({message: 'Realm of Structures'});
});

// Project Routes

/**
 * New sa project for a user
 */
router.post(`${DIR.PROJECT}`, authorization.verifyToken,
            projectController.createProject);

/**
 * Get all sa projects of a user
 */
router.get(`${DIR.PROJECT}`, authorization.verifyToken,
           projectController.getAllProject);

/**
 * Edit a single project by id
 */
router.put(`${DIR.PROJECT}/:id`, authorization.verifyToken,
           projectController.editProject);

// Structure Routes
/**
 * Create a structure under project id
 */
router.post(`${DIR.STRUCTURE}`, authorization.verifyToken,
            structureController.createStructure);

/**
 * Get a single structure
 */
router.get(`${DIR.STRUCTURE}/:id`, authorization.verifyToken,
           structureController.getStructure);

/**
 * Get all structures of a project
 */

/**
 * Edit a single structure
 */
router.put(`${DIR.STRUCTURE}/:id`, authorization.verifyToken,
           structureController.editStructure);

/**
 * Update skyciv model of structure
 */
router.post(`${DIR.STRUCTURE}/:id/update-skyciv-model`,
            authorization.verifyToken, 
            structureController.updateSkycivModel);

/**
 * Solve a structure
 */
router.get(`${DIR.STRUCTURE}/:id/analyze`, 
           authorization.verifyToken,
           authorization.isApiUsageLimited,
           structureController.analyzeStructure);

/**
 * Get Analyse Results
 */
router.get(`${DIR.STRUCTURE}/:id/results`,
           authorization.verifyToken,
           structureController.getSolvedData);


/**
 * Update structure revision number
 */
router.post(`${DIR.STRUCTURE}/:id/update-revision`,
            authorization.verifyToken,
            structureController.updateStructureRevision);

/**
 * Update structure thumbnail image
 */
router.post(`${DIR.STRUCTURE}/:id/update-thumbnail`,
            authorization.verifyToken,
            structureController.updateStructureThumbnail);


module.exports = router;
