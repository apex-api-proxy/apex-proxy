require('dotenv').config();
const { Pool } = require('pg');
const sql = require('sql');

sql.setDialect('postgres');

class LogsQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(log) {
    if (log.body && log.body.constructor === Buffer) {
      log.body = log.body.toString('hex');
    }

    this.queue.push(log);
  }

  dequeue() {
    return this.queue.shift();
  }

  sendAllLogs(client) {
    const logs = sql.define({
      name: 'apex_logs',
      columns: [
        'timestamp',
        'correlation_id',
        'headers',
        'body',
        'status_code',
        'method',
        'host',
        'port',
        'path',
      ],
    });

    const query = logs.insert(this.queue).toQuery();

    return client
      .query(query)
      .then((result) => {
        console.log('Successfully wrote all logs to logs database');
      })
      .catch((err) => {
        console.log('An error occurred while writing to the logs database:');
        console.log(err);
      });
  }
}

const connectToLogsDb = () => {
  const pool = new Pool();

  pool.on('error', (err, client) => {
    console.log('An error occurred while connecting to logs database:');
    console.log(err);
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool.connect();
};

const assignLogsDbConnection = (logsDbConnection) => {
  return (incomingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.connectToLogsDb = logsDbConnection;

    next();
  };
};

const createLogsQueue = (logsDbConnection) => {
  return (incomingRequest, outgoingResponse, next) => {
    outgoingResponse.locals.logsQueue = new LogsQueue();

    next();
  };
};

const sendAllLogsToDb = () => {
  return (incomingRequest, outgoingResponse, next) => {
    const logsQueue = outgoingResponse.locals.logsQueue;

    outgoingResponse.locals.connectToLogsDb.then((client) => {
      logsQueue.sendAllLogs(client);
    });

    next();
  };
};

module.exports = {
  connectToLogsDb,
  assignLogsDbConnection,
  createLogsQueue,
  sendAllLogsToDb,
};
