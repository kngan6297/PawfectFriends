import Joi from 'joi';
import mongoose from 'mongoose';
import { PASSWORD_REGEX } from '../constants/regex.js';

// Helper function to validate MongoDB ObjectId
export const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid', { message: 'Invalid ObjectId' });
  }
  return value;
});

// Common field schemas
export const commonSchemas = {
  // Name validation
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
  }),

  // Email validation
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
    }),

  // Phone validation
  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number',
    }),

  // Password validation
  password: Joi.string().min(8).pattern(PASSWORD_REGEX).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  }),

  // Confirm password validation
  confirmPassword: Joi.string().required(),

  // Token validation
  token: Joi.string().min(1).required().messages({
    'string.min': 'Token is required',
    'any.required': 'Token is required',
  }),

  // Pagination schemas
  pagination: {
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  },

  // Sorting schemas
  sorting: {
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  },

  // Search schema
  search: Joi.string().optional(),
};

// Common validation functions
export const validationHelpers = {
  // Password confirmation validation
  validatePasswordConfirmation: (obj, helpers) => {
    if (obj.password !== obj.confirmPassword) {
      return helpers.error('any.invalid', {
        message: "Passwords don't match",
      });
    }
    return obj;
  },

  // Create base user fields schema
  createBaseUserFieldsSchema: () =>
    Joi.object({
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
    }),

  // Create auth fields schema
  createAuthFieldsSchema: () =>
    Joi.object({
      password: commonSchemas.password,
      confirmPassword: commonSchemas.confirmPassword,
    }).custom(validationHelpers.validatePasswordConfirmation),

  // Create profile fields schema
  createProfileFieldsSchema: () =>
    Joi.object({
      avatar: Joi.string().uri().allow(null).optional(),
      bio: Joi.string().max(500).optional(),
      dob: Joi.date().max('now').optional(),
      preferences: Joi.object({
        petTypes: Joi.array().items(Joi.string()).default([]),
        ageRange: Joi.object({
          min: Joi.number().min(0).default(0),
          max: Joi.number().max(20).default(20),
        }).default({}),
        distance: Joi.number().min(0).max(100).default(50),
      }).optional(),
    }),

  // Create pagination schema
  createPaginationSchema: () =>
    Joi.object({
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
    }),

  // Create sorting schema
  createSortingSchema: (allowedFields = []) =>
    Joi.object({
      sortBy: Joi.string()
        .valid(...allowedFields)
        .optional(),
      sortOrder: commonSchemas.sorting.sortOrder,
    }),

  // Create search schema
  createSearchSchema: () =>
    Joi.object({
      search: commonSchemas.search,
    }),
};

