const express = require('express');
const { requestTracer } = require('./middleware/tracer');
const logger = require('morgan');

const { logsDbClient, logsDbConnector } = require('./middleware/apexLogger');

const indexRouter = require('./routes/index');

const app = express();

app.use(requestTracer());
app.use(logger('dev'));

const client = logsDbClient();
app.use(logsDbConnector(client));

app.use('/', indexRouter);

module.exports = app;
