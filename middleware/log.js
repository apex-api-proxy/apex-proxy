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
})

const apexLogger = (req, res, next) => {
	const correlationId = req.headers['x-apex-correlation-id'];

	ssh.connect({
	  host: `${process.env.TIMESCALE_HOSTNAME}`,
	  username: `${process.env.SSH_USERNAME}`,
	  privateKey: `${process.env.SSH_KEY_LOCATION}`
	})
	.then( _ => {
		const formattedRequestObject = reqResFormatter(req, correlationId);

		sendLog(formattedRequestObject);
	})
	.catch( e => {
		console.log(e);
	})

	res.on('finish', _ => {
		const formattedResponseObject = reqResFormatter(res, correlationId);

		sendLog(formattedResponseObject);
	});

	res.send('check the database.');
};

const sendLog = (reqResObject) => {
	console.log('connected to database!');

	db.any('INSERT INTO apex_log VALUES (NOW(), $<trace_id>, $<headers>, $<body>, $<status_code>);', reqResObject)
	.then( _ => {
		console.log('database write succeeded.');
	})
	.catch( e => {
		console.log('Logging db error:');
		console.log(e);
	});
};

const reqResFormatter = (reqResObject, correlationId) => {
	const headers = reqResObject.headers || reqResObject.getHeaders() || {};

	return {
		trace_id: correlationId,
		headers: JSON.stringify(headers), //? String(reqResObject.headers) : String(reqResObject.getHeaders()),
		body: reqResObject.body ? JSON.stringify(reqResObject.body) : null,
		status_code: reqResObject.statusCode ? reqResObject.statusCode : null
	};
};

module.exports = apexLogger;
