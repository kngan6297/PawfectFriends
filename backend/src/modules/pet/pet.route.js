import express from 'express';
import multer from 'multer';
import { upload } from '../../middleware/upload.js';
import {
  createPet,
  getPets,
  getPetById,
  getPetBySlug,
  updatePet,
  deletePet,
  addHealthRecord,
  addBehaviorRecord,
  updatePetStatus,
  uploadPetImages,
  deletePetImage,
  setPrimaryImage,
  getLatestPets,
  searchPets,
  getSearchSuggestions,
  getSearchFilters,
  getSearchAnalytics,
  getFacetedSearch,
  getShelterPets,
  getShelterStats,
  getShelterAdoptionRequests,
  addComplaint,
  getPetComplaints,
  updateComplaintStatus,
  getFlaggedPets,
  getComplaintStats,
  getPetsWithHighComplaints,
  proxyPetImage,
} from './pet.controller.js';
import {
  validateRequest,
  validateObjectId,
} from '../../middleware/validateRequest.js';
import { petValidation } from './pet.validation.js';
import { shelterValidation } from '../shelter/shelter.validation.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  handleShelterAccess,
  validateShelterOwnership,
  logShelterOperation,
} from '../../middleware/shelterAccess.js';
import {
  comprehensiveSlugMiddleware,
  ensureSlug,
  normalizeSlugParam,
} from '../../middleware/slugMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getPets);
router.get('/latest', getLatestPets);

// Image proxy route (no authentication required)
router.get('/proxy/image', proxyPetImage);

// Enhanced search routes
router.get('/search', searchPets);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/search/filters', getSearchFilters);
router.get('/search/analytics', getSearchAnalytics);
router.get('/search/faceted', getFacetedSearch);

// Pet detail page - publicly accessible (slug-based)
router.get(
  '/slug/:slug',
  normalizeSlugParam('slug'),
  ensureSlug('slug'),
  getPetBySlug
);

// Pet detail page - publicly accessible (ID-based)
router.get('/:petId', validateObjectId('petId'), getPetById);

// Create a separate router for shelter routes to avoid conflicts
const shelterRouter = express.Router();

// Apply authentication to shelter routes
shelterRouter.use(authenticate);

// Shelter-specific routes with shelter access middleware
shelterRouter.get(
  '/stats',
  authorize('shelter', 'admin'),
  handleShelterAccess({ requireShelter: true }),
  logShelterOperation(),
  getShelterStats
);
shelterRouter.get(
  '/adoption-requests',
  authorize('shelter', 'admin'),
  handleShelterAccess({ requireShelter: true }),
  logShelterOperation(),
  getShelterAdoptionRequests
);
shelterRouter.get(
  '/pets',
  authorize('shelter', 'admin'),
  handleShelterAccess({ requireShelter: true }),
  logShelterOperation(),
  validateRequest(shelterValidation.getShelterPets),
  getShelterPets
);

// Mount shelter router
router.use('/shelter', shelterRouter);

// Protected pet management routes (authentication required)
// Pet creation
router.post(
  '/',
  authenticate,
  authorize('shelter', 'admin'),
  handleShelterAccess({ allowAdminOverride: true }),
  logShelterOperation(),
  upload.array('images', 5),
  validateRequest(petValidation.createPet),
  ...comprehensiveSlugMiddleware({
    fieldName: 'name',
    slugField: 'slug',
    modelName: 'Pet',
    strategy: 'counter',
  }),
  createPet
);

// Pet updates (require authentication)
router.patch(
  '/:petId',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  handleShelterAccess({ allowAdminOverride: true }),
  logShelterOperation(),
  validateRequest(petValidation.updatePet),
  ...comprehensiveSlugMiddleware({
    fieldName: 'name',
    slugField: 'slug',
    modelName: 'Pet',
    strategy: 'counter',
    forceRegenerate: false, // Only regenerate if name changes
  }),
  updatePet
);

// Pet updates with PUT method (for frontend compatibility)
router.put(
  '/:petId',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  handleShelterAccess({ allowAdminOverride: true }),
  logShelterOperation(),
  upload.any(),
  validateRequest(petValidation.updatePet),
  ...comprehensiveSlugMiddleware({
    fieldName: 'name',
    slugField: 'slug',
    modelName: 'Pet',
    strategy: 'counter',
    forceRegenerate: false, // Only regenerate if name changes
  }),
  updatePet
);

router.delete(
  '/:petId',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  deletePet
);

// Health and behavior records
router.post(
  '/:petId/health',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  validateRequest(petValidation.addHealthRecord),
  addHealthRecord
);

router.post(
  '/:petId/behavior',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  validateRequest(petValidation.addBehaviorRecord),
  addBehaviorRecord
);

// Status management
router.patch(
  '/:petId/status',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  handleShelterAccess({ allowAdminOverride: true }),
  logShelterOperation(),
  validateRequest(petValidation.updateStatus),
  updatePetStatus
);

// Image management
router.post(
  '/:petId/images',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  upload.array('images', 5),
  uploadPetImages
);

router.delete(
  '/:petId/images/:imageId',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateObjectId('imageId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  deletePetImage
);

router.patch(
  '/:petId/images/:imageId/primary',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateObjectId('imageId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  setPrimaryImage
);

// Complaint routes
router.post(
  '/:petId/complaints',
  authenticate,
  authorize('user', 'shelter', 'admin'),
  validateObjectId('petId'),
  validateRequest(petValidation.addComplaint),
  addComplaint
);

router.get(
  '/:petId/complaints',
  authenticate,
  authorize('shelter', 'admin'),
  validateObjectId('petId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  getPetComplaints
);

router.patch(
  '/:petId/complaints/:complaintId',
  authenticate,
  authorize('admin'),
  validateObjectId('petId'),
  validateObjectId('complaintId'),
  validateShelterOwnership({ resourceParam: 'petId', resourceModel: 'Pet' }),
  logShelterOperation(),
  validateRequest(petValidation.updateComplaintStatus),
  updateComplaintStatus
);

// Admin routes for complaint management
router.get('/flagged/all', authenticate, authorize('admin'), getFlaggedPets);
router.get(
  '/complaints/stats',
  authenticate,
  authorize('admin'),
  getComplaintStats
);
router.get(
  '/complaints/high-threshold',
  authenticate,
  authorize('admin'),
  getPetsWithHighComplaints
);

// Slug management routes (admin only)
router.post('/generate-slug', authenticate, authorize('admin'), (req, res) => {
  const { name, strategy = 'counter' } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Name is required to generate slug',
    });
  }

  // Import the slug generator
  import('../../utils/slugGenerator.js').then(({ generateUniqueSlug }) => {
    generateUniqueSlug(name, { strategy })
      .then((slug) => {
        res.json({
          success: true,
          data: { slug, name },
          message: 'Slug generated successfully',
        });
      })
      .catch((error) => {
        res.status(500).json({
          success: false,
          data: null,
          message: 'Failed to generate slug',
          error: error.message,
        });
      });
  });
});

export const petRouter = router;
