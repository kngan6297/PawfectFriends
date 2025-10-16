import { Review } from '../../review/review.model.js';
import logger from '../../../utils/logger.js';

export const adminReviewService = {
  /**
   * Get all reviews
   */
  getAll: async (filters = {}) => {
    try {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.rating) query.rating = filters.rating;

      const reviews = await Review.find(query)
        .populate('user', 'name email')
        .populate('shelter', 'name email')
        .sort({ createdAt: -1 });
      return reviews;
    } catch (error) {
      logger.error('Get all reviews service error:', error);
      throw error;
    }
  },

  /**
   * Update review
   */
  update: async (reviewId, reviewData) => {
    try {
      const review = await Review.findByIdAndUpdate(reviewId, reviewData, {
        new: true,
        runValidators: true,
      })
        .populate('user', 'name email')
        .populate('shelter', 'name email');
      return review;
    } catch (error) {
      logger.error('Update review service error:', error);
      throw error;
    }
  },

  /**
   * Delete review
   */
  delete: async (reviewId) => {
    try {
      await Review.findByIdAndDelete(reviewId);
    } catch (error) {
      logger.error('Delete review service error:', error);
      throw error;
    }
  },
};
