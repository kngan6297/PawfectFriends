import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

// Base review schema
export const reviewSchema = Joi.object({
  shelter: Joi.string().min(1).required().messages({
    'string.empty': 'Shelter ID is required',
  }),
  user: Joi.string().min(1).required().messages({
    'string.empty': 'User ID is required',
  }),
  adoption: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Adoption ID is required',
      'any.required': 'Adoption ID is required to create a review',
    })
    .description(
      'Must be a completed adoption request where the user is the adopter'
    ),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'Comment must be at least 10 characters long',
    'string.max': 'Comment cannot exceed 1000 characters',
  }),
  photos: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        caption: Joi.string().max(200).optional(),
      })
    )
    .optional(),
  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .default('pending'),
  response: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    date: Joi.date().default(() => new Date()),
    by: Joi.string().required(),
  }).optional(),
  helpful: Joi.array()
    .items(
      Joi.object({
        user: Joi.string().required(),
        date: Joi.date().default(() => new Date()),
      })
    )
    .optional(),
  reportCount: Joi.number().default(0),
  reports: Joi.array()
    .items(
      Joi.object({
        user: Joi.string().required(),
        reason: Joi.string().required(),
        date: Joi.date().default(() => new Date()),
      })
    )
    .optional(),
});

// Create review schema
export const createReviewSchema = Joi.object({
  params: Joi.object({
    shelterId: objectIdSchema.required(),
    adoptionId: objectIdSchema.required(),
  }),
  body: Joi.object({
    rating: Joi.number().min(1).max(5).required().messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot exceed 5',
    }),
    comment: Joi.string().min(10).max(1000).required().messages({
      'string.min': 'Comment must be at least 10 characters long',
      'string.max': 'Comment cannot exceed 1000 characters',
    }),
    photos: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          caption: Joi.string().max(200).optional(),
        })
      )
      .max(5)
      .optional(),
  }),
});

// Update review schema
export const updateReviewSchema = Joi.object({
  params: Joi.object({
    reviewId: objectIdSchema.required(),
  }),
  body: Joi.object({
    rating: Joi.number().min(1).max(5).optional(),
    comment: Joi.string().min(10).max(1000).optional(),
    photos: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          caption: Joi.string().max(200).optional(),
        })
      )
      .max(5)
      .optional(),
  }).min(1), // At least one field must be provided
});

// Delete review schema
export const deleteReviewSchema = Joi.object({
  params: Joi.object({
    reviewId: objectIdSchema.required(),
  }),
});

// Add shelter response schema
export const addResponseSchema = Joi.object({
  params: Joi.object({
    reviewId: objectIdSchema.required(),
  }),
  body: Joi.object({
    content: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Response content is required',
      'string.max': 'Response cannot exceed 1000 characters',
    }),
  }),
});

// Mark review as helpful schema
export const markHelpfulSchema = Joi.object({
  params: Joi.object({
    reviewId: objectIdSchema.required(),
  }),
});

// Report review schema
export const reportReviewSchema = Joi.object({
  params: Joi.object({
    reviewId: objectIdSchema.required(),
  }),
  body: Joi.object({
    reason: Joi.string()
      .valid(
        'inappropriate_content',
        'spam',
        'fake_review',
        'harassment',
        'other'
      )
      .required(),
    details: Joi.string().max(500).optional(),
  }),
});

// Get shelter reviews query schema
export const getShelterReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'rating', 'helpful')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  status: Joi.string()
    .valid('all', 'approved', 'pending')
    .default('approved')
    .optional(),
});

// Get user reviews query schema
export const getUserReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'rating')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
});

// Review validation object for routes
export const reviewValidation = {
  createReview: createReviewSchema,
  updateReview: updateReviewSchema,
  deleteReview: deleteReviewSchema,
  addResponse: addResponseSchema,
  markHelpful: markHelpfulSchema,
  reportReview: reportReviewSchema,
  getShelterReviews: {
    params: Joi.object({
      shelterId: objectIdSchema.required(),
    }),
    query: getShelterReviewsQuerySchema,
  },
  getUserReviews: {
    query: getUserReviewsQuerySchema,
  },
};
