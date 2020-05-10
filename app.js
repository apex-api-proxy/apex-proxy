const express = require('express');
const { requestTracer } = require('./middleware/tracer');
const logger = require('morgan');
const { createLogsDbClient, assignLogsDbClient } = require('./middleware/apexLogger');

const indexRouter = require('./routes/index');

const app = express();

app.use(requestTracer());
app.use(logger('dev'));

const logsDbClient = createLogsDbClient();
app.use(assignLogsDbClient(logsDbClient));

app.use('/', indexRouter);

module.exports = app;
