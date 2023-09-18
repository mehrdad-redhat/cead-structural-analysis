const app= require('express')();

app.get('/test',((req, res, next) => {
	res.status(200).send({message: 'How you doing?'})
}));
app.use('/users',require('./user/user.routes'));
app.use('/structural-analysis',require('./tools-src/structural-analysis/structural-analysis.routes'));
app.use('/tools',require('./tool/tool.routes'));
module.exports = app;
