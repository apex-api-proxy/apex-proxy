require('dotenv').config();
const node_ssh = require('node-ssh');
const ssh = new node_ssh();
const pgp = require('pg-promise')();
const db = pgp({
  host: `${process.env.TIMESCALE_IP}`,
  port: 5432,
	database: 'postgres',
	user: `${process.env.DB_USER}`,
	password: `${process.env.DB_PASSWORD}`
});

const init = (req, res, next) => {
	res.locals.correlationId = req.headers['x-apex-correlation-id'] || req.headers['X-Apex-Correlation-ID'];

	const requestFinishing = new Promise((resolve, reject) => {
	  res.on('finish', () => {
	    resolve();
	  });
	});

	ssh.connect({
	  host: `${process.env.TIMESCALE_HOSTNAME}`,
	  username: `${process.env.SSH_USERNAME}`,
	  privateKey: `${process.env.SSH_KEY_LOCATION}`
	})
	.then( _ => {
		sendLog(req);
	})
	.catch( e => {
		console.log(e);
	})

	next();
};

const sendLog = (reqRes) => {
	let formattedLogObject;

	if (reqRes.statusCode) {
		formattedLogObject = resFormatter(reqRes);
	} else {
		formattedLogObject = reqFormatter(reqRes);
	}

	return db.any('INSERT INTO apex_log VALUES (NOW(), $<trace_id>, $<headers>, $<body>, $<status_code>);', formattedLogObject)
	.then( _ => {
		console.log('database write succeeded.');
	})
	.catch( e => {
		console.log('Logging db error:');
		console.log(e);
	});
};

const reqFormatter = (reqObject) => {
	console.log('request headers: ', reqObject.headers);
	const headers = reqObject.headers;
	const correlationId = headers['x-apex-correlation-id'] || headers['X-Apex-Correlation-ID'];

	return {
		trace_id: correlationId,
		headers: JSON.stringify(headers),
		body: reqObject.body ? JSON.stringify(reqObject.body) : null,
		status_code: null
	};
};

const resFormatter = (resObject) => {
	const headers = resObject.req.headers;
	const correlationId = resObject.locals.apexCorrelationId;

	return {
		trace_id: correlationId,
		headers: JSON.stringify(headers),
		body: resObject.locals.body,
		status_code: resObject.statusCode
	};
};

module.exports = { init, sendLog };

		// .then( _ => {
		// 	requestFinishing.then(() => {
		// 		console.log('res.locals.body: ', typeof res.locals.body);
		// 		const formattedResponse = resFormatter(res, correlationId, res.locals.body);
		// 		sendLog(formattedResponse)
		// 	});
		// })
