import asyncHandler from 'express-async-handler';

/**
 * Async Handler Middleware
 *
 * This file provides async error handling utilities for Express routes.
 * Uses the express-async-handler package for robust async error handling.
 */

/**
 * Wraps an async function to handle errors and pass them to Express error handling middleware
 * This is a re-export of express-async-handler for consistency
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function
 */
export { asyncHandler };

/**
 * Alternative async handler with custom error handling
 * @param {Function} fn - The async function to wrap
 * @param {Function} errorHandler - Custom error handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandlerWithCustomError = (fn, errorHandler) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error, req, res, next);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Wraps an async function to catch any errors and pass them to Express's error handling middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
