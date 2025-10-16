import { Pet } from '../pet/pet.model.js';
import { User } from '../user/user.model.js';
import logger from '../../utils/logger.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';

// Monitoring metrics
let totalRecommendations = 0;
let successfulRecommendations = 0;
let failedRecommendations = 0;
let responseTimes = [];

export const recommendationMonitor = {
  incrementTotalRecommendations() {
    totalRecommendations++;
  },

  incrementSuccessfulRecommendations() {
    successfulRecommendations++;
  },

  incrementFailedRecommendations() {
    failedRecommendations++;
  },

  addResponseTime(time) {
    responseTimes.push(time);
    // Keep only last 1000 response times
    if (responseTimes.length > 1000) {
      responseTimes.shift();
    }
  },

  getMetrics() {
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      totalRecommendations,
      successfulRecommendations,
      failedRecommendations,
      avgResponseTime,
    };
  },
};

export const monitorRecommendationSystem = async () => {
  try {
    // Note: Redis cache monitoring removed - using in-memory metrics only
    logger.info('Monitoring recommendation system (Redis disabled)');

    // Monitor recommendation accuracy
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      'preferences.updatedAt': {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Monitor pet availability
    const availablePets = await Pet.countDocuments({
      status: 'available',
    });
    const pendingPets = await Pet.countDocuments({ status: 'pending' });
    const adoptedPets = await Pet.countDocuments({ status: 'adopted' });

    // Get recommendation metrics
    const recommendationMetrics = recommendationMonitor.getMetrics();

    // Log monitoring metrics
    logger.info('Recommendation system metrics:', {
      totalUsers,
      activeUsers,
      availablePets,
      pendingPets,
      adoptedPets,
      ...recommendationMetrics,
    });

    // Log security event
    logSecurityEvent(SecurityEventType.RECOMMENDATION.MONITOR, {
      metrics: {
        totalUsers,
        activeUsers,
        availablePets,
        pendingPets,
        adoptedPets,
        ...recommendationMetrics,
      },
    });

    return {
      totalUsers,
      activeUsers,
      availablePets,
      pendingPets,
      adoptedPets,
      ...recommendationMetrics,
    };
  } catch (error) {
    logger.error('Error monitoring recommendation system:', error);
    throw error;
  }
};

export const clearRecommendationCache = async () => {
  try {
    // Note: Redis cache clearing disabled - no cache to clear
    logger.info('Recommendation cache clearing disabled (Redis not available)');
    return { message: 'Cache clearing disabled - Redis not available' };
  } catch (error) {
    logger.error('Error clearing recommendation cache:', error);
    throw error;
  }
};

export const updateRecommendationMetrics = async () => {
  try {
    const metrics = await monitorRecommendationSystem();

    // Note: Redis metrics storage disabled - returning metrics directly
    logger.info('Recommendation metrics updated (stored in memory only)');

    return metrics;
  } catch (error) {
    logger.error('Error updating recommendation metrics:', error);
    throw error;
  }
};
