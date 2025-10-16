import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  apiLimiter,
  viewIncrementLimiter,
} from '../../middleware/rateLimiter.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { shelterValidation } from './shelter.validation.js';
import {
  getAllShelters,
  getShelterById,
  updateShelterProfile,
  getShelterStats,
  getDetailedReports,
  searchShelters,
  getShelterDashboard,
  getShelterAnalytics,
  getAdoptionTrends,
  getAdoptionRatesByAttributes,
  getTimeToAdoptionStats,
  getDetailedTrendAnalytics,
  getRejectionReasonsAnalytics,
  incrementProfileViews,
} from './shelter.controller.js';

const router = express.Router();

// Public routes with rate limiting
router.get(
  '/',
  apiLimiter,
  validateRequest(shelterValidation.getShelters),
  getAllShelters
);
router.get('/search', apiLimiter, searchShelters);
router.get(
  '/:id',
  apiLimiter,
  validateRequest(shelterValidation.getShelterById),
  getShelterById
);
router.post(
  '/:shelterId/view',
  viewIncrementLimiter, // Use specialized rate limiter for view increments
  validateRequest(shelterValidation.incrementViews),
  incrementProfileViews
);

// Protected routes
router.use(authenticate);

// Shelter dashboard routes
router.get('/dashboard/stats', authorize('shelter', 'admin'), getShelterStats);
router.get(
  '/dashboard/overview',
  authorize('shelter', 'admin'),
  getShelterDashboard
);
router.get(
  '/dashboard/analytics',
  authorize('shelter', 'admin'),
  getShelterAnalytics
);
router.get(
  '/dashboard/reports',
  authorize('shelter', 'admin'),
  getDetailedReports
);

// New trend analysis routes
router.get(
  '/dashboard/trends',
  authorize('shelter', 'admin'),
  getAdoptionTrends
);
router.get(
  '/dashboard/rates-by-attributes',
  authorize('shelter', 'admin'),
  getAdoptionRatesByAttributes
);
router.get(
  '/dashboard/time-to-adoption',
  authorize('shelter', 'admin'),
  getTimeToAdoptionStats
);
router.get(
  '/dashboard/detailed-trends',
  authorize('shelter', 'admin'),
  getDetailedTrendAnalytics
);
router.get(
  '/dashboard/analytics/rejection-reasons',
  authorize('shelter', 'admin'),
  getRejectionReasonsAnalytics
);

// Shelter profile management
router.patch(
  '/profile',
  authorize('shelter', 'admin'),
  validateRequest(shelterValidation.updateProfile),
  updateShelterProfile
);

// Admin can update any shelter profile
router.patch(
  '/:id/profile',
  authorize('admin'),
  validateRequest(shelterValidation.updateProfileWithId),
  updateShelterProfile
);

export const shelterRouter = router;
export default router;
