import Joi from 'joi';
import { objectIdSchema } from './validation.js';

/**
 * Shared validation schemas for reuse across modules
 * These schemas can be imported and used in any module's validation files
 */

// Address schema - used for user locations, shelter addresses, etc.
export const addressSchema = Joi.object({
  street: Joi.string().trim().optional(),
  ward: Joi.string().trim().optional(),
  district: Joi.string().trim().optional(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  zipCode: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
});

// Unified AddressSchema validation - matches the new AddressSchema structure
export const unifiedAddressSchema = Joi.object({
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
  });

// Contact information schema
export const contactInfoSchema = Joi.object({
  phone: Joi.string().trim().optional(),
  email: Joi.string().email().optional(),
  emergencyContact: Joi.string().trim().optional(),
});

// Social media links schema
export const socialMediaSchema = Joi.object({
  facebook: Joi.string().uri().optional(),
  twitter: Joi.string().uri().optional(),
  instagram: Joi.string().uri().optional(),
  linkedin: Joi.string().uri().optional(),
  youtube: Joi.string().uri().optional(),
});

// Operating hours schema for businesses/shelters
export const operatingHoursSchema = Joi.object({
  monday: Joi.object({
    open: Joi.string().optional(),
    close: Joi.string().optional(),
  }).optional(),
  tuesday: Joi.object({
    open: Joi.string().optional(),
    close: Joi.string().optional(),
  }).optional(),
  wednesday: Joi.object({
    open: Joi.string().optional(),
    close: Joi.string().optional(),
  }).optional(),
  thursday: Joi.object({
    open: Joi.string().optional(),
    close: Joi.string().optional(),
  }).optional(),
  friday: Joi.object({
    open: Joi.string().optional(),
    close: Joi.string().optional(),
  }).optional(),
  saturday: Joi.object({
    open: Joi.string().optional(),
    close: Joi.string().optional(),
  }).optional(),
  sunday: Joi.object({
    open: Joi.string().optional(),
    close: Joi.string().optional(),
  }).optional(),
});

// Capacity schema for shelters/organizations
export const capacitySchema = Joi.object({
  dogs: Joi.number().min(0).optional(),
  cats: Joi.number().min(0).optional(),
  birds: Joi.number().min(0).optional(),
  other: Joi.number().min(0).optional(),
  total: Joi.number().min(0).optional(),
});

// Services schema for shelters/businesses
export const servicesSchema = Joi.array().items(
  Joi.string().valid(
    'adoption',
    'fostering',
    'medical_care',
    'behavioral_training',
    'grooming',
    'boarding',
    'emergency_rescue',
    'spay_neuter',
    'vaccination',
    'microchipping',
    'pet_supplies',
    'education',
    'volunteer_programs',
    'donation_center'
  )
);

// Specializations schema for shelters
export const specializationsSchema = Joi.array().items(
  Joi.string().valid(
    'senior_pets',
    'special_needs',
    'large_breeds',
    'small_breeds',
    'working_dogs',
    'therapy_animals',
    'exotic_pets',
    'farm_animals',
    'wildlife_rehabilitation'
  )
);

// Location coordinates schema (for geolocation)
export const coordinatesSchema = Joi.object({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array().items(Joi.number()).length(2).optional(),
});

// Full location schema with address and coordinates
export const fullLocationSchema = Joi.object({
  address: addressSchema.optional(),
  coordinates: coordinatesSchema.optional(),
});

// Rating schema for reviews/ratings
export const ratingSchema = Joi.object({
  average: Joi.number().min(0).max(5).default(0),
  count: Joi.number().min(0).default(0),
});

// Pagination query schema
export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc').optional(),
});

// Search query schema
export const searchQuerySchema = Joi.object({
  query: Joi.string().max(200).optional(),
  filters: Joi.object().optional(),
  ...paginationQuerySchema.describe().keys,
});

// Date range schema for analytics/reports
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  period: Joi.string().valid('7d', '30d', '90d', '1y', 'all').optional(),
});

// File upload schema
export const fileUploadSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  encoding: Joi.string().required(),
  mimetype: Joi.string().required(),
  size: Joi.number()
    .max(10 * 1024 * 1024)
    .required(), // 10MB max
});

// Image URL validation schema
export const imageUrlSchema = Joi.string()
  .uri()
  .custom((value, helpers) => {
    // Special case: Allow Petfinder URLs (cloudfront.net/photos/pets/ or cloudfront.net/animal/) without file extensions
    if (
      value.includes('cloudfront.net/photos/pets/') ||
      value.includes('cloudfront.net/animal/')
    ) {
      return value;
    }

    // For other URLs, check for image file extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (!imageExtensions.test(value)) {
      return helpers.error('any.invalid');
    }

    return value;
  }, 'image-url-validation')
  .messages({
    'any.invalid':
      'URL must be a valid image URL with proper format and image extension',
  });

// Phone number schema with international format
export const phoneSchema = Joi.string()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .messages({
    'string.pattern.base':
      'Phone number must be in international format (e.g., +1234567890)',
  });

// Email schema with custom messages
export const emailSchema = Joi.string().email().messages({
  'string.email': 'Please provide a valid email address',
  'string.empty': 'Email is required',
});

// Password schema with strength requirements
export const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

// Name schema with proper validation
export const nameSchema = Joi.string()
  .min(2)
  .max(100)
  .pattern(/^[a-zA-Z\s\-'\.]+$/)
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'string.pattern.base':
      'Name can only contain letters, spaces, hyphens, apostrophes, and periods',
  });

// URL schema with validation
export const urlSchema = Joi.string().uri().messages({
  'string.uri': 'Please provide a valid URL',
});

// Re-export objectIdSchema from existing validation.js
export { objectIdSchema };

// Status schema for common status fields
export const statusSchema = Joi.string().valid(
  'active',
  'inactive',
  'pending',
  'approved',
  'rejected',
  'suspended',
  'banned'
);

// Export all schemas for easy importing
export const sharedSchemas = {
  addressSchema,
  unifiedAddressSchema,
  contactInfoSchema,
  socialMediaSchema,
  operatingHoursSchema,
  capacitySchema,
  servicesSchema,
  specializationsSchema,
  coordinatesSchema,
  fullLocationSchema,
  ratingSchema,
  paginationQuerySchema,
  searchQuerySchema,
  dateRangeSchema,
  fileUploadSchema,
  imageUrlSchema,
  phoneSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  urlSchema,
  objectIdSchema,
  statusSchema,
};

export default sharedSchemas;
