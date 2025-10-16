import { ApiError } from '../../utils/errors.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
import { User } from '../user/user.model.js';
import { Pet } from '../pet/pet.model.js';
import { Review } from './review.model.js';
import logger from '../../utils/logger.js';
import notificationService from '../notification/notification.service.js';

class ReviewService {
  async createReview(userId, shelterId, adoptionId, reviewData) {
    // Check if adoption exists and is completed
    const adoption = await AdoptionRequest.findOne({
      _id: adoptionId,
      user: userId,
      shelter: shelterId,
      status: 'completed',
    });

    if (!adoption) {
      throw ApiError.notFound('Completed adoption not found');
    }

    // Verify that the user requesting to create the review is the one who adopted the pet
    if (adoption.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        'Only the user who adopted this pet can leave a review'
      );
    }

    // Check if review already exists for this adoption (regardless of user)
    const existingReview = await Review.findOne({ adoption: adoptionId });
    if (existingReview) {
      throw ApiError.validation('This adoption has already been reviewed');
    }

    // Check if this user already has a review for this adoption
    const existingUserReview = await Review.findOne({
      user: userId,
      adoption: adoptionId,
    });
    if (existingUserReview) {
      throw ApiError.validation('You have already reviewed this adoption');
    }

    // Create review
    const review = await Review.create({
      user: userId,
      shelter: shelterId,
      adoption: adoptionId,
      ...reviewData,
    });

    // Create notification for shelter
    try {
      await notificationService.createReviewReceivedNotification(
        review._id,
        shelterId
      );
    } catch (error) {
      console.error('Failed to create review notification:', error);
    }

    return review;
  }

  async getShelterReviews(shelterId, query = {}) {
    const { page = 1, limit = 10, status = 'approved' } = query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ shelter: shelterId, status })
      .populate('user', 'name avatar')
      .populate({
        path: 'adoption',
        populate: {
          path: 'pet',
          select: 'name photos type breed age',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      shelter: shelterId,
      status,
    });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserReviews(userId, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: userId })
      .populate('shelter', 'name avatar')
      .populate('adoption', 'pet')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: userId });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateReview(reviewId, userId, updateData) {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, user: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!review) {
      throw ApiError.notFound('Review not found or unauthorized');
    }

    return review;
  }

  async deleteReview(reviewId, userId) {
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      throw ApiError.notFound('Review not found or unauthorized');
    }

    return review;
  }

  async addResponse(reviewId, shelterId, responseData) {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, shelter: shelterId },
      {
        $set: {
          response: {
            ...responseData,
            date: new Date(),
            by: shelterId,
          },
        },
      },
      { new: true }
    );

    if (!review) {
      throw ApiError.notFound('Review not found or unauthorized');
    }

    return review;
  }

  async markHelpful(reviewId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    const alreadyMarked = review.helpful.some(
      (help) => help.user.toString() === userId
    );

    if (alreadyMarked) {
      review.helpful = review.helpful.filter(
        (help) => help.user.toString() !== userId
      );
    } else {
      review.helpful.push({ user: userId });
    }

    await review.save();
    return review;
  }

  async reportReview(reviewId, userId, reason) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    const alreadyReported = review.reports.some(
      (report) => report.user.toString() === userId
    );

    if (!alreadyReported) {
      review.reports.push({ user: userId, reason });
      review.reportCount += 1;
      await review.save();
    }

    return review;
  }
}

export default new ReviewService();