// Common validation schemas for reuse
export const commonValidationSchemas = {
  // User registration
  userRegistration: validationHelpers
    .createBaseUserFieldsSchema()
    .concat(validationHelpers.createAuthFieldsSchema())
    .keys({
      role: Joi.string().valid('user', 'shelter').required().messages({
        'any.only': 'Role must be either "user" or "shelter"',
        'any.required': 'Role is required',
      }),
      location: Joi.when('role', {
        is: 'shelter',
        then: Joi.object({
          version: Joi.string().valid('v1', 'v2').default('v1'),
          province: Joi.object({
            code: Joi.number().required(),
            name: Joi.string().required(),
            codename: Joi.string().allow(''),
            division_type: Joi.string().allow(''),
            phone_code: Joi.number().optional(),
          }).required(),
          district: Joi.object({
            code: Joi.number().required(),
            name: Joi.string().required(),
            codename: Joi.string().allow(''),
            division_type: Joi.string().allow(''),
            province_code: Joi.number().required(),
          }).required(),
          ward: Joi.object({
            code: Joi.number().required(),
            name: Joi.string().required(),
            codename: Joi.string().allow(''),
            division_type: Joi.string().allow(''),
            district_code: Joi.number().required(),
          }).required(),
          details: Joi.object({
            street: Joi.string().allow(''),
            note: Joi.string().allow(''),
          }).default({}),
          postalCode: Joi.string().allow(''),
          country: Joi.string().valid('VN').default('VN'),
          formatted: Joi.string().allow(''),
        })
          .required()
          .custom((v, helpers) => {
            if (v.district.province_code !== v.province.code) {
              return helpers.error('any.invalid', {
                message: 'district.province_code mismatch',
              });
            }
            if (v.ward.district_code !== v.district.code) {
              return helpers.error('any.invalid', {
                message: 'ward.district_code mismatch',
              });
            }
            return v;
          }),
        otherwise: Joi.object().optional(),
      }),
      description: Joi.string().max(1000).optional(), // For shelter description
    }),

  // User login
  userLogin: Joi.object({
    emailOrPhone: Joi.string().trim().min(3).required().messages({
      'string.empty': 'Email or phone number is required',
      'string.min': 'Email or phone number must be at least 3 characters long',
      'any.required': 'Email or phone number is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  }),

  // Password reset request
  passwordResetRequest: Joi.object({
    email: commonSchemas.email,
  }),

  // Password reset
  passwordReset: Joi.object({
    token: commonSchemas.token,
    password: commonSchemas.password,
    confirmPassword: commonSchemas.confirmPassword,
  }).custom(validationHelpers.validatePasswordConfirmation),

  // Email verification
  emailVerification: Joi.object({
    token: commonSchemas.token,
  }),

  // ObjectId parameter validation
  objectIdParam: Joi.object({
    params: Joi.object({
      id: objectIdSchema.required(),
    }),
  }),

  // Basic pagination
  pagination: validationHelpers.createPaginationSchema(),

  // Basic search
  search: validationHelpers.createSearchSchema(),
};

/**
 * Validates if a URL is a valid image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid image URL, false otherwise
 *
 * @example
 * isValidImageUrl('https://example.com/image.jpg') // true
 * isValidImageUrl('https://example.com/image.png') // true
 * isValidImageUrl('https://example.com/image.gif') // true
 * isValidImageUrl('https://dl5zpyw5k3jeb.cloudfront.net/photos/pets/77353474/1/?bust=1752836410') // true (Petfinder URL)
 * isValidImageUrl('https://dbw3zep4prcju.cloudfront.net/animal/d9299e3c-3bf7-4f3c-b2f3-51beedd20f71/image/340ed9bc-119a-475e-8e30-d8cfec05c595.jpg?versionId=2837iqaXT3OF_K8YmUCSeFl1osMFB702&bust=1754652963') // true (Petfinder URL)
 * isValidImageUrl('https://example.com/document.pdf') // false (not image)
 * isValidImageUrl('ftp://example.com/image.jpg') // false (wrong protocol)
 * isValidImageUrl('not-a-url') // false
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Basic URL format validation
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return false;
    }

    // Special case: Allow Petfinder URLs (cloudfront.net/photos/pets/ or cloudfront.net/animal/) without file extensions
    if (
      url.includes('cloudfront.net/photos/pets/') ||
      url.includes('cloudfront.net/animal/')
    ) {
      // Check URL length (reasonable limit)
      if (url.length > 2048) {
        return false;
      }

      // Additional validation: check if it's a valid URL structure
      const urlObj = new URL(url);
      if (!urlObj.protocol || !urlObj.hostname) {
        return false;
      }

      return true;
    }

    // Special case: Allow picsum.photos URLs without file extensions (for testing/development)
    if (url.includes('picsum.photos')) {
      // Check URL length (reasonable limit)
      if (url.length > 2048) {
        return false;
      }

      // Additional validation: check if it's a valid URL structure
      const urlObj = new URL(url);
      if (!urlObj.protocol || !urlObj.hostname) {
        return false;
      }

      return true;
    }

    // Check for common image file extensions for non-Petfinder URLs
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i;
    if (!imageExtensions.test(url)) {
      return false;
    }

    // Check URL length (reasonable limit)
    if (url.length > 2048) {
      return false;
    }

    // Additional validation: check if it's a valid URL structure
    const urlObj = new URL(url);
    if (!urlObj.protocol || !urlObj.hostname) {
      return false;
    }

    return true;
  } catch (error) {
    // If URL constructor throws an error, it's not a valid URL
    return false;
  }
}

/**
 * Joi custom validator for image URLs
 * @param {string} value - The URL value to validate
 * @param {Object} helpers - Joi helpers object
 * @returns {string|Object} - The value if valid, or error object if invalid
 */
export function validateImageUrl(value, helpers) {
  if (!value) {
    return helpers.error('any.required');
  }

  if (!isValidImageUrl(value)) {
    return helpers.error('any.invalid');
  }

  return value;
}

/**
 * Validates if a URL is a valid document URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid document URL, false otherwise
 *
 * @example
 * isValidDocumentUrl('https://example.com/image.jpg') // true
 * isValidDocumentUrl('https://example.com/document.pdf') // true
 * isValidDocumentUrl('https://example.com/spreadsheet.xlsx') // true
 * isValidDocumentUrl('https://example.com/script.js') // false (not supported)
 * isValidDocumentUrl('ftp://example.com/document.pdf') // false (wrong protocol)
 * isValidDocumentUrl('not-a-url') // false
 */
export function isValidDocumentUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Basic URL format validation
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return false;
    }

    // Check for common document and image file extensions
    const documentExtensions =
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/i;
    if (!documentExtensions.test(url)) {
      return false;
    }

    // Check URL length (reasonable limit)
    if (url.length > 2048) {
      return false;
    }

    // Additional validation: check if it's a valid URL structure
    const urlObj = new URL(url);
    if (!urlObj.protocol || !urlObj.hostname) {
      return false;
    }

    return true;
  } catch (error) {
    // If URL constructor throws an error, it's not a valid URL
    return false;
  }
}

/**
 * Joi custom validator for document URLs
 * @param {string} value - The URL value to validate
 * @param {Object} helpers - Joi helpers object
 * @returns {string|Object} - The value if valid, or error object if invalid
 */
export function validateDocumentUrl(value, helpers) {
  if (!value) {
    return helpers.error('any.required');
  }

  if (!isValidDocumentUrl(value)) {
    return helpers.error('any.invalid');
  }

  return value;
}

export default {
  objectIdSchema,
  commonSchemas,
  validationHelpers,
  commonValidationSchemas,
};
