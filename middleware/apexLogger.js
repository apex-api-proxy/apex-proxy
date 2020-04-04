require('dotenv').config();
const node_ssh = require('node-ssh');
const pgp = require('pg-promise')();
const timestamp = require('../helpers/timestamp');

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

const logsDbConnector = () => {
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

const sendAllLogsToDb = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    logSendersQueue.sendAllLogs();

    next();
  };
};

const sendLog = (trace_id, headers, body = null, status = null) => {
  const formattedLogObject = {
    time: timestamp(),
    trace_id: trace_id,
    headers: headers,
    body: body,
    status_code: status,
  };

  return db
    .any(
      'INSERT INTO apex_log VALUES ($<time>, $<trace_id>, $<headers>, $<body>, $<status_code>);',
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
  logsDbConnector,
  sendLog,
  sendAllLogsToDb,
};
