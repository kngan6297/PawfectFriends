import { catchAsync } from '../../middleware/async.js';
import reviewService from './review.service.js';

class ReviewController {
  createReview = catchAsync(async (req, res) => {
    const { shelterId, adoptionId } = req.params;
    const review = await reviewService.createReview(
      req.user._id,
      shelterId,
      adoptionId,
      req.body
    );

    res.status(201).json({
      status: 'success',
      data: review,
    });
  });

  getShelterReviews = catchAsync(async (req, res) => {
    const { shelterId } = req.params;
    const { page, limit } = req.query;
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };

    const result = await reviewService.getShelterReviews(shelterId, options);
    res.status(200).json({
      status: 'success',
      data: result.reviews,
      pagination: result.pagination,
    });
  });

  getUserReviews = catchAsync(async (req, res) => {
    const { page, limit } = req.query;
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };

    const result = await reviewService.getUserReviews(req.user._id, options);
    res.status(200).json({
      status: 'success',
      data: result.reviews,
      pagination: result.pagination,
    });
  });

  updateReview = catchAsync(async (req, res) => {
    const { reviewId } = req.params;
    const review = await reviewService.updateReview(
      reviewId,
      req.user._id,
      req.body
    );

    res.status(200).json({
      status: 'success',
      data: review,
    });
  });

  deleteReview = catchAsync(async (req, res) => {
    const { reviewId } = req.params;
    await reviewService.deleteReview(reviewId, req.user._id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  addResponse = catchAsync(async (req, res) => {
    const { reviewId } = req.params;
    const review = await reviewService.addResponse(
      reviewId,
      req.user._id,
      req.body
    );

    res.status(200).json({
      status: 'success',
      data: review,
    });
  });

  markHelpful = catchAsync(async (req, res) => {
    const { reviewId } = req.params;
    const review = await reviewService.markHelpful(reviewId, req.user._id);

    res.status(200).json({
      status: 'success',
      data: review,
    });
  });

  reportReview = catchAsync(async (req, res) => {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const review = await reviewService.reportReview(
      reviewId,
      req.user._id,
      reason
    );

    res.status(200).json({
      status: 'success',
      data: review,
    });
  });
}

export default new ReviewController();
