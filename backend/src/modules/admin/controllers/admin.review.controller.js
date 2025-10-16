import {
  asyncHandler,
  sendSuccessResponse,
} from '../../../middleware/responseHandler.js';
import { adminReviewService } from '../services/review.service.admin.js';

export const AdminGetAllReviews = asyncHandler(async (req, res) => {
  const filters = req.query;
  const reviews = await adminReviewService.getAll(filters);
  return sendSuccessResponse(
    res,
    200,
    'Reviews retrieved successfully',
    reviews
  );
});

export const AdminUpdateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const review = await adminReviewService.update(reviewId, req.body);
  return sendSuccessResponse(res, 200, 'Review updated successfully', review);
});

export const AdminDeleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  await adminReviewService.delete(reviewId);
  return sendSuccessResponse(res, 200, 'Review deleted successfully');
});
