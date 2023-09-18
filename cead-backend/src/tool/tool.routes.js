const router = require('express').Router();
const toolController = require('./tool.controller');
const {authorization} = require('../_middleware');

router.get('/test', (req, res) => {
	res.status(200).json({message: 'Realm of Tools'});
});

// New tool
router.post('/', [authorization.verifyToken, authorization.isAdmin],
            toolController.createTool);

// Get all tools
router.get('/', [authorization.verifyToken, authorization.isAdmin],
           toolController.getAllTools);

// Edit a tool
router.put('/:id', [authorization.verifyToken, authorization.isAdmin],
           toolController.editTool);

module.exports = router;
