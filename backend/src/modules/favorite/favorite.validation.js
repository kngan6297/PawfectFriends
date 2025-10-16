import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

// Favorite pet schema
export const favoritePetSchema = Joi.object({
  params: Joi.object({
    petId: objectIdSchema.required(),
  }),
});

// Unfavorite pet schema
export const unfavoritePetSchema = Joi.object({
  params: Joi.object({
    petId: objectIdSchema.required(),
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

// Toggle favorite schema
export const toggleFavoriteSchema = Joi.object({
  params: Joi.object({
    petId: objectIdSchema.required(),
  }),
});

// Check favorite status schema
export const checkFavoriteStatusSchema = Joi.object({
  params: Joi.object({
    petId: objectIdSchema.required(),
  }),
});

// Favorite validation object for routes
export const favoriteValidation = {
  favoritePet: favoritePetSchema,
  unfavoritePet: unfavoritePetSchema,
  getFavoritePets: {
    query: getFavoritePetsQuerySchema,
  },
  toggleFavorite: toggleFavoriteSchema,
  checkFavoriteStatus: checkFavoriteStatusSchema,
};
