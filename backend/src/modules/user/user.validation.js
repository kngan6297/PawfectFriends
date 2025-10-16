import Joi from 'joi';
import { UserRoleEnum } from './user.types.js';
import {
  objectIdSchema,
  commonSchemas,
  validationHelpers,
  commonValidationSchemas,
} from '../../utils/validation.js';
import { addressOptionalSchema } from '../../utils/addressValidationSchemas.js';

// Base user fields schema - using centralized schemas
export const baseUserFieldsSchema =
  validationHelpers.createBaseUserFieldsSchema();

// Auth-only fields schema - using centralized schemas
export const authFieldsSchema = validationHelpers.createAuthFieldsSchema();

// Profile-only fields schema - fields specific to user profile
export const profileFieldsSchema = Joi.object({
  avatar: Joi.string().uri().allow(null).optional(),
  bio: Joi.string().max(500).optional(),
  location: addressOptionalSchema,
  dob: Joi.date().max('now').optional(),
  preferences: Joi.object({
    petTypes: Joi.array().items(Joi.string()).default([]),
    ageRange: Joi.object({
      min: Joi.number().min(0).default(0),
      max: Joi.number().max(20).default(20),
    }).default({}),
    distance: Joi.number().min(0).max(100).default(50),
  }).optional(),
});

// Combined schemas for different use cases
export const userRegistrationSchema = commonValidationSchemas.userRegistration;

export const userProfileSchema =
  baseUserFieldsSchema.concat(profileFieldsSchema);

export const completeUserSchema = baseUserFieldsSchema
  .concat(authFieldsSchema)
  .concat(profileFieldsSchema);

// User login schema - using centralized schema
export const userLoginSchema = commonValidationSchemas.userLogin;

// Password reset request schema - using centralized schema
export const passwordResetRequestSchema =
  commonValidationSchemas.passwordResetRequest;

// Password reset schema - using centralized schema
export const passwordResetSchema = commonValidationSchemas.passwordReset;

// Admin-specific validation schemas
export const adminUpdateUserSchema = Joi.object({
  name: commonSchemas.name.optional(),
  email: commonSchemas.email.optional(),
  phone: commonSchemas.phone.optional(),
  role: Joi.string()
    .valid(UserRoleEnum.USER, UserRoleEnum.SHELTER, UserRoleEnum.ADMIN)
    .optional(),
  isActive: Joi.boolean().optional(),
  emailVerified: Joi.boolean().optional(),
});

export const adminCreateUserSchema = baseUserFieldsSchema
  .concat(authFieldsSchema)
  .keys({
    isActive: Joi.boolean().default(true),
    emailVerified: Joi.boolean().default(false),
  });

// Admin query validation schema
export const adminQueryValidationSchema = Joi.object({
  role: Joi.string()
    .valid(UserRoleEnum.USER, UserRoleEnum.SHELTER, UserRoleEnum.ADMIN)
    .optional(),
  isActive: Joi.boolean().optional(),
  emailVerified: Joi.boolean().optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string()
    .valid('name', 'email', 'createdAt', 'lastLogin')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

// Auth schemas - using centralized schemas
export const RegisterSchema = Joi.object({
  body: commonValidationSchemas.userRegistration,
});

export const LoginSchema = Joi.object({
  body: commonValidationSchemas.userLogin,
});

export const ResendVerificationSchema = Joi.object({
  body: Joi.object({
    email: commonSchemas.email,
  }),
});

export const ForgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: commonSchemas.email,
  }),
});

export const ResetPasswordSchema = Joi.object({
  body: Joi.object({
    token: commonSchemas.token,
    password: commonSchemas.password,
  }),
});

// Profile schemas
export const CreateProfileSchema = Joi.object({
  body: Joi.object({
    name: commonSchemas.name,
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    preferences: Joi.object({
      petTypes: Joi.array().items(Joi.string()).optional(),
      breeds: Joi.array().items(Joi.string()).optional(),
      ageRange: Joi.object({
        min: Joi.number().min(0).optional(),
        max: Joi.number().min(0).optional(),
      }).optional(),
      gender: Joi.string().valid('male', 'female', 'any').optional(),
      size: Joi.string().valid('small', 'medium', 'large', 'any').optional(),
      distance: Joi.number().min(0).optional(),
    }).optional(),
  }),
});

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    name: commonSchemas.name.optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
  }),
});

