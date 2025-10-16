import express from 'express';
import {
  getPersonalizedRecommendations,
  getRequirementsBasedRecommendations, // NEW: Requirements-based recommendations
  getSimilarUsersRecommendations, // NEW: Similar users recommendations
  scorePetsWithAI, // NEW: AI scoring endpoint
  getWizardRecommendations, // NEW: Wizard recommendations endpoint
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
} from './recommendation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { recommendationValidation } from './recommendation.validation.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';

const router = express.Router();

// Public recommendation routes (no authentication required)
router.get('/trending', getTrendingPets);
router.post('/wizard', getWizardRecommendations); // NEW: Wizard recommendations (works for guests and users)

// Apply authentication to protected recommendation routes
router.use(authenticate);

// User recommendation routes (require authentication)
router.get('/personalized', getPersonalizedRecommendations);

// NEW: Requirements-based recommendations
router.get('/requirements-based', getRequirementsBasedRecommendations);

// NEW: Similar users recommendations
router.get('/similar-users', getSimilarUsersRecommendations);

// NEW: Score pets with AI service (instead of mapping locally)
router.post('/score', scorePetsWithAI);

router.get('/similar/:petId', getSimilarPets);

// Admin routes (require admin authorization)
router.get('/analytics', authorize(['admin']), getRecommendationAnalytics);
router.post('/feedback', provideRecommendationFeedback);
router.post('/interactions/record', recordUserInteraction); // NEW: Record user interactions
router.post(
  '/interactions/record-enhanced',
  validateRequest(recommendationValidation.recordInteraction),
  recordInteraction
); // NEW: Enhanced interaction recording
router.post(
  '/feedback/submit',
  validateRequest(recommendationValidation.submitFeedback),
  submitFeedback
); // NEW: Submit feedback for AI learning
router.get('/history', getRecommendationHistory);
router.put('/preferences', updateUserPreferences);
router.get('/insights/:petId', getPetRecommendationInsights);
router.post('/clear-cache', authorize(['admin']), clearRecommendationCache);

// Security logging middleware
router.use((req, res, next) => {
  logSecurityEvent(SecurityEventType.RECOMMENDATION.ACCESS, {
    userId: req.user?._id,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

export const recommendationRouter = router;
export default router;
