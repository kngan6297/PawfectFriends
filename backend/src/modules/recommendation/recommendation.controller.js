import { catchAsync } from '../../middleware/async.js';
import { ApiError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import recommendationService from './recommendation.service.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';

/**
 * Get personalized pet recommendations for a user
 */
export const getPersonalizedRecommendations = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      limit = 10,
      includeAdopted = false,
      minScore = 0.01, // Lower default minScore to ensure users get recommendations
      useAdvancedFeatures = true,
    } = req.query;

    const recommendations =
      await recommendationService.getPersonalizedRecommendations(userId, {
        limit: parseInt(limit),
        includeAdopted: includeAdopted === 'true',
        minScore: parseFloat(minScore),
        useAdvancedFeatures: useAdvancedFeatures === 'true',
      });

    // Log recommendation request
    logSecurityEvent(SecurityEventType.RECOMMENDATION.REQUESTED, {
      userId,
      recommendationCount: recommendations.length,
      useAdvancedFeatures: useAdvancedFeatures === 'true',
    });

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        userPreferences: req.user.preferences || {},
      },
      message: 'Personalized recommendations retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting personalized recommendations:', {
      message: error.message,
      stack: error.stack,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get personalized recommendations');
  }
});

/**
 * Get recommendations based on user requirements completion
 */
export const getRequirementsBasedRecommendations = catchAsync(
  async (req, res) => {
    try {
      const userId = req.user._id;
      const {
        limit = 10,
        minRequirementsCompletion = 30,
        includeRequirementsAnalysis = true,
      } = req.query;

      const result =
        await recommendationService.getRequirementsBasedRecommendations(
          userId,
          {
            limit: parseInt(limit),
            minRequirementsCompletion: parseInt(minRequirementsCompletion),
            includeRequirementsAnalysis: includeRequirementsAnalysis === 'true',
          }
        );

      // Log recommendation request
      logSecurityEvent(SecurityEventType.RECOMMENDATION.REQUESTED, {
        userId,
        recommendationCount: result.recommendations.length,
        requirementsCompletion:
          result.requirementsAnalysis.completionPercentage,
        useRequirementsBased:
          result.requirementsAnalysis.hasCompleteRequirements,
      });

      res.json({
        success: true,
        data: result,
        message: 'Requirements-based recommendations retrieved successfully',
      });
    } catch (error) {
      logger.error('Error getting requirements-based recommendations:', {
        message: error.message,
        stack: error.stack,
      });
      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        'Failed to get requirements-based recommendations'
      );
    }
  }
);

/**
 * Get recommendations for users with similar requirements
 */
export const getSimilarUsersRecommendations = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      limit = 10,
      minSimilarity = 0.7,
      includeSimilarityScore = true,
    } = req.query;

    const recommendations =
      await recommendationService.getSimilarUsersRecommendations(userId, {
        limit: parseInt(limit),
        minSimilarity: parseFloat(minSimilarity),
        includeSimilarityScore: includeSimilarityScore === 'true',
      });

    // Log recommendation request
    logSecurityEvent(SecurityEventType.RECOMMENDATION.REQUESTED, {
      userId,
      recommendationCount: recommendations.length,
      useSimilarUsers: true,
    });

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        useSimilarUsers: true,
      },
      message: 'Similar users recommendations retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting similar users recommendations:', {
      message: error.message,
      stack: error.stack,
    });
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get similar users recommendations');
  }
});

/**
 * NEW: Score pets using AI service
 * Instead of mapping locally, send preferences and pets to AI service
 */
export const scorePetsWithAI = catchAsync(async (req, res) => {
  try {
    const {
      preferences,
      pets,
      useLearning = true,
      useML = true,
      mlWeight = 0.7,
      ruleWeight = 0.3,
    } = req.body;
    const userId = req.user?._id?.toString();

    if (!preferences || !pets || !Array.isArray(pets)) {
      throw new ApiError(
        'Invalid request: preferences and pets array required',
        400
      );
    }

    logger.info(
      `Scoring ${pets.length} pets for user ${userId} using AI service`
    );

    // Call AI service to score pets
    const scoredPets = await recommendationService.scorePetsWithAI({
      preferences,
      pets,
      userId,
      useLearning,
      useML,
      mlWeight,
      ruleWeight,
    });

    // Log the scoring request
    logSecurityEvent(SecurityEventType.RECOMMENDATION.SCORED, {
      userId,
      petCount: pets.length,
      scoredCount: scoredPets.length,
      useML,
      useLearning,
    });

    res.json({
      success: true,
      data: {
        scoredPets,
        total: scoredPets.length,
        preferences,
        mlEnabled: useML,
        learningEnabled: useLearning,
        mlWeight,
        ruleWeight,
      },
      message: 'Pets scored successfully using AI service',
    });
  } catch (error) {
    logger.error('Error scoring pets with AI:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to score pets with AI service');
  }
});

