import Joi from 'joi';
import {
  baseUserFieldsSchema,
  authFieldsSchema,
} from '../user/user.validation.js';
import { UserRoleEnum } from '../user/user.types.js';
import { commonSchemas, objectIdSchema } from '../../utils/validation.js';

// Admin-specific validation schema
export const AdminBaseSchema = baseUserFieldsSchema
  .concat(authFieldsSchema)
  .keys({
    lastSystemAccess: Joi.date().optional(),
    accessLogs: Joi.array().items(
      Joi.object({
        action: Joi.string().required(),
        timestamp: Joi.date().required(),
        details: Joi.string().required(),
      })
    ),
  });

// Admin registration schema
export const adminRegistrationSchema = AdminBaseSchema.keys({
  password: commonSchemas.password,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

// Admin update schema (without password)
export const AdminUpdateSchema = Joi.object({
  name: commonSchemas.name.optional(),
  email: commonSchemas.email.optional(),
  phone: commonSchemas.phone.optional(),
  lastSystemAccess: Joi.date().optional(),
  accessLogs: Joi.array()
    .items(
      Joi.object({
        action: Joi.string().required(),
        timestamp: Joi.date().required(),
        details: Joi.string().required(),
      })
    )
    .optional(),
  emailVerified: Joi.boolean().optional(),
});

// Admin permissions update schema (deprecated - admin role provides full access)
export const adminPermissionsUpdateSchema = Joi.object({
  // Admin role provides full access, no granular permissions needed
});

// Admin access log schema
export const adminAccessLogSchema = Joi.object({
  action: Joi.string().required(),
  timestamp: Joi.date().required(),
  details: Joi.string().required(),
});

// Admin query validation schema
export const adminQueryValidationSchema = Joi.object({
  role: Joi.string()
    .valid(UserRoleEnum.USER, UserRoleEnum.SHELTER, UserRoleEnum.ADMIN)
    .optional(),
  isActive: Joi.boolean().optional(),
  isEmailVerified: Joi.boolean().optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string()
    .valid('name', 'email', 'createdAt', 'lastLogin')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

// Shelter update schema
export const shelterUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: commonSchemas.email.optional(),
  phone: commonSchemas.phone.optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  description: Joi.string().max(1000).optional(),
  website: Joi.string().uri().optional(),
  isApproved: Joi.boolean().optional(),
  isBanned: Joi.boolean().optional(),
  status: Joi.string()
    .valid('pending', 'active', 'banned', 'inactive')
    .optional(),
  banReason: Joi.string().optional(),
});

// Pet update schema
export const petUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional(),
  type: Joi.string()
    .valid('dog', 'cat', 'bird', 'fish', 'reptile', 'other')
    .optional(),
  breed: Joi.string().optional(),
  age: Joi.number().min(0).max(30).optional(),
  gender: Joi.string().valid('male', 'female', 'unknown').optional(),
  size: Joi.string()
    .valid('small', 'medium', 'large', 'extra-large')
    .optional(),
  species: Joi.string().optional(),
  coat: Joi.string()
    .valid('short', 'medium', 'long', 'wire', 'curly', 'smooth', 'rough')
    .optional(),
  primaryColor: Joi.string().optional(),
  secondaryColor: Joi.string().optional(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string()
    .valid('adoptable', 'pending', 'adopted', 'unavailable', 'rejected')
    .optional(),
  isApproved: Joi.boolean().optional(),
  rejectionReason: Joi.string().optional(),
  healthStatus: Joi.string().optional(),
  behavior: Joi.string().optional(),
  specialNeeds: Joi.string().optional(),
});

// Review update schema
export const reviewUpdateSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().max(1000).optional(),
  status: Joi.string().valid('active', 'hidden', 'flagged').optional(),
  isApproved: Joi.boolean().optional(),
});

// Adoption update schema
export const adoptionUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'completed', 'cancelled')
    .optional(),
  adminNotes: Joi.string().max(1000).optional(),
  approvalDate: Joi.date().optional(),
  rejectionReason: Joi.string().optional(),
});

// User lock schema
export const userLockSchema = Joi.object({
  reason: Joi.string().required().max(500),
});

// Password reset schema
export const passwordResetSchema = Joi.object({
  newPassword: commonSchemas.password,
});

// Shelter ban schema
export const shelterBanSchema = Joi.object({
  reason: Joi.string().required().max(500),
});

// Pet rejection schema
export const petRejectionSchema = Joi.object({
  reason: Joi.string().required().max(500),
});

// Review moderation schema
export const reviewModerationSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject', 'flag').required(),
  reason: Joi.string().max(500).optional(),
});

// System settings schema
export const systemSettingsSchema = Joi.object({
  maintenanceMode: Joi.boolean().optional(),
  registrationEnabled: Joi.boolean().optional(),
  emailVerificationRequired: Joi.boolean().optional(),
  maxPetsPerShelter: Joi.number().min(1).optional(),
  maxAdoptionRequestsPerUser: Joi.number().min(1).optional(),
  reviewModerationRequired: Joi.boolean().optional(),
  autoApproveAdoptions: Joi.boolean().optional(),
  notificationSettings: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional(),
  }).optional(),
});

// Analytics query schema
export const analyticsQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year').optional(),
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        'adoptions',
        'registrations',
        'pets_added',
        'reviews',
        'revenue'
      )
    )
    .optional(),
  filters: Joi.object({
    shelterId: Joi.string().optional(),
    petType: Joi.string().optional(),
    status: Joi.string().optional(),
  }).optional(),
});

