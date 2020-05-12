const express = require('express');
const logger = require('morgan');

const { requestTracer } = require('./middleware/tracer');

const {
  connectToLogsDb,
  assignLogsDbConnection,
  createLogsQueue,
} = require('./middleware/apexLogger');

const indexRouter = require('./routes/index');

const app = express();

app.use(logger('dev'));

app.use(requestTracer());

const logsDbConnection = connectToLogsDb();
app.use(assignLogsDbConnection(logsDbConnection));
app.use(createLogsQueue());

app.use('/', indexRouter);

module.exports = app;