/**
 * Get trending pets
 */
export const getTrendingPets = catchAsync(async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;

    const trendingPets = await recommendationService.getTrendingPets({
      limit: parseInt(limit),
      days: parseInt(days),
    });

    res.json({
      success: true,
      data: trendingPets,
      message: 'Trending pets retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting trending pets:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get trending pets');
  }
});

/**
 * Get pets similar to a specific pet
 */
export const getSimilarPets = catchAsync(async (req, res) => {
  try {
    const { petId } = req.params;
    const { limit = 5 } = req.query;

    const similarPets = await recommendationService.getSimilarPets(petId, {
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: similarPets,
      message: 'Similar pets retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting similar pets:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get similar pets');
  }
});

/**
 * Get recommendation analytics for admin dashboard
 */
export const getRecommendationAnalytics = catchAsync(async (req, res) => {
  try {
    const { period = '30d', shelterId } = req.query;

    const analytics = await recommendationService.getRecommendationAnalytics({
      period,
      shelterId,
    });

    res.json({
      success: true,
      data: analytics,
      message: 'Recommendation analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting recommendation analytics:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get recommendation analytics');
  }
});

/**
 * Update user preferences for recommendations
 */
export const updateUserPreferences = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = req.body;

    const updatedPreferences =
      await recommendationService.updateUserPreferences(userId, preferences);

    res.json({
      success: true,
      data: updatedPreferences,
      message: 'User preferences updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to update user preferences');
  }
});

/**
 * Get recommendation history for a user
 */
export const getRecommendationHistory = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, page = 1 } = req.query;

    const history = await recommendationService.getRecommendationHistory(
      userId,
      {
        limit: parseInt(limit),
        page: parseInt(page),
      }
    );

    res.json({
      success: true,
      data: history,
      message: 'Recommendation history retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting recommendation history:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get recommendation history');
  }
});

/**
 * Provide feedback for recommendations
 */
export const provideRecommendationFeedback = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id;
    const { petId, feedback, reason, sessionId } = req.body;

    await recommendationService.provideRecommendationFeedback(
      userId,
      petId,
      feedback,
      reason,
      sessionId
    );

    res.json({
      success: true,
      message: 'Recommendation feedback recorded successfully',
    });
  } catch (error) {
    logger.error('Error providing recommendation feedback:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to record recommendation feedback');
  }
});

/**
 * Get pet recommendation insights
 */
