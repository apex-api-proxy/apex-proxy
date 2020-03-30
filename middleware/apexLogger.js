require('dotenv').config();
const node_ssh = require('node-ssh');
const pgp = require('pg-promise')();
const querystring = require('querystring');

const ssh = new node_ssh();
const db = pgp({
  host: `${process.env.TIMESCALE_IP}`,
  port: 5432,
  database: 'postgres',
  user: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
});

const init = () => {
  return (incomingRequest, outgoingResponse, next) => {
    ssh
      .connect({
        host: `${process.env.TIMESCALE_HOSTNAME}`,
        username: `${process.env.SSH_USERNAME}`,
        privateKey: `${process.env.SSH_KEY_LOCATION}`,
      })
      .then(() => {
        const incomingRequestPathWithQuery =
          incomingRequest.path +
          '?' +
          querystring.stringify(incomingRequest.query);

        const method = incomingRequest.method;
        const host = incomingRequest.headers['host'];
        const port = 443;
        const path = incomingRequestPathWithQuery;
        const headers = incomingRequest.headers;
        const body = incomingRequest.body;
        const correlationId = headers['X-Apex-Correlation-ID'];

        sendLog(correlationId, headers, body).then(() => {
          console.log('just logged incomingRequest above');
        });
      })
      .then(next)
      .catch((e) => {
        console.log(e);
      });
  };
};

const sendLog = (trace_id, headers, body = null, status = null) => {
  const formattedLogObject = {
    trace_id: trace_id,
    headers: headers,
    body: body,
    status_code: status,
  };

  return db
    .any(
      'INSERT INTO apex_log_kelvin VALUES (NOW(), $<trace_id>, $<headers>, $<body>, $<status_code>);',
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
  sendLog,
};
