/**
 * Base API Error class for the application
 */
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a Bad Request error (400)
   */
  static badRequest(message = 'Bad request') {
    return new ApiError(400, message);
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message = 'Forbidden access') {
    return new ApiError(403, message);
  }

  /**
   * Create a Not Found error (404)
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /**
   * Create a Validation error (400)
   */
  static validation(message = 'Validation failed') {
    return new ApiError(400, message);
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message = 'Duplicate entry') {
    return new ApiError(409, message);
  }

  /**
   * Create a Rate Limit error (429)
   */
  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  /**
   * Create a Server error (500)
   */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message, false);
  }
}

/**
 * AppError class for backward compatibility with existing middleware
 * This is an alias for ApiError to maintain compatibility
 */
export class AppError extends ApiError {
  constructor(message, statusCode = 500, errors = null, errorCode = null) {
    super(statusCode, message);
    this.name = 'AppError';
    this.errorCode = errorCode;
    if (errors) {
      this.errors = errors;
    }
  }
}

/**
 * ServerError class for server-related errors
 */
export class ServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message, false);
    this.name = 'ServerError';
  }
}

/**
 * ForbiddenError class for forbidden access errors
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden access') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Email Error class for handling email-related errors
 */
export class EmailError extends ApiError {
  constructor(message, statusCode = 500) {
    super(statusCode, message);
    this.name = 'EmailError';
  }

  /**
   * Create a Connection error (503)
   */
  static connection(message = 'Failed to connect to email server') {
    return new EmailError(message, 503);
  }

  /**
   * Create a Send error (500)
   */
  static send(message = 'Failed to send email') {
    return new EmailError(message, 500);
  }

  /**
   * Create a Template error (500)
   */
  static template(message = 'Failed to process email template') {
    return new EmailError(message, 500);
  }
}
