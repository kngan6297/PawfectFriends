import express from 'express';
import {
  handleCreateProfile,
  handleGetProfile,
  handleUpdateProfile,
  handleUpdatePreferences,
  handleUpdateLocation,
  handleGetFavoritePets,
  handleToggleFavoritePet,
  handleGetShelters,
  handleGetShelterProfile,
  handleAddViewedPet,
  handleGetViewedPets,
  handleUploadAvatar,
  handleDeleteAvatar,
  handleChangePassword,
  handleUpdateAddress,
  handleUpdateSecuritySettings,
  handleGetMultipleUserProfiles,
} from './user.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { userValidation } from './user.validation.js';
import { authenticate } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Debug middleware for user routes
router.use((req, res, next) => {
  console.log(`${req.method} /api/users${req.url}`);
  next();
});

// Profile routes
router.post(
  '/profile',
  validateRequest(userValidation.createProfile),
  handleCreateProfile
);
router.get('/profile', handleGetProfile);

// Batch user profiles route
router.post('/batch', handleGetMultipleUserProfiles);
router.put(
  '/profile',
  validateRequest(userValidation.updateProfile),
  handleUpdateProfile
);
router.put(
  '/preferences',
  validateRequest(userValidation.updatePreferences),
  handleUpdatePreferences
);
router.put(
  '/location',
  validateRequest(userValidation.updateLocation),
  handleUpdateLocation
);

// Favorite pets routes
router.get(
  '/favorite-pets',
  validateRequest(userValidation.getFavoritePets),
  handleGetFavoritePets
);
router.post(
  '/favorite-pets/:petId',
  validateRequest(userValidation.toggleFavoritePet),
  handleToggleFavoritePet
);

// Viewed pets routes
router.get(
  '/viewed-pets',
  validateRequest(userValidation.getViewedPets),
  handleGetViewedPets
);
router.post(
  '/viewed-pets/:petId',
  validateRequest(userValidation.addViewedPet),
  handleAddViewedPet
);

// Shelter routes
router.get(
  '/shelters',
  validateRequest(userValidation.getShelters),
  handleGetShelters
);
router.get(
  '/shelters/:shelterId',
  validateRequest(userValidation.getShelterProfile),
  handleGetShelterProfile
);

// Upload routes
router.post(
  '/avatar',
  upload.single('avatar'),
  validateRequest(userValidation.uploadAvatar),
  handleUploadAvatar
);
router.delete('/avatar', handleDeleteAvatar);

// Password management routes
router.put(
  '/change-password',
  validateRequest(userValidation.changePassword),
  handleChangePassword
);

// Enhanced profile management routes
router.put(
  '/profile/address',
  validateRequest(userValidation.updateAddress),
  handleUpdateAddress
);

router.put(
  '/profile/security',
  validateRequest(userValidation.updateSecuritySettings),
  handleUpdateSecuritySettings
);

export const userRouter = router;
export default router;
