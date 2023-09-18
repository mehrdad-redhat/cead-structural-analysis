
module.exports = {
	authorization : require('./authorize.middleware'),
	duplicateCheck : require('./duplicate-check.middleware'),
	errorHandler : require('./error.middleware'),
}
