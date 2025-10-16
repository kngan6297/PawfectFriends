import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

/**
 * Validation schemas for recommendation system
 */

export const recommendationValidation = {
  /**
   * Update user preferences validation
   */
  updatePreferences: Joi.object({
    preferredTypes: Joi.array()
      .items(Joi.string().valid('dog', 'cat', 'bird', 'other'))
      .optional(),
    preferredSizes: Joi.array()
      .items(Joi.string().valid('small', 'medium', 'large'))
      .optional(),
    preferredAges: Joi.array()
      .items(Joi.string().valid('baby', 'young', 'adult', 'senior'))
      .optional(),
    preferredBreeds: Joi.array().items(Joi.string()).optional(),
    maxDistance: Joi.number().min(1).max(1000).optional(),
    lifestyle: Joi.string().valid('active', 'moderate', 'relaxed').optional(),
    experienceLevel: Joi.string()
      .valid('beginner', 'intermediate', 'experienced')
      .optional(),
    householdSize: Joi.number().min(1).max(10).optional(),
    hasChildren: Joi.boolean().optional(),
    hasOtherPets: Joi.boolean().optional(),
    livingSpace: Joi.string().valid('apartment', 'house', 'farm').optional(),
    timeAvailability: Joi.string().valid('low', 'medium', 'high').optional(),
  }),

  /**
   * Provide feedback validation
   */
  provideFeedback: Joi.object({
    recommendationId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    feedback: Joi.string().max(500).optional(),
    action: Joi.string()
      .valid('viewed', 'favorited', 'contacted', 'adopted', 'ignored')
      .optional(),
    petId: Joi.string().optional(),
    reason: Joi.string().max(200).optional(),
  }),

  /**
   * Get personalized recommendations validation
   */
  getPersonalizedRecommendations: Joi.object({
    limit: Joi.number().min(1).max(50).optional(),
    includeAdopted: Joi.boolean().optional(),
    minScore: Joi.number().min(0).max(1).optional(),
    useAdvancedFeatures: Joi.boolean().optional(),
    filters: Joi.object({
      type: Joi.string().valid('dog', 'cat', 'bird', 'other').optional(),
      size: Joi.string().valid('small', 'medium', 'large').optional(),
      age: Joi.string().valid('baby', 'young', 'adult', 'senior').optional(),
      breed: Joi.string().optional(),
      location: Joi.string().optional(),
      maxDistance: Joi.number().min(1).max(1000).optional(),
    }).optional(),
  }),

  /**
   * Get trending pets validation
   */
  getTrendingPets: Joi.object({
    limit: Joi.number().min(1).max(50).optional(),
    days: Joi.number().min(1).max(30).optional(),
    type: Joi.string().valid('dog', 'cat', 'bird', 'other').optional(),
  }),

  /**
   * Get similar pets validation
   */
  getSimilarPets: Joi.object({
    limit: Joi.number().min(1).max(20).optional(),
    similarityType: Joi.string()
      .valid('type', 'breed', 'size', 'age', 'all')
      .optional(),
  }),

  /**
   * Get recommendation history validation
   */
  getRecommendationHistory: Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    action: Joi.string()
      .valid('viewed', 'favorited', 'contacted', 'adopted', 'ignored')
      .optional(),
  }),

  /**
   * Get recommendation analytics validation (admin only)
   */
  getRecommendationAnalytics: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    groupBy: Joi.string().valid('day', 'week', 'month').optional(),
    metrics: Joi.array()
      .items(
        Joi.string().valid(
          'totalRecommendations',
          'averageScore',
          'userSatisfaction',
          'adoptionRate',
          'engagementRate'
        )
      )
      .optional(),
  }),

  /**
   * Record interaction validation
   */
  recordInteraction: Joi.object({
    body: Joi.object({
      petId: objectIdSchema.required(),
      interactionType: Joi.string()
        .valid('view', 'favorite', 'chat', 'recommendation_generated')
        .required(),
      additionalData: Joi.object({
        userPreferences: Joi.object().optional(),
        petCount: Joi.number().min(0).optional(),
        recommendationScore: Joi.number().min(0).max(1).optional(),
        sessionId: Joi.string().optional(),
        reason: Joi.string().max(200).optional(),
        details: Joi.string().max(500).optional(),
      }).optional(),
    }),
  }),

  /**
   * Submit feedback validation
   */
  submitFeedback: Joi.object({
    body: Joi.object({
      petId: objectIdSchema.required(),
      feedback: Joi.string()
        .valid('positive', 'negative', 'neutral')
        .required(),
      reason: Joi.string().max(500).required(),
      scoredPet: Joi.object({
        score: Joi.number().min(0).max(1).optional(),
        factors: Joi.array().items(Joi.string()).optional(),
        explanation: Joi.string().optional(),
      }).optional(),
      userPreferences: Joi.object().optional(),
      sessionId: Joi.string().optional(),
      additionalDetails: Joi.string().max(1000).optional(),
    }),
  }),
};

/**
 * Custom validation functions for recommendation system
 */
