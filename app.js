var express = require('express');
var logger = require('morgan');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: '*/*' })); // May not support all request bodies, maximum size of request body defaults to 100kb
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