export const getPetRecommendationInsights = catchAsync(async (req, res) => {
  try {
    const { petId } = req.params;

    const insights =
      await recommendationService.getPetRecommendationInsights(petId);

    res.json({
      success: true,
      data: insights,
      message: 'Pet recommendation insights retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting pet recommendation insights:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get pet recommendation insights');
  }
});

/**
 * Get wizard-based recommendations (works for guests and users)
 */
export const getWizardRecommendations = catchAsync(async (req, res) => {
  try {
    const preferences = req.body;
    const userId = req.user?._id?.toString();
    const { limit = 20, minScore = 0.1, useML = true } = req.query;

    logger.info(
      `Getting wizard recommendations for ${userId ? 'user' : 'guest'} with preferences:`,
      preferences
    );

    const results = await recommendationService.getWizardRecommendations(
      preferences,
      {
        limit: parseInt(limit),
        minScore: parseFloat(minScore),
        useML: useML === 'true',
        userId,
      }
    );

    // Log recommendation request
    logSecurityEvent(SecurityEventType.RECOMMENDATION.REQUESTED, {
      userId,
      recommendationCount: results.recommendations.length,
      isGuest: results.isGuest,
      useML: useML === 'true',
    });

    res.json({
      success: true,
      data: results,
      message: 'Wizard recommendations retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting wizard recommendations:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get wizard recommendations');
  }
});

/**
 * Record user interaction for AI learning
 */
export const recordUserInteraction = catchAsync(async (req, res) => {
  try {
    const {
      petId,
      interactionType,
      timestamp,
      preferences,
      petCount,
      isGuest,
      sessionId,
      userPreferences,
      petAttributes,
      reason,
      details,
    } = req.body;

    const userId = req.user?._id?.toString();

    logger.info(
      `Recording ${interactionType} interaction for ${userId ? 'user' : 'guest'} with pet ${petId}`
    );

    // Record the interaction in the service
    await recommendationService.recordUserInteraction({
      petId,
      interactionType,
      timestamp,
      userId,
      preferences,
      petCount,
      isGuest,
      sessionId,
      userPreferences,
      petAttributes,
      reason,
      details,
    });

    // Log the interaction for security
    logSecurityEvent(SecurityEventType.RECOMMENDATION.INTERACTION, {
      userId,
      petId,
      interactionType,
      isGuest: !!isGuest,
    });

    res.json({
      success: true,
      message: 'User interaction recorded successfully',
    });
  } catch (error) {
    logger.error('Error recording user interaction:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to record user interaction');
  }
});

/**
 * Record user interaction for AI learning and analytics
 * Enhanced version that stores data in MongoDB
 */
export const recordInteraction = catchAsync(async (req, res) => {
  try {
    const { petId, interactionType, additionalData = {} } = req.body;
    const userId = req.user._id;

    logger.info(
      `Recording ${interactionType} interaction for user ${userId} with pet ${petId}`
    );

    // Record the interaction in the service
    const result = await recommendationService.recordInteraction(
      petId,
      interactionType,
      {
        ...additionalData,
        userId: userId.toString(),
      }
    );

    if (!result.success) {
      throw ApiError.badRequest(result.error || 'Failed to record interaction');
    }

    // Log the interaction for security
    logSecurityEvent(SecurityEventType.RECOMMENDATION.INTERACTION, {
      userId,
      petId,
      interactionType,
      isGuest: false,
    });

    res.json({
      success: true,
      message: 'Interaction recorded successfully',
      data: {
        activityLogId: result.activityLogId,
        interactionType,
        petId,
      },
    });
  } catch (error) {
    logger.error('Error recording interaction:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to record interaction');
  }
});

/**
 * Submit feedback for AI recommendations
 */
export const submitFeedback = catchAsync(async (req, res) => {
  try {
    const {
      petId,
      feedback,
      reason,
      scoredPet,
      userPreferences,
      sessionId,
      additionalDetails,
    } = req.body;
    const userId = req.user._id;

    logger.info(
      `Submitting ${feedback} feedback for pet ${petId} by user ${userId}`
    );

    // Submit feedback in the service
    const result = await recommendationService.submitFeedback({
      petId,
      feedback,
      reason,
      scoredPet,
      userPreferences,
      userId: userId.toString(),
      sessionId,
      additionalDetails,
    });

    if (!result.success) {
      throw ApiError.badRequest(result.error || 'Failed to submit feedback');
    }

    // Log the feedback for security
    logSecurityEvent(SecurityEventType.RECOMMENDATION.FEEDBACK, {
      userId,
      petId,
      feedbackType: feedback,
      reason,
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        activityLogId: result.activityLogId,
        learningImpact: result.learningImpact,
        feedbackType: feedback,
        petId,
      },
    });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to submit feedback');
  }
});

/**
 * Clear recommendation cache
 */
export const clearRecommendationCache = async (req, res) => {
  try {
    await recommendationService.clearRecommendationCache();

    res.json({
      success: true,
      message: 'Recommendation cache cleared successfully',
    });
  } catch (error) {
    logger.error('Error clearing recommendation cache:', error);
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to clear recommendation cache');
  }
};

/**
 * Export recommendation controller
 */
export const recommendationController = {
  getPersonalizedRecommendations,
  scorePetsWithAI, // NEW: AI scoring endpoint
  getWizardRecommendations, // NEW: Wizard recommendations
  getTrendingPets,
  getSimilarPets,
  getRecommendationAnalytics,
  updateUserPreferences,
  getRecommendationHistory,
  provideRecommendationFeedback,
  recordUserInteraction, // NEW: Record user interactions
  recordInteraction, // NEW: Enhanced interaction recording
  submitFeedback, // NEW: Submit feedback for AI learning
  getPetRecommendationInsights,
  clearRecommendationCache,
};