export const updatePreferencesSchema = Joi.object({
  body: Joi.object({
    petTypes: Joi.array().items(Joi.string()).optional(),
    breeds: Joi.array().items(Joi.string()).optional(),
    ageRange: Joi.object({
      min: Joi.number().min(0).optional(),
      max: Joi.number().min(0).optional(),
    }).optional(),
    gender: Joi.string().valid('male', 'female', 'any').optional(),
    size: Joi.string().valid('small', 'medium', 'large', 'any').optional(),
    distance: Joi.number().min(0).optional(),
  }),
});

export const updateLocationSchema = Joi.object({
  body: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
});

// Password change schema
export const changePasswordSchema = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required',
    }),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Please confirm your new password',
      }),
  }),
});

// Address update schema
export const updateAddressSchema = Joi.object({
  body: addressOptionalSchema,
});

// Security settings schema
export const updateSecuritySettingsSchema = Joi.object({
  body: Joi.object({
    twoFactorEnabled: Joi.boolean().optional(),
    loginNotifications: Joi.boolean().optional(),
  }),
});

// Toggle favorite pet schema
export const toggleFavoritePetSchema = Joi.object({
  params: Joi.object({
    petId: objectIdSchema.required(),
  }),
});

// Add viewed pet schema
export const addViewedPetSchema = Joi.object({
  params: Joi.object({
    petId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base':
          'Pet ID must be a valid 24-character hexadecimal string',
        'any.required': 'Pet ID is required',
      }),
  }),
});

// Get favorite pets query schema
export const getFavoritePetsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  sortBy: Joi.string()
    .valid('addedAt', 'name', 'type', 'breed')
    .default('addedAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  type: Joi.string().valid('dog', 'cat', 'bird', 'other').optional(),
  status: Joi.string()
    .valid('all', 'adoptable', 'pending', 'adopted')
    .default('adoptable')
    .optional(),
});

// Get viewed pets query schema
export const getViewedPetsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  sortBy: Joi.string()
    .valid('viewedAt', 'name', 'type', 'breed')
    .default('viewedAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  type: Joi.string().valid('dog', 'cat', 'bird', 'other').optional(),
});

// Get shelters query schema
export const getSheltersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  search: Joi.string().max(100).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  sortBy: Joi.string()
    .valid('name', 'distance', 'rating', 'petsCount')
    .default('name')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc').optional(),
  hasAvailablePets: Joi.boolean().optional(),
});

// Get shelter profile schema
export const getShelterProfileSchema = Joi.object({
  params: Joi.object({
    shelterId: objectIdSchema.required(),
  }),
});

// File upload validation (for avatar only)
export const fileUploadSchema = Joi.object({
  file: Joi.object({
    fieldname: Joi.string().valid('avatar').required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string()
      .valid('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp')
      .required(),
    size: Joi.number()
      .max(5 * 1024 * 1024)
      .required(), // 5MB max
  }).optional(),
});

// User validation object for routes
export const userValidation = {
  createProfile: CreateProfileSchema,
  updateProfile: userProfileSchema,
  updatePreferences: updatePreferencesSchema,
  updateLocation: updateLocationSchema,
  changePassword: changePasswordSchema,
  updateAddress: updateAddressSchema,
  updateSecuritySettings: updateSecuritySettingsSchema,
  toggleFavoritePet: toggleFavoritePetSchema,
  addViewedPet: addViewedPetSchema,
  getFavoritePets: {
    query: getFavoritePetsQuerySchema,
  },
  getViewedPets: {
    query: getViewedPetsQuerySchema,
  },
  getShelters: {
    query: getSheltersQuerySchema,
  },
  getShelterProfile: getShelterProfileSchema,
  uploadAvatar: fileUploadSchema,
};
