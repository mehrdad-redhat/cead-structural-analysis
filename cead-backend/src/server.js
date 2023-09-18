require('dotenv').config();
const express = require('express'),
		app = express(),
		bodyParser = require('body-parser'),
		cookieParser = require('cookie-parser'),
		cors = require('cors'),
		{errorHandler} = require('./_middleware'),
		config = require('./app.config.json');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());


const corsOptions = {
	credentials: true,
	origin: function (origin, callback) {
		if (config.cors.origins.indexOf(origin) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	}
}

// allow cors requests from any origin and with credentials
app.use(cors(corsOptions));

// api routes
app.use('/v1', require('./routes'));

// swagger docs route TODO : Enable Swagger documentation or something else
// app.use("/api-docs", require("src/_helpers/swagger"));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== '')
	app.listen(port, () => {
		console.log('Server listening on port ' + port);
	});
else
	console.error('Enviroments did\'nt load successfully');
