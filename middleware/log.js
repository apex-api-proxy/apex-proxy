require('dotenv').config();
const node_ssh = require('node-ssh');
const ssh = new node_ssh();
const pgp = require('pg-promise')();
const db = pgp({
  host: `${process.env.TIMESCALE_IP}`,
  port: 5432,
  database: 'postgres',
  user: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
});

const init = (req, res, next) => {
  ssh
    .connect({
      host: `${process.env.TIMESCALE_HOSTNAME}`,
      username: `${process.env.SSH_USERNAME}`,
      privateKey: `${process.env.SSH_KEY_LOCATION}`,
    })
    .then((_) => {
    	console.log('req.body: ', req.body);
    	const headers = req.headers;
    	const correlationId = headers['X-Apex-Correlation-ID'];
    	// const body = req.body;
    	const body = 'incomingRequest';

      sendLog(correlationId, headers, body);
    })
    .then(next)
    .catch((e) => {
      console.log(e);
    });
};

const sendLog = (trace_id, headers, body=null, status=null) => {
	const formattedLogObject = {
	  trace_id: trace_id,
	  headers: headers,
	  body: body,
	  status_code: status,
	};

  return db
    .any(
      'INSERT INTO apex_log VALUES (NOW(), $<trace_id>, $<headers>, $<body>, $<status_code>);',
      formattedLogObject,
    )
    .then((_) => {
      console.log('database write succeeded.');
    })
    .catch((e) => {
      console.log('An error occurred while writing to db: ', e);
    });
};

module.exports = { 
	init,
	sendLog
}
