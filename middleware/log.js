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

const apexLogger = (req, res, next) => {
	// console.log('res.statusCode when apexLogger begins: ', res.statusCode);
	const correlationId = req.headers['x-apex-correlation-id'] || req.headers['X-Apex-Correlation-ID'];
	let finished;

	const requestFinishing = new Promise((resolve, reject) => {
	  res.on('finish', () => {
	    resolve();
	  });
	});

	res.locals.logStoreConnection = ssh.connect({
	  host: `${process.env.TIMESCALE_HOSTNAME}`,
	  username: `${process.env.SSH_USERNAME}`,
	  privateKey: `${process.env.SSH_KEY_LOCATION}`
	});

	// ssh.connect({
	//   host: `${process.env.TIMESCALE_HOSTNAME}`,
	//   username: `${process.env.SSH_USERNAME}`,
	//   privateKey: `${process.env.SSH_KEY_LOCATION}`
	// })
	res.locals.logStoreConnection
	.then( _ => {
		const formattedRequest = reqFormatter(res, correlationId);
		sendLog(formattedRequest)

	})
	.catch( e => {
		console.log(e);
	})

	next();
};

const sendLog = (reqRes) => {
	const correlationId = reqRes.headers['x-apex-correlation-id'] || reqRes.headers['X-Apex-Correlation-ID'] || 'test!';
	let formattedLogObject;

	if (reqRes.statusCode) {
		formattedLogObject = resFormatter(reqRes, correlationId);
	} else {
		formattedLogObject = reqFormatter(reqRes, correlationId);
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

const reqFormatter = (reqObject, correlationId) => {
	const headers = reqObject.headers || {};

	return {
		trace_id: correlationId,
		headers: JSON.stringify(headers),
		body: reqObject.body ? JSON.stringify(reqObject.body) : null,
		status_code: null
	};
};

const resFormatter = (resObject, correlationId) => {
	// console.log('resFormatter body: ', resObject.locals.body);
	const headers = resObject.getHeaders() || {};

	return {
		trace_id: correlationId,
		headers: JSON.stringify(headers),
		body: resObject.locals.body,
		status_code: resObject.statusCode
	};
};

module.exports = apexLogger;

		// .then( _ => {
		// 	requestFinishing.then(() => {
		// 		console.log('res.locals.body: ', typeof res.locals.body);
		// 		const formattedResponse = resFormatter(res, correlationId, res.locals.body);
		// 		sendLog(formattedResponse)
		// 	});
		// })
