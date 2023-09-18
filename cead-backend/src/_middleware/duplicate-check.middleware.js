const db = require("../_database");
const User = db.User;

checkDuplicateEmail = (req, res, next) => {
	User.findOne({email: req.body.email})
	    .exec((err, user) => {
		if (err)
			throw new Error(err)
		
		if (user) {
			res.status(400).send({message: "Failed! Email is already in use!"});
			return;
		}
		
		next();
	});
};

module.exports = {
	checkDuplicateEmail
};
