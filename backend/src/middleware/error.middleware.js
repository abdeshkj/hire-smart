const ApiError = require('../utils/ApiError');
const env = require('../config/env.config');

// Catch 404 and forward to error handler
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal Server Error';
  }

  const response = {
    success: false,
    statusCode,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler
};
