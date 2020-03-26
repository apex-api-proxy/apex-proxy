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
	const correlationId = req.headers['X-Apex-Correlation-ID'];
	const formattedRequestObject = reqResFormatter(req, correlationId);

	ssh.connect({
	  host: `${process.env.TIMESCALE_HOSTNAME}`,
	  username: `${process.env.SSH_USERNAME}`,
	  privateKey: `${process.env.SSH_KEY_LOCATION}`
	})
	.then( _ => {
		sendLog(formattedRequestObject);
	})
	.catch(e => {
		console.log(e);
	})

	res.on('finish', _ => {
		const formattedResponseObject = reqResFormatter(res, correlationId);

		sendLog(formattedResponseObject);
	});
};

const sendLog = (reqResObject) => {
	console.log('connected!');

	db.any('INSERT INTO apex_log VALUES (NOW(), $<trace_id>, $<headers>, $<body>, $<status_code>);', reqResObject)
	.then(response => {
		console.log('response: ', response);
	})
	.catch(e => {
		console.log('Logging db error:');
		console.log(e);
	});

	console.log('ran db command')
};

const reqResFormatter = (reqResObject, correlationId) => {
	return {
		trace_id: correlationId,
		headers: reqResObject.headers ? String(reqResObject.headers) : String(reqResObject.getHeaders()),
		body: reqResObject.body ? reqResObject.body : null,
		status_code: reqResObject.statusCode ? reqResObject.statusCode : null
	};
};

export default apexLogger;

/*
TimescaleDB 'apex_log' table schema

CREATE TABLE apex_log (
	time          timestamptz NOT NULL,
	trace_id      varchar(40) NOT NULL,
	headers       text        NOT NULL,
	body          text        NULL,
	status_code   integer     NULL
);
ALTER TABLE apex_log ADD CONSTRAINT valid_status CHECK (status_code > 99 AND status_code < 600);

Timescale insert statement, configured with object

'INSERT INTO apex_log VALUES (NOW(), ${trace_id}, ${headers}, #{body}, #{status_code})', {
	trace_id: '89678a1c-6f80-11ea-bc55-0242ac130003',
	headers: 'test headers',
	body: 'test body from config object'
	status_code: 900
}
*/

// access postgres from ubuntu prompt: sudo su - postgres