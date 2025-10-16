import {
  generateUniqueSlug,
  validateSlug,
  sanitizeSlug,
} from '../utils/slugGenerator.js';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Middleware for automatic slug generation
 * Automatically generates unique slugs for pets when name is provided
 */
export const autoGenerateSlug = (options = {}) => {
  const {
    fieldName = 'name',
    slugField = 'slug',
    modelName = 'Pet',
    strategy = 'counter',
    forceRegenerate = false,
  } = options;

  return async (req, res, next) => {
    try {
      const name = req.body[fieldName];

      // Only generate slug if name is provided and slug is not already set
      if (name && (!req.body[slugField] || forceRegenerate)) {
        const slugOptions = {
          excludeId: req.params.id || req.body._id, // For updates
          modelName,
          strategy,
          objectId: req.body._id,
        };

        const uniqueSlug = await generateUniqueSlug(name, slugOptions);
        req.body[slugField] = uniqueSlug;

        logger.info(`Generated slug "${uniqueSlug}" for "${name}"`);
      }

      next();
    } catch (error) {
      logger.error('Error in autoGenerateSlug middleware:', error);
      next(new ApiError('Failed to generate slug', 500));
    }
  };
};

/**
 * Middleware to validate slug format
 */
export const validateSlugFormat = (slugField = 'slug') => {
  return (req, res, next) => {
    const slug = req.body[slugField] || req.params[slugField];

    if (slug && !validateSlug(slug)) {
      return next(
        new ApiError(
          'Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens.',
          400
        )
      );
    }

    next();
  };
};

/**
 * Middleware to sanitize slug input
 */
export const sanitizeSlugInput = (slugField = 'slug') => {
  return (req, res, next) => {
    if (req.body[slugField]) {
      req.body[slugField] = sanitizeSlug(req.body[slugField]);
    }
    next();
  };
};

/**
 * Middleware to check slug uniqueness
 */
export const checkSlugUniqueness = (options = {}) => {
  const {
    slugField = 'slug',
    modelName = 'Pet',
    excludeParam = 'id',
  } = options;

  return async (req, res, next) => {
    try {
      const slug = req.body[slugField];

      if (!slug) {
        return next(); // No slug to check
      }

      // Import the model dynamically
      let Model;
      switch (modelName.toLowerCase()) {
        case 'pet':
          Model = (await import('../modules/pet/pet.model.js')).Pet;
          break;
        default:
          throw new Error(`Unknown model: ${modelName}`);
      }

      const excludeId = req.params[excludeParam] || req.body._id;
      const query = { [slugField]: slug };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existing = await Model.findOne(query);

      if (existing) {
        return next(new ApiError(`Slug "${slug}" already exists`, 409));
      }

      next();
    } catch (error) {
      logger.error('Error checking slug uniqueness:', error);
      next(new ApiError('Failed to check slug uniqueness', 500));
    }
  };
};

/**
 * Middleware to handle slug conflicts gracefully
 * Automatically generates a new slug if conflict is detected
 */
export const handleSlugConflict = (options = {}) => {
  const {
    fieldName = 'name',
    slugField = 'slug',
    modelName = 'Pet',
    strategy = 'counter',
  } = options;

  return async (req, res, next) => {
    try {
      const name = req.body[fieldName];
      const currentSlug = req.body[slugField];

      if (!name || !currentSlug) {
        return next();
      }

      // Import the model dynamically
      let Model;
      switch (modelName.toLowerCase()) {
        case 'pet':
          Model = (await import('../modules/pet/pet.model.js')).Pet;
          break;
        default:
          throw new Error(`Unknown model: ${modelName}`);
      }

      const excludeId = req.params.id || req.body._id;
      const query = { [slugField]: currentSlug };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existing = await Model.findOne(query);

      if (existing) {
        // Generate a new unique slug
        const slugOptions = {
          excludeId,
          modelName,
          strategy,
          objectId: req.body._id,
        };

        const newSlug = await generateUniqueSlug(name, slugOptions);
        req.body[slugField] = newSlug;

        logger.info(`Resolved slug conflict: "${currentSlug}" -> "${newSlug}"`);
      }

      next();
    } catch (error) {
      logger.error('Error handling slug conflict:', error);
      next(new ApiError('Failed to handle slug conflict', 500));
    }
  };
};

/**
 * Comprehensive slug middleware that combines all slug-related operations
 */
export const comprehensiveSlugMiddleware = (options = {}) => {
  const {
    fieldName = 'name',
    slugField = 'slug',
    modelName = 'Pet',
    strategy = 'counter',
    validate = true,
    sanitize = true,
    checkUniqueness = true,
    handleConflict = true,
  } = options;

  return [
    // Sanitize slug input
    sanitize && sanitizeSlugInput(slugField),

    // Validate slug format
    validate && validateSlugFormat(slugField),

    // Auto-generate slug if needed
    autoGenerateSlug({
      fieldName,
      slugField,
      modelName,
      strategy,
    }),

    // Check uniqueness
    checkUniqueness &&
      checkSlugUniqueness({
        slugField,
        modelName,
      }),

    // Handle conflicts
    handleConflict &&
      handleSlugConflict({
        fieldName,
        slugField,
        modelName,
        strategy,
      }),
  ].filter(Boolean); // Remove falsy values
};

/**
 * Middleware to ensure slug is always present for slug-based routes
 */
export const ensureSlug = (slugField = 'slug') => {
  return (req, res, next) => {
    const slug = req.params[slugField] || req.body[slugField];

    if (!slug) {
      return next(new ApiError('Slug is required', 400));
    }

    if (!validateSlug(slug)) {
      return next(new ApiError('Invalid slug format', 400));
    }

    next();
  };
};

/**
 * Middleware to normalize slug in URL parameters
 */
export const normalizeSlugParam = (paramName = 'slug') => {
  return (req, res, next) => {
    if (req.params[paramName]) {
      req.params[paramName] = sanitizeSlug(req.params[paramName]);
    }
    next();
  };
};
