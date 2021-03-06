const express = require('express');
const { requestTracer } = require('./middleware/tracer');
const logger = require('morgan');
// const cookieParser = require('cookie-parser');
// const path = require('path');

const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');

const app = express();

app.use(requestTracer());
app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);

module.exports = app;
