const express = require('express');
const tracer = require('./middleware/tracer');
// const apexLogger = require('./middleware/log');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');

const app = express();

app.use(tracer.traceRequest());
// app.use(apexLogger);
app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// May not support all request bodies, maximum size of
// request body defaults to 100kb
app.use(bodyParser.text({ type: '*/*' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);

module.exports = app;
