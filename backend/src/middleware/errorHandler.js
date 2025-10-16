import mongoose from 'mongoose';
import { ValidationError as YupValidationError } from 'yup';
import logger from '../utils/logger.js';
import { ApiError, AppError } from '../utils/errors.js';

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode || 'OPERATIONAL_ERROR',
      error: err.message,
      userMessage: err.userMessage || err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      errorCode: 'INTERNAL_ERROR',
      error: 'Something went wrong',
      userMessage: 'An error occurred, please try again later.',
    });
  }
};

// Handle specific error types
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Check if this is a duplicate adoption request (user + pet combination)
  if (err.keyPattern && err.keyPattern.user && err.keyPattern.pet) {
    return new AppError(
      'You have already submitted an adoption request for this pet. Please wait for the shelter to review your existing application.',
      400
    );
  }

  // Generic duplicate field error
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleYupValidationError = (err) => {
  const errors = err.inner.reduce((acc, error) => {
    acc[error.path] = error.message;
    return acc;
  }, {});
  return new AppError('Validation Error', 400, errors);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Not found middleware with enhanced error detection
export const notFound = (req, res, next) => {
  // Handle legacy /api/messages endpoint during rollout - don't log as error
  if (req.path === '/api/messages') {
    return res.status(404).json({
      success: false,
      errorCode: 'ENDPOINT_NOT_FOUND',
      message: `Can't find ${req.originalUrl}`,
    });
  }

  console.warn(`🛑 Route not found: ${req.originalUrl}`);

  // Handle common SOAP/XML service discovery requests
  if (
    req.originalUrl.includes('rootDesc.xml') ||
    req.originalUrl.includes('.xml')
  ) {
    console.warn(`🔍 SOAP/XML request detected: ${req.originalUrl}`);
    console.warn(`📡 User-Agent: ${req.get('User-Agent')}`);
    console.warn(`🌐 Referer: ${req.get('Referer')}`);
    console.warn(`🌐 Origin: ${req.get('Origin')}`);

    return res.status(404).json({
      success: false,
      errorCode: 'SOAP_NOT_SUPPORTED',
      message: 'SOAP/XML services are not supported. This is a REST API.',
      userMessage: 'This endpoint is not available.',
      documentation: `${req.protocol}://${req.get('host')}/api-docs`,
      availableEndpoints: [
        '/api/auth',
        '/api/users',
        '/api/pets',
        '/api/adoptions',
        '/api/reviews',
        '/api/chats',
        '/api/recommendations',
        '/api/shelters',
        '/api/admin',
      ],
    });
  }

  // Handle missing /api prefix
  const pathWithoutSlash = req.originalUrl.replace(/^\//, '');
  const commonEndpoints = [
    'chats',
    'pets',
    'users',
    'auth',
    'adoptions',
    'reviews',
    'shelters',
    'admin',
  ];

  if (commonEndpoints.includes(pathWithoutSlash)) {
    console.warn(`🔍 Missing /api prefix detected: ${req.originalUrl}`);
    console.warn(`📡 User-Agent: ${req.get('User-Agent')}`);
    console.warn(`🌐 Referer: ${req.get('Referer')}`);
    console.warn(`🌐 Origin: ${req.get('Origin')}`);

    return res.status(404).json({
      success: false,
      message: `Endpoint not found. Did you mean /api/${pathWithoutSlash}?`,
      userMessage: 'The requested endpoint was not found.',
      correctEndpoint: `/api/${pathWithoutSlash}`,
      documentation: `${req.protocol}://${req.get('host')}/api-docs`,
      availableEndpoints: [
        '/api/auth',
        '/api/users',
        '/api/pets',
        '/api/adoptions',
        '/api/reviews',
        '/api/chats',
        '/api/recommendations',
        '/api/shelters',
        '/api/admin',
      ],
    });
  }

  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      404,
      undefined,
      'ENDPOINT_NOT_FOUND'
    )
  );
};

// Global error handling middleware
export const errorHandler = (err, req, res, _next) => {
  // If the error is already an ApiError or AppError, use its status code
  const statusCode =
    err instanceof ApiError || err instanceof AppError ? err.statusCode : 500;
  err.statusCode = err.statusCode || statusCode;
  err.status = err.status || 'error';

  // Handle Mongoose validation errors
  if (err.name === 'MongooseError' || err.name === 'CastError') {
    console.error('🔴 Mongoose Validation Error:', {
      message: err.message,
      path: req.path,
      method: req.method,
      body: req.body,
    });
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: err.message,
      userMessage: 'Please check your input and try again.',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      errorCode: 'JWT_ERROR',
      message: err.message,
      userMessage: 'Invalid token. Please log in again.',
    });
  }

  // Log errors
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err instanceof mongoose.Error.CastError) error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err instanceof mongoose.Error.ValidationError)
      error = handleValidationErrorDB(err);
    if (err instanceof YupValidationError)
      error = handleYupValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
