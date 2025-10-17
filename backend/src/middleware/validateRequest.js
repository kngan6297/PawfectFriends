import Joi from 'joi';
import mongoose from 'mongoose';
import { ApiError } from '../utils/errors.js';

/**
 * Middleware to validate request data against a Joi schema
 * @param {Object} schemas - Object containing validation schemas
 * @param {import('joi').Schema} [schemas.body] - Schema for request body
 * @param {import('joi').Schema} [schemas.query] - Schema for query parameters
 * @param {import('joi').Schema} [schemas.params] - Schema for URL parameters
 */
export const validateRequest = (schemas) => async (req, res, next) => {
  try {
    // Debug logging for specific endpoints
    if (req.url && req.url.includes('/viewed-pets')) {
      console.log('🔍 Validation middleware for viewed-pets:', {
        url: req.url,
        method: req.method,
        params: req.params,
        body: req.body,
        query: req.query,
        schemas: Object.keys(schemas),
      });
    }

    // Debug logging for conversation endpoints
    if (req.url && req.url.includes('/conversations')) {
      console.log('🔍 Validation middleware for conversations:', {
        url: req.url,
        method: req.method,
        params: req.params,
        body: req.body,
        query: req.query,
        schemas: Object.keys(schemas),
        schemaType: typeof schemas,
      });
    }

    // Validate request body if schema is provided
    if (schemas.body) {
      console.log('🔔 Validation middleware - Before validation:', {
        url: req.url,
        method: req.method,
        body: JSON.stringify(req.body, null, 2),
      });

      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: { objects: true, arrays: true },
      });

      console.log('🔔 Validation middleware - After validation:', {
        error: error ? error.details : null,
        value: JSON.stringify(value, null, 2),
      });

      if (error) throw error;
      req.body = value;
    }

    // Validate query parameters if schema is provided
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: { objects: true, arrays: true },
      });
      if (error) throw error;
      req.query = value;
    }

    // Validate URL parameters if schema is provided
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: { objects: true, arrays: true },
      });
      if (error) {
        console.error('❌ Params validation failed:', {
          error: error.details,
          params: req.params,
          schema: schemas.params,
        });
        throw error;
      }
      req.params = value;
    }

    next();
  } catch (error) {
    if (error.isJoi) {
      // Format Joi validation errors
      const formattedErrors = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        type: err.type,
      }));

      console.error('❌ Joi validation error:', {
        errors: formattedErrors,
        url: req.url,
        method: req.method,
      });

      return res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Validation failed',
        userMessage: 'Please check your input and try again.',
        errors: error.details.map((d) => ({
          path: (Array.isArray(d.path) ? d.path.join('.') : d.path) || 'form',
          message: d.message, // "Password must be at least 6 characters long"
        })),
      });
    }

    // Handle other errors
    console.error('❌ Non-Joi validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId parameters
 * @param {string[]} paramNames - Array of parameter names to validate as ObjectIds
 * @returns {Function} Express middleware function
 */
export const validateObjectIds = (paramNames) => {
  return (req, res, next) => {
    try {
      for (const paramName of paramNames) {
        const paramValue = req.params[paramName];

        if (paramValue && !isValidObjectId(paramValue)) {
          throw ApiError.badRequest(`Invalid ${paramName} format`);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate a single ObjectId parameter
 * @param {string} paramName - The parameter name to validate
 * @returns {Function} Express middleware function
 */
export const validateObjectId = (paramName) => {
  return validateObjectIds([paramName]);
};

/**
 * Joi schema for ObjectId validation
 */
export const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation');

/**
 * Helper function to validate ObjectId in controllers
 * @param {string} id - The ID to validate
 * @param {string} entityName - The name of the entity for error messages
 * @throws {ApiError} - Throws ApiError if ID is invalid
 */
export const validateAndThrow = (id, entityName = 'ID') => {
  if (!isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${entityName} format`);
  }
};
