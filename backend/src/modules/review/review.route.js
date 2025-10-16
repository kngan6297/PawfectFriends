import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { reviewValidation } from './review.validation.js';
import reviewController from './review.controller.js';

// Initialize router
const router = express.Router();

// Protect all routes
router.use(authenticate);

// Create review for a shelter
router.post(
  '/shelters/:shelterId/adoptions/:adoptionId/reviews',
  validateRequest(reviewValidation.createReview),
  reviewController.createReview
);

// Get reviews for a shelter
router.get(
  '/shelters/:shelterId/reviews',
  validateRequest(reviewValidation.getShelterReviews),
  reviewController.getShelterReviews
);

// Get user's reviews
router.get(
  '/reviews/me',
  validateRequest(reviewValidation.getUserReviews),
  reviewController.getUserReviews
);

// Update review
router.patch(
  '/reviews/:reviewId',
  validateRequest(reviewValidation.updateReview),
  reviewController.updateReview
);

// Delete review
router.delete(
  '/reviews/:reviewId',
  validateRequest(reviewValidation.deleteReview),
  reviewController.deleteReview
);

// Add shelter response to review
router.post(
  '/reviews/:reviewId/response',
  authorize('shelter'),
  validateRequest(reviewValidation.addResponse),
  reviewController.addResponse
);

// Mark review as helpful
router.post(
  '/reviews/:reviewId/helpful',
  validateRequest(reviewValidation.markHelpful),
  reviewController.markHelpful
);

// Report review
router.post(
  '/reviews/:reviewId/report',
  validateRequest(reviewValidation.reportReview),
  reviewController.reportReview
);

export const reviewRouter = router;
export default router;