// Reports query schema
export const reportsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('7d', '30d', '90d', '1y')
    .default('30d')
    .optional(),
});

// Content validation schemas
export const createContentSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().max(200).required().messages({
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required',
    }),
    content: Joi.string().max(10000).required().messages({
      'string.max': 'Content cannot exceed 10,000 characters',
      'any.required': 'Content is required',
    }),
    type: Joi.string()
      .valid('faq', 'policy', 'manual', 'guide', 'announcement')
      .required()
      .messages({
        'any.only':
          'Type must be one of: faq, policy, manual, guide, announcement',
        'any.required': 'Type is required',
      }),
    category: Joi.string()
      .valid(
        'general',
        'pets',
        'adoptions',
        'technical',
        'billing',
        'staff',
        'legal',
        'safety',
        'procedures',
        'training',
        'maintenance',
        'other'
      )
      .required()
      .messages({
        'any.only': 'Invalid category',
        'any.required': 'Category is required',
      }),
    tags: Joi.array().items(Joi.string().max(50).trim()).optional(),
    priority: Joi.number().min(1).max(10).default(5).messages({
      'number.min': 'Priority must be at least 1',
      'number.max': 'Priority cannot exceed 10',
    }),
    isPublic: Joi.boolean().default(true),
    targetAudience: Joi.array()
      .items(Joi.string().valid('users', 'shelters', 'admins', 'all'))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one target audience must be specified',
        'any.required': 'Target audience is required',
      }),
    featured: Joi.boolean().default(false),
    expiresAt: Joi.date().greater('now').optional().messages({
      'date.greater': 'Expiration date must be in the future',
    }),
    seoData: Joi.object({
      metaTitle: Joi.string().max(60).optional().messages({
        'string.max': 'Meta title cannot exceed 60 characters',
      }),
      metaDescription: Joi.string().max(160).optional().messages({
        'string.max': 'Meta description cannot exceed 160 characters',
      }),
      keywords: Joi.array().items(Joi.string()).optional(),
      slug: Joi.string()
        .pattern(/^[a-z0-9-]+$/)
        .optional()
        .messages({
          'string.pattern.base':
            'Slug can only contain lowercase letters, numbers, and hyphens',
        }),
    }).optional(),
  }),
});

export const updateContentSchema = Joi.object({
  params: Joi.object({
    contentId: objectIdSchema.required(),
  }),
  body: Joi.object({
    title: Joi.string().max(200).optional().messages({
      'string.max': 'Title cannot exceed 200 characters',
    }),
    content: Joi.string().max(10000).optional().messages({
      'string.max': 'Content cannot exceed 10,000 characters',
    }),
    type: Joi.string()
      .valid('faq', 'policy', 'manual', 'guide', 'announcement')
      .optional()
      .messages({
        'any.only':
          'Type must be one of: faq, policy, manual, guide, announcement',
      }),
    category: Joi.string()
      .valid(
        'general',
        'pets',
        'adoptions',
        'technical',
        'billing',
        'staff',
        'legal',
        'safety',
        'procedures',
        'training',
        'maintenance',
        'other'
      )
      .optional()
      .messages({
        'any.only': 'Invalid category',
      }),
    tags: Joi.array().items(Joi.string().max(50).trim()).optional(),
    priority: Joi.number().min(1).max(10).optional().messages({
      'number.min': 'Priority must be at least 1',
      'number.max': 'Priority cannot exceed 10',
    }),
    isPublic: Joi.boolean().optional(),
    targetAudience: Joi.array()
      .items(Joi.string().valid('users', 'shelters', 'admins', 'all'))
      .optional(),
    featured: Joi.boolean().optional(),
    expiresAt: Joi.date().greater('now').optional().messages({
      'date.greater': 'Expiration date must be in the future',
    }),
    seoData: Joi.object({
      metaTitle: Joi.string().max(60).optional().messages({
        'string.max': 'Meta title cannot exceed 60 characters',
      }),
      metaDescription: Joi.string().max(160).optional().messages({
        'string.max': 'Meta description cannot exceed 160 characters',
      }),
      keywords: Joi.array().items(Joi.string()).optional(),
      slug: Joi.string()
        .pattern(/^[a-z0-9-]+$/)
        .optional()
        .messages({
          'string.pattern.base':
            'Slug can only contain lowercase letters, numbers, and hyphens',
        }),
    }).optional(),
  }),
});

export const contentQuerySchema = Joi.object({
  query: Joi.object({
    type: Joi.string()
      .valid('faq', 'policy', 'manual', 'guide', 'announcement')
      .optional(),
    category: Joi.string()
      .valid(
        'general',
        'pets',
        'adoptions',
        'technical',
        'billing',
        'staff',
        'legal',
        'safety',
        'procedures',
        'training',
        'maintenance',
        'other'
      )
      .optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    isPublic: Joi.boolean().optional(),
    targetAudience: Joi.string()
      .valid('users', 'shelters', 'admins', 'all')
      .optional(),
    featured: Joi.boolean().optional(),
    author: objectIdSchema.optional(),
    limit: Joi.number().min(1).max(100).optional(),
    page: Joi.number().min(1).optional(),
    sortBy: Joi.string()
      .valid('title', 'createdAt', 'updatedAt', 'priority', 'viewCount')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
});

export const bulkDeleteContentSchema = Joi.object({
  body: Joi.object({
    contentIds: Joi.array().items(objectIdSchema).min(1).required().messages({
      'array.min': 'At least one content ID is required',
      'any.required': 'Content IDs array is required',
    }),
  }),
});
