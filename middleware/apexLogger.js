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

class LogSendersQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(logSender) {
    this.queue.push(logSender);
  }

  dequeue() {
    return this.queue.shift();
  }

  sendAllLogs = () => {
    if (this.queue.length > 0) {
      const logSender = this.dequeue();
      logSender().then(this.sendAllLogs);
    }
  };
}

const init = () => {
  return (incomingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.connectToLogsDb = new Promise((resolve, reject) => {
      ssh
        .connect({
          host: `${process.env.TIMESCALE_HOSTNAME}`,
          username: `${process.env.SSH_USERNAME}`,
          privateKey: `${process.env.SSH_KEY_LOCATION}`,
        })
        .then(resolve)
        .catch((e) => {
          console.log(e);
        });
    });

    outgoingResponse.locals.logSendersQueue = new LogSendersQueue();

    next();
  };
};

const incomingRequestLogSender = (incomingRequest, outgoingResponse) => {
  const incomingRequestPathWithQuery =
    incomingRequest.path + '?' + querystring.stringify(incomingRequest.query);

  const method = incomingRequest.method;
  const host = incomingRequest.headers['host'];
  const port = 443;
  const path = incomingRequestPathWithQuery;
  const headers = incomingRequest.headers;
  const body = incomingRequest.body;
  const correlationId = headers['X-Apex-Correlation-ID'];

  return async () => {
    let result;

    await outgoingResponse.locals.connectToLogsDb.then(() => {
      result = sendLog(correlationId, headers, body).then(() => {
        console.log('just logged incomingRequest above');
      });
    });

    return result;
  };
};

const queueIncomingRequestLogSender = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.enqueue(
      incomingRequestLogSender(incomingRequest, outgoingResponse),
    );

    next();
  };
};

const outgoingResponseLogSender = (outgoingResponse) => {
  const correlationId = outgoingResponse.locals.apexCorrelationId;
  const headers = outgoingResponse.getHeaders();
  const status = outgoingResponse.statusCode;
  const body = outgoingResponse.locals.body;

  return () => {
    return sendLog(correlationId, headers, body, status).then(() => {
      console.log('just logged outgoingResponse above');
    });
  };
};

const queueOutgoingResponseLogSender = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.enqueue(outgoingResponseLogSender(outgoingResponse));

    logSendersQueue.sendAllLogs();

    next();
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
  queueIncomingRequestLogSender,
  queueOutgoingResponseLogSender,
  sendLog,
};
