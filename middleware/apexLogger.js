require('dotenv').config();
const { Pool } = require('pg');
// const timestamp = require('../helpers/timestamp');

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

  sendAllLogs = (client) => {
    if (this.queue.length > 0) {
      const logSender = this.dequeue();

      logSender().then(() => {
        this.sendAllLogs(client);
      });
    } else {
      client.release();
    }
  };
}

const logsDbConnector = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const pool = new Pool();

    pool.on('error', (err, client) => {
      console.log('An error occurred while connecting to logs database:');
      console.log(err);
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    outgoingResponse.locals.connectToLogsDb = pool.connect();

    outgoingResponse.locals.logSendersQueue = new LogSendersQueue();

    next();
  };
};

const sendAllLogsToDb = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logSendersQueue = outgoingResponse.locals.logSendersQueue;

    outgoingResponse.locals.connectToLogsDb.then((client) => {
      logSendersQueue.sendAllLogs(client);
    });

    next();
  };
};

const sendLog = ({
  client,
  correlationId,
  method = null,
  host = null,
  port = null,
  path = null,
  statusCode = null,
  headers,
  body = null,
} = {}) => {
  if (body && body.constructor === Buffer) {
    body = body.toString('hex');
  }

  const parameterValues = [correlationId, method, host, port, path, statusCode, headers, body];

  return client
    .query(
      'INSERT INTO apex_logs (timestamp, correlation_id, method, host, port, path, status_code, headers, body) ' +
        'VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8);',
      parameterValues,
    )
    .then((result) => {
      console.log('database write succeeded.');
    })
    .catch((err) => {
      console.log('An error occurred while writing to the logs database:');
      console.log(err);
    });
};

module.exports = {
  logsDbConnector,
  sendLog,
  sendAllLogsToDb,
};
