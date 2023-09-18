const router = require('express').Router();
const userController = require('../user/user.controller')
const {authorization,duplicateCheck} = require('../_middleware');

router.get('/test',(req, res, next) => {
	res.status(200).send({message: 'Realm of Users'});
});

router.post('/signup',duplicateCheck.checkDuplicateEmail,userController.signup)
router.post('/login',userController.login);
router.get('/:userId',authorization.verifyToken,userController.getUser);
router.put('/:userId',authorization.verifyToken,userController.editUser);
router.post('/:userId/password',authorization.verifyToken,userController.passChange);

module.exports = router;
