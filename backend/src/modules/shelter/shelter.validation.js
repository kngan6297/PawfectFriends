import Joi from 'joi';
import {
  baseUserFieldsSchema,
  authFieldsSchema,
} from '../user/user.validation.js';
import { objectIdSchema } from '../../utils/sharedValidationSchemas.js';
import {
  addressSchema,
  socialMediaSchema,
  operatingHoursSchema,
  nameSchema,
  urlSchema,
  phoneSchema,
} from '../../utils/sharedValidationSchemas.js';
import { addressRequiredSchema } from '../../utils/addressValidationSchemas.js';

// Shelter-specific fields schema
export const shelterFieldsSchema = Joi.object({
  name: nameSchema.required(),
  location: addressRequiredSchema,
  bio: Joi.string().max(1000).optional(),
  website: urlSchema.optional(),
  operatingHours: operatingHoursSchema.optional(),
}).unknown(false);

// Shelter registration schema
export const shelterRegistrationSchema = baseUserFieldsSchema
  .concat(authFieldsSchema)
  .concat(shelterFieldsSchema);

// Update shelter profile schema
export const updateShelterProfileSchema = Joi.object({
  body: Joi.object({
    name: nameSchema.optional(),
    bio: Joi.string().max(1000).optional(),
    website: urlSchema.optional(),
    location: addressRequiredSchema.optional(),
    operatingHours: operatingHoursSchema.optional(),
    phone: phoneSchema.optional(),
    adoptionProcess: Joi.string().max(1000).optional(),
    requirements: Joi.string().max(1000).optional(),
    socialMedia: socialMediaSchema.optional(),
  }).min(1), // At least one field must be provided
});

// Update shelter profile with ID schema (for admin routes)
export const updateShelterProfileWithIdSchema = Joi.object({
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
  body: Joi.object({
    name: nameSchema.optional(),
    bio: Joi.string().max(1000).optional(),
    website: urlSchema.optional(),
    location: addressRequiredSchema.optional(),
    operatingHours: operatingHoursSchema.optional(),
    phone: phoneSchema.optional(),
    adoptionProcess: Joi.string().max(1000).optional(),
    requirements: Joi.string().max(1000).optional(),
    socialMedia: socialMediaSchema.optional(),
  }).min(1), // At least one field must be provided
});

// Get shelters query schema
export const getSheltersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  search: Joi.string().max(100).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  hasAvailablePets: Joi.boolean().optional(),
  petType: Joi.string().valid('dog', 'cat', 'bird', 'other').optional(),
  services: Joi.array().items(Joi.string()).optional(),
  sortBy: Joi.string()
    .valid('name', 'distance', 'rating', 'petsCount', 'createdAt')
    .default('name')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc').optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  maxDistance: Joi.number().min(0).max(1000).optional(),
});

// Get shelter by ID schema
export const getShelterByIdSchema = Joi.object({
  params: Joi.object({
    shelterId: objectIdSchema.required(),
  }),
});

// Increment shelter views schema
export const incrementShelterViewsSchema = Joi.object({
  params: Joi.object({
    shelterId: objectIdSchema.required(),
  }),
});

// Get shelter pets query schema
export const getShelterPetsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
  type: Joi.string().valid('dog', 'cat', 'bird', 'other').optional(),
  status: Joi.string()
    .valid(
      'adoptable',
      'pending',
      'adopted',
      'hidden',
      'waiting',
      'in_treatment',
      'fostered'
    )
    .optional(),
  age: Joi.string().valid('baby', 'young', 'adult', 'senior').optional(),
  size: Joi.string().valid('small', 'medium', 'large').optional(),
  gender: Joi.string().valid('male', 'female', 'unknown').optional(),
  sortBy: Joi.string()
    .valid('name', 'age', 'createdAt', 'views')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  search: Joi.string().max(100).optional(),
});

// Get shelter stats query schema
export const getShelterStatsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('day', 'week', 'month', 'year', 'all')
    .default('month')
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

// Get shelter adoption requests query schema
export const getShelterAdoptionRequestsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'completed', 'cancelled')
    .optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'status')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

// Shelter validation object for routes
export const shelterValidation = {
  registration: shelterRegistrationSchema,
  updateProfile: updateShelterProfileSchema,
  updateProfileWithId: updateShelterProfileWithIdSchema,
  getShelters: {
    query: getSheltersQuerySchema,
  },
  getShelterById: getShelterByIdSchema,
  incrementViews: incrementShelterViewsSchema,
  getShelterPets: {
    query: getShelterPetsQuerySchema,
  },
  getShelterStats: {
    params: Joi.object({
      shelterId: objectIdSchema.required(),
    }),
    query: getShelterStatsQuerySchema,
  },
  getShelterAdoptionRequests: {
    params: Joi.object({
      shelterId: objectIdSchema.required(),
    }),
    query: getShelterAdoptionRequestsQuerySchema,
  },
};
