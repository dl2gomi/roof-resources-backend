var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

const { resEnhancer } = require('@/middlewares');
const { connectDB } = require('./config/db');

var apiV1Router = require('./routes/api/v1');

var app = express();

// db connection
connectDB();

app.use(cors());

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// response enhancer
app.use(resEnhancer);

// routers
app.use('/api/v1', apiV1Router);
app.get('/api/health', (req, res) => res.json({ health: 'Good' }));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).json({
    message: 'Resource not found',
    error: {
      statusCode: 404,
      message: 'The requested endpoint does not exist.',
    },
  });
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: {
      statusCode: err.status || 500,
      message: err.message || 'An unexpected error occurred.',
    },
  });
});

module.exports = app;
