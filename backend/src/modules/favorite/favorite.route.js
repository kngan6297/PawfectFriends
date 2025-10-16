import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { favoriteValidation } from './favorite.validation.js';
import { favoriteController } from './favorite.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's favorite pets
router.get(
  '/',
  validateRequest(favoriteValidation.getFavoritePets),
  favoriteController.getFavoritePets
);

// Add pet to favorites
router.post(
  '/:petId',
  validateRequest(favoriteValidation.favoritePet),
  favoriteController.favoritePet
);

// Remove pet from favorites
router.delete(
  '/:petId',
  validateRequest(favoriteValidation.unfavoritePet),
  favoriteController.unfavoritePet
);

// Toggle favorite status (add/remove)
router.patch(
  '/:petId/toggle',
  validateRequest(favoriteValidation.toggleFavorite),
  favoriteController.toggleFavorite
);

// Check if pet is favorited
router.get(
  '/:petId/check',
  validateRequest(favoriteValidation.checkFavoriteStatus),
  favoriteController.checkFavoriteStatus
);

export default router;
