import logger from '../utils/logger.js';

/**
 * Standardized API Response Handler
 * Provides consistent response format across all endpoints
 *
 * All API responses follow this format:
 * {
 *   success: boolean,
 *   data: any (optional),
 *   message: string,
 *   error?: any (for error responses)
 * }
 */

/**
 * Success response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {*} data - Response data
 */
export const sendSuccessResponse = (
  res,
  statusCode = 200,
  message = 'Success',
  data = null
) => {
  const response = {
    success: true,
    message,
    ...(data !== null && data !== undefined && { data }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Error response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} message - Error message
 * @param {*} error - Error details (optional)
 */
export const sendErrorResponse = (
  res,
  statusCode = 500,
  message = 'Internal server error',
  error = null
) => {
  const response = {
    success: false,
    message,
    ...(error && { error }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Standardized async handler with automatic error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Standardized controller wrapper that handles common response patterns
 * @param {Function} controllerFn - Controller function
 * @param {Object} options - Configuration options
 * @returns {Function} Wrapped controller function
 */
export const createController = (controllerFn, options = {}) => {
  const {
    successMessage = 'Operation completed successfully',
    successStatus = 200,
    errorStatus = 400,
  } = options;

  return asyncHandler(async (req, res) => {
    try {
      const result = await controllerFn(req, res);

      // If controller returns data, send success response
      if (result !== undefined) {
        return sendSuccessResponse(res, successStatus, successMessage, result);
      }

      // If no result returned, assume controller handled response
      return;
    } catch (error) {
      logger.error(`${controllerFn.name} error:`, error);
      return sendErrorResponse(res, errorStatus, error.message);
    }
  });
};

/**
 * CRUD controller factory for common operations
 */
export const createCRUDController = {
  // Get all items
  getAll: (serviceFn, options = {}) => {
    return createController(
      async (req) => {
        const filters = req.query;
        return await serviceFn(filters);
      },
      { successMessage: 'Data retrieved successfully', ...options }
    );
  },

  // Get item by ID
  getById: (serviceFn, options = {}) => {
    return createController(
      async (req) => {
        const { id } = req.params;
        return await serviceFn(id);
      },
      { successMessage: 'Item retrieved successfully', ...options }
    );
  },

  // Create item
  create: (serviceFn, options = {}) => {
    return createController(
      async (req) => {
        return await serviceFn(req.body);
      },
      {
        successMessage: 'Item created successfully',
        successStatus: 201,
        ...options,
      }
    );
  },

  // Update item
  update: (serviceFn, options = {}) => {
    return createController(
      async (req) => {
        const { id } = req.params;
        return await serviceFn(id, req.body);
      },
      { successMessage: 'Item updated successfully', ...options }
    );
  },

  // Delete item
  delete: (serviceFn, options = {}) => {
    return createController(
      async (req) => {
        const { id } = req.params;
        await serviceFn(id);
        return null; // No data to return for delete operations
      },
      { successMessage: 'Item deleted successfully', ...options }
    );
  },
};

/**
 * Helper function to standardize controller responses
 * Use this in controllers to ensure consistent response format
 *
 * @param {Object} res - Express response object
 * @param {boolean} success - Whether the operation was successful
 * @param {*} data - Response data (optional)
 * @param {string} message - Response message
 * @param {number} statusCode - HTTP status code
 */
export const standardizeResponse = (
  res,
  success,
  data,
  message,
  statusCode = 200
) => {
  const response = {
    success,
    message,
    ...(data !== null && data !== undefined && { data }),
  };

  return res.status(statusCode).json(response);
};