export const recommendationValidators = {
  /**
   * Validate user preferences
   */
  validatePreferences: (preferences) => {
    const schema = Joi.object({
      preferredTypes: Joi.array()
        .items(Joi.string().valid('dog', 'cat', 'bird', 'other'))
        .min(1)
        .optional(),
      preferredSizes: Joi.array()
        .items(Joi.string().valid('small', 'medium', 'large'))
        .min(1)
        .optional(),
      preferredAges: Joi.array()
        .items(Joi.string().valid('baby', 'young', 'adult', 'senior'))
        .min(1)
        .optional(),
      preferredBreeds: Joi.array().items(Joi.string()).min(1).optional(),
      maxDistance: Joi.number().min(1).max(1000).optional(),
      lifestyle: Joi.string().valid('active', 'moderate', 'relaxed').optional(),
      experienceLevel: Joi.string()
        .valid('beginner', 'intermediate', 'experienced')
        .optional(),
    });

    return schema.validate(preferences, {
      abortEarly: false,
      stripUnknown: { objects: true, arrays: true },
    });
  },

  /**
   * Validate recommendation filters
   */
  validateFilters: (filters) => {
    const schema = Joi.object({
      type: Joi.string().valid('dog', 'cat', 'bird', 'other').optional(),
      size: Joi.string().valid('small', 'medium', 'large').optional(),
      age: Joi.string().valid('baby', 'young', 'adult', 'senior').optional(),
      breed: Joi.string().optional(),
      location: Joi.string().optional(),
      maxDistance: Joi.number().min(1).max(1000).optional(),
      minScore: Joi.number().min(0).max(1).optional(),
      includeAdopted: Joi.boolean().optional(),
    });

    return schema.validate(filters, {
      abortEarly: false,
      stripUnknown: { objects: true, arrays: true },
    });
  },

  /**
   * Validate feedback data
   */
  validateFeedback: (feedback) => {
    const schema = Joi.object({
      recommendationId: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
      feedback: Joi.string().max(500).optional(),
      action: Joi.string()
        .valid('viewed', 'favorited', 'contacted', 'adopted', 'ignored')
        .optional(),
      petId: Joi.string().optional(),
      reason: Joi.string().max(200).optional(),
      timestamp: Joi.date().default(Date.now),
    });

    return schema.validate(feedback, {
      abortEarly: false,
      stripUnknown: { objects: true, arrays: true },
    });
  },
};

/**
 * Sanitization functions for recommendation data
 */
export const recommendationSanitizers = {
  /**
   * Sanitize user preferences
   */
  sanitizePreferences: (preferences) => {
    const sanitized = {};

    if (preferences.preferredTypes) {
      sanitized.preferredTypes = preferences.preferredTypes.filter((type) =>
        ['dog', 'cat', 'bird', 'other'].includes(type)
      );
    }

    if (preferences.preferredSizes) {
      sanitized.preferredSizes = preferences.preferredSizes.filter((size) =>
        ['small', 'medium', 'large'].includes(size)
      );
    }

    if (preferences.preferredAges) {
      sanitized.preferredAges = preferences.preferredAges.filter((age) =>
        ['baby', 'young', 'adult', 'senior'].includes(age)
      );
    }

    if (preferences.preferredBreeds) {
      sanitized.preferredBreeds = preferences.preferredBreeds.filter(
        (breed) => typeof breed === 'string' && breed.trim().length > 0
      );
    }

    if (
      preferences.maxDistance &&
      typeof preferences.maxDistance === 'number'
    ) {
      sanitized.maxDistance = Math.max(
        1,
        Math.min(1000, preferences.maxDistance)
      );
    }

    if (
      preferences.lifestyle &&
      ['active', 'moderate', 'relaxed'].includes(preferences.lifestyle)
    ) {
      sanitized.lifestyle = preferences.lifestyle;
    }

    if (
      preferences.experienceLevel &&
      ['beginner', 'intermediate', 'experienced'].includes(
        preferences.experienceLevel
      )
    ) {
      sanitized.experienceLevel = preferences.experienceLevel;
    }

    return sanitized;
  },

  /**
   * Sanitize recommendation filters
   */
  sanitizeFilters: (filters) => {
    const sanitized = {};

    if (
      filters.type &&
      ['dog', 'cat', 'bird', 'other'].includes(filters.type)
    ) {
      sanitized.type = filters.type;
    }

    if (filters.size && ['small', 'medium', 'large'].includes(filters.size)) {
      sanitized.size = filters.size;
    }

    if (
      filters.age &&
      ['baby', 'young', 'adult', 'senior'].includes(filters.age)
    ) {
      sanitized.age = filters.age;
    }

    if (filters.breed && typeof filters.breed === 'string') {
      sanitized.breed = filters.breed.trim();
    }

    if (filters.location && typeof filters.location === 'string') {
      sanitized.location = filters.location.trim();
    }

    if (filters.maxDistance && typeof filters.maxDistance === 'number') {
      sanitized.maxDistance = Math.max(1, Math.min(1000, filters.maxDistance));
    }

    if (filters.minScore && typeof filters.minScore === 'number') {
      sanitized.minScore = Math.max(0, Math.min(1, filters.minScore));
    }

    if (typeof filters.includeAdopted === 'boolean') {
      sanitized.includeAdopted = filters.includeAdopted;
    }

    return sanitized;
  },
};
